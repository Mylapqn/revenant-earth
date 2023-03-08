import { Sprite } from "pixi.js";
import { Entity } from "../../../entity";
import { randomColor } from "../../../utils";
import { Vector } from "../../../vector";
import { Seed } from "./seed";


export class Leaf extends Entity {
    age = 0;
    seed: Seed;
    constructor(position: Vector, parent: Entity, seed: Seed, angle = 0) {
        const graph = Sprite.from("leaf.png")
        graph.tint = randomColor(230, 255);
        graph.scale.set(0);
        super(graph, position, parent, angle);
        graph.anchor.set(0.5);
        this.seed = seed;
    }

    update() {
        this.updatePosition();
        if (this.age == 150) return;
        this.graphics.scale.set(this.age / 150);
        this.queueUpdate();
        if (Math.random() < 10 / this.age) {
            if(this.seed.energy > 0){
                this.seed.energy--;
                this.age++;
            }
        }
    }
}