import { BLEND_MODES, Container, DisplayObject, Sprite } from "pixi.js";
import { Entity } from "../../entity";
import { Vector } from "../../vector";
import { mouse, player, preferences, screenToWorld } from "../../game";
import { Terrain, terrainType } from "../../terrain";
import { Camera } from "../../camera";
import { GuiTooltip } from "../../gui/gui";

export class Buildable extends Entity {
    static graphic: Container;
    static placeCooldown = 0;
    static currentBuildable: Buildable;
    placing = true;
    validPlace = false;
    graphics: Sprite;
    constructor(graphics: Sprite, position = player.position.result(), placeInstantly = false) {
        const graph = graphics;
        graph.anchor.set(0.5, 1);
        super(graph, position, Buildable.graphic);
        this.placing = !placeInstantly;
        if (this.placing) {
            this.tooltip = new GuiTooltip("placing");
            Buildable.currentBuildable = this;
            preferences.selectedTerrainType = 0;
            graph.tint = 0x00FF00
            graph.alpha = .4;
        }
        else this.place();
    }
    update(dt: number): void {
        if (this.placing) {
            this.position = screenToWorld(mouse);

            this.validPlace = this.checkValidPlace();
            if (this.validPlace) {
                this.tooltip.content = "Ready to place";
                this.graphics.tint = 0x00FF00;
                if (mouse.pressed == 1) this.place();
            }
            else {
                this.tooltip.content = "Cannot place";
                this.graphics.tint = 0xFF0000
            };
            if (mouse.pressed == 2) this.remove();
        }
        this.updatePosition();
        this.queueUpdate();
        if (this.culling) this.cullDisplay();
    }
    place() {
        if (Buildable.currentBuildable == this) Buildable.currentBuildable = null;
        this.tooltip?.remove();
        Buildable.placeCooldown = .2;
        this.placing = false;
        Buildable.graphic.removeChild(this.graphics);
        Entity.graphic.addChild(this.graphics);
        this.graphics.tint = 0xffffff;
        this.graphics.alpha = 1;
    }
    remove(): void {
        if (Buildable.currentBuildable == this) Buildable.currentBuildable = null;
        super.remove();
    }

    checkOffset = 0;
    checkValidPlace(adjust = 0): boolean {
        //console.log(adjust);
        if(adjust == 0) this.checkOffset = 0;
        if (Buildable.placeCooldown != 0 || adjust > 20) return false;
        let grounded = 0;
        for (let x = 0; x < this.graphics.width; x++) {
            for (let y = 0; y < this.graphics.height; y++) {
                const t = Terrain.getPixel(Math.round(this.position.x + x - this.graphics.width / 2), Math.round(this.position.y + y+this.checkOffset));
                if (y > 4) {
                    if (t != terrainType.void) {
                        this.checkOffset++;
                        return this.checkValidPlace(adjust + 1);
                    }
                } else {
                    if (t != terrainType.void) grounded++;
                }
            }
        }
        if (grounded > this.graphics.width){
            this.position.y+=this.checkOffset;
            return true
        }
        this.checkOffset--;
        return this.checkValidPlace(adjust + 1);
    }
    static update(dt: number) {
        this.placeCooldown = Math.max(0, this.placeCooldown - dt);
        const cam = Camera.position.result();
        this.graphic.position.set(-cam.x, Camera.height + cam.y);
    }
}