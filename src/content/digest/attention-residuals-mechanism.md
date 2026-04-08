---
title: "Attention Residuals Mechanism"
type: concept
created: 2026-04-08
updated: 2026-04-08
sources: [attention-residuals-2603.15031.pdf]
tags: [residual-connections, attention, depth-wise-attention, cross-layer-connectivity, transformer]
---

# Attention Residuals Mechanism

The **Attention Residuals (AttnRes) mechanism** replaces fixed, uniform residual accumulation in [[transformer-architecture|Transformers]] with learned, input-dependent softmax attention over preceding layer outputs. Introduced in [[attention-residuals]], it allows each layer to selectively aggregate earlier representations with content-dependent weights, generalizing standard [[residual-connections]] from depth-wise linear attention to depth-wise softmax attention.

## Formal Definition

In a standard residual network, the hidden state at layer l is:

> h_l = h_1 + sum_{i=1}^{l-1} f_i(h_i)

where every preceding layer output contributes with fixed unit weight. AttnRes replaces this with:

> h_l = sum_{i=0}^{l-1} alpha_{i->l} * v_i

where alpha_{i->l} are attention weights satisfying sum_{i=0}^{l-1} alpha_{i->l} = 1, and the values are defined as:

> v_0 = h_1 (token embedding)
> v_i = f_i(h_i) for i >= 1 (layer outputs)

The attention weights are computed via a softmax-normalized kernel:

> alpha_{i->l} = phi(q_l, k_i) / sum_{j=0}^{l-1} phi(q_l, k_j)

where phi(q, k) = exp(q^T RMSNorm(k)), and the queries and keys are defined as:

> q_l = w_l (a learned pseudo-query vector in R^d)
> k_i = v_i (keys equal values)

## The Pseudo-Query Design Choice

A central design decision is that the query q_l = w_l is a **learned parameter decoupled from the layer's forward computation**. This decoupling has critical practical implications:

1. **Parallel computation**: Because w_l does not depend on h_l or any intermediate hidden state, attention weights for any group of layers can be computed in parallel without waiting for their sequential outputs. This is the key enabler of the two-phase computation strategy used in inference (see [[block-attention-residuals]]).

2. **Minimal overhead**: Each layer adds only a single d-dimensional vector (the pseudo-query) plus one RMSNorm, amounting to a negligible fraction of total parameters.

3. **Zero initialization**: All pseudo-queries are initialized to zero, which makes the initial attention weights uniform across source layers. This reduces AttnRes to an equal-weight average at the start of training, preventing volatility and allowing the model to gradually learn selective depth-wise aggregation.

An input-dependent query (projected from the current hidden state) was tested in ablations and further lowers loss (1.731 vs 1.737), but it requires a d x d projection per layer and forces sequential memory access during decoding, making it impractical at scale.

## RMSNorm on Keys

The RMSNorm applied inside the kernel function phi serves a critical normalization role: it prevents layers with naturally large-magnitude outputs from dominating the softmax attention distribution. This is especially important because:

- Under [[prenorm-layer-normalization|PreNorm]], output magnitudes tend to grow with depth (the [[prenorm-dilution]] problem).
- In [[block-attention-residuals|Block AttnRes]], block representations accumulate over multiple layers and can develop substantial magnitude differences.

Without RMSNorm, ablations show degraded performance for both Full AttnRes (1.743 vs 1.737) and Block AttnRes (1.750 vs 1.746).

## How AttnRes Generalizes Standard Residuals

The paper establishes a unified view through a **depth mixing matrix** M in R^{L x L}, where M_{i->l} is the weight that layer l assigns to the output of layer i (see [[depth-wise-attention]] for the full structured-matrix analysis).

### Standard Residuals as Depth-Wise Linear Attention

Standard residual connections produce M_{i->l} = 1 for all i < l -- an all-ones lower-triangular matrix. This is equivalent to applying **uniform linear attention** over the depth dimension: every preceding layer receives equal, fixed weight.

### Highway Networks as Stick-Breaking Attention

[[highway-networks]] produce weights M_{i->l} that factor through scalar gates (1-semiseparable structure). The cumulative gate products naturally sum to one, making Highway an instance of stick-breaking attention over depth -- still linear, but with input-dependent coefficients.

### Hyper-Connections as Multi-State Linear Attention

[[hyper-connections]] (m)HC maintain m parallel streams with learned transition matrices A_l. The unrolled weight M_{i->l} = beta_i^T A_{i+1->l}^x alpha_l can be interpreted as depth-wise linear attention with matrix-valued states, where alpha_l acts as a query, beta_i as a key, and the cumulative transition A_{i+1->l}^x as a depth-relative positional operator. The m streams correspond to state expansion along the depth axis (m-semiseparable structure).

### AttnRes as Depth-Wise Softmax Attention

AttnRes computes M_{i->l} = alpha_{i->l} via phi(w_l, k_i) = exp(w_l^T RMSNorm(k_i)) with softmax normalization. This yields a **dense, rank-L** mixing matrix with input-dependent, content-aware weights. AttnRes thus completes for the depth dimension the same linear-to-softmax transition that proved transformative for sequence modeling when [[attention-is-all-you-need|Transformers]] replaced RNNs.

## Comparison with DenseFormer

[[denseformer]] also grants each layer access to all previous layer outputs, but combines them with **fixed, input-independent scalar coefficients** (the alpha weights in [[depth-weighted-averaging]]).

| Property | DenseFormer | AttnRes |
|---|---|---|
| Weight type | Static (learned scalars, fixed after training) | Dynamic (input-dependent via softmax) |
| Weight dimension | Scalar per source-target pair | d-dimensional pseudo-query per target layer |
| Content dependence | None | Yes (softmax over RMSNorm'd outputs) |
| Normalization | None | Softmax (competitive, forces selection) |
| Ablation result | 1.767 (no gain over baseline 1.766) | 1.737 (Full) / 1.746 (Block) |

The ablation finding is striking: DenseFormer shows no improvement over the baseline in the AttnRes paper's setup, underscoring that **input-dependent weighting is essential** -- static scalar weights are insufficient for effective depth-wise aggregation.

## Comparison with Hyper-Connections

[[hyper-connections]] address the same depth-wise information flow problem via a fundamentally different approach: expanding the single residual stream into m parallel streams connected by learned mixing matrices.

| Property | Hyper-Connections (mHC) | AttnRes |
|---|---|---|
| Information access | Layer l sees only h_{l-1} (m streams) | Layer l sees all v_0, ..., v_{l-1} |
| Mechanism | Multi-stream recurrence with mixing matrices | Cross-layer softmax attention |
| Weight dependence | Input-dependent (DHC variant) | Input-dependent (via pseudo-query) |
| Memory per layer | m * d (multiple streams) | O(Ld) full / O(Nd) block |
| Per-layer I/O | 34d (m=4 streams) | 5.5d (Block AttnRes) |
| Structured matrix rank | m-semiseparable | Dense (rank L) |
| Ablation result | 1.747 | 1.737 (Full) / 1.746 (Block) |

AttnRes provides **direct selective access** to individual earlier-layer outputs, whereas mHC must propagate information through the recurrence (even with multiple streams). AttnRes achieves better or equal loss at lower per-layer memory I/O. The two approaches are orthogonal and could potentially be combined.

## Softmax vs Sigmoid

Replacing softmax with sigmoid normalization degrades performance (1.741 vs 1.737). The paper attributes this to softmax's **competitive normalization**: it forces sharper selection among depth sources because probability mass allocated to one source is taken away from others. Sigmoid allows all sources to have high weight simultaneously, reducing selectivity.

## Multihead Attention Over Depth

Testing per-head depth aggregation (H=16 heads, each channel group attending to different source layers independently) hurts performance (1.752 vs 1.746 for Block AttnRes). This indicates that the optimal depth-wise mixture is **uniform across channels**: when a layer's output is relevant, it is relevant as a whole, not just for certain feature dimensions. This contrasts with sequence-wise [[self-attention]], where multi-head decomposition is essential.

## Related Pages

- [[attention-residuals]] -- Source summary of the paper introducing this mechanism
- [[block-attention-residuals]] -- The scalable block variant
- [[depth-wise-attention]] -- The theoretical framework: attention over the depth dimension
- [[prenorm-dilution]] -- The problem this mechanism addresses
- [[residual-connections]] -- The standard approach this generalizes
- [[denseformer]] -- Prior work using static cross-layer weights
- [[depth-weighted-averaging]] -- The DWA technique from DenseFormer
- [[hyper-connections]] -- Multi-stream alternative approach
- [[multi-stream-residuals]] -- Broader discussion of multi-stream architectures
- [[self-attention]] -- The attention mechanism adapted for depth
- [[layer-normalization]] -- RMSNorm used on keys
