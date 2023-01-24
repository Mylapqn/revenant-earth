
import { Sprite, Texture } from "pixi.js";
import { Camera } from "./camera";


export class PixelDrawer {
    static array: Uint8Array;
    static graphic: Sprite;
    static texture: Texture;
    static view: DataView;
    static init() {
        this.array = new Uint8Array(Camera.width * Camera.height * 4);
        this.texture = Texture.fromBuffer(this.array, Camera.width, Camera.height);
        this.graphic = new Sprite(this.texture);
        this.array.fill(100);
        this.view = new DataView(this.array.buffer);
    }

    static setPixel(x: number, y: number, color: number) {
        const xt = x - Camera.position.x
        const yt = y - Camera.position.y
        let i = 4 * ((Camera.width * Camera.height - Camera.height * yt) + xt);
        if (i >= 0 && i < this.array.buffer.byteLength)
            this.view.setUint32(i, color);
    }

    static update() {
        this.texture.update();
    }
}