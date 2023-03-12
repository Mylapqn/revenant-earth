import { Graphics, Point, Sprite } from "pixi.js";
import { Color } from "../../../color";
import { Entity } from "../../../entity";
import { Terrain, terrainType } from "../../../terrain";
import { random, randomInt } from "../../../utils";
import { Vector } from "../../../vector";
import { Seed } from "./seed";

export class Root extends Entity {
    seed: Seed;
    age = 0;
    depth = 0;
    segments = 0;
    startAngle = 0;
    growingAngle = 0;
    engAngle = 0;
    points: number[][] = [];
    lastPoint = [0, 0];
    graph: Graphics;
    constructor(position: Vector, parent: Entity, seed: Seed, angle = 0, depth = 1) {
        //const graph = Sprite.from("root.png");
        const graph = new Graphics();
        graph.lineStyle(4 - depth, Color.randomAroundHSL(30, 5, .35, .05, .18, .02).toPixi());

        //graph.scale.set(0);
        super(graph, position, parent, angle);
        this.graph = graph;
        this.points.push([0, 0]);
        this.lastPoint = this.points[0];
        //graph.anchor.set(0.5);
        this.depth = depth;
        this.seed = seed;
        //if (parent)
        //graph.anchor.set(0.5, 1);
    }

    update() {
        if (this.age < (4 - this.depth) * 100 && this.age % 40 == 0) {
            this.graph.moveTo(this.points[0][0], this.points[0][1]);
            let newPoint = [this.lastPoint[0] + randomInt(-2, 2), this.lastPoint[1] - 5];
            this.lastPoint = newPoint;
            this.points.push(this.lastPoint)
            for (let i = 1; i < this.points.length; i++) {
                this.graph.lineTo(this.points[i][0], this.points[i][1]);
            }
            if (this.depth < 3 && Math.random() < .4) {
                new Root(new Vector(this.lastPoint[0], this.lastPoint[1]), this, this.seed, random(-1.5, 1.5), this.depth + 1)
            }
        }
        this.age++;
        this.updatePosition();
        /*if (this.depth < 3 && this.age == 499) {
            for (let i = 0; i < 3; i++) {
                new Root(new Vector(0, Math.random() * 10 + 10), this, this.seed, Math.random() * 1 - i, this.depth + 1)
                this.age++;
            }
        }*/
        if (this.seed.energy < 1000) {
            const coords = (() => {
                let c = this.worldCoords(new Vector(this.lastPoint[0] + randomInt(-10, 10), this.lastPoint[1] + randomInt(-10, 10)));
                return new Vector(Math.floor(c.x), Math.floor(c.y));
            })();

            //console.log(coords.x, coords.y);
            let px = Terrain.getPixel(coords.x, coords.y);

            if (px == terrainType.dirt) {
                this.seed.energy += 1;
                Terrain.setAndUpdatePixel(coords.x, coords.y, terrainType.dryDirt);
            }

            if (px == terrainType.wetDirt) {
                this.seed.energy += 3;
                Terrain.setAndUpdatePixel(coords.x, coords.y, terrainType.dirt);
            }
            if (px == terrainType.water) {
                this.seed.energy += 50;
                Terrain.setAndUpdatePixel(coords.x, coords.y, terrainType.void);
            }
        }
        this.queueUpdate();
        if (this.age > 500) return;
        //this.graphics.scale.set(this.age / (500 + this.depth * 50), this.age / (500 + this.depth * 50));
        if (this.seed.energy > 0) {
            this.seed.energy--;
            this.age++;
        }
    }
}