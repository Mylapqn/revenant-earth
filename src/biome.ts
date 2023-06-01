import { colorGradeOptions } from "./shaders/colorGrade/colorGrade";
import { Music } from "./sound";
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
                let lastX = x + item.width;
                if (lastX * this.transitionRate > 1) {
                    return { ...item.biome }
                } else {
                    const newData = {} as any;
                    for (let key in item.biome) {
                        let k = key as keyof BiomeData; 
                        const prevVal = previous.biome[k]
                        const thisVal = item.biome[k]
                        if (isNumber(prevVal) && isNumber(thisVal))
                            newData[k] = lerp(prevVal, thisVal, lastX * this.transitionRate);
                            else
                            newData[k] = prevVal

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


    generate(settings: { skipPlacement: boolean, padding: number, scale?: number } = { skipPlacement: false, padding: 0, scale: 1 }, surfaceSpawner?: (x: number, y: number, biomeData: BiomeData) => void) {
        let currentState = { ...this.queue[0].biome };

        let ty = 470;
        let trend = 0;
        if (!settings.scale) settings.scale = 1;
        let scaledX = -settings.padding;
        let lastY;
        for (let x = -settings.padding; x < Terrain.width + settings.padding; x++) {
            currentState = this.getInterpolatedBiome(x);

            trend += random(-currentState.curveModifier, currentState.curveModifier);
            trend = trend / 1.2;
            if (ty > currentState.top) trend -= currentState.curveLimiter;
            if (ty < currentState.bottom) trend += currentState.curveLimiter;
            lastY = ty;
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
            if (surfaceSpawner) {
                if (settings.scale >= 1) {
                    surfaceSpawner(x, ty, currentState);
                }
                else {
                    while (scaledX < x) {
                        scaledX += settings.scale;
                        surfaceSpawner(scaledX, lerp(ty, lastY, scaledX % 1), currentState);
                    }
                }
            }
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
    name: string;
    shortName: string;
    music: Music;
    colorGrade:colorGradeOptions;
}

function isNumber(value: any): value is number {
    return typeof value == "number"
}