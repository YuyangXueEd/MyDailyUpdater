"""Postdoc job relevance scorer."""

from typing import Any

from pipeline.utils import call_llm_scoring, parse_score


def build_job_prompt(job: dict) -> str:
    return (
        "Rate this academic job posting's relevance to a researcher in "
        "Computer Vision, Medical Imaging, LLM, VLM. Scale 0-10.\n\n"
        f"Title: {job['title']}\n"
        f"Description: {job.get('description', '')[:500]}\n\n"
        "Reply with ONLY a single integer 0-10."
    )


def _score_job(job: dict, client: Any, model: str) -> dict:
    raw = call_llm_scoring(client, model, build_job_prompt(job))
    job["relevance_score"] = parse_score(raw)
    return job


def score_jobs(
    jobs: list[dict],
    client: Any,
    model: str,
    threshold: float,
) -> list[dict]:
    """Score jobs sequentially to avoid rate limiting."""
    if not jobs:
        return []

    results: list[dict] = []
    for j in jobs:
        try:
            results.append(_score_job(j, client, model))
        except Exception as e:
            j["relevance_score"] = 0.0
            results.append(j)
            print(f"  Job scoring error: {e}")

    return [j for j in results if j["relevance_score"] >= threshold]
