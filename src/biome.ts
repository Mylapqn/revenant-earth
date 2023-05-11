import { TerrainManager, Terrain, terrainType } from "./terrain";
import { clamp, lerp, noise, random } from "./utils";
import { Vector } from "./vector";


export class TerrainGenerator {
    queue = new Array<{ width: number, biome: BiomeData }>();
    transitionRate = 0.01;
    heights: Record<number, number> = {};

    addToQueue(biome: BiomeData, width: number) {
        this.queue.push({ width, biome });
    }

    getBiome(x: number): BiomeData | undefined {
        for (const item of this.queue) {
            x -= item.width;
            if (x < 0) return { ...item.biome };
        }
    }

    getInterpolatedBiome(x: number): BiomeData | undefined {
        let previous = this.queue[0];
        for (const item of this.queue) {
            x -= item.width;
            if (x < 0) {
                let lastX =  x + item.width;
                if (lastX * this.transitionRate > 1) {
                    return { ...item.biome }
                } else {
                    const newData = {} as BiomeData;
                    for (let key in item.biome) {
                        let k = key as keyof BiomeData;
                        newData[k] = lerp(previous.biome[k], item.biome[k], lastX * this.transitionRate);
                    }
                    return newData;
                }
            }
            previous = item;
        }
    }

    getLocalDirt(position: Vector): terrainType {
        const currentState = this.getInterpolatedBiome(position.x);
        const dirtDepthRatio = (position.y - (this.heights[position.x] - currentState.dirtDepth)) / currentState.dirtDepth;

        return TerrainManager.dirtByStats(Math.floor(currentState.moisture), clamp(Math.floor((noise(position.x, position.y, 0.05) + 1) / 2 * (currentState.minerals - currentState.mineralDepthPenalty * dirtDepthRatio)), 0, 3))
    }


    generate(settings = { skipPlacement: false, padding: 0 }, surfaceSpawner?: (x: number, y: number) => void) {
        let currentState = { ...this.queue[0].biome };

        let ty = 470;
        let trend = 0;
        for (let x = -settings.padding; x < Terrain.width + settings.padding; x++) {

            currentState = this.getInterpolatedBiome(x);

            trend += random(-currentState.curveModifier, currentState.curveModifier);
            trend = trend / 1.2;
            if (ty > currentState.top) trend -= currentState.curveLimiter;
            if (ty < currentState.bottom) trend += currentState.curveLimiter;
            ty += trend;
            if (!settings.skipPlacement) {
                this.heights[x] = ty;
                for (let y = 0; y < ty; y++) {
                    if (y + currentState.dirtDepth > ty) {
                        const dirtDepthRatio = (y - (ty - currentState.dirtDepth)) / currentState.dirtDepth;
                        const stoneBonus = lerp(currentState.stoneBottom, currentState.stoneTop, dirtDepthRatio);
                        if (Math.abs(noise(x, y, 0.2)) < (ty - y) / currentState.dirtDepth * stoneBonus) {
                            Terrain.setPixel(x, y, terrainType.stone);
                        } else {
                            Terrain.setAndUpdatePixel(x, y, this.getLocalDirt(new Vector(x, y)));
                        }

                    } else {
                        Terrain.setPixel(x, y, terrainType.stone);
                    }

                }
            }
            surfaceSpawner && surfaceSpawner(x, ty);
        }
    }
}



export type BiomeData = {
    biomeId: number;
    stoneTop: number;
    stoneBottom: number;
    moisture: number;
    dirtDepth: number;
    minerals: number;
    mineralDepthPenalty: number;
    curveModifier: number;
    curveLimiter: number;
    bottom: number;
    top: number;
}