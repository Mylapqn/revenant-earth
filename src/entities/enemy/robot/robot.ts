import { Container, Sprite } from "pixi.js";
import { debugPrint } from "../../..";
import { Camera } from "../../../camera";
import { Entity } from "../../../entity";
import { Terrain, terrainType } from "../../../terrain";
import { Vector } from "../../../vector";
import { RobotBody } from "./robotBody";
import { RobotLegTop } from "./robotLegTop";

export class Robot extends Entity {
    legs: RobotLegTop[] = []
    body: RobotBody;
    constructor(position: Vector, parent: Entity, angle = 0) {
        super(new Container(), position, parent, angle);
        this.legs[0] = new RobotLegTop(new Vector(-4, 0), this);
        this.legs[1] = new RobotLegTop(new Vector(4, 0), this);
        this.body = new RobotBody(new Vector(0, 0), this);
    }

    update() {  
        this.position = Camera.position.result().add(new Vector(Camera.width / 2, Camera.height / 2));
        this.updatePosition();
        this.queueUpdate();
    }
}