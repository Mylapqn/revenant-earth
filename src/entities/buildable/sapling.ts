import { Container, Sprite } from "pixi.js";
import { screenToWorld, mouse } from "../../game";
import { Camera } from "../../camera";
import { Entity } from "../../entity";
import { Terrain, terrainType } from "../../terrain";
import { Vector } from "../../vector";
import { Buildable } from "./buildable";
import { Cable } from "../passive/cable";
import { Seed } from "../plants/tree/seed";
import { TreeSettings, defaultTreeSettings } from "../plants/tree/treeSettings";
import { Progress } from "../../progress";
import { TutorialPrompt } from "../../gui/gui";

export class Sapling extends Buildable {
    graphics: Sprite;
    settings: TreeSettings;
    constructor(position: Vector, settings: TreeSettings = defaultTreeSettings, placeInstantly = false) {
        const graph = Sprite.from("buildable/sapling.png");
        graph.anchor.set(0.5, 1);
        super(graph, position, placeInstantly);
        this.settings = structuredClone(settings);
    }
    place(): void {
        if (!Progress.plantedSeed) {
            Progress.plantedSeed = true;
            new TutorialPrompt({ content: "You have just *planted a seed*. This seed will eventually grow into a tree, *removing pollution* in a small radius around itself. The seed will require proper soil and moisture, otherwise it will die.<br>Planting seeds and removing pollution is one of your main goals.<br>Press [Space] to dismiss.", keys: [" "] })
        }
        new Seed(this.position, undefined, 0, this.settings);
        super.place();
        this.remove();
    }
}