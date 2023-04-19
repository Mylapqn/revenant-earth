import { Color } from "./color";
import { Vector } from "./vector";

export class Atmosphere {
    static settings = {
        sunAngle: -2.5,
        sunPosition: new Vector(300,100),
        ambientLight: new Color(255,255,255),
        sunIntensity:1,
    }
}