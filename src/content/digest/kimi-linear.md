---
title: "Kimi Linear"
type: entity
created: 2026-04-08
updated: 2026-04-08
sources: [attention-residuals-2603.15031.pdf]
tags: [language-model, mixture-of-experts, moonshot-ai, kimi, transformer]
---

# Kimi Linear

**Kimi Linear** is a large language model architecture developed by Moonshot AI (the Kimi Team). It is a Mixture-of-Experts (MoE) [[transformer-architecture|Transformer]] with **48B total parameters and 3B activated parameters**, following the Moonlight / DeepSeek-V3 design paradigm. The [[attention-residuals]] paper uses Kimi Linear as the production-scale testbed for integrating Block [[attention-residuals-mechanism|Attention Residuals]].

## Architecture

Based on what is described in the Attention Residuals paper:

- **Model class**: MoE Transformer following the Moonlight / DeepSeek-V3 design.
- **Total parameters**: 48B.
- **Activated parameters**: 3B per token.
- **Transformer blocks**: 27 (54 layers, counting attention and MLP sublayers separately).
- **Expert routing**: 8 out of 256 routed experts plus 1 shared expert per MoE layer.
- **Attention**: Hybrid design interleaving **Kimi Delta Attention (KDA)** and **Multi-Head Latent Attention (MLA)** layers in a 3:1 ratio, each followed by an MoE feed-forward layer. MLA operates without positional encodings (NoPE), so context extension requires no modifications such as YaRN or attention temperature rescaling.

## Training Recipe (as used in the AttnRes paper)

- **Pre-training data**: 1.4T tokens total.
- **Context window**: 4096 tokens during pre-training, extended to 32K during mid-training.
- **Optimizer**: Muon.
- **Learning rate schedule**: WSD (Warmup-Stable-Decay).
- **Global batch size**: 8M tokens.
- **Two-stage training**: (i) WSD pre-training on 1T tokens, followed by (ii) mid-training on ~400B high-quality tokens following the Moonlight annealing recipe.

## Integration with Attention Residuals

When equipped with Block [[block-attention-residuals|AttnRes]]:

- **Block configuration**: 6 layers per block, producing 9 blocks plus the token embedding for 10 depth-wise sources.
- **Training overhead**: Less than 4% under pipeline parallelism.
- **Inference overhead**: Less than 2% on typical workloads.

The AttnRes variant matches or outperforms the baseline on all evaluated benchmarks, with particularly strong gains on multi-step reasoning (GPQA-Diamond +7.5), math (Math +3.6), and code generation (HumanEval +3.1).

## Related Pages

- [[attention-residuals]] -- The paper in which Kimi Linear serves as the primary evaluation platform
- [[block-attention-residuals]] -- The Block AttnRes variant integrated into Kimi Linear
- [[transformer-architecture]] -- The broader architecture family
