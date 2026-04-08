---
title: "Attention Is All You Need"
type: source-summary
created: 2026-04-08
updated: 2026-04-08
sources: [attention-is-all-you-need-1706.03762.pdf]
tags: [transformer, attention, machine-translation, deep-learning, foundational-paper]
---

# Attention Is All You Need

**Authors:** Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Lukasz Kaiser, Illia Polosukhin (Google Brain / Google Research / University of Toronto)

**Published:** NeurIPS 2017 (arXiv: 1706.03762)

## Key Contribution

The paper introduces the [[transformer-architecture]], the first sequence transduction model based entirely on attention mechanisms. It dispenses with recurrence and convolutions completely, relying solely on [[self-attention]] to model dependencies between input and output positions. This design enables significantly greater parallelization during training and achieves new state-of-the-art results on machine translation benchmarks.

## Motivation

Prior to this work, dominant sequence models (RNNs, LSTMs, GRUs) processed tokens sequentially, with hidden state h_t depending on h_{t-1}. This sequential dependency:

- **Prevented parallelization** within training examples, creating a bottleneck at longer sequence lengths.
- **Made long-range dependencies hard to learn**, since gradients must flow through O(n) steps.

Convolutional approaches (ByteNet, ConvS2S) offered parallelism but required O(n/k) or O(log_k(n)) layers to connect distant positions. The Transformer reduces the path length between any two positions to O(1) via self-attention.

## Architecture Overview

The [[transformer-architecture]] follows an encoder-decoder structure:

- **Encoder:** 6 identical layers, each with (1) multi-head [[self-attention]] and (2) a position-wise feed-forward network. Each sub-layer uses [[residual-connections]] and layer normalization.
- **Decoder:** 6 identical layers with an additional cross-attention sub-layer that attends to encoder output. The decoder self-attention is masked to preserve autoregressive generation.
- **Positional encoding:** Sinusoidal functions inject sequence-order information, since the architecture contains no recurrence or convolution.

All sub-layers and embeddings use d_model = 512 dimensions.

## Scaled Dot-Product Attention

The core mechanism computes:

```
Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) V
```

Scaling by 1/sqrt(d_k) prevents dot products from growing large and pushing softmax into regions with vanishingly small gradients. See [[self-attention]] for details.

## Multi-Head Attention

Rather than a single attention function, the model uses h = 8 parallel heads, each projecting Q, K, V to lower dimensions (d_k = d_v = 64). This lets the model attend to information from different representation subspaces simultaneously. Results are concatenated and linearly projected.

The Transformer uses multi-head attention in three ways:
1. **Encoder self-attention** -- each position attends to all positions in the previous encoder layer.
2. **Masked decoder self-attention** -- each position attends only to earlier positions (preserving autoregression).
3. **Encoder-decoder cross-attention** -- decoder queries attend to all encoder output positions.

## Results

### Machine Translation

| Task | Model | BLEU | Training Cost |
|------|-------|------|---------------|
| EN-DE | Transformer (big) | **28.4** | 3.3 x 10^18 FLOPs |
| EN-FR | Transformer (big) | **41.8** | 2.3 x 10^19 FLOPs |

The Transformer (big) surpassed all prior models and ensembles on EN-DE, and set a new single-model SOTA on EN-FR -- at a fraction of the training cost of competing approaches.

### English Constituency Parsing

A 4-layer Transformer achieved 91.3 F1 (WSJ-only) and 92.7 F1 (semi-supervised), demonstrating generalization beyond machine translation without task-specific tuning.

## Model Variations (Ablation)

Key findings from ablation studies (Table 3 of the paper):

- **Number of heads matters:** Single-head attention is 0.9 BLEU worse than 8 heads; too many heads also degrades quality.
- **Attention key dimension matters:** Reducing d_k hurts quality, suggesting dot-product compatibility needs sufficient capacity.
- **Bigger models are better:** Increasing d_model and d_ff improves results.
- **Dropout is critical:** Removing dropout significantly hurts performance.
- **Learned vs. sinusoidal positional encodings:** Nearly identical results, but sinusoidal chosen for potential extrapolation to longer sequences.

## Training Details

- **Data:** WMT 2014 EN-DE (4.5M sentence pairs, BPE ~37K tokens), WMT 2014 EN-FR (36M sentence pairs, 32K word-piece).
- **Hardware:** 8 NVIDIA P100 GPUs. Base model: 12 hours (100K steps). Big model: 3.5 days (300K steps).
- **Optimizer:** Adam with a warmup-then-decay learning rate schedule (warmup_steps = 4000).
- **Regularization:** Residual dropout (P_drop = 0.1), label smoothing (epsilon_ls = 0.1).

## Significance

This paper is one of the most consequential in modern deep learning. The Transformer architecture became the foundation for virtually all subsequent large language models (BERT, GPT, T5, etc.) and has been adapted far beyond NLP to vision, audio, protein folding, and more. Its key insight -- that [[self-attention]] alone, without recurrence, can model sequence dependencies effectively and efficiently -- fundamentally changed the field.

## Related Pages

- [[transformer-architecture]] -- detailed concept page on the architecture
- [[self-attention]] -- the attention mechanism at the core of the Transformer
- [[residual-connections]] -- used throughout the Transformer's sub-layers
