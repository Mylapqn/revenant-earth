precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 filterClamp;

uniform vec2 uLightPos;
uniform vec2 uPlayerPos;
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

vec4 blur(float Size) {
    const float Pi = 6.28318530718; // Pi*2

    // GAUSSIAN BLUR SETTINGS {{{
    const float Directions = 16.0; // BLUR DIRECTIONS (Default 16.0 - More is better but slower)
    const float Quality = 5.0; // BLUR QUALITY (Default 4.0 - More is better but slower)
    //const float Size = 5.0; // BLUR SIZE (Radius)
    // GAUSSIAN BLUR SETTINGS }}}

    vec2 Radius = Size * uPixelSize;

    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = vTextureCoord;
    // Pixel colour
    vec4 Color = texture2D(uSampler, uv);

    // Blur calculations
    for(float d = 0.0; d < Pi; d += Pi / Directions) {
        for(float i = 1.0 / Quality; i <= 1.0; i += 1.0 / Quality) {
            Color += texture2D(uSampler, uv + vec2(cos(d), sin(d)) * Radius * i);
        }
    }

    // Output to screen
    Color /= Quality * Directions - 15.0;
    return Color;
}

float map(float value, float fromMin, float fromMax, float toMin, float toMax) {
    return toMin + (value - fromMin) * (toMax - toMin) / (fromMax - fromMin);
}

void main(void) {
    vec4 sourceColor = demult(texture2D(uSampler, vTextureCoord));
    float playerDist = map(clamp(length((uPlayerPos - vTextureCoord) / uPixelSize / 150.), 0., 1.), .5, 1., 0., 1.);
    vec4 b = blur((1. - playerDist) * 10. + 5.);
    float alpha = b.a * playerDist;
    vec3 color = vec3(0.15, 0.1, 0.1) * uAmbient;
    gl_FragColor = vec4(color * alpha, alpha * (1.));
}
