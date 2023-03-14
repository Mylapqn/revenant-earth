import { Sprite, Graphics } from "pixi.js";
import { debugPrint } from "../../..";
import { Color } from "../../../color";
import { Entity } from "../../../entity";
import { angleDiff, random, randomBool, randomInt, rotateAngle } from "../../../utils";
import { Vector } from "../../../vector";
import { Falling } from "../../falling";
import { Leaf } from "./leaf";
import { Seed } from "./seed";


const defaultSettings = {
    maxGrowth: 100,
    growSpeed: .1,
    warping: .1,
    rising: .04,
    maxBranches: 6,
    growthLeafLimit: 10,
    growthPerSplit: 10,
    leafAmount: 5,
    splitOffsets: {
        rising: -.01,
        maxGrowthMult: 1,
    },
    split: {
        angleMin: .3,
        angleMax: .4,
        min: 1,
        max: 1,
    }
}

const coniferousSettings = {
    maxGrowth: 200,
    growSpeed: .1,
    warping: .0,
    rising: .02,
    maxBranches: 30,
    growthLeafLimit: 50,
    growthPerSplit: 7,
    leafAmount: 2,
    maxGravityBend: 1.9,
    splitOffsets: {
        rising: .05,
        maxGrowthMult: .2,
        leafiness: 1,
    },
    split: {
        angleMin: .2,
        angleMax: .3,
        min: 2,
        max: 2,
    }
}

const poplarSettings = {
    maxGrowth: 150,
    growSpeed: .1,
    warping: .1,
    rising: .05,
    maxBranches: 12,
    growthLeafLimit: 20,
    growthPerSplit: 10,
    leafAmount: 5,
    maxGravityBend: .3,
    splitOffsets: {
        rising: 0,
        maxGrowthMult: .5,
    },
    split: {
        angleMin: .5,
        angleMax: .9,
        min: 1,
        max: 2,
    }
};

export class Branch extends Entity {
    seed: Seed;
    graphics: Graphics;
    attachPoint: BranchPoint;

    energy = 10;
    age = 0;
    main = false;
    barkColor = Color.randomAroundHSL(30, 5, .35, .05, .35, .1);
    leafColor = Color.randomAroundHSL(95, 5, .4, .1, .45, .1);
    debugColor = Color.random().toPixi();
    leafy = false;
    leafiness = 0;

    removed = false;

    childBranches: Branch[] = [];
    childLeaves: Leaf[] = [];
    points: BranchPoint[] = [];

    growthSincePush = 0;
    growth = 0;
    nextSplit = 5;//7
    nextThickness = 150;

    trueAngle = 0;

    endPos: Vector = new Vector(0, 0);
    growAngle = 0;
    angleOffset = 0;

    settings = {
        maxGrowth: 120,
        growSpeed: .1,
        warping: .1,
        rising: .04,
        maxBranches: 7,
        growthLeafLimit: 10,
        growthPerSplit: 10,
        leafAmount: 4,
        maxGravityBend: .3,
        splitOffsets: {
            rising: -.01,
            maxGrowthMult: .9,
            leafiness:0,
        },
        split: {
            angleMin: .3,
            angleMax: .4,
            min: 1,
            max: 1,
        }
    };

    delay = 0;
    angleSpeed = 0;
    deltaAngle = 0;
    baseAngle = 0;

    constructor(position: Vector, parent: Entity, seed: Seed, growAngle = 0) {
        const graph = new Graphics();
        super(graph, position, parent, 0);
        this.seed = seed;
        this.growAngle = 0;
        growAngle %= Math.PI * 2;
        this.points.push(new BranchPoint(this.endPos.result(), growAngle, this));
        this.seed.b++;
        this.angle = growAngle;
        this.baseAngle = this.angle;
        if (this.parent instanceof Branch)
            this.trueAngle = (this.angle + this.parent.trueAngle) % (Math.PI * 2);
    }

    update() {
        this.angleSpeed += random(-1, 1) * .003;
        this.deltaAngle += this.angleSpeed * .1 / Math.pow(this.points[0].thickness, 1.5)
        this.angleSpeed -= this.deltaAngle * .1;
        this.angleSpeed *= .999;
        this.angle = this.baseAngle + this.deltaAngle + this.angleOffset;
        this.trueAngle = this.worldAngle();
        if (!this.main) {
            this.angleOffset = Math.max(-this.settings.maxGravityBend, Math.min(this.settings.maxGravityBend, this.angleOffset + angleDiff(this.trueAngle, -Math.PI) * .0001));
        }
        if (this.parent instanceof Branch) {
            if (this.parent.removed) {
                this.remove();
                return;
            }
        }
        if (this.age == 0) {
            if (this.leafy) {
                for (let i = 0; i < this.settings.leafAmount; i++) {
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
        //this.growSpeed *= .9995;
        if (this.main) {
            debugPrint("rot:" + this.angleSpeed)
            debugPrint("Energy: " + this.energy);
            debugPrint("Leafiness: " + this.leafy);
            debugPrint("Growth: " + this.growth);
            debugPrint("NextSplit: " + this.nextSplit);
            //console.log(angleDiff(this.growAngle + this.trueAngle, 0));
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
            if (this.settings.growSpeed > 0) {
                if (this.growth < this.settings.maxGrowth) {
                    this.growAngle += random(-this.settings.warping, this.settings.warping) * this.settings.growSpeed;
                    this.growAngle += angleDiff(this.growAngle + this.trueAngle, 0) * this.settings.rising * this.settings.growSpeed;

                    this.endPos.add(Vector.fromAngle(this.growAngle - Math.PI / 2).mult(this.settings.growSpeed));
                    this.points[this.points.length - 1].position = this.endPos.result();
                    this.growthSincePush += this.settings.growSpeed;
                    this.growth += this.settings.growSpeed;
                    //for (const cb of this.points[this.points.length - 1].childBranches) {
                    //    cb.position = this.points[this.points.length - 1].position;
                    //}
                    if (this.growthSincePush > 8) {
                        this.points.push(new BranchPoint(this.endPos.result(), this.growAngle, this));
                        this.growthSincePush = 0;
                        if (this.leafy) {
                            for (let i = 0; i < this.settings.leafAmount; i++) {
                                let l = new Leaf(Vector.fromAngle(this.growAngle - Math.PI / 2).mult(-8).add(new Vector(random(-5, 5), random(-5, 5))), this, this.seed, random(-2, 2));
                                this.childLeaves.push(l);
                            }
                        }
                    }
                }
                if (this.growth >= this.settings.maxGrowth) {
                    this.finalSplit();
                }
                if (this.growth >= this.nextSplit) {
                    this.split();
                    this.nextSplit += random(1.0, 1.5) * this.settings.growthPerSplit;
                }
            }
        }

        this.updatePosition();
        if(this.growth < this.settings.maxGrowth)
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
            if (p.age >= p.nextThickness && this.settings.growSpeed > 0) {
                p.nextThickness *= 1.6;
                p.thickness++;
            }

            /*let thickSum = 0.2;
            for (const b of p.childBranches) {
                thickSum += b.points[0].thickness*.5;
            }
            if (i < this.points.length - 1) thickSum += this.points[i + 1].thickness;
            p.thickness = thickSum;*/

            this.graphics.lineStyle(Math.max(1, Math.floor(p.thickness)), p.drawColor);
            this.graphics.lineTo(...p.rPos());
        }
        this.graphics.lineStyle(0);
        for (let i = 0; i < this.points.length - 1; i++) {
            const p = this.points[i];
            this.graphics.beginFill(p.drawColor);
            //this.graphics.beginFill(this.debugColor);
            let t = Math.max(1, Math.floor(p.thickness));
            if (t > 2)
                this.graphics.drawCircle(...p.rPos(), Math.floor(t / 2));

        }
        //this.graphics.beginFill(this.debugColor);
        //this.graphics.drawRect(0, 0, 1, -10);
    }
    split() {

        const p = this.points[this.points.length - 1];

        if (this.settings.maxGrowth < this.settings.growthLeafLimit) {
            this.leafy = true;
            p.split(this.settings.leafAmount, this.settings.leafAmount, 0, 1.5, true);
            //this.settings.growSpeed = 0;
        }
        else {
            while (this.childBranches.length > this.settings.maxBranches) {
                for (let i = 0; i < this.points.length; i++) {
                    const p = this.points[i];
                    if (p.childBranches.length > 0) {
                        p.childBranches[0].remove();
                        break;
                    }
                }
            }
            p.split(this.settings.split.min, this.settings.split.max, this.settings.split.angleMin, this.settings.split.angleMax, false);
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
        p.split(this.settings.leafAmount, this.settings.leafAmount, 0, 1.5, true);
        this.settings.growSpeed = 0;
        this.leafy = true;

    }
    remove() {
        this.removed = true;
        if (this.parent instanceof Branch && !this.parent.removed) {
            let f = new Falling(this);
            f.rotSpeed = (this.trueAngle) / 100;
            console.log(f.rotSpeed);
        }
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
        super.remove();
    }
}

class BranchPoint {
    drawColor = 0x000;
    thickness = 1;
    nextThickness = 200;
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
            if (leafy) {
                angularDifference = random(angMin, angMax);
                if (randomBool()) angularDifference *= -1;
                this.branch.leafy = true;
                let l = new Leaf(new Vector(random(-5, 5), random(-5, 5)), this.branch, this.branch.seed, this.branch.growAngle + angularDifference);
                this.branch.childLeaves.push(l);
            }
            else {
                if (i % 2 == 0) {
                    angularDifference = random(angMin, angMax);
                    if (randomBool()) angularDifference *= -1;
                }
                let mg = random(.5, 1.2) * (this.branch.settings.maxGrowth - this.branch.growth) * this.branch.settings.splitOffsets.maxGrowthMult;
                if (mg < 3) {
                    this.branch.leafy = true;
                    continue;
                }
                const b = new Branch(this.position.result(), this.branch, this.branch.seed, this.branch.growAngle + angularDifference);
                //b.energy = random(.3, .5) * this.branch.energy;
                b.settings.maxGrowth = mg;
                b.settings.rising = this.branch.settings.rising + this.branch.settings.splitOffsets.rising;
                b.settings.growSpeed = random(.8, 1.2) * this.branch.settings.growSpeed;
                b.leafiness = this.branch.leafiness + this.branch.settings.splitOffsets.leafiness;
                if (b.leafiness >= 1) b.leafy = true;

                if (r == 1) {
                    this.branch.growAngle -= random(.2, .9) * angularDifference;
                }
                this.branch.childBranches.push(b);
                b.attachPoint = this;
                this.childBranches.push(b);
                angularDifference *= -1;
            }
        }
    }
    rPos(): [number, number] {
        return [Math.floor(this.position.x), Math.floor(this.position.y)];
    }
}