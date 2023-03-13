import { Sprite } from "pixi.js";
import { debugPrint } from "../..";
import { Camera } from "../../camera";
import { Entity } from "../../entity";
import { Terrain, terrainType } from "../../terrain";
import { Vector } from "../../vector";

export class Player extends Entity {
    velocity = new Vector();
    input = new Vector();
    grounded = false;
    CamTgtX = 0;
    camTarget = new Vector();
    constructor(position: Vector) {
        const graph = Sprite.from("player.png")
        graph.anchor.set(.5, 1);
        super(graph, position, null, 0);
    }
    update(): void {
        let legsPixel = Terrain.getPixel(Math.floor(this.position.x), Math.floor(this.position.y));
        if (legsPixel == terrainType.void) {
            this.velocity.y -= .05;
            this.grounded = false;
        }
        else {
            this.grounded = true;
            if (Terrain.getPixel(Math.floor(this.position.x), Math.floor(this.position.y + 1)) != terrainType.void) {
                this.position.y += 1;
                this.velocity.y = 0;
            }
        }
        this.velocity.x += this.input.x * .1;
        this.velocity.x = Math.sign(this.velocity.x) * Math.min(1, Math.abs(this.velocity.x));
        if (this.velocity.x < 0) this.graphics.scale.x = -1;
        else this.graphics.scale.x = 1;
        if (this.input.x == 0) this.velocity.x *= .99;
        if (this.grounded) {
            if (this.input.x == 0) this.velocity.x *= .85;
            if (this.input.y > 0 && this.velocity.y == 0) this.velocity.y += 2;
        }
        let pos = this.position.result().sub(new Vector(Camera.width, Camera.height).mult(.5));
        let diff = pos.sub(this.camTarget).add(new Vector(this.velocity.result().mult(100).x, 0));
        this.camTarget.add(diff.mult(.02))
        Camera.position.x = Math.floor(this.camTarget.x);
        Camera.position.y = Math.floor(this.camTarget.y);
        let terrainInFront = Terrain.getPixel(Math.floor(this.position.x + this.velocity.x * 10), Math.floor(this.position.y + 20));
        if (terrainInFront != terrainType.void) this.velocity.x = 0;

        //Camera.position.y = pos.y
        //Camera.position.y+=diff.y*.1;
        //if (Camera.position.x < pos.x) Camera.position.x++;
        //if (Camera.position.x > pos.x) Camera.position.x--;
        //Camera.position.add(new Vector(1, 1));
        //Camera.position = this.position.result().sub(new Vector(Camera.width, Camera.height).mult(.5));
        this.position.add(this.velocity);
        this.updatePosition();
        this.queueUpdate();
    }
}