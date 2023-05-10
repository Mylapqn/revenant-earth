#version 300 es

precision mediump float;
in vec2 vTextureCoord;
uniform sampler2D terrain;
uniform sampler2D colorMap;
out vec4 color;
void main(void) {
    float index = texture(terrain, vTextureCoord).a;
    int i = int(index * 255.);
    color = texelFetch(colorMap, ivec2(i % 16, i / 16), 0);
}