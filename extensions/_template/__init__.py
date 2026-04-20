"""
_template — starter template for a new Linnet extension.

Copy the whole extensions/_template/ directory to extensions/my_source/,
then:
  1. Rename the class below and update key/title/icon.
  2. Fill in meta.json for the Astro setup wizard and section registry.
  3. Fill in collector.py with your fetch logic.
  4. Fill in summarizer.py (or delete it if no LLM step is needed).
  5. Follow extensions/README.md to register and configure.

Quick reference:
  self.config  — config slice merged from sources.yaml + config/extensions/{name}.yaml
  self.llm     — OpenAI-compatible client (or None if no LLM needed)
  self.enabled — False when sources.yaml sets enabled: false for this key
"""

import os

from extensions.base import BaseExtension, FeedSection

from .collector import fetch_items
from .summarizer import summarize_items


class TemplateExtension(BaseExtension):
    # ── Required class attributes ──────────────────────────────────────────────
    key = "my_source"  # must match your config/sources.yaml key exactly
    title = "My Source"  # shown as the section heading in the rendered output
    icon = "🧩"  # shown in the quick-nav and section heading

    # ── Step 1: fetch ──────────────────────────────────────────────────────────
    def fetch(self) -> list[dict]:
        """
        Pull raw items from the data source via collector.py.

        Rules:
          - No LLM calls here (cost + latency belong in process()).
          - Read config options via self.config.get("my_option", default).
          - Read credentials from environment variables only.
          - Return [] rather than raising if the source is unavailable.
        """
        max_items = self.config.get("max_items", 20)
        api_key = os.environ.get("MY_SOURCE_API_KEY", "")
        items = fetch_items(max_items=max_items, api_key=api_key)
        print(f"  {self.title}: fetched {len(items)} items")
        return items

    # ── Step 2: process (optional) ─────────────────────────────────────────────
    def process(self, items: list[dict]) -> list[dict]:
        """
        Score, filter, or summarise items via summarizer.py.

        Delete this method entirely if your extension needs no LLM processing —
        the base class provides a pass-through default.
        """
        if self.config.get("dry_run"):
            print(f"  [dry-run] skipping LLM calls for {len(items)} {self.title} items")
            return items

        model = self.config["llm_summarization_model"]
        lang = self.config.get("language", "en")
        prompts = self.config.get("prompts", {})

        return summarize_items(
            items,
            self.llm,
            model,
            lang,
            prompt_template=prompts.get("my_source_summary"),
        )

    # ── Step 3: render ─────────────────────────────────────────────────────────
    def render(self, items: list[dict]) -> FeedSection:
        """
        Package processed items into a FeedSection.

        Rules:
          - No network or LLM calls here.
          - Put useful counters in meta (shown in pipeline logs).
          - The items list is what the Astro component will iterate over,
            so make sure the field names match what your card component expects.
        """
        return self.build_section(
            items=items,
            meta={"count": len(items)},
        )
