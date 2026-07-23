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

  // Star field
  float stars = 0.0;
  for (float i = 0.0; i < 32.0; i++) {
    vec2 p = vec2(hash(vec2(i, 0.0)), hash(vec2(0.0, i))) * 0.6 - 0.3;
    float d = length(center - p);
    float twinkle = sin(uTime * 2.0 + i * 1.7) * 0.5 + 0.5;
    stars += smoothstep(0.015, 0.0, d) * twinkle;
  }

  // Gravitational pull
  float pull = 1.0 / (dist * 8.0 + 0.3);
  pull = clamp(pull, 0.0, 1.0);
  pull *= pull;

  // Spiral galaxy
  float angle = atan(center.y, center.x);
  float galaxy = sin(angle * 5.0 + dist * 25.0 - uTime * 0.5) * 0.5 + 0.5;
  galaxy *= smoothstep(0.5, 0.0, dist);

  vec3 color = mix(uColor2, uColor1, pull);
  color += vec3(1.0, 0.95, 0.9) * stars * ring;
  color += uColor1 * galaxy * 0.5;

  float alpha = ring * uIntensity * (0.3 + pull * 0.7 + galaxy * 0.3);

  gl_FragColor = vec4(color, alpha);
}
