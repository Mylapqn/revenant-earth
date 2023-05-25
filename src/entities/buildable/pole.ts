import { Container, Sprite } from "pixi.js";
import { screenToWorld, mouse, player, terrainTick } from "../../game";
import { Camera } from "../../camera";
import { Entity } from "../../entity";
import { Terrain, terrainType } from "../../terrain";
import { Vector } from "../../vector";
import { Buildable } from "./buildable";
import { Cable } from "../passive/cable";
import { Light } from "../../shaders/lighting/light";
import { Color } from "../../color";
import { random } from "../../utils";

export class Pole extends Buildable {
    graphics: Sprite;
    cable: Cable;
    light: Light;
    constructor(position: Vector, cable = true, placeInstantly = false) {
        const graph = Sprite.from("buildable/pole.png");
        graph.anchor.set(0.5, 1);
        super(graph, position, placeInstantly);
        this.culling = true;
        if (cable) {
            this.cable = new Cable(position.result().add(new Vector(-3, 55)), position, 200);
            this.cable.graphics.alpha = this.graphics.alpha;
        }
    }
    update(dt: number): void {
        super.update(dt);
        if (this.removed) return;
        if (this.placing) {
            if (this.cable) {
                this.cable.setEndpoints(undefined, this.position.result().add(new Vector(3, 55)));
                this.cable.graphics.tint = this.graphics.tint;
            }
        }
    }
    checkValidPlace(adjust = 0): boolean {
        if (this.cable?.targetLength > this.cable?.length) return false;
        return super.checkValidPlace(adjust);
    }
    place() {
        super.place();
        if (this.cable) {
            this.cable.graphics.tint = this.graphics.tint;
            this.cable.graphics.alpha = this.graphics.alpha;
        }

        this.light = new Light(this, new Vector(0, this.graphics.height - 3), -Math.PI / 2, 1.2, new Color(255,200,180), 200);
        new Pole(this.position)
    }
    remove(): void {
        super.remove();
        this.cable?.remove();
    }
}