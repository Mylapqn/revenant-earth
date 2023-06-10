import { Graphics, SHAPES, Sprite } from "pixi.js";
import { Color } from "../../color";
import { Entity } from "../../entity";
import { random } from "../../utils";
import { Vector } from "../../vector";
import { Terrain } from "../../terrain";
import { Falling } from "../falling";

export class Prop extends Entity {
    constructor(position: Vector, graphics: Sprite) {
        const graph = graphics;
        graph.anchor.set(0.5, 1);
        super(graph, new Vector(position.x, position.y + Terrain.getHeight(Math.round(position.x))), undefined, 0);
    }
}