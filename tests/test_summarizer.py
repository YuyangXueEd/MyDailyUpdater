from unittest.mock import MagicMock

from extensions.arxiv.summarizer import summarize_paper
from extensions.hacker_news.summarizer import summarize_hn_story
from extensions.postdoc_jobs.summarizer import summarize_job
from extensions.supervisor_updates.summarizer import summarize_supervisor_update


def _mock_client(response_text: str) -> MagicMock:
    client = MagicMock()
    client.chat.completions.create.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content=response_text))]
    )
    return client


def test_summarize_paper_returns_chinese(sample_paper):
    client = _mock_client("这是一篇关于医学图像分割的论文。")
    result = summarize_paper(sample_paper, client=client, model="test-model")
    assert result["abstract"] == "这是一篇关于医学图像分割的论文。"


def test_summarize_hn_story_returns_chinese(sample_hn_story):
    client = _mock_client("Meta开源了新的视觉模型。")
    result = summarize_hn_story(sample_hn_story, client=client, model="test-model")
    assert result["summary"] == "Meta开源了新的视觉模型。"


def test_summarize_job_extracts_fields(sample_job):
    client = _mock_client("截止日期：2026年5月15日。要求：深度学习，医学图像。")
    result = summarize_job(sample_job, client=client, model="test-model")
    assert "requirements" in result
    assert len(result["requirements"]) > 0


def test_summarize_supervisor_update():
    update = {
        "name": "Prof. Smith",
        "institution": "Oxford",
        "url": "https://smith.ox.ac.uk",
        "page_text": "We are hiring a postdoc in cardiac imaging. Deadline June 2026.",
        "change_summary": "",
    }
    client = _mock_client("新增心脏影像方向博士后职位，截止2026年6月。")
    result = summarize_supervisor_update(update, client=client, model="test-model")
    assert result["change_summary"] == "新增心脏影像方向博士后职位，截止2026年6月。"
