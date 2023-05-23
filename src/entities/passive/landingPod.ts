import { Graphics, SHAPES, Sprite } from "pixi.js";
import { Color } from "../../color";
import { Entity } from "../../entity";
import { random } from "../../utils";
import { Vector } from "../../vector";
import { Light } from "../../shaders/lighting/light";

export class CrashPod extends Entity {
    light:Light;
    intensity = 2;
    constructor(position: Vector, parent: Entity  = null, angle = 0) {
        const graph = Sprite.from("entity/landing.png");
        graph.anchor.set(0,1);
        super(graph, position, parent, angle);
        this.light = new Light(this,new Vector(128,58),1.5,4,new Color(255,180,20),200,this.intensity);
    }
    update(dt: number): void {
        super.update(dt);
        this.intensity = Math.max(2,Math.min(5,this.intensity+random(-10,10)*dt));
        this.light.intensity=this.intensity;
        this.queueUpdate()
    }
}