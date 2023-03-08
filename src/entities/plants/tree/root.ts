import { Point, Sprite } from "pixi.js";
import { Entity } from "../../../entity";
import { Terrain, terrainType } from "../../../terrain";
import { Vector } from "../../../vector";
import { Seed } from "./seed";

export class Root extends Entity {
    seed: Seed;
    age = 0;
    depth = 0;
    constructor(position: Vector, parent: Entity, seed: Seed, angle = 0, depth = 1) {
        const graph = Sprite.from("root.png");
        graph.scale.set(0);
        super(graph, position, parent, angle);
        graph.anchor.set(0.5);
        this.depth = depth;
        this.seed = seed;
        if (parent)
            graph.anchor.set(0.5, 1);
    }

    update() {
        this.updatePosition();
        if (this.depth < 3 && this.age == 499) {
            for (let i = 0; i < 3; i++) {
                new Root(new Vector(0, Math.random() * 10 + 10), this, this.seed, Math.random() * 1 - i, this.depth + 1)
                this.age++;
            }
        }
        if (this.seed.energy < 1000) {
            const coords = (() => {
                let c = this.worldCoords(new Vector(Math.random() * 20 - 10, Math.random() * -25));
                return new Vector(Math.floor(c.x), Math.floor(c.y));
            })();

            console.log(coords.x, coords.y);
            let px = Terrain.getPixel(coords.x, coords.y);

            if (px == terrainType.dirt) {
                this.seed.energy += 5;
                Terrain.setAndUpdatePixel(coords.x, coords.y, terrainType.dryDirt);
            }

            if (px == terrainType.wetDirt) {
                this.seed.energy += 5;
                Terrain.setAndUpdatePixel(coords.x, coords.y, terrainType.dirt);
            }
        }
        this.queueUpdate();
        if (this.age > 500) return;
        this.graphics.scale.set(this.age / (500 + this.depth * 50), this.age / (500 + this.depth * 50));
        if (this.seed.energy > 0) {
            this.seed.energy--;
            this.age++;
        }
    }
}