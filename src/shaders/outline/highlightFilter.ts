const fs = require("fs");
import { Filter, utils } from '@pixi/core';
import type { FilterSystem, RenderTexture, CLEAR_MODES } from '@pixi/core';
import { Assets, Color } from 'pixi.js';
import { Atmosphere } from '../../atmosphere';
import { Camera } from '../../camera';
import { mouse } from '../..';

let vertex: string = fs.readFileSync(__dirname + '/highlight.vert', 'utf8');
let fragment: string = fs.readFileSync(__dirname + '/highlight.frag', 'utf8');

export class HighlightFilter extends Filter {
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
    constructor(thickness: number = 1, color: number = 0x000000, alpha: number = 1.0) {
        super(vertex, fragment.replace(/(DEPTH_STEPS = )([\d.]+)/g, `$1${thickness.toFixed(1)}`));

        this.uniforms.uLightPos = new Float32Array([0, 0]);
        this.uniforms.uColor = new Float32Array([0, 0, 0, 1]);
        this.uniforms.uAlpha = alpha;

        Object.assign(this, { thickness, color, alpha });
    }

    /**
     * Get the angleStep by quality
     * @private
     */

    apply(filterManager: FilterSystem, input: RenderTexture, output: RenderTexture, clear: CLEAR_MODES): void {
        this.uniforms.uAlpha = this._alpha;
        this.uniforms.uKnockout = this._knockout;
        this.uniforms.uAngle = Atmosphere.settings.sunAngle;
        this.uniforms.uLightPos[0] = Atmosphere.settings.sunPosition.x;
        this.uniforms.uLightPos[1] = Atmosphere.settings.sunPosition.y;
        this.uniforms.uIntensity = Atmosphere.settings.sunIntensity;
        //this.uniforms.uLightPos[0] = (mouse.x / window.innerWidth) * Camera.width;
        //this.uniforms.uLightPos[1] = (mouse.y / window.innerHeight) * Camera.height;

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
