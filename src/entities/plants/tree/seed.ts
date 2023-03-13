import { Sprite } from "pixi.js";
import { Entity } from "../../../entity";
import { Vector } from "../../../vector";
import { Root } from "./root";
import { Branch } from "./branch";
import { random } from "../../../utils";
import { debugPrint } from "../../..";


export class Seed extends Entity {
    age = 0;
    energy = 100;
    branch: Branch;
    l = 0;
    b = 0;
    constructor(position: Vector, parent?: Entity, angle = 0) {
        const graph = Sprite.from("seed.png")
        graph.anchor.set(0.5);
        super(graph, position, parent, angle);
    }

    update() {
        debugPrint("L: " + this.l);
        debugPrint("B: " + this.b);
        this.energy += 1;
        this.updatePosition();
        if (this.age == 0) {
            new Root(new Vector(0, 0), this, this, Math.PI);
            this.branch = new Branch(new Vector(0, 0), this, this);
            this.branch.main = true;
        }
        this.age++;
        if (this.energy > 0) {
            this.branch.energy += this.energy;
            this.energy = 0;
        }

        //if (this.age > 500) return;
        //this.graphics.scale.set(this.age / 500);
        this.queueUpdate();
        if (this.energy > 0) {
            //this.energy--;
        }
    }
}