---
title: "Layer Normalization"
type: concept
created: 2026-04-08
updated: 2026-04-08
sources: [prenorm-layer-normalization-2002.04745.pdf]
tags: [normalization, transformer, deep-learning, training-stability, RMSNorm]
---

# Layer Normalization

Layer normalization (Ba et al., 2016) is a normalization technique that stabilizes and accelerates the training of deep neural networks by normalizing activations across the feature dimension. It is a critical component of the [[transformer-architecture]] and plays a central role in determining training dynamics depending on its placement (see [[prenorm-vs-postnorm]]).

## Definition

Given a vector v of dimension d, layer normalization computes:

```
LayerNorm(v) = gamma * (v - mu) / sigma + beta
```

where:
- **mu** = (1/d) * sum(v_k) is the mean of the elements
- **sigma** = sqrt((1/d) * sum((v_k - mu)^2)) is the standard deviation
- **gamma** (scale) and **beta** (bias) are learnable parameters, initialized to 1 and 0 respectively

The operation centers the vector to zero mean, scales it to unit variance, and then applies a learned affine transformation.

## Key Properties

### Geometric Effect

Layer normalization projects any input vector onto a (d-1)-dimensional hypersphere of radius sqrt(d). At initialization (gamma=1, beta=0):

```
||LayerNorm(v)||^2 = sum((v_k - mu)^2 / sigma^2) = d
```

This normalization of magnitude is what resets hidden state norms in Post-LN Transformers and what creates the [[prenorm-vs-postnorm|dilution problem]] in Pre-LN Transformers.

### Jacobian and Gradient Control

The Jacobian of layer normalization (Lemma 3 from Xiong et al., 2020) has spectral norm:

```
||J_LN(x)||_2 = O(d / ||x||_2)
```

This means layer normalization amplifies gradients when input norms are small and attenuates them when input norms are large. This property is the mechanism through which the placement of layer normalization controls gradient flow in Transformers:

- In **Post-LN**, inputs to each layer norm have constant norm O(sqrt(d)), so gradients pass through with scale O(sqrt(d)).
- In **Pre-LN**, the final layer norm input has norm O(sqrt(L * d)), so it attenuates gradients by O(sqrt(L)), producing well-behaved training.

See [[prenorm-layer-normalization]] for the full theoretical analysis.

### Independence from Batch Statistics

Unlike [[batch-normalization]], layer normalization computes statistics per-sample across the feature dimension rather than per-feature across the batch dimension. This makes it:

- **Applicable to variable-length sequences** (essential for NLP)
- **Independent of batch size** (works with batch size 1)
- **Stable during inference** (no need for running statistics)
- **Suitable for autoregressive models** (no information leakage across sequence positions)

These properties made it the normalization of choice for Transformers, replacing batch normalization which dominates in convolutional architectures.

## RMSNorm Variant

Root Mean Square Layer Normalization (RMSNorm) (Zhang & Sennrich, 2019) is a simplified variant that omits the mean-centering step:

```
RMSNorm(v) = gamma * v / RMS(v)
```

where:
- **RMS(v)** = sqrt((1/d) * sum(v_k^2)) is the root mean square

### Differences from Standard Layer Normalization

| Property | LayerNorm | RMSNorm |
|---|---|---|
| Mean centering | Yes | No |
| Learnable bias (beta) | Yes | No |
| Computation | Requires mean and variance | Requires only sum of squares |
| Parameters | 2d (gamma + beta) | d (gamma only) |

### Why RMSNorm Works

The hypothesis behind RMSNorm is that the re-centering (mean subtraction) in standard layer normalization is not essential -- the primary benefit comes from the re-scaling that stabilizes activations. Empirically, RMSNorm achieves comparable performance to full layer normalization while being computationally cheaper.

### Adoption

RMSNorm has been adopted in many modern large language models, including LLaMA, Mistral, and Gemma, as a drop-in replacement for standard layer normalization. The computational savings are modest per-layer but compound across the many normalization operations in a deep Transformer.

## Role in Transformer Architectures

Layer normalization appears in two positions within a Transformer block, and the choice of which positions to use defines the architectural variant:

- **Post-LN** (original): LN after each residual addition, between blocks. Produces constant-scale hidden states but unstable gradients without warm-up.
- **Pre-LN** (modern standard): LN before each sub-layer, inside the residual block, plus a final LN before the output. Produces growing hidden states but well-behaved gradients.

See [[prenorm-vs-postnorm]] for a thorough comparison of these two placements.

In addition to these per-block normalizations, some architectures apply layer normalization to:
- Query and key vectors before attention computation (QK-norm)
- The final output before the language model head
- Embedding layers

## Interaction with Residual Connections

The interplay between layer normalization and [[residual-connections]] is the central theme of Xiong et al. (2020). The key insight is that layer normalization's magnitude-resetting effect interacts differently with residual streams depending on whether it is applied before or after the residual addition:

- **After** (Post-LN): Resets the residual stream, preventing accumulation. Each layer starts fresh at scale sqrt(d). Good for representation but causes gradient pathologies.
- **Before** (Pre-LN): Normalizes only the input to each sub-layer, not the residual stream itself. The stream accumulates freely, growing as O(sqrt(L * d)). Good for gradient flow but causes [[prenorm-vs-postnorm|dilution]].

## Related Pages

- [[prenorm-vs-postnorm]] -- How placement of layer normalization defines Transformer variants
- [[prenorm-layer-normalization]] -- Source paper analyzing the effect of LN placement
- [[transformer-architecture]] -- The architecture where layer normalization is essential
- [[residual-connections]] -- Skip connections whose interaction with LN is critical
- [[batch-normalization]] -- The predecessor normalization technique used in CNNs
- [[self-attention]] -- The sub-layer that layer normalization is applied around
