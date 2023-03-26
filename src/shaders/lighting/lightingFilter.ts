const fs = require("fs");
import { Filter, utils } from '@pixi/core';
import type { FilterSystem, RenderTexture, CLEAR_MODES } from '@pixi/core';
import { Assets, Color } from 'pixi.js';
import { Atmosphere } from '../../atmosphere';
import { Camera } from '../../camera';
import { mouse } from '../..';

let fragment: string = fs.readFileSync(__dirname + '/lighting.frag', 'utf8');

export class LightingFilter extends Filter {
    constructor() {
        super(undefined, fragment);
        this.uniforms.uPixelSize = new Float32Array([0, 0]);
        this.uniforms.uLightPos = new Float32Array([0, 0]);
    }

    apply(filterManager: FilterSystem, input: RenderTexture, output: RenderTexture, clear: CLEAR_MODES): void {
        this.uniforms.uPixelSize[0] = 1 / input._frame.width;
        this.uniforms.uPixelSize[1] = 1 / input._frame.height;
        this.uniforms.uLightPos[0] = mouse.x/window.innerWidth;
        this.uniforms.uLightPos[1] = mouse.y / window.innerHeight;
        filterManager.applyFilter(this, input, output, clear);
    }
}
