
import { AnimatedSprite, Sprite } from "pixi.js";
import { debugPrint, worldToScreen } from "../../game";
import { Camera } from "../../camera";
import { Entity } from "../../entity";
import { lookup, Terrain, terrainType } from "../../terrain";
import { random, randomInt } from "../../utils";
import { Vector } from "../../vector";
import { Cloud } from "../passive/cloud";
import { Color } from "../../color";
import { Light } from "../../shaders/lighting/light";
import { DebugDraw } from "../../debugDraw";
import { SoundEffect } from "../../sound";

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
    ]),
    fall: AnimatedSprite.fromFrames(["animation/fall/fall.png"]),
}

export class Player extends Entity {
    velocity = new Vector();
    input = new Vector();
    grounded = false;
    camTarget = Camera.position.result();
    graphics: AnimatedSprite;
    run = false;
    animState = 0;
    private step = 1;
    screenCenterNorm = new Vector();
    screenDimensionsNorm = new Vector();
    light = new Light(this, new Vector(0, 25), Math.PI + .2, 1.2, new Color(150, 255, 255), 300, 3);
    stepSound: SoundEffect[] = [];




    constructor(position: Vector) {
        const graph = new AnimatedSprite(playerSprites.stand.textures);
        graph.play();
        graph.animationSpeed = .1;
        graph.anchor.set(.5, 1);
        super(graph, position, null, 0);
        for (let i = 1; i <= 6; i++) {
            this.stepSound.push(new SoundEffect(`sound/fx/steps/dirt${i}.ogg`, .2));
        }
    }
    update(dt: number): void {
        const lastvel = this.velocity.result();
        if (Math.abs(this.velocity.x) <= 10) {
            if (!this.grounded) {
                this.animState = 3;
                this.graphics.textures = playerSprites.fall.textures;
                this.graphics.play();
            }
            else if (this.animState != 0) {
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

        this.grounded = false;
        let highestDensity = 0;
        for (let j = -5; j <= -Math.min(this.velocity.y * dt, 0); j++) {
            let solid: terrainType;
            for (let i = -4; i <= 4; i++) {
                let t = Terrain.getPixel(Math.floor(this.position.x + i), Math.floor(this.position.y - j));
                highestDensity = Math.max(highestDensity, lookup[t].density);
                if (lookup[t].density > 0) solid = t;
            }
            if (highestDensity == 1) {
                if (this.step == 0) {
                    this.stepSound[randomInt(0, this.stepSound.length - 1)].play();
                    this.step += .001;
                }
                if ((this.velocity.y) < -250) {
                    Terrain.addSound(solid, Math.abs(this.velocity.y) * 3);
                    for (let index = 0; index < Math.abs(this.velocity.y) / 20; index++) {
                        new Cloud(this.position.result(), Math.abs(this.velocity.x), new Vector(random(-1, 1) * 80 + this.velocity.x / 4, 10));
                    }
                }
                this.velocity.y = 0;
                this.grounded = true;
                if (j < -4) break;
                this.position.y -= j;
                this.grounded = true;
                break;
            }
        }
        if (!this.grounded) {
            this.velocity.y -= 4000 * dt * (1 - highestDensity);
            this.velocity.y = Math.max(-500 * (1 - highestDensity), this.velocity.y);
        } else {
            if (this.input.y > 0 && this.velocity.y <= 0) this.velocity.y += 600 * highestDensity;
        }

        this.velocity.x += this.input.x * 10000 * dt;
        this.velocity.x = Math.sign(this.velocity.x) * Math.min(this.run ? 180 : 60, Math.abs(this.velocity.x));
        if (this.velocity.x < 0) this.graphics.scale.x = -1;
        else this.graphics.scale.x = 1;
        if (this.input.x == 0) this.velocity.x *= (1 - 10 * dt);
        if (highestDensity > 0) {
            if (this.input.x == 0) this.velocity.x *= (1 - 1 * dt);
            if (this.input.y > 0 && this.velocity.y <= 0) this.velocity.y += 600 * highestDensity;
        }

        for (let i = 4; i <= Math.abs(this.velocity.x * dt) + 4; i++) {
            let j: number;
            highestDensity = 0;
            for (j = 25; j >= 0; j--) {
                const coordX = Math.floor(this.position.x + i * Math.sign(this.input.x));
                const coordY = Math.floor(this.position.y + j);
                let t = Terrain.getPixel(coordX, coordY);
                if (lookup[t].density == 1) break;
                highestDensity = Math.max(highestDensity, lookup[t].density);
            }

            if (j >= 5) {
                this.velocity.x = (i - 4) * Math.sign(this.input.x);
                break;
            }
        }

        this.graphics.animationSpeed = Math.abs(this.velocity.x * (this.run ? 0.3 : 1) / 300);


        if (this.velocity.x < 0) this.graphics.scale.x = -1;
        if (this.velocity.x > 0) this.graphics.scale.x = 1;

        this.position.add(this.velocity.result().mult(dt));

        let pos = new Vector(this.graphics.position.x, -this.graphics.position.y).sub(new Vector(Camera.width, Camera.height).mult(.5));
        let diff = pos.sub(this.camTarget).add(new Vector(this.velocity.result().mult(.7).x, Camera.yOffset));
        //let diff = pos.sub(this.camTarget).add(new Vector());
        this.camTarget.add(diff.mult(5 * dt));
        this.step += Math.abs(this.velocity.x) * dt;
        if (this.step > 10 && this.grounded) {
            this.step = 0;
            new Cloud(this.position.result(), Math.abs(this.velocity.x), new Vector(this.velocity.x * random(-.5, .1), -5));
        }


        // this.camTarget = this.position.result().sub(new Vector(Math.floor(Camera.width / 4) * 4, Camera.height).mult(.5).sub(lastvel.mult(dt)));
        // this.camTarget = this.camTarget.add(new Vector(0,Camera.yOffset)).round();

        /*
                let legsPixels = [];
                this.grounded = false;
                let highestDensity = 0;
                for (let i = -4; i <= 4; i++) {
                    let t = Terrain.getPixel(Math.floor(this.position.x + i), Math.floor(this.position.y));
                    legsPixels.push(t);
                    highestDensity = Math.max(highestDensity, lookup[t].density);
                }
                if (highestDensity == 1) {
                    this.grounded = true;
                    if (this.velocity.y < -250) {
                        for (let index = 0; index < Math.abs(this.velocity.y) / 20; index++) {
                            new Cloud(this.position.result(), Math.abs(this.velocity.x), new Vector(random(-1, 1) * 80 + this.velocity.x / 4, 10));
                        }
                    }
                }
                if (!this.grounded) {
                    this.velocity.y -= 4000 * dt * (1 - highestDensity);
                    this.velocity.y = Math.max(-500 * (1 - highestDensity), this.velocity.y);
                }
                else {
                    let t = Terrain.getPixel(Math.floor(this.position.x), Math.floor(this.position.y + 1));
                    if (lookup[t].density != 0) {
                        this.position.y += lookup[t].density;
                        this.velocity.y = 0;
                    }
                }
                let terrainInFront = Terrain.getPixel(Math.floor(this.position.x + this.velocity.x * 10 * dt), Math.floor(this.position.y + 20));
                this.velocity.x += this.input.x * 10000 * dt * (1 - lookup[terrainInFront].density);
                this.velocity.x = Math.sign(this.velocity.x) * Math.min(this.run ? 180 : 60, Math.abs(this.velocity.x));
                if (this.velocity.x < 0) this.graphics.scale.x = -1;
                else this.graphics.scale.x = 1;
                if (this.input.x == 0) this.velocity.x *= (1 - 10 * dt);
                if (highestDensity > 0) {
                    if (this.input.x == 0) this.velocity.x *= (1 - 1 * dt);
                    if (this.input.y > 0 && this.velocity.y <= 0) this.velocity.y += 600 * highestDensity;
                }
                let pos = this.position.result().sub(new Vector(Camera.width, Camera.height).mult(.5));
                let diff = pos.sub(this.camTarget).add(new Vector(this.velocity.result().mult(.7).x, Camera.yOffset));
                //let diff = pos.sub(this.camTarget).add(new Vector());
                this.camTarget.add(diff.mult(5 * dt))
                if (lookup[terrainInFront].density == 1) this.velocity.x = 0;
         
         
                //Camera.position.y = pos.y
                //Camera.position.y+=diff.y*.1;
                //if (Camera.position.x < pos.x) Camera.position.x++;
                //if (Camera.position.x > pos.x) Camera.position.x--;
                //Camera.position.add(new Vector(1, 1));
                //Camera.position = this.position.result().sub(new Vector(Camera.width, Camera.height).mult(.5));
         
                this.position.add(this.velocity.result().mult(dt));
                this.step += Math.abs(this.velocity.x) * dt;
                if (this.step > 5 && this.grounded) {
                    this.step = 0;
                    new Cloud(this.position.result(), Math.abs(this.velocity.x), new Vector(this.velocity.x * random(-.5, .1), -5));
                }
        */
        this.updatePosition();
        this.queueUpdate();
    }
}