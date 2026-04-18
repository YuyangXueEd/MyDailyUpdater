"""
Summarizer for <MySource> extension.

Responsible for LLM-based summarization of items fetched by collector.py.
Delete this file if your extension needs no LLM processing — the base class
provides a pass-through default for process().
"""

from typing import Any

from pipeline.utils import _fallback_text, call_llm_summarize, lang_instruction

# Default summarization prompt. Override via sources.yaml → llm.prompts.my_source_summary.
# Available placeholders: {title}, {description}, {lang}
_DEFAULT_SUMMARY_PROMPT = (
    "Summarize the following item {lang}, in one sentence (≤50 words):\n\n"
    "Title: {title}\n"
    "Description: {description}"
)


def summarize_item(
    item: dict,
    client: Any,
    model: str,
    lang: str = "en",
    prompt_template: str | None = None,
) -> dict:
    """Summarize a single item in-place, setting item['summary']."""
    template = prompt_template or _DEFAULT_SUMMARY_PROMPT
    prompt = template.format(
        title=item.get("title", ""),
        description=item.get("description", ""),
        lang=lang_instruction(lang),
    )
    item["summary"] = call_llm_summarize(client, model, prompt, max_tokens=100)
    return item


def summarize_items(
    items: list[dict],
    client: Any,
    model: str,
    lang: str = "en",
    prompt_template: str | None = None,
) -> list[dict]:
    """Summarize all items, falling back gracefully on individual failures."""
    if not items:
        return []
    results = []
    for item in items:
        try:
            results.append(summarize_item(item, client, model, lang, prompt_template))
        except Exception:
            item["summary"] = _fallback_text("Item", lang)
            results.append(item)
    return results
