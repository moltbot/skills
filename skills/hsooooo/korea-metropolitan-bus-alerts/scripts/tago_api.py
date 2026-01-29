#!/usr/bin/env python3
"""TAGO API helpers (no secrets)

This module provides small, deterministic helpers to call TAGO OpenAPI endpoints.

Security:
- Never hardcode or print the raw service key.
- Read key from environment variable only.

Env:
- TAGO_SERVICE_KEY (required)

Refs:
- Stop info dataset: https://www.data.go.kr/data/15098534/openapi.do
- Arrival dataset: https://www.data.go.kr/data/15098530/openapi.do
"""

from __future__ import annotations

import os
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple


# data.go.kr endpoints (use HTTPS)
STOP_BASE = "https://apis.data.go.kr/1613000/BusSttnInfoInqireService"
ARRIVAL_BASE = "https://apis.data.go.kr/1613000/ArvlInfoInqireService"


class TagoError(RuntimeError):
    pass


def _get_key() -> str:
    key = os.getenv("TAGO_SERVICE_KEY") or os.getenv("DATA_GO_KR_SERVICE_KEY")
    if not key:
        raise TagoError(
            "Missing TAGO service key. Set TAGO_SERVICE_KEY (or DATA_GO_KR_SERVICE_KEY) in your environment."
        )
    return key


def _http_get_json(url: str, timeout_sec: int = 10) -> Dict[str, Any]:
    req = urllib.request.Request(url, headers={"User-Agent": "korea-metropolitan-bus-alerts/0.1"})
    with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
        data = resp.read()
    # TAGO JSON responses are typically UTF-8
    text = data.decode("utf-8", errors="replace")

    import json

    try:
        return json.loads(text)
    except Exception as e:
        raise TagoError(f"Failed to parse JSON response: {e}")


def _build_url(base: str, path: str, params: Dict[str, Any]) -> str:
    """Build request URL.

    data.go.kr service keys are tricky:
    - They often provide an *already URL-encoded* key (contains '%2B', '%2F', ...).
    - If we urlencode() that again, the '%' becomes '%25' and the server may return 403.

    Strategy:
    - If serviceKey contains '%', treat it as already-encoded and do NOT encode it again.
    - Otherwise, normal percent-encode.
    """

    q = {k: v for k, v in params.items() if v is not None}

    parts: List[str] = []
    for k, v in q.items():
        if k == "serviceKey":
            sv = str(v)
            if "%" in sv:
                parts.append(f"serviceKey={sv}")
            else:
                parts.append(f"serviceKey={urllib.parse.quote(sv, safe='')}")
            continue

        if isinstance(v, (list, tuple)):
            for vv in v:
                parts.append(f"{urllib.parse.quote(str(k), safe='')}={urllib.parse.quote(str(vv), safe='')}")
        else:
            parts.append(f"{urllib.parse.quote(str(k), safe='')}={urllib.parse.quote(str(v), safe='')}")

    return f"{base}{path}?{'&'.join(parts)}"


@dataclass
class StopCandidate:
    node_id: str
    city_code: str
    name: str
    gps_lat: Optional[float] = None
    gps_long: Optional[float] = None


@dataclass
class CityCode:
    city_code: str
    city_name: str


def city_codes(*, max_results: int = 500) -> List[CityCode]:
    """List available city codes via getCtyCodeList."""
    key = _get_key()
    url = _build_url(
        STOP_BASE,
        "/getCtyCodeList",
        {
            "serviceKey": key,
            "_type": "json",
            "pageNo": 1,
            "numOfRows": max_results,
        },
    )
    payload = _http_get_json(url)

    items_container = payload.get("response", {}).get("body", {}).get("items", None)
    if not items_container or not isinstance(items_container, dict):
        items = []
    else:
        items = items_container.get("item", [])
        if isinstance(items, dict):
            items = [items]

    out: List[CityCode] = []
    for it in items:
        code = str(it.get("citycode") or "").strip()
        name = str(it.get("cityname") or it.get("citynm") or "").strip()
        if not code or not name:
            continue
        out.append(CityCode(city_code=code, city_name=name))
        if len(out) >= max_results:
            break

    return out


def stops_nearby(gps_lat: float, gps_long: float, *, num_rows: int = 30) -> List[StopCandidate]:
    """Return nearby stop candidates (within ~500m) by GPS.

    NOTE: This uses getCrdntPrxmtSttnList.
    If this returns zero candidates (some regions/keys), fall back to name search.
    """
    key = _get_key()
    url = _build_url(
        STOP_BASE,
        "/getCrdntPrxmtSttnList",
        {
            "serviceKey": key,
            "_type": "json",
            "pageNo": 1,
            "numOfRows": num_rows,
            "gpsLati": gps_lat,
            "gpsLong": gps_long,
        },
    )
    payload = _http_get_json(url)

    # TAGO sometimes returns body.items as an empty string when no results.
    items_container = payload.get("response", {}).get("body", {}).get("items", None)
    if not items_container or not isinstance(items_container, dict):
        items = []
    else:
        items = items_container.get("item", [])
        if isinstance(items, dict):
            items = [items]

    out: List[StopCandidate] = []
    for it in items:
        node_id = str(it.get("nodeid") or "").strip()
        city_code = str(it.get("citycode") or "").strip()
        name = str(it.get("nodenm") or "").strip()
        if not node_id or not city_code or not name:
            continue
        out.append(
            StopCandidate(
                node_id=node_id,
                city_code=city_code,
                name=name,
                gps_lat=_safe_float(it.get("gpslati")),
                gps_long=_safe_float(it.get("gpslong")),
            )
        )
    return out


def stops_by_name(
    city_code: str,
    keyword: str = "",
    *,
    max_results: int = 40,
    page_size: int = 100,
    max_pages: int = 3,
) -> List[StopCandidate]:
    """Search stops by name within a city.

    Uses getSttnNoList. In practice this endpoint often requires `cityCode` and may
    optionally support a name filter parameter depending on backend.

    Strategy:
    - Request pages from getSttnNoList
    - Filter locally by `keyword` (substring match)

    This is a pragmatic MVP approach; it may be slower for big cities.
    """
    key = _get_key()
    keyword = (keyword or "").strip()

    out: List[StopCandidate] = []
    seen = set()

    for page_no in range(1, max_pages + 1):
        url = _build_url(
            STOP_BASE,
            "/getSttnNoList",
            {
                "serviceKey": key,
                "_type": "json",
                "pageNo": page_no,
                "numOfRows": page_size,
                "cityCode": city_code,
                # Some deployments accept a name filter; keep it best-effort.
                "nodeNm": keyword if keyword else None,
            },
        )
        payload = _http_get_json(url)

        items_container = payload.get("response", {}).get("body", {}).get("items", None)
        if not items_container or not isinstance(items_container, dict):
            items = []
        else:
            items = items_container.get("item", [])
            if isinstance(items, dict):
                items = [items]

        if not items:
            break

        for it in items:
            node_id = str(it.get("nodeid") or "").strip()
            name = str(it.get("nodenm") or "").strip()
            cc = str(it.get("citycode") or city_code).strip()
            if not node_id or not name:
                continue
            if keyword and keyword not in name:
                continue
            k = (cc, node_id)
            if k in seen:
                continue
            seen.add(k)
            out.append(
                StopCandidate(
                    node_id=node_id,
                    city_code=cc,
                    name=name,
                    gps_lat=_safe_float(it.get("gpslati")),
                    gps_long=_safe_float(it.get("gpslong")),
                )
            )
            if len(out) >= max_results:
                return out

    return out


def _safe_float(x: Any) -> Optional[float]:
    try:
        if x is None:
            return None
        return float(x)
    except Exception:
        return None


@dataclass
class Arrival:
    route_no: str
    arr_time_sec: int
    arr_prev_station_cnt: Optional[int]
    route_id: Optional[str] = None
    vehicle_type: Optional[str] = None


def arrivals_for_stop(city_code: str, node_id: str, *, num_rows: int = 200) -> List[Arrival]:
    """Return arrival list for a stop (dataset 15098530)."""
    key = _get_key()
    url = _build_url(
        ARRIVAL_BASE,
        "/getSttnAcctoArvlPrearngeInfoList",
        {
            "serviceKey": key,
            "_type": "json",
            "pageNo": 1,
            "numOfRows": num_rows,
            "cityCode": city_code,
            "nodeId": node_id,
        },
    )
    payload = _http_get_json(url)

    items_container = payload.get("response", {}).get("body", {}).get("items", None)
    if not items_container or not isinstance(items_container, dict):
        items = []
    else:
        items = items_container.get("item", [])
        if isinstance(items, dict):
            items = [items]

    out: List[Arrival] = []
    for it in items:
        route_no = str(it.get("routeno") or "").strip()
        arr_time = it.get("arrtime")
        prev_cnt = it.get("arrprevstationcnt")
        if not route_no or arr_time is None:
            continue
        try:
            arr_time_sec = int(arr_time)
        except Exception:
            continue
        try:
            prev_i = int(prev_cnt) if prev_cnt is not None else None
        except Exception:
            prev_i = None
        out.append(
            Arrival(
                route_no=route_no,
                arr_time_sec=arr_time_sec,
                arr_prev_station_cnt=prev_i,
                route_id=(str(it.get("routeid")).strip() if it.get("routeid") is not None else None),
                vehicle_type=(str(it.get("vehicletp")).strip() if it.get("vehicletp") is not None else None),
            )
        )

    # sort by time
    out.sort(key=lambda a: a.arr_time_sec)
    return out


def format_arrival(arr: Arrival) -> str:
    minutes = max(0, int(round(arr.arr_time_sec / 60)))
    if arr.arr_prev_station_cnt is not None:
        return f"{minutes}분 ({arr.arr_prev_station_cnt}정거장 전)"
    return f"{minutes}분"
