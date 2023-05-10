#version 300 es

precision mediump float;
in vec2 vTextureCoord;
uniform sampler2D terrain;
uniform sampler2D colorMap;
uniform sampler2D render;
uniform vec4 viewport;
uniform float tick;
out vec4 color;

vec3 hash3(vec2 p) {
    vec3 q = vec3(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)), dot(p, vec2(419.2, 371.9)));
    return fract(sin(q) * 43758.5453);
}

float voronoise(in vec2 p, float u, float v) {
    float k = 1.0 + 63.0 * pow(1.0 - v, 6.0);

    vec2 i = floor(p);
    vec2 f = fract(p);

    vec2 a = vec2(0.0, 0.0);
    for(int y = -2; y <= 2; y++) for(int x = -2; x <= 2; x++) {
            vec2 g = vec2(x, y);
            vec3 o = hash3(i + g) * vec3(u, u, 1.0);
            vec2 d = g - f + o.xy;
            float w = pow(1.0 - smoothstep(0.0, 1.414, length(d)), k);
            a += vec2(o.z * w, w);
        }

    return a.x / a.y;
}

void main(void) {
    float index = texture(terrain, vTextureCoord).a;
    int i = int(index * 255.);
    vec4 modify = vec4(0);

    if(i == 1 || i == 2 || i == 3) {
        modify.a = 1.;
        color = vec4(texture(render, vTextureCoord + vTextureCoord * 0.03 * (sin(tick/100. + (vTextureCoord.x-0.5)*5.))).rgb, 1.);
        return;
    } else if(i == 128) {

        float f = voronoise((viewport.xy + vec2(vTextureCoord.x * viewport.z, -vTextureCoord.y * viewport.w)) * 0.1, 1., 0.);
        modify.rgb += abs(f) / 10.;
    }

    color = texelFetch(colorMap, ivec2(i % 16, i / 16), 0) + modify;
}