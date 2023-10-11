import { Graphics, SHAPES, Sprite } from "pixi.js";
import { Color } from "../../color";
import { Entity } from "../../entity";
import { random } from "../../utils";
import { Vector } from "../../vector";
import { Terrain } from "../../terrain";
import { Falling } from "../falling";
import { GuiSpeechBubble } from "../../gui/gui";
import { player } from "../../game";

export class Prop extends Entity {
    constructor(position: Vector, graphics: Sprite, name?: string, interactText?: string) {
        const graph = graphics;
        graph.anchor.set(0.5, 1);
        super(graph, new Vector(position.x, position.y + Terrain.getHeight(Math.round(position.x))), undefined, 0);
        if (name) this.name = name;
        if (interactText) {
            this.hoverable = true;
            this.click = () => {
                new GuiSpeechBubble(player, interactText);
                this.hoverable = false;
            };
        }
    }
}