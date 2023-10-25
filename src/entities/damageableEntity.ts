import { Container } from "pixi.js";
import { Entity } from "../entity";
import { Vector } from "../vector";
import { Sound, SoundEffect, SoundManager } from "../sound";
import { DebugDraw } from "../debugDraw";

export class DamageableEntity extends Entity {
    constructor(graphics: Container, position: Vector, parent?: Entity | Container, angle = 0) {
        super(graphics, position, parent, angle);
        DamageableEntity.list.push(this);
    }
    health = 10;
    hitSound: SoundEffect;
    deathSound: SoundEffect;
    hitboxOffset = new Vector();
    hitboxSize = 10;
    velocity:Vector;
    damage(amount: number) {
        this.hitSound?.play();
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }
    die() {
        this.deathSound?.play();
        this.remove();
    }
    remove(): void {
        DamageableEntity.list.splice(DamageableEntity.list.indexOf(this), 1);
        super.remove();
    }
    static list: DamageableEntity[] = [];
}