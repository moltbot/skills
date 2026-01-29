import { execFile } from "node:child_process";
import path from "node:path";

const SCRIPT_PATH = path.resolve("skills/people-memories/scripts/people_memory.py");
const REMEMBER_PATTERN = /remember\s+(?<person>[A-Z][\w\-]+(?:\s+[A-Z][\w\-]+)*)\s+(?<note>.+)/i;

function runRemember(person, note, source = "voice") {
  const args = [SCRIPT_PATH, "remember", "--person", person, "--note", note, "--source", source];
  execFile("python3", args, { stdio: "ignore" }, (err) => {
    if (err) {
      console.error("people-memory remember failed", err);
    }
  });
}

export default async function registerPeopleMemories(api) {
  const handle = async ({ text }) => {
    if (!text) return;
    const match = text.match(REMEMBER_PATTERN);
    if (!match) return;
    const person = match.groups.person.trim();
    const note = match.groups.note.trim();
    runRemember(person, note);
    api?.log?.("People memory noted", person, note);
  };
  api?.on?.("voice-chat:transcript", handle);
  return {
    name: "people-memories",
    unload: () => {
      api?.off?.("voice-chat:transcript", handle);
    },
  };
}
