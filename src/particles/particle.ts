import { BLEND_MODES, Container, ParticleContainer, Sprite } from "pixi.js";
import { Vector } from "../vector";
import { player } from "../game";
import { Camera } from "../camera";
import { clamp, lerp, random } from "../utils";
import { randomInt } from "crypto";
import { Color } from "../color";
import { ParticleFilter } from "../shaders/particle/particleFilter";
import { Player } from "../entities/player/player";
import { Terrain, terrainType } from "../terrain";

interface ParticleSystemSettings {
    position: Vector,
    colorFrom?: Color,
    colorTo?: Color,
    emitRate?: number,
    maxAge?:number
}

export class ParticleSystem {
    parent: Player;
    position: Vector;
    angle = 1.5;
    angleSpread = .5;
    particles: Particle[] = [];
    maxParticles = 256;
    emitRate = 1;
    emitBuildup = 0;
    container: ParticleContainer;
    wrapper: Container;
    emitSpeed = 100;
    particleLifeTime = 1;
    enabled = true;
    scaleFrom = .2;
    scaleTo = 1;
    alphaFrom = .3;
    alphaTo = .1;
    collision = false;
    maxAge = 0;
    age=  0;
    constructor(settings: ParticleSystemSettings) {
        this.emitRate = settings.emitRate ?? 1;
        this.maxParticles = 256 * this.emitRate;
        this.container = new ParticleContainer(this.maxParticles);
        this.wrapper = new Container();
        this.position = settings.position.result();
        this.wrapper.addChild(this.container);
        this.wrapper.filters = [new ParticleFilter(settings.colorFrom ?? new Color(255, 255, 200), settings.colorTo ?? new Color(255, 50, 0))];
        this.wrapper.filterArea = Camera.rect;
        this.maxAge = settings.maxAge ?? 0;
        //this.container.blendMode = BLEND_MODES.ADD
        ParticleSystem.parentContainer.addChild(this.wrapper);
        ParticleSystem.list.push(this);
    }

    update(dt: number) {
        if (this.enabled) {
            this.age+=dt;
            if(this.maxAge > 0 && this.age >= this.maxAge){
                this.enabled = false;
            }
            this.emitBuildup += dt * 100 * this.emitRate;
            if (this.particles.length < this.maxParticles) {
                while (this.emitBuildup > 0) {
                    this.emitBuildup--;
                    this.spawnParticle();
                }
            }
        }
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            i -= p.update(dt);
        }
        if(!this.enabled &&this.particles.length == 0){
            this.remove();
        }
    }

    spawnParticle() {
        let v = Vector.fromAngle(random(-1, 1) * this.angleSpread + this.angle).mult(this.emitSpeed)
        if (this.parent) v.add(this.parent.velocity)
        const p = new Particle(this, this.position, v);
        p.system = this;
        p.maxAge = random(.8, 2) * this.particleLifeTime;
        this.particles.push(p);
    }

    remove(){
        ParticleSystem.list.splice(ParticleSystem.list.indexOf(this),1);
    }

    static list: ParticleSystem[] = [];
    static update(dt: number) {
        const cam = Camera.position.result();
        this.parentContainer.position.set(-cam.x, Camera.height + cam.y);
        for (let i = 0; i < this.list.length; i++) {
            const ps = this.list[i];
            ps.update(dt);
        }
    }
    static parentContainer = new Container();
}

class Particle {
    position: Vector;
    velocity: Vector;
    age = 0;
    maxAge = 1;
    sprite: Sprite;
    system: ParticleSystem;
    constructor(system: ParticleSystem, position: Vector, velocity: Vector) {
        this.position = position.result();
        this.velocity = velocity.result();
        this.sprite = Sprite.from("particle/softBig.png");
        this.sprite.scale.set(.5);
        this.sprite.anchor.set(.5);
        this.sprite.alpha = .05;
        this.system = system;
        this.system.container.addChild(this.sprite);
        //Entity.graphic.addChild(this.sprite);

    }
    update(dt: number) {
        this.age += dt;
        if (this.age >= this.maxAge) {
            this.remove();
            return 1;
        }
        const ageRatio = 1 - (this.age / this.maxAge);
        this.velocity.y += dt * 200;
        this.velocity.x += dt * 100;
        this.sprite.alpha = lerp(this.system.alphaFrom, this.system.alphaTo, 1 - ageRatio);
        this.sprite.scale.set(lerp(this.system.scaleFrom, this.system.scaleTo, 1 - ageRatio));
        this.sprite.tint = Color.fromHsl(0, 0, (ageRatio));
        this.position.add(this.velocity.result().mult(dt).mult(ageRatio));
        if (this.system.collision) {
            let pos = this.position.result().add(this.velocity.result().mult(dt).mult(ageRatio)).round().xy();
            if (Terrain.testValid(...pos) && Terrain.getPixel(...pos) != terrainType.void) this.velocity.mult(-.1);
        }
        //const pos = this.position.result().round();
        this.sprite.position.set(this.position.x, -this.position.y);
        return 0;
    }
    remove() {
        this.sprite.destroy({ texture: false });
        this.system.particles.splice(this.system.particles.indexOf(this), 1);
    }
}