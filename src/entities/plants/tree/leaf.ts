import { Sprite, Graphics, Matrix } from "pixi.js";
import { createEmitAndSemanticDiagnosticsBuilderProgram } from "typescript";
import { Color } from "../../../color";
import { Entity } from "../../../entity";
import { lerp, random, randomInt } from "../../../utils";
import { Vector } from "../../../vector";
import { Falling } from "../../falling";
import { Branch } from "./branch";
import { Seed } from "./seed";


export class Leaf extends Entity {
    age = 0;
    seed: Seed;
    phase = 0;
    rigidity = random(.2, .5);
    angleDelta = 0;
    posOffset = new Vector();
    baseAngle = 0;
    constructor(posOffset: Vector, parent: Entity, seed: Seed, angle = 0, amount = 1, radius = 5) {

        const graph = new Graphics();
        super(graph, posOffset, parent, angle);
        //graph.beginFill(Color.random().toPixi());
        if (amount == 1) {
            graph.beginFill(Color.randomAroundHSL(95, 5, .4, .1, .45, .1).toPixi());
            graph.drawEllipse(-.75, -2.5, 1.5, 3);
        }
        else if (amount > 1) {
            for (let i = 0; i < amount; i++) {
                graph.beginFill(Color.randomAroundHSL(95, 5, .4, .1, .45, .1).toPixi());
                graph.drawEllipse(-.75, -2.5, 1.5, 3);

            }
        }

        //const graph = Sprite.from("leaf.png")
        //graph.tint = Color.random().toPixi();
        //graph.scale.set(0);
        this.baseAngle = angle;
        this.seed = seed;
        this.posOffset = posOffset;
        if (this.parent instanceof Branch) {
            this.position = this.parent.endPos.result().add(this.posOffset);
        }
        this.seed.l++;
    }

    update() {
        if (this.parent instanceof Branch) {
            if (this.parent.removed) return;
            this.position = this.parent.endPos.result().add(this.posOffset);
            if (!this.parent.leafy) {
                this.baseAngle = this.parent.growAngle;
            }
        }
        this.angleDelta = Math.cos(this.phase) * .8 * this.rigidity;
        this.phase += .2 * this.rigidity;
        this.angle = this.baseAngle + this.angleDelta
        this.updatePosition();
        this.graphics.scale.set(lerp(1, 1, Math.min(1, this.age / 300)));

        if (this.parent instanceof Branch) {
            if (this.parent.settings.main.growSpeed == 0) {
                //return;
            }
        }
        this.queueUpdate();
        this.age++;
        if (this.age == 1000) {
            //new Falling(this);
            return;
        }
        if (Math.random() < 10 / this.age) {
            if (this.seed.energy > 0) {
                this.seed.energy--;
                //this.age++;
            }
        }
    }
    remove(): void {
        this.seed.l--;
        super.remove();
    }
}