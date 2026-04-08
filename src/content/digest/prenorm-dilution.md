---
title: "PreNorm Dilution"
type: concept
created: 2026-04-08
updated: 2026-04-08
sources: [attention-residuals-2603.15031.pdf, prenorm-layer-normalization-2002.04745.pdf]
tags: [prenorm, layer-normalization, residual-connections, transformer, training-dynamics, depth]
---

# PreNorm Dilution

**PreNorm dilution** is the progressive loss of each layer's relative contribution as hidden-state magnitudes grow with depth under [[prenorm-layer-normalization|PreNorm]] [[transformer-architecture|Transformers]]. It is a fundamental limitation of standard [[residual-connections]] combined with PreNorm normalization, and a key motivation for the [[attention-residuals-mechanism|Attention Residuals]] mechanism.

## The Mechanism

In a PreNorm Transformer, [[layer-normalization]] is applied *before* each sublayer, with the sublayer output added directly to the residual stream:

> h_l = h_{l-1} + f_{l-1}(LayerNorm(h_{l-1}))

Expanding the recurrence, the hidden state at layer l is the sum of the embedding and all preceding layer outputs:

> h_l = h_1 + sum_{i=1}^{l-1} f_i(LayerNorm(h_i))

### O(L) Magnitude Growth

As established in [[prenorm-layer-normalization|Xiong et al. (2020)]], the expected norm of hidden states under PreNorm grows linearly with depth:

> (1 + 2l)d <= E(||h_l||^2) <= (1 + 3l/2)d

Each layer adds a contribution of bounded norm (since it receives normalized input), but the sum of these contributions grows without bound as L increases. The hidden state norm ||h_L|| thus scales as O(sqrt(L)).

### Why This Dilutes Layer Contributions

Consider the relative contribution of layer i's output f_i(h_i) to the accumulated hidden state h_l at layer l >> i. Since h_l is the sum of O(l) terms of roughly similar magnitude, the fraction of the representation attributable to any single layer is approximately 1/l. This means:

1. **Early-layer information is buried**: As the residual stream accumulates more and more layer outputs, the signal from any individual early layer becomes a progressively smaller fraction of the total. It cannot be selectively retrieved.
2. **Deeper layers must produce larger outputs**: To maintain influence over the growing residual stream, deeper layers are compelled to learn increasingly large outputs from the fixed-scale normalized inputs they receive. This creates an arms race where each layer must "shout louder" to be heard above the accumulated residual.
3. **Effective depth is wasted**: Empirically, a significant fraction of layers in deep PreNorm models can be pruned with minimal loss (Gromov et al., 2025), suggesting that many layers fail to make meaningful contributions to the final representation.

This stands in contrast to [[prenorm-vs-postnorm|PostNorm]], which maintains bounded magnitudes (by normalizing on the residual path) but introduces gradient vanishing. The two normalization strategies sit on a seesaw: PreNorm preserves gradient flow but causes dilution; PostNorm prevents dilution but distorts gradients.

## Empirical Evidence from the Attention Residuals Paper

The [[attention-residuals]] paper provides direct empirical evidence of PreNorm dilution in large-scale training, comparing a 48B-parameter PreNorm baseline against Block AttnRes over 1T training tokens on the [[kimi-linear]] architecture.

### Output Magnitude Growth

The baseline model exhibits **monotonic growth of output magnitudes with depth**: each successive Transformer block produces larger outputs than the previous one. This is the signature of PreNorm dilution -- deeper layers are forced to learn increasingly large outputs to remain influential over the ever-growing residual stream.

Block AttnRes confines this growth within each block. Because selective softmax aggregation at block boundaries **resets the accumulation**, the output magnitudes show a bounded periodic pattern rather than unbounded monotonic growth. The magnitudes rise within each block (standard residual accumulation) but are brought back under control at each inter-block attention step.

### Gradient Distribution

The baseline shows **disproportionately large gradients concentrated in the earliest layers**, with gradient magnitudes declining toward the output. This pattern reflects the dilution problem from the gradient perspective: since all residual weights are fixed to 1, there is no mechanism to regulate gradient flow across depth.

Block AttnRes achieves **substantially more uniform gradient distribution across layers**. The learned softmax weights in the [[attention-residuals-mechanism|AttnRes mechanism]] introduce competition among depth sources for probability mass, which naturally regularizes how gradients are distributed. When the softmax attention concentrates on certain sources, it attenuates the gradient contribution from others, preventing the disproportionate accumulation seen in the baseline.

### Validation Loss

AttnRes achieves consistently lower validation loss throughout training, with the gap widening during the learning rate decay phase. This suggests that the PreNorm dilution problem becomes more pronounced as training progresses and the model's representations become more refined -- precisely when selective depth-wise retrieval matters most.

## How AttnRes Mitigates Dilution

The [[attention-residuals-mechanism]] addresses PreNorm dilution through several interconnected mechanisms:

1. **Selective aggregation replaces uniform accumulation**: Instead of summing all layer outputs with weight 1, AttnRes applies softmax attention, allowing each layer to weight its sources adaptively. The softmax normalization ensures that the input h_l is a convex combination of source representations, inherently bounding its magnitude regardless of depth.

2. **RMSNorm on keys prevents magnitude-based dominance**: Even though layer outputs may have different magnitudes (due to accumulation within blocks), the RMSNorm applied to keys in the attention computation normalizes them to unit scale. This prevents later layers with naturally larger outputs from dominating simply by virtue of their magnitude.

3. **Block boundaries reset accumulation**: In [[block-attention-residuals|Block AttnRes]], the transition between blocks replaces the growing residual stream with a fresh attention-weighted combination. This periodic reset prevents the O(L) magnitude growth from spanning the full network depth.

4. **Bounded representations**: The combination of softmax weighting (convex combination) and RMSNorm on keys ensures that hidden-state magnitudes remain bounded across depth, in contrast to the unbounded O(L) growth under standard PreNorm.

## Relationship to the Pre-Norm/Post-Norm Seesaw

The [[prenorm-vs-postnorm]] seesaw has been a persistent challenge in [[transformer-architecture]] design:

- **PreNorm**: Clean identity path for gradients, but unbounded magnitude growth and dilution.
- **PostNorm**: Bounded magnitudes, but gradient vanishing from repeated normalization on the residual path.

AttnRes sidesteps this seesaw entirely by replacing the additive recurrence with selective aggregation over individual earlier-layer outputs. It avoids both the cumulative magnitude growth of PreNorm and the repeated scale contraction of PostNorm. The paper characterizes this as "orthogonal" to the normalization choice -- AttnRes is compatible with any normalization or gating scheme.

Other approaches to the seesaw include:
- **DeepNet**: Scaled residual paths (alpha * h + f(h)) to control magnitude growth.
- **SiameseNorm**: Two parameter-shared streams (one PreNorm, one PostNorm) to get the best of both.
- **[[hyper-connections]]**: Multi-stream recurrences with learned mixing matrices.

AttnRes differs from all of these by providing direct selective access to individual earlier-layer outputs rather than modifying the recurrence structure.

## Related Pages

- [[attention-residuals]] -- The paper that provides the primary analysis and solution
- [[attention-residuals-mechanism]] -- The mechanism that addresses dilution
- [[block-attention-residuals]] -- The scalable variant with periodic reset
- [[prenorm-layer-normalization]] -- The normalization paper establishing O(L) growth
- [[prenorm-vs-postnorm]] -- The broader Pre-Norm/Post-Norm tradeoff
- [[layer-normalization]] -- The normalization technique involved
- [[residual-connections]] -- The fixed accumulation causing dilution
- [[transformer-architecture]] -- The architecture affected
- [[depth-wise-attention]] -- The theoretical perspective on depth aggregation
