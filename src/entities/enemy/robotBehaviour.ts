import { DebugDraw } from "../../debugDraw";
import { Terrain, terrainType } from "../../terrain";
import { Vector } from "../../vector";

export type RobotTask = (robot: ITaskableRobot, dt: number) => void

export interface ITaskableRobot {
    task: RobotTask,
}

export type FlyingRobotTask = (robot: IFlyingTaskableRobot) => void


export interface IFlyingTaskableRobot extends ITaskableRobot {
    position: Vector
    velocity: Vector
    setFlightVector: (vector: Vector) => void
}

export type FlyingPatrolRobotTask = (robot: IFlyingPatrolRobot, dt: number) => void
export interface IFlyingPatrolRobot extends IFlyingTaskableRobot {
    randomOffset:Vector;
    patrolPoints: Vector[]
    acceptableDeviation: number
    onPointReached?: () => void
}

export const flyTo = (robot: IFlyingTaskableRobot, dt: number, target: Vector) => {
    const currentPosition = robot.position.result().add(robot.velocity.result().mult(dt));
    const direction = currentPosition.diff(target);
    if (isNaN(direction.x)) {
        direction.x = 0;
        direction.y = 1;
    }

    const proximity = direction.lengthSquared() / robot.velocity.lengthSquared()

    if (proximity > 1) {
        direction.normalize().mult(-1);
    } else {
        direction.normalize().mult(-proximity);
    }

    DebugDraw.drawLine(robot.position, target, "#00ff0033");

    robot.setFlightVector(direction);
}


export const flyPatrol: FlyingPatrolRobotTask = (robot: IFlyingPatrolRobot, dt: number) => {
    const currentPosition = robot.position.result().add(robot.velocity.result().mult(dt));
    if (robot.patrolPoints[0].distance(currentPosition) < robot.acceptableDeviation) {
        if (robot.onPointReached) robot.onPointReached();
        const done = robot.patrolPoints.shift();
        robot.patrolPoints.push(done);
    }

    flyTo(robot, dt, robot.patrolPoints[0]);
}

export const collisionAvoidance = (robot: IFlyingTaskableRobot, dt: number) => {
    const checks = Math.floor(robot.velocity.length() / 10);
    const position = robot.position.result()
    for (let index = 0; index < checks; index++) {
        let checkCoord = position.result().add(robot.velocity.result().mult(index / checks / 2)).add(new Vector(0, index * -1 - 5));
        if (Terrain.getPixel(...checkCoord.result().round().xy()) != terrainType.void) {
            DebugDraw.drawCircle(checkCoord, 1, "#ff5555");
            robot.setFlightVector(new Vector(0, 1));
            return;
        }
        DebugDraw.drawCircle(checkCoord, 1, "#55ff55");


        checkCoord = checkCoord.result().add(new Vector(0, index * 2 + 10))
        if (Terrain.getPixel(...checkCoord.result().round().xy()) != terrainType.void) {
            DebugDraw.drawCircle(checkCoord, 1, "#ff5555");
            robot.setFlightVector(new Vector(0, -1));
            return;
        }

        DebugDraw.drawCircle(checkCoord, 1, "#55ff55");
    }
}