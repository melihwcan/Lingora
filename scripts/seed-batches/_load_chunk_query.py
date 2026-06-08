"""Print chunk SQL query to stdout for MCP execute_sql. Usage: python _load_chunk_query.py batch-02-part2"""
import json
import sys
from pathlib import Path

name = sys.argv[1]
if not name.endswith(".json"):
    name = f"{name}.json"
path = Path(__file__).parent / "mcp_chunks" / name
d = json.loads(path.read_text(encoding="utf-8"))
sys.stdout.buffer.write(d["query"].encode("utf-8"))
