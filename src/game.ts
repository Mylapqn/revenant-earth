import { mulberry32, status } from "./mod";
import * as PIXI from "pixi.js"
import { PixelDrawer } from "./pixelDrawer";
import { Terrain, TerrainManager, terrainType } from "./terrain";
import { Camera } from "./camera";
import { Entity } from "./entity";
import { Container, Rectangle, SCALE_MODES, Sprite, Texture, Ticker } from "pixi.js";
import { Vector } from "./vector";
import { Player } from "./entities/player/player";
import { Backdrop, BackdropProp, ParallaxDrawer } from "./parallax";
import { bushSettings, coniferousSettings, deadTreeSettings, defaultTreeSettings, poplarSettings, randomTreeSettings } from "./entities/plants/tree/treeSettings";
import { HighlightFilter } from "./shaders/outline/highlightFilter";
import { Rock } from "./entities/passive/rock";
import { lerp, random, randomBool, randomInt } from "./utils";
import { Atmosphere } from "./atmosphere";
import { AtmosphereFilter } from "./shaders/atmosphere/atmosphereFilter";
import { Cloud } from "./entities/passive/cloud";
import { LightingFilter } from "./shaders/lighting/lightingFilter";
import { BiomeData, TerrainGenerator } from "./biome";
import { SkyFilter } from "./shaders/atmosphere/skyFilter";
import { GUI, GuiButton, PositionableGuiElement, GuiSplash, BaseGuiElement, CustomGuiElement, GuiPanel, TutorialPrompt, CollapsibleGuiElement, GuiProgressBar, GuiLabel, GuiSpeechBubble } from "./gui/gui";
import { Color } from "./color";
import { clamp } from "./utils";
import { Stamps } from "./stamp";
import { Buildable } from "./entities/buildable/buildable";
import { Pole } from "./entities/buildable/pole";
import { Sapling } from "./entities/buildable/sapling";
import { ForegroundFilter } from "./shaders/foreground/foregroundFilter";
import { Drone } from "./entities/enemy/drone/drone";
import { DebugDraw } from "./debugDraw";
import { World } from "./world";
import { Lightmap, Shadowmap } from "./shaders/lighting/light";
import { Dialogue, NodeStack, TopNode, sleep } from "./dialogue";
import { CrashPod } from "./entities/passive/landingPod";
import { Scanner } from "./entities/buildable/scanner";
import { colorGradeFilter, colorGradeOptions } from "./shaders/colorGrade/colorGrade";
import { SoundManager } from "./sound";
import { ParticleSystem } from "./particles/particle";
import { ParticleFilter } from "./shaders/particle/particleFilter";
import { Progress } from "./progress";
import { Turbine } from "./entities/buildable/turbine";
import { Seed } from "./entities/plants/tree/seed";
import { Prop } from "./entities/passive/prop";
import { Projectile } from "./entities/projectile";
let seed = parseInt(window.location.toString().split('?')[1]);
if (!seed) seed = Math.floor(Math.random() * 1000);
Math.random = mulberry32(seed);
console.log("seed:", seed);

export enum DebugMode {
    off,
    updates,
}
export const preferences = { debugMode: DebugMode.off, selectedTerrainType: terrainType.void, penSize: 4, showDebug: false }
console.log(status);
export const app = new PIXI.Application<HTMLCanvasElement>({ sharedTicker: false, autoStart: false });
//PIXI.settings.SCALE_MODE = SCALE_MODES.NEAREST;
//PIXI.settings.ROUND_PIXELS = true;
PIXI.BaseTexture.defaultOptions.scaleMode = SCALE_MODES.NEAREST;
const resizeSubscribers = new Map<any, () => void>();
function resize() {
    Camera.aspectRatio = window.innerWidth / window.innerHeight;
    Camera.width = Math.ceil(Camera.height * Camera.aspectRatio);
    Camera.rect = new Rectangle(0, 0, Camera.width, Camera.height);
    PixelDrawer.resize();
    Entity.graphic.filterArea = Camera.rect;
    PixelDrawer.graphic.filterArea = Camera.rect;
    app.stage.filterArea = Camera.rect;
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

const bg = new PIXI.Graphics();

const pixelContainer = new Container();

const debugText = new PIXI.Text();

let backdrop0: Backdrop;
let backdrop1: Backdrop;
let backdrop2: Backdrop;
let backdrop3: Backdrop;
let foredrop: Backdrop;

export let player: Player;

let cloudList: BackdropProp[];

let printText = "";
export function debugPrint(s: string) { printText += s + "\n" };
let lastTime = performance.now();
let dtAvg = new Array(10).fill(60);
let tpsMeter = 0;
let showTps = 0;
let updateInfo = 0;

export let background: PIXI.RenderTexture, entityRender: PIXI.RenderTexture;

const camspeed = 50;
let seedCooldown = 0;
let currentBiome = 0;
let ticker = new Ticker();

export let terrainTick = 0;
let tps = 0;
let terrainScore = 100;

const terrainNoises: Record<string, HTMLAudioElement> = {};

for (const name in Terrain.sound) {
    terrainNoises[name] = new Audio(`sound/terrain/${name}.ogg`);
    terrainNoises[name].loop = true;
    terrainNoises[name].volume = 0;

}

export const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, pressed: 0, clicked: 0, gui: 0 };

function terrainUpdateCycle() {
    setTimeout(terrainUpdateCycle, 7);
    terrainUpdate();
}

function terrainUpdate() {
    Terrain.update(terrainTick);
    terrainScore++;
    terrainTick++;
    tps++;
}

export let toxicGas: ParticleSystem;

let smokeBuildup = 0;

export async function initGame(skipIntro = false) {
    PIXI.Assets.addBundle("images", {
        landing: "entity/landing.png",
        seed: "seed.png",
    })
    await PIXI.Assets.loadBundle(["images"]);
    console.log("skipIntro", skipIntro);

    Dialogue.init();

    Lightmap.init();
    PixelDrawer.init();

    for (let y = 0; y < 256; y++) {
        const c = Math.floor(y / 2 + 128)
        bg.lineStyle(1, c * 256 * 256 + c * 256 + c, 1);
        bg.moveTo(0, 255 - y);
        bg.lineTo(255, 255 - y);
    }

    bg.tint = 0xC0D0ED;
    bg.scale.set(10, 1);
    bg.filters = [new SkyFilter()];


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
    ParticleSystem.parentContainer = new Container();
    pixelContainer.addChild(ParticleSystem.parentContainer);
    Buildable.graphic = new Container();
    pixelContainer.addChild(Buildable.graphic);
    pixelContainer.addChild(ParallaxDrawer.fgContainer);
    onResize(ParallaxDrawer.fgContainer, () => ParallaxDrawer.fgContainer.filterArea = Camera.rect);


    backdrop0 = new Backdrop(.65);
    backdrop1 = new Backdrop(.38);
    backdrop2 = new Backdrop(.22);
    backdrop3 = new Backdrop(.1);
    foredrop = new Backdrop(2);

    app.stage.addChild(pixelContainer);
    PixelDrawer.graphic.filters = [new HighlightFilter(1, 0xFF9955, .6), new AtmosphereFilter(.9)];
    PixelDrawer.graphic.filterArea = Camera.rect;
    Entity.graphic.filters = [new LightingFilter(Entity.graphic, new Color(200, 200, 200), true), new HighlightFilter(1, 0xFF9955, .6), new AtmosphereFilter(.9)];
    Entity.graphic.filterArea = Camera.rect;
    ParallaxDrawer.fgContainer.filters = [new ForegroundFilter()];
    ParallaxDrawer.fgContainer.filterArea = Camera.rect;
    //ParticleSystem.container.blendMode = PIXI.BLEND_MODES.ADD;
    onResize(ParticleSystem.parentContainer, () => ParticleSystem.parentContainer.filterArea = Camera.rect);
    let colorGrade = new colorGradeFilter();
    let colorGradeBiome: colorGradeOptions;
    app.stage.filters = [colorGrade];
    app.stage.filterArea = Camera.rect;
    console.log(app.renderer);

    app.stage.addChild(debugText);
    resize();
    window.addEventListener("resize", resize);

    document.body.appendChild(app.view);


    Terrain.init();

    const generator = new TerrainGenerator();
    Terrain.generator = generator;

    const flatlands: BiomeData = { stoneTop: 0.5, stoneBottom: 0.5, bottom: 360, top: 480, moisture: 2, minerals: 3, dirtDepth: 50, mineralDepthPenalty: -2, curveModifier: 0.5, curveLimiter: 0.1, biomeId: 1, name: "Abandoned Flatlands", shortName: "Flatlands", music: SoundManager.music.ruins, colorGrade: colorGradeFilter.styles.dust };
    const mountains: BiomeData = { stoneTop: 1, stoneBottom: 2, bottom: 530, top: 660, moisture: 2, minerals: 1, dirtDepth: 10, mineralDepthPenalty: 0, curveModifier: .8, slopeMin: .7, slopeMax: 1.2, curveLimiter: 5, biomeId: 2, name: "Melted Mountains", shortName: "Mountains", music: SoundManager.music.mountains, colorGrade: colorGradeFilter.styles.bleak };
    const swamp: BiomeData = { stoneTop: 2, stoneBottom: 0.5, bottom: 360, top: 400, moisture: 3, minerals: 0, dirtDepth: 80, mineralDepthPenalty: 0, curveModifier: 0.5, curveLimiter: 0.1, biomeId: 3, name: "Swampy Lowlands", shortName: "Lowlands", music: SoundManager.music.swamp, colorGrade: colorGradeFilter.styles.green };
    const wasteland: BiomeData = { stoneTop: .5, stoneBottom: 3, bottom: 340, top: 450, moisture: 0, minerals: 2, dirtDepth: 30, mineralDepthPenalty: -1, curveModifier: .3, slopeMax: .25, curveLimiter: .1, biomeId: 4, name: "Industrial Wasteland", shortName: "Wasteland", music: SoundManager.music.wasteland, colorGrade: colorGradeFilter.styles.industry };
    const ruins: BiomeData = { waterLevel: 380, stoneTop: .5, stoneBottom: 3, bottom: 320, top: 380, moisture: 3, minerals: 2, dirtDepth: 30, mineralDepthPenalty: -1, curveModifier: .3, slopeMax: .25, curveLimiter: .5, biomeId: 5, name: "Urban Ruins", shortName: "Ruins", music: SoundManager.music.ruins, colorGrade: colorGradeFilter.styles.bleak };
    generator.addToQueue(mountains, 500);
    generator.addToQueue(ruins, 1500);
    generator.addToQueue(flatlands, 1000);
    generator.addToQueue(wasteland, 1000);
    generator.addToQueue(swamp, 1000);
    generator.addToQueue(mountains, 1000);
    generator.addToQueue(ruins, 1000);
    generator.addToQueue(mountains, 1000);
    generator.addToQueue(swamp, 1000);


    generator.addToQueue(ruins, Terrain.width);

    let nextRock = randomInt(1, 10);
    let nextTree = randomInt(1, 10);
    let nextCityBuilding = randomInt(40, 100);
    function objectSpawner(x: number, ty: number, biomeData: BiomeData) {
        if (x == nextRock) {
            let size = random(3, 8);
            nextRock += randomInt(1, 10) * Math.round(size);
            if (biomeData.biomeId == 2)
                new Rock(new Vector(x, ty), null, size, random(.3, 1.2), random(-2, 2));
        }
        if (x >= nextTree) {
            nextTree = x + randomInt(40, 400);
            if (biomeData.biomeId == 3) {
                new Seed(new Vector(x, ty), null, null, deadTreeSettings);
            }
        }
        if (x >= nextCityBuilding) {
            nextCityBuilding = x + randomInt(150, 250);
            if (biomeData.biomeId == 5) {
                for (const backdrop of Backdrop.list) {
                    if (randomBool(backdrop.depth <= 1 ? .9 : .3)) backdrop.placeSprite(x + randomInt(-60, 60), 0, Sprite.from(`BG/city/${randomBool() ? "ruined_" : ""}skyscraper_${randomInt(0, 4)}.png`), true, 200);
                }
                if (randomBool(.9)) new BackdropProp(new Vector(x, 720 - ty), random(.68, .95), Sprite.from(`BG/city/${randomBool() ? "ruined_" : ""}skyscraper_${randomInt(0, 4)}.png`), 1, true);
                //console.log(ty);
            }
        }
    }


    generator.generate({ skipPlacement: true, padding: 250, scale: 1 / backdrop0.depth }, (x, ty) => backdrop0.setHeight(x, ty));
    generator.generate({ skipPlacement: true, padding: 500, scale: 1 / backdrop1.depth }, (x, ty) => backdrop1.setHeight(x, ty));
    generator.generate({ skipPlacement: true, padding: 1000, scale: 1 / backdrop2.depth }, (x, ty) => backdrop2.setHeight(x, ty));
    generator.generate({ skipPlacement: true, padding: 3000, scale: 1 / backdrop3.depth }, (x, ty) => backdrop3.setHeight(x, ty));
    generator.generate({ skipPlacement: true, padding: 0, scale: .5 }, (x, ty) => { foredrop.setHeight(x, ty); });
    generator.generate(undefined, objectSpawner);
    new Cloud(new Vector(100, 500));
    backdrop3.placeSprite(2050, 0, (() => { const a = Sprite.from("building.png"); return a })(), false, 100);
    backdrop3.placeSprite(4000, 0, Sprite.from("BG/factory_far.png"), false, 100);
    backdrop1.placeSprite(3250, 0, Sprite.from("BG/factory.png"), false, 150);
    backdrop1.placeSprite(3500, 0, Sprite.from("BG/pipes1.png"), false, 200);
    backdrop2.placeSprite(3500, 0, Sprite.from("BG/pipes2.png"), false, 300);
    backdrop0.placeSprite(3701, 0, Sprite.from("BG/pipes3.png"), false, 300);
    backdrop0.placeSprite(3200, 0, Sprite.from("BG/pipes4.png"), false, 300);
    backdrop1.placeSprite(1500, 0, Sprite.from("BG/highway1.png"), false, 200);
    //backdrop1.placeSprite(2300, 0, (() => { const a = Sprite.from("BG/city/ruined_skyscraper_0.png"); return a })(), true, 70);
    backdrop0.placeSprite(2300, 0, (() => { const a = Sprite.from("building2.png"); return a })(), false, 70);
    backdrop0.placeSprite(2600, 0, (() => { const a = Sprite.from("building3.png"); return a })(), false, 70);
    backdrop0.placeSprite(2900, 0, (() => { const a = Sprite.from("dump1.png"); return a })(), false, 120);
    backdrop2.placeSprite(400, 0, (() => { const a = Sprite.from("BG/mountains/mountain1.png"); return a })(), false, 100);
    backdrop1.placeSprite(500, 0, (() => { const a = Sprite.from("BG/mountains/mountain2.png"); return a })(), false, 100);


    new Prop(new Vector(2150, -10), Sprite.from("entity/citySign.png"), "Rusted sign", "\"Welcome to...\" I can't make out the name of the city.");


    player = new Player(new Vector(2510, 600));
    Camera.position = player.position.result();
    //new Robot(new Vector(2500, 600), undefined, 0);

    toxicGas = new ParticleSystem({ lit: true, emitRate: 4, keepAlive: true, position: new Vector(2510, 500), colorFrom: new Color(250, 250, 230), colorTo: new Color(200, 200, 200) });
    toxicGas.enabled = false;
    toxicGas.scaleFrom = 2;
    toxicGas.particleLifeTime = 1.5;
    toxicGas.scaleTo = .5;
    toxicGas.alphaFrom = 0;
    toxicGas.alphaTo = 1;
    toxicGas.windSpeed = 0;
    toxicGas.emitSpeed = 30;
    toxicGas.angle = 1.6;

    cloudList = [];

    for (let i = 0; i <= 12; i++) {
        const c = new BackdropProp(new Vector(randomInt(500, 2500), randomInt(180, 220)), random(.02, .7), (() => { const a = new Sprite(Texture.from("cloud.png")); a.alpha = .4; return a })(), 2, true);
        cloudList.push(c);
    }

    foredrop.placeSprite(2500, 0, (Sprite.from("FG/urban1.png")), false, 512);
    foredrop.placeSprite(1800, 0, (Sprite.from("FG/urban2.png")), false, 512);
    foredrop.placeSprite(2300, 0, (Sprite.from("FG/urban3.png")), false, 200);

    Stamps.loadStamps().then(() => {
        //const pos = Stamps.stamp("stamp", new Vector(2500, 0), { useDirtFrom: generator });
        //new Sign(pos.add(new Vector(184, 92)));
        const pos = Stamps.stamp("landing", new Vector(2500, 0), { useDirtFrom: generator, replaceMatching: (r, w) => TerrainManager.isDirt(r) });
        new CrashPod(pos.add(new Vector(0, 1)));
        Stamps.stamp("stamp2", new Vector(2800, 0), { useDirtFrom: generator, replaceMatching: (r, w) => TerrainManager.isDirt(r) });
        Stamps.stamp("stamp5", new Vector(2650, 0), { useDirtFrom: generator, replaceMatching: (r, w) => TerrainManager.isDirt(r) });
        Stamps.stamp("stamp3", new Vector(3250, -36), { useDirtFrom: generator, replaceMatching: (r, w) => TerrainManager.isDirt(r) });
        Stamps.stamp("stamp4", new Vector(2000, -36), { useDirtFrom: generator, replaceMatching: (r, w) => TerrainManager.isDirt(r) });
        Stamps.stamp("bigbuilding", new Vector(800, 0), { useDirtFrom: generator, replaceMatching: (r, w) => TerrainManager.isDirt(r), replace: [terrainType.stone] });
        Stamps.stamp("chimney", new Vector(3200, -5), { useDirtFrom: generator, replaceMatching: (r, w) => TerrainManager.isDirt(r) });
        Stamps.stamp("pipeOut", new Vector(4050, 0), { useDirtFrom: generator, replaceMatching: (r, w) => TerrainManager.isDirt(r), replace: [terrainType.stone] });
        Stamps.stamp("factory", new Vector(3700, -30), { useDirtFrom: generator, replaceMatching: (r, w) => TerrainManager.isDirt(r), replace: [terrainType.stone] });
    });

    World.init();

    Terrain.draw();
    PixelDrawer.update();

    DebugDraw.graphics = new PIXI.Graphics();
    DebugDraw.graphics.visible = false;

    app.stage.addChild(DebugDraw.graphics);


    printText = ""

    background = PIXI.RenderTexture.create({ width: Camera.width, height: Camera.height });
    entityRender = PIXI.RenderTexture.create({ width: Camera.width, height: Camera.height });

    new Drone(new Vector(4500, 460), undefined);
    new Drone(new Vector(4400, 530), undefined);
    new Drone(new Vector(3200, 530), undefined);
    new Drone(new Vector(2800, 530), undefined);


    DebugDraw.graphics.addChild(Shadowmap.graphic);

    let frameByFrame = false;

    let scannerData: PositionableGuiElement;
    let currentMusic: HTMLAudioElement;

    let timeElapsed = 0;

    for (const name in Terrain.sound) {
        terrainNoises[name].play();
        terrainNoises[name].loop = true;
        terrainNoises[name].volume = 0;
    }

    let colorGradeOld: colorGradeOptions = colorGradeFilter.styles.dust;
    let colorGradeNew: colorGradeOptions = {};
    let biomeTime = 0;

    ticker.add((delta) => {

        if (terrainScore < 80 && tps / tpsMeter < 0.12 && (1000 / Math.max(...dtAvg)) > 50) {
            terrainUpdate();
        }

        /*
        if (!(key[" "] && !frameByFrame)) {
            frameByFrame = key[" "];
            return;
        }
        frameByFrame = key[" "];*/

        app.renderer.render(bg, { renderTexture: background });
        app.renderer.render(ParallaxDrawer.container, { renderTexture: background, clear: false });
        app.renderer.render(Entity.graphic, { renderTexture: background, clear: false });
        app.renderer.render(ParticleSystem.parentContainer, { renderTexture: background, clear: false });

        debugPrint("terrainScore:" + terrainScore.toFixed(1));
        terrainScore *= 0.98;
        let diff = performance.now() - lastTime;
        const dt = Math.min(.1, diff / 2000);
        lastTime = performance.now();
        dtAvg.shift();
        dtAvg.push(diff);
        tpsMeter += diff;

        timeElapsed += dt;

        updateInfo -= diff;

        if (Progress.timeUnlocked)
            Atmosphere.settings.sunAngle += dt / 20;
        //Atmosphere.settings.sunAngle = new Vector((mouse.x / window.innerWidth - .5) * window.innerWidth/window.innerHeight, mouse.y / window.innerHeight - .5).toAngle();
        //Atmosphere.settings.sunAngle = -1.5;

        Atmosphere.settings.sunPosition = Vector.fromAngle(Atmosphere.settings.sunAngle).mult(Camera.width / 2 * .6).add(new Vector(Camera.width / 2, Camera.height * .5));
        let sunFac = (-Vector.fromAngle(Atmosphere.settings.sunAngle).y);

        if (sunFac < 0 && !Progress.firstNight) {
            Progress.firstNight = true;
            new TutorialPrompt({ content: "*The sun is setting.* At night, visibility is lowered and enemies are more dangerous. However, your *oxygen supply* depletes slower.<br>Press [e] to dismiss.", keys: ["e"] });
        }

        let sunHor = 1 - Math.abs(Vector.fromAngle(Atmosphere.settings.sunAngle).y);
        Atmosphere.settings.ambientLight = Color.fromHsl(lerp(10, 20, clamp(sunFac * 4)), clamp(.6 - sunFac), clamp(sunFac + .2));
        const nightColor = Color.fromHsl(lerp(280, 230, clamp(-sunFac * 2)), clamp(-sunFac * 2 + .3) * .6, Math.max(.05, (clamp(-sunFac + .6) * .1)));

        Atmosphere.settings.ambientLight = Atmosphere.settings.ambientLight.add(nightColor)
        Atmosphere.settings.sunIntensity = clamp(clamp(sunFac + .2) * Math.max(.4, sunHor * 2));

        let worldData = World.getDataFrom(player.position.x);
        colorGradeBiome = colorGradeFilter.mixSettings(colorGradeOld, colorGradeNew, biomeTime / 2);
        let colorGradePollution = colorGradeFilter.mixSettings(colorGradeFilter.styles.blank, colorGradeBiome, worldData.pollution / 100);
        colorGrade.options = colorGradeFilter.mixSettings(colorGradeFilter.mixSettings(colorGradeFilter.styles.night, colorGradeFilter.styles.sunset, (sunFac * 3 + 1.5)), colorGradePollution, sunFac * 4 + 1);


        /* terrain noises */
        debugPrint("Terrain noises:");

        for (const name in Terrain.sound) {
            const soundLevel = Terrain.sound[name as keyof typeof Terrain.sound] / Terrain.soundVolumeMulitplier[name]
            terrainNoises[name].volume = clamp(soundLevel, 0, 0.5);
            debugPrint(`    ${name}:` + soundLevel.toFixed(2));
        }

        if (updateInfo <= 0) {
            updateInfo = 250;
            debugPrint("Local Status:");

            debugPrint(Object.entries(worldData).map(e => `\t${e[0]}: ${e[1].toFixed(1)}`).join("\n"));

            debugText.text = printText;
        }
        printText = ""

        if (key["arrowleft"]) Camera.position.x -= camspeed;
        if (key["arrowright"]) Camera.position.x += camspeed;
        if (key["arrowup"]) Camera.position.y += camspeed;
        if (key["arrowdown"]) Camera.position.y -= camspeed;
        player.input = new Vector();
        if (Progress.controlsUnlocked) {
            if (key["a"]) player.input.x -= 1;
            if (key["d"]) player.input.x += 1;
            if (key["w"] || key[" "]) player.input.y += 1;
            if (key["s"]) player.input.y -= 1;
            if (key["shift"]) player.run = true;
            else player.run = false;
        }

        const [wx, wy] = screenToWorld(mouse).xy();
        debugPrint(screenToWorld(mouse).toString());

        let newBiome = generator.getBiome(player.position.x);

        if (timeElapsed > 1) {
            biomeTime += dt;
            if (newBiome.biomeId != currentBiome) {
                if (Progress.visitedBiomes.includes(newBiome.biomeId)) {
                    new GuiSplash(newBiome.name, false)
                }
                else {
                    if (Progress.visitedBiomes.length == 1) {
                        new TutorialPrompt({ content: "You have just visited a *new biome*. The game has multiple areas, or biomes, that you can explore. Each biome offers unique resources, challenges, and sights.<br>Press [e] to dismiss.", keys: ["e"] });
                    }
                    Progress.visitedBiomes.push(newBiome.biomeId);
                    new GuiSplash(newBiome.name, true)
                }
                biomeTime = 0;
                colorGradeOld = colorGradeBiome;
                colorGradeNew = newBiome.colorGrade;
                newBiome.music.play();
                currentBiome = newBiome.biomeId;
            }

            smokeBuildup += dt;
            while (smokeBuildup >= .01) {
                smokeBuildup -= .01;
                let smokeX = Math.round(Camera.position.x + random(-50, Camera.width + 50));
                if (smokeX > 20 && smokeX < Terrain.width - 20) {
                    let toxicity = World.getDataFrom(smokeX).pollution / 100;
                    if (toxicity > random(.5, .9)) {
                        let smokeY = Terrain.getHeight(smokeX);
                        toxicGas.spawnParticle(new Vector(smokeX, smokeY));
                    }
                }
            }
        }
        if (mouse.clicked == 1) {
            if (player.energy > 0 && player.weaponCooldown == 0 && player.weaponArmed) {
                player.weaponCooldown = player.weaponCooldownMax;
                GUI.cursorElement.classList.add("reloading");
                new Projectile(player, new Vector(wx, wy), new Vector(0, -20));
                player.energy -= .2;
            }
            GUI.energyBar.fill = player.energy / 10;
            if (Entity.hoveredEntity) {
                GUI.sounds.click.play();
                Entity.hoveredEntity.click();
            }
        }

        if (Progress.terrainUnlocked) {
            if (mouse.pressed == 1 && !Buildable.currentBuildable && !Entity.hoveredEntity && !player.weaponArmed) {
                const type = preferences.selectedTerrainType;
                const vol = preferences.penSize * preferences.penSize * 4;
                Terrain.addSound(type, vol);
                for (let x = 0; x < preferences.penSize; x++) {
                    for (let y = 0; y < preferences.penSize; y++) {
                        const xx = Math.floor(wx + x - preferences.penSize / 2)
                        const yy = Math.floor(wy + y - preferences.penSize / 2)
                        if (Terrain.testValid(xx, yy))
                            Terrain.setAndUpdatePixel(xx, yy, preferences.selectedTerrainType != terrainType.dirt00 ? preferences.selectedTerrainType : generator.getLocalDirt(
                                new Vector(Math.floor(wx + x - preferences.penSize / 2), Math.floor(wy + y - preferences.penSize / 2))
                            ));
                    }
                }
            } else if (mouse.pressed == 2 && !Buildable.currentBuildable) {
                for (let x = 0; x < preferences.penSize; x++) {
                    for (let y = 0; y < preferences.penSize; y++) {
                        const coordX = Math.floor(wx + x - preferences.penSize / 2)
                        const coordY = Math.floor(wy + y - preferences.penSize / 2)
                        if (Terrain.testValid(coordX, coordY)) {
                            const type = Terrain.getPixel(coordX, coordY);
                            Terrain.addSound(type, 10);
                            Terrain.setAndUpdatePixel(coordX, coordY, terrainType.void);
                        }
                    }
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


        if (key["f9"]) {
            key["f9"] = false;
            preferences.debugMode++;
            preferences.debugMode %= Object.keys(DebugMode).length / 2;
            if (preferences.debugMode != DebugMode.off) {
                Entity.graphic.filters = [];
                PixelDrawer.graphic.filters = [];
                DebugDraw.graphics.visible = true;
            } else {
                DebugDraw.graphics.visible = false;
                Entity.graphic.filters = [new HighlightFilter(1, 0xFF9955, .1)];
                PixelDrawer.graphic.filters = [new HighlightFilter(1, 0xFF9955, .6), new AtmosphereFilter(.9)];
            }
        }
        if (key["f10"]) {
            key["f10"] = false;
            preferences.showDebug = !preferences.showDebug;
            debugText.visible = preferences.showDebug;
        }
        seedCooldown -= dt;
        if (!Buildable.currentBuildable) {
            if (key["f"] && seedCooldown <= 0) {
                placeSeed();
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

        if (Scanner.scanners.length > 0) {
            scannerData.element.innerHTML = "<table class='scanners'><tr><th>scanner</th><th>CO2</th><th>pollution</th>" + Scanner.scanners.map((s, i) => {
                const data = World.getDataFrom(s.position.x)
                return `<tr><td>${s.name}</td><td>${data.co2.toFixed(0)}ppm</td><td>${data.pollution > 0 ? data.pollution.toFixed(1) : 0}%</td></tr>`
            }).join("\n") + "</table>";
        } else {
            scannerData.element.innerHTML = "no scanners deployed"
        }
        SoundManager.update(dt);
        Terrain.draw();
        ParallaxDrawer.update();
        Entity.update(dt);
        ParticleSystem.update(dt);
        Buildable.update(dt);
        World.update(dt);
        GUI.update(dt);
        for (const c of cloudList) {
            c.graphic.position.x += 15 * dt * c.depth;
        }
        Lightmap.update();
        app.renderer.render(Lightmap.graphic, { renderTexture: Lightmap.texture, clear: true });
        PixelDrawer.update();
        //app.renderer.render(app.stage,{ renderTexture: mainRenderTexture, clear: true });
        app.render();
        DebugDraw.clear()
        Camera.position.x = Math.round(player.camTarget.x);
        Camera.position.y = Math.round(player.camTarget.y);
        mouse.clicked = 0;
    });

    let introDialogue = new NodeStack(
        new TopNode("You stumble out of the pod.", 0)
            .chain("The surroundings look nothing like the pictures of Earth that you've seen.")
            .choice([
                new TopNode("What happened?")
                    .chain("The landing pod you just disembarked seems heavily damaged and there is a fire in the fuel tank.", 0)
                    .chain("You don't remember the last few minutes very well, but if you had to guess, there was a problem with the landing thrusters.", 0)
                    .chain("Thankfully, you don't feel any injuries besides a minor headache.", 0)
                    .chain("As the fire suppression system slowly puts out the flames, you notice a status light from the radio panel. It still appears to be functional.", 0)
                    .finish(),
                new TopNode("This place looks more like Mars.")
                    .chain("You know you crash-landed on Earth, but the dusty, orange atmosphere looks hostile and unbreathable.", 0)
                    .chain("A glance at the scenery tells a tale of destruction and abandonment.", 0)
                    .chain("The pod was damaged in the landing, but the radio appears still functional.", 0)
                    .finish(),
            ])
            .chain("I should try to call *Mission Control*.", 2)
            .chain("After a moment of static, the display lights up.", 0)
            .chain("-ssion control to ERA-1, repeat, we have lost-", 1)
            .reply("ERA-1 calling Mission Control.")
            .reply("It appears the signal is back! Hello, Agent.")
            .chain("What is your status?")
            .choice([
                new TopNode("The landing was rough.", 2)
                    .chain("The pod is heavily damaged, but I don't think I'm injured.")
                    .finish(),
                new TopNode("I've been better...")
            ])
            .condition(() => { return !skipIntro },
                new TopNode("We need to check your vitals.", 1)
                    .chain("Can you try walking around for a while?")
                    .callback(moveTutorial)
                    .chain("I can move without problem.", 2)
                    .finish(),
                new TopNode("You seem fine.", 1)
            )
            .chain("Good to know.", 1)
            .chain("Anyway, get to work. *Plant me some trees* before dawn or your food resupply pod will have a malfunction.")
            .choice([
                new TopNode("Yes sir"),
                new TopNode("Pla- what?")
                    .chain("What the hell are you talking about?", 2)
                    .reply("Stop complaining, Agent. I know you read the game description so you know that this game is about planting trees.")
                    .reply("But...")
                    .chain("What about the gameplay? The exploration? And all the cool environments you promised?")
                    .reply("Yeah, that's not happening. Get to work.")
                    .finish()
            ])
            .chain("The Director or whoever it is has disconnected.", 0)
            .chain("Get to work.")
            .callback(() => sleep(3000))
            .finish()
    )


    /* setTimeout(() => {
        firstNode.execute();
    }, 1000); */

    /* setTimeout(() => {
        new DialogBox("Good morning. Máš hlad? Měl bys jít jíst. Pomůže to. Věř mi. Už jsem taky měl hlad, a zkusil jsem jít jíst, a fakt to pomohlo, nemůžu to víc doporučit.\nOk, teď jdi fakt jíst.", 1);
        new DialogChoices([
            { content: "Ano", callback: () => { new DialogBox("Jdu jíst.", 2) } },
            { content: "Ne", callback: () => { new DialogBox("Nemám hlad.", 2) } }
        ]);
    }, 1000); */
    let devBar = new CollapsibleGuiElement({ position: 2, edge: "left", content: "Development options", flexDirection: "column", hidden: true })
    new GuiButton({ width: 8, content: "Talk", callback: () => { introDialogue.execute(); }, parent: devBar.container })
    new GuiButton({ width: 8, content: "Tutorial", callback: () => { moveTutorial() }, parent: devBar.container })
    new GuiButton({ width: 8, flexDirection: "row", image: "ui/icon-day.png", content: "Day", callback: () => { Atmosphere.settings.sunAngle = -2 }, parent: devBar.container })
    new GuiButton({ width: 8, flexDirection: "row", image: "ui/icon-night.png", content: "Night", callback: () => { Atmosphere.settings.sunAngle = 1; }, parent: devBar.container })


    function placeSeed() {
        if (!Buildable.currentBuildable && seedCooldown <= 0) {
            seedCooldown = .2;
            new Sapling(player.position.result(), randomTreeSettings());
            //new Sapling(player.position.result(), deadTreeSettings);
        }
    }

    function placePole() {
        if (!Buildable.currentBuildable && seedCooldown <= 0) {
            seedCooldown = .2;
            new Pole(player.position.result(), false);
        }
    }

    function placeTurbine() {
        if (!Buildable.currentBuildable && seedCooldown <= 0) {
            seedCooldown = .2;
            new Turbine(player.position.result(), false);
        }
    }

    function placeScanner() {
        if (!Buildable.currentBuildable && seedCooldown <= 0) {
            seedCooldown = .2;
            new Scanner(player.position.result(), false);
        }
    }


    let buildingToolbar = new CollapsibleGuiElement({ position: 2, edge: "right", content: "Build menu", hidden: true });

    new GuiButton({ width: 5, content: "Seed", callback: () => { placeSeed() }, parent: buildingToolbar.container })
    new GuiButton({ width: 5, content: "Pole", callback: () => { placePole() }, parent: buildingToolbar.container })
    new GuiButton({ width: 5, content: "Turbine", callback: () => { placeTurbine() }, parent: buildingToolbar.container })
    new GuiButton({ width: 5, content: "Scanner", callback: () => { placeScanner() }, parent: buildingToolbar.container })

    let terrainEditingToolbar = new CollapsibleGuiElement({ position: 11, edge: "right", content: "Terrain Editing", hidden: true });

    new GuiButton({ width: 5, image: "ui/dirt.png", content: "Dirt", callback: () => { preferences.selectedTerrainType = terrainType.dirt00 }, parent: terrainEditingToolbar.container })
    new GuiButton({ width: 5, image: "ui/sand.png", content: "Sand", callback: () => { preferences.selectedTerrainType = terrainType.sand }, parent: terrainEditingToolbar.container })
    new GuiButton({ width: 5, image: "ui/water.png", content: "Water", callback: () => { preferences.selectedTerrainType = terrainType.water1 }, parent: terrainEditingToolbar.container })
    new GuiButton({ width: 5, image: "ui/grass.png", content: "Grass", callback: () => { preferences.selectedTerrainType = terrainType.grass0 }, parent: terrainEditingToolbar.container })
    new GuiButton({ width: 5, image: "ui/delete.png", content: "Remove", callback: () => { preferences.selectedTerrainType = terrainType.void }, parent: terrainEditingToolbar.container })

    scannerData = new PositionableGuiElement({ position: new Vector(25, 25), invertHorizontalPosition: true, invertVerticalPosition: true, hidden: true })
    let characterToolbar = new PositionableGuiElement({ position: new Vector(25, 25), invertHorizontalPosition: false, invertVerticalPosition: true, hidden: false, flexDirection: "row" })
    let statsPanel = new GuiPanel({ blankStyle: true, parent: characterToolbar })
    GUI.healthBar = new GuiProgressBar({ parent: statsPanel, progress: 1, label: "Health", labelWidth: 4, color: "health", warnThreshold: .5 });
    GUI.energyBar = new GuiProgressBar({ parent: statsPanel, progress: 1, label: "Energy", labelWidth: 4, color: "energy", warnThreshold: .3 });
    GUI.oxygenBar = new GuiProgressBar({ parent: statsPanel, progress: 1, label: "Oxygen", labelWidth: 4, color: "oxygen", warnThreshold: .3 });

    GUI.weaponButton = new GuiButton({ width: 5, content: "Arm weapon", callback: () => { player.toggleWeapon() }, parent: characterToolbar, classes: ["centered"] })

    async function moveTutorial() {
        Progress.controlsUnlocked = true;
        await new TutorialPrompt({ content: "Press [A] and [D] to move around.", keys: ["A", "D"] }).awaitDone;
        await new TutorialPrompt({ content: "Hold [Shift] while moving to run faster.", keys: ["shift"] }).awaitDone;
        await new TutorialPrompt({ content: "Press [W] to jump.", keys: ["W"] }).awaitDone;
        if (!skipIntro) Progress.controlsUnlocked = false;
    }

    async function activateTutorial() {
        player.oxygenModifier = 0;
        await introDialogue.execute();
        //await moveTutorial();
        Progress.controlsUnlocked = true;
        await uiTutorial();
        player.oxygenModifier = 1;
    }

    async function uiTutorial() {
        await new TutorialPrompt({ content: "Welcome to *Revenant Earth*! This tutorial will guide you through the user interface.<br>Press [e] to continue.", keys: ["e"] }).awaitDone;
        await buildingToolbar.fadeIn();
        await buildingToolbar.setCollapse(false);
        await new TutorialPrompt({ content: "The *build menu* allows you to plant seeds or construct buildings.<br>Press [e] to continue.", keys: ["e"], centerX: false, position: new Vector(25, 220), invertHorizontalPosition: true }).awaitDone;
        buildingToolbar.setCollapse(true);
        await terrainEditingToolbar.fadeIn();
        await terrainEditingToolbar.setCollapse(false);
        Progress.terrainUnlocked = true;
        await new TutorialPrompt({ content: "The *terrain editing toolbar* allows you to edit the terrain. Select a terrain type, then place it by clicking or holding the [Left mouse button] in the game world.<br>You can delete terrain with the [Right mouse button].<br>Press [e] to continue.", keys: ["e"], centerX: false, position: new Vector(25, 420), invertHorizontalPosition: true }).awaitDone;
        terrainEditingToolbar.setCollapse(true);
        await devBar.fadeIn();
        await devBar.setCollapse(false);
        await new TutorialPrompt({ content: "This is the *Development menu*. It allows you to access special functions to test features of the game.<br>It is recommended to *avoid using it* if you want to enjoy the game as intended.<br>Press [e] to continue.", keys: ["e"], centerX: false, position: new Vector(25, 420) }).awaitDone;
        await devBar.setCollapse(true);
        scannerData.fadeIn();
        Progress.timeUnlocked = true;
        await new TutorialPrompt({ content: "That's it! Explore the game world and try all the different options!", duration: 8 }).awaitDone;
    }

    const key: Record<string, boolean> = {};
    window.addEventListener("keydown", (e) => { key[e.key.toLowerCase()] = true; });
    window.addEventListener("keyup", (e) => { key[e.key.toLowerCase()] = false });
    window.addEventListener("mousedown", (e) => { if (!mouse.gui) { mouse.pressed = e.buttons; mouse.clicked = e.buttons } e.preventDefault() });
    window.addEventListener("mouseup", (e) => { mouse.pressed = e.buttons });

    ticker.start();
    terrainUpdateCycle();

    //skipIntro = false;

    if (!skipIntro) {
        setTimeout(() => {
            activateTutorial();
        }, 8000);
    }
    else {
        //uiTutorial();
        //moveTutorial();
        devBar.fadeIn();
        buildingToolbar.fadeIn();
        terrainEditingToolbar.fadeIn();
        scannerData.fadeIn();
        Progress.controlsUnlocked = true;
        Progress.timeUnlocked = true;
        Progress.terrainUnlocked = true;
    }

}
GUI.init();


window.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; GUI.cursorElement.style.top = `${e.clientY}px`; GUI.cursorElement.style.left = `${e.clientX}px`; });


export function screenToWorld(vector: { x: number, y: number }) {
    const pixelRatio = Camera.height / window.innerHeight;
    const scaled = {
        x: (vector.x - .5 * window.innerWidth) / Camera.scale + window.innerWidth / 2,
        y: (vector.y - .5 * window.innerHeight) / Camera.scale + window.innerHeight / 2,
    }
    return new Vector(
        Camera.position.x + (scaled.x * pixelRatio),
        Camera.position.y + Camera.height - (scaled.y * pixelRatio));
}
export function worldToScreen(vector: { x: number, y: number }) {
    const pixelRatio = Camera.height / window.innerHeight;
    const unscaled = new Vector(
        (vector.x - Camera.position.x) / pixelRatio,
        ((-vector.y) + Camera.position.y + Camera.height) / pixelRatio);
    return new Vector(
        (unscaled.x - window.innerWidth / 2) * Camera.scale + window.innerWidth / 2,
        (unscaled.y - window.innerHeight / 2) * Camera.scale + window.innerHeight / 2
    )
}
export function worldToRender(vector: { x: number, y: number }) {
    const pixelRatio = Camera.height / window.innerHeight;
    return new Vector(
        (vector.x - Camera.position.x) / pixelRatio,
        ((-vector.y) + Camera.position.y + Camera.height) / pixelRatio);
}

export function gameOver() {
    let s = new GuiSplash("You died", false);
    let black = document.createElement("div");
    black.classList.add("fade");
    document.body.appendChild(black);
    setTimeout(() => {
        black.style.opacity = "1";
        setTimeout(() => {
            let a = new CustomGuiElement("div", "You died.", "introText", "ui", "blank", "small");
            black.appendChild(a.element);
            setTimeout(() => {
                let b = new CustomGuiElement("div", "I didn't develop this screen yet so you can enjoy staring at the black screen and listening as the drones bombard your corpse.", "introText", "ui", "blank", "small");
                black.appendChild(b.element);
                setTimeout(() => {
                    let c = new CustomGuiElement("div", "You can also reload the page I guess.", "introText", "ui", "blank", "small");
                    black.appendChild(c.element);
                }, 8000);
            }, 8000);
        }, 1000);
    }, 1000);
}