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

### Docker 本地构建

```bash
cd infra/docker
docker compose up -d
```

### 远程服务器部署

```bash
# 首次部署
ssh user@server
cd /opt/denny-site
git clone https://github.com/denny/denny-site.git .
docker compose up -d

# 更新部署
git pull
docker compose up -d --build
```

### GitHub Actions 自动部署

推送到 main 分支自动触发构建和部署。

需要配置的 GitHub Secrets：

| Secret | 说明 |
|--------|------|
| `ECS_HOST` | ECS 服务器 IP |
| `ECS_USER` | SSH 用户名 |
| `ECS_SSH_KEY` | SSH 私钥 |

### 部署流程

1. 代码推送到 `main` 分支
2. GitHub Actions 自动构建 Docker 镜像
3. 镜像推送到 GitHub Container Registry
4. SSH 登录 ECS 服务器
5. 服务器拉取新镜像并重启容器

### 回滚

```bash
ssh user@server
cd /opt/denny-site
docker compose pull
docker compose up -d
```

## 功能特性

- 响应式设计，支持桌面和移动端
- 浅色 / 深色 / 跟随系统 三种主题模式
- RSS feeds (文章 / Notes)
- Sitemap
- SEO 优化
- Open Graph / Twitter Card
- 支持 Wiki-style 双链语法 `[[note-slug]]`

## License

MIT
