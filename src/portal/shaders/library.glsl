uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uIntensity;
varying vec2 vUv;
varying vec3 vPosition;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 center = vUv - 0.5;
  float dist = length(center);
  float ring = smoothstep(0.32, 0.38, dist) * smoothstep(0.5, 0.44, dist);

  // Floating particles / magical dust
  float particles = 0.0;
  for (float i = 0.0; i < 12.0; i++) {
    float angle = i * 0.524 + uTime * 0.15;
    float r = 0.15 + 0.15 * sin(uTime * 0.5 + i * 0.8);
    vec2 p = vec2(cos(angle), sin(angle)) * r;
    float d = length(center - p);
    float flicker = sin(uTime * 2.0 + i * 2.0) * 0.5 + 0.5;
    particles += smoothstep(0.025, 0.0, d) * flicker;
  }

  // Warm glow
  float glow = exp(-dist * 3.5) * 0.6;

  // Arcane rune ring
  float rune = 0.0;
  for (float i = 0.0; i < 8.0; i++) {
    float a = i * 0.785;
    float d = abs(atan(center.y, center.x) - a);
    d = min(d, 6.283 - d);
    rune += smoothstep(0.08, 0.0, d) * smoothstep(0.45, 0.35, dist) * smoothstep(0.25, 0.35, dist);
  }

  vec3 color = mix(uColor2, uColor1, glow + particles * 0.4);
  color += vec3(1.0, 0.92, 0.75) * particles;
  color += uColor1 * rune * 0.5;

  float alpha = ring * uIntensity * (0.4 + glow + particles * 0.5 + rune * 0.3);

  gl_FragColor = vec4(color, alpha);
}
