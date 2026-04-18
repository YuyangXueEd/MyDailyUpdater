"""
Collector for <MySource> extension.

Responsible for fetching raw data from the upstream source.
No LLM calls here — keep this fast and side-effect-free.
"""

from typing import Any

# import httpx  # uncomment if you need an HTTP client


def fetch_items(
    max_items: int = 20,
    api_key: str = "",
    # add any other fetch parameters your source needs
) -> list[dict[str, Any]]:
    """
    Fetch raw items from the data source.

    Returns a list of plain dicts. The schema is up to you — just make sure
    the field names match what process() and render() (and the Astro card
    component) expect.

    If the source is unavailable, return [] rather than raising.
    """
    items: list[dict[str, Any]] = []

    # --- your fetching logic here ---
    # Example with httpx:
    # with httpx.Client(timeout=30.0) as client:
    #     resp = client.get("https://api.example.com/items", params={"limit": max_items},
    #                       headers={"Authorization": f"Bearer {api_key}"})
    #     resp.raise_for_status()
    #     for raw in resp.json().get("items", []):
    #         items.append({
    #             "id": raw["id"],
    #             "title": raw["title"],
    #             "url": raw.get("url", ""),
    #             "description": raw.get("body", ""),
    #             "summary": "",  # filled by summarizer.py
    #         })

    return items[:max_items]
