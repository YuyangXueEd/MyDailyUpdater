# supervisor_updates extension

Monitors a configurable list of advisor / lab pages for content changes. When a page changes since the last check, the diff is summarised with an LLM.

## Pipeline

```
fetch()    — fetches each configured page, compares hash against stored state
           → returns only pages that changed
process()  — LLM summarises what changed on each page
render()   — wraps in FeedSection
```

## Config (`config/sources.yaml` + `config/extensions/supervisor_updates.yaml`)

| Key | Where | Notes |
|---|---|---|
| `enabled` | sources.yaml | Set to `true` to activate (key: `supervisor_updates`) |
| `supervisors` | extensions/supervisor_updates.yaml | List of `{name, institution, url}` dicts to monitor |

Example `config/extensions/supervisor_updates.yaml`:
```yaml
supervisors:
  - name: "Ada Lovelace"
    institution: "University of Example"
    url: "https://example.ac.uk/~lovelace"
```

## Output item schema

```python
{
  "name":           str,   # supervisor name from config
  "institution":    str,
  "url":            str,
  "change_summary": str,   # LLM description of what changed
}
```

## How change detection works

Page hashes are stored in `docs/data/supervisor_hashes.json`. On each run, the extension fetches each URL, computes a hash of the visible text, and compares it to the stored value. Only pages with a changed hash are passed to `process()`.

## Underlying collector

- `extensions/supervisor_updates/collector.py`
  - `fetch_supervisor_updates(supervisors)` — fetches and diffs pages
  - `compute_hash(text)`, `detect_changes(supervisors, hash_store)`, `update_hashes()`

## Enabling this extension

1. Set `supervisor_updates.enabled: true` in `config/sources.yaml`
2. Add supervisors to `config/extensions/supervisor_updates.yaml`
3. Add `supervisor_updates` to `display_order` in `config/sources.yaml`
4. Add it to `REGISTRY` in `extensions/__init__.py`:
   ```python
   from extensions.supervisor_updates import SupervisorExtension
   REGISTRY = [..., SupervisorExtension]
   ```

## Tests

```bash
PYTHONPATH=. pytest tests/test_supervisor_watcher.py -v
```
