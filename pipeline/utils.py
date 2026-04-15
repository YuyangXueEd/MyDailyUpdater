"""pipeline/utils.py — shared utilities used across extensions.

Provides:
  - lang_instruction()      language directive fragment for LLM prompts
  - parse_score()           extract a 0–10 float from LLM text output
  - call_llm_scoring()      LLM call for scoring (low max_tokens, temp=0)
  - call_llm_summarize()    LLM call for summarisation (higher max_tokens, temp=0.3)
"""

import re
from typing import Any

from tenacity import retry, stop_after_attempt, wait_exponential

_LANG_NAMES: dict[str, str] = {
    "en": "English",
    "zh": "Chinese (Simplified)",
    "fr": "French",
    "de": "German",
    "ja": "Japanese",
    "ko": "Korean",
    "es": "Spanish",
    "pt": "Portuguese",
}


def lang_instruction(lang: str) -> str:
    """Return a natural-language instruction fragment for the target language.

    Used inside prompts to tell the LLM which language to respond in.
    Falls back to the raw lang code if it's not in the known list.
    """
    name = _LANG_NAMES.get(lang.lower(), lang)
    if lang.lower() == "en":
        return f"in {name}"
    return f"in {name} (non-English)"


def _fallback_text(msg: str, lang: str) -> str:
    """Return a short fallback string in the target language."""
    if lang.lower() == "zh":
        return f"{msg}，摘要生成失败。"
    return f"{msg}: summary generation failed."


def parse_score(text: str) -> float:
    """Extract the first numeric value from LLM output and clamp to [0, 10]."""
    numbers = re.findall(r"-?\d+(?:\.\d+)?", text)
    if not numbers:
        return 0.0
    return max(0.0, min(10.0, float(numbers[0])))


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=3, max=30))
def call_llm_scoring(client: Any, model: str, prompt: str) -> str:
    """LLM call tuned for scoring: low max_tokens, temperature=0."""
    resp = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=10,
        temperature=0,
    )
    return resp.choices[0].message.content


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10))
def call_llm_summarize(client: Any, model: str, prompt: str, max_tokens: int = 300) -> str:
    """LLM call tuned for summarisation: configurable max_tokens, temperature=0.3."""
    resp = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
        temperature=0.3,
    )
    return resp.choices[0].message.content.strip()
