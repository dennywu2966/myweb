---
title: "Highway Networks"
type: source-summary
created: 2026-04-08
updated: 2026-04-08
sources: [highway-networks-1505.00387.pdf]
tags: [deep-learning, network-architecture, gating, gradient-flow, IDSIA]
---

# Highway Networks

**Paper**: "Highway Networks" by Rupesh Kumar Srivastava, Klaus Greff, and Jurgen Schmidhuber (The Swiss AI Lab IDSIA). Extended abstract presented at the Deep Learning Workshop, ICML 2015. arXiv:1505.00387. A full paper extending this work is available at arXiv:1507.06228.

## Problem

Depth is a crucial ingredient for the success of neural networks -- deeper architectures represent certain function classes exponentially more efficiently than shallow ones. However, training becomes substantially harder as layers are added. Even with variance-preserving initialization schemes (Glorot & Bengio, 2010; He et al., 2015), optimization of very deep plain networks stalls. Prior solutions required multi-stage training, companion loss functions, or pre-trained teacher networks, all of which add complexity and constrain architecture choices.

## Core Contribution

Highway networks introduce a learned [[gating-mechanism]] that allows information to flow across many layers without attenuation. The architecture is directly inspired by the gating structure of Long Short-Term Memory (LSTM) recurrent networks (Hochreiter & Schmidhuber, 1995).

### The Highway Layer Equation

A plain feedforward layer computes:

> y = H(x, W_H)

A highway layer instead computes:

> y = H(x, W_H) * T(x, W_T) + x * (1 - T(x, W_T))

where:

- **H** is the usual nonlinear transform (affine + activation).
- **T** is the **transform gate**, a sigmoid-activated function that learns how much of the transformed signal to let through.
- **(1 - T)** acts as the **carry gate** (C), controlling how much of the raw input to pass through unchanged.

This formulation means:

- When T = 0, the layer output is simply x (identity / carry behavior).
- When T = 1, the layer output is H(x) (standard transform behavior).
- In practice, T operates in (0, 1), so the layer smoothly interpolates between these extremes.

The Jacobian dy/dx is similarly interpolated: it equals the identity matrix I when T = 0 and the transform Jacobian H'(x) when T = 1. This is the mechanism that enables unimpeded gradient flow -- the "information highways" that give the architecture its name.

### Initialization

The transform gate bias b_T is initialized to a negative value (e.g., -1 to -10), biasing the network toward carry behavior at the start of training. This scheme is independent of the choice of activation function for H, which is a significant advantage: plain networks require carefully matched initialization for each activation function. This initialization strategy mirrors the forget-gate bias technique from Gers et al. (1999) for LSTM networks.

## Key Experiments

### Optimization (MNIST)

Plain networks and highway networks with 10, 20, 50, and 100 layers were compared on MNIST. Plain networks degrade sharply beyond 20 layers; highway networks optimize well at all depths, with the 100-layer highway network achieving training error on par with the 10-layer plain network. A 900-layer highway network was also trained on CIFAR-100 with no signs of optimization difficulty.

### Generalization (CIFAR-10, comparison to FitNets)

Highway networks matched or exceeded the accuracy of FitNets (Romero et al., 2014) while being trained directly with backpropagation -- no teacher network or hint-based training required. A 19-layer highway network with 2.3M parameters achieved 92.24% test accuracy, outperforming all FitNet variants including the 19-layer FitNet 4 (91.61%) that required a pre-trained teacher.

## Analysis of Learned Gates

Inspection of trained 50-layer highway networks on MNIST and CIFAR-100 revealed:

- **Biases decreased further during training** -- the network pushed gates toward even more negative values than initialization, making them more selective rather than shutting them down.
- **Transform gate activity is sparse** -- for a given input, only a few layers actively transform the signal; most layers carry the input through.
- **Block outputs form "stripes"** -- outputs remain nearly constant across many consecutive layers, visually demonstrating the information highway concept. Most transformation occurs in early layers (~10 for MNIST, ~30 for CIFAR-100).
- **Gate activity is input-dependent** -- the network routes information differently for different inputs, acting as a learned, data-dependent routing mechanism.

## Significance and Legacy

Highway networks were the first architecture to demonstrate that networks with hundreds of layers could be trained with simple SGD, solving the depth-optimization problem without requiring special initialization, multi-stage training, or auxiliary losses. The core insight -- that learned gating can create shortcut paths for both forward signals and gradients -- directly influenced the development of:

- **Residual Networks (ResNets)** (He et al., 2015): ResNets can be viewed as highway networks where T is fixed at 1 and the carry path is always open (a pure additive skip connection: y = H(x) + x). ResNets remove the learned gate, trading flexibility for simplicity and parameter efficiency.
- **Transformer architectures**: The principle of maintaining a "residual stream" that layers read from and write to, combined with gating and normalization, is a descendant of the information highway idea. Attention mechanisms themselves involve learned, data-dependent routing of information -- a generalization of the per-unit gating in highway networks.

The paper established that **the vanishing gradient problem in deep feedforward networks is solvable through architectural design** (learned gates and shortcut paths), not just through better initialization or training tricks. This insight is foundational to the entire modern deep learning stack.

## Related Pages

- [[gating-mechanism]] -- The transform gate / carry gate formulation introduced in this paper.
