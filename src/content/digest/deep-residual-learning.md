---
title: "Deep Residual Learning for Image Recognition"
type: source-summary
created: 2026-04-08
updated: 2026-04-08
sources: [deep-residual-learning-1512.03385.pdf]
tags: [resnet, residual-learning, deep-learning, computer-vision, imagenet]
---

# Deep Residual Learning for Image Recognition

**Authors:** Kaiming He, Xiangyu Zhang, Shaoqing Ren, Jian Sun (Microsoft Research)
**Published:** December 2015 (arXiv:1512.03385)
**Venue:** CVPR 2016; won 1st place in ILSVRC 2015 classification, detection, and localization tasks

## Core Problem: The Degradation Problem

When "plain" (non-residual) deep networks are made deeper, training error *increases* rather than decreasing. This is not overfitting -- the deeper network performs worse on *training* data. A 56-layer plain network has higher training error than a 20-layer one on CIFAR-10, and a 34-layer plain network degrades compared to an 18-layer one on ImageNet.

This is paradoxical: a deeper network's solution space is a strict superset of a shallower one's. A construction exists where the extra layers simply perform identity mappings. The fact that SGD cannot find solutions at least as good as the shallower network reveals an optimization difficulty, not a capacity problem.

The authors argue this is distinct from [[vanishing-gradients]]: batch normalization ensures forward signals have non-zero variance and backward gradients have healthy norms. The deeper plain networks still converge -- they just converge to worse solutions.

## Key Insight: Residual Learning

Instead of asking a stack of layers to directly learn a desired mapping H(x), let them learn the **residual** F(x) = H(x) - x. The output of the block is then F(x) + x. This is implemented by adding a **shortcut connection** (also called a [[residual-connections|skip connection]]) that bypasses the nonlinear layers and adds the input directly to their output.

The core hypothesis: if the optimal transformation is close to the identity, it is easier for nonlinear layers to learn a small perturbation F(x) near zero than to learn the full identity mapping directly. Experiments confirm this -- the learned residual functions generally have small responses (small standard deviations of layer outputs), suggesting each layer only makes a small modification to its input.

## Formulation

A residual building block is defined as:

> y = F(x, {W_i}) + x

where F is the residual mapping computed by the stacked nonlinear layers. When input and output dimensions differ (e.g., when the number of channels changes), a linear projection W_s is used on the shortcut:

> y = F(x, {W_i}) + W_s * x

Identity shortcuts add **no extra parameters** and no computational cost beyond element-wise addition.

## Architecture Variants (ResNet)

All architectures use [[batch-normalization]] after each convolution and before activation. No [[dropout]] is used.

| Model | Layers | FLOPs | Key Design |
|---|---|---|---|
| ResNet-18 | 18 | 1.8B | 2-layer basic blocks |
| ResNet-34 | 34 | 3.6B | 2-layer basic blocks |
| ResNet-50 | 50 | 3.8B | 3-layer bottleneck blocks |
| ResNet-101 | 101 | 7.6B | 3-layer bottleneck blocks |
| ResNet-152 | 152 | 11.3B | 3-layer bottleneck blocks |

**Bottleneck design:** For the deeper models (50+), each residual block uses three layers -- 1x1 (reduce dimensions), 3x3 (convolution), 1x1 (restore dimensions) -- making them more parameter-efficient. Identity shortcuts are especially important for bottleneck blocks because projection shortcuts would double the computation.

**Comparison with VGG:** ResNet-152 (11.3B FLOPs) is 8x deeper than VGG-19 but has lower computational cost (VGG-19: 19.6B FLOPs).

## Shortcut Options

Three projection strategies were compared for dimension-changing shortcuts:

- **Option A:** Zero-padding for increased dimensions; all shortcuts are parameter-free. Slightly worse because zero-padded dimensions have no residual learning.
- **Option B:** Projection shortcuts only where dimensions change; identity elsewhere. Used in practice for 50+ layer models.
- **Option C:** All shortcuts are projections. Marginally better but adds parameters without significant benefit.

The small differences among A/B/C confirm that projection shortcuts are not essential for solving the degradation problem.

## Relation to Highway Networks

Concurrent work on [[highway-networks]] also uses shortcut connections, but with learned [[gating-mechanism|gating functions]] that control information flow. Key differences:

- Highway gates are data-dependent with learnable parameters; ResNet shortcuts are parameter-free identity mappings.
- When a highway gate closes (approaches zero), the layer becomes non-residual. ResNet shortcuts are *never* closed -- all information always passes through.
- Highway networks did not demonstrate accuracy gains beyond ~100 layers; ResNets scale to 1000+ layers.

## Results

### ImageNet (ILSVRC 2015)

- ResNet-34 reduces top-1 error by 3.5% over its plain counterpart (25.03% vs. 28.54%).
- ResNet-152 achieves 4.49% top-5 single-model error, outperforming all prior single models and ensembles.
- An ensemble of six ResNets achieves **3.57% top-5 error**, winning 1st place.

### CIFAR-10

- ResNets consistently gain accuracy with depth (20, 32, 44, 56, 110 layers).
- A 110-layer ResNet achieves 6.43% error, competitive with state-of-the-art.
- A 1202-layer ResNet trains without optimization difficulty (training error < 0.1%), but overfits on this small dataset (7.93% test error), suggesting regularization rather than optimization is the bottleneck at extreme depth.

### Object Detection (Transfer Learning)

- Replacing VGG-16 with ResNet-101 in Faster R-CNN yields a 28% relative improvement on COCO mAP@[.5,.95] (21.2% to 27.2%).
- Improvements on PASCAL VOC: 73.2% to 76.4% mAP on VOC 2007.

## Analysis of Layer Responses

A key empirical finding: the standard deviation of residual function outputs is generally small, and decreases as networks get deeper. This supports the thesis that individual residual layers learn small perturbations to their input rather than entirely new representations. Deeper ResNets have even smaller per-layer modifications, consistent with the view that each layer is making incremental refinements.

## Significance and Legacy

This paper established [[residual-connections]] as the dominant paradigm for training very deep networks. The insight that layers should learn *perturbations* to an identity mapping rather than full transformations was later adopted far beyond computer vision:

- The [[transformer-architecture]] uses residual connections around every [[self-attention]] and feed-forward sublayer.
- Pre-norm vs. post-norm residual connection placement became a major design question in [[large-language-models]].
- The [[attention-residual]] mechanism modifies the residual stream pattern for attention-specific purposes.
- Theoretical work on the "unrolled view" of residual networks revealed them as implicit ensembles of shallower paths (see [[residual-connections]]).
