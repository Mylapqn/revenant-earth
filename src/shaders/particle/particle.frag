#version 300 es

precision mediump float;
in vec2 vTextureCoord;
uniform sampler2D uSampler;

uniform vec2 uPixelSize;
out vec4 outColor;

uniform vec3 uFromColor;
uniform vec3 uToColor;

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
    vec4 Color = texture(uSampler, uv);

    // Blur calculations
    for(float d = 0.0; d < Pi; d += Pi / Directions) {
        for(float i = 1.0 / Quality; i <= 1.0; i += 1.0 / Quality) {
            Color += texture(uSampler, uv + vec2(cos(d), sin(d)) * Radius * i);
        }
    }

    // Output to screen
    Color /= Quality * Directions - 15.0;
    return Color;
}

vec2 edgeNormalAtPos() {
    vec4 displacedColor;
    vec2 displacedPos;
    float maxAlpha = 0.;

    vec2 normal = vec2(.0);

    //vec2 totalOffset = uThickness * sgn * max(uPixelSize * 500., abs);
    for(int xo = -1; xo <= 1; xo += 1) {
        for(int yo = -1; yo <= 1; yo += 1) {
            float a = texture(uSampler, vTextureCoord + vec2(float(xo), float(yo)) * uPixelSize).a;
            a = clamp(a, 0., 1.);
            normal -= vec2(float(xo), float(yo)) * a;
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

float posterise(float x, float steps) {
    return floor((x) * (steps + 1.)) / steps;
}
vec3 posterise(vec3 x, float steps) {
    return vec3(posterise(x.r, steps), posterise(x.g, steps), posterise(x.b, steps));
}
vec4 posterise(vec4 x, float steps) {
    return vec4(posterise(x.rgb, steps), posterise(x.a, steps));
}

float clamp2(float c) {
    return clamp(c, 0., 1.);
}

vec3 clamp2(vec3 c) {
    return clamp(c, 0., 1.);
}

vec4 clamp2(vec4 c) {
    return clamp(c, 0., 1.);
}

float luma(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1., 2. / 3., 1. / 3., 3.);
    return c.z * mix(K.xxx, clamp(abs(fract(c.x + K.xyz) * 6. - K.w) - K.x, 0., 1.), c.y);
}

vec3 rgb2hsv(vec3 c) {
    float cMax = max(max(c.r, c.g), c.b), cMin = min(min(c.r, c.g), c.b), delta = cMax - cMin;
    vec3 hsv = vec3(0., 0., cMax);
    if(cMax > cMin) {
        hsv.y = delta / cMax;
        if(c.r == cMax) {
            hsv.x = (c.g - c.b) / delta;
        } else if(c.g == cMax) {
            hsv.x = 2. + (c.b - c.r) / delta;
        } else {
            hsv.x = 4. + (c.r - c.g) / delta;
        }
        hsv.x = fract(hsv.x / 6.);
    }
    return hsv;
}

void main(void) {
    vec4 sourceColor = (texture(uSampler, vTextureCoord));
    vec4 dem = demult(sourceColor);
    //float shading = clamp2(dot(edgeNormalAtPos(), vec2(.5, .5)));
    //vec4 shaded = vec4(sourceColor.rgb*.5 + shading, sourceColor.a);
    float val = luma(dem.rgb) * dem.a;
    float pval = clamp2(posterise(val, 5.));
    //vec3 hsv = rgb2hsv(dem.rgb);
    vec4 post = clamp2(posterise(clamp2(dem), 5.));
    //vec3 rgb = hsv2rgb(post);
    //float post = clamp2(posterise(sourceColor.a,5.));
    //post = sourceColor;
    //post.rgb *= post.a;
    outColor = vec4(mix(uToColor, uFromColor, pval) * pval, pval);
    //outColor = vec4(post);
    //outColor = sourceColor;
    //outColor = sourceColor*vec4(0.,0.,1.,1.);
}
