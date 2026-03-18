---
title: "Agent memory 的写入时机"
date: 2024-03-18
tags: ["agent", "memory"]
---

Agent 什么时候该写 memory？现在的 agent 基本靠启发式规则或人工设定。更理想的方式可能是根据"信息价值"动态决定——但这需要 agent 能评估自己的知识边界，而这是很难的。

一个折中方案：让 agent 在每次任务完成后做简短的"知识更新报告"，作为 memory 写入的触发信号。
