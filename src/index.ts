import { mulberry32, status } from "./mod";
import * as PIXI from "pixi.js"
import { PixelDrawer } from "./pixelDrawer";
import { Terrain, terrainType } from "./terrain";
import { Camera } from "./camera";
import { Entity } from "./entity";
import { AnimatedSprite, Container, Rectangle, SCALE_MODES, Sprite, Texture, Ticker } from "pixi.js";
import { Vector } from "./vector";
import { Seed } from "./entities/plants/tree/seed";
import { Robot } from "./entities/enemy/robot/robot";
import { Player } from "./entities/player/player";
import { Backdrop, BackdropProp, ParallaxDrawer } from "./parallax";
import { coniferousSettings, defaultTreeSettings } from "./entities/plants/tree/treeSettings";
import { HighlightFilter } from "./shaders/outline/highlightFilter";
import { Rock } from "./entities/passive/rock";
import { noise, random, randomBool, randomInt } from "./utils";
import { Atmosphere } from "./atmosphere";
import { AtmosphereFilter } from "./shaders/atmosphere/atmosphereFilter";
import { Cloud } from "./entities/passive/cloud";
import { LightingFilter } from "./shaders/lighting/lightingFilter";
import { FilmicFilter } from "./shaders/filmic/filmicFilter";
import { TerrainGenerator } from "./biome";
import { SkyFilter } from "./shaders/atmosphere/skyFilter";
import { GUI, GuiLabel } from "./gui/gui";
let seed = parseInt(window.location.toString().split('?')[1]);
if (!seed) seed = Math.floor(Math.random() * 1000);
Math.random = mulberry32(seed);
console.log("seed:", seed);

export enum DebugMode {
    off,
    updates,
    water
}
export const preferences = { debugMode: DebugMode.off, selectedTerrainType: terrainType.water3, penSize: 4, showDebug: false }
console.log(status);
let app = new PIXI.Application<HTMLCanvasElement>();
//PIXI.settings.SCALE_MODE = SCALE_MODES.NEAREST;
//PIXI.settings.ROUND_PIXELS = true;
PIXI.BaseTexture.defaultOptions.scaleMode = SCALE_MODES.NEAREST;
function resize() {
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
bg.scale.set(10, 1);
bg.filters = [new SkyFilter()];
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
pixelContainer.addChild(ParallaxDrawer.container);
pixelContainer.addChild(PixelDrawer.graphic);
Entity.graphic = new Container();
pixelContainer.addChild(Entity.graphic);


//ParallaxDrawer.addLayer("BG/Test/1.png", 0);
//ParallaxDrawer.addLayer("BG/Test/2.png", .1);
//ParallaxDrawer.addLayer("BG/Test/3.png", .25);
//ParallaxDrawer.addLayer("BG/Test/4.png", .42);
const backdrop0 = new Backdrop(.65);
const backdrop1 = new Backdrop(.42);
const backdrop2 = new Backdrop(.25);
const backdrop3 = new Backdrop(.1);
app.stage.addChild(pixelContainer);
const lightingFilter = new LightingFilter();
PixelDrawer.graphic.filters = [lightingFilter, new HighlightFilter(4, 0xFF9955, .25), new AtmosphereFilter(.85)];
PixelDrawer.graphic.filterArea = new Rectangle(0, 0, Camera.width, Camera.height);
Entity.graphic.filters = [lightingFilter, new HighlightFilter(1, 0xFF9955, .2), new AtmosphereFilter(.85)];
Entity.graphic.filterArea = new Rectangle(0, 0, Camera.width, Camera.height);
console.log(app.renderer);

app.stage.addChild(debugText);
resize();
window.addEventListener("resize", resize);
document.body.appendChild(app.view);
//app.ticker.speed=.1;


Terrain.init();

const generator = new TerrainGenerator();
let nextRock = randomInt(1, 10);
const flatland = { stoneTop: 0, stoneBottom: 0.5, bottom: 360, top: 480, moisture: 3, minerals: 3, dirtDepth: 50, mineralDepthPenalty: 1, curveModifier: 0.5, curveLimiter: 0.1 };
const mountains = { stoneTop: 1, stoneBottom: 1, bottom: 550, top: 660, moisture: 3, minerals: 1, dirtDepth: 10, mineralDepthPenalty: 0, curveModifier: 1.5, curveLimiter: 1 };
generator.addToQueue(mountains, 1000);
generator.addToQueue(flatland, 1000);
generator.addToQueue(mountains, 1000);
generator.addToQueue(flatland, 1000);
generator.addToQueue(mountains, 1000);
generator.addToQueue(flatland, 1000);
generator.addToQueue(mountains, 1000);
generator.addToQueue(flatland, 1000);


generator.addToQueue(flatland, Terrain.width);


function rockSpawner(x: number, ty: number) {
    if (x == nextRock) {
        let size = random(3, 8);
        nextRock += randomInt(1, 10) * Math.round(size);
        new Rock(new Vector(x, ty), null, size, random(.3, 1.2), random(-2, 2));
    }

    backdrop0.setHeight(x - 100, ty);
    backdrop1.setHeight(x - 500, ty);
    backdrop2.setHeight(x + 400, ty);
    backdrop3.setHeight(x - 150, ty);

}

generator.generate(0.01, rockSpawner);

export const player = new Player(new Vector(2500, 500));

new Cloud(new Vector(100, 500))
//backdrop3.placeSprite(1500, 0, (() => { const a = new AnimatedSprite([Texture.from("antenna0.png"), Texture.from("antenna1.png")], true); a.animationSpeed = 0.01; a.play(); return a })());
//backdrop2.placeSprite(1500, 0, (() => { const a = new AnimatedSprite([Texture.from("antenna1.png"), Texture.from("antenna0.png")], true); a.animationSpeed = 0.02; a.play(); return a })());
//backdrop1.placeSprite(1500, 0, (() => { const a = new AnimatedSprite([Texture.from("antenna1.png"), Texture.from("antenna0.png")], true); a.animationSpeed = 0.01; a.play(); return a })());
//backdrop0.placeSprite(1500, 0, (() => { const a = new AnimatedSprite([Texture.from("antenna0.png"), Texture.from("antenna1.png")], true); a.animationSpeed = 0.02; a.play(); return a })());
backdrop3.placeSprite(2000, 0, (() => { const a = Sprite.from("building.png"); return a })(), false, 100);
let cloudList: BackdropProp[];
cloudList = [];

for (let i = 0; i <= 10; i++) {
    const c = new BackdropProp(random(.02, .7), (() => { const a = new Sprite(Texture.from("cloud.png")); a.position.set(randomInt(0, 1500), randomInt(80, 120)); a.alpha = .3; return a })(), 2, true);
    cloudList.push(c);
}

//new Robot(new Vector(900, 900), undefined, 0);

Camera.position.y = 400;
Camera.position.x = 400;

Terrain.draw();
PixelDrawer.update();

let printText = "";
export function debugPrint(s: string) { printText += s + "\n" };

const camspeed = 50;
let seedCooldown = 0;
app.ticker.add((delta) => {
    const dt = Math.min(.1, delta / app.ticker.FPS);

    Atmosphere.settings.sunAngle += dt / 2;
    Atmosphere.settings.sunPosition = Vector.fromAngle(Atmosphere.settings.sunAngle).mult(200).add(new Vector(200, 200));

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
    if (key["3"]) preferences.selectedTerrainType = terrainType.water3;

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
        preferences.debugMode++;
        preferences.debugMode %= Object.keys(DebugMode).length / 2;
        if (preferences.debugMode != DebugMode.off) {
            Entity.graphic.filters = [];
            PixelDrawer.graphic.filters = [];
        } else {
            Entity.graphic.filters = [new HighlightFilter(2, 0xFF9955, .1)];
            PixelDrawer.graphic.filters = [new HighlightFilter(4, 0xFF9955, .2)];
        }
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
    debugPrint("FPS: " + (1 / dt).toFixed(1));
    Terrain.draw();
    PixelDrawer.update();
    ParallaxDrawer.update();
    Entity.update(dt);
    GUI.update(dt);
    for (const c of cloudList) {
        c.graphic.position.x += 10 * dt * c.depth;
    }
});

export let terrainTick = 0;
setInterval(() => {
    Terrain.update(terrainTick);
    terrainTick++;
}, 7);

const key: Record<string, boolean> = {};
export const mouse = { x: 0, y: 0, pressed: 0 };

window.addEventListener("keydown", (e) => { key[e.key.toLowerCase()] = true });
window.addEventListener("keyup", (e) => { key[e.key.toLowerCase()] = false });
window.addEventListener("mousedown", (e) => { mouse.pressed = e.buttons; e.preventDefault() });
window.addEventListener("mouseup", (e) => { mouse.pressed = e.buttons });
window.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY });


export function screenToWorld(vector: { x: number, y: number }) {
    return new Vector(
        Camera.position.x + (vector.x * (Camera.height / window.innerHeight)),
        Camera.position.y + Camera.height - (vector.y * (Camera.height / window.innerHeight)));
}
export function worldToScreen(vector: { x: number, y: number }) {
    return new Vector(
        (vector.x - Camera.position.x) / (Camera.height / window.innerHeight),
        ((-vector.y) + Camera.position.y + Camera.height) / (Camera.height / window.innerHeight));
}