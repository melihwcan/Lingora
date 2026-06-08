"""Execute batch via Supabase MCP execute_sql using mcp_args_N.json."""
import json
import subprocess
import sys
from pathlib import Path

def main():
    batch_num = int(sys.argv[1])
    base = Path(__file__).parent
    args_path = base / f"mcp_args_{batch_num}.json"
    payload = json.loads(args_path.read_text(encoding="utf-8"))
    print(json.dumps({"project_id": payload["project_id"], "query_len": len(payload["query"]), "rows": payload["query"].count("\n  (")}))
    # Write query to stdout for piping
    if "--query-only" in sys.argv:
        sys.stdout.buffer.write(payload["query"].encode("utf-8"))

if __name__ == "__main__":
    main()
