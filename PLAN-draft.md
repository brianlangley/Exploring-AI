# LM Studio, Explained: Project Plan

Field: Value
Course: Exploring AI (1923EXARIZ), BIM year 2, Inholland Amsterdam
Deliverable: Bewijsstuk 3, Toolonderzoek & Demo (AI Tool Market, Les 3)
Presentation date: Thursday 26 November 2026
Owner: Brian
Format: Interactive one page website with a Three.js "desk computer" that walks through every step
Hosting: Netlify (or GitHub Pages), public URL so it can be shared after the presentation
Facts verified on: 25 November 2026 (LM Studio 0.4.28)

---

## 1. What the assignment actually asks for

Bewijsstuk 3 (Roadmap): a description of the tool, application area, costs, strong and weak points, and a mini demo.

Week 2 slides (slide 41 and 42) judge a tool on:

- Functionaliteit (functionality): does it solve the problem?
- Gebruiksgemak (ease of use): can you work with it within 30 minutes?
- Kwaliteit (quality): is the output usable for a client?
- Kosten (costs): is the value worth the price?
- Beperkingen (limitations): what does not work well or is missing?
- Use cases: when would you use it, and when not?
- Goede en slechte toepassingen, and "wat maakt deze tool uniek?"

Rule for this plan: every one of those points gets its own section on the site, so the site doubles as the portfolio evidence.

Later in the course: the final video (section 3, AI toolkeuze) asks "which tool, why, which alternatives". The site's Alternatives section can be reused there.

---

## 2. The concept

Name: LM Studio, Explained (working title)
One liner: "Run AI on your own computer. Here is what fits yours, how to set it up, and what you can build with it."

Story arc (scroll driven):

1. A desk with a computer in the dark. The screen turns on.
2. The camera moves into the case: RAM sticks and GPU light up, the site checks your device.
3. Back to the screen: a mock LM Studio window. You "download" a model, load it, chat with it.
4. The camera follows the data: model file on disk, loaded into memory, tokens streaming out to the screen.
5. Zoom out: the computer connects to other things (an app via the API, a phone via LM Link, tools via MCP).
6. End card: verdict, costs, strengths, weaknesses, sources.

Design rule: the 3D is the guide, the content lives in normal HTML panels next to it. If the 3D fails or is slow, the content still works.

---

## 3. Site map (sections in scroll order)

Section 1: Hero
- Content: headline, one line pitch, "Unofficial student project" badge, start button
- 3D: dark desk, monitor powers on
- Rubric link: introduction

Section 2: What is LM Studio
- Content: desktop app by Element Labs for downloading and running open models locally (Mac, Windows, Linux); current version 0.4.28 (31 Oct 2026); runs llama.cpp and MLX engines
- Show the 2026 shift: the homepage now leads with "Bionic", an agent app that can mix local models with optional hosted models
- Visual: simple local vs cloud diagram (your laptop vs ChatGPT style service)
- Rubric link: beschrijving van de tool

Section 3: Device check (interactive)
- Content: auto detect what the browser allows, then manual sliders to correct it
- 3D: RAM sticks and GPU glow in proportion to the values
- Output: "You can comfortably run: X, Y, Z" plus "Stretch: ..." plus "Not on this machine: ..."
- Logic: see section 5
- Rubric link: gebruiksgemak, toepassingsgebied

Section 4: Model picker (interactive)
- Content: filterable cards from `data/models.json` (size tier, vision, tool use, reasoning, coding)
- Each card: download size, minimum memory, license, link to the official LM Studio model page, copyable `lms get` command
- Callout: "Kimi K3, GLM 5.3 and DeepSeek V4 Pro are open, but far too big for a laptop. In LM Studio they only run as hosted cloud models (Bionic+)."
- Rubric link: kwaliteit, beperkingen

Section 5: Download and install
- Content: OS detected automatically, matching download button, system requirements for that OS
- Links: see section 6
- Rubric link: gebruiksgemak

Section 6: Setup walkthrough (mock app inside the 3D monitor)
- Step 1: first launch
- Step 2: search a model (Ctrl/Cmd + Shift + M)
- Step 3: download, pick a 4 bit quantization
- Step 4: load the model (Ctrl/Cmd + L)
- Step 5: chat, with a scripted fake response that streams token by token
- Step 6: Developer tab, start the local server, show a `curl` call
- Each step: one screenshot of the REAL app (taken by you) next to the mock
- Rubric link: mini demo (the site version), functionaliteit

Section 7: How it works (the "learn something" part)
- Weights: a model is a big file of numbers (GGUF or MLX format)
- Quantization: 16 bit vs 4 bit, shown as the file shrinking in 3D, with the quality trade off
- Memory: the whole model must fit in RAM or VRAM; Apple Silicon shares one memory pool
- Tokens: text is generated one token at a time, show tokens per second
- Context window: more context means more memory
- Rubric link: LD1, basisbegrippen van AI uitleggen

Section 8: Use cases, good and bad
- Good: private documents (chat with files), offline work, students without API budget, developers testing an app against a local OpenAI compatible endpoint, coding assistants, sensitive client data
- Bad: you need frontier level quality, a weak laptop (8 GB), a team that needs a shared hosted service, long agent tasks on small models
- Tie to your BIM case: what could your project's AI feature look like running locally?
- Rubric link: use cases, goede en slechte toepassingen

Section 9: Costs
- Free: $0, run local models, Bionic agent, offline voice transcription, LM Link up to 5 devices, limited web search
- Bionic+: $20 per month, hosted open models (Kimi K3, GLM 5.3, DeepSeek V4 Flash and more), LM Link up to 20 devices, web search
- Pro: $100 per month, 5x usage, LM Link up to 100 devices, included usage of some frontier hosted models
- Enterprise: contact sales (SSO, model and MCP gating, private hub)
- Hidden costs: hardware (RAM, GPU), electricity, your time
- Free for work since 8 July 2025, no commercial license needed anymore
- Rubric link: kosten

Section 10: Strengths and weaknesses
- Strengths: free for home and work; data stays on your device for local models; works offline; easy GUI compared to llama.cpp; OpenAI and Anthropic compatible API; CLI, SDKs (JS and Python) and a headless daemon (llmster); huge model catalog plus any GGUF from Hugging Face
- Weaknesses: needs strong hardware (16 GB recommended, Intel Macs not supported, AVX2 CPU required on Windows x64); local models are weaker than frontier cloud models; big downloads; the product is getting more complex (Bionic, cloud tiers) which blurs the "local only" message; once you use hosted models, your data does leave the device
- To verify before presenting: whether the desktop app itself is closed source (the SDKs and CLI are open source)
- Rubric link: sterke en zwakke punten, beperkingen

Section 11: Alternatives
- Ollama: CLI first, very popular with developers
- Jan: open source desktop app
- GPT4All: beginner friendly desktop app
- llama.cpp: the raw engine LM Studio builds on
- Cloud: ChatGPT, Claude, Gemini (better quality, data leaves your device, subscription)
- Format: small comparison table (local or cloud, GUI, API, price, open source)
- Rubric link: alternatieven (also reusable in the final video)

Section 12: Going further (expand it)
- Local server: OpenAI compatible and Anthropic compatible endpoints at `http://localhost:1234`
- SDKs: `npm install @lmstudio/sdk`, `pip install lmstudio`
- CLI: `lms get`, `lms server start`, `lms chat`
- MCP: give the model tools (files, web, databases), "Add to LM Studio" install links
- LM Link: use the big model on your desktop from your laptop or phone, end to end encrypted, free during preview
- llmster: headless daemon for servers and CI
- Idea board: local RAG over course slides, a private meeting note summariser, a hotel review classifier for a freelance client, an offline coding helper
- 3D: zoom out, the computer gets lines to a phone, a server rack and an app window
- Rubric link: wat maakt deze tool uniek

Section 13: Live demo (optional, stretch)
- "Connect to your own LM Studio": the page calls `http://localhost:1234/v1/models` and `/v1/chat/completions` on the visitor's own machine
- Requires: LM Studio server running with CORS enabled in server settings
- Risk: Chrome may show a "local network access" permission prompt; test this before relying on it
- Fallback: the scripted mock chat from section 6

Section 14: Sources and disclaimer
- All links from section 9 of this file
- Disclaimer text: "Unofficial student project for Inholland Exploring AI. Not affiliated with, sponsored or endorsed by LM Studio or Element Labs. LM Studio and its logos are trademarks of their owner, used here only to refer to the product."

---

## 4. Three.js scene plan

Approach: one persistent WebGL canvas, fixed behind the content; scroll position drives camera keyframes.

Scene objects (low poly, built in code or one GLB):
- Desk, monitor, keyboard, PC case with a glass side panel
- RAM sticks (count and glow driven by the device check)
- GPU (glow driven by VRAM value)
- "Model file" cube that shrinks during quantization, then flies into RAM
- Token particles that stream from GPU to monitor
- Network lines for the "going further" section

Monitor screen: render the mock LM Studio UI as normal HTML. Two options:
- Option A (recommended for tomorrow): when the camera reaches the screen, crossfade from 3D to a full size HTML mock window. Simple, sharp, accessible.
- Option B (later polish): `CSS3DRenderer` places the HTML mock inside the 3D monitor so it stays interactive in perspective.

Camera keyframes (one per section): hero wide shot, into case, screen close up, data flow side view, zoom out network view.

Performance and fallbacks:
- `prefers-reduced-motion`: skip camera moves, show static images
- No WebGL or low FPS: hide canvas, content still fully readable
- Cap pixel ratio at 2, keep total triangles low, lazy load the scene after first paint
- Test on the school projector laptop or a weak laptop before presenting

---

## 5. Device check logic

What the browser can tell you (all approximate):
- RAM: `navigator.deviceMemory`, Chromium only (Chrome, Edge), HTTPS only, rounded to a power of two; desktop values now go up to 32; Firefox and Safari return nothing
- CPU threads: `navigator.hardwareConcurrency`
- OS and architecture: `navigator.userAgentData.getHighEntropyValues(["platform", "architecture"])` in Chromium, fallback to user agent parsing
- GPU: WebGPU `navigator.gpu.requestAdapter()` then `adapter.info` (vendor, architecture); often vague by design

So: auto detect as a starting guess, then always show manual controls:
- RAM slider: 8, 16, 24, 32, 48, 64, 96, 128 GB
- GPU: none or integrated, or dedicated with VRAM slider (4 to 32 GB)
- Apple Silicon toggle (unified memory)

Fit rule (label it clearly as an estimate):
- Usable memory, Apple Silicon: about 70 percent of total RAM
- Usable memory, dedicated GPU: VRAM for full speed, RAM for slower partial offload
- Usable memory, CPU only: about 60 percent of total RAM
- Needed: model download size plus about 1.5 GB for context and overhead
- Result per model: "Runs well" (fits in VRAM or unified memory), "Runs, slower" (fits in RAM only), "Too big"

Privacy note on the page: "Nothing is sent anywhere. All checks run in your browser."

---

## 6. Verified models and links (25 Nov 2026)

Full data lives in `data/models.json`. Summary:

Tier: 8 GB laptops
- Ministral 3 3B: 2.0 GB download, Mistral AI, Apache 2.0, vision, tools, reasoning: https://lmstudio.ai/models/ministral
- Qwen3.5 4B: 3.75 GB download, Apache 2.0, vision, tools, reasoning: https://lmstudio.ai/models/qwen3.5
- Gemma 4 E2B: 4.2 GB download, Google, Apache 2.0, vision, 128K context: https://lmstudio.ai/models/gemma-4

Tier: 16 GB
- Ministral 3 8B: 6.5 GB: https://lmstudio.ai/models/ministral
- Qwen3.5 9B: 7.0 GB: https://lmstudio.ai/models/qwen3.5
- Gemma 4 12B: 7.4 GB: https://lmstudio.ai/models/gemma-4
- Ministral 3 14B: 9.5 GB: https://lmstudio.ai/models/ministral
- gpt-oss 20B: 12 GB, needs about 12 GB RAM, OpenAI, Apache 2.0: https://lmstudio.ai/models/gpt-oss

Tier: 32 GB
- Gemma 4 26B A4B (MoE): 15.6 GB: https://lmstudio.ai/models/gemma-4
- Qwen3.8 27B: 16.1 GB, the newest Qwen, 262K context: https://lmstudio.ai/models/qwen3.8
- Gemma 4 31B: 19 GB: https://lmstudio.ai/models/gemma-4
- Qwen3.5 35B A3B (MoE): 21 GB: https://lmstudio.ai/models/qwen3.5

Tier: 64 GB and up (workstations)
- gpt-oss 120B: 65 GB: https://lmstudio.ai/models/gpt-oss
- Nemotron 3 Super 120B (12B active): https://lmstudio.ai/models/nemotron-3-super
- Qwen3 Coder Next 80B (3B active): https://lmstudio.ai/models/qwen3-coder-next

Cloud only inside LM Studio (Bionic+ or Pro):
- Kimi K3 and Kimi K3.1 Pro (2.8T parameters): https://lmstudio.ai/models/kimi-k3
- GLM 5.3: https://lmstudio.ai/models/glm-5.3
- DeepSeek V4 Pro: https://lmstudio.ai/models/deepseek-v4-pro

Why these: big trusted publishers (Alibaba Qwen, Mistral AI, Google, OpenAI, NVIDIA), Apache 2.0 licences, high download counts in the official catalog. Re-check sizes the evening before; catalogs change fast.

Download links:
- Download page: https://lmstudio.ai/download
- Windows x64 direct: https://lmstudio.ai/download/latest/win32/x64
- Mac and Linux: not shown as direct URLs on the page today; link to the download page, or test `https://lmstudio.ai/download/latest/darwin/arm64` and `https://lmstudio.ai/download/latest/linux/x64` yourself before using them
- Headless (llmster), Mac and Linux: `curl -fsSL https://lmstudio.ai/install.sh | bash`
- Headless (llmster), Windows: `irm https://lmstudio.ai/install.ps1 | iex`
- Hugging Face models: `lms get <user>/<repo>` or the "Use this model" button with LM Studio enabled in Hugging Face local apps settings

---

## 7. Branding rules (from lmstudio.ai/brand)

Allowed:
- Use the official logo when referring to LM Studio, including presentations
- Use only the official files, pick the variant with best contrast, keep clear space

Not allowed:
- Recreating, recolouring, stretching, adding effects or splitting icon and wordmark
- Building LM Studio marks into your own logo, favicon or product name
- Implying sponsorship, endorsement or partnership

What this means for the site:
- Download the official asset zip yourself and put the files in `public/brand/`
- Use your own site name and your own favicon (not their icon)
- "Mimic the app" = a clearly labelled simulation in your own CSS, inspired by the layout, next to your own real screenshots; do not copy their site code
- Footer disclaimer on every view (text in section 3, Section 14)
- Colours: no official palette is published; their site theme is near black (`#0B1117`). Pick your own dark palette that feels close, do not claim it is theirs
- Lmmy, their mascot, is in the official asset zip; only use the official poses, unchanged

Asset links:
- All brand assets: https://lmstudio.ai/assets/marketing/brand/download/lm-studio-brand-assets.zip
- Logos only: https://lmstudio.ai/assets/marketing/brand/download/logos/lm-studio-logos.zip
- Lmmy: https://lmstudio.ai/assets/marketing/brand/download/lmmy/lmmy-assets.zip
- Which logo where: `lm-studio-logo-color-white` on dark backgrounds, `lm-studio-logo-color-black` on light

---

## 8. Tech stack and repo structure

Stack:
- Build: Vite
- Language: TypeScript (or plain JS if faster tonight)
- 3D: Three.js (+ `CSS3DRenderer` later)
- Scroll animation: GSAP ScrollTrigger (free) or Lenis plus your own keyframe lerp
- Styling: plain CSS with custom properties
- Data: `data/models.json`, no backend needed
- Hosting: Netlify, auto deploy from GitHub
- Quality: Lighthouse for performance and accessibility, keyboard navigation for all interactive parts

Folders:

```
lm-studio-explained/
  PLAN.md              this file
  README.md            setup and deploy
  data/models.json     verified model list
  docs/script.md       presentation script and timing
  public/brand/        official LM Studio assets (you download)
  public/screens/      your own screenshots of the real app
  src/main.ts          entry, section observer
  src/scene/           Three.js: desk, case, monitor, camera keyframes
  src/sections/        one module per section (device check, model picker, mock app)
  src/lib/             device detection, fit calculator, clipboard helper
```

Start commands:

```
npm create vite@latest . -- --template vanilla-ts
npm install three gsap
npm install -D @types/three
npm run dev
```

---

## 9. Timeline

Tonight (25 Nov), must have for tomorrow:
1. Vite project, deploy an empty page to Netlify so the URL works
2. Sections 2, 3, 4, 9, 10 as plain HTML with real data (this covers every Bewijsstuk 3 point)
3. Device check with manual sliders (auto detect if time allows)
4. Simple Three.js hero: desk and monitor, camera move on scroll
5. Mini demo plan: open the REAL LM Studio app live, load a small model, ask it something about your BIM case, then show the local server with one `curl` call
6. Backup: screen recording of the live demo, and the site running locally (school wifi can fail)

Next week (before 7 Dec feedback moment):
- Mock app walkthrough inside the monitor (section 6)
- "How it works" 3D sequence (section 7)
- Alternatives table and going further section

Before final deadline (17 Dec):
- Polish, accessibility pass, Lighthouse, mobile layout
- Optional live connect to localhost (section 13)
- Reuse parts in the final video (tool choice and alternatives)

---

## 10. Presentation flow (about 5 to 7 minutes, confirm your slot)

1. Hook (30 s): "Who has pasted client data into ChatGPT?" then: what if the AI ran on your own laptop?
2. What it is (45 s): site section 2
3. Device check (60 s): let the class check their own laptops on the public URL
4. Live mini demo (2 min): real LM Studio, small model, local server
5. Costs, strengths, weaknesses (60 s): sections 9 and 10
6. Verdict (30 s): when you would and would not use it, link to the BIM project
7. QR code to the site at the end

Full script goes in `docs/script.md` once you confirm the slot length.

---

## 11. Risks

- Facts change fast (new versions and models every few weeks): show "verified on" dates on the site
- Brand misuse: follow section 7, keep the disclaimer visible
- 3D too heavy on school hardware: fallbacks in section 4, test early
- Live demo fails (wifi, model load time): preload the model before class, keep the recording ready
- Device check gives wrong values: always allow manual correction and label results as estimates
- Localhost connection blocked by the browser: only a stretch feature, mock chat as fallback

---

## 12. What I need from you

1. Brand assets: download the official zip (section 7) into `public/brand/`
2. Screenshots: your own LM Studio 0.4.28 install, one per step (start screen, model search, download, model loader, chat, developer/server tab, settings with CORS)
3. Your machine specs: RAM, GPU or Apple chip, OS, so the live demo uses a model that loads fast
4. The KLM site: the repo link or the stack and folder structure you used, so this matches it (I could not find that chat)
5. Slot length and format: minutes per team, solo or team, laptop on the projector or a school PC
6. Language: site in English or Dutch?
7. Your BIM case in one line, so the use case section links back to it
8. Netlify or GitHub Pages: which one you want to deploy on

---

## 13. Sources

- LM Studio homepage: https://lmstudio.ai
- Pricing: https://lmstudio.ai/pricing
- Changelog: https://lmstudio.ai/changelog/lmstudio
- Download: https://lmstudio.ai/download
- System requirements: https://lmstudio.ai/docs/app/system-requirements
- Developer docs: https://lmstudio.ai/docs/developer
- Model catalog: https://lmstudio.ai/models
- LM Link: https://lmstudio.ai/link
- Brand guidelines: https://lmstudio.ai/brand
- Free for work announcement: https://lmstudio.ai/blog/free-for-work
- Hugging Face and LM Studio: https://huggingface.co/docs/hub/lmstudio
- Device Memory API: https://developer.mozilla.org/docs/Web/API/Navigator/deviceMemory
- Chromium change to device memory limits: https://groups.google.com/a/chromium.org/g/blink-dev/c/vXtAmrVZeDk/m/kO39WH6NAwAJ
