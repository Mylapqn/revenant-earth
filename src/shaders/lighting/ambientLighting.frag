precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;

uniform vec3 uAmbient;


const float logBase = log(6.);

vec3 tonemap(vec3 x) {
    return mix(pow(x, vec3(0.75)), log(x + 0.1) / logBase + 1. - log(1.1) / logBase, min(x, 1.));
}

vec4 demult(vec4 color) {
    return vec4(vec3(color.rgb) / color.a, color.a);
}

void main(void) {
    vec4 sourceColor = demult(texture2D(uSampler, vTextureCoord));
    gl_FragColor = vec4(min(tonemap(sourceColor.rgb * uAmbient), 1.) * sourceColor.a, sourceColor.a);
}
