import { Container, Graphics, Sprite } from "pixi.js";
import { Color } from "../color";
import { Entity } from "../entity";
import { random } from "../utils";
import { Vector } from "../vector";

export class Projectile extends Entity {
    velocity = new Vector(1,0);
    rotSpeed = 0;
    source:Entity;
    constructor(source: Entity,angle:number) {
        //g.beginFill(Color.random().toPixi())
        //g.drawRect(0, 0, 2, 2);
        let graph = new Graphics;
        graph.beginFill(0xffffff);
        graph.drawRect(-1,-1,2,2);
        super(graph, source.worldCoords(new Vector()), null, -angle);
        this.velocity = Vector.fromAngle(angle).mult(2);
        this.source = source;
        //source.position = new Vector();
        //source.graphics.position.set(0,0)
        //console.log(this.position);
        //this.angle = 0;
    }
    update() {
        this.velocity.x *= .99;
        this.velocity.y -= .01;
        this.angle=this.velocity.toAngle();
        this.position.add(this.velocity)
        this.updatePosition();
        this.queueUpdate();
    }
}