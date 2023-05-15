const fs = require("fs");
import { Filter, utils } from '@pixi/core';
import type { FilterSystem, RenderTexture, CLEAR_MODES } from '@pixi/core';
import { Assets, Container, DisplayObject } from 'pixi.js';
import { Color } from '../../color';
import { Atmosphere } from '../../atmosphere';
import { Camera } from '../../camera';
import { mouse, player, terrainTick, worldToScreen } from '../..';
import { Vector } from '../../vector';
import { Light } from './light';

let fragment: string = fs.readFileSync(__dirname + '/lighting.frag', 'utf8');
let fragmentAmbient: string = fs.readFileSync(__dirname + '/ambientLighting.frag', 'utf8');
let vertex: string = fs.readFileSync(__dirname + '/es300.vert', 'utf8');

export class LightingFilter extends Filter {
    sprite: Container;
    multColor: Color;
    useLights = false;
    constructor(sprite: Container<DisplayObject>, multColor = new Color(180, 180, 180), useLights = false) {
        super(useLights ? vertex : undefined, useLights ? fragment : fragmentAmbient);

        this.uniforms.uPixelSize = [];
        this.uniforms.uLightPos = [];
        this.uniforms.uAmbient = [];
        this.uniforms.uPixelSize = [];
        this.uniforms.uLightPos = [];
        this.uniforms.uAmbient = [];
        this.uniforms.uLightAngle = [];
        this.uniforms.uLightWidth = [];
        for (let i = 0; i < 16; i++) {

            //this.uniforms.uLights[i] = {position:[screenPos.x / window.innerWidth, screenPos.y / window.innerHeight]};
            this.uniforms[`uLights[${i}].position`] = [.5, .5];
            this.uniforms[`uLights[${i}].color`] = [1, 1, 1];
            for (const prop of ["angle", "range", "width"]) {
                this.uniforms[`uLights[${i}].${prop}`] = 1;
            }
        }

        this.sprite = sprite;
        this.multColor = multColor;
        this.useLights = useLights;
    }

    apply(filterManager: FilterSystem, input: RenderTexture, output: RenderTexture, clear: CLEAR_MODES): void {
        let ambientMult = Atmosphere.settings.ambientLight.mult(this.multColor);
        this.uniforms.uAmbient[0] = ambientMult.r / 255
        this.uniforms.uAmbient[1] = ambientMult.g / 255
        this.uniforms.uAmbient[2] = ambientMult.b / 255

        if (this.useLights) {
            this.uniforms.uPixelSize[0] = 1 / input._frame.width;
            this.uniforms.uPixelSize[1] = 1 / input._frame.height;

            for (let i = 0; i < Light.list.length; i++) {
                const light = Light.list[i];
                let screenPos = worldToScreen(light.position);
                //this.uniforms.uLights[i] = {position:[screenPos.x / window.innerWidth, screenPos.y / window.innerHeight]};
                this.uniforms[`uLights[${i}].position`] = [screenPos.x / window.innerWidth, screenPos.y / window.innerHeight];
                this.uniforms[`uLights[${i}].color`] = [light.color.r / 255, light.color.g / 255, light.color.b / 255];
                for (const prop of ["angle", "range", "width"]) {
                    this.uniforms[`uLights[${i}].${prop}`] = light[prop as keyof Light];
                }
            }

            this.uniforms.lightAmount = Light.list.length;

        }
        //console.log(...this.uniforms.uLightPos);
        filterManager.applyFilter(this, input, output, clear);
    }
}
