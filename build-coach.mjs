// Coach rig build — single re-runnable script.
// Reads art/coach_a.svg (importSvg), drops the body-wide outline path c_p0,
// gives every fill its own stroke, buckets shapes into pivot groups, animates,
// wires a 2-layer state machine (Body actions + Face blink), and renders QA output.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const R = "/home/umer/.local/share/mise/installs/node/26.1.0/lib/node_modules/rive-mcp-server";
const [{ createRiv }, { expandHlapi }, { importSvg }, { RiveHost }, { PAGE_SCRIPT },
       { computeMetrics }, { encodeGif }] = await Promise.all([
  import(R + "/dist/rivWriter.js"), import(R + "/dist/hlapi.js"), import(R + "/dist/svgImport.js"),
  import(R + "/dist/riveHost.js"), import(R + "/dist/pageScript.js"),
  import(R + "/dist/critique.js"), import(R + "/dist/gif.js"),
]);

const OUTLINE = "#191817";
const STROKE = 6;
const FPS = 60;

// ---------- art ----------
const imp = importSvg(readFileSync("art/coach_a.svg", "utf8"), { idPrefix: "c_" });
const byId = Object.fromEntries(imp.shapes.map((s) => [s.id, s]));
if (imp.warnings.length) console.log("svg warnings:", imp.warnings);
if (!byId["c_p0"]) throw new Error("expected body outline c_p0");
delete byId["c_p0"]; // drop the single body-wide outline; every shape gets its own stroke

// ---------- parts: id -> { pivot, member ids, z } ----------
const PARTS = {
  headG:  { pivot: [300, 152], z: 40, ids: ["c_p5", "c_p9", "c_p13", "c_p14", "c_p15", "c_p16", "c_p17"] },
  torsoG: { pivot: [300, 425], z: 30, ids: ["c_p1", "c_p4", "c_p6", "c_p10"] },
  armLG:  { pivot: [238, 190], z: 20, ids: ["c_p2"] },
  armRG:  { pivot: [362, 190], z: 20, ids: ["c_p3"] },
  legLG:  { pivot: [262, 428], z: 10, ids: ["c_p8", "c_p11"] },
  legRG:  { pivot: [338, 428], z: 10, ids: ["c_p7", "c_p12"] },
};
const NO_STROKE = new Set(["c_p16", "c_p17"]); // eyes: solid dots, no outline
const missing = Object.values(PARTS).flatMap((p) => p.ids.filter((i) => !byId[i]));
if (missing.length) throw new Error("missing shapes: " + missing);

const groups = [{ id: "root", x: 300, y: 425 }];
const shapes = [];
for (const [gid, part] of Object.entries(PARTS)) {
  const [px, py] = part.pivot;
  // group coords are RELATIVE to the parent (root at 300,425)
  groups.push({ id: gid, x: px - 300, y: py - 425, parent: "root" });
  for (const sid of part.ids) {
    const s = byId[sid];
    shapes.push({
      ...s,
      id: sid,
      parent: gid,
      x: s.x - px,
      y: s.y - py,
      z: part.z,
      ...(NO_STROKE.has(sid) ? {} : { stroke: { color: OUTLINE, thickness: STROKE, cap: "round", join: "round" } }),
    });
  }
}

// ---------- animation helpers ----------
const kf = (frame, value, easing = "ease-in-out") => ({ frame, value, easing });
const rot = (target, kfs) => ({ target, property: "rotation", keyframes: kfs });
const mvY = (target, kfs) => ({ target, property: "y", keyframes: kfs });
const scY = (target, kfs) => ({ target, property: "scaleY", keyframes: kfs });

const D = 480; // idle/blink loop: 8s @60

// ---------- animations ----------
const animations = [
  {
    name: "idle", fps: FPS, duration: D, loop: "loop",
    tracks: [
      // breathing: two breaths per loop, 4s apart; nothing peaks together
      mvY("root", [kf(0, 425), kf(120, 422, "ease-in-out"), kf(240, 425), kf(360, 422, "ease-in-out"), kf(D, 425)]),
      rot("torsoG", [kf(0, 0), kf(150, 1.4, "ease-in-out"), kf(300, -0.6, "ease-in-out"), kf(D, 0)]),
      rot("headG", [kf(0, 0), kf(120, 2.6, "ease-in-out"), kf(300, -2.2, "ease-in-out"), kf(D, 0)]),
      rot("armLG", [kf(0, 0), kf(180, 3.4, "ease-in-out"), kf(D, 0)]),
      rot("armRG", [kf(0, 0), kf(210, -3.0, "ease-in-out"), kf(D, 0)]),
    ],
  },
  {
    name: "blink", fps: FPS, duration: D, loop: "loop",
    tracks: ["c_p16", "c_p17"].flatMap((eye) => [
      scY(eye, [kf(0, 1), kf(120, 1, "ease-in"), kf(124, 0.06, "ease-in"), kf(125, 0.06, "hold"), kf(132, 1, "ease-out"),
                 kf(360, 1, "ease-in"), kf(364, 0.06, "ease-in"), kf(365, 0.06, "hold"), kf(372, 1, "ease-out"), kf(D, 1)]),
    ]),
  },
  {
    name: "wave", fps: FPS, duration: 90, loop: "oneShot",
    tracks: [
      rot("armRG", [kf(0, 0), kf(8, -8, "ease-out"), kf(14, 18, "ease-out"), kf(24, -14, "ease-in-out"),
                    kf(34, 13, "ease-in-out"), kf(44, -9, "ease-in-out"), kf(54, 6, "ease-in-out"), kf(70, 0, "ease-out")]),
      rot("headG", [kf(0, 0), kf(16, 4, "ease-in-out"), kf(50, 3, "ease-in-out"), kf(70, 0, "ease-out")]),
    ],
  },
  {
    name: "flex", fps: FPS, duration: 120, loop: "oneShot",
    tracks: [
      rot("armLG", [kf(0, 0), kf(6, -4, "ease-out"), kf(18, -26, "elastic-out"), kf(34, -22, "ease-in-out"),
                    kf(40, -25, "ease-in-out"), kf(46, -22, "ease-in-out"), kf(80, -22, "ease-in-out"), kf(110, 0, "ease-out")]),
      rot("armRG", [kf(0, 0), kf(6, 4, "ease-out"), kf(18, 26, "elastic-out"), kf(34, 22, "ease-in-out"),
                    kf(40, 25, "ease-in-out"), kf(46, 22, "ease-in-out"), kf(80, 22, "ease-in-out"), kf(110, 0, "ease-out")]),
      rot("torsoG", [kf(0, 0), kf(18, -2.2, "ease-out"), kf(46, -1.6, "ease-in-out"), kf(110, 0, "ease-out")]),
      rot("headG", [kf(0, 0), kf(18, 3, "ease-out"), kf(46, 2, "ease-in-out"), kf(110, 0, "ease-out")]),
    ],
  },
  {
    name: "cheer", fps: FPS, duration: 150, loop: "oneShot",
    tracks: [
      rot("armLG", [kf(0, 0), kf(15, -30, "ease-out"), kf(30, -8, "ease-in-out"), kf(45, -30, "ease-out"),
                    kf(60, -8, "ease-in-out"), kf(75, -30, "ease-out"), kf(100, 0, "ease-out")]),
      rot("armRG", [kf(0, 0), kf(15, 30, "ease-out"), kf(30, 8, "ease-in-out"), kf(45, 30, "ease-out"),
                    kf(60, 8, "ease-in-out"), kf(75, 30, "ease-out"), kf(100, 0, "ease-out")]),
      mvY("root", [kf(0, 425), kf(18, 416, "ease-out"), kf(30, 423, "ease-in-out"), kf(48, 416, "ease-out"),
                   kf(60, 423, "ease-in-out"), kf(78, 416, "ease-out"), kf(100, 425, "ease-out")]),
      rot("headG", [kf(0, 0), kf(18, 5, "ease-out"), kf(40, 3, "ease-in-out"), kf(60, 4, "ease-in-out"), kf(100, 0, "ease-out")]),
    ],
  },
  {
    name: "nod", fps: FPS, duration: 80, loop: "oneShot",
    tracks: [
      mvY("headG", [kf(0, 0), kf(12, 9, "ease-out"), kf(30, 2, "ease-in-out"), kf(44, 9, "ease-out"), kf(70, 0, "ease-out")]),
      rot("headG", [kf(0, 0), kf(12, -6, "ease-out"), kf(30, 0, "ease-in-out"), kf(44, -5, "ease-out"), kf(70, 0, "ease-out")]),
    ],
  },
  {
    name: "sad", fps: FPS, duration: 160, loop: "oneShot",
    tracks: [
      mvY("headG", [kf(0, 0), kf(40, 8, "ease-out"), kf(120, 8, "ease-in-out"), kf(150, 0, "ease-out")]),
      rot("headG", [kf(0, 0), kf(40, -8, "ease-out"), kf(120, -8, "ease-in-out"), kf(150, 0, "ease-out")]),
      rot("armLG", [kf(0, 0), kf(40, 13, "ease-out"), kf(120, 13, "ease-in-out"), kf(150, 0, "ease-out")]),
      rot("armRG", [kf(0, 0), kf(40, -13, "ease-out"), kf(120, -13, "ease-in-out"), kf(150, 0, "ease-out")]),
      mvY("root", [kf(0, 425), kf(40, 429, "ease-out"), kf(120, 429, "ease-in-out"), kf(150, 425, "ease-out")]),
    ],
  },
];

// ---------- state machine ----------
const ACTIONS = ["wave", "flex", "cheer", "nod", "sad"];
const DUR_MS = Object.fromEntries(animations.map((a) => [a.name, Math.round((a.duration / a.fps) * 1000)]));
const sm = {
  name: "Coach",
  inputs: ACTIONS.map((a) => ({ name: `${a}Trigger`, type: "trigger" })),
  layers: [
    {
      name: "Body",
      states: [
        { name: "idle", animation: "idle" },
        ...ACTIONS.map((a) => ({ name: a, animation: a })),
      ],
      transitions: [
        { from: "entry", to: "idle" },
        ...ACTIONS.map((a) => ({ from: "any", to: a, durationMs: 150, condition: { input: `${a}Trigger` } })),
        ...ACTIONS.map((a) => ({ from: a, to: "idle", durationMs: 200, exitTimeMs: DUR_MS[a] })),
      ],
    },
    {
      name: "Face",
      states: [{ name: "blink", animation: "blink" }],
      transitions: [{ from: "entry", to: "blink" }],
    },
  ],
};

// ---------- build ----------
const scene = {
  artboard: { name: "Coach", width: 600, height: 700, backgroundColor: "#ffffff" },
  groups, shapes, animations,
  stateMachine: sm,
};
expandHlapi(scene);
const { bytes, warnings } = await createRiv(scene);
if (warnings?.length) console.log("createRiv warnings:", warnings);
writeFileSync("coach.riv", Buffer.from(bytes));
console.log("coach.riv bytes:", bytes.length);

// ---------- QA ----------
mkdirSync("out", { recursive: true });
const host = new RiveHost(PAGE_SCRIPT);
const info = await host.inspect(Buffer.from(bytes));
console.log("runtime anims:", JSON.stringify(info.artboards[0].animations.map((a) => a.name)));
console.log("runtime SMs:", JSON.stringify(info.artboards[0].stateMachines.map((s) => s.name)));

// static frame: does the rest pose match the source art?
const st = await host.renderFrames(Buffer.from(bytes), { animation: "idle", startTime: 0, frameCount: 1, width: 600, format: "png" });
writeFileSync("out/rest.png", Buffer.from(st.frames[0], "base64"));
console.log("rest frame rendered", st.width, "x", st.height);

// lint
const m = computeMetrics(new Uint8Array(bytes));
console.log("metrics:", JSON.stringify({ vector: m.vector, motion: m.motion }));
const nonInfo = m.lint.filter((f) => f.severity !== "info");
console.log("lint non-info:", JSON.stringify(nonInfo));

// filmstrip + gif per animation
async function qa(name, opts, n, fps) {
  const png = await host.renderFrames(Buffer.from(bytes), { ...opts, frameCount: n, fps, width: 420, format: "png" });
  const rgba = await host.renderFrames(Buffer.from(bytes), { ...opts, frameCount: n, fps, width: 420, format: "rgba" });
  png.frames.forEach((f, i) => writeFileSync(`out/${name}_${String(i).padStart(2, "0")}.png`, Buffer.from(f, "base64")));
  const gif = encodeGif(rgba.frames.map((f) => Buffer.from(f, "base64")), 420, Math.round(420 * rgba.height / rgba.width), fps);
  writeFileSync(`out/${name}.gif`, gif);
  console.log(`${name}: filmstrip ${png.frames.length} frames, gif ${gif.length} bytes`);
}

await qa("idle", { animation: "idle" }, 48, 12);
await qa("blink", { animation: "blink" }, 48, 12);
for (const a of ACTIONS) {
  const dur = DUR_MS[a] / 1000;
  const n = Math.max(12, Math.round(dur * 12));
  await qa(a, { animation: a }, n, 12);
}

// SM transition check: fire each trigger, confirm it enters the action state and returns to idle
const smCheck = await host.playStateMachine(Buffer.from(bytes), {
  stateMachine: "Coach", width: 240,
  steps: [
    { advance: 0.1 },
    ...ACTIONS.flatMap((a) => [
      { input: `${a}Trigger`, value: true, advance: 0.05, capture: true },
      { advance: 0.25, capture: true },
      { advance: Math.max(0.01, DUR_MS[a] / 1000), capture: true },
      { advance: 0.1, capture: true },
    ]),
  ],
});
for (const s of smCheck.report) console.log("SM step:", JSON.stringify({ step: s.step, applied: s.applied, advanced: s.advancedSeconds, states: s.statesChanged }));
console.log("SM states seen:", JSON.stringify([...new Set(smCheck.report.flatMap((s) => s.statesChanged ?? []))]));

console.log("QA frames written");
await host.close();
console.log("DONE");
