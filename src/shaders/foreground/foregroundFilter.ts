const fs = require("fs");
import { Filter, utils } from '@pixi/core';
import type { FilterSystem, RenderTexture, CLEAR_MODES } from '@pixi/core';
import { player, worldToScreen } from '../../game';
import { Camera } from '../../camera';
import { Atmosphere } from '../../atmosphere';

let fragment: string = fs.readFileSync(__dirname + '/foreground.frag', 'utf8');

export class ForegroundFilter extends Filter {
    constructor() {
        super(undefined, fragment);
        this.uniforms.uPixelSize = new Float32Array([0, 0]);
        this.uniforms.uPlayerPos = new Float32Array([0, 0]);
        this.uniforms.uAmbient = new Float32Array([0, 0, 0]);
    }

    apply(filterManager: FilterSystem, input: RenderTexture, output: RenderTexture, clear: CLEAR_MODES): void {
        this.uniforms.uPixelSize[0] = 1 / input._frame.width;
        this.uniforms.uPixelSize[1] = 1 / input._frame.height;
        const screenPlayer = worldToScreen(player.position)
        this.uniforms.uPlayerPos[0] = screenPlayer.x / window.innerWidth;
        this.uniforms.uPlayerPos[1] = screenPlayer.y / window.innerHeight;
        //console.log(...this.uniforms.uPlayerPos);
        this.uniforms.uAmbient[0] = Atmosphere.settings.ambientLight.r / 255
        this.uniforms.uAmbient[1] = Atmosphere.settings.ambientLight.g / 255
        this.uniforms.uAmbient[2] = Atmosphere.settings.ambientLight.b / 255


        filterManager.applyFilter(this, input, output, clear);
    }
}
