import { Container, Sprite } from "pixi.js";
import { screenToWorld, mouse } from "../..";
import { Camera } from "../../camera";
import { Entity } from "../../entity";
import { Terrain, terrainType } from "../../terrain";
import { Vector } from "../../vector";
import { Buildable } from "./buildable";
import { Cable } from "../passive/cable";

export class Pole extends Buildable {
    graphics: Sprite;
    cable: Cable;
    constructor(position: Vector, cable=true,placeInstantly = false) {
        const graph = Sprite.from("buildable/pole.png");
        graph.anchor.set(0.5, 1);
        super(graph, position, placeInstantly);
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
    checkValidPlace(): boolean {
        if (this.cable?.targetLength > this.cable?.length) return false;
        return super.checkValidPlace();
    }
    place() {
        super.place();
        if (this.cable) {
            this.cable.graphics.tint = this.graphics.tint;
            this.cable.graphics.alpha = this.graphics.alpha;
        }
        new Pole(this.position)
    }
    remove(): void {
        super.remove();
        this.cable?.remove();
    }
}