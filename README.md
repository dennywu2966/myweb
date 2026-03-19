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

| 环境 | URL | 说明 |
|------|-----|------|
| 本地开发 | http://localhost:4321 | `bun run dev` |
| Staging | https://www.winter-prosper.com/staging | main 分支自动部署 |

### GitHub Actions 自动部署

PR 合并到 `main` 分支后自动触发部署到 staging 环境。

#### 需配置的 GitHub Secrets

| Secret | 说明 | 示例值 |
|--------|------|--------|
| `STAGING_HOST` | 服务器地址 | `www.winter-prosper.com` |
| `STAGING_USER` | SSH 用户名 | `web` |
| `STAGING_SSH_KEY` | SSH 私钥 | `-----BEGIN OPENSSH PRIVATE KEY-----...` |

#### 首次部署步骤

1. SSH 登录服务器：`ssh web@www.winter-prosper.com`
2. 创建目录：`mkdir -p ~/projects/staging/myweb`
3. 运行服务器初始化脚本（需要 sudo）：
   ```bash
   curl -fsSL https://raw.githubusercontent.com/dennywu2966/myweb/main/infra/server-setup.sh | bash
   ```
4. 确保域名 proxy 已配置：将 `/staging` 路由到服务器的 port 8080

#### 部署流程

1. 创建 PR 并合并到 `main` 分支
2. GitHub Actions 自动：
   - 检出代码
   - 安装 bun 依赖
   - 构建静态文件 (`dist/`)
   - 通过 SSH rsync 同步到 `~/projects/staging/myweb/dist/`
   - 重启 Docker 容器

### Docker 自愈与自启动

Staging 环境使用 `restart: always` 策略：
- 服务器重启后容器自动启动
- 容器崩溃后自动重启
- 使用 nginx:alpine 镜像，保持轻量

### 本地手动部署

```bash
# 同步 dist 到 staging 服务器
rsync -avz --delete ./dist/ web@www.winter-prosper.com:~/projects/staging/myweb/dist/
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
