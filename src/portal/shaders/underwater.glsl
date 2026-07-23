uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uIntensity;
varying vec2 vUv;
varying vec3 vPosition;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  vec2 center = vUv - 0.5;
  float dist = length(center);
  float ring = smoothstep(0.32, 0.38, dist) * smoothstep(0.5, 0.44, dist);

  // Spiral water vortex
  float angle = atan(center.y, center.x);
  float spiral = sin(angle * 3.0 + dist * 15.0 - uTime * 1.5) * 0.5 + 0.5;

  // Turbulent water surface
  float n = noise(vUv * 6.0 + vec2(0.0, uTime * 0.3));
  float n2 = noise(vUv * 12.0 - vec2(0.0, uTime * 0.5));

  // Bubble particles
  float bubbles = 0.0;
  for (float i = 0.0; i < 8.0; i++) {
    float t = uTime * 0.5 + i * 0.7;
    vec2 p = vec2(cos(t * 0.7 + i), sin(t * 0.5 + i)) * 0.25;
    float d = length(center - p);
    bubbles += smoothstep(0.04, 0.0, d) * (0.5 + 0.5 * sin(t * 3.0));
  }

  vec3 color = mix(uColor2, uColor1, spiral * 0.7 + n * 0.3);
  color += vec3(0.85, 0.9, 0.9) * bubbles * ring;

  float alpha = ring * uIntensity * (0.4 + spiral * 0.4 + n2 * 0.2);

  gl_FragColor = vec4(color, alpha);
}
