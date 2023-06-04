import { Container, Sprite } from "pixi.js";
import { screenToWorld, mouse, player, terrainTick } from "../../game";
import { Camera } from "../../camera";
import { Entity } from "../../entity";
import { Terrain, TerrainManager, terrainType } from "../../terrain";
import { Vector } from "../../vector";
import { BuildStatus, Buildable } from "./buildable";
import { Cable } from "../passive/cable";
import { Light } from "../../shaders/lighting/light";
import { Color } from "../../color";
import { random } from "../../utils";
import { Stamps } from "../../stamp";
import { Turbine } from "./turbine";

export class Pole extends Buildable {
    graphics: Sprite;
    cable: Cable;
    light: Light;
    cableSnap = false;
    constructor(position: Vector, cable = true, placeInstantly = false) {
        const graph = Sprite.from("buildable/pole.png");
        graph.anchor.set(0.5, 1);
        super(graph, position, placeInstantly);
        this.culling = true;
        if (cable) {
            this.cable = new Cable(position.result().add(new Vector(-3, 55)), position, 200);
            this.cable.graphics.alpha = this.graphics.alpha;
        }
        this.name = "Power pole";
    }
    update(dt: number): void {
        super.update(dt);
        if (this.removed) return;
        if (this.placing) {
            if (this.cable) {
                if (!this.cableSnap)
                    this.cable.setEndpoints(undefined, this.position.result().add(new Vector(3, 55)));
                this.cable.graphics.tint = this.graphics.tint;
            }
        }
    }
    checkValidPlace(adjust = 0): BuildStatus {
        if (this.cable?.targetLength > this.cable?.length) {
            return { valid: false, message: "cable too long" };
        }
        if (Entity.hoveredEntity instanceof Pole || Entity.hoveredEntity instanceof Turbine) {
            this.graphics.alpha = 0;
            this.cableSnap = true;
            this.cable?.setEndpoints(undefined, Entity.hoveredEntity.position.result().add(new Vector(3, 55)));
            return { valid: true, message: "Connect cable" };
        }
        else {
            this.cableSnap = false;
            this.graphics.alpha = .4;
        }
        return super.checkValidPlace(adjust);
    }
    place() {
        if (this.cable) {
            this.cable.graphics.tint = 0xffffff;
            this.cable.graphics.alpha = 1;
        }
        if (Entity.hoveredEntity instanceof Pole || Entity.hoveredEntity instanceof Turbine) {
            if (this.cable) {
                this.cable.setEndpoints(undefined, Entity.hoveredEntity.position.result().add(new Vector(3, 55)));
            }
            else {
                new Pole(Entity.hoveredEntity.position);
            }
            super.remove();
        }
        else {
            super.place();
            Stamps.stamp("foundationSmall", new Vector(this.position.x, this.position.y - 40), { surface: false, useDirtFrom: Terrain.generator, replaceMatching: (r, w) => TerrainManager.isDirt(r) });
            this.light = new Light(this, new Vector(0, this.graphics.height - 3), -Math.PI / 2, 1.2, new Color(255, 180, 150), 200, 1.3);
            new Pole(this.position);
        }
    }
    remove(): void {
        super.remove();
        this.cable?.remove();
    }
}