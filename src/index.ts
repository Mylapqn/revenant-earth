import { status } from "./mod";
import * as PIXI from "pixi.js"
console.log(status);
console.log(PIXI);
let app = new PIXI.Application();
function resize(){
    app.renderer.resize(window.innerWidth, window.innerHeight);
}
resize();
window.addEventListener("resize",resize);
document.body.appendChild(app.view);

// Create the sprite and add it to the stage
let sprite = PIXI.Sprite.from('sample.png');
app.stage.addChild(sprite);

// Add a ticker callback to move the sprite back and forth
let elapsed = 0.0;
app.ticker.add((delta) => {
  elapsed += delta;
  sprite.x = 100.0 + Math.cos(elapsed/50.0) * 100.0;
});