from extensions.github_trending.collector import _parse_trending_article


def test_parse_trending_article_extracts_real_star_counts():
    article = """
    <article class="Box-row">
      <h2 class="h3 lh-condensed">
        <a href="/forrestchang/andrej-karpathy-skills" class="Link">
          <span class="text-normal">forrestchang /</span>
          andrej-karpathy-skills
        </a>
      </h2>
      <p class="col-9 color-fg-muted my-1 tmp-pr-4">
        A single CLAUDE.md file to improve Claude Code behavior.
      </p>
      <div class="f6 color-fg-muted mt-2">
        <a href="/forrestchang/andrej-karpathy-skills/stargazers" class="tmp-mr-3 Link Link--muted d-inline-block">
          <svg aria-label="star"></svg>
          24,202
        </a>
        <span class="d-inline-block float-sm-right">
          5,828 stars today
        </span>
      </div>
    </article>
    """

    repo = _parse_trending_article(article)

    assert repo is not None
    assert repo["full_name"] == "forrestchang/andrej-karpathy-skills"
    assert repo["description"] == "A single CLAUDE.md file to improve Claude Code behavior."
    assert repo["stars_today"] == 5828
    assert repo["total_stars"] == 24202


def test_parse_trending_article_cleans_description_and_language():
    article = """
    <article class="Box-row">
      <h2 class="h3 lh-condensed">
        <a href="/example/repo" class="Link">example/repo</a>
      </h2>
      <p class="col-9 color-fg-muted my-1 tmp-pr-4">
        Builds &amp; evaluates<br>vision agents.
      </p>
      <div class="f6 color-fg-muted mt-2">
        <span itemprop="programmingLanguage"> Python </span>
        <a href="/example/repo/stargazers" class="tmp-mr-3 Link Link--muted d-inline-block">
          <svg aria-label="star"></svg>
          1,234
        </a>
      </div>
    </article>
    """

    repo = _parse_trending_article(article)

    assert repo is not None
    assert repo["description"] == "Builds & evaluates vision agents."
    assert repo["language"] == "Python"
    assert repo["total_stars"] == 1234
