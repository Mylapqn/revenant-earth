import { Color } from "../../../color";
import { random, randomInt, rotateAngle } from "../../../utils";

const defaultSettings = {
    lifetime: .7,
    minSplitTime: .3,
    maxSplitTime: .6,
    thickness: 4,
    gravityInitial: .3,
    warping: 5,
    leafGeneration: 5,
    gravityPerGen: .35,
    angularDifference: 1.3,
    leafAmount: 6,
    leafLength: .17,
    leafGravity: 0,
    leafThickness: 3,
    splitEndMax: 5,
    splitMiddleMax: 4,
    skipGenMax: 0,
    leafStepsAdditional: 1,
    colorBase: new Color(50, 40, 35),
    colorLeaves: new Color(60, 100, 30)
}

export class Planter {
    angle;
    startX;
    startY;
    x;
    y;
    fx;
    fy;
    speed = 100;
    age = 0;
    lifeTime;
    splitTime;
    generation = 1;
    thickness;
    gravity;
    color;
    enabled = true;
    settings;

    constructor(x: number, y: number, angle = random(0, Math.PI * 2), settings = defaultSettings, generation = 1) {
        this.generation = generation;
        this.fx = x;
        this.fy = y;
        this.x = Math.floor(this.fx);
        this.y = Math.floor(this.fy);
        this.startX = x;
        this.startY = y;
        this.angle = angle;
        this.settings = settings;
        this.lifeTime = this.settings.lifetime * random(.4, 1.6);
        this.splitTime = this.lifeTime * random(this.settings.minSplitTime, (this.settings.maxSplitTime ?? (this.settings.minSplitTime + .1)));
        this.thickness = this.settings.thickness;
        this.gravity = this.settings.gravityInitial;
        this.color = Color.randomAroundHSL(30, 5, .35, .05, .35, .1);
    }
    update() {
        const growDeltaTime = .01;
        this.angle += random(-this.settings.warping, this.settings.warping) * growDeltaTime;
        this.angle = rotateAngle(this.angle, Math.PI / -2, this.gravity * growDeltaTime);
        this.fx += Math.cos(this.angle) * this.speed * growDeltaTime;
        this.fy += Math.sin(this.angle) * this.speed * growDeltaTime;
        /* if (this.fx >= dimensions.x) this.fx = dimensions.x - 1;
        if (this.fy >= dimensions.y) this.fy = dimensions.y - 1;
        if (this.fx < 0) this.fx = 0;
        if (this.fy < 0) this.fy = 0; */
        this.x = Math.floor(this.fx);
        this.y = Math.floor(this.fy);
        this.age += growDeltaTime;
        if (this.age > this.splitTime) {
            this.split(0, this.settings.splitMiddleMax);
            this.splitTime += random(this.settings.minSplitTime, this.settings.maxSplitTime ?? (this.settings.minSplitTime * 2));
        }
        //renderer.fillRect(Math.ceil(this.x - this.thickness / 2), Math.ceil(this.y - this.thickness / 2), this.thickness, this.thickness, this.color);


        if (this.age > this.lifeTime) {
            this.split(1, this.settings.splitEndMax);
            //renderer.fillRect(this.x, this.y, 1, 1, this.color);
            this.enabled = false;
            /* if (this.generation >= this.settings.leafGeneration) {
                if (random(0, 1) < (2 / (this.settings.leafAmount * this.settings.leafGeneration * this.settings.splitEndMax * this.settings.splitMiddleMax))) {
                    let particle = new Particle(this.x, this.y, this.angle);
                    particle.planterSettings = this.settings;
                    particle.color = this.color;
                }
            } */
        }
    }
    split(min = 0, max = 3) {
        let r = randomInt(min, max);
        let angularDifference = this.settings.angularDifference;
        if (this.generation >= this.settings.leafGeneration) r = 1;
        if (this.generation >= this.settings.leafGeneration + (this.settings.leafStepsAdditional ?? 0)) r = 0;
        if (r == 1) angularDifference = 0.1;
        if (this.generation + 1 == this.settings.leafGeneration) {
            angularDifference = 3;
            r = this.settings.leafAmount;
        }

        for (let i = 0; i < r; i++) {
            //console.log(this.generation, r, this.settings.leafGeneration);
            let pla = new Planter(this.x, this.y, rotateAngle((this.angle + random(-angularDifference, angularDifference)), Math.PI / -2, .3), this.settings, this.generation + 1);
            pla.thickness = Math.max(1, this.thickness - 1);
            if (this.generation < this.settings.leafGeneration) pla.generation += randomInt(0, (this.settings.skipGenMax ?? 1))
            pla.lifeTime /= pla.generation;
            pla.splitTime /= pla.generation / pla.generation;
            pla.gravity -= pla.generation * this.settings.gravityPerGen
            if (pla.generation >= this.settings.leafGeneration) {
                //pla.enabled = false;
                pla.color = this.settings.colorLeaves;
                pla.lifeTime *= this.settings.leafLength;
                pla.thickness = Math.max(1, this.settings.leafThickness - (pla.generation - this.settings.leafGeneration))
                pla.gravity = this.settings.leafGravity;
            }
        }
    }
}

