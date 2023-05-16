import { Graphics, SHAPES } from "pixi.js";
import { Color } from "../../color";
import { Entity } from "../../entity";
import { lerp, random } from "../../utils";
import { Vector } from "../../vector";

export class Cloud extends Entity {
    graphics: Graphics;
    color: Color;
    age = 0;
    maxAge = random(1, 3);
    velocity: Vector;
    constructor(position: Vector, size = 10, velocity = new Vector(0, 0), color = 0xDD5533) {
        const graph = new Graphics();
        super(graph, position, null);

        this.graphics.beginFill(color);
        this.graphics.alpha = .01;
        let r = random(3, 10);
        this.graphics.drawCircle(-r / 2, -r / 2, r);
        this.graphics.endFill;
        this.velocity = velocity.result();
    }
    update(dt: number): void {
        this.age += dt;
        let ageRatio = this.age / this.maxAge;
        this.position.add(this.velocity.result().mult(dt));
        this.graphics.scale.set((lerp(.7, 2, ageRatio)));
        this.velocity.mult(1 - (dt));
        this.velocity.y += dt * 10
        this.graphics.alpha = lerp(.04, 0, ageRatio);
        if (this.age >= this.maxAge) {
            this.remove();
            return;
        }
        this.updatePosition()
        this.queueUpdate()
    }
}