# MDD assessor bot

This repository contains the `MDD assessor bot`, a LLM experiment for providing students with feedback.

## Pre-requisites

- Have [ollama](https://ollama.com/) installed and running
- Have [downloaded a model](https://ollama.com/library) locally

## Disclaimers

1. This tool is not meant to give you any orientation on your actual future grading with an assessment committee, this tool is only provided as an experiment on using Large Language Models (LLMs) for the writing process of MDD submissions.
1. It checks your writing against the set of indicators, as interpreted by an LLM.
1. We think LLMs can be very useful as writing aids **if used well**.
1. The grades and feedback that you get from this tool will likely differ greatly from what your human assessors will do.
1. Remember that LLMs cannot tell good from bad design and cannot _"understand"_ your rationale, it only seems like they do because the can respond eloquently in your own language
1. LLMs can not reason ([source](https://arstechnica.com/ai/2024/10/llms-cant-perform-genuine-logical-reasoning-apple-researchers-suggest/)) , and they can also not _"see"_ the images in your portfolio, so their assessment is very partial and might differ from what your human assessors will do
1. This tool is aimed to be a fun experiment on how check as you make progress on your documents for the assessment, we think it can be helpful in making sure that there are no obvious omissions for certain indicators for example.
1. This tool will not upload your assessment documents to any cloud service before running them through an LLM. A local LLM is used via Ollama, so it is safe to use for potentially sensitive intellectual property materials.
1. Your documents are not deleted after the report is given.

---

Concept and designed by Jaap Hulst, Niloo Zabardast and Elena Mihai
