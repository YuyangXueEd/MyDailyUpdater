# github_trending extension

Fetches the daily trending repositories from GitHub Trending and summarises each one with an LLM.

## Pipeline

```
fetch()    — scrapes github.com/trending for today's top repos
process()  — LLM one-sentence summary per repo
render()   — wraps in FeedSection
```

## Config (`config/sources.yaml`)

> This extension has no filter/keyword config — all options live in `sources.yaml`.
> To add filter config, create `config/extensions/github_trending.yaml`.

| Key | Where | Default | Notes |
|---|---|---|---|
| `enabled` | sources.yaml | `true` | |
| `max_repos` | sources.yaml | `15` | Maximum repos to fetch and display |

## Output item schema

```python
{
  "full_name":   str,         # "owner/repo"
  "url":         str,         # https://github.com/owner/repo
  "description": str,
  "language":    str,         # primary language (may be empty)
  "stars_today": int,         # stars gained today
  "total_stars": int,
  "summary":     str,         # LLM one-liner
}
```

## Underlying collector

- `collectors/github_trending_collector.py`
  - `fetch_github_trending(max_repos)` — scrapes github.com/trending

## Tests

```bash
PYTHONPATH=. pytest tests/test_github_trending_collector.py -v
```
