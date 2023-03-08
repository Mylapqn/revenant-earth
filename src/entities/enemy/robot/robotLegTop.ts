import { Sprite } from "pixi.js";
import { Entity } from "../../../entity";
import { Terrain, terrainType } from "../../../terrain";
import { Vector } from "../../../vector";

export class RobotLegTop extends Entity {
    constructor(position: Vector, parent: Entity, angle = 0) {
        const graph = Sprite.from("robotLeg.png");
        super(graph, position, parent, angle);
        graph.anchor.set(0.5, 2/32);
    }
    
    update() {
        this.updatePosition();
    }
}