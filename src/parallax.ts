import { HslAdjustmentFilter } from "@pixi/filter-hsl-adjustment";
import { AnimatedSprite, Container, Graphics, Rectangle, Renderer, Sprite, Texture } from "pixi.js";
import { Camera } from "./camera";
import { AtmosphereFilter } from "./shaders/atmosphere/atmosphereFilter";
import { SkyFilter } from "./shaders/atmosphere/skyFilter";
import { LightingFilter } from "./shaders/lighting/lightingFilter";
import { HighlightFilter } from "./shaders/outline/highlightFilter";
import { Terrain } from "./terrain";
import { Vector } from "./vector";

export class ParallaxDrawer {
    static container = new Container();
    static {
        this.container.sortableChildren = true;
    }
    static layers: { sprite: Container, depth: number }[] = [];
    static update() {
        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i];
            let camPos = Camera.position.result().add(new Vector(Camera.width / 2, -450)).mult(-1 * layer.depth);
            layer.sprite.position.set(Math.floor(Camera.width / 2 + camPos.x), Math.floor(-camPos.y));
        }
    }
    static addLayer(sprite: Container | string, depth: number) {
        if (!(sprite instanceof Container)) sprite = Sprite.from(sprite);
        this.container.addChild(sprite);
        sprite.filters = [];
        if (depth <= 0.0) {
            //sprite.filters.push(new SkyFilter());
        }
        else {
            sprite.filters.push(new LightingFilter(sprite));
            sprite.filters.push(new HighlightFilter(1, 0xFF9955, .2));
            //sprite.filters.push(new HslAdjustmentFilter({alpha:1-depth,colorize:true,hue:17,saturation:.57,lightness:.81}));
        }
        sprite.filters.push(new AtmosphereFilter(depth / 1.2));
        if (depth <= 0.0) {
            sprite.filters.push(new SkyFilter());
        }
        sprite.filterArea = new Rectangle(0, 0, Camera.width, Camera.height);
        this.layers.push({ sprite: sprite, depth: depth });
    }
}

export class Backdrop {
    depth: number;
    surface: number[] = [];
    container: Container;
    graphics: Graphics;
    constructor(depth: number) {
        this.depth = depth;
        this.graphics = new Graphics();
        this.container = new Container();
        this.container.zIndex = depth;
        this.container.addChild(this.graphics);
        ParallaxDrawer.addLayer(this.container, depth);
    }

    setHeight(x: number, y: number) {
        const localX = Math.floor(x * this.depth);
        const localY = Math.floor(y * this.depth);
        this.graphics.lineStyle(1, 0x995544, 1);
        const surface = -localY + Terrain.height * this.depth - 400 * Math.pow(this.depth, 0.8) + 110;
        this.graphics.moveTo(localX, surface);
        this.graphics.lineTo(localX, Terrain.height * this.depth + 300 * this.depth + 50);
        this.surface[localX] = surface
    }

    placeSprite(x: number, yOffset = 0, sprite: Sprite, depthScaling = true, lowestAround = 1) {
        const localX = Math.floor(x * this.depth);
        sprite.anchor.set(0.5, 1);

        let lowest = this.surface[localX];
        for (let x = localX - lowestAround; x < localX + lowestAround; x++) {
            if (lowest < this.surface[x]) lowest = this.surface[x];
        }

        sprite.position.set(localX, Math.floor(lowest - yOffset * this.depth));
        if (depthScaling) sprite.scale.set(this.depth);

        this.container.addChildAt(sprite, 0);
    }
}

export class BackdropProp {
    depth: number;
    container: Container;
    graphic: Container;
    depthScaling: boolean;
    scaleMult: number;
    constructor(depth: number, graphic: Container, scale = 1, depthScaling = true) {
        this.scaleMult = scale;
        this.depthScaling = depthScaling;
        this.depth = depth;
        this.container = new Container();
        this.graphic = graphic;
        this.container.zIndex = depth;
        this.container.addChild(graphic);
        if (this.depthScaling) graphic.scale.set(depth * this.scaleMult);
        ParallaxDrawer.addLayer(this.container, depth);
    }
}