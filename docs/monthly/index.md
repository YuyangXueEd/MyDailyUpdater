---
layout: default
title: Monthly Overview
nav_order: 4
has_children: false
---

# Monthly Overview

{% assign monthly_pages = site.pages | where_exp: "p", "p.dir == '/monthly/'" | sort: "name" | reverse %}
{% for page in monthly_pages %}
{% unless page.name == "index.md" %}
- [{{ page.title }}]({{ page.url | relative_url }})
{% endunless %}
{% endfor %}
