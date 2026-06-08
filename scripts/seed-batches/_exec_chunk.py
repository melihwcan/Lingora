"""Write single-chunk MCP args. Usage: python _exec_chunk.py mcp_chunks/batch-04-part1.json"""
import json
import sys
from pathlib import Path

src = Path(sys.argv[1])
if not src.is_absolute():
    src = Path(__file__).parent / src
data = json.loads(src.read_text(encoding="utf-8"))
out = Path(__file__).parent / "_current_mcp.json"
out.write_text(json.dumps({"project_id": data["project_id"], "query": data["query"]}, ensure_ascii=False), encoding="utf-8")
print(f"ready {src.name} len={len(data['query'])}")
