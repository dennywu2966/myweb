---
title: Depth-Weighted Averaging
type: concept
created: 2026-04-08
updated: 2026-04-08
sources: [denseformer-2402.02622.pdf]
tags: [transformer-architecture, information-flow, cross-layer-connectivity, dense-connections, efficiency]
---

# Depth-Weighted Averaging

**Depth-Weighted Averaging (DWA)** is a technique introduced in the [[denseformer]] paper (Pagliardini et al., 2024) that enables each transformer block to directly access the outputs of all preceding blocks through a learned weighted average. It is the mechanism that turns a standard transformer into a DenseFormer.

## Mechanism

In a standard [[transformer-architecture]], each block receives only the output of the immediately preceding block, mediated by a [[residual-connections|residual connection]]:

> X_i = B_i(X_{i-1})

With DWA, an averaging step is inserted after each block. The DWA module at depth i computes:

> Y_i = sum_{j=0}^{i} alpha_{i,j} * X_j

where X_0 is the initial token embedding, X_1, ..., X_i are the outputs of blocks B_1 through B_i, and the alpha weights are learned scalar parameters. The next block then receives Y_i rather than X_i:

> X_{i+1} = B_{i+1}(Y_i)

Each DWA module at depth i has exactly i+1 weights (one for each preceding representation including the embedding). The full set of alpha weights can be arranged as a lower-triangular matrix, where row i contains the weights for DWA_i.

### Initialization

The alpha weights are initialized so that alpha_{i,i} = 1 and all others = 0. Under this initialization, DWA acts as the identity function and the model is equivalent to a standard transformer. Training then gradually learns which cross-layer connections are useful, deviating from this baseline only where beneficial.

### Computational Form

Each DWA step is a weighted sum of tensors of shape (batch_size x sequence_length x hidden_dim). The weights are scalars (not per-token or per-dimension), making DWA extremely parameter-efficient but requiring tensor-level averaging that can be a computational bottleneck. Efficient implementations reduce unnecessary data movement and can be combined with dilation and periodicity to further cut overhead.

## Relationship to DenseNet-Style Connections

DWA is the transformer analog of the dense connectivity pattern from DenseNets (Huang et al., 2017) in convolutional networks. The key differences:

| | DenseNet | DWA (DenseFormer) |
|---|---|---|
| **Aggregation** | Concatenation of feature maps | Weighted average of representations |
| **Dimensionality** | Grows with depth (requires growth rate control) | Constant (same hidden dim throughout) |
| **Learned mixing** | Implicit via subsequent convolution filters | Explicit via scalar alpha weights |
| **Domain** | CNNs (image recognition) | Transformers (language modeling) |

Both share the core insight: giving later layers direct access to earlier representations avoids the "bandwidth bottleneck" where useful features must be propagated through many intermediate layers via [[residual-connections]] alone.

## What the Learned Weights Reveal

The alpha weight matrices exhibit strikingly consistent patterns across model depths and random seeds, providing insight into how transformers use information across layers:

### Diagonal and Near-Diagonal Dominance

The largest weights appear on the diagonal (current block output) and the immediately preceding block. This preserves the standard sequential information flow as the dominant signal, with cross-layer connections providing supplementary information.

### Embedding Vector Pattern

- **Early layers** assign positive alpha weights to X_0 (the initial token embeddings), actively incorporating the raw token identity.
- **Later layers** assign negative weights to X_0, effectively subtracting out current-token information. The authors interpret this as the model transitioning from processing the current token to predicting the next token -- a signal that the architectural role of a layer depends on its depth.

### Aggregation Phase

The final few DWA modules show a distinctive "triangle" of elevated weights -- they draw heavily from many preceding layers simultaneously. This suggests a terminal aggregation phase where the model consolidates information from across the full depth before producing the output.

### Small Weights Are Structurally Important

Despite most off-diagonal weights being small in magnitude, pruning even 15% of them (ranked by absolute value) causes significant perplexity degradation. The fine-grained inter-block connections form a collectively important communication network, even if each individual connection carries a small signal.

## Efficiency Variants

Two hyperparameters create a family of DWA approximations:

### Dilation (k)

Each DWA module only averages over every k-th preceding representation (those at positions j where j is congruent to i mod k). This sparsifies the alpha matrix and reduces the number of tensors averaged per step by a factor of k. Dilation of 4 has negligible impact on perplexity.

### Periodicity (p)

DWA modules are only inserted after every p-th block. Between DWA steps, the model operates as a standard transformer. This reduces the total number of DWA operations by a factor of p. Periodicity of 5 has negligible impact on perplexity.

A kxp-DenseFormer combines both, achieving 1/(k*p) of the original DWA overhead. The 4x5 variant is identified as the best speed-perplexity trade-off in practice.

### Interplay Between k and p

When k = p, DWA modules may not have access to the processed output of the previous DWA module (it falls between the dilation grid). Using co-prime or offset values (e.g., k=4, p=5) ensures that each DWA module sees the output of the most recent preceding DWA, maintaining information propagation efficiency.

## Alternative Sparsity Patterns

The authors tested several restricted connectivity patterns, all of which underperformed full DWA:

- **Last K**: DWA can only access the k most recent blocks plus the embedding. Loses long-range connections.
- **Connect to Last**: A single DWA module placed only after the final layer. Equivalent to a post-hoc aggregation without inter-block benefit during processing.
- **Skips With Gains**: Learned scalar on each standard residual connection. No cross-layer access at all -- merely rescales the existing skip. Marginal improvement over baseline.

These comparisons establish that the benefit of DWA comes specifically from pairwise inter-block connectivity across the full depth, not from any single aspect of the mechanism.

## Position on the Cross-Depth Mixing Spectrum

DWA sits on a spectrum of techniques for mixing information across transformer depth:

1. **Residual connections**: Fixed additive skip from block i-1 to block i. No learned weighting, no long-range connections.
2. **DWA (DenseFormer)**: Learned scalar weights connecting every block to every subsequent block. Static (input-independent) weights, extremely low parameter cost.
3. **Depth-wise Attention** (ElNokrashy et al., 2022): Dot-product attention over block outputs for each token. Dynamic (input-dependent) weights, higher computational cost, applied only at the final layer.
4. **Attention Residuals**: Replaces DWA's fixed scalar weights with softmax attention weights, making the cross-depth mixing dynamic and input-dependent while applying it throughout the network. A direct successor to DWA that trades some efficiency for greater expressiveness.

DWA demonstrated that static, learned cross-layer connectivity is sufficient to yield large perplexity improvements, establishing the foundation for more expressive variants.

## Related Pages

- [[denseformer]] -- The architecture that introduces DWA
- [[transformer-architecture]] -- The base architecture DWA modifies
- [[residual-connections]] -- The single-step skip connection that DWA generalizes
- [[highway-networks]] -- Earlier approach to learned information flow across depth (gating rather than averaging)
