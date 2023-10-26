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

export class Oxygenator extends NetworkBuildable {
    network: WiringNetwork;
    connected: boolean;
    providesOxygen = true;
    running = false;
    graphics: AnimatedSprite;
    cable: Cable;
    light: Light;
    onGraph: AnimatedSprite;
    cableOffset = new Vector(4, 29);
    cost = 10000;
    constructor(position: Vector, cable = true, placeInstantly = false) {
        const graph = AnimatedSprite.fromFrames([
            "buildable/oxygenator/oxygenator-off.png",
        ]);

        super(graph, position, placeInstantly);
        this.onGraph = AnimatedSprite.fromFrames([
            "buildable/oxygenator/oxygenator1.png",
            "buildable/oxygenator/oxygenator2.png",
            "buildable/oxygenator/oxygenator3.png",
            "buildable/oxygenator/oxygenator4.png",
        ]);
        this.onGraph.anchor.set(0.5, 1);
        this.onGraph.animationSpeed = .2;
        this.onGraph.currentFrame = randomInt(0, 3);

        this.culling = true;
        if (cable) {
            this.cable = new Cable(position.result().add(new Vector(3, 20)), position, 200);
            this.cable.graphics.alpha = this.graphics.alpha;
        }
        this.name = "Oxygen extractor";
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
    checkValidPlace(adjust = 0): BuildStatus {
        if (this.cable?.targetLength > this.cable?.length) return { valid: false, message: "cable too long" };
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

        this.light = new Light(this, new Vector(-4, this.graphics.height - 3), Math.PI / 2, 4, new Color(200, 30, 30), 20, 5);
        if (!this.network)
            new WiringNetwork(this);
        //let p = new Pole(this.position.result().add(this.cableOffset));
        //this.network.addElement(p);
    }
    remove(): void {
        super.remove();
        this.cable?.remove();
    }
    click() {
        if (this.running) {
            new GuiSpeechBubble(player, "I refilled my oxygen from the extractor.");
            player.oxygen = 10;
        }
        else {
            new GuiSpeechBubble(player, "The extractor has no energy!");
        }
    }
    onConnect(): void {
        if (!this.placing && !this.running && this.network.energy) {
            this.graphics.textures = this.onGraph.textures;
            this.graphics.play();
            this.light.color = new Color(30, 200, 60);
            this.graphics.animationSpeed = .2;
            this.running = true
        }
    }
}