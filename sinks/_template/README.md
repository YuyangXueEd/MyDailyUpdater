# _template sink

Starter template for adding a new delivery sink.

## How to use

```bash
cp -r sinks/_template sinks/my_sink
```

Then edit `sinks/my_sink/__init__.py`:

1. Rename the class (`MySink` → `Teamssink`, `TelegramSink`, etc.)
2. Set `key = "my_sink"` — must match the key under `sinks:` in `sources.yaml`
3. Implement `deliver(self, payload)`:
   - Read credentials from `os.environ` (never from `self.config`)
   - Use `self.config.get(...)` for display/limit options
   - Raise on unrecoverable errors
4. Update `README.md` with your sink's setup steps

Then register and configure:

5. Add to `SINK_REGISTRY` in `sinks/__init__.py`:
   ```python
   from sinks.my_sink import MySink
   SINK_REGISTRY = [..., MySink]
   ```
6. Add a config block in `config/sources.yaml`:
   ```yaml
   sinks:
     my_sink:
       enabled: true
       # your options
   ```
7. Document the required environment variable in `sinks/my_sink/README.md`

## BaseSink contract

```python
class BaseSink(ABC):
    key: str = ""               # unique snake_case, matches sources.yaml

    def __init__(self, config: dict): ...

    @property
    def enabled(self) -> bool:
        return self.config.get("enabled", False)   # opt-in

    @abstractmethod
    def deliver(self, payload: dict) -> None: ...
```

Sinks default to **disabled** — you must set `enabled: true` in `sources.yaml`.

## Payload schema

`payload` is the dict written to `docs/data/daily/<date>.json`.

### Recommended: `sections_ordered` (Astro-aligned, extension-agnostic)

```python
payload = {
    "date":             "YYYY-MM-DD",
    "generated_at":     "2026-04-18T00:03:00+00:00",
    "sections_ordered": [
        {
            "key":         "arxiv",        # extension key
            "payload_key": "papers",       # legacy alias (same as key for most)
            "title":       "arXiv Papers",
            "icon":        "📄",
            "items":       [...],          # list of item dicts
            "meta":        {...},          # e.g. {"count": 12}
        },
        # ... one entry per enabled extension, in display_order
    ],
    "meta": {
        "duration_seconds": 42,
        "llm_model": "model-name",
    },
    # flat legacy keys are also present for backward compatibility:
    "papers":             [...],
    "hacker_news":        [...],
    "github_trending":    [...],
}
```

**Use `sections_ordered` for new sinks** — it works regardless of which
extensions are enabled and preserves the user's `display_order`.

```python
for section in payload.get("sections_ordered", []):
    items = section["items"][:self.config.get(f"max_{section['key']}", 5)]
    # format items …
```

See `extensions/llms.txt` for per-item field schemas.
