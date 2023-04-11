import { TerrainManager, Terrain, terrainType } from "./terrain";
import { lerp, noise, random } from "./utils";


export class TerrainGenerator {
    queue = new Array<{ width: number, biome: BiomeData }>();
    addToQueue(biome: BiomeData, width: number) {
        this.queue.push({ width, biome });
    }

    getBiome(x: number): BiomeData | undefined {
        for (const item of this.queue) {
            x -= item.width;
            if (x < 0) return item.biome;
        }
    }

    generate(transitionRate = 0.01, settings = {skipPlacement: false, padding: 0}, surfaceSpawner?: (x: number, y: number) => void) {
        let widthCountdown = this.queue[0].width + settings.padding;
        let currentState = { ...this.queue[0].biome };

        let ty = 470;
        let trend = 0;
        let i = 0;
        for (let x = -settings.padding; x < Terrain.width + settings.padding; x++) {
            const targetState = this.queue[i].biome;
            widthCountdown--;

            if (widthCountdown == 0) {
                i++;
                widthCountdown = this.queue[i].width;
            }

            for (let key in currentState) {
                let k = key as keyof BiomeData;
                currentState[k] = lerp(currentState[k], targetState[k], transitionRate);
            }

            trend += random(-currentState.curveModifier, currentState.curveModifier);
            trend = trend / 1.2;
            if (ty > currentState.top) trend -= currentState.curveLimiter;
            if (ty < currentState.bottom) trend += currentState.curveLimiter;
            ty += trend;
            if (!settings.skipPlacement) {
                for (let y = 0; y < ty; y++) {
                    if (y + currentState.dirtDepth > ty) {
                        const dirtDepthRatio = (y - (ty - currentState.dirtDepth)) / currentState.dirtDepth;
                        const stoneBonus = lerp(currentState.stoneBottom, currentState.stoneTop, dirtDepthRatio)
                        if (Math.abs(noise(x, y, 0.2)) < (ty - y) / currentState.dirtDepth * stoneBonus) {
                            Terrain.setPixel(x, y, terrainType.stone);
                        } else {
                            Terrain.setAndUpdatePixel(x, y, TerrainManager.dirtByStats(Math.floor(currentState.moisture), Math.floor((noise(x, y, 0.05) + 1) / 2 * (currentState.minerals - currentState.mineralDepthPenalty * dirtDepthRatio))));
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