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
import { NetworkBuildable, WiringNetwork } from "./network";
import { SoundManager } from "../../sound";
import { GuiSpeechBubble } from "../../gui/gui";

export class Pole extends NetworkBuildable {
    network: WiringNetwork;
    connected: boolean;
    graphics: Sprite;
    cable: Cable;
    light: Light;
    cableSnap = false;
    cableOffset = new Vector(3, 55);
    cost = 100;
    constructor(position: Vector, cable = true, placeInstantly = false) {
        const graph = Sprite.from("buildable/pole.png");
        graph.anchor.set(0.5, 1);
        super(graph, position, placeInstantly);
        this.culling = true;
        if (cable) {
            SoundManager.fx.electric.play();
            this.cable = new Cable(position.result(), position, 200);
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
                    this.cable.setEndpoints(undefined, this.position.result().add(this.cableOffset));
                this.cable.graphics.tint = this.graphics.tint;
            }
        }
    }
    checkValidPlace(adjust = 0): BuildStatus {
        if (this.cable?.targetLength > this.cable?.length) {
            return { valid: false, message: "cable too long" };
        }
        if (Entity.hoveredEntity instanceof NetworkBuildable) {
            this.graphics.alpha = 0;
            this.cableSnap = true;
            this.cable?.setEndpoints(undefined, Entity.hoveredEntity.position.result().add(Entity.hoveredEntity.cableOffset));
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
            if (!this.cableSnap)
                this.cable.setEndpoints(undefined, this.position.result().add(this.cableOffset));
        }
        if (Entity.hoveredEntity instanceof NetworkBuildable) {
            if (this.cable) {
                this.cable.setEndpoints(undefined, Entity.hoveredEntity.position.result().add(Entity.hoveredEntity.cableOffset));
                SoundManager.fx.electric.play();
                if (this.network) {
                    this.network.addElement(Entity.hoveredEntity);
                }
            }
            else {
                let p = new Pole(Entity.hoveredEntity.position.result().add(Entity.hoveredEntity.cableOffset));
                if (Entity.hoveredEntity.network) {
                    Entity.hoveredEntity.network.addElement(p);
                }
            }
            super.remove();
        }
        else {
            super.place();
            Stamps.stamp("foundationSmall", new Vector(this.position.x, this.position.y - 40), { surface: false, useDirtFrom: Terrain.generator, replaceMatching: (r, w) => TerrainManager.isDirt(r) });
            this.light = new Light(this, new Vector(0, this.graphics.height - 3), -Math.PI / 2, 1.2, new Color(255, 180, 150), 200, 0);
            if (!this.network)
                new WiringNetwork(this);
            else if (this.network.energy) this.light.intensity = 1.3;
            let p = new Pole(this.position.result().add(this.cableOffset));
            this.network.addElement(p);

        }
    }
    remove(): void {
        super.remove();
        this.cable?.remove();
    }
    onConnect(): void {
        if (this.network.energy && !this.placing) this.light.intensity = 1.3;
    }
    click() {
        if(this.network.energy){
            new GuiSpeechBubble(player, "I refilled my energy from the power grid.");
            player.energy = 10;
        }
        else {
            new GuiSpeechBubble(player, "The pole has no energy!");
        }
    }
}