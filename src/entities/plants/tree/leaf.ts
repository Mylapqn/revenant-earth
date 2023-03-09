import { Sprite, Graphics } from "pixi.js";
import { createEmitAndSemanticDiagnosticsBuilderProgram } from "typescript";
import { Color } from "../../../color";
import { Entity } from "../../../entity";
import { random, randomInt } from "../../../utils";
import { Vector } from "../../../vector";
import { Seed } from "./seed";


export class Leaf extends Entity {
    age = 0;
    seed: Seed;
    phase = 0;
    rigidity = random(.2, 1);
    constructor(position: Vector, parent: Entity, seed: Seed, angle = 0) {
        /* const graph = Sprite.from("leaf.png")
        graph.tint = randomColor(230, 255);
        graph.scale.set(0);*/
        const graph = new Graphics();
        //graph.beginFill(Color.fromHsl(90, random(.4, .6), random(.4, .6)).toPixi())
        graph.beginFill(Color.randomAroundHSL(95, 5, .4, .1, .45, .1).toPixi());
        graph.drawEllipse(0, 0, 1.5, 3);
        super(graph, position, parent, angle);
        //graph.anchor.set(0.5);
        this.seed = seed;
    }

    update() {
        this.angle += Math.cos(this.phase) / 100 * this.rigidity;
        this.phase += .05;
        this.updatePosition();
        //this.graphics.scale.set(this.age / 150);
        this.queueUpdate();
        if (this.age == 150) return;
        if (Math.random() < 10 / this.age) {
            if (this.seed.energy > 0) {
                this.seed.energy--;
                this.age++;
            }
        }
    }
}