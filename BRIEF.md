# Coach .riv build brief — READ FIRST

Goal: a Duolingo-grade animated 2D gym coach as `.riv`, with multiple actions driven by a
state machine. Look must be top-tier; this is the whole point of the project.

## Hard-won constraints — do NOT rediscover these

1. **There is no usable Rive MCP tool surface here.** Drive everything from plain node by
   importing the built JS directly:
   ```js
   const R = "/home/umer/.local/share/mise/installs/node/26.1.0/lib/node_modules/rive-mcp-server";
   const { createRiv }   = await import(R + "/dist/rivWriter.js");
   const { expandHlapi } = await import(R + "/dist/hlapi.js");     // expands `presets` + `bake`
   const { importSvg }   = await import(R + "/dist/svgImport.js");
   const { RiveHost }    = await import(R + "/dist/riveHost.js");
   const { PAGE_SCRIPT } = await import(R + "/dist/pageScript.js");
   const { computeMetrics } = await import(R + "/dist/critique.js");
   const { generateTokens } = await import(R + "/dist/designTokens.js");
   const { encodeGif }   = await import(R + "/dist/gif.js");
   ```
   `createRiv(scene)` → `{ bytes, warnings }`. Call `expandHlapi(scene)` BEFORE `createRiv`
   if the scene uses `presets`. Reference code: `/tmp/rive-mcp/samples/*/build-scene.mjs`.

2. **IMAGE MESHES RENDER BLANK. Never use `images[].mesh`.** The preview runtime is
   Canvas2D (`canvas-advanced`) and silently draws nothing for mesh-deformed images. Verified:
   the upstream repo's own `test/bones-demo.mjs` renders background-only here. Anything you
   build on a mesh is unverifiable, so it is banned. Bone *skinning* is therefore also out.
   Rig with **vector shapes parented to groups**, rotating about group pivots (cutout rig).

3. **The art is already vector.** `art/coach_a.svg` (18 flat bezier paths) imports and renders
   correctly via `importSvg`. Pipeline that produced it, if you need to redo it:
   `gen/v2_c.png` → `magick ... -fuzz 6% -transparent white -trim +repage -resize 600x`
   → `@neplex/vectorizer` (installed) with
   `{colorMode:Color, colorPrecision:6, filterSpeckle:24, spliceThreshold:45, cornerThreshold:60, layerDifference:12, lengthThreshold:4, maxIterations:10, mode:Spline, hierarchical:Stacked}`.

4. **Verify by looking, every time.** After each build render PNG frames via
   `host.renderFrames(buf, { animation:"idle", startTime:0, frameCount:N, fps, width:420, format:"png" })`
   and actually inspect them (montage into a filmstrip and read the image). A frame with
   `alpha=0` everywhere means you broke something — `magick f.png -format "%[fx:mean.a]" info:`.
   Never report success on a build you have not looked at.

## The rigging problem you must solve

`art/coach_a.svg` path `c_p0` (`#191817`) is a **single outline path for the entire body**.
If you rotate an arm group, that outline stays put and the character tears apart.

Fix: **cut the PNG into body-part masks first, then vectorize each part separately**, so every
part carries its own closed outline. Suggested parts and pivots (image px, 600x633 art/coach.png):

| part   | contains                    | pivot (joint)     |
|--------|-----------------------------|-------------------|
| head   | hair, headband, face, eyes  | neck  (300, 152)  |
| torso  | tank top, chest, shorts     | hip   (300, 425)  |
| armL   | screen-left arm + hand      | shL   (238, 190)  |
| armR   | screen-right arm + hand     | shR   (362, 190)  |
| legL   | screen-left leg + shoe      | hipL  (262, 428)  |
| legR   | screen-right leg + shoe     | hipR  (338, 428)  |

Cut lines should pass *through* the joint mass and overlap slightly, so the seam hides under the
neighbouring part. Set `z` so torso draws over the arm/leg sockets. Split arms at the elbow too
(elL 150,300 / elR 450,300) only if you can keep the seam invisible — otherwise one arm part is fine.

Each part becomes a Rive group positioned at its pivot, with its shapes offset so the pivot sits
at the group origin. Rotating the group then rotates about the joint. Parent limb groups to a
`root` group so a root move carries the whole body.

## Motion spec (from research/duolingo-spec.md + the rive-design-guidelines skill)

- Standard transitions 180–250ms; celebrations 300–600ms. Bounce/overshoot
  (`ease-out-back`, `elastic-out`) ONLY for celebratory beats, never idle chrome.
- Idle loop 6–9s, not 3s — short loops read as robotic. Never let two tracks peak on the
  same frame; offset peaks (e.g. y at 45%, head at 30%, arms at 66/70%).
- Every transform track needs a real easing. All-linear is flagged `motion-robotic` by lint.
- Blink: 0.15–0.3s closure, randomized interval ~3–6s, ease-in-out. Not a fixed metronome.
- Anticipation before a big move (dip 10–15% opposite), overshoot 5–15% past target, settle.
- Palette: keep the character's own colors. Duolingo UI greens if you need accents:
  `#58CC02` primary, `#58A700` ledge/shadow, `#89E219` highlight, `#E5E5E5` locked/neutral.

## Deliverables

1. `coach.riv` — the rigged character.
2. Animations: `idle` (looping, alive, 6–9s) plus one-shots `wave`, `flex`, `cheer`, `nod`, `sad`.
3. State machine `Coach`: layer `Body` with `idle` as the base state, each action reachable from
   **Any State** via its own trigger input (`waveTrigger`, `flexTrigger`, `cheerTrigger`,
   `nodTrigger`, `sadTrigger`) and returning to `idle` on completion. A second layer `Face`
   running a looping `blink` independently, so blinking never disturbs the body.
   (This mirrors Duolingo's documented two-parallel-systems architecture.)
4. `out/idle.gif` + one GIF per action, and a filmstrip PNG per animation.
5. `BUILD-NOTES.md`: what you did, what the lint said, what is weak and why.

Build it with a single re-runnable script (`build-coach.mjs`) — no manual steps.

## Definition of done

- `computeMetrics(...)` lint has zero non-info findings other than ones you explicitly justify.
- You have looked at every filmstrip and the character does not tear, detach, or go blank in
  any frame of any animation.
- The idle actually reads as alive — breathing, weight shift, blink, offset limb drift.
