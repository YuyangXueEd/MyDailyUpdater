# _template extension

Starter template for building a new Linnet extension.

## How to use this template

```bash
# 1. Copy the whole directory
cp -r extensions/_template extensions/my_source

# 2. Rename the class and fill in the three methods
#    Open extensions/my_source/__init__.py

# 3. Fill in extensions/my_source/meta.json
#    This powers the Astro setup wizard and section registry.

# 4. Update this README to document your extension
#
# 5. Register and configure — see extensions/README.md for full steps
```

## What to fill in

| Method | Rules |
|---|---|
| `fetch()` | Pull raw data. No LLM calls. Read credentials from `os.environ` only. |
| `process()` | LLM scoring / summarising. Always check `self.config.get("dry_run")` first. |
| `render()` | Wrap items in `FeedSection`. No network or LLM calls. |

## Adding a card component (Astro site)

If your extension needs a custom card layout, add an Astro component:

1. Create `astro/src/components/MySourceCard.astro`
2. Register it in `astro/src/components/SectionBlock.astro` — add a branch for your `section.key`

The default fallback is `GenericCard.astro`, which renders title + URL + summary for any unknown key. This is fine for most new extensions.

## Template metadata

`meta.json` is now the source of truth for the Astro-side extension registry.

Fill in at least:

- `key` — must match the directory name and Python extension key
- `title` / `subtitle` — rendered section heading copy
- `displayName` / `description` — setup wizard card copy
- `layout`, `icon`, `category`, `locale`
- `setupFields` — fields shown in the setup wizard

After editing metadata, refresh the generated registry from `astro/`:

```bash
npm run sync:extension-meta
```

## Template README structure

Once your extension is working, update this README with:

- What it does (one paragraph)
- Pipeline diagram (`fetch → process → render`)
- Config table (sources.yaml + extensions/{name}.yaml keys, defaults, notes)
- Output item schema (field names and types)
- Underlying collectors / external APIs used
- Test command

See `extensions/arxiv/README.md` for a complete example.
