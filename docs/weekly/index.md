---
layout: default
title: Weekly Rollup
nav_order: 3
has_children: false
---

# Weekly Rollup

{% assign weekly_pages = site.pages | where_exp: "p", "p.dir == '/weekly/'" | sort: "name" | reverse %}
{% for page in weekly_pages %}
{% unless page.name == "index.md" %}
- [{{ page.title }}]({{ page.url | relative_url }})
{% endunless %}
{% endfor %}
