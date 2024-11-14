#version 300 es

precision mediump float;

in vec2 aVertexPosition;
in vec2 aTextureCoord;

uniform mat3 projectionMatrix;

out vec2 vTextureCoord;

void main(void) {
    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.f)), 1.f);

    vTextureCoord = (vec3(aTextureCoord, 1.f)).xy;
}