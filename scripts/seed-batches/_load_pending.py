"""Load pending MCP payload by index. Usage: python _load_pending.py 0"""
import json
import sys
from pathlib import Path

idx = int(sys.argv[1])
path = Path(__file__).parent / f"_pending{idx}.json"
print(path.read_text(encoding="utf-8"))
