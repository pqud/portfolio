// Dark Mode Dew

const fragmentShaderDark = `
uniform float u_intensity;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform float u_colorIntensity1;
uniform float u_colorIntensity2;
uniform float u_colorIntensity3;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vDisplacement;

void main() {
    vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
    vec3 normal = normalize(vNormal);
    
    float diffuse = max(dot(normal, lightDirection), 0.6);
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float fresnel = 1.0 - max(dot(normal, viewDirection), 0.0);
    fresnel = pow(fresnel, 1.5);
    vec3 reflectDir = reflect(-lightDirection, normal);
    float specular = pow(max(dot(viewDirection, reflectDir), 0.0), 32.0);

    // [1] Intensity 기반 세로 영역 계산 (위에서 아래로)
    float totalIntensity = u_colorIntensity1 + u_colorIntensity2 + u_colorIntensity3 + 1e-6;

    // 각 색상의 세로 비율 계산
    float ratio1 = u_colorIntensity1 / totalIntensity;
    float ratio2 = u_colorIntensity2 / totalIntensity;
    float ratio3 = u_colorIntensity3 / totalIntensity;
    
    // 세로 영역 범위 설정 (위에서 아래로: 2.0 ~ -2.0)
    float topY = 2.0;    // 최상단
    float bottomY = -2.0; // 최하단
    float totalHeight = topY - bottomY;
    
    // 누적 경계값 계산 (위에서 아래 순서)
    float boundary1 = topY - ratio1 * totalHeight;           // color1의 하단 경계
    float boundary2 = topY - (ratio1 + ratio2) * totalHeight; // color2의 하단 경계
    // boundary3 = bottomY (color3의 하단 경계)
    
    // 현재 픽셀의 Y 위치
    float pixelY = vPosition.y;
    
    // 시간에 따른 파동 효과 (선택사항)
    float waveSpeed = u_time * 0.3;
    pixelY = pixelY + sin(vPosition.x * 2.0 + waveSpeed) * 0.2;
    
    // [2] 스머징을 위한 부드러운 전환
    float smoothRange = 1.0; // 전환 영역의 크기
    
    // [2] 개선된 스머징: 각 색상 중심 위치 계산 (시간에 따라 움직임 추가)
    float center1 = topY - (ratio1 * 0.5) * totalHeight + sin(vPosition.x * 1.5 + u_time * 0.7) * 0.1;
    float center2 = boundary1 - (ratio2 * 0.5) * totalHeight + cos(vPosition.x * 1.2 + u_time * 0.5) * 0.1;
    float center3 = boundary2 - (ratio3 * 0.5) * totalHeight + sin(vPosition.x * 1.0 - u_time * 0.6) * 0.1;
    
    // 각 색상 중심에 따라 Gaussian 가중치 계산
    float dist1 = abs(pixelY - center1);
    float dist2 = abs(pixelY - center2);
    float dist3 = abs(pixelY - center3);

    float spread = 0.8; // 퍼짐 정도 조절 (낮을수록 영역이 좁고 선명)
    float weight1 = exp(-pow(dist1 / spread, 2.0));
    float weight2 = exp(-pow(dist2 / spread, 2.0));
    float weight3 = exp(-pow(dist3 / spread, 2.0));

    // 가중치 정규화
    float totalWeight = weight1 + weight2 + weight3 + 1e-6;
    weight1 /= totalWeight;
    weight2 /= totalWeight;
    weight3 /= totalWeight;

    // 색상 블렌딩
    vec3 emotionColor = u_color1 * weight1 + u_color2 * weight2 + u_color3 * weight3;

    // [3] 탁함 보정
    // emotionColor = emotionColor * 0.7; // 명도 낮춤
    emotionColor = mix(emotionColor, vec3(0.0), 0.2); // 검정색과 섞어서 어둡게
    emotionColor = pow(emotionColor, vec3(1.3)); // 감마 조정 (1.5보다 약하게)

    // [4] 파면 색상 변동 (밝게 만드는 노이즈 제거)
    float colorNoise = sin(vPosition.x * 6.0 + u_time) * cos(vPosition.y * 2.0 + u_time * 0.7);
    emotionColor = emotionColor * (0.9 + 0.1 * colorNoise); // 곱셈으로 변경

    // [5] 물 색상과 블렌딩 (더 진한 물 색상)
    vec3 waterColor = vec3(0.0, 0.02, 0.1);
    vec3 deepColor = vec3(0.0, 0.0, 0.15);
    vec3 lightWaterColor = mix(waterColor, emotionColor * 0.8, 0.6);
    vec3 deepWaterColor = mix(deepColor, emotionColor * 0.6, 0.5);
    float depth = abs(vDisplacement) * 2.0;
    vec3 baseColor = mix(lightWaterColor, deepWaterColor, depth);

    vec3 diffuseColor = baseColor * diffuse * 0.6; // 조명 강도 낮춤
    vec3 ambientColor = lightWaterColor * 1.3; // 환경광 낮춤
    vec3 fresnelColor = vec3(1.0) * fresnel * 0.8; // 프레넬 효과 낮춤
    vec3 specularColor = vec3(1.0) * specular * 0.8; // 반사광 낮춤
    vec3 rippleColor = mix(vec3(0.6, 0.7, 0.8), emotionColor, 0.4) * abs(vDisplacement) * 0.2;

    // [6] 최종 색상 (밝기 보정 제거)
    vec3 finalColor = ambientColor + diffuseColor + fresnelColor + specularColor + rippleColor;
    
    // 색상을 더 진하게 만들기
    float alpha = 0.7 + fresnel * 0.2 + abs(vDisplacement) * 0.3;
    alpha = clamp(alpha, 0.4, 0.9);

    float timeVariation = sin(u_time * 0.4) * 0.05 + 0.95;
    finalColor *= timeVariation;

    gl_FragColor = vec4(finalColor, alpha);
}
`;

export default fragmentShaderDark;