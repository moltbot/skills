#!/usr/bin/env python3
import argparse
import asyncio
import json
import os
import ssl
import sys
import time
import uuid
from collections import OrderedDict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Awaitable, Callable, Dict, List, Optional, Tuple

import websockets


# -----------------------------
# Protocol constants
# -----------------------------

KIND_PUBLIC = 24242
KIND_ENC = 24243
PROTOCOL_VERSION = 1
DEFAULT_CHANNEL = "agentlab"
DEFAULT_MODE = "plain"
MAX_CONTENT_BYTES = 8 * 1024
MAX_TEXT_BYTES = 2 * 1024
PUBLIC_TYPES = {"HELLO", "LEADER", "KEY_OFFER", "KEY_ACK", "KEY_DM", "NOTICE"}
ENC_TYPES = {"MSG"}


# -----------------------------
# Utilities
# -----------------------------


def utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def json_dumps(obj: Any) -> str:
    return json.dumps(obj, separators=(",", ":"), ensure_ascii=True)


def json_loads(text: str) -> Any:
    return json.loads(text)


def clamp_text(text: str) -> str:
    if len(text.encode("utf-8")) <= MAX_TEXT_BYTES:
        return text
    return text.encode("utf-8")[:MAX_TEXT_BYTES].decode("utf-8", "ignore")


def within_limits(content: str) -> bool:
    return len(content.encode("utf-8")) <= MAX_CONTENT_BYTES


def read_stdin_line() -> Optional[str]:
    line = sys.stdin.readline()
    if not line:
        return None
    return line.rstrip("\n")


class LRUSet:
    def __init__(self, maxsize: int = 10000) -> None:
        self.maxsize = maxsize
        self._data: "OrderedDict[str, None]" = OrderedDict()

    def add(self, key: str) -> None:
        if key in self._data:
            self._data.move_to_end(key)
            return
        self._data[key] = None
        if len(self._data) > self.maxsize:
            self._data.popitem(last=False)

    def __contains__(self, key: str) -> bool:
        return key in self._data


# -----------------------------
# Allowlist
# -----------------------------


class Allowlist:
    def __init__(self, data: Dict[str, Dict[str, List[str]]]) -> None:
        self.data = data

    @classmethod
    def load(cls, path: Path) -> "Allowlist":
        raw = json.loads(path.read_text())
        if not isinstance(raw, dict):
            raise ValueError("Allowlist must be a JSON object")
        return cls(raw)

    def allowed_pubkeys(self, session_id: str, channel: str) -> List[str]:
        sessions = self.data.get(session_id, {})
        pubkeys = sessions.get(channel, [])
        if not isinstance(pubkeys, list):
            return []
        return [str(pk) for pk in pubkeys]

    def is_allowed(self, session_id: str, channel: str, pubkey: str) -> bool:
        return pubkey in set(self.allowed_pubkeys(session_id, channel))


# -----------------------------
# Nostr crypto
# -----------------------------


class NostrCryptoError(RuntimeError):
    pass


@dataclass
class NostrKeys:
    pubkey: str
    privkey: str


def _load_coincurve_private():
    try:
        from coincurve import PrivateKey  # type: ignore
        return PrivateKey
    except Exception as exc:
        raise NostrCryptoError(
            "Missing dependency 'coincurve'. Install with: pip install coincurve"
        ) from exc


def _privkey_to_pubkey_hex(privkey_hex: str) -> str:
    PrivateKey = _load_coincurve_private()
    priv = PrivateKey(bytes.fromhex(privkey_hex))
    pub = priv.public_key.format(compressed=False)
    return pub[1:33].hex()


def _sign_schnorr(msg_hash: bytes, privkey_hex: str) -> str:
    PrivateKey = _load_coincurve_private()
    priv = PrivateKey(bytes.fromhex(privkey_hex))
    if hasattr(priv, "sign_schnorr"):
        sig = priv.sign_schnorr(msg_hash, b"")
        return sig.hex()
    raise NostrCryptoError("Your coincurve version lacks Schnorr signing support")


def load_or_create_keys(agent_name: str) -> NostrKeys:
    key_dir = Path.home() / ".agentbus" / "keys"
    key_dir.mkdir(parents=True, exist_ok=True)
    key_path = key_dir / f"{agent_name}.json"
    if key_path.exists():
        try:
            parsed = json.loads(key_path.read_text())
            privkey = parsed.get("privkey")
            pubkey = parsed.get("pubkey")
            if privkey and pubkey:
                return NostrKeys(pubkey=pubkey, privkey=privkey)
        except Exception:
            pass
    privkey_bytes = os.urandom(32)
    privkey_hex = privkey_bytes.hex()
    pubkey_hex = _privkey_to_pubkey_hex(privkey_hex)
    key_path.write_text(json.dumps({"pubkey": pubkey_hex, "privkey": privkey_hex}))
    return NostrKeys(pubkey=pubkey_hex, privkey=privkey_hex)


def generate_ephemeral_keys() -> NostrKeys:
    privkey_bytes = os.urandom(32)
    privkey_hex = privkey_bytes.hex()
    pubkey_hex = _privkey_to_pubkey_hex(privkey_hex)
    return NostrKeys(pubkey=pubkey_hex, privkey=privkey_hex)


def compute_event_id(
    pubkey: str, created_at: int, kind: int, tags: List[List[str]], content: str
) -> str:
    body = [0, pubkey, created_at, kind, tags, content]
    payload = json_dumps(body).encode("utf-8")
    return __import__("hashlib").sha256(payload).hexdigest()


def build_event(
    pubkey: str,
    privkey: str,
    created_at: int,
    kind: int,
    tags: List[List[str]],
    content: str,
) -> dict:
    event_id = compute_event_id(pubkey, created_at, kind, tags, content)
    sig = _sign_schnorr(bytes.fromhex(event_id), privkey)
    return {
        "id": event_id,
        "pubkey": pubkey,
        "created_at": created_at,
        "kind": kind,
        "tags": tags,
        "content": content,
        "sig": sig,
    }


def verify_event(event: dict) -> bool:
    try:
        event_id = event.get("id")
        pubkey = event.get("pubkey")
        created_at = event.get("created_at")
        kind = event.get("kind")
        tags = event.get("tags")
        content = event.get("content")
        sig = event.get("sig")
        if not isinstance(event_id, str):
            return False
        if not isinstance(pubkey, str):
            return False
        if not isinstance(created_at, int):
            return False
        if not isinstance(kind, int):
            return False
        if not isinstance(tags, list):
            return False
        if not isinstance(content, str):
            return False
        if not isinstance(sig, str):
            return False
        expected_id = compute_event_id(pubkey, int(created_at), int(kind), tags, content)
        if expected_id != event_id:
            return False
        pubkey_bytes = bytes.fromhex(pubkey)
        sig_bytes = bytes.fromhex(sig)
        msg = bytes.fromhex(event_id)
        from coincurve import PublicKeyXOnly  # type: ignore

        pk = PublicKeyXOnly(pubkey_bytes, False)
        return pk.verify(sig_bytes, msg)
    except Exception:
        return False


# -----------------------------
# AEAD crypto for session key
# -----------------------------


def _load_crypto():
    try:
        from cryptography.hazmat.primitives import hashes  # noqa: F401
        from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305  # noqa: F401
        from cryptography.hazmat.primitives.kdf.hkdf import HKDF  # noqa: F401
    except Exception as exc:
        raise NostrCryptoError(
            "Missing dependency 'cryptography'. Install with: pip install cryptography"
        ) from exc


def b64encode(data: bytes) -> str:
    return __import__("base64").b64encode(data).decode("ascii")


def b64decode(data: str) -> bytes:
    return __import__("base64").b64decode(data.encode("ascii"))


def ecdh_shared_secret(privkey_hex: str, pubkey_hex: str) -> bytes:
    try:
        from coincurve import PrivateKey, PublicKey  # type: ignore
    except Exception as exc:
        raise NostrCryptoError(
            "Missing dependency 'coincurve'. Install with: pip install coincurve"
        ) from exc
    pubkey_bytes = bytes.fromhex(pubkey_hex)
    compressed = b"\x02" + pubkey_bytes
    pub = PublicKey(compressed)
    priv = PrivateKey(bytes.fromhex(privkey_hex))
    return priv.ecdh(pub.format(compressed=True))


def derive_key(shared_secret: bytes, salt: bytes, info: bytes) -> bytes:
    _load_crypto()
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.hkdf import HKDF

    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        info=info,
    )
    return hkdf.derive(shared_secret)


def encrypt_aead(key: bytes, plaintext: bytes) -> Tuple[str, str, str]:
    _load_crypto()
    try:
        from cryptography.hazmat.primitives.ciphers.aead import XChaCha20Poly1305

        aead = XChaCha20Poly1305(key)
        nonce = os.urandom(24)
        enc = "xchacha20poly1305"
    except Exception:
        from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305

        aead = ChaCha20Poly1305(key)
        nonce = os.urandom(12)
        enc = "chacha20poly1305"
    ct = aead.encrypt(nonce, plaintext, None)
    return enc, b64encode(nonce), b64encode(ct)


def decrypt_aead(key: bytes, enc: str, nonce_b64: str, ct_b64: str) -> Optional[bytes]:
    _load_crypto()
    if enc == "xchacha20poly1305":
        try:
            from cryptography.hazmat.primitives.ciphers.aead import XChaCha20Poly1305

            aead = XChaCha20Poly1305(key)
        except Exception:
            return None
    elif enc == "chacha20poly1305":
        from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305

        aead = ChaCha20Poly1305(key)
    else:
        return None
    try:
        nonce = b64decode(nonce_b64)
        ct = b64decode(ct_b64)
    except Exception:
        return None
    try:
        return aead.decrypt(nonce, ct, None)
    except Exception:
        return None


# -----------------------------
# Relay client
# -----------------------------


EventHandler = Callable[[dict], Awaitable[None]]


def build_ssl_context() -> Optional[ssl.SSLContext]:
    try:
        import certifi
    except Exception:
        return None
    return ssl.create_default_context(cafile=certifi.where())


class RelayClient:
    def __init__(
        self,
        url: str,
        sub_id: str,
        filters: List[Dict[str, Any]],
        on_event: EventHandler,
        log: Callable[[str, str], None],
    ) -> None:
        self.url = url
        self.sub_id = sub_id
        self.filters = filters
        self.on_event = on_event
        self.log = log
        self.ws: Optional[websockets.WebSocketClientProtocol] = None
        self._send_lock = asyncio.Lock()
        self._stop = False

    async def connect(self) -> None:
        backoff = 1.0
        ssl_context = build_ssl_context()
        while not self._stop:
            try:
                async with websockets.connect(
                    self.url, ping_interval=30, ssl=ssl_context
                ) as ws:
                    self.ws = ws
                    await self._send(["REQ", self.sub_id, *self.filters])
                    self.log(f"connected {self.url}", "info")
                    backoff = 1.0
                    async for message in ws:
                        await self._handle_message(message)
            except Exception as exc:
                self.log(f"relay error {self.url}: {exc}", "warn")
            finally:
                self.ws = None
            await asyncio.sleep(backoff)
            backoff = min(backoff * 2, 30.0)

    async def _send(self, payload: Any) -> None:
        if not self.ws:
            return
        async with self._send_lock:
            await self.ws.send(json.dumps(payload))

    async def send_event(self, event: dict) -> None:
        if not self.ws:
            return
        await self._send(["EVENT", event])

    async def _handle_message(self, message: str) -> None:
        try:
            data = json.loads(message)
        except Exception:
            return
        if not isinstance(data, list) or not data:
            return
        msg_type = data[0]
        if msg_type == "EVENT" and len(data) >= 3:
            event = data[2]
            if isinstance(event, dict):
                await self.on_event(event)
        elif msg_type == "NOTICE" and len(data) >= 2:
            notice = data[1]
            self.log(f"notice {self.url}: {notice}", "info")


class RelayManager:
    def __init__(
        self,
        relays: List[str],
        filters: List[Dict[str, Any]],
        on_event: EventHandler,
        log: Callable[[str, str], None],
    ) -> None:
        self.relays = relays
        self.filters = filters
        self.on_event = on_event
        self.log = log
        self.clients: List[RelayClient] = []
        self._tasks: List[asyncio.Task] = []
        self._seen = LRUSet(maxsize=10000)

    async def start(self) -> None:
        for idx, url in enumerate(self.relays):
            sub_id = f"sub-{idx}-{int(time.time())}"
            client = RelayClient(url, sub_id, self.filters, self._handle_event, self.log)
            self.clients.append(client)
            self._tasks.append(asyncio.create_task(client.connect()))

    async def _handle_event(self, event: dict) -> None:
        event_id = event.get("id")
        if not isinstance(event_id, str):
            return
        if event_id in self._seen:
            return
        self._seen.add(event_id)
        await self.on_event(event)

    async def broadcast(self, event: dict) -> None:
        for client in self.clients:
            await client.send_event(event)


# -----------------------------
# CLI
# -----------------------------


def make_logger(level: str, log_file: Optional[Path], log_json: bool):
    order = {"debug": 10, "info": 20, "warn": 30}
    threshold = order.get(level, 20)
    log_handle = None
    if log_file is not None:
        try:
            log_handle = log_file.open("a", encoding="utf-8")
        except Exception:
            log_handle = None

    def log(msg: str, lvl: str = "info") -> None:
        if order.get(lvl, 20) >= threshold:
            print(msg, file=sys.stderr, flush=True)
            if log_handle is not None:
                if log_json:
                    entry = {"ts": utc_iso(), "level": lvl, "msg": msg}
                    log_handle.write(json_dumps(entry) + "\n")
                else:
                    log_handle.write(msg + "\n")
                log_handle.flush()

    return log


def load_relays(cli_relays: List[str]) -> List[str]:
    if cli_relays:
        return cli_relays
    default_path = Path(__file__).resolve().parent / "relays.default.json"
    if default_path.exists():
        try:
            data = json.loads(default_path.read_text())
            if isinstance(data, list):
                return [str(item) for item in data if isinstance(item, str)]
        except Exception:
            return []
    return []


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(prog="agentbus", description="AgentBus CLI")
    parser.add_argument("--agent", required=True, help="Agent name")
    parser.add_argument(
        "--ephemeral-keys",
        action="store_true",
        help="Generate a fresh in-memory keypair for this run (no disk storage).",
    )
    parser.add_argument("--chan", default=DEFAULT_CHANNEL, help="Channel name")
    parser.add_argument("--sid", default=None, help="Session id")
    parser.add_argument(
        "--sid-file",
        type=Path,
        default=None,
        help="Read/write session id from a file (leader writes, followers read).",
    )
    parser.add_argument(
        "--print-pubkey",
        action="store_true",
        help="Print pubkey for the agent and exit.",
    )
    parser.add_argument(
        "--write-allowlist",
        type=Path,
        default=None,
        help="Write allowlist JSON for a comma-separated list of agent names.",
    )
    parser.add_argument(
        "--allowlist-agents",
        type=str,
        default=None,
        help="Comma-separated agent names used with --write-allowlist.",
    )
    parser.add_argument("--relay", action="append", default=[], help="Relay URL")
    parser.add_argument(
        "--mode", choices=["plain", "enc"], default=DEFAULT_MODE, help="Mode"
    )
    parser.add_argument("--leader", action="store_true", help="Leader mode")
    parser.add_argument("--allowlist", type=Path, help="Allowlist JSON path")
    parser.add_argument(
        "--require-allowlist",
        action="store_true",
        help="Drop events not in allowlist",
    )
    parser.add_argument(
        "--log-level",
        choices=["debug", "info", "warn"],
        default="info",
        help="Log verbosity level.",
    )
    parser.add_argument(
        "--log-file",
        type=Path,
        default=None,
        help="Write logs to a file (append).",
    )
    parser.add_argument(
        "--log-json",
        action="store_true",
        help="Write logs as JSON lines when --log-file is set.",
    )
    parser.add_argument(
        "--filter-tags",
        action="store_true",
        help="Include #c/#sid in relay subscription filters (some relays reject unindexed tags).",
    )
    return parser.parse_args()


def validate_public_payload(data: Dict[str, Any], sid: str, chan: str) -> bool:
    if data.get("v") != PROTOCOL_VERSION:
        return False
    msg_type = data.get("type")
    if msg_type not in PUBLIC_TYPES:
        return False
    if data.get("sid") != sid or data.get("chan") != chan:
        return False
    if msg_type == "KEY_DM":
        if not data.get("from"):
            return False
        if not (data.get("enc") and data.get("nonce") and data.get("ct")):
            return False
        return True
    if not data.get("agent"):
        return False
    return True


def validate_msg_payload(data: Dict[str, Any], sid: str, chan: str) -> bool:
    if data.get("v") != PROTOCOL_VERSION:
        return False
    if data.get("type") not in ENC_TYPES:
        return False
    if data.get("sid") != sid or data.get("chan") != chan:
        return False
    if not data.get("from"):
        return False
    if not data.get("msg_id"):
        return False
    body = data.get("body")
    if not isinstance(body, dict):
        return False
    if "text" not in body or not isinstance(body.get("text"), str):
        return False
    if len(body["text"].encode("utf-8")) > MAX_TEXT_BYTES:
        return False
    return True


def main() -> None:
    args = parse_args()
    log = make_logger(args.log_level, args.log_file, args.log_json)

    session_id = None
    if args.sid:
        session_id = args.sid
    elif args.sid_file:
        if args.leader:
            session_id = uuid.uuid4().hex
            try:
                args.sid_file.write_text(session_id)
            except Exception as exc:
                log(f"Failed to write sid file: {exc}", "warn")
                return
        else:
            try:
                session_id = args.sid_file.read_text().strip()
            except Exception as exc:
                log(f"Failed to read sid file: {exc}", "warn")
                return
            if not session_id:
                log("sid file is empty", "warn")
                return
    else:
        session_id = uuid.uuid4().hex

    try:
        if args.ephemeral_keys:
            keys = generate_ephemeral_keys()
        else:
            keys = load_or_create_keys(args.agent)
    except NostrCryptoError as exc:
        log(str(exc), "warn")
        return

    if args.print_pubkey:
        print(keys.pubkey)
        return

    if args.write_allowlist:
        if not args.allowlist_agents:
            log("--write-allowlist requires --allowlist-agents", "warn")
            return
        agent_names = [name.strip() for name in args.allowlist_agents.split(",") if name.strip()]
        if not agent_names:
            log("No agent names provided for allowlist", "warn")
            return
        allowlist_data = {session_id or "default": {args.chan: []}}
        for name in agent_names:
            agent_keys = load_or_create_keys(name)
            allowlist_data[session_id or "default"][args.chan].append(agent_keys.pubkey)
        try:
            args.write_allowlist.write_text(json.dumps(allowlist_data, indent=2))
        except Exception as exc:
            log(f"Failed to write allowlist: {exc}", "warn")
            return
        print(str(args.write_allowlist))
        return

    relays = load_relays(args.relay)
    if not relays:
        log("No relays configured. Pass --relay or edit relays.default.json", "warn")
        return

    allowlist = None
    if args.allowlist:
        try:
            allowlist = Allowlist.load(args.allowlist)
        except Exception as exc:
            log(f"Allowlist error: {exc}", "warn")
            return
    if args.require_allowlist and allowlist is None:
        log("--require-allowlist needs --allowlist", "warn")
        return
    enforce_allowlist = allowlist is not None
    if args.mode == "enc" and allowlist is None:
        log("Encrypted mode requires --allowlist to identify participants.", "warn")
        return

    tags = [["c", args.chan], ["sid", session_id], ["v", str(PROTOCOL_VERSION)]]
    since = int(time.time()) - 600
    base_filter: Dict[str, Any] = {"kinds": [KIND_PUBLIC, KIND_ENC], "since": since}
    if args.filter_tags:
        base_filter["#c"] = [args.chan]
        base_filter["#sid"] = [session_id]
    filters = [base_filter]

    def has_tag(tags_list: List[List[str]], key: str, value: str) -> bool:
        for tag in tags_list:
            if len(tag) >= 2 and tag[0] == key and tag[1] == value:
                return True
        return False

    session_key = None
    leader_pubkey = None
    allowed_pubkeys = []
    if allowlist is not None:
        allowed_pubkeys = allowlist.allowed_pubkeys(session_id, args.chan)

    def ensure_session_key() -> bytes:
        nonlocal session_key
        if session_key is None:
            session_key = os.urandom(32)
        return session_key

    async def send_key_dm(target_pubkey: str) -> None:
        if session_key is None:
            return
        shared = ecdh_shared_secret(keys.privkey, target_pubkey)
        derived = derive_key(
            shared, salt=session_id.encode("utf-8"), info=b"agentbus-key-dm-v1"
        )
        enc, nonce_b64, ct_b64 = encrypt_aead(derived, session_key)
        payload = {
            "v": PROTOCOL_VERSION,
            "type": "KEY_DM",
            "sid": session_id,
            "chan": args.chan,
            "from": args.agent,
            "enc": enc,
            "nonce": nonce_b64,
            "ct": ct_b64,
        }
        dm_tags = tags + [["p", target_pubkey]]
        created_at = int(time.time())
        event = build_event(
            keys.pubkey, keys.privkey, created_at, KIND_PUBLIC, dm_tags, json_dumps(payload)
        )
        await manager.broadcast(event)

    def debug_drop(reason: str) -> None:
        log(f"drop: {reason}", "debug")

    async def on_event(event: dict) -> None:
        nonlocal session_key, leader_pubkey
        if not isinstance(event, dict):
            return
        if not verify_event(event):
            debug_drop("invalid signature")
            return
        pubkey = event.get("pubkey")
        if not isinstance(pubkey, str):
            return
        if pubkey == keys.pubkey:
            return
        if enforce_allowlist and allowlist is not None:
            if not allowlist.is_allowed(session_id, args.chan, pubkey):
                debug_drop("allowlist")
                return
        kind = event.get("kind")
        content = event.get("content")
        tags_list = event.get("tags")
        if not isinstance(kind, int) or not isinstance(content, str):
            return
        if not isinstance(tags_list, list):
            debug_drop("missing tags")
            return
        if not (has_tag(tags_list, "c", args.chan) and has_tag(tags_list, "sid", session_id)):
            debug_drop("tag mismatch")
            return
        if not within_limits(content):
            return
        if kind == KIND_PUBLIC:
            try:
                payload = json_loads(content)
            except Exception:
                debug_drop("public json parse")
                return
            if not isinstance(payload, dict):
                return
            if not validate_public_payload(payload, session_id, args.chan):
                debug_drop("public schema")
                return
            msg_type = payload.get("type")
            if msg_type == "LEADER":
                if leader_pubkey is None:
                    leader_pubkey = pubkey
            if msg_type == "KEY_OFFER":
                if leader_pubkey is None:
                    leader_pubkey = pubkey
            if msg_type == "HELLO" and args.leader and args.mode == "enc":
                if pubkey in allowed_pubkeys and pubkey != keys.pubkey:
                    await send_key_dm(pubkey)
            if msg_type == "NOTICE":
                log(f"notice {payload.get('agent')}: {payload.get('msg', '')}", "info")
            if msg_type == "KEY_DM" and args.mode == "enc":
                if leader_pubkey is not None and pubkey != leader_pubkey:
                    debug_drop("key_dm leader mismatch")
                    return
                tags_list = event.get("tags", [])
                if not isinstance(tags_list, list):
                    return
                if not has_tag(tags_list, "p", keys.pubkey):
                    debug_drop("key_dm not addressed to us")
                    return
                enc = payload.get("enc")
                nonce = payload.get("nonce")
                ct = payload.get("ct")
                if not (isinstance(enc, str) and isinstance(nonce, str) and isinstance(ct, str)):
                    return
                shared = ecdh_shared_secret(keys.privkey, pubkey)
                derived = derive_key(
                    shared, salt=session_id.encode("utf-8"), info=b"agentbus-key-dm-v1"
                )
                decrypted = decrypt_aead(derived, enc, nonce, ct)
                if decrypted is None:
                    debug_drop("key_dm decrypt")
                    return
                session_key = decrypted
                ack_payload = {
                    "v": PROTOCOL_VERSION,
                    "type": "KEY_ACK",
                    "sid": session_id,
                    "chan": args.chan,
                    "agent": args.agent,
                    "mode": args.mode,
                    "ts": utc_iso(),
                }
                await publish(KIND_PUBLIC, json_dumps(ack_payload))
        elif kind == KIND_ENC:
            if args.mode == "enc":
                if session_key is None:
                    debug_drop("enc missing session key")
                    return
                try:
                    wrapper = json_loads(content)
                except Exception:
                    debug_drop("enc wrapper json parse")
                    return
                if not isinstance(wrapper, dict):
                    return
                if wrapper.get("v") != PROTOCOL_VERSION or wrapper.get("sid") != session_id:
                    debug_drop("enc wrapper schema")
                    return
                enc = wrapper.get("enc")
                nonce = wrapper.get("nonce")
                ct = wrapper.get("ct")
                if not (isinstance(enc, str) and isinstance(nonce, str) and isinstance(ct, str)):
                    return
                plaintext = decrypt_aead(session_key, enc, nonce, ct)
                if plaintext is None:
                    debug_drop("enc decrypt")
                    return
                try:
                    payload = json_loads(plaintext.decode("utf-8"))
                except Exception:
                    debug_drop("enc payload json parse")
                    return
            else:
                try:
                    payload = json_loads(content)
                except Exception:
                    debug_drop("plain json parse")
                    return
            if not isinstance(payload, dict):
                return
            if not validate_msg_payload(payload, session_id, args.chan):
                debug_drop("msg schema")
                return
            sender = payload.get("from")
            body = payload.get("body", {})
            text = body.get("text", "")
            print(f"[{sender}] {text}", flush=True)

    manager = RelayManager(relays, filters, on_event, log)

    async def publish(kind: int, content: str) -> None:
        if not within_limits(content):
            log("content too large; dropping", "warn")
            return
        created_at = int(time.time())
        event = build_event(keys.pubkey, keys.privkey, created_at, kind, tags, content)
        await manager.broadcast(event)

    async def send_text(text: str) -> None:
        msg = {
            "v": PROTOCOL_VERSION,
            "type": "MSG",
            "sid": session_id,
            "chan": args.chan,
            "from": args.agent,
            "msg_id": uuid.uuid4().hex,
            "reply_to": None,
            "body": {"text": clamp_text(text)},
        }
        if args.mode == "enc":
            if session_key is None:
                log("No session key yet; cannot send encrypted message.", "warn")
                return
            enc, nonce_b64, ct_b64 = encrypt_aead(
                session_key, json_dumps(msg).encode("utf-8")
            )
            wrapper = {
                "v": PROTOCOL_VERSION,
                "enc": enc,
                "sid": session_id,
                "nonce": nonce_b64,
                "ct": ct_b64,
            }
            await publish(KIND_ENC, json_dumps(wrapper))
        else:
            await publish(KIND_ENC, json_dumps(msg))

    async def main_async() -> None:
        await manager.start()
        log(f"agent={args.agent} pubkey={keys.pubkey}", "info")
        log(f"channel={args.chan} sid={session_id}", "info")
        log(f"relays={', '.join(relays)}", "info")
        await publish(KIND_PUBLIC, json_dumps({
            "v": PROTOCOL_VERSION,
            "type": "HELLO",
            "sid": session_id,
            "chan": args.chan,
            "agent": args.agent,
            "caps": ["chat"],
            "mode": args.mode,
            "ts": utc_iso(),
        }))
        if args.leader:
            await publish(KIND_PUBLIC, json_dumps({
                "v": PROTOCOL_VERSION,
                "type": "LEADER",
                "sid": session_id,
                "chan": args.chan,
                "agent": args.agent,
                "caps": ["chat"],
                "mode": args.mode,
                "ts": utc_iso(),
            }))
            if args.mode == "enc":
                ensure_session_key()
                await publish(KIND_PUBLIC, json_dumps({
                    "v": PROTOCOL_VERSION,
                    "type": "KEY_OFFER",
                    "sid": session_id,
                    "chan": args.chan,
                    "agent": args.agent,
                    "caps": ["chat"],
                    "mode": args.mode,
                    "ts": utc_iso(),
                }))
                for pubkey in allowed_pubkeys:
                    if pubkey != keys.pubkey:
                        await send_key_dm(pubkey)

        while True:
            line = await asyncio.get_running_loop().run_in_executor(None, read_stdin_line)
            if line is None:
                break
            line = line.strip()
            if not line:
                continue
            await send_text(line)

    try:
        asyncio.run(main_async())
    except KeyboardInterrupt:
        return


if __name__ == "__main__":
    main()
