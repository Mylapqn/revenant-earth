import { Container, Sprite } from "pixi.js";
import { screenToWorld, mouse } from "../..";
import { Camera } from "../../camera";
import { Entity } from "../../entity";
import { Terrain, terrainType } from "../../terrain";
import { Vector } from "../../vector";
import { Buildable } from "./buildable";
import { Cable } from "../passive/cable";
import { Seed } from "../plants/tree/seed";
import { TreeSettings, defaultTreeSettings } from "../plants/tree/treeSettings";

export class Sapling extends Buildable {
    graphics: Sprite;
    settings: TreeSettings;
    constructor(position: Vector, settings: TreeSettings = defaultTreeSettings, placeInstantly = false) {
        const graph = Sprite.from("buildable/sapling.png");
        graph.anchor.set(0.5, 1);
        super(graph, position, placeInstantly);
        this.settings = structuredClone(settings);
    }
    update(dt: number): void {
        super.update(dt);
    }
    checkValidPlace(): boolean {
        return super.checkValidPlace();
    }
    place(): void {
        new Seed(this.position, undefined, 0, this.settings);
        super.place();
        this.remove();
    }
}