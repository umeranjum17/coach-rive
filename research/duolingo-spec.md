# Research: Duolingo Character Animation + Gamified Path UI — Implementable Spec

Provenance tags: **[OFFICIAL]** = Duolingo blog / design.duolingo.com brand guidelines / Rive blog / Duocon talk / Duolingo designer post. **[INFERRED]** = third-party teardowns, CSS recreations, design-token scrapers — consistent with the app but not official; treat as starting values, verify against your own screenshots.

---

## Summary

Duolingo's characters are flat-fill vector puppets built from 3 rounded shapes (rounded rect, circle, rounded triangle), rigged in Rive and driven by a layered State Machine: one layer for body/emotion states (idle → correct/wrong), a parallel layer for 20+ viseme mouth states per character, plus modular gesture mix-and-match (Lily: 8 head × 8 body animations = 64 idle combos in a <1MB .riv). The path UI is a vertical winding scroll of circular lesson nodes (~80pt, ±60pt alternating wave, ~96pt pitch, 8pt dashed connector) with a 3D "ledge" button language (solid `0 4px 0` darker-shade shadow, collapses on press) and a pulsing active node. Motion is fast and springy: ~150–250ms standard, 300–600ms celebrations, bounce easing reserved for celebratory moments only.

---

## Findings

### 1. Character art language — construction rules

1. **Shape vocabulary — exactly three shapes.** All illustrations are made from the rounded rectangle, circle, and rounded triangle; every shape must have rounded edges ("pointy shapes are off-brand"). Pathfinder cuts are allowed as long as edges stay rounded. [OFFICIAL — design.duolingo.com Shape Language](https://design.duolingo.com/illustration/shape-language)
2. **Outlines: effectively none in official guidance.** The official guidelines never mention outlines; art is flat vector fills. The iOS teardown describes "no gradients, no rendered shadows, just bold outlines and joyful geometry" — the "outlines" it refers to are the 2px `#E5E5E5` UI borders on cards/buttons, not character linework. Some app-era characters (Duo) render with a thin darker-shade rim stroke in the shipped app — visible in screenshots but undocumented. **Rule: flat fills, no gradients; if you add a rim, use a darker tint of the fill color, not black.** [OFFICIAL shape language](https://design.duolingo.com/illustration/shape-language), [INFERRED iOS teardown](https://github.com/Meliwat/awesome-ios-design-md/blob/main/design-md/misc/duolingo/DESIGN.md)
3. **Shape count target: ~15 shapes per illustration.** The guidelines show 6 shapes = "too abstract", 15 = "good", 30 = "too many". Fewest shapes that read correctly. [OFFICIAL](https://design.duolingo.com/illustration/shape-language)
4. **Head/body construction: 1–2 basic shapes each.** "Usually, the head and body are composed of 1–2 basic shapes each." No official head-to-body ratio is published; the shipped cast is chibi-ish (Duo ≈ 1:1 head:body). Shape repetition within a character keeps cohesion; arm socket always concealed behind the torso. [OFFICIAL — Characters](https://design.duolingo.com/illustration/characters)
5. **Eyes: 5 geometric styles — round, glasses, almond, linear, dots** (dots only for always-small-scale characters). "No ovals!" Pupils centered vertically in the eye; pupil size, tears, eyelids carry emotion. Duo additionally has an eye-mask outline and eyelash feathers (stretched lowercase-m shapes). [OFFICIAL — Characters](https://design.duolingo.com/illustration/characters), [OFFICIAL — How to draw Duo](https://blog.duolingo.com/how-to-draw-duo-the-owl/)
6. **Nose: 1–2 rounded rectangles**, colored "as saturated as it is dark"; in profile it takes the base skin tone. [OFFICIAL — Characters](https://design.duolingo.com/illustration/characters)
7. **Mouth: the least geometric feature.** Most mouths favor one side (asymmetry = more lifelike), can break out of the face frame for extreme emotion; teeth/tongue always centered. For lip-sync, each of the 10 World Characters has a full viseme set (20+ mouth shapes) designed to its personality. [OFFICIAL — Characters](https://design.duolingo.com/illustration/characters), [OFFICIAL — World Character visemes](https://blog.duolingo.com/world-character-visemes/)
8. **Hair: 1–2 large shapes max**; always include hair above the ear/sideburn; facial hair keeps the nose skin-colored to avoid extra colors. [OFFICIAL — Characters](https://design.duolingo.com/illustration/characters)
9. **Hands: circles, bare minimum fingers (≤4).** "Keep hands as abstract as you can by keeping them as circles." [OFFICIAL — Characters](https://design.duolingo.com/illustration/characters)
10. **Shadows: pill shape, never oval** (ovals imply perspective); always a darker shade of the base it sits under; **never gray** — gray "appears lifeless". All apps are white-background, so use light pastels instead of white as base fills. [OFFICIAL — Shape Language](https://design.duolingo.com/illustration/shape-language)
11. **Color discipline: few colors per illustration** ("too many colors can hurt legibility at small scale"); the intern design post notes character colors must not clash with the character's own palette so they stand out on the set. Teardown puts it at "two or three colors" per character. The official illustration palette is the animal-named token set (Owl `#58CC02`, Turtle `#A5ED6E`, Sea Sponge `#D7FFB8`, Cardinal `#FF4B4B`, Fox `#FF9600`, Bee `#FFC800`, Macaw `#1CB0F6`, Beetle `#CE82FF`, etc.). Duo's own palette: Feather Green `#58CC02`, Mask Green `#89E219`, plus beak-inner/beak-lower/feet/highlight shades. [OFFICIAL — Shape Language color + Color page](https://design.duolingo.com/identity/color), [OFFICIAL — intern post](https://blog.duolingo.com/designing-new-characters-internship/), [INFERRED](https://github.com/Meliwat/awesome-ios-design-md/blob/main/design-md/misc/duolingo/DESIGN.md)
12. **Evolution note:** the current style arrived with the 2018 redesign — pre-2018 was "static, hard-edged shapes on light gray." Current = "bold, bouncy, bright," exaggerated-to-caricature details, rhythm via varied shape sizes. [OFFICIAL — Shape language blog](https://blog.duolingo.com/shape-language-duolingos-art-style/)

### 2. Animation tech stack — Rive, confirmed and detailed

13. **Rive is the official stack for character + reward animation.** Confirmed by Duolingo's own blog (visemes), Rive's blog (creative technologists, Video Call case study), the Duocon 2023 talk ("How we animate the Duolingo world"), and the Apple "Behind the Design" feature. Timeline of adoption: reward animations first (chest shaking, gems jumping out) → character lip-sync → DuoRadio (reused host/animation swapping) → Video Call with Lily (2D rig, future 3D via Godot for context-aware scenes). [OFFICIAL — Rive creative technologists](https://rive.app/blog/creative-technologists-duolingo-s-solution-to-the-designer-to-developer-handoff), [OFFICIAL — Rive Video Call](https://rive.app/blog/duolingo-s-ai-powered-video-call-brings-lily-to-life), [OFFICIAL — Apple](https://developer.apple.com/news/?id=jhkvppla), [OFFICIAL — Duocon 2023](https://www.youtube.com/watch?v=fgOqvyPif3g)
14. **Architecture: two parallel State Machine systems per character.** System 1 = mouths (viseme states, programmatically called in any order). System 2 = character body states (idle → correct / incorrect based on answer outcome). The two systems run simultaneously so mouth movement never perturbs body animation. This is the core pattern to copy. [OFFICIAL — visemes post](https://blog.duolingo.com/world-character-visemes/), [OFFICIAL — Duocon 2023 talk](https://www.youtube.com/watch?v=fgOqvyPif3g)
15. **Inputs are game state.** The app retrieves audio + phoneme/viseme timing, then triggers the state machine in sync with audio. Concrete behaviors: tap a word → character says and animates that word; finish the exercise early → character stops speaking immediately; idle = head nods, blinking, eyebrow movement; challenge outcome → final correct/wrong reaction state. [OFFICIAL — visemes post](https://blog.duolingo.com/world-character-visemes/)
16. **Modular-mix approach for expression at scale.** Lily: 8 head animations × 8 body animations = 64+ neutral-movement combinations (prevents repetitive idle loops); nested artboards separate head and body for independent movement; event-triggered expressions sync AI responses to animation; final .riv under 1MB. [OFFICIAL — Rive Video Call case study](https://rive.app/blog/duolingo-s-ai-powered-video-call-brings-lily-to-life)
17. **Pipeline/team roles:** animators build timelines in Rive; dedicated "creative technologists" build the state-machine logic and write spec documentation of the inputs for engineers; the exported single .riv runtime file is the handoff artifact. Inputs are named logically for developers (e.g. text-run inputs editable at runtime). [OFFICIAL — Rive creative technologists](https://rive.app/blog/creative-technologists-duolingo-s-solution-to-the-designer-to-developer-handoff), [OFFICIAL — visemes post](https://blog.duolingo.com/world-character-visemes/)
18. **Viseme pipeline:** TTS audio → in-house speech recognition/pronunciation models → word+phoneme timing → linguistic-feature viseme set → factory-generated timings per course, audited by hand. 20+ mouth shapes per character. [OFFICIAL — visemes post](https://blog.duolingo.com/world-character-visemes/)

### 3. The path / learning-map UI — layout mechanics

19. **Official product semantics:** one winding path replaces the old skill tree; each circle = one crown level of a skill; levels interspersed across units (spaced repetition); practice + stories built into the path; tapping a node opens a topic popup; unit headers describe the concepts; a floating arrow button bottom-right jumps back to your current node. [OFFICIAL — new path announcement](https://blog.duolingo.com/new-duolingo-home-screen-design/)
20. **Node states (official design intent):** the 2024 Path redesign explicitly added a **pulsating ring around the active node** to pull the tap; progress rings segmented into lesson chunks for multi-session nodes; XP-bubble flourish on boosts; "Jump Here" placement; node-complete celebrations; gem-collection chest animations. State communicated "through motion, without explicit text instructions." [OFFICIAL — Devansh Gandhi, Duolingo product designer](https://devansh.design/delight-on-path)
21. **Concrete measurements** (from the designmd iOS teardown — the only source with numbers; consistent with screenshots):
    - Skill nodes: **80pt diameter** (72pt on iPhone SE, 88pt on Pro Max); active node **pulses to 96pt**
    - Node pitch: **~96pt center-to-center vertically**
    - Wave: alternating left/right offset **±60pt** (±40pt on SE)
    - Connector: **8pt wide dashed/dotted line in `#E5E5E5`**
    - Current node pulse ring: `#89E219` (Mask Green), scale 1.0 ↔ 1.05
    - Unit hero card: ~140pt tall, full-width minus 16pt margins, 16–20pt radius, brand-colored fill, white title
    - Section headers: 12pt DIN Rounded w800 UPPERCASE, ~1.0pt tracking ("SECTION 1")
    - Node colors: complete = `#58CC02` fill + white icon + `#58A700` ledge + crown badge; locked = `#E5E5E5` fill + `#AFAFAF` lock icon, no ledge; gold-crowned = `#FFC800` fill + `#E29F03` ledge; Legendary (Super) = `#CE82FF` fill
    - Press feedback on node: scale 0.96 + haptic
    - Viewport density: 8–12 nodes visible per viewport on the path screen
    [INFERRED — Meliwat/awesome-ios-design-md DESIGN.md](https://github.com/Meliwat/awesome-ios-design-md/blob/main/design-md/misc/duolingo/DESIGN.md)
22. **The 3D "ledge" button (applies to nodes, CTAs, answer tiles):** solid offset shadow of a darker shade of the element's own color — `0 4px 0 #58A700` for green, `0 4px 0 #1899D6` for blue, `0 2px 0 #E5E5E5` for white/neutral. On press: `translateY(4px)` and the ledge collapses. Radius 12–16px. This is the most-documented single UI mechanic; multiple independent CSS recreations converge on the same values. [INFERRED, multiple: oh-my-design](https://oh-my-design.kr/design-systems/duolingo), [Medium CSS replication](https://medium.com/@lilskyjuicebytes/clone-the-ui-1-replicating-duolingos-button-in-pure-css-bd37a97edb7e), [iOS teardown](https://github.com/Meliwat/awesome-ios-design-md/blob/main/design-md/misc/duolingo/DESIGN.md)
23. **Implementation recipe for the winding path (web/SwiftUI):** generate from a units→lessons data model; LazyVStack/VirtualList of nodes with alternating horizontal offset; draw the connector ONCE in a single Canvas/SVG layer behind the nodes (compute node centers from row height + winding offset; cubic-bezier S-curves between consecutive centers with control point nudged toward the midpoint; round line cap; stroke width comfortably under the node circle); drive path and nodes from the same offset source so they never drift; scroll-to-current-node on open. [INFERRED — VP0 SwiftUI guide](https://vp0.com/blogs/duolingo-learning-tree-gamification-ui), [INFERRED — winding SVG technique](https://zellwk.com/blog/million-devs-paths/), [INFERRED — CSS S-curve connectors](https://codefronts.com/layouts/css-timelines/nature-trail/)

### 4. Motion feel — durations, easing, when characters react

24. **Duration scale (from token scrape):** 120ms / 180ms / 280ms / 420ms; easings `cubic-bezier(0.4,0,0.2,1)` and `cubic-bezier(0.16,1,0.3,1)`. [INFERRED — Dembrandt token explorer](https://www.dembrandt.com/explorer/duolingo)
25. **Interaction micro-motion (iOS teardown values):** button press 80ms linear down, spring back 250ms (damping 0.7); correct answer: tile→green + check pop scale 0→1.2→1.0 spring ~300ms; wrong answer: tile→red + horizontal shake ±6pt for 400ms; node tap 180ms spring 0.96→1.0; XP ring fill 800ms ease-out; confetti ~1.2s; streak flame idle pulse 1.0↔1.05 over 2s, save-moment scale 1.3→1.0 spring. [INFERRED — iOS teardown](https://github.com/Meliwat/awesome-ios-design-md/blob/main/design-md/misc/duolingo/DESIGN.md)
26. **Celebratory bounce easing:** `cubic-bezier(0.34, 1.56, 0.64, 1)` — overshoot reserved for celebrations (XP pop, streak flame, badge reveal, owl bounce) only; standard UI uses the flat standard curves. Reduce-motion: collapse durations, drop bounce/confetti. [INFERRED — oh-my-design CLI DESIGN.md](https://unpkg.com/oh-my-design-cli@1.9.0/web/references/duolingo/DESIGN.md)
27. **When characters react (official):** idle loop (head nods, blinking, eyebrows) always; on word-tap during speaking exercises the character speaks/animates that word; stop instantly if the exercise is finished early; correct vs wrong answer triggers the final reaction state; lesson complete → full celebration with Duo cheering + confetti + haptics + sound; streak milestone days (7/30/100/365) get bespoke full-screen celebrations (regular days get only the counter tick — gating keeps them powerful; redesigning the phoenix milestone animation alone moved day-7 retention +1.7%). Lily's video-call mode adds reactive "thinking" fills (head tilt, pondering) to cover AI latency. [OFFICIAL — visemes post](https://blog.duolingo.com/world-character-visemes/), [OFFICIAL — Rive Video Call](https://rive.app/blog/duolingo-s-ai-powered-video-call-brings-lily-to-life), [INFERRED — streak deconstruction](https://duolingo.deconstructoroffun.com/mechanics/streaks)
28. **Squash/stretch:** not documented in official sources; the observable style uses scale-springs (0.96 press, 1.05 idle pulse, 1.2 pop) rather than true squash-and-stretch deformation. Treat the springy scale-pop as the S&S substitute. [INFERRED — iOS teardown](https://github.com/Meliwat/awesome-ios-design-md/blob/main/design-md/misc/duolingo/DESIGN.md)

### 5. Open-source clones/recreations worth stealing from

29. **jeancdevx/duolingo-clone** ("Lingo") — the CodeWithAntonio-tutorial codebase lineage; complete, well-organized: `components/Learn/Units`, `Courses/LessonButton` (progress ring per node), `Courses/UnitBanner` (unit hero), lesson challenge flow, hearts, shop, leaderboard, Drizzle/Postgres schema (courses→units→lessons→challenges→options). Best structural reference for the path data model. [GitHub](https://github.com/jeancdevx/duolingo-clone)
30. **NickCoder123/duolingo-clone** — same Lingo lineage (Next.js 14 + RSC + shadcn/ui + Drizzle + Stripe), explicit checklist of remaining features; useful for its learn-page wrappers and seed schema. [GitHub](https://github.com/NickCoder123/duolingo-clone)
31. **bryanjenningz/react-duolingo** — minimal React/TS/Next/Tailwind/Zustand clone; simplest codebase to read for the page structure. [GitHub](https://github.com/bryanjenningz/react-duolingo/)
32. **nmnarora600/duolingo-web** — Next.js 14, shadcn, Drizzle, ElevenLabs voices, full gamification surface (hearts, XP, leaderboard, quests, shop, Stripe). [GitHub](https://github.com/nmnarora600/duolingo-web)
33. **Rajat-Raghuvanshi-0512/duolingo-clone** — Next.js + Drizzle; clean units-of-5-lessons model and lesson challenge types (SELECT/ASSIST). [GitHub](https://github.com/Rajat-Raghuvanshi-0512/duolingo-clone)
34. **jokerhutt/ludolang** — TypeScript frontend + separate backend; includes "scroll to current lesson" button, popovers, streaks, daily quests — good for the path-navigation details. [GitHub](https://github.com/jokerhutt/duoclone)
35. **VP0 SwiftUI learning-tree guide** — the winding-path algorithm itself (alternating offset, single-canvas bezier connector, node states, scroll-to-current). Best read for the geometry regardless of platform. [VP0 Journal](https://vp0.com/blogs/duolingo-learning-tree-gamification-ui)
36. **CodeFronts "Nature Trail Timeline"** — pure-CSS/SVG S-curve waypoint connectors (cubic-bezier legs, dashed round-cap strokes, alternating left/right). Directly reusable technique for a web path map. [CodeFronts](https://codefronts.com/layouts/css-timelines/nature-trail/)
37. **Meliwat/awesome-ios-design-md DESIGN.md** — the full measurement spec (colors, ledges, nodes, motion, responsive rules) in one machine-readable file; the closest thing to a public spec. [GitHub](https://github.com/Meliwat/awesome-ios-design-md/blob/main/design-md/misc/duolingo/DESIGN.md)

---

## Numbers table

| Thing | Value | Source |
|---|---|---|
| Shape vocabulary | rounded rect + circle + rounded triangle, all edges rounded | [OFFICIAL](https://design.duolingo.com/illustration/shape-language) |
| Shape count sweet spot | ~15 per illustration (6 too few, 30 too many) | [OFFICIAL](https://design.duolingo.com/illustration/shape-language) |
| Head/body parts | 1–2 shapes each | [OFFICIAL](https://design.duolingo.com/illustration/characters) |
| Eye styles | 5 (round/glasses/almond/linear/dots); geometric only, no ovals | [OFFICIAL](https://design.duolingo.com/illustration/characters) |
| Nose | 1–2 rounded rects | [OFFICIAL](https://design.duolingo.com/illustration/characters) |
| Fingers | ≤4, hands mostly circles | [OFFICIAL](https://design.duolingo.com/illustration/characters) |
| Ground shadow | pill shape, darker than base, never gray | [OFFICIAL](https://design.duolingo.com/illustration/shape-language) |
| Colors per character | "a few" (official) / 2–3 (teardown) | [OFFICIAL](https://design.duolingo.com/illustration/shape-language), [INFERRED](https://github.com/Meliwat/awesome-ios-design-md/blob/main/design-md/misc/duolingo/DESIGN.md) |
| World characters / visemes | 10 characters, 20+ mouth shapes each | [OFFICIAL](https://blog.duolingo.com/world-character-visemes/) |
| Rive state-machine layers | 2 parallel (mouth visemes ∥ body idle/correct/wrong) | [OFFICIAL](https://blog.duolingo.com/world-character-visemes/) |
| Lily modular idle | 8 head × 8 body = 64 combos; .riv < 1MB | [OFFICIAL](https://rive.app/blog/duolingo-s-ai-powered-video-call-brings-lily-to-life) |
| Path node size | 80pt (72pt SE / 88pt Pro Max); active pulses to 96pt | [INFERRED](https://github.com/Meliwat/awesome-ios-design-md/blob/main/design-md/misc/duolingo/DESIGN.md) |
| Node pitch | ~96pt center-to-center | [INFERRED](https://github.com/Meliwat/awesome-ios-design-md/blob/main/design-md/misc/duolingo/DESIGN.md) |
| Wave offset | ±60pt alternating (±40pt SE) | [INFERRED](https://github.com/Meliwat/awesome-ios-design-md/blob/main/design-md/misc/duolingo/DESIGN.md) |
| Connector | 8pt dashed `#E5E5E5`, rounded caps | [INFERRED](https://github.com/Meliwat/awesome-ios-design-md/blob/main/design-md/misc/duolingo/DESIGN.md) |
| Active-node ring | `#89E219`, pulse 1.0↔1.05 | [INFERRED](https://github.com/Meliwat/awesome-ios-design-md/blob/main/design-md/misc/duolingo/DESIGN.md); pulsating ring confirmed [OFFICIAL](https://devansh.design/delight-on-path) |
| Unit hero card | ~140pt tall, 16–20pt radius, 16pt margins | [INFERRED](https://github.com/Meliwat/awesome-ios-design-md/blob/main/design-md/misc/duolingo/DESIGN.md) |
| Section header | 12pt DIN Rounded 800 UPPERCASE, ~1pt tracking | [INFERRED](https://github.com/Meliwat/awesome-ios-design-md/blob/main/design-md/misc/duolingo/DESIGN.md) |
| Button ledge | `0 4px 0 #58A700` (green), 12–16pt radius, press `translateY(4px)` + collapse | [INFERRED, multi-source](https://oh-my-design.kr/design-systems/duolingo) |
| Answer tile | 12pt radius, 2pt `#E5E5E5` border, `0 2px 0 #E5E5E5` ledge | [INFERRED, multi-source](https://github.com/Meliwat/awesome-ios-design-md/blob/main/design-md/misc/duolingo/DESIGN.md) |
| XP ring | 48pt, 4pt stroke, `#58CC02` on `#E5E5E5`, 800ms ease-out fill | [INFERRED](https://github.com/Meliwat/awesome-ios-design-md/blob/main/design-md/misc/duolingo/DESIGN.md) |
| Duration tokens | 120 / 180 / 280 / 420ms | [INFERRED](https://www.dembrandt.com/explorer/duolingo) |
| Standard easings | `cubic-bezier(0.4,0,0.2,1)`, `cubic-bezier(0.16,1,0.3,1)` | [INFERRED](https://www.dembrandt.com/explorer/duolingo) |
| Bounce easing (celebrations only) | `cubic-bezier(0.34,1.56,0.64,1)` | [INFERRED](https://unpkg.com/oh-my-design-cli@1.9.0/web/references/duolingo/DESIGN.md) |
| Button press/return | 80ms linear down, 250ms spring back (damping ~0.7) | [INFERRED](https://github.com/Meliwat/awesome-ios-design-md/blob/main/design-md/misc/duolingo/DESIGN.md) |
| Correct answer | green fill + check pop scale 0→1.2→1.0, ~300ms spring | [INFERRED](https://github.com/Meliwat/awesome-ios-design-md/blob/main/design-md/misc/duolingo/DESIGN.md) |
| Wrong answer | red fill + shake ±6pt, 400ms | [INFERRED](https://github.com/Meliwat/awesome-ios-design-md/blob/main/design-md/misc/duolingo/DESIGN.md) |
| Node tap | scale 0.96→1.0, 180ms spring | [INFERRED](https://github.com/Meliwat/awesome-ios-design-md/blob/main/design-md/misc/duolingo/DESIGN.md) |
| Confetti | ~1.2s, 8–12 pieces | [INFERRED](https://github.com/Meliwat/awesome-ios-design-md/blob/main/design-md/misc/duolingo/DESIGN.md) |
| Streak idle pulse | 2s ease-in-out, 1.0↔1.05 | [INFERRED](https://github.com/Meliwat/awesome-ios-design-md/blob/main/design-md/misc/duolingo/DESIGN.md) |
| Key palette | Owl `#58CC02`, Tree Frog `#58A700`, Turtle `#A5ED6E`, Sea Sponge `#D7FFB8`, Cardinal `#FF4B4B`, Fire Ant `#EA2B2B`, Fox `#FF9600`, Bee `#FFC800`, Macaw `#1CB0F6`, Beetle `#CE82FF`, Eel `#4B4B4B`, Hare `#AFAFAF`, Swan `#E5E5E5` | [OFFICIAL](https://design.duolingo.com/illustration/shape-language) |

---

## Implementation recipe (what to actually build)

1. **Character in Rive:** one nested-artboard rig (head + body separate); flat fills from the palette; 15-shape budget; 5-style geometric eyes; asymmetric mouth. Build **two state-machine layers**: layer A = idle loop (blink, head nod, eyebrow) + correct + wrong + celebrate states; layer B = viseme set (start with ~8–12 phoneme groups, not the full 20). Inputs: `isSpeaking`, `mouthShape`, `isCorrect`, `isWrong`, `isThinking`. Wire game state: correct/wrong on answer submit, mouth triggers from TTS timings, cancel speech on early finish.
2. **Path UI:** data model units→lessons; node = circle (80pt target) with per-state fill/ledge (complete green + `0 4px 0 #58A700`, locked `#E5E5E5` no ledge, current green + pulsing `#89E219` ring at 96pt); alternating ±60pt offset, ~96pt pitch; single SVG/Canvas connector behind nodes, 8pt dashed `#E5E5E5` cubic-bezier S-curves with round caps; unit hero card 140pt + section label 12pt uppercase; scroll-to-current on open + floating jump-back button.
3. **Motion:** 180–250ms standard transitions with `(0.16,1,0.3,1)`; 4px ledge press (80ms down / 250ms spring back); 300ms spring pop on correct; 400ms shake on wrong; bounce curve only for celebrate; milestone-gated celebrations; respect `prefers-reduced-motion`.

---

## Sources

**Kept**
- Duolingo blog — World Character visemes (official architecture, viseme counts, input behaviors): https://blog.duolingo.com/world-character-visemes/
- design.duolingo.com — Shape Language (shapes, shadows, color, simplicity): https://design.duolingo.com/illustration/shape-language
- design.duolingo.com — Characters (eyes/nose/mouth/hair/hands rules): https://design.duolingo.com/illustration/characters
- design.duolingo.com — Color (core palette + Duo palette): https://design.duolingo.com/identity/color
- Duolingo blog — Shape language art style (aesthetic history): https://blog.duolingo.com/shape-language-duolingos-art-style/
- Duolingo blog — How to draw Duo (construction order): https://blog.duolingo.com/how-to-draw-duo-the-owl/
- Duolingo blog — new learning path (product semantics): https://blog.duolingo.com/new-duolingo-home-screen-design/
- Rive blog — creative technologists (pipeline, inputs docs): https://rive.app/blog/creative-technologists-duolingo-s-solution-to-the-designer-to-developer-handoff
- Rive blog — Video Call with Lily (64 combos, <1MB, nested artboards): https://rive.app/blog/duolingo-s-ai-powered-video-call-brings-lily-to-life
- Duocon 2023 — "How we animate the Duolingo world" (two-system state machine): https://www.youtube.com/watch?v=fgOqvyPif3g
- Apple — Behind the Design: Duolingo (path strategy, character animation): https://developer.apple.com/news/?id=jhkvppla
- Devansh Gandhi (Duolingo PD) — "Bringing Delight to Duolingo's Path" (pulsing ring, node states, Jump Here): https://devansh.design/delight-on-path
- Meliwat/awesome-ios-design-md DESIGN.md (the numbers spec): https://github.com/Meliwat/awesome-ios-design-md/blob/main/design-md/misc/duolingo/DESIGN.md
- oh-my-design.kr Duolingo system + unpkg DESIGN.md (button/ledge/token details): https://oh-my-design.kr/design-systems/duolingo
- Dembrandt token explorer (duration/easing tokens): https://www.dembrandt.com/explorer/duolingo
- VP0 Journal — Duolingo-style learning tree in SwiftUI (winding path algorithm): https://vp0.com/blogs/duolingo-learning-tree-gamification-ui
- CodeFronts — Nature Trail Timeline (CSS/SVG S-curve connectors): https://codefronts.com/layouts/css-timelines/nature-trail/
- Medium — Replicating Duolingo's button in pure CSS (press mechanics): https://medium.com/@lilskyjuicebytes/clone-the-ui-1-replicating-duolingos-button-in-pure-css-bd37a97edb7e
- GitHub clones: https://github.com/jeancdevx/duolingo-clone · https://github.com/NickCoder123/duolingo-clone · https://github.com/bryanjenningz/react-duolingo/ · https://github.com/nmnarora600/duolingo-web · https://github.com/Rajat-Raghuvanshi-0512/duolingo-clone · https://github.com/jokerhutt/duoclone
- duolingo.deconstructoroffun.com — streak mechanic data (milestone gating, +1.7% retention): https://duolingo.deconstructoroffun.com/mechanics/streaks

**Dropped**
- dev.to/uianimation articles — self-promotional restatements of the official blogs; no new facts.
- uxdesign.cc "Down the wrong path" — UX critique, no implementable numbers.
- Refero/layout.design/open-design.ai token scrapes — marketing-landing-page (duolingo.com homepage) tokens, not the app UI; conflicting values (e.g. radius-2px); superseded by the iOS DESIGN.md.
- Hacker News thread — user opinions, no spec value.
- Zell Liew winding-SVG article — technique reference only; kept as a citation inside Finding 23, not a source.
- LinkedIn reposts of the Rive blog — duplicates.

---

## Gaps

- **No official pixel spec exists.** Every path measurement (80pt nodes, ±60pt offset, 8pt connector, 96pt pitch) is third-party inference from one teardown; Duolingo has never published a public design-token spec for the app. Verify against your own app screenshots before committing.
- **Head-to-body ratio** is not documented anywhere; observed cast is chibi (~1:1 for Duo) but unconfirmed.
- **Exact easing curves used inside Rive files** are not public; the cited curves are scraped/inferred.
- **Viseme count per character**: official post says the state machine logic runs even "when there are more than 20 shapes" — the exact per-character count isn't published.
- Suggested next step: pull a current Duolingo screenshot and measure node sizes/offsets at known device widths to lock the numbers; watch the Duocon 2023 talk directly (transcript extraction failed here) for any additional state-machine detail.

---

```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "Concrete findings with sources and severity/provenance: 37 numbered findings, each tagged [OFFICIAL] or [INFERRED] with source URLs; numbers table of 28 concrete values (80pt nodes, ±60pt wave, 8pt connector, 0 4px 0 #58A700 ledge, 96pt pitch, durations 120/180/280/420ms, bounce cubic-bezier(0.34,1.56,0.64,1), 64 idle combos, <1MB .riv); 6 clone repos with links and what each is good for. File paths: /home/umer/Projects/test/coach-rive/research/duolingo-spec.md (deliverable), /home/umer/Projects/test/.pi-subagents/artifacts/progress/11ae9928-5fb0-4f31-8c35-686eefba4eb5/progress.md (progress log).",
      "reviewFindings": [
        "info: all path/motion pixel values are third-party inferred (no official public spec exists) - flagged as [INFERRED] inline and in Gaps section",
        "info: open-design.ai and Refero token scrapes dropped due to conflicting values (marketing-site tokens, not app UI)",
        "no blockers"
      ]
    }
  ],
  "changedFiles": [
    "/home/umer/Projects/test/coach-rive/research/duolingo-spec.md",
    "/home/umer/Projects/test/.pi-subagents/artifacts/progress/11ae9928-5fb0-4f31-8c35-686eefba4eb5/progress.md"
  ],
  "testsAddedOrUpdated": [],
  "commandsRun": [
    {
      "command": "web_search (8 query batches)",
      "result": "passed",
      "summary": "Covered Rive case study, viseme blog, brand guidelines, path UI, motion tokens, GitHub clones"
    },
    {
      "command": "fetch_content design.duolingo.com (shape-language, characters) + GitHub DESIGN.md",
      "result": "passed",
      "summary": "Extracted official construction rules and the concrete measurement spec"
    },
    {
      "command": "fetch_content youtube.com/watch?v=fgOqvyPif3g (Duocon 2023)",
      "result": "failed",
      "summary": "Transcript extraction blocked (no GEMINI_API_KEY / auth); talk content recovered via search synthesis instead"
    }
  ],
  "validationOutput": "All 5 task questions answered with citations; numbers table included; provenance (official vs inferred) marked throughout; 2 dropped-source classes documented.",
  "residualRisks": [
    "Path pixel values (80pt/±60pt/96pt/8pt) are single-source third-party inference - verify against a real screenshot before shipping",
    "Easing/duration tokens are scraped, not published by Duolingo",
    "Duocon 2023 video transcript could not be fetched directly; talk details sourced from search synthesis of the same talk",
    "Viseme count per character not officially published (20+ per state-machine diagram quote)"
  ],
  "noStagedFiles": true,
  "diffSummary": "Research brief written to coach-rive/research/duolingo-spec.md (summary, 37 findings, numbers table, implementation recipe, sources, gaps, acceptance report); progress log updated at .pi-subagents/artifacts/progress/11ae9928-5fb0-4f31-8c35-686eefba4eb5/progress.md",
  "reviewFindings": [
    "no blockers",
    "provenance risk: all measurements in the numbers table marked [INFERRED] are third-party and should be validated against live screenshots"
  ],
  "manualNotes": "Spec is written to be implementable directly in Rive + a web/SwiftUI path map. Start with the 2-layer state machine (body states ∥ viseme layer) and the 4-state node system (locked/current/complete + ledge press)."
}
```
