import { status } from "./mod";
import * as PIXI from "pixi.js"
import { PixelDrawer } from "./pixelDrawer";
import { PixelateFilter } from "@pixi/filter-pixelate";
import { Terrain, TerrainPart, terrainType } from "./terrain";
import { Camera } from "./camera";
console.log(status);
let app = new PIXI.Application();
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
function resize() {
  app.renderer.resize(window.innerWidth, window.innerHeight);
  PixelDrawer.graphic.width = app.renderer.width;
  PixelDrawer.graphic.height = app.renderer.height;
}
PixelDrawer.init();
app.stage.addChild(PixelDrawer.graphic);
resize();
window.addEventListener("resize", resize);
document.body.appendChild(app.view);

Terrain.init();
let ty = 70;
let trend = 0;
for (let c = 0; c < Terrain.width; c++) {
  for (let x = 0; x < 32; x++) {
    for (let y = 0; y < ty; y++) {
      Terrain.setPixel(x + c * 32, y, terrainType.dirt);
    }
    ty += trend;
    //trend += Math.random() * 0.04 - 0.02
  }
  for (let y = 0; y < Terrain.height; y++) {
    Terrain.join(c * 32, y);
  }
}

Terrain.parts.forEach(t => t.show());
PixelDrawer.update();
console.log("done");

app.ticker.add((delta) => {
  Camera.position.x += 1;
  Terrain.parts.forEach(t => t.show());
  PixelDrawer.update();
});