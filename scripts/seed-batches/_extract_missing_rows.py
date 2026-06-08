"""Extract last-row INSERT SQL for each batch (missing from chunk splits)."""
import json
from pathlib import Path

BASE = Path(__file__).parent
PROJECT_ID = "wblqxzymhksqyelfnrtw"


def last_row_sql(batch_num: int) -> str:
    full = (BASE / f"batch-{batch_num:02d}.sql").read_text(encoding="utf-8")
    last_line = [line for line in full.splitlines() if line.strip().startswith("(")][-1]
    return (
        "INSERT INTO vocabulary_games (word, meaning, category, difficulty, language, example_sentence, example_translation)\n"
        f"VALUES\n  {last_line}\n"
    )


if __name__ == "__main__":
    for n in range(2, 6):
        sql = last_row_sql(n)
        out = BASE / f"_missing_row_batch-{n:02d}.sql"
        out.write_text(sql, encoding="utf-8")
        payload = {"project_id": PROJECT_ID, "query": sql}
        (BASE / f"_missing_row_batch-{n:02d}.json").write_text(
            json.dumps(payload, ensure_ascii=False), encoding="utf-8"
        )
        print(n, sql.splitlines()[-1][:70])
