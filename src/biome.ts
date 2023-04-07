import { DirtManager, Terrain, terrainType } from "./terrain";
import { lerp, noise, random } from "./utils";


export class TerrainGenerator {
    queue = new Array<{ width: number, biome: BiomeData }>();
    addToQueue(biome: BiomeData, width: number) {
        this.queue.push({ width, biome });
    }

    generate(transitionRate = 0.01, surfaceSpawner?: (x: number, y: number) => void) {
        let widthCountdown = this.queue[0].width;
        let currentState = this.queue[0].biome;

        let ty = 470;
        let trend = 0;
        for (let x = 0; x < Terrain.width; x++) {
            const targetState = this.queue[0].biome;
            widthCountdown--;

            if (widthCountdown == 0) {
                this.queue.shift();
                widthCountdown = this.queue[0].width;
            }

            for (let key in currentState) {
                let k = key as keyof BiomeData;
                currentState[k] = lerp(currentState[k], targetState[k], transitionRate);
            }

            trend += random(-currentState.curveModifier, currentState.curveModifier);
            trend = trend / 1.2;
            if ( ty > currentState.top) trend -= currentState.curveLimiter;
            if (ty < currentState.bottom) trend += currentState.curveLimiter;
            ty += trend;
            for (let y = 0; y < ty; y++) {
                if (y + currentState.dirtDepth > ty) {
                    const dirtDepthRatio = (y - (ty - currentState.dirtDepth)) / currentState.dirtDepth;

                    if (Math.abs(noise(x, y, 0.2)) < Math.min((ty - y) / currentState.dirtDepth, 0.5)) {
                        Terrain.setPixel(x, y, terrainType.stone);
                    } else {
                        Terrain.setAndUpdatePixel(x, y, DirtManager.dirtByStats(Math.floor(currentState.moisture), Math.floor((noise(x, y, 0.05) + 1) / 2 * (currentState.minerals - currentState.mineralDepthPenalty * dirtDepthRatio))));
                    }

                } else {
                    Terrain.setPixel(x, y, terrainType.stone);
                }
            }
            surfaceSpawner(x, ty);
        }
    }
}


const transitor: BiomeData = { stoneTop: 0, stoneBottom: 0.5, bottom: 360, top: 580, moisture: 3, minerals: 3, dirtDepth: 50, mineralDepthPenalty: 1, curveModifier: 1, curveLimiter: 2 }

export type BiomeData = {
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