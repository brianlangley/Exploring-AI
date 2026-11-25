# LM Studio, uitgelegd: Plan v3 (interactive presentation route)

Field: Value
Replaces: PLAN-v2 sections 1 (acts) and 4 (Three.js). PLAN.md content rules, brand rules and models.json still apply.
Presentation: Thursday 26 November 2026
Stack: stays Nuxt 4 + Nuxt UI + Three.js (same as KLM). No GSAP; camera moves are our own easing, as now.
Core idea: you sit in a dark room in front of an old terminal, you go *into* the screen, travel a short neon road through AI history, and come out at a 2026 PC where LM Studio runs. The tool evaluation and a mock install happen on that PC.

---

## 1. The route (one step = one screen, like slides)

Controls: → / Space / clicker = next, ← = back, number dots at the bottom, `#stap-5` deep links, Esc = overview. Every step works without 3D (the panel text carries the content).

| # | Step | 3D | On screen | Interaction | Assignment point |
|---|---|---|---|---|---|
| 1 | Dark room | 80s terminal alone in the dark, one lamp, screen boots | Terminal types: `> Kunnen machines denken?` | Press Enter (or click the screen) | Hook |
| 2 | Into the screen | Camera flies into the screen, Tron style scan: green grid sweeps over the image, then a neon grid floor in the dark | — | Automatic, 2 s | — |
| 3 | 1950 | Plugboard scans in (scan line from bottom to top, edges glowing) | "Programmeren = draadjes steken" + Turing's question | — | Short history |
| 4 | 1966–1997 | Room of old computers scans in, CRTs show the LM Studio logo | ELIZA and Deep Blue in two lines: "AI had een kamer vol machines nodig" | — | Short history |
| 5 | 2012 | 1999 webcam scans in | "Computers leren zien" (AlexNet, GPUs) | — | Short history |
| 6 | 2022 | Rack server scans in, cables of light to the "cloud" | "ChatGPT: AI wordt groot, maar in andermans datacenter. Jouw tekst gaat mee." | — | Local vs cloud setup |
| 7 | 2026: out of the grid | Grid fades, lights up on a desk: the cleaned gaming PC with its RGB fans (see section 2) | "Nu draait het op je bureau." | — | Transition |
| 8 | What is LM Studio | Camera on the PC, monitor shows the LM Studio logo | Description, maker, version, engines, Bionic | — | Beschrijving van de tool |
| 9 | Your device | Camera at the glass panel; the RGB fans and strips change colour and brightness with your settings (green = runs well, amber = slower, red = too small). Next to the PC: a MacBook (shared memory) and a Raspberry Pi 3 (1 GB, too small) as reference points | Device check (existing) | Sliders, or click the MacBook / Pi to load their specs | Gebruiksgemak, toepassingsgebied |
| 10 | Mock install | Camera to the monitor; the monitor becomes a live mock desktop (section 3) | "Simulatie" label + your real screenshot next to each step | Click through inside the 3D screen | Mini demo |
| 11 | Pick a model | Same screen, mock app "Discover" tab | Model picker (existing) with fit badges | Filters, copy `lms get` | Kwaliteit, beperkingen |
| 11b | How big is a model? | A stack of floppy disks grows next to the PC: Qwen3.5 9B at 4 bit (7 GB) is about 4,750 floppies; slide to 16 bit and the stack is about 4x taller | "Een model is een bestand vol getallen. Quantization = minder bits per getal" | Slider 16 / 8 / 4 bit | Basisbegrippen (LD1): weights, quantization, memory |
| 12 | Chat and local server | Mock chat streams tokens; then Developer tab with `curl` | Tokens per second, "localhost:1234" | Type a question (scripted answer) | Functionaliteit, wat maakt het uniek |
| 13 | Costs | Camera pulls back; price tags float next to the PC | Plans + hidden costs (existing) | — | Kosten |
| 14 | Strong / weak, use cases | Split view: PC (local) left, rack server (cloud) right | Existing verdict lists | Toggle "lokaal / cloud" | Sterke en zwakke punten, use cases |
| 15 | Alternatives | Small labels around the PC: Ollama, Jan, GPT4All, llama.cpp, ChatGPT | Comparison table (new) | — | Alternatieven |
| 15b | Build further | Camera pulls back; light lines from the PC to the MacBook (LM Link), the smart home panel (Home Assistant via the local API) and the rack server (llmster, headless) | Going further list (PLAN.md section 12) | Click a device for its one-line explanation | Wat maakt deze tool uniek |
| 16 | Verdict and end | Back to the dark room terminal: `> AI IS NU LOKAAL. _` + QR code | Verdict in 3 lines, sources link | — | Conclusie |

Timing for the talk: steps 1–7 under 60 seconds (history is short on purpose), 8–12 about 3 minutes including the real live demo, 13–16 about 90 seconds.

Read mode: the current long page stays as "Lees alles" (all content, no 3D) for sharing after the presentation and as the no-WebGL fallback. Same content files, so no double work.

---

## 2. Which 3D model goes where

Checked on 25 November 2026: licence, size, triangles, and every texture for brand logos.

Use:

| Model (file) | Licence | Size / triangles | Step | Work needed |
|---|---|---|---|---|
| Computer Terminal (`80s_computer_terminal.glb`) | **CC BY-SA 4.0** | 4.0 MB / 1.3k | 1, 2, 16: start and end, its screen is the portal | Has its own screen mesh; we draw the terminal text on it. No logos |
| Plugboard (`plugboard_-_ancient_coding.glb`) | CC BY 4.0 | 2.4 MB / 4k | 3 (1950) | None |
| Old Computers (`old_computers_in_a_cricle.glb`) | CC BY 4.0 | 1.0 MB / 16k | 4 (1966–1997) | Done (logos on the CRTs) |
| 1999 Logitech QuickCam (`1999_logitech_quickcam.glb`) | CC BY 4.0 | 0.4 MB / 8.5k | 5 (2012, computers learn to see) | Tiny maker mark in one texture corner; paint it out in code |
| Rak Server (`rak_server.glb`) | CC BY 4.0 | 0.3 MB / 68 | 6, 14, 15b (the cloud, llmster) | None, repeat 3x as a row |
| Computer Monitor Lowpoly (`computer_monitor_lowpoly_model.glb`) | CC BY 4.0 | 0.07 MB / 1k | Backup only: if the gaming PC cleanup fails, its `Display` mesh carries the mock app | None: no textures, no logos |
| Floppy Disk (`floppy_disk.glb`) | CC BY 4.0 | 0.05 MB / 0.6k | 11b (model size in floppies) | Instanced stack in code (thousands of copies, one draw call) |
| Raspberry Pi 3 (`raspberry_pi_3.glb`) | CC BY 4.0 | 1.6 MB / 13k | 9 ("too small" reference) | Photo texture shows the small Raspberry Pi mark; fine when we name the product, no change |
| Smart Home (`smart_home_Screen.glb`) | CC BY 4.0 | 0.4 MB / 6k | 15b (Home Assistant) | Back sticker has third-party brand text; only show the front |
| MacBook (`macbook.glb`) | CC BY 4.0 | **8.5 MB / 143k** | 9 and 15b (Apple Silicon, LM Link) | **Apple logo on the lid texture**: paint it out in code. Too heavy: shrink (section 5), or drop it if time runs out |

The 2026 PC: Gaming Desktop PC (`gaming_desktop_pc.glb`, CC BY 4.0, 12.1 MB / 86k / 1514 nodes), cleaned in code. The file itself stays unchanged; the cleanup runs when it loads.

Remove or replace, by part (from the texture check):

| Part in the file | Shows | Fix |
|---|---|---|
| `NVIDIA LOGO`, `aorus logotranspa`, `Color-PewDiePie-Logo`, `gigabyte-logo` (2x), `maxresdefault (1)`, `gallerymodel`, `Object_782` | Logo plates: NVIDIA, AORUS, PewDiePie brofist, Gigabyte, a YouTube style thumbnail, "AORUS" text | Hide these parts |
| `MOBOAORUSORANGETRANS`, `rgb-hdd-cover-aorus-v1`, `test-aorus-m2-souris-aorus-rgb2` | Glowing AORUS logos on the motherboard, drive cover and mouse | Swap the texture for a plain glow in our violet |
| `aorus case fans` (10x), `Cylinder.005`, `Cylinder.007` | Rainbow fan rings with the AORUS logo in the hub | Swap the texture for a plain ring glow; the colour then follows the device check |
| `Cube.028`–`Cube.032` group, `Cube.048`, `Cube.057`, `Cube.058` | AORUS and GeForce RTX art on the GPU and RAM covers | Swap for plain dark metal |
| `Cube.045` (power supply), `IOSHIELD`, `Cube.015` (motherboard photo) | Gigabyte and AORUS printing | Swap for plain dark metal |
| `Cube.063`–`Cube.065` | PewDiePie's red wave pattern | Swap for plain dark |
| `MY SCREEN` | Screenshot of a Windows desktop | Replaced by the LM Studio logo, then the mock app (section 3) |
| 136 `Text` parts | 3D text, content unknown | Check in the browser while building; hide any that spell a brand |

What it can't do: the RAM sticks and graphics card are not separate parts, so "your RAM lights up" becomes the fans and RGB strips changing colour with the device check.

Backup: if the cleanup takes too long tonight, the lowpoly monitor plus our own code-built glass case stands in (clean, under 0.1 MB), and the gaming PC moves to next week.

Don't use:

| Model | Why |
|---|---|
| Clippy (`clippy.glb`) | Microsoft's character (their IP), and the licence is CC BY-NC. A public site imitating it is the risk PLAN.md warns about |
| Google Home (`google_home.glb`) | A Google product by name and shape; the Smart Home panel tells the same story without a brand |
| Phone (`90s_phone.glb`) | A desk landline, not a smartphone, so it does not fit LM Link; 3.4 MB |
| Desktop Computer 2000 (`2000_desktop_computer.glb`) | Overlaps the terminal and the old computers |
| PC-9801UX (`90s-pc-9801ux.glb`) | NEC product, 7 MB / 79k, overlaps |

Credits: every used model goes in `public/models/CREDITS.md` and the sources step. CC BY-SA: if we change the terminal file itself (for example compress it), that changed file is also CC BY-SA; changing it only in code keeps the file as is.

---

## 3. The mock computer on the 3D screen (steps 10–12)

How: `CSS3DRenderer` (part of Three.js, no new dependency) puts a real HTML element exactly on the gaming PC's `MY SCREEN` mesh (its Windows screenshot texture goes), so the mock stays sharp, clickable and readable by screen readers. On phones and small screens: the same HTML as a normal full-width window instead (Option A from v2).

Mock flow, each screen its own small component, scripted, no real downloads:
1. Desktop with a browser: lmstudio.ai download page (our own simplified layout, labelled "Simulatie")
2. Installer: progress bar, "LM Studio 0.4.29"
3. App opens: Discover tab, search "qwen3.5 9b" (Ctrl/Cmd + Shift + M)
4. Pick quantization: Q4_K_M highlighted, size and fit badge from the device check
5. Download progress (fast forward), then Load (Ctrl/Cmd + L) with a memory bar filling up
6. Chat: type a question, scripted answer streams token by token with tokens per second
7. Developer tab: start server, show the `curl` call and the JSON answer

Brand rule: our own CSS inspired by the layout, the official logo only as the unchanged file, "Simulatie, geen echte app" visible on every mock screen.

---

## 4. Tron scan, our own version

- Scan in: each history model is drawn with a clipping plane that rises from bottom to top; at the cut a thin glowing line, above it nothing, below it the model with green edge lines (`EdgesGeometry`) that fade to the normal look.
- Into the screen: camera flies through the terminal screen, a full screen canvas draws a green grid that sweeps from the centre outward, then the neon grid floor (`GridHelper` with glow colour) appears.
- Colours: our phosphor green and the violet primary. No film footage, names, fonts or quotes from The Matrix or Tron, and the effect is called "scan" on the site.
- Reduced motion: no fly-through, models simply appear; no flicker.

---

## 5. Performance and loading

- Budget: under about 10 MB for the route. The used models are now about 23 MB without the MacBook (gaming PC 12.1 MB, terminal 4 MB) and 31.5 MB with it.
- Fix: run glTF Transform once on the used models (textures to WebP, max 1024 px; the MacBook also simplified to fewer triangles). This is a one-off command via `npx`, not a project dependency. Expected total: about 6–8 MB (the gaming PC to roughly 2–3 MB). Needs your OK (new tool). The compressed terminal file is then CC BY-SA too.
- Load per step: the terminal first, history models while step 1 waits for Enter, the gaming PC while history plays.
- Keep the existing fallbacks: no WebGL = read mode, skip button, reduced motion.

---

## 6. Content changes the assignment still needs

- Alternatives table (step 15): Ollama, Jan, GPT4All, llama.cpp, cloud (ChatGPT, Claude, Gemini). Columns: local or cloud, GUI, API, price, open source. Check every cell against each tool's own site.
- Version: lmstudio.ai now serves **0.4.29** (download links checked today). Update the site text and models.json date before presenting.
- Your real screenshots per mock step (still missing in `public/screens/`).
- Timeline sources stay in the sources step.

---

## 7. Build order

Tonight (presentation tomorrow, keep it safe):
1. Step engine: step list, keyboard and clicker, dots, deep links, panels per step (content reused from the current sections)
2. Steps 1–2: dark room with the terminal, Enter, fly into the screen with the grid scan
3. Steps 3–7: grid road with the four history models and the scan-in effect
4. 2026 PC: clean the gaming PC (section 2), shrink it, steps 8–9 and 13–16 as camera positions with panels
5. Mock computer, simple version: HTML window over the screen (Option A), flow screens 1–6
6. Test on a weak laptop, then rehearse with the real LM Studio live demo as backup

Next week (before 7 December): CSS3DRenderer on the real screen, the Developer tab step, floppy stack (11b), build further (15b) with MacBook and smart home, alternatives table checked, your screenshots in.

Before 17 December: polish, accessibility pass (keyboard through every step, screen reader labels on the mock), Lighthouse, mobile layout of the route.

---

## 8. Open questions

1. glTF Transform via `npx` to shrink the models: OK?
2. Is tonight's scope right, or should the mock computer wait so steps 1–9 get more polish?
3. Slot length tomorrow, and do you present from your own laptop (keyboard or clicker)?
4. Which model do you load in the real live demo? The mock uses the same one (now: Qwen3.5 9B).

---

## 9. Review decisions (25 November 2026, 18:10) — these override sections 1 to 8 where they differ

Status: v3 approved with these changes. Any assistant picking this up: read this section first.

### 9.1 Answers to the open questions
1. glTF Transform via `npx`: OK. The compressed terminal file (`80s_computer_terminal.glb`) stays CC BY-SA 4.0 and is listed that way in `public/models/CREDITS.md`.
2. Scope tonight: the 3D mock computer waits. The live demo in the real LM Studio app is the mini demo.
3. Slot length and own laptop: still open, ask Brian.
4. Live demo model: Qwen3.5 9B only if it loads quickly on the presentation laptop (test tonight); otherwise Ministral 3 3B (`mistralai/ministral-3-3b`, 2.0 GB) in both the live demo and the mock.

### 9.2 Route changes
- The site really starts with the intro route; the long content page comes after it. The header menu has an "Intro" item that goes back to the start.
- Step 4 (1966–1997): no LM Studio logo on the old CRTs (LM Studio launched May 2023; the logo there is wrong and decorative use of their mark). Show period content: an ELIZA style dialogue (`> I AM SAD` / `WHY ARE YOU SAD?`) or chess moves (`e4 e5 Nf3`).
- Step 5 (2012): a GPU close-up instead of the webcam (AlexNet was about GPUs). The webcam only as a small side prop if it already works, with its maker mark hidden.
- Step 10 or 12 (gebruiksgemak): a "30 minute test" card with Brian's measured times (install, first model download, first answer). Measured, never estimated.
- Step 11: floppy fact "Qwen3.5 9B (7 GB) = about 4,750 floppy disks of 1.44 MB" (7 GB / 1,474,560 bytes).
- Step 14: mini benchmark (kwaliteit): the same 3 tasks on a small local model, a medium local model and one cloud model, scored 1 to 5, real outputs only. Offline smart home use case: Smart Home panel + Raspberry Pi 3 as the Home Assistant hub talking to the PC over the local network (the Pi does not run the model: 1 GB RAM). Phone model for LM Link (use the big desktop model from your phone).
- All steps: LM Studio 0.4.29 (lmstudio.ai/download, checked 25 Nov 2026 18:10).

### 9.3 Models
- Use: Floppy Disk (Nyangire), Computer Monitor Lowpoly (Marco Zakaria, backup screen), Phone (schmoldt.art, LM Link), Smart Home (greekisback), Raspberry Pi 3 (JoSaCo, hub only, hide the logo if visible). All CC BY 4.0.
- Optional: MacBook (M I H, CC BY 4.0, 143k triangles) only if Apple Silicon / MLX gets its own moment; hide the Apple logo and compress it. Otherwise skip.
- Skip: Google Home, Desktop Computer 2000, PC-9801UX.
- Clippy: skip (Microsoft's character). The helper is our own "Floppy", see 9.4.
- Credits: every used model in `public/models/CREDITS.md` (name, author, link, licence, changes) and in the sources step.

### 9.4 Floppy, the helper (own character, replaces Clippy)
- Brian's decision: no Clippy (Microsoft's character). Instead our own helper: the Floppy Disk model (Nyangire, CC BY 4.0) with two googly eyes built in code. Name: "Floppy".
- Fits the story: a floppy holds 1.44 MB, a model needs thousands of them (step 11).
- Keep it our own style: no paperclip shapes, no Office look, no "It looks like you're writing a letter" quote. Our tip text, our violet/green colours.
- Role: small helper in the corner of the route. One tip per step ("Hoi, ik ben Floppy. Ik pas 1,44 MB. Een AI-model? Daar zijn er duizenden van mij voor nodig."), click to open or close the speech bubble, 1–2 buttons (for example "Leg uit" / "Verder"). Keyboard reachable, can be hidden for the whole session, eyes follow the mouse, no bouncing with reduced motion.
- Later (next week): Floppy reacts to the device check ("Met 8 GB wordt het krap...") and walks the mock install.
- `clippy.glb` is not used and does not ship in `public/`.

### 9.5 Build order tonight (replaces section 7 "Tonight")
1. Step engine: step list, keyboard and clicker, dots, deep links, panels with the existing content
2. Steps 1 and 2: dark room, terminal, Enter, fly into the screen
3. Steps 3 to 7: history models with a simple fade in; the clipping plane scan only if it works by about 22:00
4. Gaming PC: hide brand parts, compress; steps 8, 9 and 13 to 16 as camera positions with panels
5. Brian: measure the 30 minute test and run the mini benchmark, then put the real numbers in
6. Brian: test on the presentation laptop, preload the live demo model, record a backup video of the live demo

Moved to next week: the 3D mock computer (steps 10 to 12), CSS3DRenderer, the Developer tab step, the MacBook, Floppy reacting to the device check.

### 9.6 Sources
- LM Studio download page (0.4.29): https://lmstudio.ai/download
- LM Studio launch, May 2023: https://lmstudio.ai/blog/free-for-work

---

## 10. Status after the build of 25 November 2026 (evening)

Built (at the repo root):
- `/` is the presentation route (15 steps); `/lm-studio` is the long read page. The header of the read page has "Intro" back to `/`.
- Steps: intro (dark room, 80s terminal types the question) → dive into the screen with grid scan → 1950 plugboard → 1966–1997 old computers (CRTs show ELIZA and chess) → 2012 RTX 3080 (brand text painted out, fans spin) → 2022 data centre (rows and aisles of racks) → 2026 cleaned gaming PC → what it is → your device (fans turn green / amber / red with the device check, based on the demo model) → models (+ floppy fact) → demo (mock computer on the 3D monitor) → costs → verdict → alternatives (new table) → build further (phone, Raspberry Pi + smart home panel, server on pedestals with light cables) → end (back to the terminal: "AI IS NU LOKAAL.").
- Mock computer (`MockComputer.vue`, `MockLmStudio.vue`, `useMockComputer.ts`): desktop → browser on the download page → installer → Discover (Q4_K_M) → model download → load (memory bar from the device check) → chat (scripted answer streams) → Developer (server + curl + JSON). → / clicker runs each action, then moves on.
- Floppy helper with googly eyes and one tip per step; hide for the session.
- Keys: → / Space / Enter / PageDown next, ← / PageUp back, Home / End, dots, deep links `/#jouw-computer`.
- Dutch default, English switch. Models shrunk to 7.3 MB in total (originals in `models-source/`, not in git).
- Demo model in one place: `app/utils/demoModel.ts`.

Still open:
- Brian: 30 minute test and mini benchmark numbers (9.2), then add the cards.
- Brian: own screenshots per mock step; slot length; test on the presentation laptop.
- Check every cell of the alternatives table against each tool's own site.
- QR code on the end step (needs a QR library or a pre-made image: decide).
- CSS3DRenderer for the mock (now an HTML layer placed over the projected screen; fine for a face-on camera).

## 11. Design direction proposal (not built yet, waiting for Brian's OK)

Goal: premium and calm like Apple product pages, with the 90s terminal as the one strong accent, and LM Studio's violet only for things you can click. Less "AI template" look.

What makes it look AI-made now: mono uppercase eyebrows ("01 · DE TOOL"), violet everywhere, every block in a bordered card, an icon on every bullet, Space Grotesk.

Proposal:
1. Type: display "Instrument Sans" (tight, confident headlines), body "Inter" (optical sizes), big years and numbers in "Instrument Serif" (museum label feel: 1950, 2026, $0), VT323 only inside terminals and the step counter. All free (Google Fonts, OFL).
2. Colour: near black `#0a0a0b`, warm off-white text `#f2efe9`, greys in between; violet only for buttons and focus; phosphor green only in the history part. No other accent colours.
3. Layout: fewer cards. Hairline dividers, large type scale (hero 96–120 px), generous white space, two-column "label left, content right" rows like Apple spec pages.
4. Panels: frosted glass (heavy blur, 1 px inner highlight), rounded 20 px, no visible border.
5. Motion: slow ease-out (0.8–1.2 s) for camera and panels, text fades up 12 px, nothing bounces; reduced motion respected.
6. Retro layer: subtle scanlines and film grain only on the route's history steps, CRT vignette on the terminal, step counter as `STAP 06 / 15` in VT323.
7. Read page: sticky section titles, scroll-revealed rows, the 3D PC as a still image at the top instead of no picture.

---

## 12. Status after the polish pass of 25 November 2026 (late evening) — read this first when taking over

Section 11 (fonts, palette, glass panels) is built; see `app/assets/css/main.css`. Changes in this pass, all on `/`:

Theme
- One fixed dark theme, no light/dark mode ever. `nuxt.config.ts` has `ui: { colorMode: false }`; the palette lives on `:root` in `main.css` (with `color-scheme: dark`). Before this, a stored or system "light" preference swapped in Nuxt UI's light text colours (dark text on the glass panels, white bubble tail on Floppy). Do not bring back `colorMode` or `.dark` selectors.

Camera (`app/composables/usePresentationStage.ts`)
- Moves (`moveTo`, `snapTo`) drive a base pose (`basePosition` + `cameraTarget`). Every frame `applyView()` puts the real camera on top: drag orbit + idle sway. Never write `camera.position` directly; write the base pose.
- Orbit: left-drag on the canvas turns around the step's target (pitch clamped), stays until the next step, which eases it back to 0. Idle sway when not dragging. Both off on the demo step (`panel: 'screen'`, the HTML mock is laid over the projected monitor) and sway off with reduced motion.
- Load on a room step: camera starts at the step's wide pose and rolls in to a seated close-up of the CRT (`poseFor()`, `LOAD_ZOOM_SECONDS`). Fades back into the room (end step, going back) also use the seated pose.
- Intro → 1950 dive: lean into the CRT while the FOV narrows (40 → 22) → `transition = 'crt'` (scanlines + phosphor vignette overlay) → `'scan'` (phosphor grid + code rain) → snap far back with FOV 105 and rush in to the plugboard while FOV returns to 40 ("sucked into the machine"). Overlays in `PresentationStage.vue`; `StageTransition` in `usePresentation.ts` now has `'crt'`.
- `room.screenCenter` (`terminalRoom.ts`) is the CRT itself, 0.17 units left of the terminal's centre (the right side is the drive bay).

Light
- One warm stage spotlight follows the camera target to every road and desk step (above the target, a bit towards the viewer, power scaled with camera distance), with soft flicker dips (no strobe, none with reduced motion). Light only, no lamp mesh. Off in the room (it has its own spot) and during the dive.

History road (`app/utils/historyRoad.ts`)
- 1950: the dark box plinth under the plugboard is gone; the board is tilted up and its lowest point sits on the floor (measured with `Box3` after rotating).

Checked in the browser: theme colours, seated intro, full dive sequence, plugboard lit, drag orbit, spotlight on 2012 and the desk. `npm run lint` clean. Not checked: touch devices (canvas has `touch-none`, pointer events should cover it), `npm run build` after this pass, typecheck (needs `vue-tsc`, not installed).

Still open: everything in section 10 "Still open".
