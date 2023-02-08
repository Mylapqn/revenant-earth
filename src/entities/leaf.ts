import { Sprite } from "pixi.js";
import { Entity } from "../entity";
import { randomColor } from "../utils";
import { Vector } from "../vector";
import { Stick } from "./stick";


export class Leaf extends Entity {
    age = 0;
    constructor(position: Vector, parent?: Entity, angle = 0) {
        const graph = Sprite.from("leaf.png")
        graph.tint = randomColor(230, 255);
        graph.scale.set(0);
        super(graph, position, parent, angle);
    }

    update() {
        this.updatePosition();
        if (this.age == 150) return;
        this.graphics.scale.set(this.age / 150);
        this.queueUpdate();
        this.age++;
    }
}