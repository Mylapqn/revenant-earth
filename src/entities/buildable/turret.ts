import { Sprite, Texture, utils } from "pixi.js";
import { NetworkBuildable, WiringNetwork } from "./network";
import { Drone } from "../enemy/drone/drone";
import { Projectile } from "../projectile";
import { Vector } from "../../vector";
import { zigzag } from "../../utils";
import { Light } from "../../shaders/lighting/light";
import { Entity } from "../../entity";
import { Color } from "../../color";
import { Stamps } from "../../stamp";
import { Terrain, TerrainManager } from "../../terrain";
import { player } from "../../game";
import { GuiSpeechBubble } from "../../gui/gui";

export class Turret extends NetworkBuildable {
    gun: Entity;
    gunPosition = new Vector(0, -21)
    gunLight: Light;
    light: Light;
    name = "Turret";
    cooldown = 0;
    age = 0;
    cableOffset = new Vector(-6, 14);
    running = false;
    culling = true;
    cost = 1000;

    cullExtend = 20;
    constructor() {
        const graph = Sprite.from("buildable/turret/turret-off.png");
        super(graph);
        let gunSprite = Sprite.from("buildable/turret/turret-gun.png")
        gunSprite.anchor.set(.3, .5);
        this.gun = new Entity(gunSprite, this.gunPosition, this);
        this.gun.culling = true;


        //this.gunSprite.scale.set(5,1);
    }
    update(dt: number): void {

        if (this?.network?.energy && !this.placing) {
            this.age += dt;
            this.cooldown = Math.max(0, this.cooldown - dt);
            let closestDrone: Drone;
            let closestDist = 50000;
            for (const drone of Drone.droneList) {
                const dist = this.position.distanceSquared(drone.position)
                if (dist < closestDist) {
                    closestDist = dist;
                    closestDrone = drone;
                }
            }
            if (closestDrone) {
                let worldOrigin = this.worldCoords(this.gunPosition);
                let preaim = Projectile.calcPreaim(worldOrigin, closestDrone)
                let rel = worldOrigin.result().sub(preaim);
                rel.x *= -1;
                this.gun.angle = rel.toAngle();
                if (this.cooldown <= 0) {
                    new Projectile(this, preaim, this.gunPosition);
                    this.cooldown = 1;
                }
            }
            else {
                this.gun.angle = zigzag(this.age * .3) - Math.PI / 2;
            }
            this.gun.update(dt);
        }
        super.update(dt);
    }
    place() {
        super.place();
        Stamps.stamp("foundationSmall", new Vector(this.position.x - 5, this.position.y - 40), { surface: false, useDirtFrom: Terrain.generator, replaceMatching: (r, w) => TerrainManager.isDirt(r) });
        Stamps.stamp("foundationSmall", new Vector(this.position.x + 5, this.position.y - 40), { surface: false, useDirtFrom: Terrain.generator, replaceMatching: (r, w) => TerrainManager.isDirt(r) });

        this.light = new Light(this, new Vector(6, 14), Math.PI / 2, 4, new Color(200, 30, 30), 20, 5);

        if (!this.network)
            new WiringNetwork(this);

        //let p = new Pole(this.position.result().add(this.cableOffset));
        //this.network.addElement(p);
    }
    click() {
        if (this.running) {
            new GuiSpeechBubble(player, "The turret is running properly.");
        }
        else {
            new GuiSpeechBubble(player, "The turret has no energy!");
        }
    }
    onConnect(): void {
        console.log("connected to",this.network);
        
        if (!this.placing && this.network.energy && !this.running) {
            this.graphics.texture = Texture.from("buildable/turret/turret-on.png");
            this.light.color = new Color(30, 200, 60);
            this.gunLight = new Light(this.gun, new Vector(3, 1), Math.PI, .1, new Color(200, 220, 255), 120, 5);
            this.running = true;
        }
    }
}

