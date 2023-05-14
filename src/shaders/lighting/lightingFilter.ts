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
let fragmentAmbient: string = fs.readFileSync(__dirname + '/ambientLighting.frag', 'utf8');

export class LightingFilter extends Filter {
    sprite: Container;
    multColor: Color;
    useLights = false;
    constructor(sprite: Container<DisplayObject>, multColor = new Color(180, 180, 180), useLights = false) {
        super(undefined, useLights ? fragment : fragmentAmbient);
        this.sprite = sprite;
        this.uniforms.uPixelSize = new Float32Array([0, 0]);
        this.uniforms.uLightPos = new Float32Array([0, 0]);
        this.uniforms.uAmbient = new Float32Array([0, 0, 0]);
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

            this.uniforms.uLightPos[0] = player.screenCenterNorm.x - player.screenDimensionsNorm.x * .05 * player.graphics.scale.x;
            this.uniforms.uLightPos[1] = player.screenCenterNorm.y - player.screenDimensionsNorm.y * .3;
            this.uniforms.uTargetAngle = new Vector(-player.graphics.scale.x, -.2).toAngle();
        }
        //console.log(...this.uniforms.uLightPos);

        filterManager.applyFilter(this, input, output, clear);
    }
}
