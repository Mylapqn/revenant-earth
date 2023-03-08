import { Sprite } from "pixi.js";
import { Entity } from "../../../entity";
import { Vector } from "../../../vector";

export class RobotBody extends Entity {
    constructor(position: Vector, parent: Entity, angle = 0) {
        const graph = Sprite.from("robot.png");
        graph.anchor.set(0.5);
        super(graph, position, parent, angle);
    }
}