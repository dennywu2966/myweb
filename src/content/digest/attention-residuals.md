---
title: "Attention Residuals"
type: source-summary
created: 2026-04-08
updated: 2026-04-08
sources: [attention-residuals-2603.15031.pdf]
tags: [residual-connections, transformer, depth-wise-attention, prenorm-dilution, scaling-laws, kimi, moonshot-ai]
---

# Attention Residuals

**Paper**: "Attention Residuals: Technical Report of Attention Residuals" by the Kimi Team (Moonshot AI). arXiv:2603.15031v1, March 2026.

**Code**: [github.com/MoonshotAI/Attention-Residuals](https://github.com/MoonshotAI/Attention-Residuals)

## Problem

Standard [[residual-connections]] with [[prenorm-layer-normalization|PreNorm]] are ubiquitous in modern LLMs, yet they accumulate all layer outputs with fixed unit weights. Unrolling the recurrence shows that every layer receives the same uniformly-weighted sum of all prior layer outputs -- the depth-wise aggregation is governed entirely by fixed unit coefficients with no mechanism to selectively emphasize or suppress individual layer contributions. This leads to the [[prenorm-dilution]] problem: hidden-state magnitudes grow as O(L) with depth under PreNorm, progressively diluting each layer's relative contribution. Empirically, a significant fraction of layers can be pruned with minimal loss, suggesting the network is not using depth effectively.

Prior efforts to address this remain limited. Scaled residual paths (DeepNet) and [[multi-stream-residuals]] ([[hyper-connections]]) remain bound to additive recurrence. Methods that do introduce cross-layer access ([[denseformer]], MUDDFormer) use fixed or input-independent weights and are difficult to scale.

## Core Insight: Time-Depth Duality

The paper draws a formal duality between depth-wise accumulation and sequential recurrence in RNNs. Just as RNNs compress all prior time steps into a single hidden state, residual connections compress all prior layer outputs into a single accumulated state h_l. The [[transformer-architecture]] improved upon RNNs by replacing temporal recurrence with [[self-attention]], allowing each position to selectively access all previous positions with data-dependent weights. The paper proposes the same methodology for the depth dimension -- see [[depth-wise-attention]] for a full treatment.

## Full Attention Residuals

Full AttnRes replaces the standard residual accumulation with learned softmax attention over depth. See [[attention-residuals-mechanism]] for the formal definition.

The input to layer l is computed as:

> h_l = sum_{i=0}^{l-1} alpha_{i->l} * v_i

where alpha_{i->l} are softmax attention weights computed via a kernel function phi(q, k) = exp(q^T RMSNorm(k)). The query q_l = w_l is a **learned pseudo-query** -- a layer-specific parameter in R^d that is *decoupled from the forward computation*. Keys and values are the layer outputs themselves: k_i = v_i, with v_0 = h_1 (embedding) and v_i = f_i(h_i) for i >= 1.

Key design choices:

- **Pseudo-query decoupled from computation**: Because w_l is a fixed learned parameter (not projected from the hidden state), attention weights for any group of layers can be computed in parallel without waiting for sequential outputs. This enables the two-phase optimization.
- **RMSNorm on keys**: Prevents layers with large-magnitude outputs from dominating the softmax. Critical for Block AttnRes where block representations can develop large magnitude differences.
- **Zero initialization**: All pseudo-queries are initialized to zero, ensuring uniform attention weights at the start of training (equivalent to equal-weight averaging), preventing training volatility.

Full AttnRes requires O(L^2 d) arithmetic and O(Ld) memory per token. The arithmetic cost is modest since depth L is far smaller than sequence length. The O(Ld) memory overlaps entirely with activations already retained for backpropagation in vanilla training, so there is no additional memory overhead. At scale, however, activation recomputation and pipeline parallelism mean this memory must be explicitly preserved and communicated.

## Block Attention Residuals

To address the O(Ld) memory and communication overhead under distributed training, the paper introduces Block AttnRes. See [[block-attention-residuals]] for full details.

The L layers are partitioned into N blocks. Within each block, layer outputs are accumulated via standard summation into a single block representation b_n. Across blocks, softmax attention is applied over only the N block-level representations plus the token embedding. This reduces both memory and communication from O(Ld) to O(Nd).

Empirically, N ~ 8 recovers most of the benefit of Full AttnRes. The block count N interpolates between two extremes: N = L recovers Full AttnRes, while N = 1 reduces to standard residual connections.

## Infrastructure Optimizations

### Cache-Based Pipeline Communication

Under pipeline parallelism with P physical stages and V virtual stages, naively transmitting all accumulated block representations at every stage transition incurs O(C^2) communication (where C = PV is the total number of chunks). By caching blocks locally -- blocks received during earlier virtual stages remain in memory -- only incremental blocks need to be transmitted at each transition. This reduces peak per-transition cost from O(C) to O(P), a V-fold improvement that enables full overlap with computation during steady-state 1F1B scheduling.

### Two-Phase Computation Strategy

Since pseudo-queries w_l are decoupled from forward computation, all S = L/N queries within a block can be batched:

- **Phase 1**: Computes inter-block attention for all S layers simultaneously via a single batched query against cached block representations, returning outputs and softmax statistics (max and log-sum-exp). Amortizes memory access from S reads to 1.
- **Phase 2**: Computes intra-block attention sequentially for each layer using the evolving partial sum, then merges with Phase 1 outputs via online softmax. The online-softmax merge is elementwise, naturally admitting kernel fusion.

This brings per-layer memory I/O to (N/S + 5)d reads and 2d writes -- substantially lower than alternatives like mHC (34d for m=4 streams). The end-to-end inference latency overhead is less than 2%.

### Memory-Efficient Prefilling

Block representations during prefilling require N * T * d elements (15 GB for 128K tokens, 8 blocks). Sharding along the sequence dimension across P tensor-parallel devices reduces per-device memory to N * (T/P) * d. Combined with chunked prefill (e.g., 16K chunk size), overhead drops to under 0.3 GB per device.

## Scaling Law Results

Five model sizes (194M to 528M activated parameters) were trained in three variants: PreNorm baseline, Full AttnRes, and Block AttnRes (N ~ 8). Power-law fits:

| Variant | Scaling Curve |
|---|---|
| Baseline | L = 1.891 * C^{-0.057} |
| Block AttnRes | L = 1.870 * C^{-0.058} |
| Full AttnRes | L = 1.865 * C^{-0.057} |

All three exhibit similar slopes, but AttnRes consistently achieves lower loss across the entire compute range. At 5.6 PFLOP/s-days, Block AttnRes reaches 1.692 vs the baseline's 1.714, equivalent to a **1.25x compute advantage**. The gap between Full and Block AttnRes narrows with scale, shrinking to 0.001 at the largest size.

Full AttnRes outperforms mHC while Block AttnRes matches it at far lower memory I/O per layer (5.5d vs 34d).

## Integration with Kimi Linear

The method is integrated into the [[kimi-linear]] architecture (48B total / 3B activated MoE) and pre-trained on 1.4T tokens. The model uses 27 Transformer blocks (54 layers) with Block AttnRes at 6 layers per block, producing 9 blocks plus the token embedding for 10 depth-wise sources. Training follows the Kimi Linear recipe: 4096-token context, Muon optimizer, WSD learning rate schedule, 8M-token global batch size. Pre-training proceeds in two stages: (i) WSD pre-training on 1T tokens, followed by (ii) mid-training on ~400B high-quality tokens.

## Training Dynamics Analysis

Comparison of the 48B Baseline and Block AttnRes models over 1T tokens reveals:

- **Validation loss**: AttnRes achieves consistently lower validation loss throughout training, with the gap widening during the decay phase.
- **Output magnitude**: The Baseline exhibits monotonic growth of output magnitudes with depth (the [[prenorm-dilution]] problem), compelling deeper layers to learn increasingly large outputs. Block AttnRes confines this growth within each block -- selective aggregation at block boundaries resets the accumulation, yielding a bounded periodic pattern.
- **Gradient magnitude**: The Baseline shows disproportionately large gradients in the earliest layers (no mechanism to regulate gradient flow). Block AttnRes achieves substantially more uniform gradient distribution across depth, thanks to the learned softmax weights introducing competition among sources for probability mass.

## Downstream Benchmark Results

On the 48B Kimi Linear model, Block AttnRes matches or outperforms the baseline on all evaluated benchmarks:

| Category | Benchmark | Baseline | AttnRes | Delta |
|---|---|---|---|---|
| General | MMLU | 73.5 | 74.6 | +1.1 |
| General | GPQA-Diamond | 36.9 | 44.4 | +7.5 |
| General | BBH | 76.3 | 78.0 | +1.7 |
| Math | Math | 53.5 | 57.1 | +3.6 |
| Math | GSM8K | 81.7 | 82.4 | +0.7 |
| Code | HumanEval | 59.1 | 62.2 | +3.1 |
| Code | MBPP | 72.0 | 73.9 | +1.9 |
| Chinese | CMMLU | 82.0 | 82.9 | +0.9 |
| Chinese | C-Eval | 79.6 | 82.5 | +2.9 |

Improvements are particularly pronounced on multi-step reasoning tasks (GPQA-Diamond +7.5, Math +3.6) and code generation (HumanEval +3.1). This pattern is consistent with improved depth-wise information flow benefiting compositional tasks where later layers selectively retrieve and build upon earlier representations.

## Ablation Study

Ablations on a 16-head model validate key design choices:

| Variant | Val Loss |
|---|---|
| Baseline (PreNorm) | 1.766 |
| [[denseformer|DenseFormer]] | 1.767 |
| mHC | 1.747 |
| Full AttnRes | 1.737 |
| Full AttnRes w/ input-dependent query | 1.731 |
| Full AttnRes w/ input-independent mixing | 1.749 |
| Full AttnRes w/ sigmoid | 1.741 |
| Full AttnRes w/o RMSNorm | 1.743 |
| Block AttnRes (S=4) | 1.746 |
| Block AttnRes w/ multihead (H=16) | 1.752 |
| Block AttnRes w/o RMSNorm | 1.750 |
| Sliding Window (W=1+8) | 1.764 |

Key findings:
- **DenseFormer shows no gain** over baseline (1.767 vs 1.766), highlighting the importance of input-dependent weighting.
- **Input-dependent query** improves to 1.731 but requires d*d projection per layer and sequential memory access -- not practical.
- **Sigmoid vs softmax**: Softmax wins (1.737 vs 1.741) due to competitive normalization forcing sharper selection.
- **Multihead attention hurts** (1.752 vs 1.746), indicating the optimal depth-wise mixture is uniform across channels.
- **Sliding window aggregation** (most recent 8 layers + embedding) improves over baseline but falls well short of both Full and Block AttnRes, suggesting that selectively accessing distant layers matters more than attending to many nearby ones.

## Optimal Architecture Analysis

An architecture sweep under fixed compute (~6.5e19 FLOPs) reveals that AttnRes shifts the optimal depth-width trade-off: the baseline achieves its lowest loss at d_model/L_b ~ 60, whereas AttnRes shifts it to d_model/L_b ~ 45. Since a lower d_model/L_b corresponds to a deeper, narrower network, AttnRes can exploit additional depth more effectively.

## Learned Weight Patterns

Visualization of the depth-wise attention weights reveals:
- **Preserved locality**: Each layer attends most strongly to its immediate predecessor, but selective off-diagonal concentrations emerge (learned skip connections).
- **Layer specialization**: The embedding retains non-trivial weight throughout, especially in pre-attention layers. Pre-MLP inputs show sharper diagonal reliance on recent representations; pre-attention inputs maintain broader receptive fields.
- **Block AttnRes preserves structure**: Diagonal dominance, embedding persistence, and layer specialization all transfer from full to block variant, suggesting block-wise compression acts as implicit regularization.

## Related Pages

- [[attention-residuals-mechanism]] -- The formal AttnRes mechanism and comparisons with prior methods
- [[block-attention-residuals]] -- The scalable block variant for large-scale training
- [[prenorm-dilution]] -- The problem AttnRes solves
- [[depth-wise-attention]] -- The core insight: applying attention over the depth dimension
- [[kimi-linear]] -- The production architecture AttnRes was integrated into
- [[residual-connections]] -- The standard approach AttnRes generalizes
- [[denseformer]] -- Prior work using static scalar weights for cross-layer access
- [[depth-weighted-averaging]] -- The DWA technique that DenseFormer introduced
- [[hyper-connections]] -- Multi-stream residual alternative
- [[multi-stream-residuals]] -- The broader family of multi-stream approaches
- [[prenorm-layer-normalization]] -- The normalization placement whose dilution problem motivates AttnRes
- [[prenorm-vs-postnorm]] -- Tradeoffs between normalization strategies
- [[self-attention]] -- The attention mechanism adapted here for the depth dimension
- [[transformer-architecture]] -- The base architecture
- [[highway-networks]] -- Earlier work on learned gating across depth
