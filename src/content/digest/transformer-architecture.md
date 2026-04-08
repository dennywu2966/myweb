---
title: Transformer Architecture
type: concept
created: 2026-04-08
updated: 2026-04-08
sources: [attention-is-all-you-need-1706.03762.pdf]
tags: [transformer, architecture, encoder-decoder, deep-learning, attention]
---

# Transformer Architecture

The Transformer is a neural network architecture introduced in [[attention-is-all-you-need]] (Vaswani et al., 2017). It is the first sequence transduction model built entirely on [[self-attention]], without recurrence or convolutions. Originally designed for machine translation, it has since become the dominant architecture underlying virtually all large language models and has been adapted to vision, audio, biology, and many other domains.

## Encoder-Decoder Structure

The Transformer follows the established encoder-decoder paradigm for sequence-to-sequence tasks:

- **Encoder:** Maps an input sequence (x_1, ..., x_n) to a sequence of continuous representations z = (z_1, ..., z_n). The encoder processes all positions in parallel.
- **Decoder:** Given z, generates an output sequence (y_1, ..., y_m) one token at a time in an autoregressive fashion -- each prediction for position i depends only on the known outputs at positions less than i.

Both the encoder and decoder are composed of stacks of identical layers (N = 6 in the original model).

## Layer Structure

### Encoder Layer

Each encoder layer consists of two sub-layers:

1. **Multi-head [[self-attention]]** -- every position attends to all positions in the previous layer's output.
2. **Position-wise feed-forward network (FFN)** -- two linear transformations with a ReLU activation:

```
FFN(x) = max(0, xW_1 + b_1)W_2 + b_2
```

The FFN uses inner dimension d_ff = 2048 (4x the model dimension of d_model = 512). It is applied identically and independently to each position.

Each sub-layer is wrapped with a [[residual-connections|residual connection]] and layer normalization:

```
output = LayerNorm(x + Sublayer(x))
```

### Decoder Layer

Each decoder layer has three sub-layers:

1. **Masked multi-head [[self-attention]]** -- same as encoder self-attention, but with causal masking to prevent attending to future positions (preserving autoregressive generation).
2. **Encoder-decoder cross-attention** -- queries come from the previous decoder layer; keys and values come from the encoder output. This allows every decoder position to attend to all positions in the input sequence.
3. **Position-wise FFN** -- identical structure to the encoder's FFN.

All three sub-layers use residual connections and layer normalization.

## Residual Connections and Layer Normalization

[[residual-connections|Residual connections]] (He et al., 2016) are applied around every sub-layer in both the encoder and decoder. The pattern is:

```
output = LayerNorm(x + Sublayer(x))
```

This serves several purposes:

- **Gradient flow:** Residual connections create shortcut paths that allow gradients to flow directly through the network, enabling training of deep stacks.
- **Identity baseline:** Each sub-layer only needs to learn a residual modification to its input, rather than a complete transformation.
- **Dimension constraint:** To make addition possible, all sub-layers and embeddings produce outputs of the same dimension (d_model = 512).

Layer normalization (Ba et al., 2016) stabilizes activations by normalizing across the feature dimension at each position.

## Positional Encoding

Since the Transformer contains no recurrence or convolution, it has no inherent notion of token order. Positional encodings are added to the input embeddings to inject sequence position information:

```
PE(pos, 2i)     = sin(pos / 10000^(2i/d_model))
PE(pos, 2i + 1) = cos(pos / 10000^(2i/d_model))
```

Key properties:

- Each dimension corresponds to a sinusoid with a different wavelength, forming a geometric progression from 2pi to 10000 * 2pi.
- For any fixed offset k, PE_{pos+k} can be represented as a linear function of PE_{pos}, which may help the model learn to attend by relative position.
- Sinusoidal encodings may allow extrapolation to sequence lengths longer than those seen during training.
- Learned positional embeddings produce nearly identical results (per ablation in the original paper), but sinusoidal encodings were chosen for their extrapolation potential.

Positional encodings have the same dimension as the token embeddings (d_model) and are added (not concatenated) to the embeddings at the bottom of both the encoder and decoder stacks.

## Model Dimensions

| Parameter | Base Model | Big Model |
|-----------|-----------|-----------|
| Layers (N) | 6 | 6 |
| d_model | 512 | 1024 |
| d_ff | 2048 | 4096 |
| Attention heads (h) | 8 | 16 |
| d_k = d_v | 64 | 64 |
| Parameters | 65M | 213M |
| Dropout | 0.1 | 0.3 |

## Embeddings and Weight Sharing

- Learned embeddings convert input and output tokens to vectors of dimension d_model.
- The same weight matrix is shared between the input embedding layer, the output embedding layer, and the pre-softmax linear transformation.
- Embedding weights are scaled by sqrt(d_model).

## Information Flow Summary

```
Input tokens
    |
    v
Token Embedding + Positional Encoding
    |
    v
[Encoder Layer x 6]
    |  - Multi-head self-attention
    |  - Residual + LayerNorm
    |  - FFN
    |  - Residual + LayerNorm
    |
    v
Encoder output (z)  ------>  [Decoder Layer x 6]
                                |  - Masked multi-head self-attention
                                |  - Residual + LayerNorm
                                |  - Cross-attention (Q from decoder, K/V from encoder)
                                |  - Residual + LayerNorm
                                |  - FFN
                                |  - Residual + LayerNorm
                                |
                                v
                           Linear + Softmax --> Output probabilities
```

## Why It Works

The Transformer's design addresses three fundamental limitations of recurrent architectures:

1. **Parallelism:** All positions in a layer are computed simultaneously, enabling efficient use of modern GPU hardware. Training the base model takes only 12 hours on 8 P100 GPUs.
2. **Short dependency paths:** [[self-attention]] connects any two positions in O(1) operations, making long-range dependencies easier to learn compared to O(n) for RNNs.
3. **Flexible attention patterns:** Multi-head attention allows the model to learn diverse, task-specific patterns of information routing (syntactic, semantic, positional) simultaneously.

## Legacy and Impact

The Transformer became the foundation of modern deep learning:

- **NLP:** BERT (encoder-only), GPT (decoder-only), T5 (encoder-decoder) all build directly on this architecture.
- **Vision:** Vision Transformer (ViT) applies the same architecture to image patches.
- **Multimodal:** Models like CLIP and Flamingo extend Transformers across modalities.
- **Scale:** The architecture's parallelism enabled scaling to billions and trillions of parameters, driving the large language model era.

## Related Pages

- [[attention-is-all-you-need]] -- the original paper introducing this architecture
- [[self-attention]] -- the attention mechanism at the heart of every Transformer layer
- [[residual-connections]] -- the skip connections used around every sub-layer
