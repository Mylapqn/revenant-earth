import { Graphics, Color } from "pixi.js";
import { Entity } from "../../entity";
import { random, lerp } from "../../utils";
import { Vector } from "../../vector";

export class Cable extends Entity {
    graphics: Graphics;
    age = 0;
    fromVec: Vector;
    toVec: Vector;
    color: number;
    thickness: number;
    length: number;
    targetLength: number;
    constructor(from: Vector, to: Vector, length = 100, thickness = 1, color = 0x555555) {
        const graph = new Graphics();
        super(graph, from, null);
        this.color = color;
        this.thickness = thickness;
        this.length = length;
        this.setEndpoints(from, to);

    }
    setEndpoints(from = this.fromVec, to = this.toVec) {
        this.position = from.result();
        this.fromVec = from.result();
        this.toVec = to.result();
        this.draw();
    }
    draw() {
        this.graphics.clear();
        let relativeTo = this.toVec.result().sub(this.fromVec);
        let distance = relativeTo.length();
        this.targetLength = distance;
        if (distance > this.length) {
            relativeTo = relativeTo.normalize(this.length);
            distance = this.length;
        }
        let gravity = (this.length - distance) / 2;
        relativeTo.y *= -1;
        const third = relativeTo.result().mult(.333);
        const third2 = third.result().mult(2);
        this.graphics.lineStyle({ color: this.color, width: this.thickness });
        this.graphics.bezierCurveTo(third.x, third.y + gravity, third2.x, third2.y + gravity, relativeTo.x, relativeTo.y);
    }
    update(dt: number): void {
        this.updatePosition()
        this.queueUpdate()
        return;
    }
}