# Research: Practical Craft of a Rigged, Multi-Action 2D Character in Rive + Legal Free Asset Sourcing

**Bottom line:** For a coach/mascot character, rig with **bones + hierarchical (cutout) parenting as the default**, add **bound/weighted deformation only where parts must bend**, and keep raster art on **image meshes**. Drive it with a **layered state machine**: Layer 1 = one-shot action triggers that return to a looping idle, Layer 2 = always-running eyes/blink layer with randomized timing, optional Layer 3 = mood/emotion blend. For art, the fastest legal path today is **CC-BY .riv files on the Rive Community marketplace** (Assistant Character by HaiDo is the closest match to a coach with idle+wave), then **CC0 layered SVG sets (Humaaans, Open Peeps)** imported into Rive as editable vectors — and for programmatic authoring, **ODU33104/rive-mcp** is the free, working no-editor generator (avoid the paid RiveMCP binary, which currently crashes on macOS arm64).

---

## 1. Rive character rigging in practice: bones vs cutout groups vs image mesh

Three ways a bone controls artwork, and they combine in one rig ([Rive docs — Bones](https://rive.app/docs/editor/manipulating-shapes/bones), [rive101 5.2/5.3](https://rive101.com/en/lesson/5-2/), [LearnRive — Intro to Rigging](https://www.learnrive.com/creating-animations/intro-to-rigging)):

1. **Cutout groups / hierarchical parenting (transform-only)** — drag any shape, image, or group under a bone; it inherits the bone's position/rotation/scale with **no deformation**. This is the **default for a flat-design mascot**: torso, head, hands, feet parented to bones. Most performant — the runtime just applies a transform, no vertex recalculation ([rive101 5.3](https://rive101.com/en/lesson/5-3/)). A coach-character rig is ~90% this.
2. **Vector binding + weights (deform a path)** — bind a path's vertices *and Bézier handles* to 1+ bones, adjust weights in the Inspector. Use for **smooth bends**: elbows, knees, sleeves, scarves/flags, page-bends. Weight handles differently from vertices for organic motion ([Bone tips](https://rive.mintlify.dev/docs/editor/manipulating-shapes/bone-tips)). Convert procedural shapes to custom paths first (select path, press Enter).
3. **Image mesh + weights (deform a raster image)** — add a mesh to a PNG, bind vertices to bones. Use **only for raster art** that must bend; for vector characters bind the path instead. A character's hand can be parented while the sleeve's vertices are weighted across two bones — the canonical combo ([Rive docs](https://rive.app/docs/editor/manipulating-shapes/bones)).

Practice notes from community rigging walkthroughs:
- Draw bone chains with `B`; root bone is the only one with X/Y position; children are length+rotation only ([rive101 5.2](https://rive101.com/en/lesson/5-2/)).
- **Fix pivots with Freeze (`Y`)** after parenting or when an origin jumps; eye blink groups get a centered pivot ([LearnRive](https://www.learnrive.com/creating-animations/intro-to-rigging)).
- Wrap the whole rig in a **root group** so you can scale/reposition without breaking animation keys ([LearnRive](https://www.learnrive.com/creating-animations/intro-to-rigging), [Raph Roberts hints](https://raphroberts.com/blog/rive-state-machine-setups.html)).
- Official video walkthroughs: [Snow day! Rig and animate with Rive](https://www.youtube.com/watch?v=GpCyXo4VujA), [Rive Workshop: Intro to Rigging](https://www.youtube.com/watch?v=ZXXg-g8g8eM), [Rive.app Tutorial — Character Rigging](https://www.youtube.com/watch?v=ZPWG0HrV528), [Character animation Full course using Rive](https://www.youtube.com/watch?v=DXd8x5sFagM). Free text course: [rive101.com](https://rive101.com) and [learnrive.com](https://www.learnrive.com/creating-animations/intro-to-rigging).

---

## 2. State machine architecture for many actions (idle, wave, cheer, flex, thumbs-up, disappointed, level-up)

The production pattern (corroborated by [DEV: mascot SM explained](https://dev.to/uianimation/rive-state-machines-explained-with-a-mascot-example-3jc6), [DEV: production breakdown](https://dev.to/uianimation/rive-character-animation-for-mobile-apps-a-production-ready-design-and-state-machine-breakdown-5e3m), [DEV: engineering interactive mascots](https://dev.to/uianimation/engineering-interactive-mascots-with-rives-state-machine-and-runtime-architecture-4e2h), [Rive blog on SMs](https://rive.app/blog/how-state-machines-work-in-rive), and With Love's production rig [Procedural Animation in Rive](https://withloveapp.substack.com/p/procedural-animation-in-rive-how)):

**One layer = one concern; layers run additively in parallel.** A character that walks *and* smiles needs no "walking-while-smiling" timeline — body layer and face layer mix automatically. **Layer conflicts are the one real trap**: if two layers animate the same object, only one wins — keep system-wide (eyes, mouth) and pose-wide (body) timelines on separate layers ([With Love](https://withloveapp.substack.com/p/procedural-animation-in-rive-how)).

Recommended graph for a coach character (3 layers, all on one artboard):

**Layer 1 — "Actions" (the only layer app code drives):**
- States: `idle` (looping, the base state), plus one-shots `wave`, `cheer`, `flex`, `thumbsUp`, `disappointed`, `levelUp`.
- Inputs (triggers): `waveTrigger`, `cheerTrigger`, `flexTrigger`, `thumbsUpTrigger`, `disappointedTrigger`, `levelUpTrigger`.
- Transitions: `idle --trigger--> <action>`, and `<action> --completed--> idle`. In Rive, a one-shot state auto-exits when its timeline finishes *if* it has an outgoing transition with no condition. If you want a new trigger to interrupt a running action, wire the trigger transitions from **Any State** instead of only from idle.
- This is exactly the pattern in the [DEV mascot example](https://dev.to/uianimation/rive-state-machines-explained-with-a-mascot-example-3jc6): one-shot triggers on top of a calm looping idle, automatic return to idle.

**Layer 2 — "Eyes" (always-running parallel layer):** blinking state with randomized timing (see §3) and `lookX`/`lookY` number inputs (range -1..1) driving pupil/head. Two proven implementations: a **Blend State (direct blend)** mapping look direction to a 2D face-space of look animations, or **constraints** — Translation Constraint on facial features with varying strength (nose 100%, eyes 80%) for the 2.5D head-turn parallax, plus a **Distance Constraint** keeping pupils inside the sclera ([DEV: engineering interactive mascots](https://dev.to/uianimation/engineering-interactive-mascots-with-rives-state-machine-and-runtime-architecture-4e2h)). Live proof this works: ["All eyes on me"](https://rive.app/marketplace/14738-27799-all-eyes-on-me/) combines proximity-driven eyelid opening with random-interval blinks via animation layers.

**Layer 3 — "Mood" (optional):** a **1D blend state** on a number input `emotion` (0 neutral → 1 happy → 2 sad) or booleans `isHappy`/`isSad` switching eyebrow/mouth overlays; add `intensity` (0–1) to scale expressiveness ([DEV: AI video call characters](https://dev.to/uianimation/building-duolingo-style-ai-video-call-characters-using-rive-10o9)).

**When to use blend states vs triggers:** triggers + one-shots for discrete actions (wave, cheer); blend states for continuous axes (look direction, emotion, walk speed). Don't blend discrete gestures — it fights the "one action at a time" feel ([DEV: engineering](https://dev.to/uianimation/engineering-interactive-mascots-with-rives-state-machine-and-runtime-architecture-4e2h)).

Runtime side is trivial: `fireState('CoachSM', 'waveTrigger')` / `setInputState('CoachSM', 'lookX', 0.5)` ([DEV: production breakdown](https://dev.to/uianimation/rive-character-animation-for-mobile-apps-a-production-ready-design-and-state-machine-breakdown-5e3m)).

---

## 3. Tricks that make a Rive character feel alive

- **Blink = the single highest-leverage animation.** Two methods: quick-and-dirty **Scale Y 100→0→100** on a grouped eyes (needs Ease In-Out; constant-speed blinks read as mechanical), or the production method: a **clip-mask rectangle over the eye group**, keyframing the mask's Scale Y so eyelids close without distorting eyelashes/highlights ([Rive Masterclass](https://www.rivemasterclass.com/blog/rive-blink-animation-how-to-make-any-character-feel-alive-with-3-keyframes)). Real numbers: a blink is ~3 keyframes over **0.15–0.3 s** with cubic ease-in-out (community practice, same source); human physiology reference is 12–15 blinks/min (every ~3–6 s), closure ~100–150 ms. **Don't use a fixed interval** — With Love Labs' production rig proved fixed-repeat blinking reads robotic; they trigger blinks *contextually* (on gaze change, pose transition, large movements) plus randomized idle blinks — "considered randomness" ([Procedural Animation in Rive](https://withloveapp.substack.com/p/procedural-animation-in-rive-how)). In the SM, randomize via transition time ranges / random transitions on the Eyes layer.
- **Idle loop length:** extend the idle to **6–9 seconds** with a non-uniform blink cycle and offset limb movements — a 3-second loop is instantly spotted and breaks the illusion ([With Love](https://withloveapp.substack.com/p/procedural-animation-in-rive-how)). To loop offset elements seamlessly, duplicate the base animation to 2–3 cycles and set the Work Area over the second iteration ([Rive Masterclass — seamless idle loops](https://www.rivemasterclass.com/blog/why-your-rive-idle-animations-jump-and-how-to-make-them-seamless-in-3-simple-steps)).
- **Breathing:** subtle chest/body scaleY of ~1–3% on a 3–4 s loop layered under everything (community practice; see [DEV: Duolingo-style mascot](https://dev.to/uianimation/building-a-duolingo-style-interactive-mascot-in-rive-step-by-step-guide-2d5c) and the marketplace example [Character Breathing](https://rive.app/marketplace/19019-35782-character-breathing/)). Expose inhale/exhale timing to code if you want real-time control ([Contra: interactive breathing system](https://contra.com/p/lb7AUlYc-interactive-breathing-animation-system-built)).
- **Secondary motion / follow-through:** constraints do the automation — Translation Constraint with **Strength < 100%** gives lag/parallax (the 2.5D head-turn trick); Distance Constraint bounds pupils; offset trailing limbs by a few frames behind the driver bone ([DEV: engineering](https://dev.to/uianimation/engineering-interactive-mascots-with-rives-state-machine-and-runtime-architecture-4e2h)).
- **Head-look / IK:** the "joystick" pattern — a control bone constrained to a rectangular range, its X/Y mapped to a direct-blend look space, clamped by the constraint so the head never snaps ([DEV: engineering](https://dev.to/uianimation/engineering-interactive-mascots-with-rives-state-machine-and-runtime-architecture-4e2h)). Rive also ships real **IK constraints** (see `samples/ref/two_bone_ik.riv` in ODU33104/rive-mcp below).
- **Mouth/visemes:** for a coach character, simplest is `talkAmount` (0–1) driven by TTS audio amplitude or a `viseme` number input; layered on the Eyes/Mouth layer so it blends with blinking ([DEV: AI video call characters](https://dev.to/uianimation/building-duolingo-style-ai-video-call-characters-using-rive-10o9)).

---

## 4. Free, legally-usable pro-quality character art convertible to Rive

Import path facts first: **Rive imports SVG and converts it to editable native vector objects** (paths, fills, strokes, groups — fully riggable), and imports PSD layered files; unsupported SVG features: filters, skew, `stroke-dasharray` (→solid), embedded images (ignored), inherited colors default to white ([Rive docs — SVG](https://rive.app/docs/editor/assets/svg)). **Rive's built-in Lottie import is Enterprise-plan only** ([Assets overview](https://rive.app/docs/editor/fundamentals/assets-overview)) — free workaround: use ODU33104/rive-mcp's `riv_lottie_import` (§5).

### A. Rive Community marketplace — CC-BY .riv files, downloadable today (best option: already .riv)
All CC BY 4.0 unless noted; download button on each file page (free Rive account; Pro not required for community files). Check each page's license badge before shipping.

| Asset | Why it matters | Link |
|---|---|---|
| **Assistant Character** (HaiDo) | Cheerful mascot with **idle + waving gesture + state machine logic** — closest match to a coach character; plug-and-play | https://rive.app/marketplace/20733-39021-assistant-character/ |
| **Responsive character** (warmach11) | CC BY, rigged interactive character | https://rive.app/marketplace/19852-38333-responsive-character/ |
| **Character Head** (samaravee) | Head/eyes follow cursor, smiles on click — reference for head-look | https://rive.app/marketplace/26483-49646-character-head/ |
| **Interactive Hover Character – Walk & Rest** (farahm-WT343) | Walk on hover / rest on leave | https://rive.app/marketplace/24177-45170-interactive-hover-character-walk-and-rest-animation/ |
| **The Happy Walker** (Akitha_Madusanga) | Walk cycle + hover pause; built from Rive's beginner tutorial | https://rive.app/marketplace/16154-30424-the-happy-walker/ |
| **Eyes Animation – Blink and Track** (Tom_acco) | 4 eye styles blinking + pointer tracking, pure SM+inputs | https://rive.app/marketplace/20925-39333-eyes-animation-blink-and-track/ |
| **All eyes on me** (swapnilr) | Layered SM: proximity eyelid opening + random-interval blinks | https://rive.app/marketplace/14738-27799-all-eyes-on-me/ |
| **playful character** (vitaliys) | CC BY game-style character | https://rive.app/marketplace/26749-50254-playful-character/ |
| **Character Animation** (haas.theresa) | Cursor-follow 2D→3D | https://rive.app/marketplace/6241-21354-character-animation/ |
| **Character Breathing** (masaadiii786) | Breathing reference | https://rive.app/marketplace/19019-35782-character-breathing/ |
| **Blink animation** (JcToon) | Minimal blink example | https://rive.app/marketplace/193-351-blink-animation/ |

### B. LottieFiles free characters — Lottie Simple License (commercial OK, no attribution required, may not build a competing service) ([license](https://lottiefiles.com/page/license))
Beware: not directly .riv — you'd import via ODU33104/rive-mcp `riv_lottie_import` (free, works today) or the Enterprise-only editor import.

| Asset | Link |
|---|---|
| Free Female Character Walking (Muammar Faiq) | https://lottiefiles.com/free-animation/female-character-walking-BrxbM5Jwzc |
| Free Talking Character (sidharth khurana) | https://lottiefiles.com/free-animation/talking-character-dsS9fHCzKD |
| Free Character Waving (Christian) | https://lottiefiles.com/free-animation/character-waving-9DE8aXknpu |
| Free Mascot Cartoon Character (Abdul Latif) | https://lottiefiles.com/free-animation/mascot-cartoon-character-WnlDp8VkrO |
| Free GB Mascot Bot (Farah Nadia) | https://lottiefiles.com/free-animation/gb-mascot-bot-GtLUj3m5Qt |
| Free Samurai IDLE (Sepehr) | https://lottiefiles.com/free-animation/samurai-idle-animation-tdgPt2D9M9 |
| Full index: 1,200+ free character animations | https://lottiefiles.com/free-animations/character |

### C. Open SVG character sets (import as editable vectors in Rive; layered = riggable)

| Set | License | Riggable? | Notes |
|---|---|---|---|
| **Humaaans** ([humaaans.com](https://www.humaaans.com/)) | **CC0** | **Yes — best option.** Body parts are separate SVGs (heads, torsos, arms, legs, poses) meant for mix-and-match → import each part, parent to bones | By Pablo Stanley |
| **Open Peeps** ([openpeeps.com](https://www.openpeeps.com/)) | **CC0** | **Yes.** 100+ hand-drawn parts (heads, bodies, hands, arms, hats, faces) as separate SVGs | By Pablo Stanley, part of Open Doodles |
| **unDraw** ([undraw.co](https://undraw.co/), [license](https://undraw.co/license)) | Custom (free commercial, no attribution) | Partially — flat people illustrations, usually one SVG per scene | ⚠️ **License explicitly prohibits AI/ML training use and repackaging** — read before using in an AI product |
| **Twemoji** ([github](https://github.com/twitter/twemoji), [CC-BY-4.0 graphics, MIT code](https://github.com/twitter/twemoji/blob/master/LICENSE-GRAPHICS)) | CC BY 4.0 (attribution required) | No — each emoji is a single flat path; usable as art, not layered parts | ODU33104/rive-mcp ships Twemoji-SVG samples (see §5); attribution: "Twitter emoji" |
| **Openclipart** ([openclipart.org](https://openclipart.org/), [FAQ](https://openclipart.org/share)) | **CC0** per upload | Depends on the file; character packs exist | e.g. [Mix and Match Characters 2020](https://openclipart.org/detail/324033/mix-and-match-characters-2020-edition), [Simple characters](https://openclipart.org/detail/206128/simple-characters) — 185k+ SVGs |

**Recommended combo:** Humaaans or Open Peeps body parts (CC0, layered) → import SVGs into Rive → rig with bones → reuse the CC-BY marketplace mascot files above as state-machine/rig references.

---

## 5. Programmatic / AI .riv authoring — what works, what fails

**Format reality check:** `.riv` is a documented binary format (LEB128 varuints, `RIVE` fingerprint, ToC, little-endian; current major format **7**; major versions are not cross-compatible) ([format spec](https://rive.app/docs/runtimes/advanced-topic/format)). The official runtimes are MIT-licensed and **read-only**; the editor is proprietary — so *writing* .riv requires third-party writers.

### Works today
1. **ODU33104/rive-mcp** (free, no editor, no cloud, no subscription — [GitHub](https://github.com/ODU33104/rive-mcp), verified by cloning). The most relevant tool for this project: 30 tools, builds `.riv` **from a JSON scene spec** (`riv_create`), imports SVG as true bezier paths (`riv_import_svg`, incl. `@twemoji/svg` sets — samples build scenes from Twemoji SVGs), **Lottie import** (`riv_lottie_import`), lossless edit of existing .riv (`riv_edit`/`riv_decompile`), **auto-rig a character PNG** (`rigCharacter.ts`: cutout parts + bone-skinned head mesh + blink + idle/happy animations + SM), motion-quality lint (`riv_lint`: robotic linear movement, teleports, missing stagger), critique loop (`riv_critique`), renders via official WASM runtime in headless Chromium, E2E-verified. Ships sample rigs: `samples/ref/two_bone_ik.riv`, `samples/ref/constrained.riv`, `cosmic.riv`, `weather.riv`. Known caveat: embedded audio only plays in GPU-backed runtimes, not its own preview; unsupported Lottie/decompile features are counted, not silently dropped.
2. **stevysmith/rive-generator** — TypeScript library that writes .riv binaries directly (`RiveFile`, `addKeyedProperty`, `PropertyKey`) ([GitHub](https://github.com/stevysmith/rive-generator)).
3. **George-RD/rive-rs-cli** — Rust CLI: JSON scene → .riv, validator, `ai generate` prompt-lab, optional MCP server ([GitHub](https://github.com/george-rd/rive-rs-cli)).
4. **Official rive-code-generator-wip** — parses .riv → type-safe wrappers / JSON (Dart, JSON out) for integration codegen ([GitHub](https://github.com/rive-app/rive-code-generator-wip)). Runtime-side low-level API (canvas-advanced) allows full programmatic control of loaded files ([low-level API docs](https://rive.app/docs/runtimes/web/low-level-api-usage)).

### Fails / blocked (verified issues)
1. **paradoxsyn/rivemcp ("RiveMCP", paid binary, 139 tools)** — **stdio server crashes on startup on macOS arm64 since v1.6.0**: `The argument 'filename' must be a file URL object… Received undefined`; 1.5.0 works, 1.6.0–1.8.0 broken; regression still open ([issue #2](https://github.com/paradoxsyn/rivemcp-releases/issues/2)).
2. **Official Rive MCP** (editor-integrated) — requires the **desktop editor running + paid plan + AI credits + manual confirmation on every change**; was disabled for a period and re-enabled only in Early Access after a feature request ([rive-runtime issue #87](https://github.com/rive-app/rive-runtime/issues/87)); and its `createShapes` path tool currently fails 100% with `type 'Null' is not a subtype of type 'String'` ([rive-runtime issue #109](https://github.com/rive-app/rive-runtime/issues/109)).
3. General AI-quality warning from a paying user: "Rive agent is not of suitable quality… nearly all credits consumed on one request" ([issue #87 comment thread](https://github.com/rive-app/rive-runtime/issues/87)).

**Recommendation:** use ODU33104/rive-mcp for headless .riv generation/rigging experiments; author the final coach character in the free Rive editor (human-in-the-loop) for maximum quality; use `riv_lint`/`riv_critique` as automated review before shipping.

---

## Decision-ready priority list (downloadable today)
1. **Assistant Character** (HaiDo, CC BY) — closest existing coach mascot: idle + wave + SM. https://rive.app/marketplace/20733-39021-assistant-character/
2. **Humaaans** (CC0, layered body-part SVGs) — import & rig. https://www.humaaans.com/
3. **Open Peeps** (CC0, layered hand-drawn parts). https://www.openpeeps.com/
4. Reference rigs: **Character Head**, **Eyes Animation – Blink and Track**, **All eyes on me** (all CC BY marketplace).
5. **ODU33104/rive-mcp** for programmatic generation + Twemoji-SVG sample pipeline (CC BY 4.0 art).
6. Avoid: paradoxsyn/rivemcp (broken on macOS arm64), unDraw (AI-training prohibition), official editor MCP (paid credits, immature).

## Gaps
- No canonical Rive-published numbers for blink interval/duration; values in §3 are community practice + human physiology reference. Verify against your own feel-test renders.
- Marketplace pages can change license badges / be taken down; re-verify each file's CC-BY badge at download time.
- LottieFiles → .riv conversion quality via ODU33104/rive-mcp `riv_lottie_import` is untested in this repo; plan a spike.
- Twemoji is flat (not layered) — fine as accents/UI art, not as a riggable character.
