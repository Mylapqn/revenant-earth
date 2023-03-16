import { Graphics, SHAPES } from "pixi.js";
import { Color } from "../../color";
import { Entity } from "../../entity";
import { random } from "../../utils";
import { Vector } from "../../vector";

export class Rock extends Entity {
    graphics: Graphics;
    color: Color;
    constructor(position: Vector, parent: Entity = null, size = 10, heightRatio = 1, angle = 0) {
        const graph = new Graphics();
        super(graph, position, parent);
        this.color = Color.randomAroundHSL(10, 5, .2, .05, .35, .05);
        this.graphics.beginFill(this.color);
        let pts: Vector[] = [];
        let steps = 16;
        let rand = size / 4;
        for (let i = 0; i < 16; i++) {
            const angle = Math.PI * 2 / steps * i
            let pos = Vector.fromAngle(angle).mult(size);
            pos.y *= heightRatio
            pos.x += random(-1, 1) * rand;
            pos.y += random(-1, 1) * rand;
            if (i == 0) this.graphics.moveTo(...pos.xy())
            else this.graphics.lineTo(...pos.xy());
        }
        this.graphics.endFill;
        this.graphics.angle = angle;
    }
}