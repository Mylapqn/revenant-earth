#version 300 es

precision mediump float;
in vec2 vTextureCoord;
uniform sampler2D terrain;
uniform sampler2D colorMap;
uniform sampler2D render;
uniform sampler2D uLightmap;
uniform vec4 viewport;
uniform float tick;
uniform vec2 sunPos;
uniform float sunStrength;
uniform vec3 ambient;
out vec4 color;

float threshold(float x, float threshold) {
    if(x >= threshold) {
        return 1.;
    }
    return 0.;
}

vec3 hash3(vec2 p) {
    vec3 q = vec3(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)), dot(p, vec2(419.2, 371.9)));
    return fract(sin(q) * 43758.5453);
}

vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 18.5453);
}

float hash(vec2 p)  // replace this by something better
{
    p = 50.0 * fract(p * 0.3183099 + vec2(0.71, 0.113));
    return -1.0 + 2.0 * fract(p.x * p.y * (p.x + p.y));
}

float voronoi(in vec2 x) {
    vec2 n = floor(x);
    vec2 f = fract(x);
    vec2 mr;
    float m = 8.0;
    float md = 8.0;
    for(int j = -1; j <= 1; j++) for(int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j));
            vec2 o = hash2(n + g);
            vec2 r = g + o - f;
            float d = dot(r, r);
            if(d < m) {
                m = d;
                mr = r;
            }
        }
    //SECOND PASS
    for(int j = -1; j <= 1; j++) for(int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j));
            vec2 o = hash2(n + g);
            vec2 r = g + o - f;
            md = min(md, dot(0.5 * (mr + r), normalize(r - mr)));
        }

    return sqrt(md);
}

float noise(in vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float octaveNoise(in vec2 uv) {

    float f = 0.0;

    uv *= 8.0;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    f = 0.5000 * noise(uv);
    uv = m * uv;
    f += 0.2500 * noise(uv);
    uv = m * uv;
    f += 0.1250 * noise(uv);
    uv = m * uv;
    f += 0.0625 * noise(uv);
    uv = m * uv;

    f = 0.5 + 0.5 * f;
    return f;
}

float posterise(float x, float steps) {
    return floor((x) * steps) / steps;
}

vec4 renderTexture(vec2 uv) {
    vec4 t = texture(render, uv);
    t += vec4(1.) * (1. - t.a);
    return t;
}

void main(void) {
    vec3 lightmap = texture(uLightmap, vTextureCoord).rgb;
    float index = texture(terrain, vTextureCoord).a;
    vec2 globalPos = (viewport.xy + vec2(vTextureCoord.x * viewport.z, -vTextureCoord.y * viewport.w));
    vec2 gPosScaled = globalPos * .02;
    int i = int(index * 255.);
    vec4 modify = vec4(0);
    //color = texture(lightmap, vTextureCoord) * vec4(vec3(.1), 1.);
    //return;
    if(i == 0) {
        color = vec4(lightmap * .1, .005);
        return;
    } else if(i == 1 || i == 2 || i == 3) {

        modify.a = 1.;
        vec2 off = sunPos - vTextureCoord;
        float lightAngle = atan(off.y, off.x);
        float dis = length(off);
        vec2 refractionUv = vTextureCoord + vTextureCoord * 0.03 * ((octaveNoise(gPosScaled * .3 + tick / 1000.) - .5) * 2.);
        vec3 lightmapRefract = texture(uLightmap, refractionUv).rgb;
        color = vec4(vec3(.7, .9, 1.) * (renderTexture(refractionUv).rgb + lightmapRefract * lightmapRefract * .1 * vec3(.2, .9, 1.)), 1.);
        color += vec4(clamp(vec3(1., .8, .6) *
            vec3(sunStrength * .2 *
            clamp(min(min((1. - dis * .8) * .3, (dis - .1) * .3), (vTextureCoord.y - sunPos.y)) * 10., 0., 1.) *
            posterise(max(0., noise(vec2(lightAngle * .035 * viewport.z - viewport.x / viewport.z * 15., tick / 180.)) + 1.), 3.)), 0., 1.), 0.);
        //for(float i = 0.; i <= 6. + 2. * (noise(vec2(globalPos.x * .05, tick / 80.)) + 1.); i++) {
        for(float i = 0.; i <= min(20., 3. + 18. * abs(vTextureCoord.y - .22)); i++) {
            vec2 displacedPos = vec2(vTextureCoord.x, vTextureCoord.y - (1. / viewport.w) * i * 1.);
            float di = texture(terrain, displacedPos).a;
            int d = int(di * 255.);
            if(d > 3)
                break;
            if(d == 0) {
                float waves = noise(vec2(globalPos.x * .2, globalPos.y * 3. + tick / 80.));
                vec2 reflectionUv = vec2(vTextureCoord.x + waves * .005, vTextureCoord.y - (1. / viewport.w) * i * 2.);
                float ri = texture(terrain, reflectionUv).a;
                int r = int(ri * 255.);
                if(r == 0) {
                    vec3 lightmapReflect = texture(uLightmap, reflectionUv).rgb;
                    color = mix(color, renderTexture(reflectionUv), .9);
                    color += vec4(vec3(1., .8, .6) * (posterise(clamp(sunStrength, 0., .5) * 2. * pow(1. - abs(sunPos.x - vTextureCoord.x + waves * .04), 40.), 5.) + .02), 1.);
                    color += vec4(lightmapReflect * .2, .0);
                    return;
                }
            }
        }
        return;
    } else if(i == 128) {
        float n = (octaveNoise(gPosScaled * .3) - .5) * 2.;
        float f = voronoi(gPosScaled * 2. + n * .4);

        modify.rgb += (1. - threshold(mix(1., f, n * .4 + .9), .15)) * vec3(.4, .8, .9) * -.08;
    }

    color = texelFetch(colorMap, ivec2(i % 16, i / 16), 0) + modify;
    color *= vec4(ambient * .5 + lightmap, 1.);
}