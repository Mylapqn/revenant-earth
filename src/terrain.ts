import { DebugMode, debugPrint, preferences, terrainTick } from ".";
import { Camera } from "./camera";
import { PixelDrawer } from "./pixelDrawer";
import { indexSplit, random, randomInt } from "./utils";
import { Vector } from "./vector";


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
        this.pixels = new Uint8Array(this.width * this.height);
        this.view = new DataView(this.pixels.buffer);
        this.pixels.fill(0)
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

    static draw() {
        for (let y = 0; y < Camera.height; y++) {
            for (let x = 0; x < Camera.width; x++) {
                const index = x + Camera.position.x + (y + Camera.position.y) * this.width;
                const type = this.view.getUint8(index) as terrainType;
                PixelDrawer.setPixel(x, y, lookup[type].color);
                if (preferences.debugMode == DebugMode.updates && this.toUpdate.has(index)) {
                    PixelDrawer.setPixel(x, y, 0x00ff0099);
                } else if (preferences.debugMode == DebugMode.water) {
                    if (DirtManager.isDirt(type)) {
                        PixelDrawer.setPixel(x, y, 0x666666ff + 0x00051100 * DirtManager.getDirtWater(type));
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

    static update(tick: number) {
        debugPrint("updates: " + this.toUpdate.size);
        for (const index of this.toUpdate) {
            let type = this.view.getUint8(index) as terrainType;
            let properties = lookup[type];
            if (properties.update) properties.update(index);
            type = this.view.getUint8(index + 1) as terrainType;
            properties = lookup[type];
            if (properties.update) properties.update(index + 1);
            type = this.view.getUint8(index + this.width + 1) as terrainType;
            properties = lookup[type];
            if (properties.update) properties.update(index + this.width + 1);
            type = this.view.getUint8(index + this.width) as terrainType;
            properties = lookup[type];
            if (properties.update) properties.update(index + this.width);
        }
        this.toUpdate = this.tempToUpdate;
        this.tempToUpdate = new Set();
    }
}

export enum terrainType {
    void,
    sand,
    sand2,
    water,
    grass,
    stone,
    dirt00 = 0b10000000,
    dirt10 = 0b10000001,
    dirt20 = 0b10000010,
    dirt30 = 0b10000011,
    dirt40 = 0b10000100,
    dirt50 = 0b10000101,
    dirt60 = 0b10000110,
    dirt70 = 0b10000111,
    dirt01 = 0b10001000,
    dirt11 = 0b10001001,
    dirt21 = 0b10001010,
    dirt31 = 0b10001011,
    dirt41 = 0b10001100,
    dirt51 = 0b10001101,
    dirt61 = 0b10001110,
    dirt71 = 0b10001111,
    dirt02 = 0b10010000,
    dirt12 = 0b10010001,
    dirt22 = 0b10010010,
    dirt32 = 0b10010011,
    dirt42 = 0b10010100,
    dirt52 = 0b10010101,
    dirt62 = 0b10010110,
    dirt72 = 0b10010111,
    dirt03 = 0b10011000,
    dirt13 = 0b10011001,
    dirt23 = 0b10011010,
    dirt33 = 0b10011011,
    dirt43 = 0b10011100,
    dirt53 = 0b10011101,
    dirt63 = 0b10011110,
    dirt73 = 0b10011111,
}

type terrainProperties = {
    update?: (index: number) => void
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

            if (px != terrainType.void && px != terrainType.water) {
                let mod = (terrainTick * 4871 + index * 10003193) % 2;
                let dir = 1 - mod * 2;
                checkIndex += dir;
                px = Terrain.getPixelByIndex(checkIndex);
                if (px != terrainType.void && px != terrainType.water) {
                    checkIndex -= dir * 2;
                    px = Terrain.getPixelByIndex(checkIndex);
                    if (px != terrainType.void && px != terrainType.water) {
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
            if (px == terrainType.void || px == terrainType.water) {
                Terrain.setPixelByIndex(index, px);
                Terrain.setPixelByIndex(checkIndex, terrainType.sand2);
                updateSurrounding(checkIndex);
                updateSurrounding(index);
            }
        },
    },
    [terrainType.water]: {
        density: .9,
        color: 0x88CAC977,
        update(index) {
            Terrain.setPixelByIndex(index, terrainType.void);
            let checkIndex: number;
            checkIndex = index - Terrain.width;
            let px = Terrain.getPixelByIndex(checkIndex);
            if (DirtManager.isDirt(px)) {
                const dirtWater = DirtManager.getDirtWater(px);
                if (dirtWater < 4) {
                    Terrain.setPixelByIndex(checkIndex, DirtManager.dirtByStats(dirtWater + 4, DirtManager.getDirtMinerals(px)));
                    updateSurrounding(checkIndex);
                    updateSurrounding(index);
                    return;
                }
                Terrain.setPixelByIndex(index, terrainType.water);
                return;
            } else if (px != terrainType.void) {
                let mod = (terrainTick + index) % 2;
                let dir = 1 - mod * 2;
                checkIndex += Terrain.width;
                checkIndex += dir;
                px = Terrain.getPixelByIndex(checkIndex);
                if (px != terrainType.void) {
                    checkIndex += dir;
                    px = Terrain.getPixelByIndex(checkIndex);
                    if (px != terrainType.void) {
                        checkIndex += dir;
                        px = Terrain.getPixelByIndex(checkIndex);
                        if (px != terrainType.void) {
                            checkIndex += dir;
                            px = Terrain.getPixelByIndex(checkIndex);
                            if (px != terrainType.void) {
                                checkIndex += dir;
                                px = Terrain.getPixelByIndex(checkIndex);
                                if (px != terrainType.void) {
                                    checkIndex += dir;
                                    px = Terrain.getPixelByIndex(checkIndex);
                                    if (px != terrainType.void) {
                                        checkIndex += dir;
                                        px = Terrain.getPixelByIndex(checkIndex);
                                        if (px != terrainType.void) {
                                            checkIndex = index;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            Terrain.setPixelByIndex(checkIndex, terrainType.water);
            if (checkIndex == index) return;
            updateSurrounding(checkIndex);
            updateSurrounding(index);
        },
    },
    [terrainType.grass]: {
        density: 1,
        color: 0x55aa55ff,
        update(index) {
            //implement
        },
    },
    [terrainType.dirt00]: {
        density: 1,
        color: 0x6E5344ff,
        update(index) {
            dirtBehaviour(index, 0, 0)
        },
    },
    [terrainType.dirt10]: {
        density: 1,
        color: 0x6D5243ff,
        update(index) {
            dirtBehaviour(index, 1, 0)
        },
    },
    [terrainType.dirt20]: {
        density: 1,
        color: 0x6C5142ff,
        update(index) {
            dirtBehaviour(index, 2, 0)
        },
    },
    [terrainType.dirt30]: {
        density: 1,
        color: 0x6B5041ff,
        update(index) {
            dirtBehaviour(index, 3, 0)
        },
    },
    [terrainType.dirt40]: {
        density: 1,
        color: 0x6A4F40ff,
        update(index) {
            dirtBehaviour(index, 4, 0)
        },
    },
    [terrainType.dirt50]: {
        density: 1,
        color: 0x694E3Fff,
        update(index) {
            dirtBehaviour(index, 5, 0)
        },
    },
    [terrainType.dirt60]: {
        density: 1,
        color: 0x684D3Eff,
        update(index) {
            dirtBehaviour(index, 6, 0)
        },
    },
    [terrainType.dirt70]: {
        density: 1,
        color: 0x674C3Dff,
        update(index) {
            dirtBehaviour(index, 7, 0)
        },
    },
    [terrainType.dirt01]: {
        density: 1,
        color: 0x7E5344ff,
        update(index) {
            dirtBehaviour(index, 0, 1)
        },
    },
    [terrainType.dirt11]: {
        density: 1,
        color: 0x7D5243ff,
        update(index) {
            dirtBehaviour(index, 1, 1)
        },
    },
    [terrainType.dirt21]: {
        density: 1,
        color: 0x7C5142ff,
        update(index) {
            dirtBehaviour(index, 2, 1)
        },
    },
    [terrainType.dirt31]: {
        density: 1,
        color: 0x7B5041ff,
        update(index) {
            dirtBehaviour(index, 3, 1)
        },
    },
    [terrainType.dirt41]: {
        density: 1,
        color: 0x7A4F40ff,
        update(index) {
            dirtBehaviour(index, 4, 1)
        },
    },
    [terrainType.dirt51]: {
        density: 1,
        color: 0x794E3Fff,
        update(index) {
            dirtBehaviour(index, 5, 1)
        },
    },
    [terrainType.dirt61]: {
        density: 1,
        color: 0x784D3Eff,
        update(index) {
            dirtBehaviour(index, 6, 1)
        },
    },
    [terrainType.dirt71]: {
        density: 1,
        color: 0x774C3Dff,
        update(index) {
            dirtBehaviour(index, 7, 1)
        },
    },
    [terrainType.dirt02]: {
        density: 1,
        color: 0x8E5344ff,
        update(index) {
            dirtBehaviour(index, 0, 2)
        },
    },
    [terrainType.dirt12]: {
        density: 1,
        color: 0x8D5243ff,
        update(index) {
            dirtBehaviour(index, 1, 2)
        },
    },
    [terrainType.dirt22]: {
        density: 1,
        color: 0x8C5142ff,
        update(index) {
            dirtBehaviour(index, 2, 2)
        },
    },
    [terrainType.dirt32]: {
        density: 1,
        color: 0x8B5041ff,
        update(index) {
            dirtBehaviour(index, 3, 2)
        },
    },
    [terrainType.dirt42]: {
        density: 1,
        color: 0x8A4F40ff,
        update(index) {
            dirtBehaviour(index, 4, 2)
        },
    },
    [terrainType.dirt52]: {
        density: 1,
        color: 0x894E3Fff,
        update(index) {
            dirtBehaviour(index, 5, 2)
        },
    },
    [terrainType.dirt62]: {
        density: 1,
        color: 0x884D3Eff,
        update(index) {
            dirtBehaviour(index, 6, 2)
        },
    },
    [terrainType.dirt72]: {
        density: 1,
        color: 0x874C3Dff,
        update(index) {
            dirtBehaviour(index, 7, 2)
        },
    },
    [terrainType.dirt03]: {
        density: 1,
        color: 0x9E5344ff,
        update(index) {
            dirtBehaviour(index, 0, 3)
        },
    },
    [terrainType.dirt13]: {
        density: 1,
        color: 0x9D5243ff,
        update(index) {
            dirtBehaviour(index, 1, 3)
        },
    },
    [terrainType.dirt23]: {
        density: 1,
        color: 0x9C5142ff,
        update(index) {
            dirtBehaviour(index, 2, 3)
        },
    },
    [terrainType.dirt33]: {
        density: 1,
        color: 0x9B5041ff,
        update(index) {
            dirtBehaviour(index, 3, 3)
        },
    },
    [terrainType.dirt43]: {
        density: 1,
        color: 0x9A4F40ff,
        update(index) {
            dirtBehaviour(index, 4, 3)
        },
    },
    [terrainType.dirt53]: {
        density: 1,
        color: 0x994E3Fff,
        update(index) {
            dirtBehaviour(index, 5, 3)
        },
    },
    [terrainType.dirt63]: {
        density: 1,
        color: 0x984D3Eff,
        update(index) {
            dirtBehaviour(index, 6, 3)
        },
    },
    [terrainType.dirt73]: {
        density: 1,
        color: 0x974C3Dff,
        update(index) {
            dirtBehaviour(index, 7, 3)
        },
    },
};

function dirtBehaviour(index: number, water: number, minerals: number) {
    let checkIndex = Terrain.director[Direction.bottom] + index;
    let px = Terrain.getPixelByIndex(checkIndex);
    let dir = randomInt(0, 2) * 2 - 1;

    const drip = () => {
        if (px == terrainType.void) {
            if (water > 3) {
                Terrain.setPixelByIndex(checkIndex, terrainType.water);
                Terrain.setPixelByIndex(index, DirtManager.dirtByStats(water - 4, minerals));
                updateSurrounding(checkIndex);
                updateSurrounding(index);
                return true;
            }
        }
    }

    const soak = (adjust: number = 0) => {
        if (DirtManager.isDirt(px)) {
            const otherWater = DirtManager.getDirtWater(px);
            if (water > 1 && otherWater < 7 && water + adjust >= otherWater) {
                Terrain.setPixelByIndex(index, DirtManager.dirtByStats(--water, minerals));
                Terrain.setPixelByIndex(checkIndex, DirtManager.dirtByStats(otherWater + 1, DirtManager.getDirtMinerals(px)));
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

export class DirtManager {
    static dirtByStats(water: number, minerals: number) {
        return 0b10000000 + minerals * 8 + water as terrainType
    }

    static isDirt(terrain: terrainType) {
        return (terrain & 0b10000000) == 128
    }

    static getDirtWater(terrain: terrainType) {
        return terrain & 0b00000111
    }

    static getDirtMinerals(terrain: terrainType) {
        return (terrain & 0b00011000) / 8
    }
}

function updateSurrounding(index: number) {
    let [x, y] = indexSplit(index, Terrain.width);
    x = ((x - 1) >> 1) << 1;
    y = ((y - 1) >> 1) << 1;
    const quindex = x + y * Terrain.width;
    Terrain.tempToUpdate.add(quindex);
    Terrain.tempToUpdate.add(quindex + 2);
    Terrain.tempToUpdate.add(quindex + Terrain.width * 2);
    Terrain.tempToUpdate.add(quindex + 2 + Terrain.width * 2);
    /*
    for (let i = 0; i < 9; i++) {
        Terrain.tempToUpdate.add(index + Terrain.director[(2 * i + index) % 9]);
    }
    */
}
