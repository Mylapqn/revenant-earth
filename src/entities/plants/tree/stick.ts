import { Sprite, Graphics } from "pixi.js";
import { Color } from "../../../color";
import { Entity } from "../../../entity";
import { random, randomInt } from "../../../utils";
import { Vector } from "../../../vector";
import { Leaf } from "./leaf";
import { Seed } from "./seed";


export class Stick extends Entity {
    seed: Seed;
    age = 0;
    depth = 0;
    phase = 0;
    startAngle = 0;
    endAngle = 0;
    constructor(position: Vector, parent: Entity, seed: Seed, angle = 0, depth = 1) {
        //const graph = Sprite.from("stick.png");
        //graph.scale.set(0);
        const graph = new Graphics();
        graph.lineStyle(4 - depth, Color.randomAroundHSL(30, 5, .35, .05, .35, .1).toPixi());
        graph.moveTo(0, 0);
        let segments = randomInt(0, 10);
        for (let i = 0; i < segments; i++) {
            graph.lineTo(randomInt(-2, 2), Math.floor(-25 / (segments + 1) * (i + 1)));
        }
        graph.lineTo(0, -25);
        //graph.lineStyle(1, new Color(255, 0, 0).toPixi());
        //graph.moveTo(0, 0);
        //graph.lineTo(0, -40);
        super(graph, position, parent, angle);
        this.seed = seed;
        this.depth = depth;
        if (parent)
            this.phase = this.parent.position.x / 100;
        //graph.anchor.set(0.5, 1);
    }

    update() {
        if ("phase" in this.parent) {
            this.phase = this.parent.phase as number;
        } else {
            this.phase += .005;
        }

        //this.angle += Math.cos(this.phase) / 2000;
        this.updatePosition();
        if (this.depth < 3 && this.age == 0) {
            for (let i = 0; i < 6; i++) {
                new Stick(new Vector(0, randomInt(20, 25)), this, this.seed, random(-1, 1), this.depth + 1)
            }
            this.age++;
        } else if (this.depth == 3 && this.age == 0) {
            let leaves = randomInt(5, 15);
            for (let i = 0; i < leaves; i++) {
                new Leaf(new Vector(randomInt(-4, 4), randomInt(0, 26)), this, this.seed, Math.random() * 4 - 2)
            }
            this.age++;
        }

        this.queueUpdate();
        if (this.age > 150) return;
        //this.graphics.scale.set(this.age / 150, this.age / 150);
        if (this.seed.energy > 0) {
            this.seed.energy--;
            this.age++;
        }
    }
}