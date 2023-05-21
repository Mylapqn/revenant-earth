import * as PIXI from "pixi.js"
import { app } from "./game";
import { Vector } from "./vector";
import { Terrain, TerrainManager, lookup, terrainProperties, terrainType } from "./terrain";
import { Color } from "./color";
import { log } from "console";
import { TerrainGenerator } from "./biome";


export class Stamps {
    static textures: Record<string, PIXI.Texture> = {}
    static async loadStamps() {
        await Promise.all([
            this.loadTexture("stamp", "stamp/stamp.png"),
            this.loadTexture("stamp2", "stamp/stamp2.png"),
            this.loadTexture("stamp3", "stamp/stamp3.png"),
            this.loadTexture("stamp4", "stamp/stamp4.png"),
            this.loadTexture("stamp5", "stamp/stamp5.png"),
            this.loadTexture("bigbuilding", "stamp/bigbuilding.png")
        ]);
    }

    static async loadTexture(name: string, url: string) {
        this.textures[name] = await PIXI.Assets.load(url);
    }

    static stamp(stampName: string, position: Vector, options?: { surface?: boolean, lowest?: boolean, replace?: terrainType[], useDirtFrom?: TerrainGenerator, replaceMatching?: (replace: terrainType, using: terrainType) => boolean }): Vector {
        Object.assign(options, { surface: true, lowest: true, replace: [terrainType.void, terrainType.water1, terrainType.water2, terrainType.water3] });
        const texture = this.textures[stampName];
        const tempSprite = new PIXI.Sprite(texture);
        const data = app.renderer.extract.pixels(tempSprite);
        tempSprite.destroy();

        const terrainColors = Array.from(Object.entries(lookup));
        let surfaceLevel = options.lowest ? Terrain.height - 1 : 0;

        const heightAt: Record<number, number> = {};

        if (options.surface) {
            for (let i = 0; i < texture.width; i++) {
                const x = Math.floor(position.x - texture.width / 2 + i);
                if (options.lowest) {
                    for (let y = surfaceLevel; y > 0; y--) {
                        if (Terrain.getPixel(x, y) != terrainType.void) {
                            surfaceLevel = y;
                            break;
                        }
                    }
                } else {
                    for (let y = surfaceLevel; y < Terrain.height; y++) {
                        if (Terrain.getPixel(x, y) == terrainType.void) {
                            surfaceLevel = y;
                            break;
                        }
                    }
                }
            }
        }

        const baseX = Math.floor(position.x - texture.width / 2);
        const baseY = Math.floor((options.surface ? surfaceLevel : 0) + position.y);


        for (let i = 0; i < data.length; i += 4) {
            const index = i / 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            const x = Math.floor(baseX + index % texture.width);
            const y = Math.floor(baseY + Math.ceil(texture.height - index / texture.width));
            const target = Terrain.getPixel(x, y);
            if (a == 0) continue;
            const color = new Color(r, g, b).toPixi();
            const terrain = terrainColors.find(t => Math.floor(t[1].color / 256) == color) as unknown as [number, terrainProperties] | undefined;
            if (terrain == undefined) continue;
            if (!options.replace.includes(target) && !(options.replaceMatching && options.replaceMatching(target, terrain[0]))) continue;
            if (TerrainManager.isDirt(terrain[0]) && options.useDirtFrom) {
                const dirt = options.useDirtFrom.getLocalDirt(new Vector(x, y));
                Terrain.setAndUpdatePixel(x, y, dirt);

            } else {
                Terrain.setAndUpdatePixel(x, y, terrain[0]);
            }
        }

        return new Vector(baseX, baseY)
    }

}