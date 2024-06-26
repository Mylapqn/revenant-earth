import { Container, EventBoundary, FederatedPointerEvent, Graphics, Point, Rectangle, Sprite } from "pixi.js";
import { Camera } from "./camera";
import { Terrain } from "./terrain";
import { Vector } from "./vector";
import { OutlineFilter } from "@pixi/filter-outline";
import { GUI, GuiTooltip } from "./gui/gui";
import { HslAdjustmentFilter } from "@pixi/filter-hsl-adjustment";
import { mouse } from "./game";

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
    culling = false;
    cullExtend = 100;
    removed = false;
    name = "Entity";
    constructor(graphics: Container, position: Vector, parent?: Entity | Container, angle = 0) {
        this.graphics = graphics;
        this.position = position;
        this.angle = angle;
        if (parent) {
            if (parent instanceof Entity) {
                this.parent = parent;
                this.parent.graphics.addChild(this.graphics);
            }
            else {
                parent.addChild(this.graphics);
            }
        } else {
            Entity.graphic.addChild(this.graphics);
        }
        this.queueUpdate();
    }

    protected cullDisplay() {
        if (this.removed) return;
        let wp = this.worldCoords(new Vector());
        if (wp.x > Camera.position.x + Camera.width + this.cullExtend || wp.x < Camera.position.x - this.cullExtend) this.graphics.visible = false;
        else this.graphics.visible = true;
    }

    protected updatePosition() {
        if (this.removed) return;
        const pos = this.position.result().round();
        if (this.parent)
            this.graphics.position.set(pos.x, pos.y);
        else
            this.graphics.position.set(pos.x, -pos.y);
        this.graphics.rotation = this.angle;
    }

    protected queueUpdate() {
        if (this.removed) return;
        Entity.tempToUpdate.add(this);
    }

    worldCoords(localCoords: Vector) {
        if(this.removed) return new Vector();
        let position = this.graphics.toGlobal(new Point(localCoords.x, localCoords.y));
        //return new Vector(position.x, position.y);
        return new Vector(Camera.position.x + position.x, Camera.height + Camera.position.y - position.y);
    }
    worldAngle(): number {
        if (this.parent) return this.parent.worldAngle() + this.angle;
        else return this.angle;
    }

    update(dt: number) {
        if (this.removed) return;
        if (this.culling) this.cullDisplay();
        this.updatePosition();
    }

    remove() {
        this.removed = true;
        this.parent?.graphics.removeChild(this.graphics);
        this.graphics.destroy();
        this.tooltip?.remove();
        Entity.tempToUpdate.delete(this);
        Entity.toUpdate.delete(this);
    }

    click(button = 1) {

    }

    get hoverable() {
        return this.graphics.interactive;
    }

    set hoverable(val: boolean) {
        this.graphics.interactive = val;
        if (val) {
            this.graphics.filterArea = Camera.rect;
            this.graphics.on("pointerenter", this.pointerEnter.bind(this))
            this.graphics.on("pointerleave", this.pointerLeave.bind(this))
        }
        else {
            //console.log(this, Entity.hoveredEntity, Entity.hoveredEntity == this);
            if (Entity.hoveredEntity == this) this.pointerLeave();
            this.graphics.removeAllListeners("pointerenter");
            this.graphics.removeAllListeners("pointerleave");
        }
    }

    pointerEnter() {
        GUI.hover(true);
        if (!this.hovered && mouse.gui == 0) {
            this.hovered = true;
            Entity.hoveredEntity = this;
            this.graphics.filters = [new HslAdjustmentFilter({ lightness: .3 }), new OutlineFilter(1, 0xFFFFFF, .1, 1)];
            this.tooltip = new GuiTooltip(this.name);
        }
    }

    pointerLeave() {
        GUI.hover(false);
        if (this.hovered) {
            Entity.hoveredEntity = null;
            this.hovered = false;
            this.graphics.filters = [];
            this.tooltip.remove();
        }
    }

    static update(dt: number) {
        const cam = Camera.position.result();
        this.graphic.position.set(-cam.x, Camera.height + cam.y);
        for (const entity of this.toUpdate) {
            if (!entity.removed)
                entity.update(dt);
        }

        this.toUpdate = this.tempToUpdate;
        this.tempToUpdate = new Set();
    }
    static hoveredEntity: Entity;
}