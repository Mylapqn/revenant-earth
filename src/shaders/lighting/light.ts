import { Color } from "../../color";
import { Entity } from "../../entity";
import { Vector } from "../../vector";

export class Light {
    _position = new Vector();
    width = 1;
    _angle: number;
    range = 100;
    color = new Color(255, 100, 255);
    parent: Entity;
    constructor(parent: Entity = null, position: Vector, angle = 0, width = 1, color = new Color(255, 255, 255), range = 100) {

        this._position = position;
        this._angle = angle;
        this.width = width;
        this.range = range;
        this.color = color.copy();
        this.parent = parent;
        console.log(this);
        Light.list.push(this);
    }

    public get angle(): number {
        if (!this.parent) return this._angle;
        if (this.parent.graphics.scale.x < 0) return Math.PI - (this._angle) + this.parent.angle;
        return this._angle + this.parent.angle;
    }
    public get position(): Vector {
        if (!this.parent) return this._position;
        return this._position.result().add(this.parent.position);
    }
    public set angle(angle) {
        this._angle = angle;
    }
    public set position(position) {
        this._position = position;
    }

    static list: Light[] = [];
}