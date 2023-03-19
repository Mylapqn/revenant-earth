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

const float DOUBLE_PI = 2. * 3.14159265358979323846264;
const float MAX_ANGLE = .5;
const float ANGLE_STEP = 0.1;
const float DEPTH_STEPS = 4.;
const float HORIZON_Y = .5;

void main(void) {
    vec4 sourceColor = texture2D(uSampler, vTextureCoord);
    float len = max(0., 1. - (length(uSunPos - vTextureCoord.xy)));
    float day = min(1., max(0., (HORIZON_Y - uSunPos.y) * 2.));
    vec3 leng = vec3(len, len, len);
    vec3 powers = vec3(4., 10., 20.)*2.;
    day = 1.;
    //vec3 additive = (vec3(.97, .83, .78) * day + vec3(.05, .2, .30) * (1. - day)) * ((HORIZON_Y - abs(vTextureCoord.y - HORIZON_Y)) * 2. + day);
    vec3 additive = (vec3(.75, .85, 1.) * day + vec3(.05, .2, .30) * (1. - day));
    gl_FragColor = vec4(pow(leng, powers) * .8 + additive, 1.);
}
