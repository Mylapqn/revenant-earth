const fs = require("fs");
import { Filter, utils } from '@pixi/core';
import type { FilterSystem, RenderTexture, CLEAR_MODES } from '@pixi/core';
import { Assets, Color, Container, DisplayObject } from 'pixi.js';
import { Atmosphere } from '../../atmosphere';
import { Camera } from '../../camera';
import { mouse, player, worldToScreen } from '../..';

let fragment: string = fs.readFileSync(__dirname + '/lighting.frag', 'utf8');

export class LightingFilter extends Filter {
    sprite:Container;
    constructor(sprite: Container<DisplayObject>) {
        super(undefined, fragment);
        this.sprite = sprite;
        this.uniforms.uPixelSize = new Float32Array([0, 0]);
        this.uniforms.uLightPos = new Float32Array([0, 0]);
        this.uniforms.uAmbient = new Float32Array([0, 0,0]);
    }

    apply(filterManager: FilterSystem, input: RenderTexture, output: RenderTexture, clear: CLEAR_MODES): void {
        this.uniforms.uPixelSize[0] = 1 / input._frame.width;
        this.uniforms.uPixelSize[1] = 1 / input._frame.height;
        this.uniforms.uLightPos[0] = worldToScreen(player.position).x/window.innerWidth//-this.sprite.position.x/Camera.width;
        this.uniforms.uLightPos[1] = (worldToScreen(player.position).y-20)/window.innerHeight//-this.sprite.position.y/Camera.height;
        this.uniforms.uAmbient[0] = Atmosphere.settings.ambientLight.r/255
        this.uniforms.uAmbient[1] = Atmosphere.settings.ambientLight.g/255
        this.uniforms.uAmbient[2] = Atmosphere.settings.ambientLight.b/255
        //console.log(this.uniforms.uLightPos);
        
        filterManager.applyFilter(this, input, output, clear);
    }
}
