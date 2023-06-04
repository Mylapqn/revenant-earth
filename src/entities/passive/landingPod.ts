import { Assets, Graphics, Rectangle, SHAPES, Sprite } from "pixi.js";
import { Color } from "../../color";
import { Entity } from "../../entity";
import { random } from "../../utils";
import { Vector } from "../../vector";
import { Light } from "../../shaders/lighting/light";
import { ParticleSystem } from "../../particles/particle";

export class CrashPod extends Entity {
    light: Light;
    intensity = 2;
    particleSystems: ParticleSystem[] = [];
    constructor(position: Vector, parent: Entity = null, angle = 0) {
        const graph = Sprite.from("landing");
        graph.anchor.set(0, 1);
        super(graph, position, parent, angle);
        this.light = new Light(this, new Vector(128, 58), 1.5, 4, new Color(255, 180, 20), 200, this.intensity);
        this.particleSystems.push(new ParticleSystem({ position: this.position.result().add(new Vector(110, 38)), emitRate: .8, colorFrom: new Color(150, 50, 20), colorTo: new Color }));
        this.particleSystems.push(new ParticleSystem({ position: this.position.result().add(new Vector(127, 52)), emitRate: 3 }));
        this.particleSystems.push(new ParticleSystem({ position: this.position.result().add(new Vector(185, 30)) }));
        this.name = "Landing Pod"
        this.hoverable = true;
    }
    update(dt: number): void {
        super.update(dt);
        for (const ps of this.particleSystems) {
            ps.emitRate *= (1 - dt / 50)
            ps.emitRate -= dt / 70;
        }
        this.intensity = Math.max(2, Math.min(5, this.intensity + random(-10, 10) * dt));
        this.light.intensity = this.intensity;
        this.queueUpdate()
    }
    set hoverable(val: boolean) {
        this.graphics.hitArea = new Rectangle((this.graphics.width / 2)-20, -(this.graphics.height / 2)-20, 100, 40);
        super.hoverable = val;
    }
}