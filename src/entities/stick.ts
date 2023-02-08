import { Sprite } from "pixi.js";
import { Entity } from "../entity";
import { Vector } from "../vector";
import { Leaf } from "./leaf";


export class Stick extends Entity {
    age = 0;
    depth = 0;
    phase = 0;
    constructor(position: Vector, parent?: Entity, angle = 0, depth = 1) {
        const graph = Sprite.from("stick.png");
        graph.scale.set(0);
        super(graph, position, parent, angle);
        this.depth = depth;
        if(parent)
        this.phase = this.parent.position.x / 100;
        graph.anchor.set(0.5, 1);
    }

    update() {
        if ("phase" in this.parent) {
            this.phase = this.parent.phase as number;
        } else {
            this.phase += 0.01;
        }

        this.angle = Math.cos(this.phase) / 1000 + this.angle;
        this.updatePosition();
        if (this.depth < 3 && this.age == 50) {
            for (let i = 0; i < 5; i++) {
                new Stick(new Vector(0, 25), this, Math.random() * 3 - 1.5, this.depth + 1)
            }
        } else if (this.depth == 3 && this.age > 50 && this.age < 100 && this.age % 10 == 0) {
            new Leaf(new Vector(Math.random() * 10, Math.random() * 25), this, Math.random() * 4 - 2)
        }

        this.queueUpdate();
        if (this.age == 150) return;
        this.graphics.scale.set(this.age / 150, this.age / 150);
        this.age++;
    }
}