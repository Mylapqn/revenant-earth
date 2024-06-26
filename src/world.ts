import { DebugDraw } from "./debugDraw";
import { Terrain } from "./terrain";
import { clamp, lerp } from "./utils";
import { Vector } from "./vector";




export class World {
    static data: Record<number, WorldData> = {}
    static readonly gap = 100;
    static init() {
        for (let x = 0; x <= Terrain.width; x += this.gap) {
            this.data[x] = {
                pollution: 80,
                co2: 900
            };
        }
    }

    static update(dt: number) {
        for (let x = 0; x <= Terrain.width; x += this.gap) {
            DebugDraw.drawLine(new Vector(x, 0), new Vector(x, Terrain.height), "#aaaaff");
        }

        for (let x = this.gap; x <= Terrain.width; x += this.gap) {
            const last = this.data[x - this.gap];
            const current = this.data[x];

            const co2Diff = (last.co2 - current.co2);
            last.co2 -= co2Diff * 0.01;
            current.co2 += co2Diff * 0.01;
        }
    }


    static getDataFrom(x: number) {
        x = clamp(x, 0, Terrain.width-this.gap);
        const prevX = Math.floor(x / this.gap) * this.gap;
        const nextX = Math.ceil(x / this.gap) * this.gap;

        const prevData = this.data[prevX];
        const nextData = this.data[nextX];

        const bias = (x % this.gap) / this.gap;

        const out: WorldData = { pollution: 0, co2: 0, };
        try {
            for (const key in prevData) {
                const k = key as keyof WorldData;
                out[k] = lerp(prevData[k], nextData[k], bias);
            }
        } catch (error) {
            console.error(error, x, prevData, nextData);
        }

        return out;
    }

    static takeAt(x: number, data: Partial<WorldData>) {
        x = clamp(x, 0, Terrain.width-this.gap);
        const prevX = Math.floor(x / this.gap) * this.gap;
        const nextX = Math.ceil(x / this.gap) * this.gap;

        const prevData = this.data[prevX];
        const nextData = this.data[nextX];

        const nextRatio = (x % this.gap) / this.gap;
        const prevRatio = 1 - nextRatio;
        try {
            for (const key in data) {
                const k = key as keyof WorldData;
                const d = clamp(data[k], 0, 1000); //Prevents NaN when dividing by zero, but I don't like this fix
                const ratio = (prevData[k] / nextData[k]); //Prevents NaN when dividing by zero, but I don't like this fix
                prevData[k] -= d * prevRatio * clamp(ratio, 0, 1);
                nextData[k] -= d * nextRatio * clamp(1 / ratio, 0, 1);
            }
        } catch (error) {
            console.error(error, x, data, prevData, nextData);
        }
    }

    static addAt(x: number, data: Partial<WorldData>) {
        const prevX = Math.floor(x / this.gap) * this.gap;
        const nextX = Math.ceil(x / this.gap) * this.gap;

        const prevData = this.data[prevX];
        const nextData = this.data[nextX];

        const nextRatio = (x % this.gap) / this.gap;
        const prevRatio = 1 - nextRatio;

        for (const key in data) {
            const k = key as keyof WorldData;
            const ratio = prevData[k] / nextData[k];
            prevData[k] += data[k] * prevRatio * clamp(1 / ratio, 0, 1);
            nextData[k] += data[k] * nextRatio * clamp(ratio, 0, 1);
        }
    }
}



type WorldData = {
    pollution: number;
    co2: number;
}