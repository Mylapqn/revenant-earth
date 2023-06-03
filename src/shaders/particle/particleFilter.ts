const fs = require("fs");
import { Filter } from '@pixi/core';
import type { FilterSystem, RenderTexture, CLEAR_MODES } from '@pixi/core';
import { player, worldToRender } from '../../game';
import { Atmosphere } from '../../atmosphere';
import { Color } from '../../color';

let fragment: string = fs.readFileSync(__dirname + '/particle.frag', 'utf8');
let vertex: string = fs.readFileSync(__dirname + '/../lighting/es300.vert', 'utf8');

export class ParticleFilter extends Filter {
    constructor(from=new Color(255,255,200),to=new Color(255,50,0)) {
        super(vertex, fragment);
        this.uniforms.uPixelSize = new Float32Array([0, 0]);
        this.uniforms.uFromColor = from.toShader();
        this.uniforms.uToColor = to.toShader();
    }

    apply(filterManager: FilterSystem, input: RenderTexture, output: RenderTexture, clear: CLEAR_MODES): void {
        this.uniforms.uPixelSize[0] = 1 / input._frame.width;
        this.uniforms.uPixelSize[1] = 1 / input._frame.height;


        filterManager.applyFilter(this, input, output, clear);
    }
}
