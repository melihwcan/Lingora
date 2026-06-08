import json
import sys
from pathlib import Path

BASE = Path(__file__).parent
PROJECT_ID = "wblqxzymhksqyelfnrtw"


def load_batch(num: int) -> dict:
    return json.loads((BASE / f"mcp_args_{num}.json").read_text(encoding="utf-8"))


def main() -> None:
    batch_num = int(sys.argv[1])
    payload = load_batch(batch_num)
    # Emit compact JSON for agent MCP execute_sql consumption
    sys.stdout.write(json.dumps(payload, ensure_ascii=False))


if __name__ == "__main__":
    main()
