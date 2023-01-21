
import { Sprite, Texture } from "pixi.js";


export class PixelDrawer {
    static array: Uint8Array;
    static graphic: Sprite;
    static texture: Texture;
    static view: DataView;
    static init() {
        this.array = new Uint8Array(512 * 256 * 4);
        this.texture = Texture.fromBuffer(this.array, 512, 256);
        this.graphic = new Sprite(this.texture);
        this.array.fill(255);
        this.view = new DataView(this.array.buffer);
    }

    static setPixel(x: number, y: number, color: number) {
        let i = 4 * (512 * y + x);
        this.view.setUint32(i, color*255+255);
    }

    static update(){
        this.texture.update();
    }
}