import { Container, Graphics, Sprite } from "pixi.js";
import { Color } from "../color";
import { Entity } from "../entity";
import { random, randomInt } from "../utils";
import { Vector } from "../vector";
import { ParticleSystem } from "../particles/particle";
import { DamageableEntity } from "./damageableEntity";
import { Terrain, TerrainManager } from "../terrain";
import { SoundManager } from "../sound";
import { TempLight } from "../shaders/lighting/light";
import { GuiSpeechBubble } from "../gui/gui";
import { DebugDraw } from "../debugDraw";

export class Projectile extends Entity {
    velocity = new Vector(1, 0);
    rotSpeed = 0;
    source: Entity;
    age = 0;
    particles: ParticleSystem;
    constructor(source: Entity, target: Vector, offset?: Vector) {
        //g.beginFill(Color.random().toPixi())
        //g.drawRect(0, 0, 2, 2);
        let graph = new Graphics;
        graph.beginFill(0x555555);
        graph.drawRect(-3, -1, 6, 2);
        let angle = target.result().sub(source.worldCoords(offset ?? new Vector())).toAngle()
        super(graph, source.worldCoords(offset ?? new Vector()), null, -angle);
        this.velocity = Vector.fromAngle(angle).mult(500);
        this.source = source;
        //source.position = new Vector();
        //source.graphics.position.set(0,0)
        //console.log(this.position);
        //this.angle = 0;
        [SoundManager.fx.gunfire, SoundManager.fx.gunfire2, SoundManager.fx.gunfire3][randomInt(0, 2)].play();

        this.particles = new ParticleSystem({ position: this.position.result(), colorTo: new Color(30, 10, 10), emitRate: .8, maxAge: .3 })
    }
    update(dt: number) {
        this.age += dt;
        //console.log(this.age);

        if (this.age > .8) {
            SoundManager.fx.hit.play();
            this.remove();
            return;
        }
        this.velocity.mult(1 - dt * 1);
        this.velocity.y -= dt * 400;
        let angV = this.velocity.result();
        angV.y *= -1;
        this.angle = angV.toAngle();
        this.particles.position = this.position.result();
        this.position.add(this.velocity.result().mult(dt));

        for (const e of DamageableEntity.list) {
            //DebugDraw.drawCircle(e.position.result().add(e.hitboxOffset), e.hitboxSize, "#FFFFFFFF")
            if (this.position.result().sub(e.position.result().add(e.hitboxOffset)).lengthSquared() <= e.hitboxSize * e.hitboxSize && this.source != e) {
                e.damage(2);
                new GuiSpeechBubble(e, "Ouch!", 1);
                this.remove();
                return;
            }
        }
        if (Terrain.testValid(...this.position.result().round().xy())) {
            if (Terrain.getPixel(...this.position.result().round().xy()) != 0) {
                SoundManager.fx.hit.play();
                this.remove();
            }
        }

        this.updatePosition();
        this.queueUpdate();
    }
    remove(): void {
        this.particles.enabled = false;
        new ParticleSystem({ position: this.position.result(), maxAge: .1 })
        new TempLight(this.position.result().add(new Vector(0, 2)), .15, 3);
        super.remove();
    }

    static calcPreaim(shooterPos: Vector, target: DamageableEntity): Vector {
        let dist = shooterPos.result().distance(target.position);
        return target.position.result().add(new Vector(0, dist * .2).add(target.velocity.result().mult(dist / 380)));

    }
}