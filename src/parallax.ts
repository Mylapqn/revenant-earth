import { HslAdjustmentFilter } from "@pixi/filter-hsl-adjustment";
import { Container, Sprite } from "pixi.js";
import { Camera } from "./camera";
import { AtmosphereFilter } from "./shaders/atmosphere/atmosphereFilter";
import { SkyFilter } from "./shaders/atmosphere/skyFilter";
import { HighlightFilter } from "./shaders/outline/highlightFilter";
import { Vector } from "./vector";

export class ParallaxDrawer {
    static container = new Container();
    static layers: { sprite: Sprite, depth: number }[] = [];
    static update() {
        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i];
            let camPos = Camera.position.result().add(new Vector(0, -450)).mult(-1 * layer.depth);
            layer.sprite.position.set(camPos.x, -camPos.y);
        }
    }
    static addLayer(sprite: Sprite | string, depth: number) {
        if (!(sprite instanceof Sprite)) sprite = Sprite.from(sprite);
        this.container.addChild(sprite);
        sprite.filters = [];
        if (depth <= 0.0) {
            sprite.filters.push(new SkyFilter());
        }
        else {
            sprite.filters.push(new HighlightFilter(6 * depth, 0xFF9955, .4));
            //sprite.filters.push(new HslAdjustmentFilter({alpha:1-depth,colorize:true,hue:17,saturation:.57,lightness:.81}));
        }
        sprite.filters.push(new AtmosphereFilter(depth));
        this.layers.push({ sprite: sprite, depth: depth });
    }
}