import { log } from "console";
import { DebugMode, debugPrint, preferences, terrainTick } from ".";
import { Camera } from "./camera";
import { PixelDrawer } from "./pixelDrawer";
import { indexSplit, noise, random, randomBool, randomInt } from "./utils";
import { Vector } from "./vector";
import { Rock } from "./entities/passive/rock";
import { GrassPatch } from "./entities/passive/grassPatch";


enum Direction {
    none,
    right,
    bottomRight,
    bottom,
    bottomLeft,
    left,
    topLeft,
    top,
    topRight
}

export class Terrain {
    static readonly width = 1024 * 10;
    static readonly height = 1024;
    static pixels: Uint8Array;
    static view: DataView;
    static toUpdate: Set<number>;
    static tempToUpdate: Set<number>;
    static defferedUpdate: Set<number>;
    static director: Record<number, number> = {
        [0]: 0,
        [1]: 1,
        [2]: -this.width + 1,
        [3]: -this.width,
        [4]: -this.width - 1,
        [5]: -1,
        [6]: this.width - 1,
        [7]: this.width,
        [8]: this.width + 1,
    };
    static init() {
        this.toUpdate = new Set();
        this.tempToUpdate = new Set();
        this.defferedUpdate = new Set();
        this.pixels = new Uint8Array(this.width * this.height);
        this.view = new DataView(this.pixels.buffer);
        this.pixels.fill(terrainType.void)
    }

    static posFromIndex(i: number) {
        const x = i % this.width;
        const y = (i - x) / this.width;
        return new Vector(x, y);
    }

    static setPixel(x: number, y: number, type: terrainType) {
        const i = x + y * this.width
        this.view.setUint8(i, type);
    }

    static setAndUpdatePixel(x: number, y: number, type: terrainType) {
        const i = x + y * this.width
        this.view.setUint8(i, type);
        updateSurrounding(i);
    }

    static setPixelByIndex(i: number, type: terrainType) {
        this.view.setUint8(i, type);
    }

    static deferUpdate(index: number) {
        this.defferedUpdate.add(index);
    }

    static draw() {
        const camX = Camera.position.x;
        const camY = Camera.position.y;
        for (let y = 0; y < Camera.height; y++) {
            for (let x = 0; x < Camera.width; x++) {
                const index = x + camX + (y + camY) * this.width;
                const type = this.view.getUint8(index) as terrainType;
                //PixelDrawer.setPixel(x, y, 0x000000ff + 0x01010100 * Math.floor(Math.abs(noise(x, y, 0.01) * 255)))//lookup[type].color);
                PixelDrawer.setPixel(x, y, lookup[type].color);
                if (preferences.debugMode == DebugMode.updates) {
                    let [mx, my] = indexSplit(index, Terrain.width);

                    mx = ((mx - 1) >> 1) << 1;
                    my = ((my - 1) >> 1) << 1;
                    const quindex = mx + my * Terrain.width;
                    if (this.toUpdate.has(quindex)) {
                        PixelDrawer.setPixel(x, y, 0x55ff55ff);
                    }
                    if (this.defferedUpdate.has(index)) {
                        PixelDrawer.setPixel(x, y, 0x00aa00ff);
                    }
                } else if (preferences.debugMode == DebugMode.water) {
                    if (TerrainManager.isWaterable(type)) {
                        switch (TerrainManager.getWater(type)) {
                            case 3:
                                PixelDrawer.setPixel(x, y, 0xFF2000ff);
                                break;
                            case 2:
                                PixelDrawer.setPixel(x, y, 0xFFF900ff);
                                break;
                            case 1:
                                PixelDrawer.setPixel(x, y, 0x2CFF00ff);
                                break;
                            default:
                                break;
                        }
                    }
                }
            }
        }
    }

    static getPixel(x: number, y: number) {
        const i = x + y * this.width
        return this.view.getUint8(i) as terrainType;
    }

    static getPixelByIndex(i: number) {
        return this.view.getUint8(i) as terrainType;
    }

    static chunkorder = [
        0, 1, this.width, this.width + 1,
        0, 1, this.width + 1, this.width,
        0, this.width, 1, this.width + 1,
        0, this.width, this.width + 1, 1,
        0, this.width + 1, 1, this.width,
        0, this.width + 1, this.width, 1,
        1, 0, this.width, this.width + 1,
        1, 0, this.width + 1, this.width,
        1, this.width, 0, this.width + 1,
        1, this.width, this.width + 1, 0,
        1, this.width + 1, 0, this.width,
        1, this.width + 1, this.width, 0,
        this.width, 0, 1, this.width + 1,
        this.width, 0, this.width + 1, 1,
        this.width, 1, 0, this.width + 1,
        this.width, 1, this.width + 1, 0,
        this.width, this.width + 1, 0, 1,
        this.width, this.width + 1, 1, 0,
        this.width + 1, 0, 1, this.width,
        this.width + 1, 0, this.width, 1,
        this.width + 1, 1, 0, this.width,
        this.width + 1, 1, this.width, 0,
        this.width + 1, this.width, 0, 1,
        this.width + 1, this.width, 1, 0,
    ];

    static update(tick: number) {
        debugPrint("updates: " + this.toUpdate.size);
        let order = terrainTick * 4;
        for (const index of this.toUpdate) {
            order %= 24;
            let checkIndex = index + this.chunkorder[order + 0];
            let type = this.view.getUint8(checkIndex) as terrainType;
            let properties = lookup[type];
            if (properties.update) properties.update(checkIndex);

            checkIndex = index + this.chunkorder[order + 1];
            type = this.view.getUint8(checkIndex) as terrainType;
            properties = lookup[type];
            if (properties.update) properties.update(checkIndex);

            checkIndex = index + this.chunkorder[order + 2];
            type = this.view.getUint8(checkIndex) as terrainType;
            properties = lookup[type];
            if (properties.update) properties.update(checkIndex);

            checkIndex = index + this.chunkorder[order + 3];
            type = this.view.getUint8(checkIndex) as terrainType;
            properties = lookup[type];
            if (properties.update) properties.update(checkIndex);

            order += 4;
        }


        let c = -1;
        for (const index of this.defferedUpdate) {
            c++;
            if (c % 100 != 0) continue;
            let type = this.view.getUint8(index) as terrainType;
            let properties = lookup[type];
            if (properties.defferedUpdate) properties.defferedUpdate(index);
            this.defferedUpdate.delete(index);
        }

        this.toUpdate = this.tempToUpdate;
        this.tempToUpdate = new Set();
    }
}

export enum terrainType {
    void = 0,
    water1 = 0b00000001,
    water2 = 0b00000010,
    water3 = 0b00000011,
    grass0 = 0b00000100,
    grass1 = 0b00000101,
    grass2 = 0b00000110,
    grass3 = 0b00000111,
    dirt00 = 0b01000000,
    dirt10 = 0b01000001,
    dirt20 = 0b01000010,
    dirt30 = 0b01000011,
    dirt01 = 0b01000100,
    dirt11 = 0b01000101,
    dirt21 = 0b01000110,
    dirt31 = 0b01000111,
    dirt02 = 0b01001000,
    dirt12 = 0b01001001,
    dirt22 = 0b01001010,
    dirt32 = 0b01001011,
    dirt03 = 0b01001100,
    dirt13 = 0b01001101,
    dirt23 = 0b01001110,
    dirt33 = 0b01001111,
    stone = 0b10000000,
    sand,
    sand2,
}

export type terrainProperties = {
    update?: (index: number) => void
    defferedUpdate?: (index: number) => void
    color: number
    density: number
}

export const lookup: Record<terrainType, terrainProperties> = {
    [terrainType.void]: {
        density: 0,
        color: 0
    },
    [terrainType.stone]: {
        density: 1,
        color: 0x594640ff
    },
    [terrainType.sand]: {
        density: 1,
        color: 0xEAD1B7ff,
        update(index) {
            let checkIndex: number;
            checkIndex = index - Terrain.width;
            let px = Terrain.getPixelByIndex(checkIndex);

            if (!TerrainManager.isWater(px)) {
                let mod = (terrainTick * 4871 + index * 10003193) % 2;
                let dir = 1 - mod * 2;
                checkIndex += dir;
                px = Terrain.getPixelByIndex(checkIndex);
                if (!TerrainManager.isWater(px)) {
                    checkIndex -= dir * 2;
                    px = Terrain.getPixelByIndex(checkIndex);
                    if (!TerrainManager.isWater(px)) {
                        checkIndex = index;
                        px = Terrain.getPixelByIndex(checkIndex);
                    }
                }
            }

            if (checkIndex == index) return;
            Terrain.setPixelByIndex(index, px);
            Terrain.setPixelByIndex(checkIndex, terrainType.sand);
            updateSurrounding(checkIndex);
            updateSurrounding(index);
        },
    },
    [terrainType.sand2]: {
        density: 1,
        color: 0xFAccccff,
        update(index) {
            let checkIndex: number;
            checkIndex = index - Terrain.width;
            let px = Terrain.getPixelByIndex(checkIndex);
            if (TerrainManager.isWater(px)) {
                Terrain.setPixelByIndex(index, px);
                Terrain.setPixelByIndex(checkIndex, terrainType.sand2);
                updateSurrounding(checkIndex);
                updateSurrounding(index);
            }
        },
    },
    [terrainType.water1]: {
        density: .9,
        color: 0x88CAC933,
        update(index) {
            waterBehavoiour(index, 1);
        }
    },
    [terrainType.water2]: {
        density: .9,
        color: 0x88CAC955,
        update(index) {
            waterBehavoiour(index, 2);
        }
    },
    [terrainType.water3]: {
        density: .9,
        color: 0x88CAC977,
        update(index) {
            waterBehavoiour(index, 3);
        }
    },
    [terrainType.grass0]: {
        density: 1,
        color: 0x7f8561ff,
        update(index) {
            Terrain.deferUpdate(index);
        },
        defferedUpdate(index) {
            grassBehaviour(index, 0)
        },
    },
    [terrainType.grass1]: {
        density: 1,
        color: 0x7f8561ff,
        update(index) {
            Terrain.deferUpdate(index);

        },
        defferedUpdate(index) {
            grassBehaviour(index, 1)
        },
    },
    [terrainType.grass2]: {
        density: 1,
        color: 0x7f8561ff,
        update(index) {
            Terrain.deferUpdate(index);
        },
        defferedUpdate(index) {
            grassBehaviour(index, 2)
        },
    },
    [terrainType.grass3]: {
        density: 1,
        color: 0x7f8561ff,
        update(index) {
            Terrain.deferUpdate(index);
        },
        defferedUpdate(index) {
            grassBehaviour(index, 3)
        },
    },
    [terrainType.dirt00]: {
        density: 1,
        color: 0x6E5344ff,
        update(index) {
            Terrain.deferUpdate(index);
        },
        defferedUpdate(index) {
            dirtBehaviour(index, 0, 0)
        },
    },
    [terrainType.dirt10]: {
        density: 1,
        color: 0x6D5243ff,
        update(index) {
            Terrain.deferUpdate(index);
        },
        defferedUpdate(index) {
            dirtBehaviour(index, 1, 0)
        },
    },
    [terrainType.dirt20]: {
        density: 1,
        color: 0x6C5142ff,
        update(index) {
            Terrain.deferUpdate(index);
        },
        defferedUpdate(index) {
            dirtBehaviour(index, 2, 0)
        },
    },
    [terrainType.dirt30]: {
        density: 1,
        color: 0x6B5041ff,
        update(index) {
            Terrain.deferUpdate(index);
        },
        defferedUpdate(index) {
            dirtBehaviour(index, 3, 0)
        },
    },
    [terrainType.dirt01]: {
        density: 1,
        color: 0x7E5344ff,
        update(index) {
            Terrain.deferUpdate(index);
        },
        defferedUpdate(index) {
            dirtBehaviour(index, 0, 1)
        },
    },
    [terrainType.dirt11]: {
        density: 1,
        color: 0x7D5243ff,
        update(index) {
            Terrain.deferUpdate(index);
        },
        defferedUpdate(index) {
            dirtBehaviour(index, 1, 1)
        },
    },
    [terrainType.dirt21]: {
        density: 1,
        color: 0x7C5142ff,
        update(index) {
            Terrain.deferUpdate(index);
        },
        defferedUpdate(index) {
            dirtBehaviour(index, 2, 1)
        },
    },
    [terrainType.dirt31]: {
        density: 1,
        color: 0x7B5041ff,
        update(index) {
            Terrain.deferUpdate(index);
        },
        defferedUpdate(index) {
            dirtBehaviour(index, 3, 1)
        },
    },
    [terrainType.dirt02]: {
        density: 1,
        color: 0x8E5344ff,
        update(index) {
            Terrain.deferUpdate(index);
        },
        defferedUpdate(index) {
            dirtBehaviour(index, 0, 2)
        },
    },
    [terrainType.dirt12]: {
        density: 1,
        color: 0x8D5243ff,
        update(index) {
            Terrain.deferUpdate(index);
        },
        defferedUpdate(index) {
            dirtBehaviour(index, 1, 2)
        },
    },
    [terrainType.dirt22]: {
        density: 1,
        color: 0x8C5142ff,
        update(index) {
            Terrain.deferUpdate(index);
        },
        defferedUpdate(index) {
            dirtBehaviour(index, 2, 2)
        },
    },
    [terrainType.dirt32]: {
        density: 1,
        color: 0x8B5041ff,
        update(index) {
            Terrain.deferUpdate(index);
        },
        defferedUpdate(index) {
            dirtBehaviour(index, 3, 2)
        },
    },
    [terrainType.dirt03]: {
        density: 1,
        color: 0x9E5344ff,
        update(index) {
            Terrain.deferUpdate(index);
        },
        defferedUpdate(index) {
            dirtBehaviour(index, 0, 3)
        },
    },
    [terrainType.dirt13]: {
        density: 1,
        color: 0x9D5243ff,
        update(index) {
            Terrain.deferUpdate(index);
        },
        defferedUpdate(index) {
            dirtBehaviour(index, 1, 3)
        },
    },
    [terrainType.dirt23]: {
        density: 1,
        color: 0x9C5142ff,
        update(index) {
            Terrain.deferUpdate(index);
        },
        defferedUpdate(index) {
            dirtBehaviour(index, 2, 3)
        },
    },
    [terrainType.dirt33]: {
        density: 1,
        color: 0x9B5041ff,
        update(index) {
            Terrain.deferUpdate(index);
        },
        defferedUpdate(index) {
            dirtBehaviour(index, 3, 3)
        },
    },
};

function dirtBehaviour(index: number, water: number, minerals: number) {
    let checkIndex = Terrain.director[Direction.bottom] + index;
    let px = Terrain.getPixelByIndex(checkIndex);
    let dir = randomInt(0, 2) * 2 - 1;

    const drip = () => {
        if (px == terrainType.void) {
            if (water == 3) {
                Terrain.setPixelByIndex(checkIndex, terrainType.water1);
                Terrain.setPixelByIndex(index, TerrainManager.dirtByStats(water - 1, minerals));
                updateSurrounding(checkIndex);
                updateSurrounding(index);
                return true;
            }
        }
    }

    const soak = (adjust: number = 0) => {
        if (TerrainManager.isWaterable(px)) {
            const otherWater = TerrainManager.getWater(px);
            if (water > 1 && otherWater < 3 && water + adjust >= otherWater) {
                Terrain.setPixelByIndex(index, TerrainManager.dirtByStats(--water, minerals));
                Terrain.setPixelByIndex(checkIndex, TerrainManager.setWater(px, otherWater + 1));
                updateSurrounding(checkIndex);
                updateSurrounding(index);
                return true;
            }
        }
    }

    if (drip()) return;
    soak(1);
    checkIndex += dir
    px = Terrain.getPixelByIndex(checkIndex);
    if (drip()) return;
    soak();
    checkIndex -= dir * 2
    px = Terrain.getPixelByIndex(checkIndex);
    if (drip()) return;
    soak();
    checkIndex = index + dir
    px = Terrain.getPixelByIndex(checkIndex);
    soak(-1);
    checkIndex = index + dir * -1
    px = Terrain.getPixelByIndex(checkIndex);
    soak(-1);
}

function waterBehavoiour(index: number, waterLevel: number) {
    Terrain.setPixelByIndex(index, terrainType.void);
    let checkIndex: number;
    checkIndex = index - Terrain.width;
    let px = Terrain.getPixelByIndex(checkIndex);

    let dir = randomBool() ? 1 : -1;
    let checkA = true;
    let checkB = true;
    let candidate1 = -1;
    let candidate1Level = 3;
    let candidate2 = -1;
    let candidate2Level = 3;
    let candidate3 = -1;
    let candidate3Level = 3;
    px = Terrain.getPixelByIndex(checkIndex);

    if (px == terrainType.void) {
        Terrain.setPixelByIndex(checkIndex, TerrainManager.setWater(terrainType.void, waterLevel));
        updateSurrounding(index);
        updateSurrounding(checkIndex);
        return;
    } else {
        for (let i = 1; i < 50; i++) {
            if (checkA) {
                checkIndex = index + dir * i;
                px = Terrain.getPixelByIndex(checkIndex);
                if (!TerrainManager.isWater(px)) {
                    checkA = false;
                } else {
                    let tempWater = TerrainManager.getWater(px);
                    if (tempWater < candidate1Level) {
                        candidate1 = checkIndex;
                        candidate1Level = tempWater;
                    } else if (tempWater < candidate2Level) {
                        candidate2 = checkIndex;
                        candidate2Level = tempWater;
                    } else if (tempWater < candidate3Level) {
                        candidate3 = checkIndex;
                        candidate3Level = tempWater;
                    }

                    checkIndex = index + dir * i - Terrain.width;
                    px = Terrain.getPixelByIndex(checkIndex);
                    if (TerrainManager.isWaterable(px)) {
                        const otherWater = TerrainManager.getWater(px);
                        if (otherWater != 3) {
                            if (waterLevel + otherWater <= 3) {
                                Terrain.setPixelByIndex(checkIndex, TerrainManager.setWater(px, waterLevel + otherWater));
                                updateSurrounding(index);
                                updateSurrounding(checkIndex);
                                return;
                            } else {
                                Terrain.setPixelByIndex(checkIndex, TerrainManager.setWater(px, 3));
                                updateSurrounding(checkIndex);
                                waterLevel = waterLevel - (3 - otherWater);
                            }
                        }
                        if (TerrainManager.isWater(px) && Terrain.getPixelByIndex(checkIndex - Terrain.width) == terrainType.void) {
                            checkA = false;
                        }
                    }
                }
            }

            if (checkB) {
                checkIndex = index - dir * i;
                px = Terrain.getPixelByIndex(checkIndex);
                if (px != terrainType.void) {
                    checkB = false;
                } else {
                    let tempWater = TerrainManager.getWater(px);
                    if (tempWater < candidate1Level) {
                        candidate1 = checkIndex;
                        candidate1Level = tempWater;
                    } else if (tempWater < candidate2Level) {
                        candidate2 = checkIndex;
                        candidate2Level = tempWater;
                    } else if (tempWater < candidate3Level) {
                        candidate3 = checkIndex;
                        candidate3Level = tempWater;
                    }

                    checkIndex = index + dir * i - Terrain.width;
                    px = Terrain.getPixelByIndex(checkIndex);
                    if (TerrainManager.isWaterable(px)) {
                        const otherWater = TerrainManager.getWater(px);
                        if (otherWater != 3) {
                            if (waterLevel + otherWater <= 3) {
                                Terrain.setPixelByIndex(checkIndex, TerrainManager.setWater(px, waterLevel + otherWater));
                                updateSurrounding(index);
                                updateSurrounding(checkIndex);
                                return;
                            } else {
                                Terrain.setPixelByIndex(checkIndex, TerrainManager.setWater(px, 3));
                                updateSurrounding(checkIndex);
                                waterLevel = waterLevel - (3 - otherWater);
                            }
                        }
                        if (TerrainManager.isWater(px) && Terrain.getPixelByIndex(checkIndex - Terrain.width) == terrainType.void) {
                            checkB = false;
                        }
                    }
                }
            }

            if (!(checkA || checkB)) {
                break;
            }
        }

        if (candidate1 == -1 || waterLevel == 0) {
            Terrain.setPixelByIndex(index, TerrainManager.setWater(terrainType.void, waterLevel));
            return;
        }

        if (waterLevel != 0 && waterLevel > candidate1Level + 1) {
            if (candidate1 != -1) {
                Terrain.setPixelByIndex(candidate1, TerrainManager.setWater(terrainType.void, candidate1Level + 1));
                updateSurrounding(candidate1);
                waterLevel--;
            }
        }

        if (waterLevel != 0 && waterLevel > candidate2Level + 1) {
            if (candidate2 != -1) {
                Terrain.setPixelByIndex(candidate2, TerrainManager.setWater(terrainType.void, candidate2Level + 1));
                updateSurrounding(candidate2);
                waterLevel--;
            }
        }

        if (waterLevel != 0 && waterLevel > candidate3Level + 1) {
            if (candidate3 != -1) {
                Terrain.setPixelByIndex(candidate3, TerrainManager.setWater(terrainType.void, candidate3Level + 1));
                updateSurrounding(candidate3);
                waterLevel--;
            }
        }
        Terrain.setPixelByIndex(index, TerrainManager.setWater(terrainType.void, waterLevel));
        updateSurrounding(index);

    }

}

export class TerrainManager {
    static dirtByStats(water: number, minerals: number) {
        return 0b01000000 + minerals * 4 + water as terrainType
    }

    static isWaterable(terrain: terrainType) {
        return (terrain & 0b10000000) == 0
    }

    static isDirt(terrain: terrainType) {
        return (terrain & 0b11110000) == 64
    }

    static isWater(terrain: terrainType) {
        return (terrain & 0b11111100) == 0
    }

    static getWater(terrain: terrainType) {
        return terrain & 0b00000011
    }

    static setWater(terrain: terrainType, water: number) {
        return (terrain & 0b11111100) + water
    }

    static getDirtMinerals(terrain: terrainType) {
        return (terrain & 0b0001100) / 4
    }
}

function grassBehaviour(index: number, waterLevel: number) {
    if (waterLevel == 3) {

    }

    const bias = randomInt(0, 9);
    let enclosed = true;
    for (let i = 0; i < 9; i++) {
        let dir = Terrain.director[(i + bias) % 9];
        if (dir == 0) continue;
        let checkIndex = index + dir;
        let px = Terrain.getPixelByIndex(checkIndex);
        if (px == terrainType.void) enclosed = false;

        if (TerrainManager.isDirt(px)) {
            let targetWater = TerrainManager.getWater(px);
            let targetMinerals = TerrainManager.getDirtMinerals(px);

            if (targetWater >= 1 && targetMinerals >= 1) {
                let newEnclosed = true;
                for (let j = 0; j < 9; j++) {
                    let newDir = Terrain.director[(j + bias) % 9];
                    if (newDir == 0) continue;
                    let newCheckIndex = index + newDir;
                    if (Terrain.getPixelByIndex(newCheckIndex) == terrainType.void) newEnclosed = false;
                }
                if (!newEnclosed) {
                    grassExp++;
                    if (grassExp > 5) {
                        grassExp = 0;
                        new GrassPatch(Terrain.posFromIndex(checkIndex));
                    }
                    Terrain.setPixelByIndex(checkIndex, TerrainManager.setWater(terrainType.grass0, targetWater - 1));
                    updateSurrounding(checkIndex);
                }
            }
        }
    }

    if (enclosed) {
        Terrain.setPixelByIndex(index, TerrainManager.setWater(terrainType.dirt00, waterLevel));
        updateSurrounding(index);
    }
}

let grassExp = 0;

function updateSurrounding(index: number) {
    let [x, y] = indexSplit(index, Terrain.width);
    x = ((x - 1) >> 1) << 1;
    y = ((y - 1) >> 1) << 1;
    const quindex = x + y * Terrain.width;
    Terrain.tempToUpdate.add(quindex);
    Terrain.tempToUpdate.add(quindex + 2);
    Terrain.tempToUpdate.add(quindex + Terrain.width * 2);
    Terrain.tempToUpdate.add(quindex + 2 + Terrain.width * 2);
}