"""Load batch MCP JSON payloads for agent execute_sql calls."""
import json
import sys
from pathlib import Path

BASE = Path(__file__).parent
PROJECT = "wblqxzymhksqyelfnrtw"

FILES = {
    3: ["_mcp_call_3.json"],
    4: ["_mcp_call_4.json"],
    5: ["_mcp_call_5.json"],
}


def load_payload(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    return {"project_id": data.get("project_id", PROJECT), "query": data["query"]}


def main() -> None:
    batch = int(sys.argv[1])
    paths = FILES[batch]
    for rel in paths:
        payload = load_payload(BASE / rel)
        rows = payload["query"].count("\n  (")
        out = BASE / f"_tool{batch}.json"
        out.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        print(f"batch-{batch}: wrote {out.name}, rows={rows}, chars={len(payload['query'])}")


if __name__ == "__main__":
    main()
