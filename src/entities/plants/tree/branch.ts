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
    leafiness = 0;
    leafy = false;
    permanent = false;

    removed = false;

    childBranches: Branch[] = [];
    childLeaves: Leaf[] = [];
    points: BranchPoint[] = [];

    growthSincePush = 0;
    growth = 0;
    nextSplit = 10;
    nextThickness = 150;

    endPos: Vector = new Vector(0, 0);
    growAngle = -Math.PI / 2;

    settings = {
        maxGrowth: 150,
        growSpeed: .1,
        warping: .1,
        rising: .04,
        splitOffsets: {
            rising: -.01
        }
    }

    delay = 0;

    maxBranches = 6;

    constructor(position: Vector, parent: Entity, seed: Seed, growAngle = -Math.PI / 2) {
        const graph = new Graphics();
        super(graph, position, parent, 0);
        this.seed = seed;
        this.growAngle = growAngle;
        this.points.push(new BranchPoint(this.endPos.result(), this.growAngle, this));
        this.seed.b++;
    }

    update() {
        if (this.parent instanceof Branch) {
            if (this.parent.removed) {
                this.remove();
                return;
            }
        }
        if (this.age == 0) {
            if (this.leafy) {
                for (let i = 0; i < 8; i++) {
                    let l = new Leaf(new Vector(random(-5, 5), random(-5, 5)), this, this.seed, random(-2, 2));
                    this.childLeaves.push(l);
                }
            }
            else {
                let l = new Leaf(new Vector(0, 0), this, this.seed, this.growAngle);
                this.childLeaves.push(l);
                l.update();
            }
        }
        this.age++;
        this.leafiness += .0001;
        //this.growSpeed *= .9995;
        if (this.main) {
            debugPrint("Energy: " + this.energy);
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
            if (this.growth < this.settings.maxGrowth) {
                this.growAngle += random(-this.settings.warping, this.settings.warping) * this.settings.growSpeed;
                this.growAngle = rotateAngle(this.growAngle, Math.PI / -2, this.settings.rising * this.settings.growSpeed);
                this.endPos.add(Vector.fromAngle(this.growAngle).mult(this.settings.growSpeed));
                this.points[this.points.length - 1].position = this.endPos.result();
                this.growthSincePush += this.settings.growSpeed;
                this.growth += this.settings.growSpeed;
                if (this.growthSincePush > 10) {
                    this.points.push(new BranchPoint(this.endPos.result(), this.growAngle, this));
                    this.growthSincePush = 0;
                }
            }
            if (this.settings.growSpeed > 0 && this.growth >= this.settings.maxGrowth) {
                this.finalSplit();
            }
            if (this.settings.growSpeed > 0 && this.growth >= this.nextSplit) {
                this.split();
                //this.thickness += .5;
                this.nextSplit += random(10, 15);
            }
        }
        //if (this.age >= this.lifeTime && !this.permanent) {
        //    this.remove();
        //    return;
        //}
        if (this.settings.growSpeed == 0) return;
        this.updatePosition();
        this.draw();
        this.queueUpdate();
    }
    draw() {
        //let color = this.barkColor;
        //let color = this.leafColor.mix(this.barkColor, this.age * 2 / 1000 - .1);
        this.graphics.clear();
        //this.graphics.beginFill(color.toPixi())
        //this.graphics.drawPolygon([Math.floor(this.thickness / 2), 0, -Math.ceil(this.thickness / 2), 0, this.endPos.x, this.endPos.y])
        //this.graphics.lineStyle(1, color.toPixi());
        //this.graphics.lineTo(...this.endPos.xy());
        for (let i = 0; i < this.points.length; i++) {
            const p = this.points[i];
            p.age++;
            p.drawColor = this.leafColor.mix(this.barkColor, p.age * 2 / 1000 - .1).toPixi();
            if (p.age >= p.nextThickness) {
                p.nextThickness *= 2;
                p.thickness++;
            }
            this.graphics.lineStyle(Math.max(1, Math.floor(p.thickness)), p.drawColor);
            this.graphics.lineTo(...p.rPos());
        }
        this.graphics.lineStyle(0);
        //this.graphics.beginFill(this.debugColor);
        for (let i = 0; i < this.points.length - 1; i++) {
            const p = this.points[i];
            this.graphics.beginFill(p.drawColor);
            let t = Math.max(1, Math.floor(p.thickness));
            if (t > 2)
                this.graphics.drawCircle(...p.rPos(), Math.floor(t / 2));

        }
    }
    split() {

        const p = this.points[this.points.length - 1];

        if (this.settings.maxGrowth < 10) {
            p.split(4, 7, 0, 1.5, true);
            this.settings.growSpeed = 0;
        }
        else {
            while (this.childBranches.length > this.maxBranches) {
                for (let i = 0; i < this.points.length; i++) {
                    const p = this.points[i];
                    if (p.childBranches.length > 0) {
                        p.childBranches[0].remove();
                        break;
                    }
                }
            }
            this.leafiness += .2;
            p.split(1, 1, .4, .7, false);
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
        this.settings.growSpeed = 0;

    }
    remove() {
        this.seed.b--;
        for (const b of this.childBranches) {
            b.remove();
        }
        for (const l of this.childLeaves) {
            l.remove();
        }
        if (this.attachPoint) {
            this.attachPoint.childBranches.splice(this.attachPoint.childBranches.indexOf(this), 1);
            if (this.parent instanceof Branch) {
                this.parent.childBranches.splice(this.parent.childBranches.indexOf(this), 1);
            }
        }
        this.removed = true;
        super.remove();
    }
}

class BranchPoint {
    drawColor = 0x000;
    thickness = 0;
    nextThickness = 100;
    age = 0;
    branch: Branch;
    position: Vector;
    childBranches: Branch[] = [];
    angle: number;
    constructor(position: Vector, angle: number, branch: Branch) {
        this.position = position.result();
        this.angle = angle;
        this.branch = branch;
    }
    split(min: number, max: number, angMin: number, angMax: number, leafy: boolean) {
        if (this.branch.removed) return;
        let r, angularDifference;
        r = randomInt(min, max);
        for (let i = 0; i < r; i++) {
            angularDifference = random(angMin, angMax);
            if (randomBool()) angularDifference *= -1;
            if (leafy) {
                this.branch.leafy = true;
                let l = new Leaf(new Vector(random(-5, 5), random(-5, 5)), this.branch, this.branch.seed, this.branch.growAngle + angularDifference);
                this.branch.childLeaves.push(l);
            }
            else {
                let mg = random(.5, 1.2) * (this.branch.settings.maxGrowth - this.branch.growth);
                if (mg < 6) continue;
                let b = new Branch(this.position.result(), this.branch, this.branch.seed, this.branch.growAngle + angularDifference);
                //b.energy = random(.3, .5) * this.branch.energy;
                b.settings.maxGrowth = mg;
                //b.lifeTime = random(.2, 1) * this.branch.lifeTime;
                //b.thickness = Math.min(1, this.branch.thickness) - 2;
                b.leafiness = this.branch.leafiness + .2;
                b.settings.rising = this.branch.settings.rising + this.branch.settings.splitOffsets.rising;
                b.settings.growSpeed = random(.8, 1.2) * this.branch.settings.growSpeed;
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

                if (r == 1) {
                    this.branch.growAngle -= random(.2, .9) * angularDifference;
                }
                this.branch.childBranches.push(b);
                b.attachPoint = this;
                this.childBranches.push(b);
                //angularDifference *= -1;
            }
        }
    }
    rPos(): [number, number] {
        return [Math.floor(this.position.x), Math.floor(this.position.y)];
    }
}