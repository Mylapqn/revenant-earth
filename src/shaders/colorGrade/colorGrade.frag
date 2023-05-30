#version 300 es

precision mediump float;
in vec2 vTextureCoord;
uniform sampler2D uSampler;

out vec4 color;

const float logBase = log(6.);

vec3 tonemap(vec3 x) {
    return mix(pow(x, vec3(0.75)), log(x + 0.1) / logBase + 1. - log(1.1) / logBase, min(x, 1.));
}

float luma(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
}

mat4 brightnessMatrix( float brightness )
{
    return mat4( 1, 0, 0, 0,
                 0, 1, 0, 0,
                 0, 0, 1, 0,
                 brightness, brightness, brightness, 1 );
}

mat4 contrastMatrix( float contrast )
{
	float t = ( 1.0 - contrast ) / 2.0;
    
    return mat4( contrast, 0, 0, 0,
                 0, contrast, 0, 0,
                 0, 0, contrast, 0,
                 t, t, t, 1 );

}

mat4 saturationMatrix( float saturation )
{
    vec3 luminance = vec3( 0.3086, 0.6094, 0.0820 );
    
    float oneMinusSat = 1.0 - saturation;
    
    vec3 red = vec3( luminance.x * oneMinusSat );
    red+= vec3( saturation, 0, 0 );
    
    vec3 green = vec3( luminance.y * oneMinusSat );
    green += vec3( 0, saturation, 0 );
    
    vec3 blue = vec3( luminance.z * oneMinusSat );
    blue += vec3( 0, 0, saturation );
    
    return mat4( red,     0,
                 green,   0,
                 blue,    0,
                 0, 0, 0, 1 );
}

void main(void) {
    vec4 sourceColor = (texture(uSampler, vTextureCoord));
    vec3 rgb = sourceColor.rgb;
    float val = luma(rgb);
    color = vec4(vec3(rgb + vec3(1., .6, 0.) * val + vec3(1., 0., 0.) * (1. - val)) / 2., sourceColor.a);
    color = sourceColor;

}
