import { Rectangle } from "pixi.js";
import { app } from "./game";
import { Vector } from "./vector";

export class Camera {
    static position = new Vector(2280, 500);
    static width = 512;
    static height = 256;
    static aspectRatio = 1;
    static yOffset = 50;
    static rect = new Rectangle(0, 0, Camera.width, Camera.height);
    private static _scale = 1;
    static set scale(s: number) {
        this._scale = s;
        app.view.style.scale = 100 * s + "%";
    }
    static get scale(){
        return this._scale;
    }
}