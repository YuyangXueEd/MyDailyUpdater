# hacker_news extension

Fetches top Hacker News stories that match configured AI/ML keywords and exceed a minimum score threshold, then summarises each one with an LLM.

## Pipeline

```
fetch()    — scrapes HN top stories, filters by score + keyword match
process()  — LLM one-sentence summary per story
render()   — wraps in FeedSection
```

## Config (`config/sources.yaml` + `config/keywords.yaml`)

| Key | Where | Default | Notes |
|---|---|---|---|
| `enabled` | sources.yaml | `true` | |
| `min_score` | keywords.yaml | `50` | Minimum HN points to include |
| `max_items` | keywords.yaml | `20` | Maximum stories to fetch |
| `keywords` | keywords.yaml | `[]` | At least one must appear in the story title |

## Output item schema

```python
{
  "id":           int,
  "title":        str,
  "url":          str,   # external link (may be empty for Ask HN / Show HN)
  "score":        int,   # HN points
  "comments_url": str,   # https://news.ycombinator.com/item?id=<id>
  "summary":      str,   # LLM one-liner
}
```

## Underlying collector

- `collectors/hn_collector.py`
  - `fetch_stories(keywords, min_score, max_items)` — scrapes HN top stories

## Tests

```bash
PYTHONPATH=. pytest tests/test_hn_collector.py -v
```
