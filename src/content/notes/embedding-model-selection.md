---
title: "Embedding 模型的选型"
date: 2024-01-25
tags: ["embedding", "model"]
---

Embedding 模型选型的一些经验：

**通用场景**：OpenAI 的 text-embedding-ada-002 够用，效果稳定，但有成本和延迟。

**中文场景**：最近的 BGE、InternLM-Embedder 效果不错，开源可控，可以私有化部署。

**专用场景**：如果能做领域 fine-tuning，提升往往很明显。但 fine-tuning 成本高，需要数据量支撑。

评估 Embedding 模型：MTEB 榜单是参考，但不能完全依赖。自己的数据、自己的 query、自己的 metric 才是标准。
