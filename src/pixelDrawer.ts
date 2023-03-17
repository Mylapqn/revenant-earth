
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
        this.graphic.roundPixels = true;
        this.array.fill(100);
        this.view = new DataView(this.array.buffer);
    }

    static setPixel(x: number, y: number, color: number) {
        let i = 4 * (x + (Camera.height - y-1) * Camera.width);
        this.view.setUint32(i, color);
    }

    static resize(){
        this.array = new Uint8Array(Camera.width * Camera.height * 4);
        this.texture = Texture.fromBuffer(this.array, Camera.width, Camera.height);
        this.graphic.texture = this.texture;
        this.graphic.roundPixels = true;
        this.array.fill(100);
        this.view = new DataView(this.array.buffer);
    }

    static update() {
        this.texture.update();
    }
}