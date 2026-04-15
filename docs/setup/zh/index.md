---
layout: default
title: 中文设置入口
nav_exclude: true
---

<div class="landing-shell">
  <section class="landing-hero">
    <div class="landing-kicker">中文 setup</div>
    <h1>先用中文理解流程，再进入配置向导。</h1>
    <p>
      这个页面是给中文用户的 setup 入口。它先把配置路径、推荐通知渠道、
      GitHub Secrets 的处理方式讲清楚，然后再带你进入实际的 wizard 或手动配置。
    </p>

    <div class="landing-actions">
      <a class="landing-button primary" href="{{ '/setup/' | relative_url }}">进入 English Setup Wizard</a>
      <a class="landing-button secondary" href="https://github.com/YuyangXueEd/MyDailyUpdater/blob/main/README_zh.md">查看中文 README</a>
      <a class="landing-button secondary" href="{{ '/setup/manual-config' | relative_url }}">手动配置说明</a>
    </div>

    <div class="landing-stat-grid">
      <div class="landing-stat">
        <strong>推荐路径</strong>
        <span>先看中文说明，再进入 wizard 生成配置文件。</span>
      </div>
      <div class="landing-stat">
        <strong>Secrets</strong>
        <span>API key 与 webhook / token 一律放 GitHub Secrets，不写进 YAML。</span>
      </div>
      <div class="landing-stat">
        <strong>默认通知建议</strong>
        <span>英文用户优先 Slack，中文用户后续优先 Server酱。</span>
      </div>
      <div class="landing-stat">
        <strong>当前状态</strong>
        <span>Wizard 已上线，中文 sink 将优先考虑 Server酱，再评估其他微信系方案。</span>
      </div>
    </div>
  </section>

  <section class="landing-grid">
    <article class="landing-card">
      <h2>推荐的开始方式</h2>
      <p>如果你想最快上手，我建议按这个顺序走：</p>
      <ul class="landing-list">
        <li>先读这个中文入口页，理解整体结构</li>
        <li>再进入 <a href="{{ '/setup/' | relative_url }}">English Setup Wizard</a> 生成配置文件</li>
        <li>把生成结果粘贴回仓库里的 `config/` 文件</li>
        <li>最后去 GitHub Actions 手动运行一次 `Daily Digest`</li>
      </ul>
    </article>

    <article class="landing-card">
      <h2>通知渠道建议</h2>
      <p>不同语言用户的默认习惯不同，所以推荐入口也可以不同。</p>
      <div class="landing-chip-row">
        <span class="landing-chip">English setup → Slack first</span>
        <span class="landing-chip">中文 setup → Server酱 first</span>
        <span class="landing-chip">两边都不锁死，可手动启用任意 sink</span>
      </div>
      <div class="landing-note" style="margin-top: 16px;">
        <strong>当前实现情况</strong>
        目前中文 sink 的首选方向改为 Server酱。它的接入路径对个人用户更轻，当前也更符合“少配置、先跑起来”的目标。
      </div>
      <div class="landing-note" style="margin-top: 16px;">
        <strong>参考入口</strong>
        官方文档入口可以先看
        <a href="https://sct.ftqq.com/sendkey">SendKey 页面</a>。
        如果你还没有账号，也可以用
        <a href="https://sct.ftqq.com/r/21449">这个可选邀请链接</a>
        注册；它只是可选入口，不影响你直接使用官方主页。
      </div>
    </article>

    <article class="landing-card">
      <h2>你现在就能做什么</h2>
      <p>即使还没接入 Server酱 sink，中文用户现在也可以完整跑通主流程。</p>
      <ul class="landing-list">
        <li>用 wizard 生成 `sources.yaml` 和各 extension 配置</li>
        <li>把 `OPENROUTER_API_KEY` 放进 GitHub Secrets</li>
        <li>先使用网站输出作为主要阅读入口</li>
        <li>如果需要即时通知，当前可先启用 Slack sink，后续再切到 Server酱</li>
      </ul>
    </article>
  </section>

  <section class="landing-highlight">
    <h2>关于中文 setup 的定位</h2>
    <div class="landing-dual">
      <div>
        <p>
          这里的目标不是把中文用户直接扔进一套陌生英文配置页，而是先给出
          中文上下文、推荐路径和常见决策，再进入实际配置流程。
        </p>
        <div class="landing-note">
          <strong>现在</strong>
          中文入口页负责解释路径、推荐 sink、连接 README_zh、wizard 和 manual guide。
        </div>
      </div>
      <div>
        <p>
          后续可以继续演进为真正完整的中文 wizard，包括中文字段说明、中文
          helper text，以及针对中国用户更自然的通知推荐。
        </p>
        <div class="landing-note">
          <strong>下一步</strong>
          补 Server酱 sink，再把中文 setup 从“入口页”进一步升级成更完整的中文向导。
        </div>
      </div>
    </div>
  </section>

  <section class="landing-cta-strip">
    <div class="landing-kicker">next</div>
    <h2>准备好了就进入配置。</h2>
    <p>
      如果你希望最快拿到配置文件，就直接进入现有 wizard。  
      如果你更喜欢先看完整说明，也可以先从中文 README 开始。
    </p>
    <div class="landing-actions">
      <a class="landing-button primary" href="{{ '/setup/' | relative_url }}">打开 Setup Wizard</a>
      <a class="landing-button secondary" href="https://github.com/YuyangXueEd/MyDailyUpdater/blob/main/README_zh.md">中文 README</a>
    </div>
  </section>
</div>
