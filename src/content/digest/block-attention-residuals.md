---
title: "Block Attention Residuals"
type: concept
created: 2026-04-08
updated: 2026-04-08
sources: [attention-residuals-2603.15031.pdf]
tags: [residual-connections, attention, depth-wise-attention, pipeline-parallelism, inference-optimization, transformer]
---

# Block Attention Residuals

**Block Attention Residuals (Block AttnRes)** is a scalable variant of Full [[attention-residuals-mechanism|Attention Residuals]] that partitions layers into blocks, applying standard summation within blocks and softmax attention only across block-level representations. Introduced in [[attention-residuals]], Block AttnRes reduces memory and communication overhead from O(Ld) to O(Nd) while preserving most of the gains of the full method.

## Motivation

Full AttnRes requires storing all L layer outputs and, under pipeline parallelism, transmitting them across stage boundaries -- both of which scale as O(Ld). In vanilla training this overlaps with activations already retained for backpropagation, but at scale, activation recomputation and pipeline parallelism are routinely employed, making the O(Ld) overhead prohibitive. Block AttnRes addresses this with a structured approximation that maintains the essential cross-layer attention capability at a fraction of the cost.

## Block Partitioning Scheme

The L layers are divided into N contiguous blocks of S = L/N layers each (with the last block absorbing any remainder when L is not divisible by N).

### Intra-Block Accumulation

Within each block B_n, layer outputs are accumulated via standard summation into a single block representation:

> b_n = sum_{j in B_n} f_j(h_j)

A partial sum b_n^i tracks the accumulation of the first i layers within block n, so b_n = b_n^S. The block structure also defines b_0 = h_1 (the token embedding), ensuring it is always included as a depth-wise source.

### Inter-Block Softmax Attention

For the i-th layer within block n, the input h_l is computed by applying softmax attention (using the same [[attention-residuals-mechanism|AttnRes mechanism]] with pseudo-queries and RMSNorm on keys) over the value matrix:

- **First layer of block n (i=1)**: V = [b_0, b_1, ..., b_{n-1}]^T -- attends only over completed previous block representations.
- **Subsequent layers (i >= 2)**: V = [b_0, b_1, ..., b_{n-1}, b_n^{i-1}]^T -- additionally attends to the partial sum within the current block.

The RMSNorm applied to keys prevents magnitude differences between complete blocks and partial sums from biasing the attention weights -- a critical property given that partial sums will have smaller magnitudes than fully accumulated blocks.

The final output layer aggregates all N block representations.

## Memory Reduction

Since each layer now attends over N block representations rather than L individual outputs:

| Resource | Full AttnRes | Block AttnRes |
|---|---|---|
| Memory (per token) | O(Ld) | O(Nd) |
| Computation | O(L^2 d) | O(N^2 d) (with O(LS d) intra-block) |
| Communication (pipeline) | O(Ld) per stage | O(Nd) per stage |
| Stored hidden states per token | L | N |

With typical settings of L=128 and N=8, this is a 16x reduction in cross-layer storage.

## The Interpolation Property

The block count N interpolates between two extremes:

- **N = L**: Every layer is its own block, recovering Full AttnRes exactly.
- **N = 1**: All layers form a single block, reducing to standard [[residual-connections]] with the embedding isolated as b_0.

Empirically, N ~ 8 recovers most of the benefit of Full AttnRes. An ablation sweeping block size S from 1 (Full AttnRes) to 32 shows graceful degradation: S=2, 4, 8 all achieve similar loss near 1.746 (vs Full AttnRes at 1.737 and baseline at 1.766), while larger blocks (S=16, 32) move toward baseline performance.

## Two-Phase Inference Strategy

The key insight enabling efficient inference is that pseudo-queries w_l are learned parameters **decoupled from forward computation** -- they do not depend on hidden states. This allows batching.

### Phase 1: Parallel Inter-Block Attention

All S queries within a block are batched into a single matrix multiplication against the cached block representations. This computes inter-block attention for all S layers simultaneously, returning both outputs and softmax statistics (max values and log-sum-exp). Memory access is amortized from S separate reads to just 1.

### Phase 2: Sequential Intra-Block Attention + Online Softmax Merge

Each layer within the block sequentially computes its intra-block attention using the evolving partial sum b_n^i. The intra-block result is then merged with the Phase 1 inter-block result via **online softmax**: the two sets of softmax statistics (max and log-sum-exp from each phase) are combined elementwise to produce the correctly normalized final output, without needing to recompute the full softmax over all sources jointly.

This online softmax merge is elementwise, naturally admitting kernel fusion with surrounding operations (e.g., RMSNorm), further reducing I/O overhead.

### Per-Layer I/O Cost

| Scheme | Reads per layer | Writes per layer | Total I/O | Typical (L=128, N=8, S=16) |
|---|---|---|---|---|
| Standard Residuals | 2d | d | 3d | 3d |
| mHC (m=4 streams) | (8m+2)d + ... | ... | ~34d | 34d |
| Full AttnRes (two-phase) | (S+N-2)d | 2d | (S+N)d | 24d |
| Block AttnRes (two-phase) | (N/S + 3)d | 2d | (N/S + 5)d | 5.5d |

Block AttnRes achieves per-layer I/O of just 5.5d -- only 1.8x the cost of standard [[residual-connections]] (3d) and far below mHC's 34d. Phase 1 can also partially overlap with the computation of the first layer in the block, further reducing wall-clock impact.

## Cache-Based Pipeline Communication

Under pipeline parallelism, block representations must be transmitted across pipeline stages. A naive implementation transmits the full accumulated history at every stage transition, incurring quadratic communication cost.

### The Caching Optimization

With P physical stages and V virtual stages per stage (in an interleaved pipeline schedule), each physical stage processes multiple virtual stages in succession. Blocks received during earlier virtual stages can be cached locally and need not be re-transmitted. Only incremental blocks (those completed since the receiver's last virtual stage) are sent.

**Naive communication**: O(C^2) where C = PV total chunks.

**Cached communication**: O(P^2 + VP^2) -- a V-fold reduction in peak per-transition cost, from O(C) to O(P).

For example, with P=4 and V=2, caching eliminates 6 redundant block transmissions. The same scheme benefits the backward pass.

### Memory Overhead

With cross-stage caching, each block is stored exactly once across all V virtual stages, which is negligible relative to standard per-layer activation cache. Per-layer activation footprint remains identical to standard architectures since activation checkpointing eliminates all inter-block attention intermediates.

## Practical Overhead Numbers

From the [[attention-residuals]] paper's experiments on the [[kimi-linear]] architecture (48B/3B MoE):

- **Training overhead without pipeline parallelism**: Negligible.
- **Training overhead with pipeline parallelism**: Less than 4% end-to-end.
- **Inference latency overhead**: Less than 2% on typical workloads.
- **Memory for prefilling** (128K context, 8 blocks): 15 GB total, reduced to 1.9 GB per device with sequence sharding, and under 0.3 GB per device with chunked prefill.

## Production Configuration

In the 48B Kimi Linear model: 27 Transformer blocks (54 layers), Block AttnRes with 6 layers per block, producing 9 blocks plus the token embedding for 10 depth-wise sources.

## Related Pages

- [[attention-residuals]] -- Source summary of the full paper
- [[attention-residuals-mechanism]] -- The AttnRes mechanism (Full variant and formal definition)
- [[depth-wise-attention]] -- Theoretical framework: attention over depth
- [[prenorm-dilution]] -- The problem motivating AttnRes
- [[residual-connections]] -- Standard residuals that AttnRes generalizes
- [[hyper-connections]] -- Alternative approach via multi-stream residuals
- [[multi-stream-residuals]] -- Broader family of multi-stream methods
- [[kimi-linear]] -- Production architecture using Block AttnRes
- [[transformer-architecture]] -- Base architecture context
