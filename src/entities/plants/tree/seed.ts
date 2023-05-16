import { Rectangle, Sprite } from "pixi.js";
import { Entity } from "../../../entity";
import { Vector } from "../../../vector";
import { Root } from "./root";
import { Branch } from "./branch";
import { random } from "../../../utils";
import { debugPrint } from "../../..";
import { coniferousSettings, defaultTreeSettings, TreeSettings } from "./treeSettings";
import { GuiButton, GuiLabel, GuiTooltip } from "../../../gui/gui";
import { OutlineFilter } from "@pixi/filter-outline";
import { Camera } from "../../../camera";
import { World } from "../../../world";


export class Seed extends Entity {
    age = 0;
    energy = 100;
    branch: Branch;
    l = 0;
    b = 0;
    settings: TreeSettings;
    label: GuiLabel;
    constructor(position: Vector, parent?: Entity, angle = 0, settings = defaultTreeSettings) {

        const graph = Sprite.from("seed.png")
        //console.log(graph);
        graph.anchor.set(0.5);
        super(graph, position, parent, angle);
        this.hoverable = true;
        this.settings = settings;        
        this.label = new GuiLabel(position.result().add(new Vector(0,20)),settings.name);
        this.label.addChild(new GuiButton(new Vector(100,100),"remobe 💀",()=>{this.remove();}));
        this.culling = true;
    }

    update(dt: number) {
        //debugPrint("L: " + this.l);
        //debugPrint("B: " + this.b);
        this.energy += 1;
        super.update(dt);
        if (this.age == 0) {
            new Root(new Vector(0, 0), this, this, Math.PI);
            this.branch = new Branch(new Vector(0, 0), this, this, 0, this.settings);
            this.branch.main = true;
        }
        this.age++;
        if (this.energy > 0) {
            this.branch.energy += this.energy;
            this.energy = 0;
        }

        if (true) {
            let data = World.getDataFrom(this.position.x);
            
            if (data.pollution > 0) data.pollution = 0.01;
            if (data.co2 > 200) data.co2 = 0.1;

            World.takeAt(this.position.x, data);
        }

        //if (this.age > 500) return;
        //this.graphics.scale.set(this.age / 500);
        this.queueUpdate();
        if (this.energy > 0) {
            //this.energy--;
        }
    }
    remove(): void {
        this.branch.remove();
        this.label.remove();
        super.remove();
    }
}