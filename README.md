# Denny Personal Site

技术负责人个人网站，基于 Astro + TypeScript + MDX + Tailwind CSS。

## 技术栈

- **框架**: Astro 4
- **语言**: TypeScript
- **内容**: MDX
- **样式**: Tailwind CSS
- **包管理**: bun

## 快速开始

### 安装 bun

```bash
curl -fsSL https://bun.sh/install | bash
```

### 本地开发

```bash
bun install
bun run dev
```

访问 http://localhost:4321

### 构建生产版本

```bash
bun run build
bun run preview
```

### 类型检查

```bash
bun run check
```

## 项目结构

```
src/
├── components/     # Astro 组件
├── layouts/        # 页面布局
├── pages/          # 页面
│   ├── blog/       # 博客文章
│   ├── notes/      # 短笔记
│   ├── projects/   # 项目
│   └── talks/      # 演讲
├── content/        # 内容集合
│   ├── blog/       # 博客文章
│   ├── notes/      # 短笔记
│   ├── projects/   # 项目
│   └── talks/      # 演讲
├── lib/            # 工具函数
└── styles/         # 全局样式
```

## 添加内容

### 添加博客文章

在 `src/content/blog/` 添加 `.md` 或 `.mdx` 文件：

```markdown
---
title: "文章标题"
description: "文章描述"
pubDate: 2024-01-01
tags: ["tag1", "tag2"]
pinned: true  # 可选，置顶文章
---

文章内容...
```

### 添加 Notes

在 `src/content/notes/` 添加 `.md` 文件：

```markdown
---
title: "Note 标题（可选）"
date: 2024-01-01
tags: ["tag1"]
link: "https://..." # 可选外部链接
---

笔记内容...
```

Notes 支持 Wiki-style 双链语法：`[[note-slug]]` 或 `[[note-slug|显示文本]]`

### 添加项目

在 `src/content/projects/` 添加 `.md` 文件：

```markdown
---
title: "项目名称"
description: "项目描述"
year: 2024
tags: ["Rust", "AI"]
url: "https://github.com/..."
status: "active" # active, paused, archived
---
```

### 添加演讲

在 `src/content/talks/` 添加 `.md` 文件：

```markdown
---
title: "演讲标题"
description: "演讲描述"
date: 2024-01-01
event: "会议名称"
location: "地点"
url: "https://..." # 可选slides链接
---
```

## 部署

### 环境

| 环境 | URL | 触发方式 |
|------|-----|----------|
| 本地开发 | http://localhost:4321 | `bun run dev` |
| Staging | https://staging.winter-prosper.com | push to `main` |
| Production | https://www.winter-prosper.com | GitHub Actions 手动触发 |

### 部署架构

同一台 ECS 服务器，两个独立 nginx vhost。每次部署创建带时间戳的 release 目录，通过 symlink 切换，保留最近 5 个版本用于回滚。

```
/home/web/projects/
  staging/myweb/
    current -> releases/20260407-153000/   (symlink)
    releases/
  production/myweb/
    current -> releases/20260407-160000/   (symlink)
    releases/
```

### GitHub Actions

`.github/workflows/deploy.yml` 支持两种触发：

- **push to main** → 自动部署 staging（`SITE_URL=https://staging.winter-prosper.com`）
- **workflow_dispatch** → 手动选择部署 staging 或 production

### GitHub Secrets

需要在 `staging` 和 `production` 两个 environment 中配置：

| Secret | 说明 |
|--------|------|
| `STAGING_HOST` | 服务器 IP |
| `STAGING_USER` | SSH 用户名 |
| `STAGING_SSH_KEY` | SSH 私钥 |
| `STAGING_SUDO_PASS` | sudo 密码（用于 nginx reload） |

### 回滚

SSH 到服务器，将 `current` symlink 指向之前的 release 目录：

```bash
ln -sfn /home/web/projects/staging/myweb/releases/<previous-timestamp> /home/web/projects/staging/myweb/current
sudo nginx -s reload
```

## 功能特性

- 响应式设计，支持桌面和移动端
- 浅色 / 深色 / 跟随系统 三种主题模式
- RSS feeds (文章 / Notes)
- Sitemap
- SEO 优化
- Open Graph / Twitter Card

## License

MIT
