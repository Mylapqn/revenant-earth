import { status } from "./mod";
import * as PIXI from "pixi.js"
import { PixelDrawer } from "./pixelDrawer";
import { PixelateFilter } from "@pixi/filter-pixelate";
import { Terrain, terrainType } from "./terrain";
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
for (let x = 0; x < Terrain.width ; x++) {
  ty += trend;
  trend += Math.random() * 4 - 2
  trend = trend / 2;
  if (ty < 60 || ty > 80) trend = -trend;
  for (let y = 0; y < ty; y++) {
    Terrain.setPixel(x, y, terrainType.dirt);
  }
  if (x > 50 && x < 100)Terrain.setPixel(x, Math.floor(ty), terrainType.grass);
}

for (let x = 150; x < 200; x++) {
  for (let y = 100; y < 150; y++) {
    Terrain.setPixel(x, y, terrainType.sand);
  }
}

for (let x = 400; x < 450; x++) {
  for (let y = 100; y < 150; y++) {
    Terrain.setPixel(x, y, terrainType.sand);
  }
}

for (let x = 250; x < 350; x++) {
  for (let y = 100; y < 200; y++) {
    Terrain.setPixel(x, y, terrainType.water);
  }
}

Terrain.draw();
PixelDrawer.update();
console.log("done");

let tick = 0;
app.ticker.add((delta) => {
  if (key["ArrowLeft"]) Camera.position.x -= 1;
  if (key["ArrowRight"]) Camera.position.x += 1;
  if (key["ArrowUp"]) Camera.position.y += 1;
  if (key["ArrowDown"]) Camera.position.y -= 1;
  if (Camera.position.x < 0) Camera.position.x = 0
  if (Camera.position.x + Camera.width >= Terrain.width) Camera.position.x = Terrain.width - Camera.width - 1
  if (Camera.position.y < 0) Camera.position.y = 0
  if (Camera.position.y + Camera.height >= Terrain.height) Camera.position.y = Terrain.height - Camera.height - 1
  Terrain.update(tick);
  Terrain.draw();
  PixelDrawer.update();
  tick++;
});

const key: Record<string, boolean> = {};

window.addEventListener("keydown", (e) => { key[e.key] = true });
window.addEventListener("keyup", (e) => { key[e.key] = false });