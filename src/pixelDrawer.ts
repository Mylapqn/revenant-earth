
const fs = require("fs");
import { DRAW_MODES, FORMATS, Filter, Geometry, Mesh, RenderTexture, Shader, Sprite, TYPES, Texture } from "pixi.js";
import { Camera } from "./camera";
import { background, terrainTick } from ".";
import { Atmosphere } from "./atmosphere";

let fragment: string = fs.readFileSync(__dirname + '/shaders/terrain/terrain.frag', 'utf8');
let vertex: string = fs.readFileSync(__dirname + '/shaders/terrain/terrain.vert', 'utf8');


export class PixelDrawer {
    static array: Uint8Array;
    static graphic: Mesh;
    static uniforms: { terrain: Texture, colorMap: Texture, tick: number, viewport: [number, number, number, number], render: RenderTexture, sunPos: [number, number], sunStrength: number };
    static init() {
        this.array = new Uint8Array(Camera.width * Camera.height);
        this.array.fill(255);

        this.uniforms = {
            terrain: null,
            colorMap: Texture.from("output.png"),
            tick: terrainTick,
            viewport: [0, 0, 0, 0],
            render: background,
            sunPos: [0, 0],
            sunStrength: 0,
        }
        const material = Shader.from(vertex, fragment, this.uniforms)
        const geometry = new Geometry()
        geometry.addIndex([0, 1, 2, 0, 2, 3])
        geometry.addAttribute('aVertexPosition', // the attribute name
            [0, 0, Camera.width, 0, Camera.width, Camera.height, 0, Camera.height], // x, y
            2);
        geometry.addAttribute('aTextureCoord', // the attribute name
            [0, 0, 1, 0, 1, 1, 0, 1], // x, y 
            2)
        this.graphic = new Mesh(geometry, material) as any;
        this.resize();
    }

    static setPixels(buffer: Uint8Array) {
        this.array = buffer;
        this.uniforms.terrain = Texture.fromBuffer(this.array, this.array.length / Camera.height, Camera.height, { format: FORMATS.ALPHA });
    }

    static resize() {
        this.array = new Uint8Array(Camera.width * Camera.height);
        const geometry = new Geometry();
        const useWidth = Math.ceil((Camera.width) / 4) * 4;
        geometry.addIndex([0, 1, 2, 0, 2, 3])
        geometry.addAttribute('aVertexPosition', // the attribute name
            [0, 0, useWidth, 0, useWidth, Camera.height, 0, Camera.height], // x, y
            2);
        geometry.addAttribute('aTextureCoord', // the attribute name
            [0, 0, 1, 0, 1, 1, 0, 1], // x, y 
            2)
        this.graphic.geometry = geometry;
    }

    static update() {
        const useWidth = Math.ceil((Camera.width) / 4) * 4;

        this.uniforms.terrain.update();
        this.uniforms.tick = terrainTick;
        this.uniforms.render = background;
        this.uniforms.viewport = [...Camera.position.xy(), useWidth, Camera.height];
        this.uniforms.sunPos = [Atmosphere.settings.sunPosition.x / Camera.width, Atmosphere.settings.sunPosition.y / Camera.height];
        this.uniforms.sunStrength = Atmosphere.settings.sunIntensity;

    }
}