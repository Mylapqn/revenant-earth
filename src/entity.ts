import { Container, Graphics, Point, Rectangle, Sprite } from "pixi.js";
import { Camera } from "./camera";
import { Terrain } from "./terrain";
import { Vector } from "./vector";
import { OutlineFilter } from "@pixi/filter-outline";
import { GuiTooltip } from "./gui/gui";

export class Entity {
    static graphic: Container;
    static toUpdate: Set<Entity> = new Set();
    static tempToUpdate: Set<Entity> = new Set();
    parent: Entity | undefined;
    position: Vector;
    angle: number;
    graphics: Container;
    tooltip: GuiTooltip;
    hovered = false;
    constructor(graphics: Container, position: Vector, parent?: Entity, angle = 0) {
        this.graphics = graphics;
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
        const pos = this.position.result().round();
        if (this.parent)
            this.graphics.position.set(pos.x, pos.y);
        else
            this.graphics.position.set(pos.x, -pos.y);
        this.graphics.rotation = this.angle;
    }

    protected queueUpdate() {
        Entity.tempToUpdate.add(this);
    }

    worldCoords(localCoords: Vector) {
        let position = this.graphics.toGlobal(new Point(localCoords.x, localCoords.y));
        //return new Vector(position.x, position.y);
        return new Vector(Camera.position.x + position.x, Camera.height + Camera.position.y - position.y);
    }

    worldAngle(): number {
        if (this.parent) return this.parent.worldAngle() + this.angle;
        else return this.angle;
    }

    update(dt: number) {
        this.updatePosition();
    }

    remove() {
        this.parent?.graphics.removeChild(this.graphics);
        this.graphics.destroy();
        Entity.tempToUpdate.delete(this);
        Entity.toUpdate.delete(this);
    }

    get interactive() {
        return this.graphics.interactive;
    }

    set interactive(val: boolean) {
        this.graphics.interactive = val;
        if (val) {
            this.graphics.filterArea = new Rectangle(0, 0, Camera.width, Camera.height);
            this.graphics.on("pointerenter", () => {
                if (!this.hovered) {
                    this.hovered = true;
                    this.graphics.filters = [new OutlineFilter(1, 0xFFFFFF, .1, .3)];
                    this.tooltip = new GuiTooltip("entity");
                }
            })
            this.graphics.on("pointerleave", () => {
                if (this.hovered) {
                    this.hovered = false;
                    this.graphics.filters = [];
                    this.tooltip.remove();
                }
            })
        }
        else {
            this.graphics.removeAllListeners("pointerenter");
            this.graphics.removeAllListeners("pointerleave");
        }
    }

    static update(dt: number) {
        const cam = Camera.position.result();
        this.graphic.position.set(-cam.x, Camera.height + cam.y);
        for (const entity of this.toUpdate) {
            entity.update(dt);
        }

        this.toUpdate = this.tempToUpdate;
        this.tempToUpdate = new Set();
    }
}