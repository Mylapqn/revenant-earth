import { ColorSource, Graphics, Text } from "pixi.js";
import { Vector } from "./vector";
import { Camera } from "./camera";
import { Terrain } from "./terrain";


export class DebugDraw {
    static graphics: Graphics;
    static clear() {
        if (!this.graphics.visible) return;
        this.graphics.clear();
        this.graphics.removeChildren();
    }

    static drawCircle(position: Vector, radius: number, color: ColorSource) {
        if (!this.graphics.visible) return;
        this.graphics.lineStyle({ color: color, width: 2 });
        this.graphics.drawCircle(...this.toLocal(position), radius);
    }

    static drawLine(from: Vector, to: Vector, color: ColorSource) {
        if (!this.graphics.visible) return;
        this.graphics.lineStyle({ color: color, width: 2 });
        this.graphics.moveTo(...this.toLocal(from));
        this.graphics.lineTo(...this.toLocal(to));
    }

    static drawPx(at: Vector, color: ColorSource) {
        if (!this.graphics.visible) return;
        this.graphics.lineStyle({ color: color, width: 1 });
        this.graphics.drawRect(...this.toLocal(at), 1, 1);
    }

    static drawText(position: Vector, text: string) {
        if (!this.graphics.visible) return;
        let t = new Text(text,{fontSize:20});
        t.style.fontFamily = "monogram";
        t.style.fontSize = "16px";
        t.style.lineHeight = 10;
        t.style.letterSpacing = 0;
        t.position.set(...this.toLocal(position));
        this.graphics.addChild(t);
    }

    static toLocal(position: Vector) {
        return new Vector(position.x - Camera.position.x, (- position.y + Camera.position.y) + Camera.height).xy();
    }
}