precision mediump float;
varying vec2 vFragCoord;
uniform sampler2D uSampler;
uniform highp vec4 inputSize;
uniform vec4 filterClamp;

uniform float uAlpha;
uniform vec4 uColor;
uniform bool uKnockout;
uniform float uAngle;
uniform vec2 uLightPos;
uniform float uIntensity;

const float DOUBLE_PI = 2. * 3.14159265358979323846264;
const float MAX_ANGLE = .5;
const float ANGLE_STEP = 0.1;
const float DEPTH_STEPS = 4.;

float outlineMaxAlphaAtPos(vec4 sourceColor) {
    vec4 displacedColor;
    vec2 displacedPos;
    float maxAlpha = 0.;

    vec2 off = uLightPos - vFragCoord;
    float dis = length(off);

    float lightAngle = atan(off.y, off.x);
    //vec2 totalOffset = uThickness * sgn * max(uPixelSize * 500., abs);
    for(float angleOffset = -MAX_ANGLE; angleOffset <= MAX_ANGLE; angleOffset += ANGLE_STEP) {
        for(float i = 0.0; i < DEPTH_STEPS+.1; i += 1.) {
            float distanceOffset = min(i, dis);
            float angle = lightAngle + angleOffset - asin(distanceOffset * sin(angleOffset) / dis);

            displacedPos = (vFragCoord + vec2(distanceOffset * cos(angle), distanceOffset * sin(angle))) * inputSize.zw;
            displacedColor = texture2D(uSampler, clamp(displacedPos, filterClamp.xy, filterClamp.zw));
            maxAlpha = max(maxAlpha, (sourceColor.a - displacedColor.a) * (1.-abs(angleOffset/MAX_ANGLE)));
        }
    }

    return maxAlpha;
}

void main(void) {
    vec4 sourceColor = texture2D(uSampler, vFragCoord * inputSize.zw);
    vec4 contentColor = sourceColor * float(!uKnockout);
    float outlineAlpha = uAlpha * outlineMaxAlphaAtPos(sourceColor);
    vec4 outlineColor = vec4(vec3(uColor) * outlineAlpha, 0.);
    gl_FragColor = contentColor + outlineColor*uIntensity;
}
