---
title: "Hyper-Connections"
type: source-summary
created: 2026-04-08
updated: 2026-04-08
sources: [hyper-connections-2409.19606.pdf]
tags: [residual-connections, transformer, depth, pre-training, iclr-2025, bytedance]
---

# Hyper-Connections

**Paper**: "Hyper-Connections" by Defa Zhu, Hongzhi Huang, Zihao Huang, Yutao Zeng, Yunyao Mao, Banggu Wu, Qiyang Min, Xun Zhou (Seed-Foundation-Model Team, ByteDance). Published at ICLR 2025. arXiv:2409.19606.

## Summary

Hyper-Connections (HC) are a drop-in replacement for [[residual-connections]] in [[transformer-architecture]] models. The method addresses the fundamental **seesaw effect** between gradient vanishing and representation collapse that plagues standard residual variants (Pre-Norm and Post-Norm). The core idea is to expand the single residual stream into **n parallel hidden streams** connected by learnable mixing matrices, forming a [[multi-stream-residuals]] architecture. This gives the network the ability to autonomously learn connection strengths between layers at different depths, rather than having them fixed by architectural choice.

## Motivation

Standard [[residual-connections]] come in two main flavors, each with a well-known weakness:

- **Pre-Norm** (normalize before the block): solves gradient vanishing but causes **representation collapse** -- hidden features in deep layers become highly similar, limiting the contribution of additional layers.
- **Post-Norm** (normalize after the block): reduces representation collapse but reintroduces **gradient vanishing**.

The authors show that both Pre-Norm and Post-Norm can be expressed as special cases of hyper-connections with expansion rate n=1 and fixed (non-trainable) weights. Hyper-connections generalize this by making the connection weights learnable and expanding the hidden state into multiple streams.

## Method

### Static Hyper-Connections (SHC)

The input hidden vector h is replicated n times to form a **hyper hidden matrix** H of shape (n x d). Each layer receives this matrix and produces an updated version through a learnable connection matrix HC of size (n+1) x (n+1). This matrix decomposes into two components:

1. **Depth-connections** (DC): weighted sums between the layer output and each hidden stream -- a generalized residual connection with learnable input/output weights per stream.
2. **Width-connections** (WC): information exchange between the n hidden streams within the same layer, enabling cross-stream communication.

At the end of the network, the n streams are summed row-wise to produce the final hidden vector.

### Dynamic Hyper-Connections (DHC)

The connection matrix entries can depend on the input H itself, making them **input-dependent**. Dynamic weights are produced via a linear projection with normalization and tanh activation, added to the static base matrix. This allows per-token adaptive layer arrangements. DHC outperforms SHC, especially at higher expansion rates.

### Initialization

The static matrices are initialized so that at initialization, hyper-connections are equivalent to Pre-Norm residual connections. Dynamic weight parameters (W_beta, W_m, W_r) are initialized to zero, so the dynamic component starts as a no-op.

## Key Theoretical Insight: Sequential-Parallel Duality

With n=2, specific values of the connection matrix can reproduce either a purely sequential arrangement of layers or a parallel arrangement (similar to [[parallel-transformer-blocks]]). Hyper-connections learn a **soft mixture** of sequential and parallel configurations, or even a dynamic per-token arrangement (with DHC). This means the network can discover arrangements that surpass both pure sequential and pure parallel designs.

## Experimental Results

All experiments use the OLMo/OLMoE training setup with 500B tokens.

### Expansion Rate Ablation (OLMo-1B)

| Method | V2 Loss | V3 Loss | Downstream Avg |
|---|---|---|---|
| OLMo-1B (baseline) | 2.811 | 2.544 | 62.5% |
| DHC x1 | 2.819 | 2.556 | 62.3% |
| DHC x2 | 2.802 | 2.534 | 63.0% |
| DHC x4 | 2.781 | 2.514 | 63.8% |
| DHC x8 | 2.778 | 2.516 | 62.8% |

- **n=1 does not help** -- the seesaw effect persists with a single stream.
- **n=4** is the sweet spot, with diminishing returns at n=8.
- Training is more stable with HC; no loss spikes observed in any HC experiment.

### 7B Dense Models

OLMo-7B-DHCx4 outperforms the baseline across all metrics (V2 loss -0.022, downstream accuracy 71.0% vs 70.1%) with negligible parameter overhead (+0.023%) and nearly identical FLOPs (13.38G vs 13.36G).

### MoE Models (OLMoE-1B-7B)

The benefits are particularly large for Mixture-of-Experts models:

- Training converges **1.8x faster**.
- +6 points on ARC-Challenge (41.8% -> 47.8%).
- +1.2 points on MMLU Var.

### Comparison with Related Methods

Both **Altup** and **ResiDual** (dual Pre/Post-Norm streams) expand the hidden size similarly but are gradually surpassed by the baseline over long training. HC consistently improves throughout training.

## Visualization Analysis

The learned connection matrix, when unfolded into a dense cross-layer contribution matrix, reveals several patterns:

- **Lambda-shaped pattern**: layers prefer nearby layer outputs (Post-Norm-like decay) but also frequently access bottom layers (Pre-Norm-like pattern) -- a learned mixture of both.
- **Input embedding elimination**: the input word embedding contributes to most layers but is eliminated from the final output layer, which benefits next-token prediction (especially with tied embeddings).
- **Emergent parallel blocks**: PTB-like patterns appear naturally (e.g., layer 11 has minimal contribution to layer 12's input, suggesting they operate in parallel).
- **Attention layers have fewer long-term connections**: FFN outputs have greater magnitudes than attention outputs in the connection matrix, resembling a two-hop residual design.

## Overhead

The extra parameters and compute are negligible:

| Model | HC Params | Total Param Change |
|---|---|---|
| OLMo-1B-SHC x4 | 768 | +0.00007% |
| OLMo-1B-DHC x4 | 394K | +0.033% |
| OLMo-7B-DHC x4 | 1.3M | +0.023% |

## Connections

- Generalizes [[residual-connections]] -- Pre-Norm and Post-Norm are special cases with n=1 and fixed weights
- Related to [[denseformer]] and [[depth-weighted-averaging]] -- these use full cross-layer attention over all previous outputs, while HC achieves similar expressivity with much less overhead via the multi-stream design
- The sequential-parallel duality connects to [[parallel-transformer-blocks]] (Wang, 2021)
- See [[multi-stream-residuals]] for a broader discussion of multi-stream approaches and trade-offs
