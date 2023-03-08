import { status } from "./mod";
import * as PIXI from "pixi.js"
import { PixelDrawer } from "./pixelDrawer";
import { PixelateFilter } from "@pixi/filter-pixelate";
import { Terrain, terrainType } from "./terrain";
import { Camera } from "./camera";
import { Entity } from "./entity";
import { Container, Rectangle, SCALE_MODES, Sprite } from "pixi.js";
import { Vector } from "./vector";
import { Seed } from "./entities/plants/tree/seed";
import { Robot } from "./entities/enemy/robot/robot";
export const preferences = { showUpdates: false, selectedTerrainType: terrainType.dirt, penSize: 1 }
console.log(status);
let app = new PIXI.Application();
PIXI.settings.SCALE_MODE = SCALE_MODES.NEAREST;

function resize() {
    Camera.aspectRatio = window.innerWidth / window.innerHeight;
    //Camera.width = Camera.height * Camera.aspectRatio;
    //PixelDrawer.resize();
    app.renderer.resize(Camera.height * Camera.aspectRatio, Camera.height);
}

PixelDrawer.init();
const bg = new PIXI.Graphics();
for (let y = 0; y < 256; y++) {
    const c = Math.floor(y / 2 + 128)
    bg.lineStyle(1, c * 256 * 256 + c * 256 + c, 1);
    bg.moveTo(0, 255 - y);
    bg.lineTo(255, 255 - y);
}

const pixelContainer = new Container();

bg.tint = 0xccddff;
const bgImg = PIXI.Sprite.from("https://media.discordapp.net/attachments/767355244111331338/1069710151117963264/Artboard_1.png");
const debugText = new PIXI.Text();
debugText.text = "text";
debugText.tint = 0x999999;
debugText.style.fontFamily = "Consolas";
debugText.style.fontSize = "12px";
app.stage.addChild(bg);
app.stage.addChild(bgImg);
pixelContainer.addChild(PixelDrawer.graphic);
Entity.graphic = new Container();
pixelContainer.addChild(Entity.graphic);
app.stage.addChild(pixelContainer);
app.stage.addChild(debugText);
resize();
window.addEventListener("resize", resize);
document.body.appendChild(app.view);


Terrain.init();
let ty = 470;
let trend = 0;
for (let x = 0; x < Terrain.width; x++) {
    ty += trend;
    trend += Math.random() * 4 - 2;
    trend = trend / 2;
    if (ty < 460 || ty > 480) trend = -trend;
    for (let y = 0; y < ty; y++) {
        if (y + 50 > ty) {

            if (Math.random() * ty > y) {
                Terrain.setPixel(x, y, terrainType.stone);
            } else {
                if (ty - 20 > y) {
                    Terrain.setPixel(x, y, terrainType.wetDirt);
                } else{
                    Terrain.setPixel(x, y, terrainType.dirt);
                }
            }

        } else {
            Terrain.setPixel(x, y, terrainType.stone);
        }
    }
    if (x > 450 && x < 500) Terrain.setPixel(x, Math.floor(ty), terrainType.grass);
    if (x > 450 && x < 1000 && x % 100 == 0) new Seed(new Vector(x, ty));
}

for (let x = 150; x < 200; x++) {
    for (let y = 500; y < 550; y++) {
        Terrain.setPixel(x, y, terrainType.sand);
    }
}

for (let x = 400; x < 450; x++) {
    for (let y = 500; y < 550; y++) {
        Terrain.setPixel(x, y, terrainType.sand);
    }
}

for (let x = 250; x < 350; x++) {
    for (let y = 450; y < 550; y++) {
        Terrain.setPixel(x, y, terrainType.water);
    }
}

//new Robot(new Vector(900, 900), undefined, 0);

Camera.position.y = 500;

Terrain.draw();
PixelDrawer.update();

let printText = "";
export function debugPrint(s: string) { printText += s + "\n" };
export let tick = 0;

const camspeed = 3;
app.ticker.add((delta) => {
    if (tick % 30 == 0) {
        debugText.text = printText;
    }
    printText = ""
    if (key["ArrowLeft"]) Camera.position.x -= camspeed;
    if (key["ArrowRight"]) Camera.position.x += camspeed;
    if (key["ArrowUp"]) Camera.position.y += camspeed;
    if (key["ArrowDown"]) Camera.position.y -= camspeed;

    const [wx, wy] = screenToWorld(mouse).xy();
    debugPrint(screenToWorld(mouse).toString());
    if (mouse.pressed == 1) {
        for (let x = 0; x < preferences.penSize; x++) {
            for (let y = 0; y < preferences.penSize; y++) {
                Terrain.setAndUpdatePixel(Math.floor(wx + x - preferences.penSize / 2), Math.floor(wy + y - preferences.penSize / 2), preferences.selectedTerrainType);
            }
        }
    } else if (mouse.pressed == 2) {
        for (let x = 0; x < preferences.penSize; x++) {
            for (let y = 0; y < preferences.penSize; y++) {
                Terrain.setAndUpdatePixel(Math.floor(wx + x - preferences.penSize / 2), Math.floor(wy + y - preferences.penSize / 2), terrainType.void);
            }
        }
    }

    if (key["1"]) preferences.selectedTerrainType = terrainType.dirt;
    if (key["2"]) preferences.selectedTerrainType = terrainType.sand;
    if (key["3"]) preferences.selectedTerrainType = terrainType.water;
    if (key["4"]) preferences.selectedTerrainType = terrainType.grass;

    if (key["+"]) {
        key["+"] = false;
        preferences.penSize++;
        if (preferences.penSize > 50) preferences.penSize = 50;
    }

    if (key["-"]) {
        key["-"] = false;
        preferences.penSize--;
        if (preferences.penSize < 1) preferences.penSize = 1;
    }

    if (key["e"]) {
        key["e"] = false;
        preferences.showUpdates = !preferences.showUpdates;
    }
    if (Camera.position.x < 0) Camera.position.x = 0
    if (Camera.position.x + Camera.width >= Terrain.width) Camera.position.x = Terrain.width - Camera.width - 1
    if (Camera.position.y < 0) Camera.position.y = 0
    if (Camera.position.y + Camera.height >= Terrain.height) Camera.position.y = Terrain.height - Camera.height - 1
    debugPrint(Camera.position.toString());
    Terrain.update(tick);
    Terrain.draw();
    PixelDrawer.update();
    Entity.update();
    tick++;
});

const key: Record<string, boolean> = {};
const mouse = { x: 0, y: 0, pressed: 0 };

window.addEventListener("keydown", (e) => { key[e.key] = true });
window.addEventListener("keyup", (e) => { key[e.key] = false });
window.addEventListener("mousedown", (e) => { mouse.pressed = e.buttons; e.preventDefault() });
window.addEventListener("mouseup", (e) => { mouse.pressed = e.buttons });
window.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY });


function screenToWorld(vector: { x: number, y: number }) {
    return new Vector(Camera.position.x + (vector.x * (Camera.height / window.innerHeight)),
        Camera.position.y + Camera.height - (vector.y * (Camera.height / window.innerHeight)));
}