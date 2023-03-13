import { Container, Graphics } from "pixi.js";
import { Color } from "../color";
import { Entity } from "../entity";
import { random } from "../utils";
import { Vector } from "../vector";

export class Falling extends Entity {
    velocity = new Vector(0,0);
    rotSpeed = 0;
    constructor(source: Entity) {
        let g = new Container();
        //g.beginFill(Color.random().toPixi())
        //g.drawRect(0, 0, 2, 2);
        super(source.graphics, source.worldCoords(new Vector()), null, source.angle);
        source.graphics=g;
        //source.position = new Vector();
        //source.graphics.position.set(0,0)
        console.log(this.position);
    }
    update() {
        this.velocity.x += .0005;
        this.velocity.y -= .001;
        this.graphics.alpha -=.003;
        this.angle+=this.rotSpeed;
        this.position.add(this.velocity)
        this.updatePosition();
        this.queueUpdate();
    }
}