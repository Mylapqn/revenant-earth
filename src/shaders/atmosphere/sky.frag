precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 filterClamp;

uniform float uAlpha;
uniform vec4 uColor;
uniform bool uKnockout;
uniform float uAngle;
uniform vec2 uSunPos;
uniform vec2 uPixelSize;
uniform vec3 uAmbient;

const float DOUBLE_PI = 2. * 3.14159265358979323846264;
const float MAX_ANGLE = .5;
const float ANGLE_STEP = 0.1;
const float DEPTH_STEPS = 4.;
const float HORIZON_Y = .5;

const float logBase = log(6.);

vec3 filmic(vec3 x) {
    vec3 X = max(vec3(0.0), x - 0.004);
    vec3 result = (X * (6.2 * X + 0.5)) / (X * (6.2 * X + 1.7) + 0.06);
    return pow(result, vec3(2.2));
}

float filmic(float x) {
    float X = max(0.0, x - 0.004);
    float result = (X * (6.2 * X + 0.5)) / (X * (6.2 * X + 1.7) + 0.06);
    return pow(result, 2.2);
}

vec3 tonemap(vec3 x) {
    return mix(pow(x, vec3(0.75)), log(x + 0.1) / logBase + 1. - log(1.1) / logBase, min(x, 1.));
}

vec3 posterise(vec3 x) {
    return floor((x) * 5.) / 5.;
}

vec3 blendNormal(vec3 base, vec3 blend, float opacity) {
    return (blend * opacity + base * (1.0 - opacity));
}
vec3 blendMultiply(vec3 base, vec3 blend, float opacity) {
    return (base*blend * opacity + base * (1.0 - opacity));
}

void main(void) {
    vec4 sourceColor = texture2D(uSampler, vTextureCoord);
    float hor = (pow(max(0., 1. - (length((HORIZON_Y - vTextureCoord.y) / uPixelSize / 200.))), 2.) * 1.);
    hor*=clamp(HORIZON_Y-(uSunPos.y-.5),0.,1.);
    float len = (pow(max(0., 1. - (length((uSunPos - vTextureCoord.xy) / uPixelSize / 70.))), 2.) * .5);
    if(len > .39)
        len = 1.;
    else
        len *= 1.8 * (hor + .25);
    vec3 horizon = vec3(1., .5, .1) * hor;
    vec3 sun = vec3(1., .6, .1) * len;
    sun = blendMultiply(sun, vec3(.8, .1, 0), hor);
    gl_FragColor = vec4((tonemap(sourceColor.rgb*uAmbient + horizon + sun)), 1.);

}
