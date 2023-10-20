import { AnimatedSprite, Container, Sprite, Texture } from "pixi.js";
import { screenToWorld, mouse } from "../../game";
import { Camera } from "../../camera";
import { Entity } from "../../entity";
import { Terrain, terrainType } from "../../terrain";
import { Vector } from "../../vector";
import { BuildStatus, Buildable } from "./buildable";
import { Cable } from "../passive/cable";
import { Seed } from "../plants/tree/seed";
import { TreeSettings, defaultTreeSettings } from "../plants/tree/treeSettings";
import { GuiLabel } from "../../gui/gui";
import { World } from "../../world";
import { Light } from "../../shaders/lighting/light";
import { Color } from "../../color";
import { randomInt } from "../../utils";

export class Scanner extends Buildable {
    static scanners: Array<Scanner> = []
    graphics: Sprite;
    label: GuiLabel;
    timer = 1;
    name = "";
    light: Light;
    cost = 1000;
    constructor(position: Vector, placeInstantly = false) {
        const graph = new AnimatedSprite([Texture.from("buildable/scanner1.png"), Texture.from("buildable/scanner2.png")]);
        graph.play();
        graph.animationSpeed = 0.01;
        graph.anchor.set(0.5, 1);
        super(graph, position, placeInstantly);
        this.culling = true;
        this.light = new Light(this, new Vector(0.5, 10), -Math.PI / 2, Math.PI * 2, new Color(100, 100, 250), 5, 2);
    }
    update(dt: number): void {
        if (!this.placing) {
            this.timer -= dt;
            if (this.timer <= 0) {
                this.timer = 1;
                let data = World.getDataFrom(this.position.x);
                this.label.content = "*" + this.name + "*<br>" + data.co2.toFixed(0) + "ppm" + "\n" + data.pollution.toFixed(1) + "%"
            }

            if (this.timer % 0.7 < 0.2) {
                this.light.range = 5;
            } else {
                this.light.range = 0;
                this.light.position = new Vector(randomInt(-2, 2), randomInt(8, 12));
            }
        }

        super.update(dt);
    }
    checkValidPlace(adjust = 0): BuildStatus {
        return super.checkValidPlace(adjust);
    }
    place(): void {
        this.label = new GuiLabel(this.position, "Loading data...");
        super.place();
        Scanner.scanners.push(this)
        this.name = Terrain.generator.getBiome(this.position.x).shortName + " #" + Scanner.scanners.length;
    }
    remove(): void {
        this.light.remove();
        super.remove();
    }
}