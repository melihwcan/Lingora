"""Write MCP execute_sql arguments to _next_mcp.json. Usage: python _prepare_call.py mcp_args_3.json"""
import json
import sys
from pathlib import Path

src = Path(sys.argv[1])
if not src.is_absolute():
    src = Path(__file__).parent / src
data = json.loads(src.read_text(encoding="utf-8"))
out = Path(__file__).parent / "_next_mcp.json"
out.write_text(json.dumps({"project_id": data["project_id"], "query": data["query"]}, ensure_ascii=False), encoding="utf-8")
print(f"ready project={data['project_id']} query_len={len(data['query'])}")
