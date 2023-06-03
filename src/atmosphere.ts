import { Color } from "./color";
import { Vector } from "./vector";

export class Atmosphere {
    static settings = {
        sunAngle: -3,
        sunPosition: new Vector(300,100),
        ambientLight: new Color(255,255,255),
        sunIntensity:1,
    }
}