import { mulberry32, status } from "./mod";
import * as PIXI from "pixi.js"
import { PixelDrawer } from "./pixelDrawer";
import { Terrain, TerrainManager, terrainType } from "./terrain";
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
import { lerp, noise, random, randomBool, randomInt } from "./utils";
import { Atmosphere } from "./atmosphere";
import { AtmosphereFilter } from "./shaders/atmosphere/atmosphereFilter";
import { Cloud } from "./entities/passive/cloud";
import { LightingFilter } from "./shaders/lighting/lightingFilter";
import { FilmicFilter } from "./shaders/filmic/filmicFilter";
import { TerrainGenerator } from "./biome";
import { SkyFilter } from "./shaders/atmosphere/skyFilter";
import { GUI, GuiLabel, GuiSplash } from "./gui/gui";
import { Color } from "./color";
import { clamp } from "./utils";
import { Stamps } from "./stamp";
import { GrassPatch } from "./entities/passive/grassPatch";
import { Sign } from "./entities/passive/sign";
import { log } from "console";
import { Cable } from "./entities/passive/cable";
import { Buildable } from "./entities/buildable/buildable";
import { Pole } from "./entities/buildable/pole";
import { Sapling } from "./entities/buildable/sapling";
import { ForegroundFilter } from "./shaders/foreground/foregroundFilter";
import { Drone } from "./entities/enemy/drone/drone";
import { DebugDraw } from "./debugDraw";
import { Light } from "./shaders/lighting/light";
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
export let app = new PIXI.Application<HTMLCanvasElement>({ sharedTicker: false, autoStart: false });
//PIXI.settings.SCALE_MODE = SCALE_MODES.NEAREST;
//PIXI.settings.ROUND_PIXELS = true;
PIXI.BaseTexture.defaultOptions.scaleMode = SCALE_MODES.NEAREST;
const resizeSubscribers = new Map<any, () => void>();
function resize() {
    Camera.aspectRatio = window.innerWidth / window.innerHeight;
    Camera.width = Math.ceil(Camera.height * Camera.aspectRatio);
    PixelDrawer.resize();
    Entity.graphic.filterArea = new Rectangle(0, 0, Camera.width, Camera.height);
    PixelDrawer.graphic.filterArea = new Rectangle(0, 0, Camera.width, Camera.height);
    const useWidth = Math.ceil((Camera.width) / 4) * 4;
    background = PIXI.RenderTexture.create({ width: useWidth, height: Camera.height });
    app.renderer.resize(Camera.width, Camera.height);
    for (const [subscriber, action] of resizeSubscribers) {
        action();
    }
}


export function onResize(caller: any, action: () => void) {
    resizeSubscribers.set(caller, action);
}

export function offResize(caller: any) {
    resizeSubscribers.delete(caller);
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

bg.tint = 0xC0D0ED;
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
Entity.graphic = new Container();
pixelContainer.addChild(Entity.graphic);
pixelContainer.addChild(PixelDrawer.graphic);
Buildable.graphic = new Container();
pixelContainer.addChild(Buildable.graphic);
pixelContainer.addChild(ParallaxDrawer.fgContainer);
onResize(ParallaxDrawer.fgContainer, () => ParallaxDrawer.fgContainer.filterArea = new Rectangle(0, 0, Camera.width, Camera.height));


//ParallaxDrawer.addLayer("BG/Test/1.png", 0);
//ParallaxDrawer.addLayer("BG/Test/2.png", .1);
//ParallaxDrawer.addLayer("BG/Test/3.png", .25);
//ParallaxDrawer.addLayer("BG/Test/4.png", .42);
const backdrop0 = new Backdrop(.65);
const backdrop1 = new Backdrop(.38);
const backdrop2 = new Backdrop(.22);
const backdrop3 = new Backdrop(.1);
const foredrop = new Backdrop(2);
app.stage.addChild(pixelContainer);
PixelDrawer.graphic.filters = [new LightingFilter(PixelDrawer.graphic, new Color(150, 150, 150), true), new HighlightFilter(1, 0xFF9955, .45), new AtmosphereFilter(.9)];
PixelDrawer.graphic.filterArea = new Rectangle(0, 0, Camera.width, Camera.height);
Entity.graphic.filters = [new LightingFilter(Entity.graphic, new Color(200, 200, 200), true), new HighlightFilter(1, 0xFF9955, .2), new AtmosphereFilter(.9)];
Entity.graphic.filterArea = new Rectangle(0, 0, Camera.width, Camera.height);
ParallaxDrawer.fgContainer.filters = [new ForegroundFilter()];
ParallaxDrawer.fgContainer.filterArea = new Rectangle(0, 0, Camera.width, Camera.height);
console.log(app.renderer);

app.stage.addChild(debugText);
resize();
window.addEventListener("resize", resize);
document.body.appendChild(app.view);
//app.ticker.speed=.1;


Terrain.init();

const generator = new TerrainGenerator();
let nextRock = randomInt(1, 10);
const flatland = { stoneTop: 0.5, stoneBottom: 0.5, bottom: 360, top: 480, moisture: 2, minerals: 3, dirtDepth: 50, mineralDepthPenalty: -2, curveModifier: 0.5, curveLimiter: 0.1, biomeId: 1 };
const mountains = { stoneTop: 1, stoneBottom: 2, bottom: 550, top: 660, moisture: 2, minerals: 1, dirtDepth: 10, mineralDepthPenalty: 0, curveModifier: 1.5, curveLimiter: 1, biomeId: 2 };
const swamp = { stoneTop: 2, stoneBottom: 0.5, bottom: 360, top: 400, moisture: 3, minerals: 0, dirtDepth: 80, mineralDepthPenalty: 0, curveModifier: 0.5, curveLimiter: 0.1, biomeId: 3 };
generator.addToQueue(swamp, 1000);
generator.addToQueue(mountains, 1000);
generator.addToQueue(flatland, 1000);
generator.addToQueue(mountains, 1000);
generator.addToQueue(swamp, 1000);
generator.addToQueue(mountains, 1000);
generator.addToQueue(flatland, 1000);
generator.addToQueue(mountains, 1000);
generator.addToQueue(swamp, 1000);


generator.addToQueue(flatland, Terrain.width);


function rockSpawner(x: number, ty: number) {
    if (x == nextRock) {
        let size = random(3, 8);
        nextRock += randomInt(1, 10) * Math.round(size);
        new Rock(new Vector(x, ty), null, size, random(.3, 1.2), random(-2, 2));
    }
}

generator.generate(undefined, rockSpawner);
generator.generate({ skipPlacement: true, padding: 250, scale: 1 / backdrop0.depth }, (x, ty) => backdrop0.setHeight(x, ty));
generator.generate({ skipPlacement: true, padding: 500, scale: 1 / backdrop1.depth }, (x, ty) => backdrop1.setHeight(x, ty));
generator.generate({ skipPlacement: true, padding: 1000, scale: 1 / backdrop2.depth }, (x, ty) => backdrop2.setHeight(x, ty));
generator.generate({ skipPlacement: true, padding: 3000, scale: 1 / backdrop3.depth }, (x, ty) => backdrop3.setHeight(x, ty));
generator.generate({ skipPlacement: true, padding: 0, scale: .5 }, (x, ty) => { foredrop.setHeight(x, ty); });

export const player = new Player(new Vector(2500, 600));

new Cloud(new Vector(100, 500));
backdrop3.placeSprite(2050, 0, (() => { const a = Sprite.from("building.png"); return a })(), false, 100);
backdrop0.placeSprite(2300, 0, (() => { const a = Sprite.from("building2.png"); return a })(), false, 70);
backdrop0.placeSprite(2600, 0, (() => { const a = Sprite.from("building3.png"); return a })(), false, 70);
backdrop1.placeSprite(2050, 0, (() => { const a = Sprite.from("building4.png"); return a })(), false, 70);
backdrop1.placeSprite(2850, 0, (() => { const a = Sprite.from("building4.png"); return a })(), true, 70);
backdrop0.placeSprite(2900, 0, (() => { const a = Sprite.from("dump1.png"); return a })(), false, 120);
let cloudList: BackdropProp[];
cloudList = [];

for (let i = 0; i <= 12; i++) {
    const c = new BackdropProp(new Vector(randomInt(500, 2500), randomInt(80, 120)), random(.02, .7), (() => { const a = new Sprite(Texture.from("cloud.png")); a.alpha = .4; return a })(), 2, true);
    cloudList.push(c);
}
/* CURSED 3D
for (let i = 0; i <= 500; i++) {
    let si = i * i
    new BackdropProp(new Vector(2500 + Math.sin(Math.sqrt(i/500) * 20) * 30, 70 + Math.pow(i / 60, 2)), Math.pow(i / 500, 2), (() => { const a = Sprite.from("shit.png");a.angle=Math.sqrt(i/500) * 4000; a.anchor.set(.5); a.alpha = 1; return a })(), 3, true);
}
*/
foredrop.placeSprite(2500, 0, (Sprite.from("FG/urban1.png")), false, 512);
foredrop.placeSprite(2200, 0, (Sprite.from("FG/urban2.png")), false, 512);
foredrop.placeSprite(2300, 0, (Sprite.from("FG/urban3.png")), false, 200);

new Light(player, new Vector(0, 25), Math.PI+.2, 1, undefined, 100);

//new Robot(new Vector(2500, 600), undefined, 0);

Camera.position.y = 400;
Camera.position.x = 3000;

Stamps.loadStamps().then(() => {
    //const pos = Stamps.stamp("stamp", new Vector(2500, 0), { useDirtFrom: generator });
    //new Sign(pos.add(new Vector(184, 92)));
    Stamps.stamp("stamp2", new Vector(2800, 0), { useDirtFrom: generator, replaceMatching: (r, w) => TerrainManager.isDirt(r) });
    Stamps.stamp("stamp5", new Vector(2650, 0), { useDirtFrom: generator, replaceMatching: (r, w) => TerrainManager.isDirt(r) });
    Stamps.stamp("stamp3", new Vector(2450, -36), { useDirtFrom: generator, replaceMatching: (r, w) => TerrainManager.isDirt(r) });
    Stamps.stamp("stamp4", new Vector(2200, -36), { useDirtFrom: generator, replaceMatching: (r, w) => TerrainManager.isDirt(r) });
});

Terrain.draw();
PixelDrawer.update();

DebugDraw.graphics = new PIXI.Graphics();
DebugDraw.graphics.visible = false;

app.stage.addChild(DebugDraw.graphics);

let printText = "";
export function debugPrint(s: string) { printText += s + "\n" };
let lastTime = new Date();
let dtAvg = new Array(10).fill(60);
let tpsMeter = 0;
let showTps = 0;
let updateInfo = 0;

export let background = PIXI.RenderTexture.create({ width: Camera.width, height: Camera.height });
export let entityRender = PIXI.RenderTexture.create({ width: Camera.width, height: Camera.height });


new Drone(new Vector(2500, 600), undefined);

const camspeed = 50;
let seedCooldown = 0;
let currentBiome = 0;
let ticker = new Ticker();
ticker.add((delta) => {
    if (terrainScore < 80) {
        return;
    }
    app.renderer.render(bg, { renderTexture: background });
    app.renderer.render(ParallaxDrawer.container, { renderTexture: background, clear: false });
    app.renderer.render(Entity.graphic, { renderTexture: background, clear: false });

    debugPrint("terrainScore:" + terrainScore.toFixed(1));
    terrainScore *= 0.98;
    let diff = new Date().valueOf() - lastTime.valueOf();
    const dt = Math.min(.1, diff / 2000);
    lastTime = new Date();
    dtAvg.shift();
    dtAvg.push(diff);
    tpsMeter += diff;

    updateInfo -= diff;

    if (updateInfo <= 0) {
        updateInfo = 250;
        debugText.text = printText;
    }



    Atmosphere.settings.sunAngle += dt / 20;
    //Atmosphere.settings.sunAngle = new Vector(mouse.x/window.innerWidth-.5, mouse.y/window.innerHeight-.5).toAngle();
    //Atmosphere.settings.sunAngle = -1.5;

    Atmosphere.settings.sunPosition = Vector.fromAngle(Atmosphere.settings.sunAngle).mult(Camera.width / 2 * .6).add(new Vector(Camera.width / 2, Camera.height * .63));
    let sunFac = (-Vector.fromAngle(Atmosphere.settings.sunAngle).y - .5) * 2;
    let sunHor = 1 - Math.abs(Vector.fromAngle(Atmosphere.settings.sunAngle).y);
    Atmosphere.settings.ambientLight = Color.fromHsl(lerp(10, 20, clamp(sunFac * 5)), clamp(.8 - sunFac), clamp(sunFac + .5));
    Atmosphere.settings.ambientLight = Atmosphere.settings.ambientLight.add(Color.fromHsl(lerp(280, 230, clamp(-sunFac / 2)), clamp(-sunFac + .3) * .6, Math.max(.1, (clamp(-sunFac + .3) * .3))))
    Atmosphere.settings.sunIntensity = clamp(clamp(sunFac + .8) * Math.max(.4, sunHor * 2))
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
    let newBiome = generator.getBiome(player.position.x).biomeId;
    if (newBiome != currentBiome) {
        new GuiSplash(["Urban Ruins", "Melted Mountains", "Swampy Lowlands"][newBiome - 1])
        currentBiome = newBiome;
    }
    if (mouse.pressed == 1 && preferences.selectedTerrainType != 0) {
        for (let x = 0; x < preferences.penSize; x++) {
            for (let y = 0; y < preferences.penSize; y++) {
                Terrain.setAndUpdatePixel(Math.floor(wx + x - preferences.penSize / 2), Math.floor(wy + y - preferences.penSize / 2), preferences.selectedTerrainType != terrainType.dirt00 ? preferences.selectedTerrainType : generator.getLocalDirt(
                    new Vector(Math.floor(wx + x - preferences.penSize / 2), Math.floor(wy + y - preferences.penSize / 2))
                ));
            }
        }
    } else if (mouse.pressed == 2) {
        for (let x = 0; x < preferences.penSize; x++) {
            for (let y = 0; y < preferences.penSize; y++) {
                Terrain.setAndUpdatePixel(Math.floor(wx + x - preferences.penSize / 2), Math.floor(wy + y - preferences.penSize / 2), terrainType.void);
            }
        }
    }
    if (key["0"]) preferences.selectedTerrainType = terrainType.void;
    if (key["1"]) preferences.selectedTerrainType = terrainType.dirt00;
    if (key["2"]) preferences.selectedTerrainType = terrainType.sand;
    if (key["3"]) preferences.selectedTerrainType = terrainType.water3;
    if (key["4"]) preferences.selectedTerrainType = terrainType.grass0;

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
            DebugDraw.graphics.visible = true;
        } else {
            DebugDraw.graphics.visible = false;
            Entity.graphic.filters = [new HighlightFilter(1, 0xFF9955, .1)];
            PixelDrawer.graphic.filters = [new HighlightFilter(1, 0xFF9955, .2)];
        }
    }
    if (key["r"]) {
        key["r"] = false;
        preferences.showDebug = !preferences.showDebug;
        debugText.visible = preferences.showDebug;
    }
    seedCooldown -= dt;
    if (!Buildable.currentBuildable) {
        if (key["f"] && seedCooldown <= 0) {
            seedCooldown = .2;
            new Sapling(player.position.result(), randomBool() ? coniferousSettings : defaultTreeSettings);
        }
        if (key["g"] && seedCooldown <= 0) {
            seedCooldown = .2;
            new Pole(player.position.result(), false);
        }
    }
    if (Camera.position.x < 0) Camera.position.x = 0
    if (Camera.position.x + Camera.width >= Terrain.width) Camera.position.x = Terrain.width - Camera.width - 1
    if (Camera.position.y < 0) Camera.position.y = 0
    if (Camera.position.y + Camera.height >= Terrain.height) Camera.position.y = Terrain.height - Camera.height - 1
    debugPrint(Camera.position.toString());
    debugPrint("FPS: " + (1000 / (dtAvg.reduce((accumulator, currentValue) => {
        return accumulator + currentValue;
    }) / dtAvg.length)).toFixed(1) + " | " + (1000 / Math.max(...dtAvg)).toFixed(1));
    debugPrint("TPS: " + showTps);

    if (tpsMeter > 1000) {
        showTps = tps;
        tpsMeter -= 1000;
        tps = 0;
    }

    Terrain.draw();
    PixelDrawer.update();
    ParallaxDrawer.update();
    Entity.update(dt);
    Buildable.update(dt);
    GUI.update(dt);
    for (const c of cloudList) {
        c.graphic.position.x += 15 * dt * c.depth;
    }
    app.render();
    DebugDraw.clear()
    Camera.position.x = Math.floor(player.camTarget.x);
    Camera.position.y = Math.floor(player.camTarget.y);
});
ticker.start();

export let terrainTick = 0;
let tps = 0;
let terrainScore = 100;
function infiniteLoop() {
    setTimeout(infiniteLoop, 7);
    Terrain.update(terrainTick);
    terrainScore++;
    terrainTick++;
    tps++;
}

infiniteLoop();



const key: Record<string, boolean> = {};
export const mouse = { x: .5, y: .5, pressed: 0 };

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