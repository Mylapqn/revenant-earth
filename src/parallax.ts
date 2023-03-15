import { HslAdjustmentFilter } from "@pixi/filter-hsl-adjustment";
import { Container, Sprite } from "pixi.js";
import { Camera } from "./camera";
import { Vector } from "./vector";

export class ParallaxDrawer {
    static container = new Container();
    static layers: { sprite: Sprite, depth: number }[] = [];
    static update() {
        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i];
            let camPos = Camera.position.result().add(new Vector(0,-450)).mult(-1*layer.depth);
            layer.sprite.position.set(camPos.x,-camPos.y);
        }
    }
    static addLayer(sprite: Sprite | string, depth: number) {
        if (!(sprite instanceof Sprite)) sprite = Sprite.from(sprite);
        this.container.addChild(sprite);
        sprite.filters = [new HslAdjustmentFilter({alpha:1-depth,colorize:true,hue:17,saturation:.57,lightness:.81})]
        this.layers.push({ sprite: sprite, depth: depth });
    }
}