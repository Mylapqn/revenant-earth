precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 filterClamp;

uniform float uAlpha;
uniform bool uKnockout;
uniform float uAngle;
uniform vec2 uSunPos;
uniform vec2 uPixelSize;
uniform float uDensity;
uniform float uAbsorbDensity;
uniform vec3 uColorScatter;
uniform vec3 uColorAbsorb;

const float DOUBLE_PI = 2. * 3.14159265358979323846264;
const float MAX_ANGLE = .5;
const float ANGLE_STEP = 0.1;
const float HORIZON_Y = .5;

vec3 blendNormal(vec3 base, vec3 blend, float opacity) {
    return (blend * opacity + base * (1.0 - opacity));
}

vec3 blendAverage(vec3 base, vec3 blend) {
    return (base + blend) / 2.0;
}

vec3 blendAverage(vec3 base, vec3 blend, float opacity) {
    return (blendAverage(base, blend) * opacity + base * (1.0 - opacity));
}

vec3 blendMultiply(vec3 base, vec3 blend) {
    return base * blend;
}

vec3 blendMultiply(vec3 base, vec3 blend, float opacity) {
    return (blendMultiply(base, blend) * opacity + base * (1.0 - opacity));
}

float blendScreen(float base, float blend) {
    return 1.0 - ((1.0 - base) * (1.0 - blend));
}

vec3 blendScreen(vec3 base, vec3 blend) {
    return vec3(blendScreen(base.r, blend.r), blendScreen(base.g, blend.g), blendScreen(base.b, blend.b));
}

vec3 blendScreen(vec3 base, vec3 blend, float opacity) {
    return (blendScreen(base, blend) * opacity + base * (1.0 - opacity));
}

void main(void) {
    vec4 sourceColor = texture2D(uSampler, vTextureCoord);
    float len = max(0., 1. - (length((uSunPos - vTextureCoord.xy) / uPixelSize / 40.)));
    float day = min(1., max(0., (HORIZON_Y - uSunPos.y) * 2.));
    vec3 leng = vec3(len, len, len);
    vec3 powers = vec3(5., 10., 20.);
    vec3 additive = vec3(.97, .83, .78) * day + vec3(.05, .2, .30) * (1. - day);
    //gl_FragColor = vec4(blendMultiply(blendScreen(sourceColor.xyz*0.5, uColorScatter, uDensity * sourceColor.a), uColorAbsorb, pow(uDensity, 1.)), sourceColor.a);

    gl_FragColor = vec4(blendScreen(blendNormal(sourceColor.rgb, uColorAbsorb, uDensity * sourceColor.a * uAbsorbDensity), uColorScatter, uDensity * sourceColor.a), sourceColor.a);

}
