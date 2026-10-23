export const dewVertex = `
uniform sampler2D u_simTex;
uniform float u_intensity;
uniform float u_time;

varying vec2  vUv;
varying vec3  vNormal;
varying float vDisplacement;
varying vec3  vWorldPosition;

// --- Perlin noise (micro-surface detail) ---

vec4 permute(vec4 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
}

vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

vec3 fade(vec3 t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float cnoise(vec3 P) {
    vec3 Pi0 = floor(P);
    vec3 Pi1 = Pi0 + vec3(1.0);
    Pi0 = mod(Pi0, 289.0);
    Pi1 = mod(Pi1, 289.0);
    vec3 Pf0 = fract(P);
    vec3 Pf1 = Pf0 - vec3(1.0);
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;
    vec4 ixy  = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 / 7.0;
    vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 / 7.0;
    vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
    vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
    vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
    vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
    vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
    vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
    vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
    vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(dot(g000,g000), dot(g010,g010), dot(g100,g100), dot(g110,g110)));
    g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001,g001), dot(g011,g011), dot(g101,g101), dot(g111,g111)));
    g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    vec3 fade_xyz = fade(Pf0);
    vec4 n_z  = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    return mix(n_yz.x, n_yz.y, fade_xyz.x);
}

void main() {
    vUv = uv;
    vec3 sp   = normalize(position);
    float slow = u_time * 0.32;

    float h = texture2D(u_simTex, uv).r;
    h += 0.15 * max(h, 0.0) * h;
    h += cnoise(sp * 4.5  + vec3(slow))        * 0.028
       + cnoise(sp * 10.0 + vec3(slow * 1.3)) * 0.010;
    h += sin(u_time * 1.1) * 0.022 + sin(u_time * 0.45 + 1.3) * 0.014;

    vDisplacement = h;

    float scale  = u_intensity * 0.09;
    vec3  newPos = position + normal * h * scale;

    // Pass geometric normal only — fragment shader handles fine normal detail
    vNormal        = normalize(normalMatrix * normal);
    vWorldPosition = (modelMatrix * vec4(newPos, 1.0)).xyz;
    gl_Position    = projectionMatrix * viewMatrix * modelMatrix * vec4(newPos, 1.0);
}
`

export const dewFragment = `
uniform sampler2D u_simTex;
uniform float u_intensity;
uniform float u_time;

varying vec2  vUv;
varying vec3  vNormal;
varying float vDisplacement;
varying vec3  vWorldPosition;

void main() {
    // --- Per-pixel normal from simulation texture gradient ---
    // Wide-kernel central difference: smoother than vertex-level, no staircase
    float kr  = 4.0 / 256.0;
    float kr2 = 9.0 / 256.0;
    float kr3 = 16.0 / 256.0;

    float hL1 = texture2D(u_simTex, vec2(mod(vUv.x - kr  + 1.0, 1.0), vUv.y)).r;
    float hR1 = texture2D(u_simTex, vec2(mod(vUv.x + kr,         1.0), vUv.y)).r;
    float hL2 = texture2D(u_simTex, vec2(mod(vUv.x - kr2 + 1.0, 1.0), vUv.y)).r;
    float hR2 = texture2D(u_simTex, vec2(mod(vUv.x + kr2,        1.0), vUv.y)).r;
    float hL3 = texture2D(u_simTex, vec2(mod(vUv.x - kr3 + 1.0, 1.0), vUv.y)).r;
    float hR3 = texture2D(u_simTex, vec2(mod(vUv.x + kr3,        1.0), vUv.y)).r;
    float hD1 = texture2D(u_simTex, vec2(vUv.x, max(vUv.y - kr,  kr))).r;
    float hU1 = texture2D(u_simTex, vec2(vUv.x, min(vUv.y + kr,  1.0 - kr))).r;
    float hD2 = texture2D(u_simTex, vec2(vUv.x, max(vUv.y - kr2, kr2))).r;
    float hU2 = texture2D(u_simTex, vec2(vUv.x, min(vUv.y + kr2, 1.0 - kr2))).r;
    float hD3 = texture2D(u_simTex, vec2(vUv.x, max(vUv.y - kr3, kr3))).r;
    float hU3 = texture2D(u_simTex, vec2(vUv.x, min(vUv.y + kr3, 1.0 - kr3))).r;

    float dX = (hR1 - hL1) * 0.50 + (hR2 - hL2) * 0.35 + (hR3 - hL3) * 0.15;
    float dY = (hU1 - hD1) * 0.50 + (hU2 - hD2) * 0.35 + (hU3 - hD3) * 0.15;

    vec3 N = normalize(vNormal);
    vec3 tangX = normalize(cross(N, vec3(0.0, 1.0, 0.0)));
    if (abs(N.y) > 0.97) tangX = normalize(cross(N, vec3(1.0, 0.0, 0.0)));
    vec3 tangY = normalize(cross(N, tangX));

    float latScale = max(sin(vUv.y * 3.14159), 0.12);
    float normStr  = u_intensity * 0.45;
    vec3  normal   = normalize(N - (tangX * (dX / latScale) + tangY * dY) * normStr);

    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float NdotV  = max(dot(normal, viewDir), 0.0);

    // --- Fresnel ---
    float fresnel = pow(1.0 - NdotV, 4.0);

    // --- 주 광원 ---
    vec3  lightDir = normalize(vec3(2.5, 2.0, 0.3));
    float NdotL    = max(dot(normal, lightDir), 0.0);

    vec3  halfVec   = normalize(lightDir + viewDir);
    float NdotH     = max(dot(normal, halfVec), 0.0);
    float specSharp = pow(NdotH, 120.0);
    float specWide  = pow(NdotH, 22.0) * 0.14;

    // --- 2톤 컬러 ---
    vec3 colorTop    = vec3(0.82, 0.74, 1.00);
    vec3 colorBottom = vec3(0.68, 0.85, 1.00);

    float py = vWorldPosition.y
             + sin(vWorldPosition.x * 2.2 + u_time * 0.5) * 0.18
             + cos(vWorldPosition.z * 1.8 - u_time * 0.35) * 0.12
             + vDisplacement * 0.25;

    float t = smoothstep(-0.6, 0.6, py);
    vec3 baseColor = mix(colorBottom, colorTop, t);

    // --- 자체 발광 ---
    float ripplePulse  = clamp(vDisplacement * 2.0 + 0.6, 0.0, 0.5);
    float emitStrength = 0.60 + ripplePulse * 0.10;
    vec3  emitColor    = mix(baseColor, vec3(1.0), 0.20) * emitStrength;

    // --- 림 라이트 ---
    vec3 rimColor = mix(vec3(0.60, 0.45, 1.0), baseColor, 0.2);

    // --- 코스틱 ---
    float caustic = pow(clamp(vDisplacement * 1.0 + 0.4, 0.0, 1.0), 2.5) * 0.18;

    // --- 파면 크레스트 섬광 ---
    float breakMask = clamp((vDisplacement - 0.25) * 3.5, 0.0, 1.0);
    vec3  breakColor = mix(baseColor, vec3(1.0), breakMask * 0.85);

    vec3 color =
          baseColor * (NdotL * 0.18)
        + baseColor * caustic
        + emitColor
        + rimColor * fresnel * 1.2
        + vec3(0.85, 0.80, 1.0) * specSharp * 0.9
        + vec3(0.80, 0.85, 1.0) * specWide
        + breakColor * breakMask * 0.65;

    color *= 0.97 + 0.03 * sin(u_time * 0.9);

    gl_FragColor = vec4(color, 0.96);
}
`
