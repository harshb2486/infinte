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

  // Circuit board trace pattern
  float trace = 0.0;
  for (float i = 0.0; i < 8.0; i++) {
    float y = (hash(vec2(i, 0.0)) - 0.5) * 0.5;
    float xDir = step(0.5, hash(vec2(0.0, i))) * 2.0 - 1.0;
    float x = (fract(vUv.x * 3.0 + uTime * (0.1 + i * 0.05) * xDir) - 0.5) * 0.6;
    float d = abs(center.y - y);
    trace += smoothstep(0.015, 0.0, d) * step(0.0, x * xDir);
  }

  // Data pulse traveling along traces
  float pulse = 0.0;
  for (float i = 0.0; i < 5.0; i++) {
    float t = fract(uTime * 0.3 + i * 0.2);
    float y = (hash(vec2(i, 0.0)) - 0.5) * 0.5;
    float d = length(center - vec2((t - 0.5) * 0.8, y));
    pulse += smoothstep(0.03, 0.0, d);
  }

  // Binary grid
  float binary = step(0.7, hash(floor(vUv * 16.0) + floor(uTime * 4.0)));

  vec3 color = mix(uColor2, uColor1, trace + pulse * 0.5);
  color += vec3(0.0, 0.8, 0.4) * binary * 0.15;

  float alpha = ring * uIntensity * (0.3 + trace * 0.5 + pulse * 0.5 + binary * 0.1);

  gl_FragColor = vec4(color, alpha);
}
