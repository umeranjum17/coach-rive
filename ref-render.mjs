// Reference: all 18 imported paths, flat, no rig. The rigged rest pose must match this.
import { readFileSync, writeFileSync } from "node:fs";
const R = "/home/umer/.local/share/mise/installs/node/26.1.0/lib/node_modules/rive-mcp-server";
const [{ createRiv }, { importSvg }, { RiveHost }, { PAGE_SCRIPT }] = await Promise.all([
  import(R + "/dist/rivWriter.js"), import(R + "/dist/svgImport.js"),
  import(R + "/dist/riveHost.js"), import(R + "/dist/pageScript.js")]);
const imp = importSvg(readFileSync("art/coach_a.svg","utf8"), { idPrefix:"c_" });
const { bytes } = await createRiv({ artboard:{name:"Ref",width:600,height:700,backgroundColor:"#ffffff"},
  groups:[{id:"art",x:300,y:350}],
  shapes: imp.shapes.map(s=>({...s, parent:"art", x:s.x-imp.width/2, y:s.y-imp.height/2})) });
const host = new RiveHost(PAGE_SCRIPT);
const r = await host.renderFrames(Buffer.from(bytes), { startTime:0, frameCount:1, width:600, format:"png" });
writeFileSync("out/REFERENCE.png", Buffer.from(r.frames[0],"base64"));
await host.close(); console.log("wrote out/REFERENCE.png");
