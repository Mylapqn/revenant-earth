#version 300 es

precision mediump float;
in vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D uLightMap;
uniform highp vec4 inputSize;
uniform vec4 filterClamp;

uniform float uAlpha;
uniform vec4 uColor;
uniform bool uKnockout;
uniform float uAngle;
uniform vec2 uLightPos;
uniform float uIntensity;

uniform vec2 uPixelSize;

const float DOUBLE_PI = 2. * 3.14159265358979323846264;
const float MAX_ANGLE = DOUBLE_PI / 2.;
const float ANGLE_STEP = DOUBLE_PI / 8.;
const float DEPTH_STEPS = 1.;

out vec4 color;

float edge = 0.;

vec2 edgeNormalAtPos(vec4 sourceColor) {
    vec4 displacedColor;
    vec2 displacedPos;
    float maxAlpha = 0.;

    vec2 normal = vec2(.0);

    //vec2 totalOffset = uThickness * sgn * max(uPixelSize * 500., abs);
    for(int xo = -1; xo <= 1; xo += 1) {
        for(int yo = -1; yo <= 1; yo += 1) {
            float a = texture(uSampler, vTextureCoord + vec2(float(xo), float(yo)) * uPixelSize).a;
            normal -= vec2(float(xo), float(yo)) * a;
            edge += (1. - a) * .1;
        }
    }

    return normalize(normal);
}

float threshold(float x, float threshold) {
    if(x >= threshold) {
        return 1.;
    }
    return 0.;
}

float map(float value, float fromMin, float fromMax, float toMin, float toMax) {
    return toMin + (value - fromMin) * (toMax - toMin) / (fromMax - fromMin);
}

void main(void) {
    vec4 sourceColor = texture(uSampler, vTextureCoord);
    vec4 lightMap = texture(uLightMap, vTextureCoord);
    vec2 normal = edgeNormalAtPos(sourceColor);
    vec2 sunHeading = normalize(uLightPos - vTextureCoord);
    float sunLight = (clamp(threshold(edge, .2) * map(dot(sunHeading, normal), .1, 1., 0., 1.), 0., 1.));
    color = vec4(vec3(sourceColor.rgb + (sunLight * uColor.rgb * uIntensity + lightMap.rgb * edge * 2.) * uAlpha * sourceColor.a), sourceColor.a);
    //color = vec4(length(sunHeading),0.,0.,1.);
}
