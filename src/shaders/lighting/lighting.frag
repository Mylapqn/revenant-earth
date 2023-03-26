precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 filterClamp;

uniform vec2 uLightPos;
uniform vec2 uPixelSize;

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
    return mix(pow(x, vec3(0.75)), log(x+0.1) / logBase + 1. - log(1.1) / logBase, min(x, 1.));
}

void main(void) {
    vec4 sourceColor = texture2D(uSampler, vTextureCoord);
    vec3 lightMap = vec3(.8, .6, .4);
    //lightMap = vec3(.0);
    lightMap += pow(max(1. - length((vTextureCoord - uLightPos) / uPixelSize / 40.), 0.), 2.) * 2.;
    //lightMap += (pow(max(1. - length((vTextureCoord - vec2(0.5, .8)) / uPixelSize / 40.), 0.), 2.) *1.) * vec3(.0, .0, 1.);
    //lightMap += (pow(max(1. - length((vTextureCoord - vec2(0.4, .8)) / uPixelSize / 40.), 0.), 2.) * 1.) * vec3(.0, 1.0, 0.);
    //lightMap += (pow(max(1. - length((vTextureCoord - vec2(0.45, .85)) / uPixelSize /40.), 0.), 2.) * 1.) * vec3(1.0, 0.0, 0.);
    //lightMap = pow(lightMap, vec3(1. / 2.2));
    lightMap = tonemap(lightMap);
    //lightMap = min(lightMap, 2.);
    gl_FragColor = vec4(min(sourceColor.rgb * lightMap, 1.), sourceColor.a);
    //gl_FragColor = sourceColor;
}
