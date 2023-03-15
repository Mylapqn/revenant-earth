import { AnimatedSprite, Sprite } from "pixi.js";
import { debugPrint } from "../..";
import { Camera } from "../../camera";
import { Entity } from "../../entity";
import { Terrain, terrainType } from "../../terrain";
import { Vector } from "../../vector";

const playerSprites = {
    stand: AnimatedSprite.fromFrames(["player.png"]),
    walk: AnimatedSprite.fromFrames([
        "animation/walk/walk1.png",
        "animation/walk/walk2.png",
        "animation/walk/walk3.png",
        "animation/walk/walk4.png",
        "animation/walk/walk5.png",
        "animation/walk/walk6.png",
        "animation/walk/walk7.png",
        "animation/walk/walk8.png",
    ]),
    run: AnimatedSprite.fromFrames([
        "animation/run/run1.png",
        "animation/run/run2.png",
        "animation/run/run3.png",
        "animation/run/run4.png",
        "animation/run/run5.png",
        "animation/run/run6.png",
    ])
}

export class Player extends Entity {
    velocity = new Vector();
    input = new Vector();
    grounded = false;
    camTarget = new Vector(200, 400);
    graphics: AnimatedSprite;
    run = false;
    animState = 0;

    constructor(position: Vector) {
        const graph = new AnimatedSprite(playerSprites.stand.textures);
        graph.play();
        graph.animationSpeed = .1;
        graph.anchor.set(.5, 1);
        super(graph, position, null, 0);
    }
    update(dt: number): void {
        if (Math.abs(this.velocity.x) <= 10) {
            if (this.animState != 0) {
                this.animState = 0;
                this.graphics.textures = playerSprites.stand.textures;
                this.graphics.play();
            }
        }
        else if (this.run && this.animState != 1) {
            this.animState = 1;
            this.graphics.textures = playerSprites.run.textures;
            this.graphics.play();
        }
        else if (!this.run && this.animState != 2) {
            this.animState = 2;
            this.graphics.textures = playerSprites.walk.textures;
            this.graphics.play();
        }

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
            this.velocity.y -= 4000 * dt;
        }
        else {
            if (Terrain.getPixel(Math.floor(this.position.x), Math.floor(this.position.y + 1)) != terrainType.void) {
                this.position.y += 1;
                this.velocity.y = 0;
            }
        }
        this.velocity.x += this.input.x * 10000 * dt;
        this.velocity.x = Math.sign(this.velocity.x) * Math.min(this.run ? 180 : 60, Math.abs(this.velocity.x));
        if (this.velocity.x < 0) this.graphics.scale.x = -1;
        else this.graphics.scale.x = 1;
        if (this.input.x == 0) this.velocity.x *= (1 - 10 * dt);
        this.graphics.animationSpeed = Math.abs(this.velocity.x * (this.run ? 0.3 : 1) /300);
        if (this.grounded) {
            if (this.input.x == 0) this.velocity.x *= (1 - 1 * dt);
            if (this.input.y > 0 && this.velocity.y == 0) this.velocity.y += 600;
        }
        let pos = this.position.result().sub(new Vector(Camera.width, Camera.height).mult(.5));
        let diff = pos.sub(this.camTarget).add(new Vector(this.velocity.result().mult(.7).x, 50));
        this.camTarget.add(diff.mult(10 * dt))
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