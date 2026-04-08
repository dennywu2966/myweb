---
title: "On Layer Normalization in the Transformer Architecture"
type: source-summary
created: 2026-04-08
updated: 2026-04-08
sources: [prenorm-layer-normalization-2002.04745.pdf]
tags: [transformer, layer-normalization, pre-norm, post-norm, optimization, warm-up, training-stability]
---

# On Layer Normalization in the Transformer Architecture

**Paper**: "On Layer Normalization in the Transformer Architecture" by Ruibin Xiong, Yunchang Yang, Di He, Kai Zheng, Shuxin Zheng, Chen Xing, Huishuai Zhang, Yanyan Lan, Liwei Wang, and Tie-Yan Liu. Published at ICML 2020. arXiv:2002.04745.

## Problem

Training the original [[transformer-architecture]] (the Post-LN variant) requires a carefully tuned learning rate warm-up stage: the learning rate must start near zero and gradually ramp up over thousands of iterations before the normal schedule begins. This warm-up is crucial -- without it, optimization diverges -- but it slows training and introduces sensitive hyperparameters (the maximum learning rate and the warm-up duration). On IWSLT14 De-En, a Post-LN Transformer trained with Adam but no warm-up achieves only 8.45 BLEU versus ~34 with warm-up. The problem is not optimizer-specific: SGD exhibits the same failure mode.

## Core Contribution

The paper provides a **theoretical explanation** for why warm-up is necessary for Post-LN Transformers and why it is unnecessary for Pre-LN Transformers, using [[mean-field-theory]] analysis of gradient scales at initialization.

### Two Transformer Variants

The paper formally defines and compares:

1. **Post-LN Transformer** (original design from Vaswani et al., 2017): [[layer-normalization]] is placed *between* [[residual-connections]], i.e., after the residual addition. The computation is: sub-layer output -> residual add -> layer norm.

2. **Pre-LN Transformer** (proposed in Baevski & Auli 2018, Child et al. 2019, Wang et al. 2019): [[layer-normalization]] is placed *inside* the residual block, before the sub-layer computation. The computation is: layer norm -> sub-layer output -> residual add. An additional final layer normalization is applied before prediction.

See [[prenorm-vs-postnorm]] for a detailed comparison.

### Theoretical Results

**Lemma 2 (Hidden state scales)**: At initialization under Xavier initialization:
- In Post-LN, the expected norm of hidden states remains constant across layers: E(||x||^2) = (3/2)d for all layers.
- In Pre-LN, the expected norm **grows linearly with depth**: (1 + 2l)d <= E(||x||^2) <= (1 + 3l/2)d at layer l.

**Theorem 1 (Gradient scales of the last layer)**:
- Post-LN: The gradient norm of the last FFN layer is O(d * sqrt(ln d)), **independent of L** (number of layers). These gradients are large and of fixed scale regardless of model depth.
- Pre-LN: The gradient norm is O(d * sqrt(ln d / L)), which **decreases as model depth increases**. The growing hidden state norms in Pre-LN cause the final layer normalization to scale down all gradients by a factor of sqrt(L).

**Extended theory**: In Post-LN, gradient norms grow with layer index (large near the output, small near the input). In Pre-LN, gradient norms remain approximately uniform across all layers.

**Lemma 3 (Layer norm Jacobian)**: The spectral norm of the layer normalization Jacobian is O(d / ||x||_2). Since Post-LN inputs have constant norm while Pre-LN inputs grow with depth, this is the mechanism through which [[layer-normalization]] placement controls gradient flow.

### The Mechanism Explained

In Post-LN, layer normalization resets hidden state norms to sqrt(d) at every layer. This means the final layer normalization sees inputs of constant scale, producing large gradients for the output-adjacent parameters. A large learning rate applied to these large gradients causes instability.

In Pre-LN, hidden states accumulate contributions from all layers via the residual stream, so their norms grow as O(L). The final layer normalization then divides gradients by sqrt(L), producing well-behaved, moderate gradients throughout the network.

## Key Experiments

### Machine Translation
- **IWSLT14 De-En**: Pre-LN without warm-up matches Post-LN with warm-up (~34 BLEU). Pre-LN converges faster: epoch 9 matches Post-LN epoch 15.
- **WMT14 En-De**: Same pattern holds. Pre-LN without warm-up achieves comparable BLEU to Post-LN with warm-up.
- RAdam (Liu et al., 2019a) can train Post-LN without warm-up, but the normalization placement change "dominates" the optimizer change.

### BERT Pre-training
- Pre-LN BERT achieves the same validation loss as Post-LN BERT but ~40% faster (500k vs 700k updates to reach validation loss 1.69).
- Post-LN BERT diverges with learning rate 3e-4; Pre-LN BERT trains stably at that rate.
- Downstream tasks (MRPC, RTE) also show faster convergence for Pre-LN.

### Empirical Verification of Theory
- Hidden state norms: constant in Post-LN, linearly growing in Pre-LN (matches Lemma 2).
- Gradient norms: grow with layer index in Post-LN, remain constant across layers in Pre-LN (matches extended theory).
- Last-layer gradient norms: constant across model sizes for Post-LN (~1.6), decreasing with depth for Pre-LN (matches Theorem 1).

## Significance

This paper provided the first rigorous theoretical justification for the Pre-LN Transformer variant and demonstrated that learning rate warm-up -- long treated as a mysterious but necessary ritual in Transformer training -- is an artifact of Post-LN's gradient pathology, not a fundamental requirement. The Pre-LN configuration became the dominant choice in subsequent large language models including GPT-2, GPT-3, and many others.

However, the paper's Lemma 2 also reveals a subtle issue: the linear growth of hidden state norms in Pre-LN means that **each layer's contribution is progressively diluted** relative to the accumulated residual stream. This [[prenorm-vs-postnorm|PreNorm dilution problem]] was later identified as a key motivation for architectural innovations like [[attention-residuals]].

## Related Pages

- [[layer-normalization]] -- The normalization technique whose placement is the subject of this paper
- [[prenorm-vs-postnorm]] -- Detailed comparison of the two normalization placement strategies
- [[transformer-architecture]] -- The architecture being analyzed
- [[residual-connections]] -- The skip connections that interact with layer normalization placement
- [[self-attention]] -- The attention sub-layer within each Transformer block
- [[highway-networks]] -- Earlier architecture using gated skip connections for deep network training
