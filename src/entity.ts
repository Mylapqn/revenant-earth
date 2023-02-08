import { Container, Graphics, Sprite } from "pixi.js";
import { Camera } from "./camera";
import { Vector } from "./vector";

export class Entity {
    static graphic: Container;
    static toUpdate: Set<Entity> = new Set();
    static tempToUpdate: Set<Entity> = new Set();
    parent: Entity | undefined;
    position: Vector;
    angle: number;
    graphics: Sprite;
    constructor(graphics: Sprite, position: Vector, parent?: Entity, angle = 0) {
        this.graphics = graphics;
        this.graphics.anchor.set(0.5);
        this.position = position;
        this.angle = angle;
        if (parent) {
            this.parent = parent;
            this.parent.graphics.addChild(this.graphics);
        } else {
            Entity.graphic.addChild(this.graphics);
        }
        this.queueUpdate();
    }

    protected updatePosition() {
        const pos = this.position.result();
        this.graphics.position.set(pos.x, -pos.y);
        this.graphics.rotation = this.angle;
    }

    protected queueUpdate() {
        Entity.tempToUpdate.add(this);
    }

    update() {
        this.updatePosition();
    }

    static update() {
        const cam = Camera.position.result();
        this.graphic.position.set(-cam.x, Camera.height + cam.y);
        for (const entity of this.toUpdate) {
            entity.update();
        }

        this.toUpdate = this.tempToUpdate;
        this.tempToUpdate = new Set();
    }
}