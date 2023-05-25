import { AnimatedSprite, Container, Sprite, Texture } from "pixi.js";
import { screenToWorld, mouse } from "../../game";
import { Camera } from "../../camera";
import { Entity } from "../../entity";
import { Terrain, terrainType } from "../../terrain";
import { Vector } from "../../vector";
import { Buildable } from "./buildable";
import { Cable } from "../passive/cable";
import { Seed } from "../plants/tree/seed";
import { TreeSettings, defaultTreeSettings } from "../plants/tree/treeSettings";
import { GuiLabel } from "../../gui/gui";
import { World } from "../../world";

export class Scanner extends Buildable {
    static scanners: Array<Scanner> = []
    graphics: Sprite;
    label: GuiLabel;
    timer = 1;
    name = ""
    constructor(position: Vector, placeInstantly = false) {
        const graph = new AnimatedSprite([Texture.from("buildable/scanner1.png"), Texture.from("buildable/scanner2.png")]);
        graph.play();
        graph.animationSpeed = 0.01;
        graph.anchor.set(0.5, 1);
        super(graph, position, placeInstantly);
    }
    update(dt: number): void {
        if (!this.placing) {
            this.timer -= dt;
            if (this.timer <= 0) {
                this.timer = 1;
                let data = World.getDataFrom(this.position.x);
                this.label.content = this.name + "\n" + data.co2.toFixed(0) + "ppm" + "\n" + data.pollution.toFixed(1) + "%"
            }
        }

        super.update(dt);
    }
    checkValidPlace(): boolean {
        return super.checkValidPlace();
    }
    place(): void {
        this.label = new GuiLabel(this.position, "Loading data...");
        super.place();
        Scanner.scanners.push(this)
        this.name = Terrain.generator.getBiome(this.position.x).shortName + " #" + Scanner.scanners.length;
    }
}