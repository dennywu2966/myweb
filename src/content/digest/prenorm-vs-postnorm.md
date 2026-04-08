---
title: "Pre-Norm vs Post-Norm"
type: concept
created: 2026-04-08
updated: 2026-04-08
sources: [prenorm-layer-normalization-2002.04745.pdf]
tags: [transformer, layer-normalization, pre-norm, post-norm, training-stability, residual-stream, dilution-problem]
---

# Pre-Norm vs Post-Norm

The placement of [[layer-normalization]] relative to [[residual-connections]] in a [[transformer-architecture]] block defines two major architectural variants. This seemingly small design choice has profound consequences for training stability, gradient flow, and representation quality.

## The Two Variants

### Post-LN (Original Transformer)

The original Transformer (Vaswani et al., 2017) places layer normalization **after** the residual addition:

```
x' = LayerNorm(x + SubLayer(x))
```

The computation flow for one block is:
1. Compute sub-layer output (attention or FFN)
2. Add residual connection
3. Apply layer normalization

This was used in BERT, the original Transformer, Transformer-XL, and other early models.

### Pre-LN (Pre-Layer Normalization)

The Pre-LN variant (Baevski & Auli 2018; Child et al. 2019) places layer normalization **before** the sub-layer computation, inside the residual block:

```
x' = x + SubLayer(LayerNorm(x))
```

The computation flow for one block is:
1. Apply layer normalization
2. Compute sub-layer output (attention or FFN)
3. Add residual connection

A final layer normalization is applied after the last layer, before the output projection. This became the dominant design in GPT-2, GPT-3, and most modern large language models.

## Training Stability Differences

### Why Post-LN Is Unstable

Xiong et al. (2020) proved via [[mean-field-theory]] analysis (see [[prenorm-layer-normalization]]) that at initialization:

- **Post-LN hidden states have constant norm** across layers: E(||x||^2) = (3/2)d. The layer normalization resets the scale at every layer.
- **Post-LN gradients are large near the output** and decay toward the input. The gradient norm of the last FFN layer is O(d * sqrt(ln d)), independent of model depth L.
- Applying a standard learning rate to these disproportionately large gradients causes the output-layer parameters to take catastrophically large steps, destabilizing training.

The **learning rate warm-up** -- starting with a near-zero learning rate and gradually increasing -- is a workaround that prevents these large early gradients from destroying the model. But it introduces sensitive hyperparameters (warm-up duration, maximum learning rate) and slows convergence.

### Why Pre-LN Is Stable

- **Pre-LN hidden states grow linearly with depth**: E(||x||^2) is proportional to L at the final layer, because each layer's contribution accumulates in the residual stream without being renormalized.
- **The final layer normalization divides gradients by sqrt(L)**, producing well-behaved gradients of scale O(d * sqrt(ln d / L)).
- **Gradients are approximately uniform across all layers** -- no layer receives disproportionately large or small updates.

Result: Pre-LN Transformers can be trained **without warm-up**, with larger initial learning rates, and converge faster. Xiong et al. demonstrated a ~40% training speedup on BERT pre-training.

## Why Pre-Norm Became Dominant

Pre-LN was adopted as the standard in most large-scale Transformer models for several practical reasons:

1. **No warm-up required**: Eliminates a source of sensitive hyperparameter tuning.
2. **Faster convergence**: Uniform gradient scales allow effective learning from the start.
3. **Better scaling**: The stability advantage becomes more important as models grow deeper.
4. **Simpler training recipes**: Fewer moving parts in the optimizer configuration.

Models using Pre-LN include GPT-2, GPT-3, PaLM, LLaMA, and most modern LLMs.

## The Pre-Norm Dilution Problem

Despite its training stability advantages, Pre-LN has a fundamental representational drawback that follows directly from the same property that makes it stable.

### The Mechanism

In Pre-LN, the residual stream is never renormalized between layers. At layer l, the hidden state is:

```
x_l = x_0 + f_1(LN(x_0)) + f_2(LN(x_1)) + ... + f_l(LN(x_{l-1}))
```

where each f_i is a sub-layer (attention or FFN). Xiong et al. proved (Lemma 2) that E(||x_l||^2) grows as Theta(l * d) -- the norm of the residual stream grows linearly with depth.

### The Consequence: O(L) Dilution

Each individual layer's contribution f_l has magnitude O(sqrt(d)) (it operates on a layer-normalized input of norm sqrt(d)). But the residual stream at layer l has magnitude O(sqrt(l * d)). Therefore:

- **The relative contribution of layer l is O(1/sqrt(l))** compared to the accumulated residual.
- By the final layer L, the accumulated stream has norm O(sqrt(L * d)), while each layer's contribution is O(sqrt(d)).
- **Each layer's contribution is diluted by a factor of O(sqrt(L))** relative to the total.

In a 96-layer model, the last layer's contribution is roughly 1/10th the magnitude of the residual stream. In effect, the deeper you go, the less each individual layer matters. The model's final representation is dominated by a simple average-like accumulation rather than by the rich, hierarchical transformations that deep networks are supposed to learn.

### Why This Matters

The dilution problem means that:

1. **Deep Pre-LN models underutilize their depth** -- later layers contribute proportionally less, so adding more layers yields diminishing returns in representational capacity.
2. **The final layer normalization compresses everything** -- it maps the O(sqrt(L * d))-magnitude stream back to O(sqrt(d)), uniformly shrinking all layers' contributions.
3. **The gradient uniformity that enables stable training is the same property that prevents deep layers from having strong effects** -- this is a fundamental tension in the Pre-LN design.

This dilution problem is the **core motivation** for [[attention-residuals]] and other architectural innovations that seek to preserve per-layer contribution magnitude while maintaining training stability.

### Comparison to Post-LN

Post-LN does not suffer from dilution: the layer normalization after each residual addition resets the stream to norm sqrt(d), so every layer's contribution is "re-weighted" to be significant. This is why Post-LN can sometimes achieve better final performance than Pre-LN despite being harder to train -- each layer has genuine representational impact.

The challenge is achieving Post-LN's representational quality with Pre-LN's training stability.

## Summary Table

| Property | Post-LN | Pre-LN |
|---|---|---|
| LN placement | After residual add | Before sub-layer |
| Hidden state norm | Constant: O(sqrt(d)) | Growing: O(sqrt(l * d)) |
| Gradient scale (last layer) | O(d * sqrt(ln d)) | O(d * sqrt(ln d / L)) |
| Gradient distribution | Large near output, small near input | Approximately uniform |
| Warm-up required | Yes (critical) | No |
| Training stability | Poor without warm-up | Good |
| Convergence speed | Slower | Faster |
| Per-layer contribution | Strong (renormalized each layer) | Diluted as O(1/sqrt(L)) |
| Depth utilization | Good | Degraded at scale |

## Related Pages

- [[layer-normalization]] -- The normalization technique whose placement defines these variants
- [[prenorm-layer-normalization]] -- Source paper with formal proofs
- [[residual-connections]] -- The skip connections that interact with normalization placement
- [[transformer-architecture]] -- The architecture in which these variants exist
- [[attention-residuals]] -- An approach motivated by solving the Pre-Norm dilution problem
- [[highway-networks]] -- Earlier approach to deep network training via gated skip connections
