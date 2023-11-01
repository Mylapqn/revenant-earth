const fs = require("fs");
import { BaseRenderTexture, Geometry, Mesh, RenderTexture, Shader, Sprite, TYPES, Texture } from "pixi.js";
import { Color } from "../../color";
import { Entity } from "../../entity";
import { Vector } from "../../vector";
import { Camera } from "../../camera";
import { app, worldToRender } from "../../game";
import { PixelDrawer } from "../../pixelDrawer";
import { clamp } from "../../utils";
import { Atmosphere } from "../../atmosphere";
import { GuiLabel } from "../../gui/gui";
import { DebugDraw } from "../../debugDraw";

export class TempLight extends Entity {
    light: Light;
    intensity: number;
    maxAge: number;
    age = 0;
    constructor(position: Vector, duration = 3, intensity = 1) {
        super(Sprite.from("empty.png"), position);

        this.light = new Light(this, new Vector(), 0, 8, new Color(255, 180, 30), 30 * intensity, intensity)
        this.intensity = intensity;
        this.maxAge = duration;
        this.updatePosition();
    }
    update(dt: number): void {
        //console.log(this.graphics.position);

        this.age += dt;
        this.light.intensity = this.intensity * (1 - (this.age / this.maxAge));
        if (this.age > this.maxAge) {
            this.remove();
        }
        else {
            this.queueUpdate();
        }
    }
    remove() {
        this.light.remove();
        super.remove();
    }
}

export class Light {
    static maxAmount = 16;
    private _position = new Vector();
    width = 1;
    private _angle: number;
    range = 100;
    color = new Color(255, 100, 255);
    parent: Entity;
    private _intensity = 1;
    constructor(parent: Entity = null, position: Vector, angle = 0, width = 1, color = new Color(255, 255, 255), range = 100, intensity = 1) {

        this._position = position;
        this._angle = angle;
        this.width = width
        this.range = range;
        this.color = color.copy();
        this.parent = parent;
        this._intensity = intensity;
        //console.log(this);
        Light.list.push(this);
    }

    public get angle(): number {
        if (!this.parent || this.parent.removed) return this._angle;
        if (this.parent.graphics.scale.x < 0) return Math.PI - (this._angle) + this.parent.angle;
        return this._angle + this.parent.angle;
    }
    public get position(): Vector {
        if (!this.parent) return this._position;
        return this.parent.worldCoords(new Vector(this._position.x, -this._position.y));
    }
    public set angle(angle) {
        this._angle = angle;
    }
    public set position(position) {
        this._position = position;
    }
    public set intensity(intensity) {
        this._intensity = intensity;
    }
    public get intensity() {
        let a = Atmosphere.settings.ambientLight
        let ambientIntensity = (a.r + a.g + a.b) / 765;

        return this._intensity * clamp(1 - ambientIntensity, .1, 1);
    }

    remove() {
        Light.list.splice(Light.list.indexOf(this), 1);
    }

    static list: Light[] = [];
}


export class Lightmap {
    static fragment: string = fs.readFileSync(__dirname + '/lightmap.frag', 'utf8');
    static vertex: string = fs.readFileSync(__dirname + '/lightmap.vert', 'utf8');
    static texture = new RenderTexture(new BaseRenderTexture({ type: TYPES.FLOAT, width: Camera.width, height: Camera.height }));
    static graphic: Mesh;
    static uniforms: {
        uPixelSize: any,
        lightAmount: number; viewport: [number, number, number, number],
        shadowMap: RenderTexture,
    };
    static init() {
        Shadowmap.init();
        this.uniforms = {
            viewport: [0, 0, 0, 0],
            uPixelSize: [0, 0],
            lightAmount: 0,
            shadowMap: Shadowmap.texture
        }
        for (let i = 0; i < Light.maxAmount; i++) {

            //this.uniforms.uLights[i] = {position:[screenPos.x / window.innerWidth, screenPos.y / window.innerHeight]};
            (this.uniforms as any)[`uLights[${i}].position`] = [.5, .5];
            (this.uniforms as any)[`uLights[${i}].color`] = [1, 1, 1];
            for (const prop of ["angle", "range", "width", "intensity"]) {
                (this.uniforms as any)[`uLights[${i}].${prop}`] = .1;
            }
        }
        const material = Shader.from(this.vertex, this.fragment, this.uniforms)
        const geometry = new Geometry()
        geometry.addIndex([0, 1, 2, 0, 2, 3])
        geometry.addAttribute('aVertexPosition', // the attribute name
            [0, 0, Camera.width, 0, Camera.width, Camera.height, 0, Camera.height], // x, y
            2);
        geometry.addAttribute('aTextureCoord', // the attribute name
            [0, 0, 1, 0, 1, 1, 0, 1], // x, y 
            2)
        this.graphic = new Mesh(geometry, material) as any;

    }

    static update() {
        Shadowmap.update();
        this.uniforms.shadowMap.update();
        this.uniforms.uPixelSize[0] = 1 / Camera.width;
        this.uniforms.uPixelSize[1] = 1 / Camera.height;

        let index = 0;
        for (let i = 0; i < Light.list.length; i++) {
            const light = Light.list[i];
            if (!light.parent.graphics.visible) continue;
            DebugDraw.drawCircle(light.position, 10, 0xFFFF00);
            DebugDraw.drawText(light.position, "light index " + index);
            let screenPos = worldToRender(light.position);
            //this.uniforms.uLights[i] = {position:[screenPos.x / window.innerWidth, screenPos.y / window.innerHeight]};
            (this.uniforms as any)[`uLights[${index}].position`] = [screenPos.x / window.innerWidth, screenPos.y / window.innerHeight];
            (this.uniforms as any)[`uLights[${index}].color`] = [light.color.r / 255, light.color.g / 255, light.color.b / 255];
            for (const prop of ["angle", "range", "width", "intensity"]) {
                (this.uniforms as any)[`uLights[${index}].${prop}`] = light[prop as keyof Light];
            }
            index++;
        }

        for (let i = index; i < Light.maxAmount; i++) {
            (this.uniforms as any)[`uLights[${i}].range`] = 0;
        }
        this.uniforms.lightAmount = Light.list.length;
        const useWidth = Math.ceil((Camera.width) / 4) * 4;
        this.uniforms.viewport = [...Camera.position.xy(), useWidth, Camera.height];
    }
}

export class Shadowmap {
    static angles = 512;
    static fragment: string = fs.readFileSync(__dirname + '/shadowmap.frag', 'utf8');
    static vertex: string = fs.readFileSync(__dirname + '/lightmap.vert', 'utf8');
    static texture = new RenderTexture(new BaseRenderTexture({ type: TYPES.FLOAT, width: this.angles, height: Light.maxAmount }));
    static graphic: Mesh;
    static uniforms: {
        uPixelSize: any;
        lightAmount: number; viewport: [number, number, number, number],
        occluder: Texture;
    };
    static init() {

        this.uniforms = {
            viewport: [0, 0, 0, 0],
            uPixelSize: [0, 0],
            lightAmount: 0,
            occluder: null
        }
        for (let i = 0; i < 16; i++) {

            //this.uniforms.uLights[i] = {position:[screenPos.x / window.innerWidth, screenPos.y / window.innerHeight]};
            (this.uniforms as any)[`uLights[${i}].position`] = [.5, .5];
            (this.uniforms as any)[`uLights[${i}].color`] = [1, 1, 1];
            for (const prop of ["angle", "range", "width", "intensity"]) {
                (this.uniforms as any)[`uLights[${i}].${prop}`] = .1;
            }
        }
        const material = Shader.from(this.vertex, this.fragment, this.uniforms)
        const geometry = new Geometry()
        geometry.addIndex([0, 1, 2, 0, 2, 3])
        geometry.addAttribute('aVertexPosition', // the attribute name
            [0, 0, this.angles, 0, this.angles, Light.maxAmount, 0, Light.maxAmount], // x, y
            2);
        geometry.addAttribute('aTextureCoord', // the attribute name
            [0, 0, 1, 0, 1, 1, 0, 1], // x, y 
            2)
        this.graphic = new Mesh(geometry, material) as any;
    }



    static update() {
        this.uniforms.uPixelSize[0] = 1 / Camera.width;
        this.uniforms.uPixelSize[1] = 1 / Camera.height;

        let index = 0;
        for (let i = 0; i < Light.list.length; i++) {
            const light = Light.list[i];
            if (!light.parent.graphics.visible) continue;
            let screenPos = worldToRender(light.position);
            //this.uniforms.uLights[i] = {position:[screenPos.x / window.innerWidth, screenPos.y / window.innerHeight]};
            (this.uniforms as any)[`uLights[${index}].position`] = [screenPos.x / window.innerWidth, screenPos.y / window.innerHeight];
            (this.uniforms as any)[`uLights[${index}].color`] = [light.color.r / 255, light.color.g / 255, light.color.b / 255];
            for (const prop of ["angle", "range", "width", "intensity"]) {
                (this.uniforms as any)[`uLights[${index}].${prop}`] = light[prop as keyof Light];
            }
            index++;
        }

        for (let i = index; i < Light.maxAmount; i++) {
            (this.uniforms as any)[`uLights[${i}].range`] = 0;
        }

        this.uniforms.lightAmount = Light.list.length;
        const useWidth = Math.ceil((Camera.width) / 4) * 4;
        this.uniforms.viewport = [...Camera.position.xy(), useWidth, Camera.height];
        this.uniforms.occluder = PixelDrawer.uniforms.terrain;
        app.renderer.render(this.graphic, { renderTexture: this.texture, clear: true });
    }
}
