import { PixelDrawer } from "./pixelDrawer";
import { indexSplit } from "./utils";
import { Vector } from "./vector";


export class Terrain {
    static readonly width = 100;
    static readonly height = 8;
    static parts: Array<TerrainPart> = [];
    static init() {
        for (let i = 0; i < this.width * this.height; i++) {
            this.parts.push(new TerrainPart(i));
        }
    }

    static setPixel(x: number, y: number, type: terrainType) {
        const [x1, x2] = indexSplit(x, TerrainPart.size);
        const [y1, y2] = indexSplit(y, TerrainPart.size);
        const part = Terrain.parts[x2 + y2 * this.width];
        if (!part.makeup) part.split();
        part.setIndex(x1 + y1 * TerrainPart.size, type);
    }

    static join(x: number, y: number) {
        const [x1, x2] = indexSplit(x, TerrainPart.size);
        const [y1, y2] = indexSplit(y, TerrainPart.size);
        Terrain.parts[x2 + y2 * this.width].joinCheck();
    }
}

export enum terrainType {
    void,
    dirt,
}

export class TerrainPart {
    static readonly size = 32;
    index: number;
    type: terrainType = terrainType.void;
    makeup: Uint8Array;
    view: DataView;

    constructor(index: number) {
        this.index = index;
    }

    split() {
        this.makeup = new Uint8Array(TerrainPart.size * TerrainPart.size);
        this.view = new DataView(this.makeup.buffer)
        this.makeup.fill(this.type);
    }

    setIndex(i: number, type: terrainType) {
        this.type = type;
        this.view.setUint8(i, type);
    }

    joinCheck() {
        if (!this.makeup) return;
        this.type = this.view.getUint8(0);
        for (let i = 1; i < TerrainPart.size * TerrainPart.size; i++) {
            if (this.type != this.view.getUint8(i)) return;
        }
        this.makeup = undefined;
    }

    show() {
        const [sx, sy] = indexSplit(this.index, Terrain.width);
        if (this.makeup) {
            for (let i = 0; i < TerrainPart.size * TerrainPart.size; i++) {
                const [x, y] = indexSplit(i, TerrainPart.size);
                PixelDrawer.setPixel(sx * TerrainPart.size + x, sy * TerrainPart.size + y, lookup[this.view.getUint8(i) as terrainType].colorer(this.index * TerrainPart.size * TerrainPart.size + i));
            }
        } else {
            for (let i = 0; i < TerrainPart.size * TerrainPart.size; i++) {
                const [x, y] = indexSplit(i, TerrainPart.size);
                PixelDrawer.setPixel(sx * TerrainPart.size + x, sy * TerrainPart.size + y, lookup[this.type].colorer(this.index * TerrainPart.size * TerrainPart.size + i));
            }
        }
    }
}


type terrainProperties = {
    colorer: (i: number) => number
}

const lookup: Record<terrainType, terrainProperties> = {
    [terrainType.void]: {
        colorer(i) {
            return 0
        },
    },
    [terrainType.dirt]: {
        colorer(i) {
            return i % 89 == 0 || i % 105 == 0 ? 0x556655ff : 0x554411ff;
        },
    }
};
