import { mulberry32, status } from "./mod";
import * as PIXI from "pixi.js"
import { PixelDrawer } from "./pixelDrawer";
import { Terrain, terrainType } from "./terrain";
import { Camera } from "./camera";
import { Entity } from "./entity";
import { Container, Rectangle, SCALE_MODES, Sprite, Ticker } from "pixi.js";
import { Vector } from "./vector";
import { Seed } from "./entities/plants/tree/seed";
import { Robot } from "./entities/enemy/robot/robot";
import { Player } from "./entities/player/player";
import { ParallaxDrawer } from "./parallax";
import { coniferousSettings, defaultTreeSettings } from "./entities/plants/tree/treeSettings";
import { HighlightFilter } from "./shaders/outline/CustomFilter";
import { Rock } from "./entities/passive/rock";
import { random, randomBool, randomInt } from "./utils";
let seed = parseInt(window.location.toString().split('?')[1]);
if (!seed) seed = Math.floor(Math.random() * 1000);
Math.random = mulberry32(seed);
console.log("seed:", seed);


export const preferences = { showUpdates: false, selectedTerrainType: terrainType.dirt00, penSize: 1, showDebug: false }
console.log(status);
let app = new PIXI.Application<HTMLCanvasElement>();
//PIXI.settings.SCALE_MODE = SCALE_MODES.NEAREST;
//PIXI.settings.ROUND_PIXELS = true;
PIXI.BaseTexture.defaultOptions.scaleMode = SCALE_MODES.NEAREST;

function resize() {
    console.log(Camera.width, Camera.height);
    
    Camera.aspectRatio = window.innerWidth / window.innerHeight;
    Camera.width = Math.ceil(Camera.height * Camera.aspectRatio);
    PixelDrawer.resize();
    Entity.graphic.filterArea = new Rectangle(0, 0, Camera.width, Camera.height);
    PixelDrawer.graphic.filterArea = new Rectangle(0, 0, Camera.width, Camera.height);
    app.renderer.resize(Camera.width, Camera.height);
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
debugText.style.fontFamily = "monogram";
debugText.style.fontSize = "16px";
debugText.style.lineHeight = 10;
debugText.style.letterSpacing = 0;
debugText.scale.set(1);
debugText.position.set(4, 4);
debugText.visible = preferences.showDebug;
app.stage.addChild(bg);
app.stage.addChild(bgImg);
pixelContainer.addChild(ParallaxDrawer.container);
pixelContainer.addChild(PixelDrawer.graphic);
Entity.graphic = new Container();
pixelContainer.addChild(Entity.graphic);
ParallaxDrawer.addLayer("BG/Test/1.png", .1);
ParallaxDrawer.addLayer("BG/Test/2.png", .2);
ParallaxDrawer.addLayer("BG/Test/3.png", .3);
ParallaxDrawer.addLayer("BG/Test/4.png", .45);
ParallaxDrawer.addLayer("BG/Test/5.png", .65);
app.stage.addChild(pixelContainer);
PixelDrawer.graphic.filters = [new HighlightFilter(3, 0xFF9955, -.7, .3, 0.2, 1)];
PixelDrawer.graphic.filterArea = new Rectangle(0, 0, Camera.width, Camera.height);
Entity.graphic.filters = [new HighlightFilter(2, 0xFF9955, -.7, .3, 0.1, .5)];
Entity.graphic.filterArea = new Rectangle(0, 0, Camera.width, Camera.height);
app.stage.addChild(debugText);
resize();
window.addEventListener("resize", resize);
document.body.appendChild(app.view);
//app.ticker.speed=.1;


Terrain.init();
let ty = 470;
let trend = 0;
let nextRock = randomInt(50, 150)
for (let x = 0; x < Terrain.width; x++) {
    ty += trend;
    trend += Math.random() * 2 - 1;
    trend = trend / 1.2;
    if (ty < 360 || ty > 580) trend = -trend;
    for (let y = 0; y < ty; y++) {
        if (y + 50 > ty) {

            if (Math.random() * ty > y) {
                Terrain.setPixel(x, y, terrainType.stone);
            } else {
                if (ty - 20 > y) {
                    Terrain.setAndUpdatePixel(x, y, terrainType.dirt70);
                } else {
                    Terrain.setAndUpdatePixel(x, y, terrainType.dirt03);
                }
            }

        } else {
            Terrain.setPixel(x, y, terrainType.stone);
        }
    }
    //if (x > 450 && x < 500) Terrain.setPixel(x, Math.floor(ty), terrainType.grass);
    //if (x > 450 && x < 1000 && x % 100 == 0) new Seed(new Vector(x, ty));
    //if (x == 500) new Seed(new Vector(x, ty));
    //if (x == 700) new Seed(new Vector(x, ty), null, 0, coniferousSettings);
    if (x == nextRock) {
        let size = random(3, 8);
        nextRock += randomInt(1, 10) * Math.round(size);
        new Rock(new Vector(x, ty), null, size, random(.3, 1.2), random(-2, 2));
    }
}

export const player = new Player(new Vector(400, 500));

for (let x = 750; x < 800; x++) {
    for (let y = 500; y < 540; y++) {
        if(randomBool(0.9))
        Terrain.setPixel(x, y, terrainType.sand);
        else
        Terrain.setPixel(x, y, terrainType.sand2);
    }
}

for (let x = 900; x < 950; x++) {
    for (let y = 500; y < 540; y++) {
        if(randomBool(0.9))
        Terrain.setPixel(x, y, terrainType.sand);
        else
        Terrain.setPixel(x, y, terrainType.sand2);
    }
}
for (let x = 800; x < 900; x++) {
    for (let y = 495; y < 500; y++) {
        if(randomBool(0.9))
        Terrain.setPixel(x, y, terrainType.sand);
        else
        Terrain.setPixel(x, y, terrainType.sand2);
    }
}

for (let x = 800; x < 850; x++) {
    for (let y = 500; y < 550; y++) {
        Terrain.setPixel(x, y, terrainType.water);
    }
}

//new Robot(new Vector(900, 900), undefined, 0);

Camera.position.y = 400;
Camera.position.x = 400;

Terrain.draw();
PixelDrawer.update();

let printText = "";
export function debugPrint(s: string) { printText += s + "\n" };

const camspeed = 3;
let seedCooldown = 0;
app.ticker.add((delta) => {
    const dt = Math.min(.1, delta / app.ticker.FPS);

    if (terrainTick % 30 == 0) {
        debugText.text = printText;
    }
    printText = ""
    if (key["arrowleft"]) Camera.position.x -= camspeed;
    if (key["arrowright"]) Camera.position.x += camspeed;
    if (key["arrowup"]) Camera.position.y += camspeed;
    if (key["arrowdown"]) Camera.position.y -= camspeed;
    player.input = new Vector();
    if (key["a"]) player.input.x -= 1;
    if (key["d"]) player.input.x += 1;
    if (key["w"]) player.input.y += 1;
    if (key["s"]) player.input.y -= 1;
    if (key["shift"]) player.run = true;
    else player.run = false;

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

    if (key["1"]) preferences.selectedTerrainType = terrainType.dirt00;
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
    if (key["r"]) {
        key["r"] = false;
        preferences.showDebug = !preferences.showDebug;
        debugText.visible = preferences.showDebug;
    }
    seedCooldown -= dt;
    if (key["f"] && seedCooldown <= 0) {
        seedCooldown = 1;
        new Seed(player.position.result(), null, 0, randomBool() ? coniferousSettings : defaultTreeSettings);
        console.log("ds");

    }
    if (Camera.position.x < 0) Camera.position.x = 0
    if (Camera.position.x + Camera.width >= Terrain.width) Camera.position.x = Terrain.width - Camera.width - 1
    if (Camera.position.y < 0) Camera.position.y = 0
    if (Camera.position.y + Camera.height >= Terrain.height) Camera.position.y = Terrain.height - Camera.height - 1
    debugPrint(Camera.position.toString());
    Terrain.draw();
    PixelDrawer.update();
    ParallaxDrawer.update();
    Entity.update(dt);
});

export let terrainTick = 0;
let terrainTicker = new Ticker();
terrainTicker.speed = 7;
terrainTicker.add((dt) => {
    Terrain.update(terrainTick);
    terrainTick++;
});

terrainTicker.start();

const key: Record<string, boolean> = {};
const mouse = { x: 0, y: 0, pressed: 0 };

window.addEventListener("keydown", (e) => { key[e.key.toLowerCase()] = true });
window.addEventListener("keyup", (e) => { key[e.key.toLowerCase()] = false });
window.addEventListener("mousedown", (e) => { mouse.pressed = e.buttons; e.preventDefault() });
window.addEventListener("mouseup", (e) => { mouse.pressed = e.buttons });
window.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY });


function screenToWorld(vector: { x: number, y: number }) {
    return new Vector(Camera.position.x + (vector.x * (Camera.height / window.innerHeight)),
        Camera.position.y + Camera.height - (vector.y * (Camera.height / window.innerHeight)));
}