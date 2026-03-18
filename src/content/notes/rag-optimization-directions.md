---
title: "RAG 系统的三个优化方向"
date: 2024-01-03
tags: ["RAG", "retrieval", "LLM"]
---

RAG（Retrieval Augmented Generation）系统的优化空间主要在三个方向：

**检索优化**：query rewriting、hybrid search、reranking... 让检索结果更相关。

**生成优化**：prompt engineering、context compression、answer synthesis... 让模型更好地利用检索结果。

**迭代优化**：多轮查询、self-RAG、active retrieval... 让系统能够动态调整检索策略。

实践中发现，很多团队只优化检索，不优化生成。实际上，生成侧的优化往往投入产出比更高——因为检索结果的提升空间有限，而好的 prompt 设计可以让同样的检索结果发挥更大价值。
