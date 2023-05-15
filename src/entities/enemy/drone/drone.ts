import { Container, Sprite } from "pixi.js";
import { debugPrint, player } from "../../..";
import { Camera } from "../../../camera";
import { Entity } from "../../../entity";
import { Terrain, terrainType } from "../../../terrain";
import { Vector } from "../../../vector";
import { FlyingPatrolRobotTask, IFlyingPatrolRobot, RobotTask, collisionAvoidance, flyPatrol, flyTo } from "../robotBehaviour";
import { DebugDraw } from "../../../debugDraw";
import { Light } from "../../../shaders/lighting/light";
import { Color } from "../../../color";

export class Drone extends Entity implements IFlyingPatrolRobot {
    task: FlyingPatrolRobotTask
    velocity = new Vector();
    flightVector = new Vector();
    patrolPoints: Vector[];
    acceptableDeviation: number = 10;
    constructor(position: Vector, parent: Entity, angle = 0) {
        const graph = Sprite.from("https://cdn.discordapp.com/attachments/767355244111331338/1107461643039936603/robo.png");
        graph.anchor.set(0.5);
        super(graph, position, parent, angle);
        new Light(this, new Vector(0, 0), Math.PI+.2, .3, new Color(230, 40, 80), 200);
        this.patrolPoints = [position.result(), new Vector(3000, 600), new Vector(2750, 650)]
        this.task = droneTask;
        this.queueUpdate();
    }

    setFlightVector(vector: Vector) {
        this.flightVector = vector;
    }

    update(dt: number) {
        this.graphics.scale.set(Math.sign(this.velocity.x) || 1, 1);

        this.angle += this.flightVector.x / 200;
        this.angle *= 0.99;

        DebugDraw.drawCircle(this.position, this.acceptableDeviation, { r: 200, g: 50, b: 50 });
        this.patrolPoints.forEach(p => DebugDraw.drawCircle(p, 5, "#ffaa00"));
        DebugDraw.drawCircle(this.patrolPoints[0], 1, "#00aa00")
        this.task(this, dt);

        this.velocity.add(this.flightVector.result().mult(3));
        this.velocity.mult(0.99);
        this.position.add(this.velocity.result().mult(dt));

        this.updatePosition();
        this.queueUpdate();
    }
}

function droneTask(robot: IFlyingPatrolRobot, dt: number) {
    const playerPosition = player.position.result();
    const range = 200;
    DebugDraw.drawCircle(robot.position, range, "#55111155");
    if (playerPosition.distanceSquared(robot.position) < range * range && playerPosition.distanceSquared(robot.patrolPoints[0]) < 500 * 500) {
        flyTo(robot, dt, playerPosition);
    } else {
        flyPatrol(robot, dt);
    }
    collisionAvoidance(robot, dt);
}