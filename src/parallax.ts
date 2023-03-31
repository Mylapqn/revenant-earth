import { HslAdjustmentFilter } from "@pixi/filter-hsl-adjustment";
import { AnimatedSprite, Container, Graphics, Sprite, Texture } from "pixi.js";
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
            sprite.filters.push(new LightingFilter());
            sprite.filters.push(new HighlightFilter(1, 0xFF9955, .2));
            //sprite.filters.push(new HslAdjustmentFilter({alpha:1-depth,colorize:true,hue:17,saturation:.57,lightness:.81}));
        }
        sprite.filters.push(new AtmosphereFilter(depth / 1.2));
        if (depth <= 0.0) {
            sprite.filters.push(new SkyFilter());
        }
        this.layers.push({ sprite: sprite, depth: depth });
    }
}

export class Backdrop {
    depth: number;
    surface: number[] = [];
    graphics: Graphics;
    constructor(depth: number) {
        this.depth = depth;
        this.graphics = new Graphics();
        this.graphics.zIndex = depth;
        ParallaxDrawer.addLayer(this.graphics, depth);
    }

    setHeight(x: number, y: number) {
        const localX = Math.floor(x * this.depth);
        const localY = Math.floor(y * this.depth);
        this.graphics.lineStyle(1, 0x995555, 1);
        this.graphics.moveTo(localX, -localY + Terrain.height * this.depth - 300 * this.depth + 50);
        this.graphics.lineTo(localX, Terrain.height * this.depth + 300 * this.depth + 50);
        this.surface[localX] = -localY + Terrain.height * this.depth - 300 * this.depth + 50;
    }

    placeContainer(x: number, container: Sprite) {
        const localX = Math.floor(x * this.depth);
        container.anchor.set(0.5, 1);
        container.position.set(localX, Math.floor(this.surface[localX]));
        container.scale.set(this.depth);

        this.graphics.addChild(container);
    }
}

export class BackdropProp {
    depth: number;
    graphics: Graphics;
    constructor(depth: number) {
        this.depth = depth;
        this.graphics = new Graphics();
        this.graphics.zIndex = depth;
        ParallaxDrawer.addLayer(this.graphics, depth);
    }
}