import { Sprite } from "pixi.js";
import { Entity } from "../../../entity";
import { Vector } from "../../../vector";
import { Root } from "./root";
import { Stick } from "./stick";


export class Seed extends Entity {
    age = 0;
    energy = 100;
    constructor(position: Vector, parent?: Entity, angle = 0) {
        const graph = Sprite.from("seed.png")
        graph.anchor.set(0.5);
        super(graph, position, parent, angle);
    }

    update() {
        this.energy = 1000;
        this.updatePosition();
        if (this.age == 0) {
            new Root(new Vector(0, 0), this, this, Math.PI);
            new Stick(new Vector(0, 0), this, this, -0.1);
        }

        if (this.age > 500) return;
        //this.graphics.scale.set(this.age / 500);
        this.queueUpdate();
        if (this.energy > 0) {
            this.age++;
            //this.energy--;
        }
    }
}