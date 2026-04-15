"""ArXiv paper relevance scorer."""

from typing import Any

from pipeline.utils import call_llm_scoring, parse_score


def _build_paper_prompt(paper: dict) -> str:
    return (
        "Rate this arxiv paper's relevance to: Computer Vision, Medical Imaging "
        "(MRI/CT/ultrasound/pathology/fundus), LLMs, Vision-Language Models, "
        "Diffusion Models, Foundation Models.\n\n"
        f"Title: {paper['title']}\n"
        f"Abstract: {paper['abstract'][:600]}\n\n"
        "Reply with ONLY a single integer 0-10. No explanation."
    )


def build_batch_paper_prompt(papers: list[dict]) -> str:
    return _build_paper_prompt(papers[0]) if papers else ""


def parse_batch_scores(text: str, expected: int) -> list[float]:
    score = parse_score(text)
    return [score] + [0.0] * (expected - 1)


def _score_paper(paper: dict, client: Any, model: str) -> dict:
    raw = call_llm_scoring(client, model, _build_paper_prompt(paper))
    paper["score"] = parse_score(raw)
    return paper


def score_papers(
    papers: list[dict],
    client: Any,
    model: str,
    threshold: float,
) -> list[dict]:
    """Score papers sequentially to avoid rate limiting."""
    if not papers:
        return []

    results: list[dict] = []
    for p in papers:
        try:
            results.append(_score_paper(p, client, model))
        except Exception as e:
            p["score"] = 0.0
            results.append(p)
            print(f"  Scoring error: {e}")

    return [p for p in results if p["score"] >= threshold]
