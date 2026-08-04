// Build per-part silhouette pieces by raster-masking + vectorizing the silhouette render.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const R = "/home/umer/.local/share/mise/installs/node/26.1.0/lib/node_modules/rive-mcp-server";
const [{ createRiv }, { importSvg }, { RiveHost }, { PAGE_SCRIPT }] = await Promise.all([
  import(R + "/dist/rivWriter.js"), import(R + "/dist/svgImport.js"),
  import(R + "/dist/riveHost.js"), import(R + "/dist/pageScript.js")]);
const { vectorize, ColorMode, Hierarchical, PathSimplifyMode } = await import("@neplex/vectorizer");
const imp = importSvg(readFileSync("art/coach_a.svg", "utf8"), { idPrefix: "c_" });
const host = new RiveHost(PAGE_SCRIPT);
const p0 = imp.shapes.find(s => s.id === "c_p0");

// 1. render c_p0 alone, transparent bg
const { bytes } = await createRiv({ artboard: { name: "T", width: 600, height: 700, backgroundColor: "#00000000" }, shapes: [{ ...p0, id: "sil" }] });
const r = await host.renderFrames(Buffer.from(bytes), { startTime: 0, frameCount: 1, width: 600, format: "png" });
writeFileSync("out/sil.png", Buffer.from(r.frames[0], "base64"));
await host.close();
console.log("sil.png written");

// 2. per-part regions (artboard px, same as build-coach.mjs)
const PARTS = {
  headG:  [200, 0, 400, 262],
  torsoG: [178, 140, 422, 492],
  armLG:  [0, 140, 217, 402],   // right edge at the shoulder socket: excludes the torso outline (x~196-200)
  armRG:  [383, 140, 600, 402], // left edge mirrors
  legLG:  [98, 400, 322, 652],
  legRG:  [278, 400, 502, 652],
};
mkdirSync("parts", { recursive: true });
const { execSync } = await import("node:child_process");
for (const [gid, [x0,y0,x1,y1]] of Object.entries(PARTS)) {
  const w = x1-x0, h = y1-y0;
  // crop region on white, then make white transparent so only black silhouette survives vectorization
  execSync(`magick out/sil.png -crop ${w}x${h}+${x0}+${y0} +repage -background white -alpha remove -alpha off -fuzz 25% -transparent white parts/${gid}.png`);
  // vectorize
  const png = readFileSync(`parts/${gid}.png`);
  const svg = await vectorize(png, {
    colorMode: ColorMode.Color, colorPrecision: 6, filterSpeckle: 24, spliceThreshold: 45,
    cornerThreshold: 60, layerDifference: 12, lengthThreshold: 4, maxIterations: 10,
    mode: PathSimplifyMode.Spline, hierarchical: Hierarchical.Stacked,
  });
  writeFileSync(`parts/${gid}.svg`, svg);
  const paths = (svg.match(/<path/g)||[]).length;
  console.log(`${gid}: crop ${w}x${h} at +${x0}+${y0}, svg ${svg.length}b, ${paths} paths`);
}
