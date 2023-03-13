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
    graphics: Graphics;
    attachPoint: BranchPoint;

    energy = 10;
    thickness = 0;
    age = 0;
    main = false;
    barkColor = Color.randomAroundHSL(30, 5, .35, .05, .35, .1);
    leafColor = Color.randomAroundHSL(95, 5, .4, .1, .45, .1);
    debugColor = Color.random().toPixi();
    lifeTime = 300;
    leafiness = 0;
    leafy = false;
    permanent = false;

    removed = false;

    childBranches: Branch[] = [];
    points: BranchPoint[] = [];

    growthSincePush = 0;
    growth = 0;
    maxGrowth = 80;
    nextSplit = 20;
    nextThickness = 150;

    endPos: Vector = new Vector(0, 0);
    growAngle = -Math.PI / 2;

    growSpeed = .1;
    warping = .02;
    rising = .002;
    risingPerSplit = -.001;
    permanentChance = 0;
    delay = 0;

    maxBranches = 5;

    constructor(position: Vector, parent: Entity, seed: Seed, growAngle = -Math.PI / 2) {
        const graph = new Graphics();
        super(graph, position, parent, 0);
        this.seed = seed;
        this.growAngle = growAngle;
        this.points.push(new BranchPoint(this.endPos.result(), this.growAngle, this));
    }

    update() {
        if (this.age == 0) {
            if (this.leafy) {
                for (let i = 0; i < 8; i++) {
                    let l = new Leaf(new Vector(random(-5, 5), random(-5, 5)), this, this.seed, random(-2, 2));
                }
            }
            else {
                let l = new Leaf(new Vector(0, 0), this, this.seed, this.growAngle);
                l.update();
            }
        }
        this.age++;
        this.leafiness += .0001;
        //this.growSpeed *= .9995;
        if (this.main) {
            debugPrint("Energy: " + this.energy);
            debugPrint("Perm: " + this.permanentChance);
        }
        if (this.energy > 1 || true) {
            this.energy -= 1;
            if (this.parent instanceof Branch) {
                let energyDeficit = this.parent.energy - this.energy
                if (energyDeficit > 1) {
                    this.parent.energy -= energyDeficit / 2;
                    this.energy += energyDeficit / 2;
                }
            }
            //console.log(this.energy);
            if (this.growth < this.maxGrowth) {
                this.growAngle += random(-this.warping, this.warping);
                this.growAngle = rotateAngle(this.growAngle, Math.PI / -2, this.rising);
                this.endPos.add(Vector.fromAngle(this.growAngle).mult(this.growSpeed));
                this.points[this.points.length - 1].position = this.endPos.result();
                this.growthSincePush += this.growSpeed;
                this.growth += this.growSpeed;
                if (this.growthSincePush > 10) {
                    this.points.push(new BranchPoint(this.endPos.result(), this.growAngle, this));
                    this.growthSincePush = 0;
                }
            }
            if (this.growSpeed > 0 && this.growth >= this.maxGrowth) {
                this.finalSplit();
            }
            if (this.growSpeed > 0 && this.growth >= this.nextSplit) {
                this.split();
                this.thickness += .5;
                this.nextSplit += random(5, 20);
            }
        }
        //if (this.age >= this.lifeTime && !this.permanent) {
        //    this.remove();
        //    return;
        //}

        this.updatePosition();
        this.draw();
        this.queueUpdate();
    }
    draw() {
        //let color = this.barkColor;
        let color = this.leafColor.mix(this.barkColor, this.age * 2 / 1000 - .1);
        this.graphics.clear();
        //this.graphics.beginFill(color.toPixi())
        //this.graphics.drawPolygon([Math.floor(this.thickness / 2), 0, -Math.ceil(this.thickness / 2), 0, this.endPos.x, this.endPos.y])
        //this.graphics.lineStyle(1, color.toPixi());
        //this.graphics.lineTo(...this.endPos.xy());
        this.graphics.lineStyle(Math.max(1, Math.floor(this.thickness)), color.toPixi());
        for (let i = 0; i < this.points.length; i++) {
            const p = this.points[i];
            this.graphics.lineTo(...p.rPos());
        }
        this.graphics.lineStyle(0);
        this.graphics.beginFill(color.toPixi());
        //this.graphics.beginFill(this.debugColor);
        for (let i = 0; i < this.points.length - 1; i++) {
            const p = this.points[i];
            let t = Math.max(1, Math.floor(this.thickness));
            if (t > 2)
                this.graphics.drawCircle(...p.rPos(), Math.floor(t / 2));

        }
    }
    split() {
        const p = this.points[this.points.length - 1];

        if (this.leafiness >= 1 || this.maxGrowth < 10) {
            p.split(4, 7, 0, 1.5, true);
        }
        else {
            this.leafiness += .2;
            p.split(1, 2, .3, .9, false);
        }
        //for (let i = 1; i <= 3; i++) {
        //    const p = this.points[this.points.length - i];
        //    if (p.childBranches < 1) {
        //        p.split();
        //        return true;
        //    }
        //}
        //return false;
    }
    finalSplit() {
        const p = this.points[this.points.length - 1];
        p.split(4, 7, 0, 1.5, true);
        this.growSpeed = 0;

    }
    remove(): void {
        if (this.attachPoint) {
            this.attachPoint.childBranches--;
        }
        this.removed = true;
        for (const b of this.childBranches) {
            if (!b.removed) b.remove();
        }
        super.remove();
    }
}

class BranchPoint {
    branch: Branch;
    position: Vector;
    childBranches = 0;
    angle: number;
    constructor(position: Vector, angle: number, branch: Branch) {
        this.position = position.result();
        this.angle = angle;
        this.branch = branch;
    }
    split(min: number, max: number, angMin: number, angMax: number, leafy: boolean) {

        let r, angularDifference;
        r = randomInt(min, max);
        for (let i = 0; i < r; i++) {
            angularDifference = random(angMin, angMax);
            if (randomBool()) angularDifference *= -1;
            if (leafy) {
                this.branch.leafy = true;
                let l = new Leaf(new Vector(random(-5, 5), random(-5, 5)), this.branch, this.branch.seed, this.branch.growAngle + angularDifference);
            }
            else {
                let b = new Branch(this.position.result(), this.branch, this.branch.seed, this.branch.growAngle + angularDifference);
                //b.energy = random(.3, .5) * this.branch.energy;
                b.maxGrowth = random(.2, 1.2) * (this.branch.maxGrowth - this.branch.growth);
                //b.lifeTime = random(.2, 1) * this.branch.lifeTime;
                //b.thickness = Math.min(1, this.branch.thickness) - 2;
                b.leafiness = this.branch.leafiness + .2;
                b.rising = this.branch.rising + this.branch.risingPerSplit;
                //b.leafy = randomBool(b.leafiness);
                //if (this.branch.maxGrowth - this.branch.growth < 5) b.leafy = true;
                //if (b.leafy) {
                //    b.maxGrowth = 10;
                //    b.thickness = 1;
                //}
                //if (randomBool(this.branch.permanentChance)) {
                //    b.permanent = true;
                //}
                //else {
                //    b.remove();
                //    return;
                //}

                this.branch.childBranches.push(b);
                b.attachPoint = this;
                this.childBranches++;
                //angularDifference *= -1;
            }
        }
    }
    rPos(): [number, number] {
        return [Math.floor(this.position.x), Math.floor(this.position.y)];
    }
}