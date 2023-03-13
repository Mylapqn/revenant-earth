import { Sprite, Graphics } from "pixi.js";
import { createEmitAndSemanticDiagnosticsBuilderProgram } from "typescript";
import { Color } from "../../../color";
import { Entity } from "../../../entity";
import { random, randomInt } from "../../../utils";
import { Vector } from "../../../vector";
import { Branch } from "./branch";
import { Seed } from "./seed";


export class Leaf extends Entity {
    age = 0;
    seed: Seed;
    phase = 0;
    rigidity = random(.2, .5);
    posOffset = new Vector();
    constructor(position: Vector, parent: Entity, seed: Seed, angle = 0) {
        /* const graph = Sprite.from("leaf.png")
        graph.tint = randomColor(230, 255);
        graph.scale.set(0);*/
        const graph = new Graphics();
        //graph.beginFill(Color.random().toPixi());
        graph.beginFill(Color.randomAroundHSL(95, 5, .4, .1, .45, .1).toPixi());
        graph.drawEllipse(2.5, -0.75, 3, 1.5);
        //graph.anchor.set(0.5);
        super(graph, position, parent, angle);
        this.seed = seed;
        this.posOffset = position;
        if (this.parent instanceof Branch) {
            this.position = this.parent.endPos.result().add(this.posOffset);
        }
    }

    update() {
        if (this.parent instanceof Branch) {
            this.position = this.parent.endPos.result().add(this.posOffset);
            if (!this.parent.leafy)
                this.angle = this.parent.growAngle;
        }
        //this.angle += Math.cos(this.phase) / 50 * this.rigidity;
        this.phase += .04;
        this.updatePosition();
        this.graphics.scale.set(Math.max(1, Math.min(1, this.age / 100)));
        
        if (this.parent instanceof Branch) {
            if (this.parent.settings.growSpeed == 0) {
                return;
            }
        }
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