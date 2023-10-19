const fs = require("fs");
import { Filter } from '@pixi/core';
import type { FilterSystem, RenderTexture, CLEAR_MODES } from '@pixi/core';
import { player, worldToRender } from '../../game';
import { Atmosphere } from '../../atmosphere';
import { Color } from '../../color';
import { Lightmap } from '../lighting/light';

let fragment: string = fs.readFileSync(__dirname + '/particle.frag', 'utf8');
let vertex: string = fs.readFileSync(__dirname + '/../lighting/es300.vert', 'utf8');

export class ParticleFilter extends Filter {
    constructor(from = new Color(255, 255, 200), to = new Color(255, 50, 0), lit = false) {
        super(vertex, fragment);
        this.uniforms.uPixelSize = new Float32Array([0, 0]);
        this.uniforms.uFromColor = from.toShader();
        this.uniforms.uToColor = to.toShader();
        this.uniforms.lit = lit
        if (lit) this.uniforms.uLightMap = Lightmap.texture;
        this.uniforms.uAmbient = new Float32Array([0, 0, 0]);
    }

    apply(filterManager: FilterSystem, input: RenderTexture, output: RenderTexture, clear: CLEAR_MODES): void {
        this.uniforms.uPixelSize[0] = 1 / input._frame.width;
        this.uniforms.uPixelSize[1] = 1 / input._frame.height;

        let ambient = Atmosphere.settings.ambientLight;
        this.uniforms.uAmbient[0] = ambient.r / 255
        this.uniforms.uAmbient[1] = ambient.g / 255
        this.uniforms.uAmbient[2] = ambient.b / 255

        filterManager.applyFilter(this, input, output, clear);
    }
}
