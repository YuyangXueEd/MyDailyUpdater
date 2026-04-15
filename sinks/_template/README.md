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

```python
payload = {
    "date":               "YYYY-MM-DD",
    "papers":             [...],   # arXiv items
    "hacker_news":        [...],   # HN items
    "github_trending":    [...],   # GitHub items
    "jobs":               [...],   # jobs items (empty if extension disabled)
    "supervisor_updates": [...],   # supervisor items (empty if disabled)
    "meta": {
        "duration_seconds": 42,
        "llm_model": "model-name",
    },
}
```

See `extensions/llms.txt` for per-item field schemas.
