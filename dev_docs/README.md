# Developer Documentation

This directory is reserved for official developer and maintainer documentation.

Use `dev_docs/` for material such as:

- architecture notes
- contributor onboarding docs
- migration plans
- release or maintenance procedures
- implementation references that are meant to ship with the repository

Do not use this directory for public site content. The public site is built with
Astro from `astro/` and deployed via GitHub Actions. Raw JSON data written by the
pipeline lives in `docs/data/`. Static assets served as-is live in `astro/public/`.

Code-local documentation can still live next to the implementation it explains,
for example under `extensions/` or `sinks/`.
