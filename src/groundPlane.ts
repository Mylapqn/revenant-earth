
const fs = require("fs");
import { DRAW_MODES, FORMATS, Filter, Geometry, Mesh, RenderTexture, Shader, Sprite, TYPES, Texture } from "pixi.js";
import { Camera } from "./camera";
import { background, entityRender, terrainTick } from "./game";
import { Atmosphere } from "./atmosphere";
import { Light, Lightmap } from "./shaders/lighting/light";
import { Color } from "./color";
import { Vector } from "./vector";

let fragment: string = fs.readFileSync(__dirname + '/shaders/groundPlane/groundPlane.frag', 'utf8');
let vertex: string = fs.readFileSync(__dirname + '/shaders/groundPlane/groundPlane.vert', 'utf8');


export class GroundPlane {
    static array: Uint8Array;
    static graphic: Mesh;
    static uniforms: { terrain: Texture, viewport: [number, number, number, number], render: RenderTexture, };
    static init() {
        this.array = new Uint8Array(Camera.width * Camera.height);
        this.array.fill(255);

        this.uniforms = {
            terrain: null,
            viewport: [0, 0, 0, 0],
            render: background,
        }
        const material = Shader.from(vertex, fragment, this.uniforms)
        const geometry = new Geometry()
        geometry.addIndex([0, 1, 2, 0, 2, 3])
        geometry.addAttribute('aVertexPosition', // the attribute name
            [
                -1, 0, 1,
                1, 0, 1,
                1, 1, 1,
                0, 1, 1,
            ], // x, y
            2);
        geometry.addAttribute('aTextureCoord', // the attribute name
            [0, 0, 1, 0, 1, 1, 0, 1], // x, y 
            2)
        this.graphic = new Mesh(geometry, material) as any;
        this.resize();
    }

    static resize() {
        this.array = new Uint8Array(Camera.width * Camera.height);
        const geometry = new Geometry();
        const useWidth = Math.ceil((Camera.width) / 4) * 4;
        geometry.addIndex([0, 1, 2, 0, 2, 3])
        geometry.addAttribute('aVertexPosition', // the attribute name
            [0, 0, useWidth, 0, useWidth, Camera.height, 0, Camera.height], // x, y
            2);
        geometry.addAttribute('aaVertexPosition', // the attribute name
            [
                -useWidth / 4 - Camera.position.x + 2300, Camera.height * 1.25 + Camera.position.y - 300,
                useWidth + useWidth / 4 - Camera.position.x + 2300, Camera.height * 1.25 + Camera.position.y - 300,
                useWidth, Camera.height * .75 + Camera.position.y - 300,
                0, Camera.height * .75 + Camera.position.y - 300
            ], // x, y
            2);
        geometry.addAttribute('aTextureCoord', // the attribute name
            [0, 0, 1, 0, 1, 1, 0, 1], // x, y 
            2)
        this.graphic.geometry = geometry;
    }

    static setPixels(buffer: Uint8Array) {
        this.array = buffer;
        this.uniforms.terrain = Texture.fromBuffer(this.array, this.array.length / Camera.height, Camera.height, { format: FORMATS.ALPHA });
    }

/**
 * Updates the rendering properties of the GroundPlane.
 * Recalculates the `useWidth` based on the current Camera width,
 * resizes the geometry, and updates the `render` and `viewport`
 * uniforms with the current background and camera position.
 */
    static update() {
        this.uniforms.terrain.update();
        const useWidth = Math.ceil((Camera.width) / 4) * 4;
        this.resize();
        this.uniforms.render = background;
        this.uniforms.viewport = [...Camera.position.xy(), useWidth, Camera.height];
    }
}