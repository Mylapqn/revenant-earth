#version 300 es

precision mediump float;
in vec2 vTextureCoord;
uniform sampler2D uSampler;

uniform float uSaturation;
uniform float uBrightness;
uniform float uContrast;
uniform float uTintStrength;
uniform vec3 uTintColor;
uniform float uStrength;

out vec4 outColor;

const float logBase = log(6.);

vec3 tonemap(vec3 x) {
    return mix(pow(x, vec3(0.75)), log(x + 0.1) / logBase + 1. - log(1.1) / logBase, min(x, 1.));
}

float luma(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
}

vec3 saturation(vec3 color, float saturation) {
    return mix(vec3(luma(color)), color, saturation);
}
vec3 contrast(vec3 color, float contrast) {
    return saturation(mix(vec3(.5), color, contrast), (1. / max(.01, contrast)));
}
vec3 tint(vec3 color, vec3 tint, float strength) {
    tint = mix(vec3(.5), tint, strength);
    vec3 softLight = ((1. - 2. * tint) * color * color + 2. * color * tint);
    return mix(softLight, tint, (.2 + (1. - luma(color))) * strength * .5);
}

vec3 grade(vec3 color, float sat, float cont, float bright, vec3 tintCol, float tintStrength) {
    return tint(contrast(saturation(color, sat), cont) * bright, tintCol, tintStrength);
}

void main(void) {
    vec4 sourceColor = (texture(uSampler, vTextureCoord));
    vec3 rgb = sourceColor.rgb;
    float val = luma(rgb);
    vec3 grad = grade(rgb, mix(1., uSaturation, uStrength), mix(1., uContrast, uStrength), mix(1., uBrightness, uStrength), uTintColor, mix(0., uTintStrength, uStrength));
    outColor = vec4(grad, 1.);

    /*
    outColor = vec4(vec3(rgb + vec3(1., .6, 0.) * val + vec3(1., 0., 0.) * (1. - val)) / 2., sourceColor.a);
    outColor = vec4(tint(contrast(saturation(rgb, .4), 1.3) * .9, vec3(.0, .7, .9), .2), 1.);
    if(vTextureCoord.x > .25)
        outColor = vec4(grade(rgb, 1.2, 1.5, .8, vec3(.9, .3, .0), .4), 1.);
    if(vTextureCoord.x > .5)
        outColor = vec4(tint(contrast(saturation(rgb, 1.5), 1.), vec3(.9, .3, .0), .5), 1.);
    if(vTextureCoord.x > .75)
        outColor = vec4(tint(contrast(saturation(rgb, .5), .8), vec3(.2, .9, .0), .3), 1.);
    */

}
