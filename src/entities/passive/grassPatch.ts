import { Graphics, SHAPES, Sprite } from "pixi.js";
import { Color } from "../../color";
import { Entity } from "../../entity";
import { random, randomInt } from "../../utils";
import { Vector } from "../../vector";

export class GrassPatch extends Entity {
    graphics: Graphics;
    color: Color;
    constructor(position: Vector) {
        const graph = new Graphics()
        super(graph, position, null);
        let col = Color.randomAroundHSL(50, 10, .3, .15, .45, .06).toPixi();
        this.graphics.beginFill(Color.randomAroundHSL(50, 0, .3, .0, .45, .0).toPixi());
        this.graphics.drawCircle(0, 2, random(2,3));
        this.graphics.endFill();
        this.graphics.lineStyle(1, col);
        let iter = randomInt(1, 2);
        for (let gr = 0; gr < iter; gr++) {
            graph.moveTo(0, 1);
            let angle = -Math.PI / 2 + random(-.3, .3);
            let angleAdd = random(-.4, .4);
            let pos = new Vector(0, 0);
            let len = random(3, 4);
            for (let i = 1; i <= 4; i++) {
                angle += angleAdd;
                pos.add(Vector.fromAngle(angle).mult(len / i));
                graph.lineTo(...pos.xy());
            }
        }
        graph.cacheAsBitmap = true;

    }
}