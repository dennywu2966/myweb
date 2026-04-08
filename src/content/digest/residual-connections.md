---
title: Residual Connections
type: concept
created: 2026-04-08
updated: 2026-04-08
sources: [deep-residual-learning-1512.03385.pdf]
tags: [residual-connections, skip-connections, identity-mapping, deep-learning, gradient-flow, architecture]
---

# Residual Connections

A **residual connection** (also called a **skip connection** or **identity shortcut**) is an architectural motif that adds a layer's input directly to its output, so the layer only needs to learn a *residual* -- the difference between the desired output and the input. Introduced in [[deep-residual-learning|He et al. (2015)]], residual connections are arguably the single most important structural innovation enabling modern deep networks, from 152-layer ResNets to billion-parameter [[transformer-architecture|Transformers]].

## The Identity Mapping Insight

The foundational observation is an argument by construction: given a shallower network that achieves some training error, a deeper network that contains the shallower one plus additional identity-mapping layers should achieve *at least* the same error. Yet in practice, plain deep networks fail to match their shallower counterparts -- a 56-layer plain CNN has *higher training error* than a 20-layer one.

This reveals that the problem is not model capacity but **optimization difficulty**: SGD struggles to learn identity mappings through stacks of nonlinear layers. Residual connections solve this by making identity the *default* behavior. A block computes:

> y = F(x) + x

If the optimal transformation is close to identity, the network only needs to learn F(x) near zero -- a much easier optimization target than learning the full mapping from scratch. Experiments in [[deep-residual-learning]] confirm that learned residual functions have small response magnitudes, and the responses shrink as depth increases: each layer makes only a small perturbation to its input.

This insight generalizes beyond its original CNN context. In the [[transformer-architecture]], every [[self-attention]] sublayer and every [[feed-forward-network]] sublayer is wrapped in a residual connection, making residual connections a universal structural element of modern deep learning.

## The Gradient Highway Property

Residual connections create a direct additive path for gradient flow. Consider a network with L residual blocks where block l computes:

> x_{l+1} = x_l + F_l(x_l)

By the chain rule, the gradient of the loss with respect to x_l is:

> dL/dx_l = dL/dx_L * (1 + dF/dx_l...L)

The critical term is the **1** -- it provides an unattenuated gradient path from the loss all the way back to any layer, regardless of depth. This contrasts sharply with plain networks, where gradients must pass through every nonlinear transformation and can vanish or explode multiplicatively.

This property is sometimes called the **gradient highway**: gradients have a "highway" that bypasses all intermediate nonlinear layers. It is this property that allows ResNets to scale to 1000+ layers without optimization failure, and it is what makes residual connections more effective than [[highway-networks]], where learned [[gating-mechanism|gates]] can throttle or close the gradient path.

**Contrast with highway networks:** In a highway network, the skip path is modulated by a learned gate T(x): y = T(x) * H(x) + (1 - T(x)) * x. When T(x) approaches zero for some inputs, the gradient highway is effectively shut off. ResNet's parameter-free identity shortcut is *always* open, guaranteeing gradient flow unconditionally.

## The Unrolled View: Implicit Ensemble

Veit et al. (2016) provided a revealing theoretical perspective by "unrolling" a residual network. A network with three residual blocks can be expanded:

> x_3 = x_0 + F_0(x_0) + F_1(x_0 + F_0(x_0)) + F_2(x_0 + F_0(x_0) + F_1(...))

This is equivalent to an exponential number of paths through the network, ranging from the direct path (just x_0) to the full depth path (through all F blocks). The network effectively acts as an **implicit ensemble** of 2^L paths of varying lengths.

Empirical evidence supports this view: randomly deleting individual residual blocks at test time causes graceful degradation (unlike plain networks, where removing a layer is catastrophic). The network's behavior is dominated by the shorter paths; most of the gradient during training flows through paths of moderate length, not through the single deepest path.

This means residual networks achieve **effective depth** that is much less than their nominal depth. The useful paths are O(sqrt(L)) in length on average for a network of L blocks, meaning the true computation is far shallower than the architecture suggests.

## The O(L) Growth Problem with Depth

While residual connections solve the optimization problem, they introduce a subtler issue: in a standard residual network, the **representation norm grows linearly with depth**. Each block adds its residual to the running representation:

> x_L = x_0 + sum_{l=0}^{L-1} F_l(x_l)

Even if each F_l has bounded norm, the sum accumulates, so ||x_L|| grows as O(L). This creates several problems at scale:

1. **Representation magnitude explosion.** In very deep networks (or long-sequence Transformers), the residual stream's magnitude grows with depth/length, potentially causing numerical instability or requiring careful scaling.

2. **Signal-to-noise ratio degradation.** Each residual addition contributes roughly equally to the final representation. With L layers, any single layer's contribution is only 1/L of the total signal. This means early layers' features get "diluted" by later additions, and the network's sensitivity to any individual layer's output decreases as O(1/L).

3. **Uniform aggregation.** The standard residual connection treats all layers' contributions equally -- there is no mechanism to weight or gate contributions. This is the "uniform aggregation" problem: the final representation is a uniform sum of all residual functions plus the input, with no learned prioritization.

4. **Learning rate sensitivity.** As depth grows, the effective learning rate for any single layer's parameters decreases because that layer's output is a diminishing fraction of the total. This can slow training and requires careful learning rate scaling.

These O(L) growth issues motivated several lines of work:

- **Pre-norm vs. post-norm** placement of [[layer-normalization]]: pre-norm architectures (normalize *before* each sublayer) help control representation growth and stabilize training in deep Transformers.
- **Scaled residual connections** (e.g., dividing by sqrt(L) or using learnable scaling factors) to keep representation norms bounded.
- **[[attention-residual]]** and related mechanisms that selectively modify how residual contributions are aggregated in [[transformer-architecture|Transformer]] models.
- **ReZero initialization** (Bachlechner et al., 2020): initializing residual branches with a learnable scalar at zero, so the network begins as identity and gradually introduces each layer's contribution.

## Variants and Extensions

### Projection Shortcuts

When input and output dimensions differ, a linear projection W_s replaces the identity:

> y = F(x) + W_s * x

In [[deep-residual-learning]], three options were tested (zero-padding, projection only at dimension changes, all projections). The differences were minor, confirming that the identity shortcut -- not a learned transformation -- is the essential ingredient.

### Pre-Activation (Identity Mappings in Deep Residual Networks)

He et al. (2016) showed that rearranging the block to put [[batch-normalization]] and ReLU *before* the weight layers (pre-activation) further improves gradient flow by making the skip connection a true identity:

> x_{l+1} = x_l + F(BN(ReLU(x_l)))

This makes the shortcut path a perfect identity at every block, rather than having activation functions interrupt it.

### Dense Connections (DenseNet)

[[densenet|DenseNet]] (Huang et al., 2017) generalizes residual connections by *concatenating* rather than adding all previous layers' outputs, giving each layer access to the full feature history. This strengthens feature reuse but increases memory cost.

### Residual Connections in Transformers

In the [[transformer-architecture]], residual connections wrap every sublayer:

> x = x + Attention(LayerNorm(x))    (pre-norm)
> x = x + FFN(LayerNorm(x))

This pattern creates the **residual stream** -- a flowing representation that each layer reads from and writes to. The residual stream concept is central to mechanistic interpretability research, where individual attention heads and MLP layers are analyzed as making additive contributions to a shared representation.

## Summary

| Property | Benefit | Limitation |
|---|---|---|
| Identity default | Easy optimization, layers learn perturbations | Uniform aggregation, no prioritization |
| Gradient highway | Gradients flow unattenuated to any depth | -- |
| Implicit ensemble (2^L paths) | Robustness, graceful degradation | Effective depth much less than nominal |
| Additive accumulation | Simple, parameter-free | O(L) norm growth, signal dilution at scale |
