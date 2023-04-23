import { Graphics, SHAPES, Sprite } from "pixi.js";
import { Color } from "../../color";
import { Entity } from "../../entity";
import { random } from "../../utils";
import { Vector } from "../../vector";

export class Sign extends Entity {
    constructor(position: Vector, parent: Entity  = null, angle = 0) {
        const graph = Sprite.from("https://media.discordapp.net/attachments/767355244111331338/1099501473093664788/sign.png");
        graph.anchor.set(0.5);
        super(graph, position, parent, angle);
    }
}