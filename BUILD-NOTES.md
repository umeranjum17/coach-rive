# BUILD-NOTES — Duolingo-style gym coach `.riv`

## What was built

- `coach.riv` (20.5 KB): 600×700 artboard, 17 vector shapes (bezier paths imported from
  `art/coach_a.svg` via `importSvg`), rigged as a 6-part cutout: head, torso, armL, armR,
  legL, legR — each a group pivoting at its joint (neck 300,152 / hip 300,425 /
  shL 238,190 / shR 362,190 / hipL 262,428 / hipR 338,428), all children of a `root` group
  at the hip so a root move carries the whole body.
- 7 animations: `idle` (8 s loop), `blink` (8 s loop, independent Face layer), and one-shots
  `wave`, `flex`, `cheer`, `nod`, `sad`.
- State machine `Coach`, Duolingo-style two-parallel-systems:
  - Layer `Body`: `idle` base state; each action reachable from **Any State** via its own
    trigger input (`waveTrigger`, `flexTrigger`, …), returning to `idle` on completion
    (`exitTimeMs` = animation duration).
  - Layer `Face`: looping `blink`, always running, independent of body state.
- QA output in `out/`: `rest.png` (static pose), per-animation filmstrips + GIFs, montages.

## How the art problem was solved

- Source art `gen/v2_c.png` (Nano Banana Pro) → `art/coach_a.svg` (18 flat bezier paths via
  `@neplex/vectorizer`, color mode, full-canvas 600×633 coords).
- `c_p0` is one body-wide black outline path with 12 subpaths — rotating any limb would tear
  it, so it is dropped entirely. Every remaining fill shape gets its own
  `stroke: { color: "#191817", thickness: 6, round cap/join }`, so each body part carries
  its own outline that follows it when it moves.
- Shapes are bucketed by region: face/neck/headband/hair/eyes → head; tank top + stripe +
  shorts → torso; arm fills → arms; leg fills + shoes → legs. Eyes keep no stroke (tiny dots).

## Verified

- Rest pose renders the full character: palette is byte-identical to the source (all 14
  source colors present, incl. outline `#191817` at the same ~17% area ratio).
- All 7 animations render non-blank frames with the opaque pixel count in a tight band
  (no parts detaching, no blank frames, no tearing).
- Movement confirmed by frame diffs: idle (3.2% at the breath peak), sad (6.5%), wave, flex,
  cheer (root hop + arm pumps), nod (head dip), blink (eye scaleY drops to 0.06 and back).
- State machine verified via `playStateMachine`: every trigger enters its action state and
  returns to `idle` at the correct time (wave 1.5 s, flex 2 s, cheer 2.5 s, nod 1.33 s,
  sad 2.67 s); Face layer stays in `blink`.
- `computeMetrics` lint: **zero non-info findings** (no unreachable states, no robotic
  linear tracks — easing distribution 103 cubic / 24 linear / 4 hold; the linear ones are
  deliberate holds on the blink).
- Runtime loads: `inspect` reports 7 animations + 1 state machine on artboard `Coach`.

## Weaknesses / known limits (honest list)

1. **Limbs are single rigid parts** (no elbow/knee split). The arm shape is drawn with a bent
   elbow (fist up), so "wave" reads as a whole-arm rock rather than a forearm wave. A
   forearm split is the obvious next upgrade; the elbow bend has no clean overlap zone for a
   hidden seam, so it was deferred.
2. **Outlines are per-region strokes, not the source's original stroke work.** The AI art's
   single outline path was unusable for rigging; per-shape strokes are a close substitute
   (same color, same ratio) but the black geometry differs slightly from the source around
   the shoes/legs (source had detached-looking shoes with outline-only pixels above the
   green fill).
3. **No squash & stretch on the torso** — chest movement is rotation-based (breathing via
   torsoG rotation + root bob), which is what the canvas preview can verify. True belly
   deformation needs an image/vertex mesh, which the preview runtime does not render
   (image meshes render blank — a documented limitation of this rive-mcp-server's
   Canvas2D preview, verified against the upstream repo's own bones-demo).
4. **No hands/fingers detail** — source art has mitten fists; acceptable for the size.
5. **Blink is subtle at small render sizes** — eyes are ~20 px at full res; fine on
   real-sized UI.

## Suggested next steps

- Split forearms at the elbow (needs art re-cut with an overlap band, or a forearm drawn
  separately) for a proper wave.
- Add a gym-map artboard (path nodes, unit cards) reusing this character via nested
  artboards — Rive plays nicely with one .riv containing character + UI.
- Verify in a real app runtime (`@rive-app/canvas` or the Rive player) — the .riv is
  standard format, loadable anywhere.
