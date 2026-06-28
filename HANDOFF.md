# HANDOFF — Tutor me for the Neural Networks & Computer Vision exam

> **New chat: read this whole file first, then start teaching me from Topic 1 (or ask which topic I want to start with).**

## Who I am / what I need
- I'm **Shaurya**. Exam subject: **Neural Networks & Intro to Computer Vision (ML III)** — Term 8.
- **I have NOT studied any of this yet.** Treat me as a genuine first-time learner, not someone revising.
- **Goal: understand it well enough to pass the exam.** Practical, not academic perfection.
- I want it **concise but complete** — explain *everything* that matters, but **no fluff, no padding, no walls of text.** Don't write 5 paragraphs where 5 bullets do.

## How to teach me (important)
- **Teach interactively, one topic at a time.** Don't dump a whole topic at once. Explain a chunk, then check I'm following / let me ask, then continue. I will keep asking questions in the chat — answer them, then resume.
- For each concept: **(1) plain-English intuition first** (a quick analogy is fine), **(2) the actual content** — definitions, the key formula(s), how it works, **(3) one worked example**, **(4) the exam-relevant "must-know" points** and likely question types.
- Go **slow on the hard/mathy topics** (flagged below) — derive/walk through them step by step. Go **fast on the easy ones.**
- Always tie back to what I already learned in earlier topics.
- Math: show formulas clearly (you can use plain text / code blocks). Don't assume I remember calculus — re-explain chain rule etc. when it comes up.

## The source of truth = the lecture slides (already downloaded)
The real exam material is the instructor's slide decks, downloaded locally as PDFs. **Read the relevant deck with the Read tool (it reads PDFs; use the `pages` arg) before teaching a topic**, so you teach exactly what's examinable.

Path pattern: `subjects/nn/slides/week-N/session-M/` — each lecture has `..._slides_...` (main deck), `..._pre_...` (pre-read), `..._post_...` (post-class summary).

## Curriculum — teach in this order (14 core topics, Weeks 1–7)
| # | Topic | Slide deck (subjects/nn/slides/…) | Hard? |
|---|-------|-----------------------------------|-------|
| 1 | Why Deep Learning? | week-1/session-1/w1s1_slides_why_deep_learning.pdf | easy |
| 2 | Perceptron → MLP (activations, XOR) | week-2/session-1/w2s1_slides_perceptron_to_mlp.pdf | medium |
| 3 | Backpropagation & Computational Graphs | week-2/session-2/w2s2_slides_backpropagation.pdf | **HARD** |
| 4 | Loss Functions & Optimization (SGD, Adam) | week-2/session-3/w2s3_slides_loss_functions_optimization.pdf | **HARD** |
| 5 | Regularization (dropout, BN, weight decay) | week-3/session-1/w3s1_slides_regularization.pdf | easy |
| 6 | Initialization, Normalization & Debugging | week-3/session-2/w3s2_slides_initialization_normalization.pdf | **HARD** |
| 7 | Convolutions | week-4/session-1/w4s1_slides_convolutions.pdf | medium |
| 8 | CNN Architectures (LeNet→ResNet) | week-4/session-2/w4s2_slides_cnn_architectures.pdf | easy |
| 9 | Transfer Learning & CNN Applications | week-5/session-1/w5s1_slides_transfer_learning.pdf | easy |
| 10 | Sequence Modeling: RNNs (BPTT) | week-5/session-2/w5s2_slides_sequence_modeling_rnns.pdf | **HARD** |
| 11 | LSTMs, GRUs & Gating | week-6/session-1/w6s1_slides_lstms_grus.pdf | **HARD** |
| 12 | Seq2Seq & Attention | week-6/session-2/w6s2_slides_seq2seq_attention.pdf | **HARD** |
| 13 | The Transformer & Self-Attention (Q/K/V) | week-7/session-1/w7s1_slides_transformer_self_attention.pdf | **HARD** |
| 14 | Transformers in Practice — BERT & GPT | week-7/session-2/w7s2_slides_bert_gpt.pdf | medium |

(Week 8 = hands-on coding projects: ANN regression, neural style transfer, Shakespeare text gen, seq2seq translation, mini-transformer, nanoGPT+LoRA — `subjects/nn/slides/week-8/…` — only teach these if I ask; they're less likely on a written exam.)

## Notes already written (use as your outline / my quick reference)
- **Concise exam notes** (one page per topic, complete checklist + formulas + likely Q&A): `subjects/nn/exam/*.html` (and `subjects/nn/exam/index.html`). These are accurate and slide-faithful — good as your teaching skeleton. They are intentionally terse (that's exactly why I need you to actually *teach* the hard ones).
- Verbose first-timer sessions also exist at `subjects/nn/sessions/` but were written from the syllabus, **not** these exact slides — prefer the slides + exam notes.

## Track my progress
As we go, keep a short running checklist in the chat of which of the 14 topics I've (a) been taught, (b) confirmed I understand. At the end of each topic, give me 2–3 quick self-test questions before moving on.

## Project context (only if relevant)
This repo is a personal study-notes **website** (4 subjects: GenAI, HLD, Neural Nets, ADBMS) with per-session pages, cheat sheets, and a read-aloud player. For tutoring you mostly just need to **read the NN slide PDFs**. 
**Git caution:** do NOT commit or push anything unless I explicitly say so. (There's an unresolved deploy decision from a previous chat — ignore it unless I bring it up.)

## Other subjects (only if I ask)
GenAI, HLD, ADBMS also have full notes + a 1-page cheat sheet each under `subjects/<subject>/`. If I switch to those, same teaching style applies.

---
### Start here
Begin by greeting me briefly, confirm we're starting **Topic 1 (Why Deep Learning?)** unless I say otherwise, **read that slide deck**, then teach it interactively per the style above. Keep it concise. Then wait for me.
