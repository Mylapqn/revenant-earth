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
        this.uniforms.uStrength = 1;
    }

    apply(filterManager: FilterSystem, input: RenderTexture, output: RenderTexture, clear: CLEAR_MODES): void {
        filterManager.applyFilter(this, input, output, clear);
    }
    
    public set strength(v : number) {
        this.uniforms.uStrength = v;
    }
    
}
