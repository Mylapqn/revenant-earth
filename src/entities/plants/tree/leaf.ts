import { Sprite, Graphics, Matrix } from "pixi.js";
import { createEmitAndSemanticDiagnosticsBuilderProgram } from "typescript";
import { Color } from "../../../color";
import { Entity } from "../../../entity";
import { lerp, random, randomInt } from "../../../utils";
import { Vector } from "../../../vector";
import { Falling } from "../../falling";
import { Branch } from "./branch";
import { Seed } from "./seed";

interface LeafSettings {
    position?: Vector,
    sticky?: boolean,
    angle?: number,
    length?: number,
    width?: number,
    angleSpread?: number,
    amount?: number,
}


export class Leaf extends Entity {
    age = 0;
    seed: Seed;
    phase = 0;
    rigidity = random(.2, .5);
    angleDelta = 0;
    posOffset = new Vector();
    baseAngle = 0;
    constructor(parent: Entity, seed: Seed, settings: LeafSettings) {
        const set: LeafSettings = {
            position: settings.position || new Vector(0, 0),
            sticky: !settings.sticky ? false : true,
            angle: settings.angle || 0,
            length: settings.length || 3,
            width: settings.width || 1.5,
            angleSpread: settings.angleSpread || 1,
            amount: settings.amount || 1
        }
        const graph = new Graphics();
        super(graph, set.position.result(), parent, set.angle);
        graph.beginFill(0xFFFFFF);
        //graph.beginFill(Color.randomAroundHSL(95, 5, .4, .1, .45, .1).toNumber());
        graph.drawEllipse(-set.width / 2, -length + .5, set.width, length);
        //graph.cacheAsBitmap=true;

        //const graph = Sprite.from("leaf.png")
        //graph.tint = Color.random().toPixi();
        //graph.scale.set(0);
        this.baseAngle = set.angle;
        this.seed = seed;
        this.posOffset = set.position;
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