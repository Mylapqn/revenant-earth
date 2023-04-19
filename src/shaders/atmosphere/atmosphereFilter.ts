const fs = require("fs");
import { Filter, utils } from '@pixi/core';
import type { FilterSystem, RenderTexture, CLEAR_MODES } from '@pixi/core';
import { Assets, Color } from 'pixi.js';
import { Atmosphere } from '../../atmosphere';
import { Camera } from '../../camera';

let fragment: string = fs.readFileSync(__dirname + '/atmosphere.frag', 'utf8');

export class AtmosphereFilter extends Filter {
    /** The minimum number of samples for rendering outline. */
    public static MIN_SAMPLES = 1;

    /** The maximum number of samples for rendering outline. */
    public static MAX_SAMPLES = 100;

    private _thickness = 1;
    private _alpha = 1.0;
    private _knockout = false;

    /**
     * @param {number} [thickness=1] - The tickness of the outline. Make it 2 times more for resolution 2
     * @param {number} [color=0x000000] - The color of the outline.
     * @param {number} [quality=0.1] - The quality of the outline from `0` to `1`, using a higher quality
     *        setting will result in slower performance and more accuracy.
     * @param {number} [alpha=1.0] - The alpha of the outline.
     * @param {boolean} [knockout=false] - Only render outline, not the contents.
     */
    constructor(depth: number = 1, color: number = 0x000000, alpha: number = 1.0) {
        //super(undefined, fragment.replace(/(DEPTH = )([\d.]+)/g, `$1${(1 - depth).toFixed(1)}`));
        super(undefined, fragment);

        this.uniforms.uSunPos = new Float32Array([0, 0]);
        this.uniforms.uPixelSize = new Float32Array([0, 0]);
        this.uniforms.uAlpha = alpha;

        this.uniforms.uColorScatter = new Float32Array([1, 0.15, 0.12]);
        this.uniforms.uColorAbsorb = new Float32Array([1., 0.7, 0.4]);
        this.uniforms.uAbsorbDensity = 1;

        //RED DUSTY
        //this.uniforms.uColorScatter = new Float32Array([1, 0.05, 0.02]);
        //this.uniforms.uColorAbsorb = new Float32Array([1., 0.6, 0.21]);
        //this.uniforms.uAbsorbDensity = 1;
        

        //CLEAR SKY
        //this.uniforms.uColorScatter = new Float32Array([0.5, 0.8, 1]);
        //this.uniforms.uColorAbsorb = new Float32Array([.7, .8, .6]);
        //this.uniforms.uAbsorbDensity = 0.5;
//
        this.uniforms.uColorScatter = new Float32Array([0.05, 0.6, .78]);
        this.uniforms.uColorAbsorb = new Float32Array([.9, .65, .3]);
        this.uniforms.uAbsorbDensity = 0.8;
        this.uniforms.uAmbient = new Float32Array([0, 0, 0]);


        this.uniforms.uDensity = Math.min((1 - depth), 1);

        Object.assign(this, { depth, color, alpha });
    }

    /**
     * Get the angleStep by quality
     * @private
     */

    apply(filterManager: FilterSystem, input: RenderTexture, output: RenderTexture, clear: CLEAR_MODES): void {
        this.uniforms.uAlpha = this._alpha;
        this.uniforms.uKnockout = this._knockout;
        this.uniforms.uAngle = Atmosphere.settings.sunAngle;
        this.uniforms.uSunPos[0] = Atmosphere.settings.sunPosition.x / Camera.width;
        this.uniforms.uSunPos[1] = Atmosphere.settings.sunPosition.y / Camera.height;
        this.uniforms.uPixelSize[0] = 1 / input._frame.width;
        this.uniforms.uPixelSize[1] = 1 / input._frame.height;

        this.uniforms.uAmbient[0] = Atmosphere.settings.ambientLight.r/255
        this.uniforms.uAmbient[1] = Atmosphere.settings.ambientLight.g/255
        this.uniforms.uAmbient[2] = Atmosphere.settings.ambientLight.b/255

        filterManager.applyFilter(this, input, output, clear);
    }

    /**
     * The alpha of the outline.
     * @default 1.0
     */
    get alpha(): number {
        return this._alpha;
    }
    set alpha(value: number) {
        this._alpha = value;
    }

    /**
     * The color of the outline.
     * @default 0x000000
     */
    get color(): number {
        return new Color(this.uniforms.uColor).toNumber();
    }
    set color(value: number) {
        this.uniforms.uColor = new Color(value).toRgbArray();
    }

    /**
     * Only render outline, not the contents.
     * @default false
     */
    get knockout(): boolean {
        return this._knockout;
    }
    set knockout(value: boolean) {
        this._knockout = value;
    }

    /**
     * The thickness of the outline.
     * @default 1
     */
    get thickness(): number {
        return this._thickness;
    }
    set thickness(value: number) {
        this._thickness = value;
        this.padding = value;
    }
}
