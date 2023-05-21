#version 300 es

precision mediump float;

const int maxLightAmount = 16;
const int angleRes = 512;

const float shadowStrength = .85;

uniform int lightAmount;

precision mediump float;
in vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D shadowMap;
uniform vec4 filterClamp;

uniform vec2 uPixelSize;

struct Light {
    vec2 position;
    float angle;
    float width;
    float range;
    float intensity;
    vec3 color;
};
uniform Light[maxLightAmount] uLights;

out vec4 color;

const float DOUBLE_PI = 2. * 3.14159265358979323846264;
const float PI = 3.14159265358979323846264;

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

const float logBase = log(6.);

vec3 tonemap(vec3 x) {
    return mix(pow(x, vec3(0.75)), log(x + 0.1) / logBase + 1. - log(1.1) / logBase, min(x, 1.));
}

vec4 demult(vec4 color) {
    return vec4(vec3(color.rgb) / color.a, color.a);
}
float map(float value, float fromMin, float fromMax, float toMin, float toMax) {
    return toMin + (value - fromMin) * (toMax - toMin) / (fromMax - fromMin);
}
float nClamp(float value) {
    return clamp(value, 0.0, 1.0);
}

void main(void) {
    vec3 lightMap = vec3(.0);
    for(int i = 0; i < lightAmount; i++) {
        Light l = uLights[i];

        vec2 off = (l.position - vTextureCoord) / uPixelSize / l.range;
        float angle = map(atan(off.y, off.x), -PI, PI, 0., 1.);
        float shadowDist = texelFetch(shadowMap, ivec2(int(angle * float(angleRes)), i), 0).g;
        //float shadowDist = texture(shadowMap, vec2((angle), (i))).g;

        float dis = length(off);
        float disLinear = nClamp(1. - dis);
        float distanceFalloff = disLinear * disLinear;

        vec2 targetDir = vec2(cos(l.angle), sin(l.angle));
        float angleOffset = (acos(clamp(dot(normalize(off), (targetDir)), -1., 1.)));
        float angularFalloff = nClamp(smoothstep(l.width, -l.width, angleOffset));

        vec3 addition = distanceFalloff * angularFalloff * l.color * l.intensity *4.;
        addition *= 1. - nClamp((dis - shadowDist) * .1 * l.range) * shadowStrength;

        lightMap += addition;
    }

    color = vec4(lightMap, 1.);

}
