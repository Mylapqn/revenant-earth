#version 300 es

precision mediump float;
in vec2 vTextureCoord;
uniform sampler2D background;
uniform sampler2D terrain;
uniform vec4 viewport;
uniform float tick;
out vec4 color;

float hash(vec2 p)  // TODO replace this by something better
{
    p = 50.0f * fract(p * 0.3183099f + vec2(0.71f, 0.113f));
    return -1.0f + 2.0f * fract(p.x * p.y * (p.x + p.y));
}

float noise(in vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    vec2 u = f * f * (3.0f - 2.0f * f);

    return mix(mix(hash(i + vec2(0.0f, 0.0f)), hash(i + vec2(1.0f, 0.0f)), u.x), mix(hash(i + vec2(0.0f, 1.0f)), hash(i + vec2(1.0f, 1.0f)), u.x), u.y);
}

vec2 globPos(vec2 p) {
    return (viewport.xy + vec2(p.x * viewport.z, -p.y * viewport.w));
}

void main() {
    vec2 globalPos = (viewport.xy + vec2(vTextureCoord.x * viewport.z, -vTextureCoord.y * viewport.w));
    vec2 coord = vTextureCoord;
    for(int i = 1; i < 50; i++) {
        //coord -= (vTextureCoord - .5f) * (.1f + noise(globPos((vTextureCoord - (vTextureCoord - .5f) * .001f * float(i))*.02*float(i))) * .01f);
        coord -= (vTextureCoord - .5f) * (.01f);
        coord.y -= 0.001f;
        coord.y += noise(vec2(float(i) * .3f, 0)) * 0.012f;
        float alpha = texture(terrain, coord).a;
        float stepAlpha = step(.1f, alpha);
        color = mix(color, vec4(.7f - float(i) * .008f, .3f - float(i) * .002f, .3f - float(i) * .006f, 1.f), stepAlpha);
        if(texture(terrain, coord + vec2(0.01f, 0)).a < alpha) {
            color.rgb *= .8f;
        }
        if(texture(terrain, coord + vec2(-0.01f, -.01f)).a > alpha) {
            color.rgb *= .8f;
        }
    }
}