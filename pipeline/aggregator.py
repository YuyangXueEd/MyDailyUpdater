import json
import os
from collections import Counter
from pathlib import Path
from typing import Any

_DEFAULT_DATA_DIR = str(Path(__file__).parent.parent / "docs" / "data" / "daily")


def load_daily_jsons(dates: list[str], data_dir: str = _DEFAULT_DATA_DIR) -> list[dict]:
    payloads = []
    for date_str in dates:
        path = os.path.join(data_dir, f"{date_str}.json")
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                payloads.append(json.load(f))
    return payloads


def compute_keyword_frequency(papers: list[dict]) -> dict[str, int]:
    counter: Counter = Counter()
    for p in papers:
        for kw in p.get("keywords_matched", []):
            counter[kw] += 1
    return dict(counter.most_common())


def build_weekly_payload(
    dates: list[str],
    period: str,
    summary_zh: str,
    data_dir: str = _DEFAULT_DATA_DIR,
) -> dict[str, Any]:
    dailies = load_daily_jsons(dates, data_dir)
    all_papers = [p for d in dailies for p in d.get("papers", [])]
    all_jobs = [j for d in dailies for j in d.get("jobs", [])]
    freq = compute_keyword_frequency(all_papers)
    top_papers = sorted(all_papers, key=lambda p: p.get("score", 0), reverse=True)

    return {
        "period": period,
        "summary_zh": summary_zh,
        "top_papers": top_papers,
        "new_jobs": all_jobs,
        "trending_keywords": list(freq.keys())[:10],
        "keyword_frequency": freq,
        "daily_refs": dates,
    }


def build_monthly_payload(
    dates: list[str],
    period: str,
    summary_zh: str,
    data_dir: str = _DEFAULT_DATA_DIR,
) -> dict[str, Any]:
    payload = build_weekly_payload(dates, period, summary_zh, data_dir)
    return payload  # same structure, more dates
