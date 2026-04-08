---
title: Self-Attention
type: concept
created: 2026-04-08
updated: 2026-04-08
sources: [attention-is-all-you-need-1706.03762.pdf]
tags: [attention, self-attention, scaled-dot-product, multi-head-attention, transformer, mechanism]
---

# Self-Attention

Self-attention (also called intra-attention) is an attention mechanism that relates different positions within a single sequence to compute a contextualized representation of that sequence. It is the core computational primitive of the [[transformer-architecture]], introduced in [[attention-is-all-you-need]].

## Core Idea

In a self-attention layer, every position in the input sequence can directly attend to every other position. This gives the mechanism two critical advantages over recurrence:

1. **Constant path length:** Any two positions are connected in O(1) operations (vs. O(n) for RNNs), making long-range dependencies easier to learn.
2. **Full parallelism:** All positions are processed simultaneously, unlike the inherently sequential computation of recurrent networks.

## Query, Key, Value (Q/K/V) Formulation

Self-attention is formulated as a lookup operation over a set of key-value pairs, guided by a query:

- **Query (Q):** "What am I looking for?" -- the representation of the current position seeking information.
- **Key (K):** "What do I contain?" -- the representation each position advertises for matching.
- **Value (V):** "What information do I provide?" -- the content that gets aggregated into the output.

In self-attention, Q, K, and V all derive from the same input sequence (unlike cross-attention, where Q comes from one sequence and K/V from another).

Each input vector x is linearly projected into three separate vectors:

```
q = xW^Q,   k = xW^K,   v = xW^V
```

where W^Q, W^K, W^V are learned parameter matrices.

## Scaled Dot-Product Attention

The attention weights are computed via dot products between queries and keys, scaled and normalized:

```
Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) V
```

Step by step:

1. **Compute compatibility scores:** Multiply queries by keys transposed: QK^T. Each entry (i, j) measures how much position i should attend to position j.
2. **Scale:** Divide by sqrt(d_k), where d_k is the key dimension. Without scaling, large d_k causes dot products to grow large in magnitude, pushing softmax into saturated regions with near-zero gradients.
3. **Softmax:** Apply row-wise softmax to obtain attention weights that sum to 1 for each query position.
4. **Weighted sum:** Multiply the attention weights by V to produce the output -- a weighted combination of value vectors.

The result is that each output position is a context-dependent blend of all input positions, with weights determined by learned compatibility between queries and keys.

### Why Scale?

If the components of q and k are independent random variables with mean 0 and variance 1, then their dot product has mean 0 and variance d_k. For large d_k, the dot products become large, causing softmax to produce near-one-hot distributions with extremely small gradients. Dividing by sqrt(d_k) restores unit variance and keeps softmax in a well-behaved gradient regime.

### Masking

In the decoder, self-attention must be **causal** (autoregressive): position i may only attend to positions <= i. This is implemented by setting illegal entries in the attention score matrix to negative infinity before softmax, producing zero attention weights for future positions.

## Multi-Head Attention

Rather than performing a single attention function with d_model-dimensional keys, values, and queries, multi-head attention runs h parallel attention operations ("heads"), each on a lower-dimensional projection:

```
MultiHead(Q, K, V) = Concat(head_1, ..., head_h) W^O
where head_i = Attention(QW_i^Q, KW_i^K, VW_i^V)
```

In the original Transformer: h = 8 heads, d_k = d_v = d_model/h = 64.

### Why Multiple Heads?

- **Diverse subspaces:** Each head can learn to attend to different types of relationships (e.g., syntactic structure, semantic similarity, positional proximity).
- **Avoids averaging inhibition:** A single head must average across all attention patterns; multiple heads can specialize.
- **Equivalent cost:** Because each head operates on d_model/h dimensions, the total computation is similar to single-head attention at full dimensionality.

Ablation studies in the original paper showed that 8 heads outperformed both 1 head (-0.9 BLEU) and 32 heads (also degraded), suggesting a sweet spot in head count.

## Three Uses in the Transformer

The [[transformer-architecture]] employs multi-head attention in three distinct roles:

1. **Encoder self-attention:** Every encoder position attends to all positions in the previous encoder layer. Q, K, V all come from the same source.
2. **Masked decoder self-attention:** Same as encoder self-attention, but with causal masking to prevent attending to future positions.
3. **Encoder-decoder cross-attention:** Queries come from the decoder; keys and values come from the encoder output. This allows the decoder to attend to the full input sequence.

## Replacing Recurrence for Sequence Modeling

Self-attention replaced recurrence as the primary mechanism for sequence modeling by addressing its key limitations:

| Property | Self-Attention | Recurrence |
|----------|---------------|------------|
| Computational complexity per layer | O(n^2 * d) | O(n * d^2) |
| Minimum sequential operations | O(1) | O(n) |
| Maximum path length | O(1) | O(n) |
| Parallelizability | Fully parallel | Inherently sequential |

For typical NLP settings where n < d (sequence length shorter than model dimension), self-attention is both faster and provides shorter dependency paths. The tradeoff is O(n^2) memory/compute in sequence length, which motivates subsequent work on efficient attention variants.

## Beyond Sequence Position: Attention Over Depth

While the original Transformer applies self-attention along the **sequence dimension** (relating tokens at different positions), the same Q/K/V attention mechanism can be applied along other dimensions. For instance, attention can operate over the **depth dimension** -- relating representations across layers rather than across positions. This reuse of the attention primitive in novel axes is a recurring theme in Transformer research.

## Related Pages

- [[attention-is-all-you-need]] -- the paper that introduced self-attention as the sole sequence modeling mechanism
- [[transformer-architecture]] -- the full architecture built on self-attention
- [[residual-connections]] -- used around every self-attention sub-layer in the Transformer
