import { Sprite, Graphics } from "pixi.js";
import { debugPrint } from "../../..";
import { Color } from "../../../color";
import { Entity } from "../../../entity";
import { random, randomBool, randomInt, rotateAngle } from "../../../utils";
import { Vector } from "../../../vector";
import { Leaf } from "./leaf";
import { Seed } from "./seed";


export class Branch extends Entity {
    seed: Seed;
    age = 0;
    maxAge = 2850;
    maxGrowAge = 400;
    generation = 1;
    startAngle = 0;
    endAngle = 0;
    childBranches: Branch[] = [];
    attachPos = new Vector();
    attachPoint: BranchPoint;
    endPos = new Vector();
    growAngle = Math.PI / 2 + random(-.3, .3);
    graphics: Graphics;

    timeSincePush = 0;

    energy = 20;

    weights = {
        grow: 20,
        thicken: 0,
        split: 0
    }

    leafGeneration = 3;
    leafAmount = 4;
    splitAge = randomInt(300, 800);
    barkColor: Color;
    leafColor: Color;
    debugColor: number;
    points: BranchPoint[] = [];
    warping = .01;
    gravity = -.0002;
    constructor(position: Vector, parent: Entity, seed: Seed, growAngle = 0, generation = 1) {
        const graph = new Graphics();
        super(graph, position, parent, 0);
        this.barkColor = Color.randomAroundHSL(30, 5, .35, .05, .35, .1);
        this.leafColor = Color.randomAroundHSL(95, 5, .4, .1, .45, .1);
        this.debugColor = Color.random().toPixi();
        this.seed = seed;
        this.generation = generation;
        this.maxGrowAge = Math.floor(randomInt(90, 120));
        this.growAngle = growAngle;
        this.angle = 0;
        new Leaf(this.endPos, this, this.seed, -this.growAngle + Math.PI / 2);
    }

    update() {
        this.updatePosition();
        this.growAngle += random(-this.warping, this.warping);
        this.growAngle = rotateAngle(this.growAngle, Math.PI / -2, this.gravity);
        //this.energy -= this.childBranches.length;
        if (!this.attachPoint)
            debugPrint("Grow " + this.weights.grow + "\nThck " + this.weights.thicken + "\nSplt " + this.weights.split)
        let weightSum = this.weights.grow + this.weights.thicken + this.weights.split;
        let roll = random(0, weightSum);
        if (roll < this.weights.grow || this.points.length == 0) {
            //Grow
            //if (this.energy > 10) {
            if (this.age <= this.maxAge && (!this.points[0] || this.points.length / 4 < this.points[0].thickness)) {
                this.endPos.x += Math.cos(this.growAngle) * .1 // this.generation;
                this.endPos.y += Math.sin(this.growAngle) * .1 // this.generation;
                this.timeSincePush++;
                if (this.timeSincePush > 100) {
                    this.points.push(new BranchPoint(this.endPos.result(), this.growAngle, this));
                    this.timeSincePush = 0;
                }
                this.energy -= 10;
            }
            //}
            this.weights.grow--;
            this.weights.thicken += .01;
            this.weights.split += 0.01;

        } else {
            roll -= this.weights.grow;

            if (roll < this.weights.thicken) {
                //Thicken
                //if (this.energy > this.points.length * 20 + 50 && this.age % 100 == 0 && this.points.length > 0) {
                if (!this.attachPoint || this.attachPoint?.thickness > this.points[0].thickness) {
                    for (let i = 0; i < this.points.length; i++) {
                        const p = this.points[i];
                        p.thickness++;
                        this.energy -= 20;
                    }
                }
                //}
                this.weights.grow += 100;
                this.weights.thicken = 0;
                this.weights.split++;
            } else {
                roll -= this.weights.grow;
                if (roll < this.weights.split) {
                    //Split
                    this.weights.split = 0;
                    //if (this.energy >= 20) {
                    if (this.generation < this.leafGeneration) {
                        if (this.split(1, 3)) {
                            this.splitAge += randomInt(80, 150);
                            this.energy -= 20;
                        }
                    }
                    //}
                    this.weights.thicken += 10;
                }
            }
        }

        this.weights.grow = Math.max(0, this.weights.grow);
        this.weights.split = Math.max(0, this.weights.split);
        this.weights.thicken = Math.max(0, this.weights.thicken);

        for (let i = 0; i < this.childBranches.length; i++) {
            const b = this.childBranches[randomInt(0, this.childBranches.length - 1)];
            if (this.energy >= 5 && this.energy > b.energy) {
                b.energy += 5;
                this.energy -= 5;
            }
        }


        //if (this.age == this.maxGrowAge) {
        //    this.split(1, 2, true);
        //}


        this.age++;
        if (this.age == this.maxAge) {
            //console.log("End gen " + this.generation, this.age, this.maxAge);
            if (this.timeSincePush < 50) {
                this.points.splice(this.points.length - 1, 1);
                this.timeSincePush = 0;
            }
            this.points.push(new BranchPoint(this.endPos.result(), this.growAngle, this));
            //this.draw();
            //return;
        }
        this.draw();
        this.queueUpdate();
    }
    draw() {
        let color = this.leafColor.mix(this.barkColor, this.age * 2 / this.maxAge - .1);
        this.graphics.clear();
        this.graphics.moveTo(0, 0);
        for (let i = 0; i < this.points.length; i++) {
            const p = this.points[i];
            //p.thickness += .003;

            this.graphics.lineStyle(Math.max(1, Math.floor(p.thickness)), color.toPixi());
            this.graphics.lineTo(...p.rPos());
        }
        if (this.age <= this.maxAge) {
            this.graphics.lineStyle(1, color.toPixi());
            this.graphics.lineTo(Math.floor(this.endPos.x), -Math.floor(this.endPos.y));
        }

        this.graphics.lineStyle(0);
        this.graphics.beginFill(color.toPixi());
        for (let i = 0; i < this.points.length - 1; i++) {
            const p = this.points[i];
            let t = Math.max(2, Math.floor(p.thickness));
            if (t > 2)
                this.graphics.drawCircle(...p.rPos(), Math.floor(t / 2));

        }
        this.graphics.endFill();

        //for (let i = 0; i < this.points.length; i++) {
        //    const p = this.points[i];
        //    this.graphics.lineStyle(0, this.barkColor.toPixi());
        //    this.graphics.beginFill(this.debugColor);
        //    this.graphics.drawRect(Math.floor(p.x), -Math.floor(p.y), 4 - this.generation, 4 - this.generation);
        //    this.graphics.endFill();
        //}
    }
    split(min = 0, max = 3, end = false) {
        for (let i = this.points.length - 1; i >= 0; i--) {
            const p = this.points[i];
            if (p.childBranches.length == 0) {
                p.split();
                return true;
            }
            return false;
        }


    }
}

class BranchPoint {
    branch: Branch;
    position: Vector;
    thickness = 1;
    childBranches: Branch[] = [];
    angle: number;
    constructor(position: Vector, angle: number, branch: Branch) {
        this.position = position.result();
        this.angle = angle;
        this.branch = branch;
    }
    split() {
        let r, angularDifference;
        r = randomInt(1, 2);
        angularDifference = random(.5, 1.5);
        if (randomBool()) angularDifference *= -1;
        for (let i = 0; i < r; i++) {
            //console.log(this.generation, r, this.settings.leafGeneration);
            let b = new Branch(this.position.result(), this.branch, this.branch.seed, this.angle + angularDifference, this.branch.generation + 1);
            angularDifference *= -1;
            //if (this.generation < this.leafGeneration) b.generation = Math.min(b.generation + randomInt(0, 2), this.leafGeneration);
            //b.attachPos = b.position.result().normalize(1).mult(0.9);
            //b.maxAge = Math.ceil(b.maxAge / b.generation)
            b.attachPoint = this;
            this.childBranches.push(b);
            this.branch.childBranches.push(b);
            //b.maxAge /= b.generation;
            //b.gravity -= b.generation * this.settings.gravityPerGen
        }
    }
    rPos(): [number, number] {
        return [Math.floor(this.position.x), -Math.floor(this.position.y)];
    }
}