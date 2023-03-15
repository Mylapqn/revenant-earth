import { AnimatedSprite, Sprite } from "pixi.js";
import { debugPrint } from "../..";
import { Camera } from "../../camera";
import { Entity } from "../../entity";
import { Terrain, terrainType } from "../../terrain";
import { Vector } from "../../vector";

export class Player extends Entity {
    velocity = new Vector();
    input = new Vector();
    grounded = false;
    camTarget = new Vector(200, 400);
    graphics: AnimatedSprite;
    constructor(position: Vector) {
        //const graph = Sprite.from("player.png");
        const graph = AnimatedSprite.fromFrames([
            "animation/walk/walk1.png",
            "animation/walk/walk2.png",
            "animation/walk/walk3.png",
            "animation/walk/walk4.png",
            "animation/walk/walk5.png",
            "animation/walk/walk6.png",
            "animation/walk/walk7.png",
            "animation/walk/walk8.png",
        ]);

        graph.play();
        graph.animationSpeed = .1;
        graph.anchor.set(.5, 1);
        super(graph, position, null, 0);
    }
    update(dt: number): void {
        let legsPixels = [];
        this.grounded = false;
        for (let i = -4; i <= 4; i++) {
            let t = Terrain.getPixel(Math.floor(this.position.x + i), Math.floor(this.position.y));
            legsPixels.push(t);
            if (t != terrainType.void) {
                this.grounded = true;
            }
        }
        if (!this.grounded) {
            this.velocity.y -= 100 * dt;
        }
        else {
            if (Terrain.getPixel(Math.floor(this.position.x), Math.floor(this.position.y + 1)) != terrainType.void) {
                this.position.y += 1;
                this.velocity.y = 0;
            }
        }
        this.velocity.x += this.input.x * 100 * dt;
        this.velocity.x = Math.sign(this.velocity.x) * Math.min(20, Math.abs(this.velocity.x));
        if (this.velocity.x < 0) this.graphics.scale.x = -1;
        else this.graphics.scale.x = 1;
        if (this.input.x == 0) this.velocity.x *= (1 - 10 * dt);
        this.graphics.animationSpeed = Math.abs(this.velocity.x * 0.5 * dt);
        if (this.grounded) {
            if (this.input.x == 0) this.velocity.x *= (1 - 0.15 * dt);
            if (this.input.y > 0 && this.velocity.y == 0) this.velocity.y += 2;
        }
        let pos = this.position.result().sub(new Vector(Camera.width, Camera.height).mult(.5));
        let diff = pos.sub(this.camTarget).add(new Vector(this.velocity.result().mult(5).x, 50));
        this.camTarget.add(diff.mult(.02))
        Camera.position.x = Math.floor(this.camTarget.x);
        Camera.position.y = Math.floor(this.camTarget.y);
        let terrainInFront = Terrain.getPixel(Math.floor(this.position.x + this.velocity.x * 10 * dt), Math.floor(this.position.y + 20));
        if (terrainInFront != terrainType.void) this.velocity.x = 0;

        //Camera.position.y = pos.y
        //Camera.position.y+=diff.y*.1;
        //if (Camera.position.x < pos.x) Camera.position.x++;
        //if (Camera.position.x > pos.x) Camera.position.x--;
        //Camera.position.add(new Vector(1, 1));
        //Camera.position = this.position.result().sub(new Vector(Camera.width, Camera.height).mult(.5));
        this.position.add(this.velocity.result().mult(dt));
        this.updatePosition();
        this.queueUpdate();
    }
}