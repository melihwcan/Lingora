import json
import sys
from pathlib import Path

# Writes batch SQL to stdout for agent MCP execute_sql calls.
# Usage: python _emit_query.py batch-01.sql
batch = sys.argv[1]
sql = Path(__file__).parent.joinpath(batch).read_text(encoding="utf-8")
payload = {"project_id": "wblqxzymhksqyelfnrtw", "query": sql}
sys.stdout.write(json.dumps(payload, ensure_ascii=False))
