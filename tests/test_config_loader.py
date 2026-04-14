from pipeline.config_loader import load_keywords, load_sources, load_supervisors


def test_load_keywords_has_arxiv_categories():
    cfg = load_keywords()
    assert "cs.CV" in cfg["arxiv"]["categories"]
    assert "eess.IV" in cfg["arxiv"]["categories"]


def test_load_keywords_has_must_include():
    cfg = load_keywords()
    assert "medical imaging" in cfg["arxiv"]["must_include"]
    assert cfg["arxiv"]["llm_score_threshold"] == 7


def test_load_sources_has_llm_config():
    cfg = load_sources()
    assert cfg["llm"]["base_url"] == "https://openrouter.ai/api/v1"
    assert cfg["llm"]["scoring_model"]  # just check it's set


def test_load_supervisors_returns_list():
    supervisors = load_supervisors()
    assert isinstance(supervisors, list)
