import { debugPrint, preferences, tick } from ".";
import { Camera } from "./camera";
import { PixelDrawer } from "./pixelDrawer";
import { indexSplit } from "./utils";
import { Vector } from "./vector";


export class Terrain {
    static readonly width = 1024 * 100;
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
        if (type == terrainType.sand || type == terrainType.water || type == terrainType.grass) this.tempToUpdate.add(i);
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
                PixelDrawer.setPixel(x, y, lookup[type].colorer(index));
                if (preferences.showUpdates && this.toUpdate.has(index)) {
                    PixelDrawer.setPixel(x, y, 0x00ff0099);
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
            const type = this.view.getUint8(index) as terrainType;
            const properties = lookup[type];
            if (properties.update) properties.update(index);
        }
        this.toUpdate = this.tempToUpdate;
        this.tempToUpdate = new Set();
    }
}

export enum terrainType {
    void,
    dirt,
    sand,
    water,
    grass,
}

type terrainProperties = {
    colorer: (i: number) => number
    update?: (index: number) => void
}

const lookup: Record<terrainType, terrainProperties> = {
    [terrainType.void]: {
        colorer(i) {
            return 0
        },
    },
    [terrainType.dirt]: {
        colorer(i) {
            return i % 89 == 0 || i % 155 == 0 ? 0x556655ff : 0x554411ff;
        },
    },
    [terrainType.sand]: {
        colorer(i) {
            return i % 89 == 0 || i % 155 == 0 ? 0xeeee55ff : 0xffffccff;
        },
        update(index) {
            let checkIndex: number;
            checkIndex = index - Terrain.width;
            let px = Terrain.getPixelByIndex(checkIndex);

            if (px != terrainType.void && px != terrainType.water) {
                let mod = (tick * 4871 + index * 10003193) % 2;
                let dir = 1 - mod * 2;
                checkIndex += dir;
                px = Terrain.getPixelByIndex(checkIndex);
                if (px != terrainType.void && px != terrainType.water) {
                    checkIndex = index;
                    px = Terrain.getPixelByIndex(checkIndex);
                }
            }

            if (checkIndex == index) return;
            Terrain.setPixelByIndex(index, px);
            Terrain.setPixelByIndex(checkIndex, terrainType.sand);
            updateSurrounding(checkIndex);
            updateSurrounding(index);
        },
    },
    [terrainType.water]: {
        colorer(i) {
            //return (Terrain.getPixelByIndex(i + Terrain.width) == terrainType.void && Terrain.getPixelByIndex(i + Terrain.width + 1) == terrainType.void && Terrain.getPixelByIndex(i + Terrain.width - 1) == terrainType.void) ? 0 : ((-i + tick * Terrain.width) % 18512 == 0 ? 0x005555cc : 0x559999cc);
            return ((-i + tick * Terrain.width) % 18512 == 0 ? 0x005555cc : 0x559999cc);
        },
        update(index) {
            Terrain.setPixelByIndex(index, terrainType.void);
            let checkIndex: number;
            checkIndex = index - Terrain.width;
            let px = Terrain.getPixelByIndex(checkIndex);

            if (px != terrainType.void) {
                let mod = (tick + index) % 2;
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
        colorer(i) {
            return 0x55aa55ff;
        },
        update(index) {
            let mod = (tick + index) % 97;
            if (mod == 0) {
                let voidCount = 0;
                for (const adjust in Terrain.director) {
                    const checkIndex = Terrain.director[adjust] + index;
                    const px = Terrain.getPixelByIndex(checkIndex);
                    if (px == terrainType.void) {
                        voidCount++;
                    } else if (px == terrainType.dirt) {
                        for (const adjust2 in Terrain.director) {
                            const checkIndex2 = Terrain.director[adjust2] + checkIndex;
                            const px2 = Terrain.getPixelByIndex(checkIndex2);
                            if (px2 == terrainType.void) {
                                Terrain.setPixelByIndex(checkIndex, terrainType.grass);
                                Terrain.tempToUpdate.add(index);
                                Terrain.tempToUpdate.add(checkIndex);
                            }
                        }
                    }
                }
                if (voidCount == 0) {
                    Terrain.setPixelByIndex(index, terrainType.dirt);
                    updateSurrounding(index);
                }
            } else {
                Terrain.tempToUpdate.add(index);
            }
        },
    }
};


function updateSurrounding(index: number) {
    for (let i = 0; i < 9; i++) {
        Terrain.tempToUpdate.add(index + Terrain.director[(2 * i + index) % 9]);
    }
}