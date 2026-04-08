---
title: DenseFormer
type: source-summary
created: 2026-04-08
updated: 2026-04-08
sources: [denseformer-2402.02622.pdf]
tags: [transformer-architecture, depth-weighted-averaging, information-flow, language-modeling, efficiency, EPFL]
---

# DenseFormer

**Paper**: "DenseFormer: Enhancing Information Flow in Transformers via Depth Weighted Averaging" by Matteo Pagliardini, Amirkeivan Mohtashami, Francois Fleuret, and Martin Jaggi (EPFL, University of Geneva). arXiv:2402.02622v2, March 2024.

**Code**: [github.com/epfml/DenseFormer](https://github.com/epfml/DenseFormer)

## Problem

Scaling the [[transformer-architecture]] by adding depth yields diminishing returns beyond a certain point. Deeper models are slower at inference, consume more memory, and require more data to train -- yet the perplexity improvement per added layer shrinks. A similar challenge was encountered earlier in convolutional networks and addressed by DenseNets (Huang et al., 2017), which gave each layer direct access to the outputs of all preceding layers. DenseFormer applies an analogous idea to transformers.

## Core Contribution

DenseFormer modifies the standard transformer by inserting a [[depth-weighted-averaging]] (DWA) module after each transformer block. The DWA module computes a weighted average over all preceding block outputs (including the initial token embeddings), using a set of learned scalar weights. This is the only change to the architecture.

### Formal Definition

Given a transformer of depth d with blocks B_1, ..., B_d and intermediary representations X_0 (embeddings), X_1, ..., X_d:

- **Standard transformer**: X_i = B_i(X_{i-1}); output = X_d
- **DenseFormer**: X_i = B_i(Y_{i-1}), where Y_i = sum_{j=0}^{i} alpha_{i,j} * X_j; output = Y_d

The alpha weights are the only additional parameters. They are initialized so that alpha_{i,i} = 1 and all others = 0, making DenseFormer equivalent to a standard transformer at initialization. This ensures stable training from the start.

### Parameter Overhead

A DenseFormer of depth d adds d(d+3)/2 scalar parameters total. For a 100-block model this is roughly 5,000 parameters -- negligible compared to billions of model parameters. Memory overhead is also negligible because intermediary representations X_0, ..., X_d are already stored during training (for backpropagation) and inference (in the KV cache).

## Efficiency: Dilation and Periodicity

The computational overhead of DWA comes from averaging large tensors (batch x sequence length x hidden dim). Two hyperparameters control this:

- **Dilation (k)**: Each DWA module only looks at every k-th preceding block output rather than all of them. Reduces DWA overhead by factor 1/k.
- **DWA period (p)**: DWA modules are inserted only every p blocks instead of after every block. Reduces overhead by factor 1/p.

A kxp-DenseFormer has 1/(k*p) of the full DenseFormer's DWA overhead. In the notation, 1x1-DenseFormer is the full model; 4x5-DenseFormer uses dilation 4 and period 5.

Key finding: a 4x5-DenseFormer retains nearly all the perplexity benefit of the full DenseFormer while recovering almost all of the inference speed of a vanilla transformer.

## Key Results

All experiments use language modeling (next-token prediction) on OpenWebText2 and PG-19.

### Perplexity

| Model | Depth | Params (M) | Perplexity |
|---|---|---|---|
| Transformer | 48 | 378 | 18.61 |
| 1x1-DenseFormer | 48 | 378 | 17.84 |
| 4x5-DenseFormer | 48 | 378 | 17.87 |
| Transformer | 72 | 548 | 17.82 |

A 48-block DenseFormer matches the perplexity of a 72-block transformer while being 1.4x faster at inference, 45% smaller in parameters, and consuming proportionally less memory.

### Data Efficiency

DenseFormer achieves the same perplexity as a standard transformer using fewer training tokens. Under a fixed training-time budget, a 4x5-DenseFormer outperforms a standard transformer trained for more iterations (41.5k vs. 40k steps).

### Weighted Skip Connections Are Insufficient

A baseline that simply adds learned scaling factors to each [[residual-connections|residual connection]] ("Skips With Gains") shows only marginal improvement over the standard transformer. The performance benefit of DenseFormer specifically comes from enabling direct access to the outputs of all previous layers, not merely from rescaling the standard skip connection.

## Learned Weight Patterns

Visualization of the alpha weight matrices reveals consistent, structured patterns across depths and random seeds:

1. **Diagonal dominance**: The highest weights are on the diagonal (current block) and the immediately preceding block, preserving the standard information flow.
2. **Embedding access**: Early layers assign positive weight to the initial token embeddings X_0; later layers assign negative weight to X_0. The authors hypothesize this reflects the model first using current-token information, then subtracting it out as it shifts to next-token prediction.
3. **Aggregation block**: Near the final layers, a "triangle" of high weights appears where the last few DWA modules draw heavily from many preceding layers -- an aggregation phase before the output.
4. **Small weights matter**: Even though most off-diagonal alpha weights are small in magnitude, pruning as little as 15% of them (by magnitude) causes perplexity to degrade sharply. Every inter-block connection contributes.

The cosine similarity between DWA outputs and the initial embeddings stays high through early layers (the model preserves current-token information) and drops sharply in later layers (the model transitions to next-token representation).

## Relation to Other Work

- **DenseNets** (Huang et al., 2017): The direct inspiration. DenseNets concatenate feature maps from all preceding layers in CNNs; DenseFormer uses weighted averaging of preceding representations in transformers.
- **[[highway-networks]]** and [[residual-connections]]: These provide a single skip connection from one block to the next. DenseFormer generalizes this by connecting every block to every subsequent block.
- **Depth-wise Attention** (ElNokrashy et al., 2022): Applies attention across block outputs for the current token before the final projection. Similar in spirit to DWA, but uses dot-product attention (higher overhead) and only operates at the last layer rather than after every block.
- **CoTFormer** (Mohtashami et al., 2023): Interleaves current and past representations, allowing tokens to attend to previous representations of themselves and other tokens. DenseFormer can be seen as a more efficient approximation, restricting each token to only attend to its own past representations with static (learned) rather than dynamic weights. This positions DWA on a spectrum toward attention-based cross-depth mixing -- a direction later explored by Attention Residuals, which replaces fixed/learned scalar weights with softmax attention weights.

## Related Pages

- [[depth-weighted-averaging]] -- The DWA technique introduced in this paper
- [[transformer-architecture]] -- The base architecture DenseFormer modifies
- [[residual-connections]] -- The standard skip connections that DenseFormer generalizes
- [[highway-networks]] -- Earlier work on learned gating for information flow across depth
