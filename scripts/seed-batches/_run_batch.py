"""Helper: write batch SQL to JSON for MCP execute_sql."""
import json
import sys
from pathlib import Path

batch = sys.argv[1]
sql = Path(__file__).parent.joinpath(batch).read_text(encoding="utf-8")
out = Path(__file__).parent.joinpath(f"_{batch}.json")
out.write_text(json.dumps({"query": sql}), encoding="utf-8")
print(f"Wrote {out.name}, chars={len(sql)}, rows={sql.count(chr(10)+'  (')}")
