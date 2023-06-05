import { Container, Sprite } from "pixi.js";
import { debugPrint, player } from "../../../game";
import { Camera } from "../../../camera";
import { Entity } from "../../../entity";
import { Terrain, terrainType } from "../../../terrain";
import { Vector } from "../../../vector";
import { FlyingPatrolRobotTask, IFlyingPatrolRobot, RobotTask, collisionAvoidance, flyPatrol, flyTo } from "../robotBehaviour";
import { DebugDraw } from "../../../debugDraw";
import { Light } from "../../../shaders/lighting/light";
import { Color } from "../../../color";
import { GuiLabel, GuiTooltip } from "../../../gui/gui";
import { Cloud } from "../../passive/cloud";
import { clamp, random, randomBool } from "../../../utils";

export class Drone extends Entity implements IFlyingPatrolRobot {
    task: FlyingPatrolRobotTask
    velocity = new Vector();
    flightVector = new Vector();
    patrolPoints: Vector[];
    acceptableDeviation: number = 15;
    label: GuiLabel;
    light: Light;
    attacking = false;
    constructor(position: Vector, parent: Entity, angle = 0) {
        const graph = Sprite.from("https://cdn.discordapp.com/attachments/767355244111331338/1107461643039936603/robo.png");
        graph.anchor.set(0.5);
        super(graph, position, parent, angle);
        this.light = new Light(this, new Vector(0, 0), Math.PI + .2, .2, new Color(230, 40, 60), 300, 5);
        this.patrolPoints = [position.result(), new Vector(4200, 500), new Vector(4800, 500)]
        this.task = droneTask;
        this.queueUpdate();
        //this.label = new GuiLabel(this.position, "hi :)");
    }

    setFlightVector(vector: Vector) {
        this.flightVector = vector;
    }

    update(dt: number) {
        //this.label.worldPosition = this.position;
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
        let ty = -1;
        for (let dy = 0; dy < 100; dy += 10) {
            if (Terrain.getPixel(Math.round(this.position.x), Math.round(this.position.y - dy)) > 0) {
                ty = dy;
                break;
            }
        }
        if (ty > 0 && randomBool(1 - ty / 200)) {
            new Cloud(this.position.result().add(new Vector(randomBool() ? 10 : -10, -ty)), 20, new Vector(random(-100, 100), random(5, 10)));
        }

        if (this.attacking) {
            this.light.intensity = 10;
            this.light.color = new Color(230, 30, 40);
        }
        else {
            this.light.intensity = 5;
            this.light.color = new Color(160, 40, 240);
            this.light.width = .2;
            this.light.angle = Math.PI + .2;
        }

        this.updatePosition();
        this.queueUpdate();
    }
}

function droneTask(robot: IFlyingPatrolRobot, dt: number) {
    const playerPosition = player.position.result();
    const range = 130;
    DebugDraw.drawCircle(robot.position, range, "#55111155");
    const dist = playerPosition.distanceSquared(robot.position)
    if (dist < range * range && playerPosition.distanceSquared(robot.patrolPoints[0]) < 500 * 500) {
        flyTo(robot, dt, playerPosition.add(new Vector(0, 40)));
        if (robot instanceof Drone) {
            robot.attacking = true;
            let pdiff = player.position.result().sub(robot.position);
            pdiff.y += 30;
            if (robot.graphics.scale.x > 0) pdiff.x *= -1;
            robot.light.width = clamp(1 - (dist / 15000), .1, .6);
            robot.light.angle = pdiff.toAngle();
        }
    } else {
        if (robot instanceof Drone)
            robot.attacking = false;
        flyPatrol(robot, dt);
    }
    collisionAvoidance(robot, dt);
}