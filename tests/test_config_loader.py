from pipeline.config_loader import load_extension_config, load_sources


def test_load_extension_config_arxiv_has_categories():
    cfg = load_extension_config("arxiv")
    assert "cs.CV" in cfg["categories"]
    assert "eess.IV" in cfg["categories"]


def test_load_extension_config_arxiv_has_must_include():
    cfg = load_extension_config("arxiv")
    assert "medical imaging" in cfg["must_include"]
    assert cfg["llm_score_threshold"] == 7


def test_load_extension_config_missing_returns_empty():
    cfg = load_extension_config("nonexistent_extension")
    assert cfg == {}


def test_load_sources_has_llm_config():
    cfg = load_sources()
    assert cfg["llm"]["base_url"] == "https://openrouter.ai/api/v1"
    assert cfg["llm"]["scoring_model"]  # just check it's set


def test_load_extension_config_supervisor_updates_returns_list():
    cfg = load_extension_config("supervisor_updates")
    assert isinstance(cfg.get("supervisors", []), list)
