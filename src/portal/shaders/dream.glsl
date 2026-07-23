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

  // Soft cloud layers
  float cloud = 0.0;
  for (float i = 0.0; i < 4.0; i++) {
    float scale = 2.0 + i * 1.5;
    cloud += hash(floor(vUv * scale + i * 20.0 + uTime * 0.05));
  }
  cloud = smoothstep(0.3, 0.7, cloud / 4.0) * smoothstep(0.5, 0.0, dist);

  // Fireflies
  float firefly = 0.0;
  for (float i = 0.0; i < 8.0; i++) {
    float angle = i * 0.785 + uTime * 0.2;
    float r = 0.2 + 0.12 * sin(uTime * 0.8 + i);
    vec2 p = vec2(cos(angle), sin(angle)) * r;
    float d = length(center - p);
    float flicker = sin(uTime * 3.0 + i * 2.0) * 0.5 + 0.5;
    firefly += smoothstep(0.02, 0.0, d) * flicker;
  }

  // Breathing
  float breathe = sin(uTime * 0.6) * 0.15 + 0.85;

  // Impossible geometry shift
  float shift = sin(dist * 10.0 + uTime * 0.5) * 0.03;

  vec3 color = mix(uColor2, uColor1, cloud * 0.5 + 0.25);
  color += vec3(1.0, 0.95, 0.75) * firefly;

  float alpha = ring * uIntensity * breathe * (0.4 + cloud * 0.4 + firefly * 0.4 + shift);

  gl_FragColor = vec4(color, alpha);
}
