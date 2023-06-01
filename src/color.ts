import { clamp, lerp, random, randomInt } from "./utils";

export class Color {
    r: number;
    g: number;
    b: number;
    constructor(r: number = 0, g: number = 0, b: number = 0) {
        this.r = Math.floor(r);
        this.g = Math.floor(g);
        this.b = Math.floor(b);
    }
    toShader(): [number, number, number] {
        return [this.r / 255, this.g / 255, this.b / 255];
    }
    toPixi(): number {
        return (this.r << 16) + (this.g << 8) + this.b
    }
    toHSL() {
        let r = this.r / 255;
        let g = this.g / 255;
        let b = this.b / 255;
        const l = Math.max(r, g, b);
        const s = l - Math.min(r, g, b);
        const h = s
            ? l === r
                ? (g - b) / s
                : l === g
                    ? 2 + (b - r) / s
                    : 4 + (r - g) / s
            : 0;
        return [
            60 * h < 0 ? 60 * h + 360 : 60 * h,
            100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0),
            (100 * (2 * l - s)) / 2,
        ];
    }
    mix(color: Color, ratio = 0.5) {
        ratio = Math.min(1, Math.max(0, ratio));
        return new Color(lerp(this.r, color.r, ratio), lerp(this.g, color.g, ratio), lerp(this.b, color.b, ratio))
    }
    add(color: Color, ratio = 1) {
        ratio = clamp(ratio);
        return new Color(this.r + color.r * ratio, this.g + color.g * ratio, this.b + color.b * ratio);
    }
    mult(color: Color) {
        return new Color(this.r * color.r / 255, this.g * color.g / 255, this.b * color.b / 255,);
    }
    copy() {
        return new Color(this.r, this.g, this.b);
    }
    static fromHsl(h: number, s: number, l: number) {
        //H: 0 - 360; S: 0 - 1; L:0 - 1;
        if (s == 0) {
            return new Color(l * 255, l * 255, l * 255);
        }
        else {
            const k = (n: number) => (n + h / 30) % 12;
            const a = s * Math.min(l, 1 - l);
            const f = (n: number) =>
                l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
            return new Color(255 * f(0), 255 * f(8), 255 * f(4))
        }
    }
    static random() {
        return new Color(randomInt(0, 255), randomInt(0, 255), randomInt(0, 255));
    }
    static randomAroundHSL(h: number, hRand: number, s: number, sRand: number, l: number, lRand: number) {
        return this.fromHsl(h + random(-hRand, hRand), s + random(-sRand, sRand), l + random(-lRand, lRand))
    }
}