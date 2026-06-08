import json
import sys
from pathlib import Path

batch = sys.argv[1]
data = json.loads(Path(__file__).parent.joinpath(f"_{batch}.json").read_text(encoding="utf-8"))
sys.stdout.buffer.write(data["query"].encode("utf-8"))
