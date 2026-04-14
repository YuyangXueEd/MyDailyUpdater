from typing import Any
from tenacity import retry, stop_after_attempt, wait_exponential


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10))
def _call(client: Any, model: str, prompt: str, max_tokens: int = 300) -> str:
    resp = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
        temperature=0.3,
    )
    return resp.choices[0].message.content.strip()


def _summarize_one_paper(paper: dict, client: Any, model: str) -> dict:
    prompt = (
        "用中文简洁总结以下论文的核心方法和贡献（2-3句话，不超过100字）：\n\n"
        f"标题：{paper['title']}\n摘要：{paper['abstract'][:1000]}"
    )
    paper["abstract_zh"] = _call(client, model, prompt)
    return paper


def summarize_paper(paper: dict, client: Any, model: str) -> dict:
    return _summarize_one_paper(paper, client, model)


def summarize_papers(papers: list[dict], client: Any, model: str) -> list[dict]:
    """Summarize all papers sequentially to avoid rate limiting."""
    if not papers:
        return []
    results = []
    for p in papers:
        try:
            results.append(_summarize_one_paper(p, client, model))
        except Exception as e:
            p["abstract_zh"] = "摘要生成失败。"
            results.append(p)
            print(f"  Paper summarize error: {e}")
    return results


def _summarize_one_hn(story: dict, client: Any, model: str) -> dict:
    prompt = (
        "用一句中文（不超过50字）总结这条科技新闻的核心内容：\n\n"
        f"标题：{story['title']}\n链接：{story.get('url', '')}"
    )
    story["summary_zh"] = _call(client, model, prompt, max_tokens=100)
    return story


def summarize_hn_story(story: dict, client: Any, model: str) -> dict:
    return _summarize_one_hn(story, client, model)


def summarize_hn_stories(stories: list[dict], client: Any, model: str) -> list[dict]:
    """Summarize HN stories sequentially to avoid rate limiting."""
    if not stories:
        return []
    results = []
    for s in stories:
        try:
            results.append(_summarize_one_hn(s, client, model))
        except Exception as e:
            s["summary_zh"] = "摘要生成失败。"
            results.append(s)
    return results


def summarize_job(job: dict, client: Any, model: str) -> dict:
    description = (job.get("description", "") or "")[:1800]
    location = job.get("location", "") or "未注明"
    salary = job.get("salary", "") or "未注明"
    deadline = job.get("deadline", "") or "未注明"
    contract_type = job.get("contract_type", "") or "未注明"
    hours = job.get("hours", "") or "未注明"
    placed_on = job.get("placed_on", "") or job.get("posted_date", "") or "未注明"
    job_ref = job.get("job_ref", "") or "未注明"

    prompt = (
        "你是学术职位信息提取助手。请基于输入内容，输出中文结构化要点。\n"
        "必须遵守：\n"
        "1) 仅输出以下5行，每行前缀固定，不要加其它说明。\n"
        "2) 若信息缺失请写‘未注明’，不要编造。\n"
        "3) 技术与研究方向尽量具体，避免空泛表述。\n\n"
        "输出格式：\n"
        "研究方向：...\n"
        "关键要求：...\n"
        "申请信息：截止/开始时间、申请材料、联系渠道（如有）\n"
        "职位条件：地点、合同类型、工作量、薪资\n"
        "一句建议：给CV/医疗影像/LLM方向申请者的匹配建议\n\n"
        f"职位：{job['title']}\n机构：{job.get('institution','')}\n"
        f"地点：{location}\n薪资：{salary}\n截止日期：{deadline}\n"
        f"合同类型：{contract_type}\n工作量：{hours}\n发布时间：{placed_on}\n职位编号：{job_ref}\n"
        f"描述：{description}"
    )

    try:
        job["requirements_zh"] = _call(client, model, prompt)
    except Exception:
        fallback_lines = [
            "研究方向：未能自动提取，请查看原始职位描述。",
            "关键要求：请重点关注方法技能、学位背景、论文/项目经历要求。",
            f"申请信息：截止日期 {deadline}；发布时间 {placed_on}；职位编号 {job_ref}。",
            f"职位条件：地点 {location}；合同类型 {contract_type}；工作量 {hours}；薪资 {salary}。",
            "一句建议：若你的方向与岗位标题高度匹配，建议尽快准备材料并核对申请入口。",
        ]
        job["requirements_zh"] = "\n".join(fallback_lines)
    return job


def summarize_jobs(jobs: list[dict], client: Any, model: str) -> list[dict]:
    """Summarize jobs sequentially to avoid rate limiting."""
    if not jobs:
        return []
    results = []
    for j in jobs:
        try:
            results.append(summarize_job(j, client, model))
        except Exception as e:
            j["requirements_zh"] = "摘要生成失败。"
            results.append(j)
    return results


def _summarize_one_github_repo(repo: dict, client: Any, model: str) -> dict:
    prompt = (
        "用一句中文（不超过60字）总结这个GitHub仓库的核心功能和特点：\n\n"
        f"仓库：{repo['full_name']}\n"
        f"描述：{repo['description']}"
    )
    repo["summary_zh"] = _call(client, model, prompt, max_tokens=120)
    return repo


def summarize_github_repos(repos: list[dict], client: Any, model: str) -> list[dict]:
    """Summarize GitHub trending repos sequentially to avoid rate limiting."""
    if not repos:
        return []
    results = []
    for r in repos:
        try:
            results.append(_summarize_one_github_repo(r, client, model))
        except Exception as e:
            r["summary_zh"] = "摘要生成失败。"
            results.append(r)
    return results


def summarize_supervisor_update(update: dict, client: Any, model: str) -> dict:
    prompt = (
        "以下是一位导师主页的最新内容，请用中文（不超过80字）总结是否有新的职位信息，"
        "包括方向、截止日期等关键信息：\n\n"
        f"导师：{update['name']}（{update['institution']}）\n"
        f"页面内容：{update['page_text'][:2000]}"
    )
    update["change_summary_zh"] = _call(client, model, prompt)
    return update
