const fs = require("fs");
import { Filter, utils } from '@pixi/core';
import type { FilterSystem, RenderTexture, CLEAR_MODES } from '@pixi/core';
import { Assets, Color } from 'pixi.js';
import { Atmosphere } from '../../atmosphere';
import { Camera } from '../../camera';
import { mouse } from '../../game';

let fragment: string = fs.readFileSync(__dirname + '/colorGrade.frag', 'utf8');
let vertex: string = fs.readFileSync(__dirname + '/../lighting/es300.vert', 'utf8');

export class colorGradeFilter extends Filter {
    constructor() {
        super(vertex, fragment);
        this.uniforms.uSaturation = 1.3;
        this.uniforms.uBrightness = .9;
        this.uniforms.uContrast = 1.2;
        this.uniforms.uTintStrength = .8;
        this.uniforms.uTintColor = new Float32Array([1, .4, -.1]);
        this.uniforms.uStrength = 1;
    }

    apply(filterManager: FilterSystem, input: RenderTexture, output: RenderTexture, clear: CLEAR_MODES): void {
        filterManager.applyFilter(this, input, output, clear);
    }

    public set strength(v: number) {
        this.uniforms.uStrength = v;
    }

}
