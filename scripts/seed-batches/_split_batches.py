import json
import re
from pathlib import Path

BASE = Path(__file__).parent
PROJECT_ID = "wblqxzymhksqyelfnrtw"


def split_insert(sql: str, parts: int = 2) -> list[str]:
    header, _, values_block = sql.partition("VALUES\n")
    rows = re.findall(r"  \([^;\n]+(?:''[^;\n]*)*\)(?:,|\s*$)", values_block)
    rows = [r.rstrip(",") for r in rows]
    chunk_size = (len(rows) + parts - 1) // parts
    chunks: list[str] = []
    for i in range(0, len(rows), chunk_size):
        chunk_rows = rows[i : i + chunk_size]
        chunks.append(f"{header}VALUES\n" + ",\n".join(chunk_rows) + ";")
    return chunks


def main() -> None:
    manifest = []
    for batch in sorted(BASE.glob("batch-0[1-5].sql")):
        sql = batch.read_text(encoding="utf-8")
        chunks = split_insert(sql, 2)
        for idx, chunk in enumerate(chunks, start=1):
            name = f"{batch.stem}-part{idx}.json"
            payload = {
                "project_id": PROJECT_ID,
                "query": chunk,
                "rows": len(re.findall(r"  \(", chunk)),
            }
            path = BASE / "mcp_chunks" / name
            path.parent.mkdir(exist_ok=True)
            path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
            manifest.append(
                {
                    "file": name,
                    "batch": batch.name,
                    "part": idx,
                    "rows": payload["rows"],
                    "chars": len(chunk),
                }
            )
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
