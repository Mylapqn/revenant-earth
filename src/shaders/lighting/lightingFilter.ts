const fs = require("fs");
import { Filter, utils } from '@pixi/core';
import type { FilterSystem, RenderTexture, CLEAR_MODES } from '@pixi/core';
import { Assets, Container, DisplayObject } from 'pixi.js';
import { Color } from '../../color';
import { Atmosphere } from '../../atmosphere';
import { Camera } from '../../camera';
import { mouse, player, worldToScreen } from '../..';
import { Vector } from '../../vector';

let fragment: string = fs.readFileSync(__dirname + '/lighting.frag', 'utf8');

export class LightingFilter extends Filter {
    sprite: Container;
    multColor: Color;
    constructor(sprite: Container<DisplayObject>, multColor = new Color(180, 180, 180)) {
        super(undefined, fragment);
        this.sprite = sprite;
        this.uniforms.uPixelSize = new Float32Array([0, 0]);
        this.uniforms.uLightPos = new Float32Array([0, 0]);
        this.uniforms.uAmbient = new Float32Array([0, 0, 0]);
        this.multColor = multColor;
    }

    apply(filterManager: FilterSystem, input: RenderTexture, output: RenderTexture, clear: CLEAR_MODES): void {
        this.uniforms.uPixelSize[0] = 1 / input._frame.width;
        this.uniforms.uPixelSize[1] = 1 / input._frame.height;
        this.uniforms.uLightPos[0] = worldToScreen(player.position).x / window.innerWidth//-this.sprite.position.x/Camera.width;
        this.uniforms.uLightPos[1] = (worldToScreen(player.position).y - 128) / window.innerHeight//-this.sprite.position.y/Camera.height;
        this.uniforms.uTargetAngle = new Vector(-player.graphics.scale.x, -.2).toAngle();
        let ambientMult = Atmosphere.settings.ambientLight.mult(this.multColor);
        this.uniforms.uAmbient[0] = ambientMult.r / 255
        this.uniforms.uAmbient[1] = ambientMult.g / 255
        this.uniforms.uAmbient[2] = ambientMult.b / 255
        //console.log(this.uniforms.uLightPos);

        filterManager.applyFilter(this, input, output, clear);
    }
}
