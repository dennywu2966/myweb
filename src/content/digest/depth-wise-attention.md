---
title: "Depth-Wise Attention"
type: concept
created: 2026-04-08
updated: 2026-04-08
sources: [attention-residuals-2603.15031.pdf]
tags: [attention, residual-connections, depth, structured-matrices, time-depth-duality, transformer]
---

# Depth-Wise Attention

**Depth-wise attention** is the application of attention mechanisms over the depth (layer) dimension of a neural network, rather than over the sequence (time) dimension. The [[attention-residuals]] paper formalizes this concept through a **time-depth duality** and a **structured-matrix analysis**, showing that standard [[residual-connections]] and prior recurrence-based variants correspond to depth-wise linear attention, while [[attention-residuals-mechanism|Attention Residuals (AttnRes)]] performs depth-wise softmax attention.

## The Time-Depth Duality

The paper draws a formal parallel between how information propagates over time in sequence models and how it propagates over depth in layered networks:

| Dimension | Recurrence (Linear) | Attention (Softmax) |
|---|---|---|
| **Time (sequence)** | RNNs: s_t = s_{t-1} + f(s_{t-1}, x_t) | [[self-attention|Self-Attention]]: o_t = sum_i alpha_{i,t} v_i |
| **Depth (layers)** | [[residual-connections|Residuals]]: h_l = h_{l-1} + f_{l-1}(h_{l-1}) | [[attention-residuals-mechanism|AttnRes]]: h_l = sum_i alpha_{i->l} v_i |

Just as RNNs compress all prior time steps into a single hidden state s_t, residual connections compress all prior layer outputs into a single accumulated state h_l. In both cases, the compression is lossy -- information from individual earlier positions/layers cannot be selectively retrieved from the compressed state.

For sequence modeling, the [[transformer-architecture|Transformer]] improved upon RNNs by replacing recurrence with [[self-attention]], allowing each position to selectively access all previous positions with data-dependent weights. AttnRes proposes exactly the same transition for the depth dimension.

A key practical difference: unlike sequence length (which can reach millions of tokens), network depth is typically modest (L < 1000), making O(L^2) attention over depth computationally feasible without approximation.

## Connections to Test-Time Training and Fast Weight Programmers

The paper links this duality to the Test-Time Training (TTT) framework (Sun et al., 2024), which casts each recurrent step as gradient descent on a self-supervised loss:

> W_t = W_{t-1} - eta * grad_ell(W_{t-1}; x_t)

When the loss function is linear, this reduces to vanilla linear attention: S_t = S_{t-1} + k_t v_t^T. The standard residual exhibits the same additive form along depth, with h_l serving as the state and each layer f_l acting as one "gradient step."

This correspondence extends to richer variants:

| Sequence-Side Method | Depth-Side Counterpart |
|---|---|
| Data-dependent gates (RetNet, Mamba) | [[highway-networks]] |
| Delta rule (DeltaNet, Gated Delta Networks) | Deep Delta Learning (DDL) |
| Gated Linear Attention (GLA) | MRLA (Cross-Layer Retrospective Retrieving) |
| Linear attention with state expansion | [[hyper-connections]] (mHC) |
| **Softmax attention (Transformer)** | **AttnRes** |

All methods above the line refine the recurrent update while remaining within the recurrence paradigm. AttnRes goes further by replacing depth-wise recurrence with direct cross-layer attention, completing the analogy.

## The Structured-Matrix View

The paper formalizes depth-wise information flow through a **depth mixing matrix** M in R^{L x L}, where M_{i->l} is the weight that layer l assigns to the output of layer i. The input to layer l is:

> h_l = sum_{i=0}^{l-1} M_{i->l} v_i

where v_0 = h_1 (embedding) and v_i = f_i(h_i) for i >= 1. Different residual variants produce different structures in M, which can be analyzed through the **semiseparable rank** of M -- a unified lens from structured matrix theory.

### Standard Residuals: All-Ones Lower Triangular

M_{i->l} = 1 for all i < l. An all-ones lower-triangular matrix. Semiseparable rank 1. This is uniform linear attention over depth -- every prior output receives equal, fixed weight.

```
M = | 1         |
    | 1  1      |
    | 1  1  1   |
    | 1  1  1  1|
```

### Highway Networks: 1-Semiseparable with Scalar Gates

[[highway-networks]] produce weights M_{0->l} = gamma_{1->l} (carry product for embedding) and M_{i->l} = g_{i+1} * gamma_{i+1->l} for i >= 1, where gamma_{i->l} = product_{j=i+1}^{l} (1-g_j) is the cumulative carry product. The cumulative products factor through scalar gates, so M is **1-semiseparable** -- the same rank as standard residuals but with input-dependent weights. The weights sum to one by construction, making Highway a softmax-free instance of **stick-breaking attention** over depth.

### (m)HC: m-Semiseparable with Matrix Transitions

[[hyper-connections]] (m)HC maintain m parallel streams with learned m x m transition matrices A_l. The unrolled weight is:

> M_{i->l} = beta_i^T A_{i+1->l}^x alpha_l

where A_{i+1->l}^x = product_{k=i+1}^{l} A_k. The m x m transitions render M **m-semiseparable**. In the attention interpretation:
- alpha_l acts as a **query** issued by layer l
- beta_i serves as a **key** summarizing the contribution of layer i
- A_{i+1->l}^x acts as a **depth-relative positional operator**

The m parallel streams correspond to state expansion along the depth axis, expanding the recurrent state from d to d x m. Notably, removing A_{i+1->l}^x (replacing it with identity) still yields competitive performance, highlighting that state expansion -- not the transition dynamics -- drives most of the benefit.

### Full AttnRes: Dense, Rank-L

M_{i->l} = alpha_{i->l} via phi(w_l, k_i) = exp(w_l^T RMSNorm(k_i)) with softmax normalization. The mixing matrix is **dense and rank-L** -- every entry is input-dependent and computed through content-aware softmax attention. This is the depth-wise analog of full softmax attention over sequences.

### Block AttnRes: Rank Between N and N+S

[[block-attention-residuals|Block AttnRes]] partitions layers into N blocks. For sources in a completed earlier block B_n, all share the block-level key/value b_n, so M_{i->l} = alpha_{n->l} for every i in B_n. Within the current block, each layer additionally attends over the evolving partial sum. The effective rank of M lies between N (all intra-block contributions collapsed) and N+S (where S is the block size), interpolating between standard residuals (N=1) and Full AttnRes (N=L).

## Prior Residuals as Depth-Wise Linear Attention

The structured-matrix perspective reveals that all existing residual variants prior to AttnRes perform **linear attention over depth**. The (m)HC weight M_{i->l} = beta_i^T A_{i+1->l}^x alpha_l admits a natural attention interpretation where the query-key interaction is linear (factored through matrix products) rather than softmax-normalized.

When the kernel phi decomposes as phi(q, k) = phi_map(q)^T phi_map(k) for some feature map phi_map, depth-wise attention collapses into a recurrence -- precisely the structure underlying the MRLA-GLA and DDL-DeltaNet correspondences. AttnRes avoids this collapse by using the exponential kernel with softmax normalization.

## Practical Implications

The structured-matrix perspective serves two purposes:

1. **Analytical insights**: The input-dependent M of AttnRes reveals **depth-wise attention sinks** -- certain layers consistently attract high weight regardless of input, mirroring the attention sink phenomenon observed in sequence-wise attention. The embedding (v_0) persistently receives non-trivial weight in most layers, functioning as a depth-wise attention sink.

2. **Design guidance**: It exposes which properties of the kernel phi matter. Future work could explore memory-efficient (e.g., linear-complexity) alternatives to softmax over depth, drawing on the rich toolkit developed for sequence-wise attention.

## Related Pages

- [[attention-residuals]] -- The paper introducing depth-wise softmax attention
- [[attention-residuals-mechanism]] -- Formal definition of the AttnRes mechanism
- [[block-attention-residuals]] -- Block variant with intermediate rank
- [[residual-connections]] -- Standard residuals as all-ones M
- [[highway-networks]] -- 1-semiseparable M with learned gates
- [[gating-mechanism]] -- The gates used in Highway networks
- [[hyper-connections]] -- m-semiseparable M via multi-stream recurrence
- [[multi-stream-residuals]] -- Multi-stream approaches as state expansion
- [[denseformer]] -- Static cross-layer weights (rank-L but input-independent)
- [[depth-weighted-averaging]] -- The static weighting scheme from DenseFormer
- [[self-attention]] -- The sequence-side counterpart to depth-wise attention
- [[attention-is-all-you-need]] -- The paper that introduced softmax attention over sequences
- [[transformer-architecture]] -- The architecture bridging both dimensions
- [[prenorm-dilution]] -- The problem motivating depth-wise attention
