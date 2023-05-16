#version 300 es

const int maxLightAmount = 16;
const int angleRes = 512;
uniform int lightAmount;

precision mediump float;
in vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D occluder;
uniform vec4 filterClamp;

uniform vec2 uPixelSize;

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
    float shadowMap = 1.;
    int lightIndex = int(vTextureCoord.y * float(maxLightAmount));
    float testingAngle = (vTextureCoord.x * float(angleRes));
    float actualAngle = vTextureCoord.x * DOUBLE_PI;
    vec2 dir = vec2(cos(actualAngle), sin(actualAngle)) * uPixelSize;
    Light l = uLights[lightIndex];
    if(l.range > .1)
        for(float i = 0.; i < 1.; i += 1. / l.range) {
            int a = int(texture(occluder, l.position + dir * (i * l.range)).a * 255.);
            if(a > 3) {
                shadowMap = i;
                break;
            }
        }

    color = vec4(vec3(shadowMap), 1.);
    color = vec4(float(lightIndex) / float(maxLightAmount), shadowMap, 0., 1.);
    //color = vec4(vec3(texture(occluder, vTextureCoord).a > 0.), 1.);
}
