#version 300 es

precision mediump float;
in vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D uLightMap;

uniform vec3 uAmbient;

out vec4 color;

const float logBase = log(6.);

vec3 tonemap(vec3 x) {
    return mix(pow(x, vec3(0.75)), log(x + 0.1) / logBase + 1. - log(1.1) / logBase, min(x, 1.));
}

vec4 demult(vec4 color) {
    return vec4(vec3(color.rgb) / color.a, color.a);
}

void main(void) {
    vec4 sourceColor = demult(texture(uSampler, vTextureCoord));
    vec4 lightMap = texture(uLightMap, vTextureCoord);
    color = vec4(min(tonemap(sourceColor.rgb * (lightMap.rgb + uAmbient)), 1.) * sourceColor.a, sourceColor.a);

}
