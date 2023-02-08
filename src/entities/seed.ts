import { Sprite } from "pixi.js";
import { Entity } from "../entity";
import { Vector } from "../vector";
import { Stick } from "./stick";


export class Seed extends Entity {
    age = 0;
    constructor(position: Vector, parent?: Entity, angle = 0) {
        const graph = Sprite.from("seed.png")
        super(graph, position, parent, angle);
    }

    update() {
        this.updatePosition();
        if (this.age == 500) {
            new Stick(new Vector(0, 0), this, 0.3);
        }

        if (this.age == 500) return;
        this.graphics.scale.set(this.age / 500);
        this.queueUpdate();
        this.age++;
    }
}