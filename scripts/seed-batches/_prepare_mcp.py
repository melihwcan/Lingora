import json
from pathlib import Path

BASE = Path(__file__).parent
PROJECT_ID = "wblqxzymhksqyelfnrtw"

for i in range(1, 6):
    sql = (BASE / f"batch-0{i}.sql").read_text(encoding="utf-8")
    out = BASE / f"mcp_args_{i}.json"
    out.write_text(
        json.dumps({"project_id": PROJECT_ID, "query": sql}, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"batch-0{i}.sql -> {out.name} ({len(sql)} chars, {sql.count(chr(10)+'  (')} rows)")
