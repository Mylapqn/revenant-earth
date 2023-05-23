import { ColorSource, Graphics } from "pixi.js";
import { Vector } from "./vector";
import { Camera } from "./camera";
import { Terrain } from "./terrain";


export class DebugDraw {
    static graphics: Graphics;
    static clear() {
        this.graphics.clear();
    }

    static drawCircle(position: Vector, radius: number, color: ColorSource) {
        this.graphics.lineStyle({ color: color, width: 2 });
        this.graphics.drawCircle(...this.toLocal(position), radius);
    }

    static drawLine(from: Vector, to: Vector, color: ColorSource) {
        this.graphics.lineStyle({ color: color, width: 2 });
        this.graphics.moveTo(...this.toLocal(from));
        this.graphics.lineTo(...this.toLocal(to));
    }

    static drawPx(at: Vector, color: ColorSource) {
        this.graphics.lineStyle({ color: color, width: 1 });
        this.graphics.drawRect(...this.toLocal(at), 1, 1);
    }

    static toLocal(position: Vector) {
        return new Vector(position.x - Camera.position.x, (- position.y + Camera.position.y) + Camera.height).xy();
    }
}