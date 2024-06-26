import { AnimatedSprite, Container, Sprite } from "pixi.js";
import { screenToWorld, mouse, player, terrainTick } from "../../game";
import { Camera } from "../../camera";
import { Entity } from "../../entity";
import { Terrain, TerrainManager, terrainType } from "../../terrain";
import { Vector } from "../../vector";
import { BuildStatus, Buildable } from "./buildable";
import { Cable } from "../passive/cable";
import { Light } from "../../shaders/lighting/light";
import { Color } from "../../color";
import { random, randomInt } from "../../utils";
import { Stamps } from "../../stamp";
import { Pole } from "./pole";
import { GuiSpeechBubble } from "../../gui/gui";
import { NetworkBuildable, WiringNetwork } from "./network";

export class Turbine extends NetworkBuildable {
    network: WiringNetwork;
    connected: boolean;
    providesEnergy = true;
    graphics: AnimatedSprite;
    cable: Cable;
    light: Light;
    cableOffset = new Vector(3, 55);
    cost = 2000;
    constructor(position: Vector, cable = true, placeInstantly = false) {
        const graph = AnimatedSprite.fromFrames([
            "buildable/turbine/turbine1.png",
            "buildable/turbine/turbine2.png",
            "buildable/turbine/turbine3.png",
            "buildable/turbine/turbine4.png",
        ]);

        graph.anchor.set(0.5, 1);
        graph.animationSpeed = .2;
        graph.currentFrame = randomInt(0, 3);
        super(graph, position, placeInstantly);
        this.culling = true;
        if (cable) {
            this.cable = new Cable(position.result().add(this.cableOffset), position, 200);
            this.cable.graphics.alpha = this.graphics.alpha;
        }
        this.name = "Wind turbine";
    }
    update(dt: number): void {
        super.update(dt);
        if (this.removed) return;
        if (this.placing) {
            if (this.cable) {
                this.cable.setEndpoints(undefined, this.position.result().add(this.cableOffset));
                this.cable.graphics.tint = this.graphics.tint;
            }
        }
    }
    checkValidPlace(adjust = 0): BuildStatus {
        if (this.cable?.targetLength > this.cable?.length) return { valid: false, message: "cable too long" };
        if(this.position.y < 470)return { valid: false, message: "turbines need high ground!" }
        return super.checkValidPlace(adjust);
    }
    place() {
        this.graphics.play();
        super.place();
        Stamps.stamp("foundationSmall", new Vector(this.position.x - 5, this.position.y - 40), { surface: false, useDirtFrom: Terrain.generator, replaceMatching: (r, w) => TerrainManager.isDirt(r) });
        Stamps.stamp("foundationSmall", new Vector(this.position.x + 5, this.position.y - 40), { surface: false, useDirtFrom: Terrain.generator, replaceMatching: (r, w) => TerrainManager.isDirt(r) });
        if (this.cable) {
            this.cable.graphics.tint = this.graphics.tint;
            this.cable.graphics.alpha = this.graphics.alpha;
        }

        this.light = new Light(this, new Vector(0, this.graphics.height - 76), Math.PI / 2, .8, new Color(180, 200, 200), 100, 1.5);
        if (!this.network)
            new WiringNetwork(this);
        let p = new Pole(this.position.result().add(this.cableOffset));
        this.network.addElement(p);
    }
    remove(): void {
        super.remove();
        this.cable?.remove();
    }
    click() {
        new GuiSpeechBubble(player, "I refilled my energy from the turbine.");
        player.energy = 10;
    }
}