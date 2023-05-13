precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 filterClamp;

uniform vec2 uLightPos;
uniform vec2 uPixelSize;
uniform float uTargetAngle;
uniform vec3 uAmbient;

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

void main(void) {
    vec4 sourceColor = demult(texture2D(uSampler, vTextureCoord));
    vec3 lightMap = vec3(.8, .6, .4);
    //lightMap = vec3(1.);
    lightMap = uAmbient;
    vec2 off = (uLightPos - vTextureCoord) / uPixelSize / 200.;
    float dis = length(off);
    float targetAngle = uTargetAngle;
    float angleTolerance = .8;
    vec2 targetDir = vec2(cos(targetAngle), sin(targetAngle));
    float angle = (acos(clamp(dot(normalize(off), (targetDir)), -1., 1.)));
    float angularFalloff = clamp(smoothstep(angleTolerance, -angleTolerance, angle), 0.0, 1.0);
    float disLinear = clamp(1. - dis, 0., 1.);
    float distanceFalloff = disLinear * disLinear;
    lightMap += distanceFalloff * angularFalloff * vec3(.35, .8, 1.) * 6.;
    //lightMap += (pow(max(1. - length((vTextureCoord - vec2(0.5, .8)) / uPixelSize / 40.), 0.), 2.) *1.) * vec3(.0, .0, 1.);
    //lightMap += (pow(max(1. - length((vTextureCoord - vec2(0.4, .8)) / uPixelSize / 40.), 0.), 2.) * 1.) * vec3(.0, 1.0, 0.);
    //lightMap += (pow(max(1. - length((vTextureCoord - vec2(0.45, .85)) / uPixelSize /40.), 0.), 2.) * 1.) * vec3(1.0, 0.0, 0.);
    //lightMap = pow(lightMap, vec3(1. / 2.2));
    //lightMap = tonemap(lightMap);
    //lightMap = min(lightMap, 2.);
    gl_FragColor = vec4(min(tonemap(sourceColor.rgb * lightMap), 1.) * sourceColor.a, sourceColor.a);
    //gl_FragColor = sourceColor;
}
