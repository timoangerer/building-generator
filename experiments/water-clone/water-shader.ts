/**
 * Water shader ported from Cannon Clash (PlayCanvas UranusEffectsWater).
 *
 * Key features:
 *  - Flow-map–driven normal animation (two phase-offset samples blended)
 *  - Depth-based opacity, caustics, shore foam lines
 *  - Fresnel reflection/refraction blend
 *  - Specular highlights with blinking
 *  - Vertex wave displacement
 */

export const waterVertexShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uWaterScale;
uniform float uWavesFrequency;
uniform float uWavesAmplitude;
uniform vec2  uWavesDepthMinMax;
uniform sampler2D uCausticsMap;

varying vec2  vWaterUV;
varying vec3  vWorldPos;
varying vec3  vViewDir;
varying float vVertexDepth;
varying vec3  vNormalW;
varying vec4  vScreenPos;

void main() {
  // World position
  vec4 worldPos = modelMatrix * vec4(position, 1.0);

  // Water UV from world XZ, tiled by waterScale
  vWaterUV = worldPos.xz / uWaterScale;

  // Vertex waves using cos/sin displacement
  float base = texture2D(uCausticsMap, uv).r;
  float depthFactor = uWavesDepthMinMax.y;
  float waveY = cos(worldPos.x * uWavesFrequency * base + uTime)
              * sin(worldPos.z * uWavesFrequency * base + uTime)
              * uWavesAmplitude * depthFactor;
  worldPos.y += waveY;

  // Recompute normal from wave displacement (finite differences)
  vec3 p0 = worldPos.xyz;
  vec3 p1 = p0 + vec3(0.5, 0.0, 0.0);
  vec3 p2 = p0 + vec3(0.0, 0.0, 0.5);
  p1.y = (modelMatrix * vec4(position + vec3(0.5, 0.0, 0.0), 1.0)).y
       + cos(p1.x * uWavesFrequency * base + uTime)
       * sin(p1.z * uWavesFrequency * base + uTime)
       * uWavesAmplitude * depthFactor;
  p2.y = (modelMatrix * vec4(position + vec3(0.0, 0.0, 0.5), 1.0)).y
       + cos(p2.x * uWavesFrequency * base + uTime)
       * sin(p2.z * uWavesFrequency * base + uTime)
       * uWavesAmplitude * depthFactor;
  vNormalW = normalize(cross(p2 - p0, p1 - p0));

  vWorldPos = worldPos.xyz;
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  vVertexDepth = clamp(abs(waveY) / max(uWavesAmplitude * depthFactor, 0.001), 0.0, 1.0);

  vec4 clipPos = projectionMatrix * viewMatrix * worldPos;
  vScreenPos = clipPos;
  gl_Position = clipPos;
}
`;

export const waterFragmentShader = /* glsl */ `
precision highp float;

// --- Time & scale
uniform float uTime;
uniform float uWaterScale;

// --- Water base color
uniform vec3 uWaterColor;
uniform vec3 uWaterDeepColor;

// --- Depth & opacity
uniform float uDepthOpacity;

// --- Caustics
uniform sampler2D uCausticsMap;
uniform float uCausticsOpacity;
uniform float uCausticsIntensity;
uniform float uCausticsTiling;

// --- Shore
uniform float uShoreOpacity;
uniform float uShoreIntensity;
uniform float uShoreTiling;
uniform float uShoreFrequency;

// --- Flow map
uniform sampler2D uFlowMap;
uniform float uFlowFrequency;

// --- Normal map (derivative height map)
uniform sampler2D uNormalMap;
uniform float uBumpiness;

// --- Reflections & specular
uniform float uReflectionsIntensity;
uniform vec3  uSpecularColor;
uniform float uSpecularIntensity;
uniform float uSpecularBlinking;

// --- Sky / environment
uniform samplerCube uEnvMap;
uniform vec3 uSunDirection;
uniform vec3 uSunColor;

// --- Depth texture (for shore/caustics)
uniform sampler2D uDepthTexture;
uniform vec2 uResolution;
uniform float uCameraNear;
uniform float uCameraFar;

varying vec2  vWaterUV;
varying vec3  vWorldPos;
varying vec3  vViewDir;
varying float vVertexDepth;
varying vec3  vNormalW;
varying vec4  vScreenPos;

// --- Flow UV helper (ported from PlayCanvas)
vec3 FlowUVW(vec2 uv, vec2 flowVector, vec2 jump,
             float flowOffset, float tiling, float time, bool flowB) {
  float phaseOffset = flowB ? 0.5 : 0.0;
  float progress = fract(time + phaseOffset);
  vec3 uvw;
  uvw.xy = uv - flowVector * (progress + flowOffset);
  uvw.xy *= tiling;
  uvw.xy += phaseOffset;
  uvw.xy += (time - progress) * jump;
  uvw.z = 1.0 - abs(1.0 - 2.0 * progress);
  return uvw;
}

// Unpack derivative height from texture (agb channels)
vec3 UnpackDerivativeHeight(vec4 textureData) {
  vec3 dh = textureData.agb;
  dh.xy = dh.xy * 2.0 - 1.0;
  return dh;
}

float linearizeDepth(float d) {
  float z = d * 2.0 - 1.0;
  return (2.0 * uCameraNear * uCameraFar) / (uCameraFar + uCameraNear - z * (uCameraFar - uCameraNear));
}

void main() {
  vec2 screenUV = gl_FragCoord.xy / uResolution;

  // --- Depth-based effects
  float sceneDepthRaw = texture2D(uDepthTexture, screenUV).r;
  float sceneDepth = linearizeDepth(sceneDepthRaw);
  float waterLinearDepth = linearizeDepth(gl_FragCoord.z);
  float depthDiff = max(sceneDepth - waterLinearDepth, 0.0);

  // Normalize depth difference to reasonable range
  float depthNorm = depthDiff / uCameraFar;

  float dWaterDepth    = clamp(pow(depthNorm * uDepthOpacity * 50.0, 0.5), 0.0, 1.0);
  float dWaterCaustics = 1.0 - clamp(pow(depthNorm * uCausticsOpacity * 50.0, 0.5), 0.0, 1.0);
  float dWaterShore    = 1.0 - clamp(pow(depthNorm * uShoreOpacity * 50.0, 0.5), 0.0, 1.0);

  // --- Flow map based normal calculation
  vec2 normalMapPos = vWaterUV;

  vec3 flowSampler = texture2D(uFlowMap, normalMapPos * 0.1).rgb;
  vec3 flow = vec3(flowSampler.xy * 2.0 - 1.0, 0.0) * 0.1;
  float noise = flowSampler.b;
  float flowTime = uTime * uFlowFrequency + noise;
  vec2 jump = vec2(0.24, 0.20);

  vec3 uvwA = FlowUVW(normalMapPos, flow.xy, jump, 0.0, 3.0, flowTime, false);
  vec3 uvwB = FlowUVW(normalMapPos, flow.xy, jump, 0.0, 3.0, flowTime, true);

  float normalBumpiness = uBumpiness;
  float finalHeightScale = (flow.z * 9.0 + normalBumpiness) * max(dWaterDepth, 0.3);

  vec3 dhA = UnpackDerivativeHeight(texture2D(uNormalMap, uvwA.xy)) * (uvwA.z * finalHeightScale);
  vec3 dhB = UnpackDerivativeHeight(texture2D(uNormalMap, uvwB.xy)) * (uvwB.z * finalHeightScale);

  vec3 normalMapVal = normalize(vec3(-(dhA.xy + dhB.xy), 1.0));

  // Blend with vertex normal
  vec3 N = normalize(vNormalW + normalMapVal * 0.5);
  vec3 V = normalize(vViewDir);

  // --- Fresnel (Schlick approximation)
  float NdotV = max(dot(N, V), 0.0);
  float fresnelTerm = pow(1.0 - NdotV, 3.0) * 0.7 + 0.1;
  fresnelTerm = clamp(fresnelTerm, 0.0, 1.0);

  // --- Caustics
  vec2 normalPos = dhA.xy + dhB.xy;
  vec2 shorePos = normalPos + vWaterUV;
  float shoreSample = texture2D(uCausticsMap, shorePos * 0.5).r;
  vec2 causticsPos = shoreSample * dWaterDepth
                   + (cos(uTime) + sin(uTime)) * 0.05
                   + normalPos + vWaterUV * uCausticsTiling;
  float causticsSample = texture2D(uCausticsMap, causticsPos).a;
  vec3 causticsColor = vec3(causticsSample) * uCausticsIntensity * dWaterCaustics * 0.15;

  // --- Shore foam
  float shoreAnim = sin((dWaterShore - uTime * uShoreFrequency) * uShoreTiling) - shoreSample
                  + cos((dWaterShore - uTime * uShoreFrequency) * uShoreTiling) - shoreSample;
  float shoreColor = dWaterShore * clamp(shoreAnim, 0.0, 1.0) * uShoreIntensity * 0.3;

  // --- Environment reflection
  vec3 reflDir = reflect(-V, N);
  vec3 envColor = textureCube(uEnvMap, reflDir).rgb * uReflectionsIntensity;

  // --- Specular (sun highlight)
  vec3 H = normalize(uSunDirection + V);
  float specPow = 256.0;
  float kS = clamp(dot(N, uSunDirection), 0.0, 1.0);
  float spec = kS * pow(clamp(dot(N, H), 0.0, 1.0), specPow) * 2.0;

  // Specular blinking
  float specBlink = 1.0;
  if (uSpecularBlinking > 0.0) {
    specBlink = texture2D(uCausticsMap, vWaterUV * 2.0 + uTime * uSpecularBlinking).a;
  }

  // --- Combine colors
  // Depth-based color: shallow is bright cyan, deep is darker blue-green
  vec3 shallowColor = uWaterColor * 1.3; // boost shallow brightness
  vec3 waterBase = mix(shallowColor, uWaterDeepColor, smoothstep(0.0, 0.8, dWaterDepth));

  // Mix water base with env reflections using fresnel
  vec3 color = mix(waterBase, envColor, fresnelTerm);

  // Add caustics (more visible in shallow water near islands)
  color += causticsColor;

  // Add shore foam (white foam lines near objects)
  vec3 foamColor = vec3(0.9, 0.95, 1.0); // white-ish foam
  color = mix(color, foamColor, shoreColor);

  // Add specular highlight
  color += uSpecularColor * spec * specBlink * 0.5;

  // Sun diffuse
  float NdotL = max(dot(N, uSunDirection), 0.0);
  color *= 0.7 + 0.3 * NdotL;

  // Alpha: transparent at shore edge, opaque in deep water
  // dWaterShore = 1 at shore, 0 in deep water
  float shoreTransparency = dWaterShore * 0.5; // make shoreline semi-transparent
  float alpha = clamp(dWaterDepth * 0.95 + 0.05 - shoreTransparency * 0.3, 0.05, 0.95);

  gl_FragColor = vec4(color, alpha);
}
`;
