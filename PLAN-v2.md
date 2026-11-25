# LM Studio, Explained: Plan v2 (Retro intro + 3D computer)

Field: Value
Replaces: PLAN.md sections 2 (concept) and 4 (Three.js scene). Everything else in PLAN.md and docs/EVALUATION.md still applies.
Presentation: Thursday 26 November 2026
Core idea: AI used to need a room full of machines. Now it runs on the computer on your desk.

---

## 1. The experience in 7 acts

### Act 1: Boot (about 5 seconds)
- Black screen, blinking cursor, a fake BIOS style boot text
- Sound off by default, small "sound on" toggle
- Skip button always visible (top right)

### Act 2: AI's journey, typed on a green phosphor terminal (about 20 to 30 seconds)
- Each milestone types out line by line, the year in bright green, the event in dim green
- Code rain in the background, low opacity so text stays readable
- Scroll or press Space to fast forward
- Timeline content: section 2

### Act 3: The 90s computer (the "click me" moment)
- Camera pulls back from the text: it was on the CRT screen of a beige 90s PC all along
- Prompt on screen: `> RUN AI LOCALLY? [CLICK TO BOOT]`
- Hover: monitor glow brightens, cursor changes, a subtle hum
- Message: "In 1997 it took a supercomputer to beat a chess champion."

### Act 4: Transition to 2026
- On click: CRT power off effect (screen collapses to a horizontal line, then a dot)
- Fade or morph to a modern desk PC with a glass side panel and a flat monitor
- Text: "In 2026, a laptop can run an AI model on its own."

### Act 5: Setup walkthrough on the mock computer
- Camera moves to the modern monitor, the screen shows a mock LM Studio window (clearly labelled "Simulation")
- Steps: download, search model, pick quantization, load, chat, start local server
- Each step has the real screenshot (yours) next to it
- Device check and model picker live here (PLAN.md sections 3 and 4)

### Act 6: How it works, inside the case
- Camera moves through the glass panel
- Model file (a glowing block) shrinks during quantization, flies from SSD into RAM or GPU
- Tokens stream as particles from GPU to the monitor
- Labels: weights, quantization, memory, tokens, context

### Act 7: Zoom out and evaluate
- Camera pulls back: lines connect the PC to a phone (LM Link), a smart home hub (Home Assistant), a server (llmster), an app (local API)
- Then normal scroll sections: use cases, costs, strengths and weaknesses, alternatives, verdict (docs/EVALUATION.md)
- Outro: back to the CRT for one line: `> AI IS NOW LOCAL. _` plus QR code to the site

---

## 2. AI timeline for Act 2

Keep it to about 10 lines; the class needs to read it.

- 1950: Alan Turing asks "Can machines think?" (the Turing test)
- 1956: Dartmouth workshop, the term "artificial intelligence" is born
- 1966: ELIZA, the first chatbot, runs on a room sized computer
- 1970s to 1980s: AI winters, promises outrun the hardware
- 1997: IBM Deep Blue beats chess champion Garry Kasparov
- 2012: AlexNet, deep learning on GPUs takes off
- 2017: Google publishes the Transformer ("Attention Is All You Need")
- 2022: ChatGPT launches, AI goes mainstream (in the cloud)
- 2023: open models and llama.cpp make AI run on a laptop; LM Studio launches in May 2023
- 2026: LM Studio 0.4.28, open models like Qwen3.8 and Gemma 4 run on your own desk

Double check every date against a source before presenting and add the sources to the site's sources section.

---

## 3. "Matrix vibe" without copying The Matrix

Do:
- Green phosphor text (around `#33FF66` on near black), scanlines, slight screen curve, glow, flicker
- Your own code rain effect: random characters falling on a canvas (numbers, symbols, and model words like `token`, `weights`, `GGUF`, `4bit`)
- A monospace font with a free licence (for example VT323 or IBM Plex Mono, both on Google Fonts)

Don't:
- No film footage, stills, logos, character names or quotes from The Matrix
- Don't call the effect "Matrix" on the site; call it "terminal" or "code rain"
- Don't use a fan font that copies the film's code glyphs

Bonus: matrix style code rain is a nice metaphor: an AI model is just a huge pile of numbers.

---

## 4. Three.js architecture

Stack: Vite, TypeScript, Three.js, GSAP (ScrollTrigger and timelines), `GLTFLoader` with Draco or Meshopt decoder.

Scene setup:
- One renderer, one canvas, fixed behind the page
- Two model groups in one scene: `retroGroup` and `modernGroup`; only one is visible at a time
- Camera rig: a list of keyframes (position, target, field of view) per act; GSAP tweens between them

Screens:
- Retro CRT: the terminal is an HTML canvas drawn every frame, used as a `CanvasTexture` on the CRT screen mesh (cheap and looks right with a scanline shader)
- Modern monitor: the mock LM Studio app as real HTML. Two options:
  - Option A (simplest): when the camera reaches the screen, crossfade to a full size HTML window
  - Option B (nicer): `CSS3DRenderer` places the HTML inside the monitor so it stays clickable in 3D
- Both need a separate screen mesh in the model (see section 5)

Effects:
- CRT shader: scanlines, curvature, vignette, flicker (custom `ShaderMaterial` or `postprocessing` library)
- Bloom on screens and RGB lights (UnrealBloomPass, use it lightly)
- CRT power off: scale the screen texture vertically to a line, then to a dot

Performance budget:
- Total download under about 10 MB for all models
- Under about 200k triangles on screen
- Textures 1K or 2K, WebP or KTX2
- Pixel ratio capped at 2
- Load the modern PC in the background while Act 2 plays
- Fallbacks: skip button, `prefers-reduced-motion` gets static images, no WebGL gets the plain HTML version

---

## 5. Sketchfab shopping list

### 5.1 Filters to use on every search
- Downloadable: on
- License: CC BY (credit needed) or CC0 (public domain) first; CC BY NC is fine for a school project; avoid "No Derivatives" (ND) because you will change the screen; avoid "Editorial" (meant for news, usually contains brands)
- Face count: up to 50k per model where possible
- Download format: glTF or GLB

### 5.2 What to check on the model page before downloading
- Separate screen: the screen glass is its own mesh or material (check the model inspector, or open it in Blender). This is the most important point
- No brand logos (Apple, IBM, Compaq, Dell, NVIDIA, Corsair) or remove them in Blender
- Clean pivot and real scale
- PBR textures, not baked lighting with harsh shadows
- Style match: both computers should look like they belong together (both low poly stylised, or both realistic)
- Author name and licence noted for your credits page

### 5.3 Models to find

1. Retro 90s beige PC
- Search: `retro computer`, `90s computer`, `beige pc`, `old pc crt`, `windows 95 computer`, `vintage computer low poly`
- Must have: CRT monitor with separate screen mesh, keyboard, ideally the desktop case under the monitor
- Nice to have: mouse, floppy drive detail

2. Modern desktop PC with glass side panel
- Search: `gaming pc`, `pc build`, `pc case glass`, `computer tower interior`, `pc setup`
- Must have: separate meshes for the side panel, motherboard, RAM sticks and GPU (so they can glow and the camera can go inside)
- Backup plan: if no model has separate parts, make RAM and GPU as simple boxes in Three.js

3. Modern flat monitor (if the PC model has none)
- Search: `monitor`, `computer monitor low poly`, `ultrawide monitor`
- Must have: separate screen mesh

4. Desk and small props (optional)
- Search: `desk low poly`, `desk lamp`, `keyboard`, `mug`
- Keep it minimal; a clean dark floor can be enough

5. Act 7 network props (optional)
- `smartphone` (LM Link), `server rack` (llmster), `smart speaker` or `smart home hub` (Home Assistant), `laptop`
- Low poly versions only, they appear small

6. Fun extra (optional)
- `floppy disk`: the "model file" in the retro scene, then it becomes a glowing block in the modern scene

Not on Sketchfab but useful:
- Lighting: a free studio HDRI from Poly Haven (CC0)
- Fonts: VT323 or IBM Plex Mono from Google Fonts

---

## 6. Model prep pipeline

1. Open the downloaded model in Blender
2. Rename meshes: `Screen_CRT`, `Screen_Monitor`, `SidePanel`, `RAM_1`, `GPU`, and so on
3. Remove logos and parts you don't need, apply transforms, set the origin
4. Export as GLB
5. Optimise with glTF Transform: `npx @gltf-transform/cli optimize input.glb output.glb --compress draco --texture-compress webp --texture-size 2048` (check the current flags in their docs)
6. Check the result in gltf.report (size, triangles, textures)
7. Put it in `public/models/` and add the credit to `public/models/CREDITS.md`

Credits format: Model name, author, Sketchfab link, licence, changes made.

---

## 7. Time plan

Tonight (for the presentation tomorrow):
- Acts 1 and 2 as plain HTML, CSS and a canvas code rain (no 3D needed, quick to build)
- Act 3 as a clickable 2D CRT image or a simple CSS monitor, with the power off effect in CSS
- Then the content sections from PLAN.md (device check, models, costs, strengths and weaknesses)
- Live demo in the real LM Studio app
- Keep the intro under 30 seconds in the talk; the real points are the tool evaluation

Next week (before 7 December feedback):
- Sketchfab models prepared and loaded
- 3D Acts 3 and 4 (retro to modern transition)
- Act 5 mock app on the monitor (Option A first)

Before 17 December:
- Act 6 inside the case, Act 7 network view
- CSS3DRenderer (Option B), polish, performance and accessibility pass

---

## 8. Risks

- Scope: this is a lot of 3D for one evening; the 2D intro tonight keeps tomorrow safe
- Time in the talk: the timeline can eat your minutes; skip button and fast forward
- Readability: code rain behind text must stay dim
- Motion sickness and flashing: no strong flicker, respect reduced motion settings
- Licences: keep the credits file up to date from the first download
- Weak school laptops: test the 3D early, have the fallback ready

---

## 9. What I need from you

1. Sketchfab links of the models you like (2 or 3 options per item), so I can check licence, triangles and screen meshes
2. Style choice: low poly stylised or realistic
3. Slot length for tomorrow
4. Everything still open from PLAN.md section 12 (brand zip, screenshots, specs, KLM stack, language)

---

## Sources

- LM Studio launch (May 2023) and free for work: https://lmstudio.ai/blog/free-for-work
- LM Studio changelog (0.4.28): https://lmstudio.ai/changelog/lmstudio
- Sketchfab licences: https://sketchfab.com/licenses
- glTF Transform CLI: https://gltf-transform.dev/cli
- gltf.report: https://gltf.report
- Poly Haven HDRIs: https://polyhaven.com/hdris
- Three.js CSS3DRenderer example: https://threejs.org/examples/#css3d_periodictable
