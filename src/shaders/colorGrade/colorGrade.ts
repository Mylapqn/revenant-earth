const fs = require("fs");
import { Filter, utils } from '@pixi/core';
import type { FilterSystem, RenderTexture, CLEAR_MODES } from '@pixi/core';
import { Assets } from 'pixi.js';
import { Atmosphere } from '../../atmosphere';
import { Camera } from '../../camera';
import { mouse } from '../../game';
import { Color } from '../../color';
import { clamp, lerp } from '../../utils';

let fragment: string = fs.readFileSync(__dirname + '/colorGrade.frag', 'utf8');
let vertex: string = fs.readFileSync(__dirname + '/../lighting/es300.vert', 'utf8');

export interface colorGradeOptions {
    saturation?: number, contrast?: number, brightness?: number, tintColor?: Color, tintStrength?: number, strength?: number
}

export class colorGradeFilter extends Filter {
    private _options: colorGradeOptions;
    constructor(options: colorGradeOptions = {}) {
        super(vertex, fragment);
        this.options = options;
    }

    apply(filterManager: FilterSystem, input: RenderTexture, output: RenderTexture, clear: CLEAR_MODES): void {
        filterManager.applyFilter(this, input, output, clear);
    }

    public set strength(v: number) {
        this.uniforms.uStrength = v;
    }

    public set options(options: colorGradeOptions) {
        colorGradeFilter.fillOptions(options);
        this._options = options;
        this.uniforms.uSaturation = options.saturation;
        this.uniforms.uBrightness = options.brightness;
        this.uniforms.uContrast = options.contrast;
        this.uniforms.uTintStrength = options.tintStrength;
        this.uniforms.uTintColor = options.tintColor.toShader();
        this.uniforms.uStrength = options.strength;
    }

    public get options(): colorGradeOptions {
        return this._options;
    }


    static fillOptions(options: colorGradeOptions) {
        options.saturation = options.saturation ?? 1;
        options.brightness = options.brightness ?? 1;
        options.contrast = options.contrast ?? 1;
        options.tintStrength = options.tintStrength ?? 0;
        options.tintColor = options.tintColor ?? new Color(255, 150, 0);
        options.strength = options.strength ?? 1;
    }

    static mixSettings(opt1: colorGradeOptions, opt2: colorGradeOptions, factor: number) {
        factor = clamp(factor);
        this.fillOptions(opt1);
        this.fillOptions(opt2);
        let options: colorGradeOptions = {};
        options.saturation = lerp(opt1.saturation, opt2.saturation, factor);
        options.brightness = lerp(opt1.brightness, opt2.brightness, factor);
        options.contrast = lerp(opt1.contrast, opt2.contrast, factor);
        options.tintStrength = lerp(opt1.tintStrength, opt2.tintStrength, factor);
        options.tintColor = opt1.tintColor.mix(opt2.tintColor, factor);
        options.strength = lerp(opt1.strength, opt2.strength, factor);
        return options;
    }

    static styles = {
        blank: {} as colorGradeOptions,
        night: { strength: 1, contrast: 1.1, brightness: 1, saturation: .4, tintColor: new Color(0, 150, 200), tintStrength: .2} as colorGradeOptions,
        dust: { strength: 1, contrast: 1.3, brightness: .8, saturation: .8, tintColor: new Color(255, 120, 0), tintStrength: 1.2 } as colorGradeOptions,
        sunset: { strength: .2, contrast: 1.1, brightness: 1.3, saturation: .8, tintColor: new Color(255, 100, 40), tintStrength: .3 } as colorGradeOptions,
        bleak: { strength: 1, contrast: .8, brightness: .9, saturation: .35, tintColor: new Color(40, 200, 160), tintStrength: .5 } as colorGradeOptions,
        industry: { strength: 1, contrast:1.4, brightness: .6, saturation: .2, tintColor: new Color(200, 130, 0), tintStrength: 1.2 } as colorGradeOptions,
        green: { strength: 1, contrast: .9, brightness: 1., saturation: .6, tintColor: new Color(130, 230, 40), tintStrength: .6 } as colorGradeOptions,

    }

}
