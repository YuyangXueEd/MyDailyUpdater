# _template extension

Starter template for building a new MyDailyUpdater extension.

## How to use this template

```bash
# 1. Copy the whole directory
cp -r extensions/_template extensions/my_source

# 2. Rename the class and fill in the three methods
#    Open extensions/my_source/__init__.py

# 3. Update this README to document your extension

# 4. Register and configure — see extensions/README.md for full steps
```

## What to fill in

| Method | Rules |
|---|---|
| `fetch()` | Pull raw data. No LLM calls. Read credentials from `os.environ` only. |
| `process()` | LLM scoring / summarising. Always check `self.config.get("dry_run")` first. |
| `render()` | Wrap items in `FeedSection`. No network or LLM calls. |

## Template README structure

Once your extension is working, update this README with:

- What it does (one paragraph)
- Pipeline diagram (`fetch → process → render`)
- Config table (sources.yaml + keywords.yaml keys, defaults, notes)
- Output item schema (field names and types)
- Underlying collectors / external APIs used
- Test command

See `extensions/arxiv/README.md` for a complete example.
