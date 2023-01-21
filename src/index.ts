import { status } from "./mod";
import * as PIXI from "pixi.js"
import { PixelDrawer } from "./pixelLayer";
console.log(status);
let app = new PIXI.Application();
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



// Add a ticker callback to move the sprite back and forth
let elapsed = 0.0;
let s = 0;
app.ticker.add((delta) => {
  s += 0.001;
  for (let i = 0; i < 512 * 256; i++) {
    let x = i % 512;
    let y = Math.floor(i / 512);
    PixelDrawer.setPixel(x, y, Math.sin(x/100+s/10000)*256*256+s+y );
  }
  PixelDrawer.update();
  elapsed += delta;
});