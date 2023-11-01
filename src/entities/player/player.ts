
import { AnimatedSprite, Sprite } from "pixi.js";
import { debugPrint, gameOver, mouse, screenToWorld, worldToScreen } from "../../game";
import { Camera } from "../../camera";
import { Entity } from "../../entity";
import { lookup, Terrain, terrainType } from "../../terrain";
import { clamp, random, randomInt } from "../../utils";
import { Vector } from "../../vector";
import { Cloud } from "../passive/cloud";
import { Color } from "../../color";
import { Light } from "../../shaders/lighting/light";
import { DebugDraw } from "../../debugDraw";
import { SoundEffect, SoundManager } from "../../sound";
import { ParticleSystem } from "../../particles/particle";
import { GUI, GuiSpeechBubble, GuiSplash } from "../../gui/gui";
import { DamageableEntity } from "../damageableEntity";
import { World } from "../../world";
import { Progress } from "../../progress";

const playerSprites = {
    stand: AnimatedSprite.fromFrames(["player.png"]),
    standGun: AnimatedSprite.fromFrames(["animation/shoot/player-shoot.png"]),
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
    climb: AnimatedSprite.fromFrames([
        "animation/climb/climb4.png",
        "animation/climb/climb3.png",
        "animation/climb/climb2.png",
        "animation/climb/climb1.png",
    ]),
    fall: AnimatedSprite.fromFrames(["animation/fall/fall.png"]),
}

export class Player extends DamageableEntity {
    health = 10;
    energy = 10;
    oxygen = 10;
    material = 10000;
    jetpackParticles: ParticleSystem;
    velocity = new Vector();
    input = new Vector();
    grounded = false;
    camTarget: Vector;
    graphics: AnimatedSprite;
    run = false;
    jetpack = false;
    jumping = false;
    airTime = 0;
    animState = 0;
    private step = 1;
    screenCenterNorm = new Vector();
    screenDimensionsNorm = new Vector();
    climb = 0;
    climbDir = 0;
    light = new Light(this, new Vector(0, 25), Math.PI + .2, 1.2, new Color(150, 255, 255), 300, 3);
    hitboxOffset = new Vector(0, 15);
    hitboxSize = 15;
    hitSound = SoundManager.fx.playerHit;
    weaponArmed = false;
    weaponCooldown = 0;
    weaponCooldownMax = .5;
    handSprite: Sprite;
    stepSound = {
        dirt: [] as SoundEffect[],
        water: [] as SoundEffect[],
    }
    sounds = {
        jetpackLoop: new SoundEffect("sound/fx/jetpack_loop.ogg", 0),
        jetpackStart: new SoundEffect("sound/fx/jetpack_start.ogg", .2)
    }
    jetpackLight = new Light(this, new Vector(-5, 15), -Math.PI / 2 + .2, 1.8, new Color(255, 255, 255), 200, 0);
    oxygenMovementCost = 1;
    oxygenModifier = 1;

    constructor(position: Vector) {
        const graph = new AnimatedSprite(playerSprites.stand.textures);
        graph.play();
        graph.animationSpeed = .1;
        graph.anchor.set(.5, 1);
        super(graph, position, null, 0);
        this.handSprite = Sprite.from("animation/shoot/hand.png");
        this.handSprite.anchor.set(.5);
        this.handSprite.position.set(3, -19);
        graph.addChild(this.handSprite);
        for (let i = 1; i <= 6; i++) {
            this.stepSound.dirt.push(new SoundEffect(`sound/fx/steps/dirt${i}.ogg`, .27));
        }
        for (let i = 1; i <= 5; i++) {
            this.stepSound.water.push(new SoundEffect(`sound/fx/steps/water${i}.ogg`, .08));
        }

        this.sounds.jetpackLoop.loop = true;
        this.sounds.jetpackLoop.play();

        this.camTarget = this.position.result();

        this.jetpackParticles = new ParticleSystem({ keepAlive: true, position: this.position, emitRate: 4, colorFrom: new Color(200, 255, 255), colorTo: new Color(200, 200, 200) });

        this.jetpackParticles.angle = -Math.PI / 2;
        this.jetpackParticles.emitSpeed = 300;
        this.jetpackParticles.angleSpread = 0.15;
        this.jetpackParticles.particleLifeTime = .3;
        this.jetpackParticles.enabled = false;
        this.jetpackParticles.scaleFrom = .1;
        this.jetpackParticles.scaleTo = .8;
        this.jetpackParticles.alphaFrom = 1;
        this.jetpackParticles.alphaTo = 0;
        this.jetpackParticles.parent = this;
        this.jetpackParticles.collision = true;
        this.updatePosition();
    }
    update(dt: number): void {

        this.jetpackParticles.position = this.position.result().add(new Vector(-this.graphics.scale.x * 4, 16));
        const lastvel = this.velocity.result();
        if (Math.abs(this.velocity.x) <= 10 || this.jetpack) {
            if (!this.grounded) {
                this.animState = 3;
                this.graphics.textures = playerSprites.fall.textures;
                this.graphics.play();
            }
            else if (this.animState != 0) {
                this.oxygenMovementCost = .2;
                this.animState = 0;
                if (this.weaponArmed)
                    this.graphics.textures = playerSprites.standGun.textures;
                else
                    this.graphics.textures = playerSprites.stand.textures;
                this.graphics.play();
            }
        }
        else if (this.run && this.animState != 1) {
            this.oxygenMovementCost = 3;
            this.animState = 1;
            this.graphics.textures = playerSprites.run.textures;
            this.graphics.play();
        }
        else if (!this.run && this.animState != 2) {
            this.oxygenMovementCost = .4;
            this.animState = 2;
            this.graphics.textures = playerSprites.walk.textures;
            this.graphics.play();
        }

        if (this.climb > 0) {
            this.graphics.textures = playerSprites.climb.textures;
            this.graphics.currentFrame = Math.floor(clamp((this.climb) / 25) * playerSprites.climb.totalFrames);
            this.animState = 4;
        }

        if (this.weaponArmed) {
            //console.log(this.weaponCooldown);
            this.handSprite.visible = true;
            let hdf = this.position.result().add(new Vector(this.handSprite.position.x, -this.handSprite.position.y)).sub(screenToWorld(mouse));
            if (this.graphics.scale.x > 0) hdf.x *= -1;
            this.handSprite.rotation = hdf.toAngle();
            this.weaponCooldown = Math.max(0, this.weaponCooldown - dt);
            if (this.weaponCooldown == 0 && this.energy > 0) {
                GUI.cursorElement.classList.remove("reloading");
            }
        }
        else {
            this.handSprite.visible = false;
        }

        let worldData = World.getDataFrom(this.position.x);
        let oldOxygen = this.oxygen;
        this.oxygen += dt * .03 * (50 - worldData.pollution) * this.oxygenMovementCost * this.oxygenModifier * .4;
        this.oxygen = clamp(this.oxygen,-1,10);
        if(this.oxygen <= 5 && oldOxygen > 5){
            new GuiSpeechBubble(this,"Half of my oxygen is gone, I should return to the pod soon.");
        }
        if (this.oxygen <= -1) {
            this.oxygen = 0;
            this.damage(1);
            new GuiSpeechBubble(this, "I'm suffocating!", 1)
        }

        this.grounded = false;
        let highestDensity = 0;
        for (let j = -5; j <= -Math.min(this.velocity.y * dt, 0); j++) {
            let solid: terrainType;
            for (let i = -3; i <= 3; i++) {
                let t = Terrain.getPixel(Math.floor(this.position.x + i), Math.floor(this.position.y - j));
                highestDensity = Math.max(highestDensity, lookup[t].density);
                if (lookup[t].density > 0) solid = t;
            }
            if (highestDensity == 1) {
                if (this.step == 0) {
                    this.stepSound.dirt[randomInt(0, this.stepSound.dirt.length - 1)].play();
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

        if (highestDensity > 0 && highestDensity < 1) {
            if ((this.velocity.y) < -250) {
                Terrain.addSound(terrainType.water1, Math.abs(this.velocity.y) * 3);
            }
            if (this.step == 0) {
                this.stepSound.water[randomInt(0, this.stepSound.water.length - 1)].play();
                this.step += .001;
            }
        }

        if (!this.grounded) {
            this.airTime += dt;
            if (this.input.y <= 0) {
                this.jumping = false;
                this.jetpack = false;
            }
            if (this.input.y > 0 && !this.jumping && this.airTime > .05 && !this.jetpack && this.energy > 0) {
                this.sounds.jetpackStart.play();
                this.sounds.jetpackLoop.volume = .2;
                this.jetpack = true;
                this.jetpackLight.intensity = 2;
            }
            if (this.jetpack && this.velocity.y < 300)
                this.velocity.y += 500 * dt;
            else {
                this.velocity.y -= 2800 * dt * (1 - highestDensity / 4);
            }
            this.velocity.y = Math.max(-700 * (1 - highestDensity), this.velocity.y);
        }
        if (highestDensity > 0) {
            this.airTime = 0;
            this.jumping = false;
            this.jetpack = false;
        }
        if (this.airTime < .05 && !this.jumping) {
            if (this.input.y > 0 && this.velocity.y <= 0) {
                this.velocity.y = 300 * highestDensity;
                if (highestDensity == 0) this.velocity.y = 250;
                this.jumping = true;
            }
        }
        this.jetpackParticles.enabled = this.jetpack;
        if (this.jetpack) {
            this.energy -= 2 * dt;
            if (this.energy < 0) {
                this.energy = 0;
                this.jetpack = false;
            }

        }
        else {
            this.sounds.jetpackLoop.volume *= .9;
            this.sounds.jetpackStart.stop();
            this.jetpackLight.intensity = 0;
        }


        this.velocity.x += this.input.x * 10000 * dt;
        this.velocity.x = Math.sign(this.velocity.x) * Math.min((clamp(this.airTime / 2 + .9, 1, 1.4)) * (this.run ? 250 : 60), Math.abs(this.velocity.x));
        if (this.velocity.x < 0) this.graphics.scale.x = -1;
        else this.graphics.scale.x = 1;
        if (this.input.x == 0) this.velocity.x *= (1 - 10 * dt);
        if (highestDensity > 0) {
            if (this.input.x == 0) this.velocity.x *= (1 - 1 * dt);
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

            if (j >= 6) {
                if (j > 6 && j < 25 && this.input.x != 0 && this.input.y > 0) {
                    this.climb = j;
                    this.climbDir = Math.sign(this.input.x);
                }
                else this.climb = 0;
                this.velocity.x = (i - 4) * Math.sign(this.input.x);
                break;
            }
            else this.climb = 0;
        }


        if (this.climb > 0) {
            if (Math.sign(this.input.x) == this.climbDir) {
                //this.climb--;
                //this.position.y++;
                this.velocity.y = 80;
                if (this.climb <= 7) this.velocity.y = 120
            } else {
                this.climb = 0;
            }
        }

        this.graphics.animationSpeed = Math.abs(this.velocity.x * (this.run ? 0.22 : 1) / 300);


        if (this.velocity.x < 0) this.graphics.scale.x = -1;
        if (this.velocity.x > 0) this.graphics.scale.x = 1;

        if (this.position.y > Terrain.height - 35) this.velocity.y = Math.min(0, this.velocity.y)

        this.position.add(this.velocity.result().mult(dt));

        let pos = new Vector(this.graphics.position.x, -this.graphics.position.y).sub(new Vector(Camera.width, Camera.height).mult(.5));
        let diff = pos.sub(this.camTarget).add(new Vector(this.velocity.result().mult(.2).x, Camera.yOffset));
        //let diff = pos.sub(this.camTarget).add(new Vector());
        this.camTarget.add(diff.mult(4 * dt));
        this.step += Math.abs(this.velocity.x) * dt;
        if (this.step > 10) {
            this.step = 0;
            if (this.grounded)
                new Cloud(this.position.result(), Math.abs(this.velocity.x), new Vector(this.velocity.x * random(-.5, .1), -5));
        }


        GUI.oxygenBar.fill = this.oxygen / 10;
        GUI.energyBar.fill = this.energy / 10;
        GUI.healthBar.fill = this.health / 10;

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
    toggleWeapon() {
        this.animState = 1;
        this.weaponArmed = !this.weaponArmed;
        if (this.weaponArmed) {
            GUI.cursorElement.classList.add("combat");
            GUI.weaponButton.content = "Disarm weapon";
            GUI.weaponButton.element.classList.add("flashRed");
            this.weaponCooldown = this.weaponCooldownMax;
            GUI.cursorElement.classList.add("reloading");
        }
        else {
            GUI.cursorElement.classList.remove("combat");
            GUI.cursorElement.classList.remove("reloading");
            GUI.weaponButton.content = "Arm weapon";
            GUI.weaponButton.element.classList.remove("flashRed");
        }
    }
    damage(amount: number): void {
        super.damage(amount);
        GUI.healthBar.fill = this.health / 10;
    }
    die() {
        console.log("Player died");
        gameOver();
        super.die();
    }
}