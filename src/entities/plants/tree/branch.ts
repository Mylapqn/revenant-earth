import { Graphics, Rectangle } from "pixi.js";
import { debugPrint } from "../../../game";
import { Color } from "../../../color";
import { Entity } from "../../../entity";
import { angleDiff, random, randomBool, randomInt } from "../../../utils";
import { Vector } from "../../../vector";
import { Falling } from "../../falling";
import { Leaf } from "./leaf";
import { Seed } from "./seed";
import { defaultTreeSettings, TreeSettings } from "./treeSettings";
import { OutlineFilter } from "@pixi/filter-outline";
import { Camera } from "../../../camera";

export class Branch extends Entity {
    seed: Seed;
    graphics: Graphics;
    attachPoint: BranchPoint;

    energy = 10;
    age = 0;
    main = false;
    barkColor = Color.randomAroundHSL(30, 5, .3, .05, .3, .1);
    leafColor = Color.randomAroundHSL(85, 7, .3, .1, .45, .1);
    debugColor = Color.random().toPixi();
    leafy = false;
    leafiness = 0;

    removed = false;

    childBranches: Branch[] = [];
    childLeaves: Leaf[] = [];
    points: BranchPoint[] = [];

    growthSincePush = 0;
    growth = 0;
    nextSplit;
    nextThickness = 150;

    trueAngle = 0;

    endPos: Vector = new Vector(0, 0);
    growAngle = 0;
    angleOffset = 0;

    settings: TreeSettings

    delay = 0;
    angleSpeed = 0;
    deltaAngle = 0;
    baseAngle = 0;

    constructor(position: Vector, parent: Entity, seed: Seed, angle = 0, settings: TreeSettings = defaultTreeSettings) {
        const graph = new Graphics();
        super(graph, position, parent, 0);
        this.seed = seed;
        this.growAngle = 0;
        angle %= Math.PI * 2;
        this.points.push(new BranchPoint(this.endPos.result(), angle, this));
        this.seed.b++;
        this.angle = angle;
        this.baseAngle = this.angle;
        if (this.parent instanceof Branch)
            this.trueAngle = (this.angle + this.parent.trueAngle) % (Math.PI * 2);

        this.settings = structuredClone(settings);
        this.nextSplit = this.settings.split.initialDelay
    }

    update(dt: number) {
        if (this.removed) return;
        if (this.parent instanceof Branch) {
            if (this.parent.removed) {
                this.remove();
                return;
            }
        }
        let posUpdate = false;
        if (this.seed.graphics.visible) {
            this.angleSpeed += random(-1, 1) * .003;
            this.deltaAngle += this.angleSpeed * .1 / Math.pow(this.points[0].thickness, 1.5)
            this.angleSpeed -= this.deltaAngle * .1;
            this.angleSpeed *= .999;
            this.angle = this.baseAngle + this.deltaAngle + this.angleOffset;
            posUpdate = true;
        }
        this.trueAngle = this.worldAngle();
        if (!this.main && this.age < 1000) {
            this.angleOffset = Math.max(-this.settings.main.gravityBend.limit, Math.min(this.settings.main.gravityBend.limit, this.angleOffset + angleDiff(this.trueAngle, -Math.PI) * .0001 * this.settings.main.gravityBend.speed));
        }
        if (this.age == 0) {
            if (this.leafy) {
                for (let i = 0; i < this.settings.main.leafAmount; i++) {
                    let l = new Leaf(this, this.seed, { position: new Vector(random(-5, 5), random(-5, 5)), angle: random(-2, 2) });
                    this.childLeaves.push(l);
                }
            }
            else if (this.settings.main.leafAmount > 0) {
                let l = new Leaf(this, this.seed, { position: new Vector(0, 0), angle: this.growAngle });
                this.childLeaves.push(l);
                l.update();
            }
            if (this.main) {
                this.settings.main.maxGrowth *= random(.7, 1.3);
            }
        }
        this.age++;
        //this.growSpeed *= .9995;
        if (this.energy > 1 || true) {
            this.energy -= 1;
            if (this.parent instanceof Branch) {
                let energyDeficit = this.parent.energy - this.energy
                if (energyDeficit > 1) {
                    this.parent.energy -= energyDeficit / 2;
                    this.energy += energyDeficit / 2;
                }
            }
            if (this.settings.main.growSpeed > 0) {
                posUpdate = true;
                if (this.growth < this.settings.main.maxGrowth) {
                    this.growAngle += random(-this.settings.main.angleWarping, this.settings.main.angleWarping) * this.settings.main.growSpeed;
                    this.growAngle += angleDiff(this.growAngle + this.trueAngle, 0) * this.settings.main.angleRising * this.settings.main.growSpeed;

                    this.endPos.add(Vector.fromAngle(this.growAngle - Math.PI / 2).mult(this.settings.main.growSpeed));
                    this.points[this.points.length - 1].position = this.endPos.result();
                    this.growthSincePush += this.settings.main.growSpeed;
                    this.growth += this.settings.main.growSpeed;
                    //for (const cb of this.points[this.points.length - 1].childBranches) {
                    //    cb.position = this.points[this.points.length - 1].position;
                    //}
                    if (this.growthSincePush > 8) {
                        this.points.push(new BranchPoint(this.endPos.result(), this.growAngle, this));
                        this.growthSincePush = 0;
                        if (this.leafy) {
                            for (let i = 0; i < this.settings.main.leafAmount; i++) {
                                let l = new Leaf(this, this.seed, { position: Vector.fromAngle(this.growAngle - Math.PI / 2).mult(-8).add(new Vector(random(-5, 5), random(-5, 5))), angle: random(-2, 2) });
                                this.childLeaves.push(l);
                            }
                        }
                    }
                }
                if (this.growth >= this.settings.main.maxGrowth) {
                    this.finalSplit();
                }
                else if (this.growth >= this.nextSplit) {
                    this.split();
                    this.nextSplit += random(1.0, 1.5) * this.settings.split.requiredGrowth;
                }
            }
        }
        if (posUpdate)
            this.updatePosition();
        if (this.growth < this.settings.main.maxGrowth)
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
            p.drawColor = this.leafColor.mix(this.barkColor, p.age * 2 / 1000 +this.settings.main.branchGreenStart).toPixi();
            if (p.age >= p.nextThickness && this.settings.main.growSpeed > 0) {
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

        if (this.settings.main.maxGrowth < this.settings.main.growthLeafLimit) {
            this.leafy = true;
            p.split(this.settings.main.leafAmount, this.settings.main.leafAmount, 0, 1.5, true);
            //this.settings.growSpeed = 0;
        }
        else {
            while (this.childBranches.length > this.settings.main.maxBranches) {
                for (let i = 0; i < this.points.length; i++) {
                    const p = this.points[i];
                    if (p.childBranches.length > 0) {
                        p.childBranches[0].remove();
                        break;
                    }
                }
            }
            p.split(this.settings.split.amount.min, this.settings.split.amount.max, this.settings.split.angle.min, this.settings.split.angle.max, false);
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
        p.split(this.settings.main.leafAmount, this.settings.main.leafAmount, 0, 1.5, true);
        this.settings.main.growSpeed = 0;
        this.leafy = true;

    }
    remove() {
        //console.log("rem");
        if (this.parent instanceof Branch && !this.parent.removed) {
            let f = new Falling(this);
            f.rotSpeed = (this.trueAngle) / 100;
            //console.log(f.rotSpeed);
        }
        this.seed.b--;
        let b = this.childBranches[0];
        while (b) {
            //console.log("remchild "+this.childBranches.length);
            b.remove();
            b = this.childBranches[0];
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
    worldAngle(): number {
        if (this.parent instanceof Branch) return this.parent.trueAngle + this.angle;
        else return super.worldAngle();
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
                let l = new Leaf(this.branch, this.branch.seed, { position: new Vector(random(-5, 5), random(-5, 5)), angle: this.branch.growAngle + angularDifference });
                this.branch.childLeaves.push(l);
            }
            else {
                if (i % 2 == 0) {
                    angularDifference = random(angMin, angMax);
                    if (randomBool()) angularDifference *= -1;
                }
                let mg = random(.5, 1.2) * (this.branch.settings.main.maxGrowth - this.branch.growth) * this.branch.settings.splitOffsets.maxGrowthMultiplier;
                if (mg < 3) {
                    this.branch.leafy = true;
                    continue;
                }

                const b = new Branch(this.position.result(), this.branch, this.branch.seed, this.branch.growAngle + angularDifference, this.branch.settings);
                //b.energy = random(.3, .5) * this.branch.energy;
                b.settings.main.maxGrowth = mg;
                b.settings.main.angleRising = this.branch.settings.main.angleRising + this.branch.settings.splitOffsets.angleRising;
                b.settings.main.growSpeed = random(.8, 1.2) * this.branch.settings.main.growSpeed;
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