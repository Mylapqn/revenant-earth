const fs = require("fs");
import { Filter, utils } from '@pixi/core';
import type { FilterSystem, RenderTexture, CLEAR_MODES } from '@pixi/core';
import { Assets, Container, DisplayObject } from 'pixi.js';
import { Color } from '../../color';
import { Atmosphere } from '../../atmosphere';
import { Camera } from '../../camera';
import { mouse, player, terrainTick, worldToScreen } from '../../game';
import { Vector } from '../../vector';
import { Light, Lightmap } from './light';

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
        this.uniforms.uAmbient = [];
        this.uniforms.uLightMap = Lightmap.texture;

        this.sprite = sprite;
        this.multColor = multColor;
        this.useLights = useLights;
    }

    apply(filterManager: FilterSystem, input: RenderTexture, output: RenderTexture, clear: CLEAR_MODES): void {
        let ambientMult = Atmosphere.settings.ambientLight.mult(this.multColor);
        this.uniforms.uAmbient[0] = ambientMult.r / 255
        this.uniforms.uAmbient[1] = ambientMult.g / 255
        this.uniforms.uAmbient[2] = ambientMult.b / 255
        //console.log(...this.uniforms.uLightPos);
        filterManager.applyFilter(this, input, output, clear);
    }
}
