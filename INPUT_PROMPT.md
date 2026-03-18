# 给 OpenCode 的 Prompt v2：生成并部署我的个人网站

你是一个资深全栈工程师 + 设计工程师。请直接为我生成一个**可运行、可部署、可长期维护**的个人网站项目，不要只给方案，要直接输出完整项目代码、目录结构、关键页面、样式、内容文件、Docker 部署方案和 GitHub Actions 自动发布流程。

## 1. 项目目标

为我生成一个**技术 I 人风格**的中文个人网站：

* 主站整体气质参考：**Armin Ronacher** 的个人站（域名：`lucumr.pocoo.org`）
* 首页介绍方式参考：**Lee Robinson** 的个人站（域名：`leerob.com`）
* Notes 页面机制参考：**Baldur Bjarnason Notes Archive**（域名：`notes.baldurbjarnason.com`）

注意：

* 只能**参考信息架构、视觉气质、交互模式**，不能直接复制任何站点的源码、文案、素材、版式细节或视觉资源。
* 目标不是做成营销官网，也不是做成开源明星主页。
* 目标是一个**技术负责人 + 长文写作者 + notes 型研究者**会长期使用的个人网站。

## 2. 技术要求

### 技术栈优先级

* 默认使用 **bun**
* 默认使用 **Astro + TypeScript + MDX + Tailwind CSS**
* 只有在实现明显受限时，才回退到 Next.js
* 必须输出：

  * `package.json`（bun 可直接运行）
  * 完整目录结构
  * 所有关键页面代码
  * 内容集合配置
  * 文章与 notes 示例内容
  * RSS
  * sitemap
  * robots.txt
  * README

### 工程要求

* 代码整洁，可维护，可扩展
* 组件化，不要单文件堆砌
* 内容与展示分离
* 所有内容页支持 Markdown/MDX
* 静态优先，首屏快，SEO 友好
* 响应式设计，桌面和手机都要自然
* 支持浅色 / 深色 / 跟随系统三种模式
* 无障碍友好
* 字体和排版以中英文混排舒适为目标
* 不要引入重量级、没有必要的动画

## 3. 网站定位

这个网站的主人是：

* 关注搜索、AI 基础设施、复杂工程系统的技术负责人
* 同时持续写作、做技术判断和长期知识沉淀
* 当前重点方向包括：

  * AI coding agent 与 AI-native engineering
  * memory / context / agent runtime
  * 检索 / 向量系统 / 数据底座
  * 大规模平台架构、质量、稳定性、安全
  * 自动驾驶 / embodied AI / 数据闭环

网站要传达的感觉：

* 冷静
* 克制
* 专业
* 安静
* 可信
* 长期主义

不要传达这些感觉：

* 过度炫技
* 营销感过强
* 社媒网红感
* 花哨的 landing page
* 密密麻麻堆项目卡片

## 4. 信息架构

请直接实现以下导航结构：

* 首页
* 文章
* 归档
* 项目
* 演讲
* Notes
* 关于

可选附加：

* RSS
* Uses
* Now

其中：

* **首页**：简约介绍 + 少量代表文章/notes
* **文章**：正式博客文章列表
* **归档**：按年份归档所有正式文章
* **项目**：少量高质量项目，不做巨量卡片墙
* **演讲**：演讲/分享记录
* **Notes**：时间流式短笔记
* **关于**：更完整的自我介绍、方向、联系方式

## 5. 首页要求

首页必须简约，不要堆很多模块。

### 首页第一屏结构

1. 名字 / 英文名
2. 一段很短的中文介绍
3. 一段稍展开的中文介绍
4. 3~6 篇精选文章或专题入口
5. 最近几条 notes
6. 简单导航入口

### 首页中文文案基线

请直接用下面这版作为默认首页介绍，并做适度润色，但不要写得油腻：

**Denny**

我在做搜索、AI 基础设施和复杂工程系统，也持续记录思考。
现在主要关注 agent、memory、检索与向量系统，以及 AI-native 的工程方法。

我喜欢把复杂问题拆开、想透、写清楚。
这里会放我的文章、notes、项目，以及一些还没有长成正式文章的想法。

### 首页风格要求

* 参考 `leerob.com` 的“短介绍 + 少量精选内容”表达方式
* 但整体视觉气质更靠近 `lucumr.pocoo.org`：低刺激、可长期阅读
* 不要首页大面积 Hero 图
* 不要花哨插画
* 不要夸张按钮
* 不要展示一堆社交媒体图标
* 联系方式只需低调放在页脚或 About

## 6. Notes 页面要求

Notes 页面直接走“轻量时间流”路线，参考 `notes.baldurbjarnason.com/archive/` 的机制。

### Notes 的底层内容管理要求

* **不要强绑定 Obsidian**，默认不要依赖 Obsidian 专有格式或插件才能工作。
* 采用 **普通 Markdown/MDX 文件作为底层内容源**，便于 Git 管理、站点构建和长期迁移。
* 但请**兼容 Obsidian 工作流**：

  * Notes 内容目录可直接作为一个 Obsidian Vault 的子目录使用
  * 尽量兼容常见 Obsidian 风格 frontmatter
  * 尽量兼容 `[[双链]]` 语法：

    * 构建时把内部 `[[note-slug]]` 或 `[[标题]]` 尽可能解析为站内链接
    * 若无法解析，给出优雅降级策略
* 不要求实现复杂图谱视图，不做炫技式 knowledge graph

### 目标

让主人可以非常低成本地持续更新：

* 一句话判断
* 链接短评
* TIL
* 研究碎片
* 项目切片

### Notes 页面结构

* 顶部标题：`Notes`
* 一句说明：`记录正在学习、判断、试验和还没长成正式文章的东西。`
* 列表为倒序时间流
* 每条 note 显示：

  * 标题（可选）
  * 正文摘要 / 全文短内容
  * 日期
  * 标签
  * 外部链接（若有）
* 提供独立 note permalink
* 提供 notes archive
* 提供 RSS

### Notes 内容语气

* 简洁
* 判断明确
* 不装饰
* 不发散
* 一条 note 通常 1~6 句话即可

请预置至少 10 条示例 notes，内容方向贴合这些主题：

* agent memory
* 检索质量
* 向量数据库
* AI 工程体系
* 自动驾驶数据闭环
* 大模型 infra

## 7. 文章系统要求

### Blog / 文章列表页

* 简洁的标题列表或标题 + 摘要列表
* 支持标签
* 支持阅读时长
* 支持发布日期
* 支持置顶 2~3 篇

### 归档页

* 按年份归档
* 风格简洁，偏老派技术博客
* 易扫读

### 文章内容页

* 排版要适合长文阅读
* 代码块样式清楚
* 引用块克制
* 标题层级清晰
* 支持目录（桌面端可选）
* 支持上一篇 / 下一篇

请预置至少 5 篇示例文章，标题和摘要贴合以下方向：

1. AI coding agent 与工程体系升级
2. 检索、向量与 memory 的边界
3. 为什么长期记忆系统先死在写入质量
4. 大规模平台里质量与稳定性不是“补丁”
5. 自动驾驶数据平台为什么需要 search + vector + OLAP

## 8. 项目页要求

项目页不要做成作品集炫耀墙。

只放少量重点项目，每个项目包含：

* 名称
* 一句话简介
* 技术关键词
* 链接占位
* 当前状态

请预置 4~6 个示例项目，主题贴合：

* agent memory harness
* AI-native engineering workflow
* search + vector + OLAP architecture
* auto-driving casehub
* reproducible dev environment

## 9. About 页要求

About 页可以稍微完整，但仍然要克制。

建议结构：

* 一段更完整的自我介绍
* 当前关注方向
* 写作主题
* 工作方式 / 偏好
* 联系方式

默认中文语气：

* 专业
* 平静
* 不自夸
* 不做鸡血式表达

## 10. 视觉与设计系统

请生成一个简约、美观、技术感但不过冷的设计系统。

### 设计原则

* 留白充足
* 字体舒适
* 行宽克制
* 层次清楚
* 边框和分隔线尽量轻
* 颜色收敛
* 可长期阅读

### 视觉方向

* 接近高质量技术博客，不是 SaaS landing page
* 有现代感，但不要过分像 startup 营销页
* 首页和列表页应低刺激
* Notes 页尤其要像“可长期住的地方”

### UI 细节

* 页面最大宽度不要过宽
* 顶部导航简单
* 卡片尽量少
* 鼠标悬停效果轻量
* 深色模式不要纯黑
* 浅色模式不要刺眼
* 页脚低调，包含 RSS / GitHub / Email 等简洁入口

## 11. SEO / Feed / 元信息

请实现：

* sitemap
* robots.txt
* RSS for blog
* RSS for notes
* Open Graph meta
* Twitter/X meta
* canonical
* 站点标题与描述

默认站点信息：

* site title: `Denny`
* site subtitle: `Search, AI infrastructure, engineering systems, and notes.`
* language: `zh-CN`

## 12. 内容组织方式

请使用内容集合或类似方案，把以下内容分开管理：

* blog posts
* notes
* projects
* talks
* pages

推荐目录示例：

```txt
src/
  components/
  layouts/
  pages/
  content/
    blog/
    notes/
    projects/
    talks/
    pages/
  styles/
public/
infra/
  docker/
.github/
  workflows/
```

## 13. Docker 与部署要求

### 部署目标

部署到一台**远程 Linux 服务器（ECS）**。

### 必须实现

* 使用 **Docker** 部署
* 输出：

  * `Dockerfile`
  * `.dockerignore`
  * `docker-compose.yml`（如有必要）
  * 生产环境运行说明
* 尽量采用**多阶段构建**
* 最终运行镜像尽量小
* 静态站点优先，可通过 Nginx 或轻量静态文件服务器提供服务

### GitHub + GitHub Actions 自动发布要求

我会在本地开发，代码推送到 GitHub 仓库后，希望**快速自动同步发布到远程 ECS**。

请直接实现一套可落地的 CI/CD：

* 当推送到 `main` 分支时自动触发部署
* 使用 **GitHub Actions** 构建与发布
* 部署方式优先采用以下两种之一，并在 README 中说明利弊：

  1. GitHub Actions 通过 SSH 登录 ECS，拉取最新代码并重建 Docker 容器
  2. GitHub Actions 构建 Docker 镜像并推送到镜像仓库，然后 ECS 拉取新镜像重启容器
* 请默认实现其中一种完整方案，且给出另一种作为可选方案说明

### 推荐默认方案

优先实现：

* GitHub Actions 构建镜像
* 推送到 GitHub Container Registry（GHCR）或其他通用镜像仓库
* ECS 上通过 `docker compose pull && docker compose up -d` 完成更新

### 需要输出

* `.github/workflows/deploy.yml`
* 需要配置的 GitHub Secrets 列表
* ECS 服务器首次部署步骤
* 更新发布步骤
* 回滚建议

## 14. 输出要求

你不要只解释思路，请直接给出：

1. 完整项目目录树
2. 关键配置文件
3. 所有核心页面代码
4. 核心组件代码
5. 示例内容文件
6. Docker 部署文件
7. GitHub Actions 自动部署文件
8. README（包含 bun 安装、启动、本地开发、生产部署、ECS 发布）
9. 后续如何新增文章 / notes 的说明

## 15. 代码生成约束

* 默认使用 bun 命令
* 不要使用 npm 作为默认命令
* 代码必须能本地直接跑起来
* 不要留大量 `TODO`
* 不要只生成空壳
* 不要省略关键文件
* 对于篇幅很长的文件，可以分段输出，但必须完整

## 16. 示例内容风格

请用**中文**生成示例内容，风格要求：

* 清楚
* 冷静
* 高信息密度
* 少废话
* 不端着
* 适合技术读者

## 17. 一句话总结

帮我生成一个：
**以 `lucumr.pocoo.org` 为主站气质、`leerob.com` 为首页表达方式、`notes.baldurbjarnason.com` 为 notes 机制，并用 Docker + GitHub Actions 自动发布到远程 Linux ECS 的中文技术个人网站**。
它应该适合一个长期写作的技术负责人，而不是开源网红或营销型博主。

