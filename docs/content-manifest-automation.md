# Content Manifest Normalization Automation

The repository now includes automated normalization for `content-index.json`.

## What gets normalized

- Required root keys must exist: `version`, `generatedAt`, `resources`, `categories`
- `categories` are sorted alphabetically by `name` (case-insensitive)
- `resources` are sorted by `uploadDate` descending, then `title` ascending
- Output JSON is written with 2-space indentation and a trailing newline

## How automation behaves

- **push** affecting `content-index.json` or `content/**`
  - Runs normalization
  - On default branch only, if the file changes and actor is not `github-actions[bot]`, commits back with:
    - `chore: normalize content manifest`
- **pull_request** affecting `content-index.json` or `content/**`
  - Runs normalization
  - Fails the workflow if normalization would modify `content-index.json`
- **workflow_dispatch**
  - Runs normalization check on demand

## Local command

```bash
node scripts/normalize-manifest.mjs
```
