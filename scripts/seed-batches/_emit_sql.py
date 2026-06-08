"""Load chunk/batch SQL for MCP execute_sql. Usage: python _emit_sql.py mcp_chunks/batch-03-part1.json"""
import json
import sys
from pathlib import Path

path = Path(__file__).parent / sys.argv[1]
if path.suffix == ".json":
    data = json.loads(path.read_text(encoding="utf-8"))
    query = data["query"]
else:
    query = path.read_text(encoding="utf-8")
sys.stdout.buffer.write(query.encode("utf-8"))
