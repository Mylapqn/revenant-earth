import { Sprite, utils } from "pixi.js";
import { NetworkBuildable } from "./network";
import { Drone } from "../enemy/drone/drone";
import { Projectile } from "../projectile";
import { Vector } from "../../vector";
import { zigzag } from "../../utils";

export class Turret extends NetworkBuildable {
    gunSprite: Sprite;
    gunPosition = new Vector(0, -15)
    name = "Turret";
    cooldown = 0;
    age = 0;
    cableOffset = new Vector(3, 55);
    constructor() {
        const graph = Sprite.from("shit.png");
        super(graph);
        this.gunSprite = Sprite.from("robot.png");
        this.gunSprite.anchor.set(.3, .5);
        this.gunSprite.position.set(this.gunPosition.x, this.gunPosition.y);
        this.gunSprite.scale.set(5,1);
        graph.addChild(this.gunSprite);
    }
    update(dt: number): void {
        if (this?.network?.energy && !this.placing)  {
            this.age+=dt;
            this.cooldown = Math.max(0, this.cooldown - dt);
            let closestDrone: Drone;
            let closestDist = 50000;
            for (const drone of Drone.droneList) {
                const dist = this.position.distanceSquared(drone.position)
                if (dist < closestDist) {
                    closestDist = dist;
                    closestDrone = drone;
                }
            }
            if (closestDrone) {
                let worldOrigin = this.worldCoords(this.gunPosition);
                let preaim = Projectile.calcPreaim(worldOrigin,closestDrone)
                let rel = worldOrigin.result().sub(preaim);
                rel.x *= -1;
                this.gunSprite.rotation = rel.toAngle();
                if (this.cooldown <= 0) {
                    new Projectile(this, preaim, this.gunPosition);
                    this.cooldown = 1;
                }
            }
            else {
                this.gunSprite.rotation = zigzag(this.age*.3)-Math.PI/2;
            }
        }
        super.update(dt);
    }
}

