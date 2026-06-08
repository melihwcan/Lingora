import json
import subprocess
import sys
from pathlib import Path

BASE = Path(__file__).parent


def load_query(batch_num: int) -> str:
    data = json.loads((BASE / f"mcp_args_{batch_num}.json").read_text(encoding="utf-8"))
    return data["query"]


def main() -> None:
    start = int(sys.argv[1]) if len(sys.argv) > 1 else 2
    end = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    for i in range(start, end + 1):
        q = load_query(i)
        out = BASE / f"_mcp_query_{i}.txt"
        out.write_text(q, encoding="utf-8")
        print(f"batch-{i:02d}: {len(q)} chars, {q.count(chr(10) + '  (')} rows -> {out.name}")


if __name__ == "__main__":
    main()
