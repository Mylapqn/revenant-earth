#version 300 es

precision mediump float;

in vec2 aVertexPosition;
in vec3 tVertexPosition;
in vec2 aTextureCoord;

uniform mat3 projectionMatrix;
uniform mat4 customProjection;
uniform mat4 customView;

out vec3 vNormal;
out vec2 vScreenTex;

out vec2 vTextureCoord;

void main(void) {
    gl_Position = (customProjection * customView * vec4(tVertexPosition, 1.f));
    vNormal = normalize(customView * vec4(1.f)).xyz;
    vTextureCoord = (vec3(aTextureCoord, 1.f)).xy;
    vScreenTex = (customView * vec4(vTextureCoord, 1.f, 1.f)).xy;
}