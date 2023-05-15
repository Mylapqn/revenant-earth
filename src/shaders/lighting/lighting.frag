#version 300 es

const int maxLightAmount = 16;
uniform int lightAmount;

precision mediump float;
in vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 filterClamp;

uniform vec2 uPixelSize;

uniform vec3 uAmbient;
struct Light {
    vec2 position;
    float angle;
    float width;
    float range;
    vec3 color;
};
uniform Light[maxLightAmount] uLights;

out vec4 color;

const float DOUBLE_PI = 2. * 3.14159265358979323846264;

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

void main(void) {
    vec4 sourceColor = demult(texture(uSampler, vTextureCoord));
    vec3 lightMap = vec3(.8, .6, .4);
    //lightMap = vec3(1.);
    lightMap = vec3(0.);
    for(int i = 0; i < lightAmount; i++) {
        Light l = uLights[i];
        vec2 off = (l.position - vTextureCoord) / uPixelSize / l.range;

        float dis = length(off);
        float disLinear = clamp(1. - dis, 0., 1.);
        float distanceFalloff = disLinear * disLinear;

        vec2 targetDir = vec2(cos(l.angle), sin(l.angle));
        float angle = (acos(clamp(dot(normalize(off), (targetDir)), -1., 1.)));
        float angularFalloff = clamp(smoothstep(l.width, -l.width, angle), 0.0, 1.0);

        lightMap += distanceFalloff * angularFalloff * l.color * 6.;
    }

    //TODO ISSUE: Light over void/air applies multiple times if more layers have filter    V here                                         V here
    color = vec4(min(tonemap(sourceColor.rgb * (lightMap + uAmbient)), 1.) * sourceColor.a + tonemap(lightMap * .05), clamp(sourceColor.a + min(vec3(0.01), length(lightMap) * .2), 0., 1.));

}
