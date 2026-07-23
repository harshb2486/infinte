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

  // Fading to infinity
  float fade = smoothstep(0.0, 0.5, dist);

  // Subtle light shimmer
  float shimmer = sin(dist * 40.0 + uTime * 1.5) * 0.03 + 0.97;

  // Dissolution particles
  float particles = 0.0;
  for (float i = 0.0; i < 16.0; i++) {
    float t = fract(uTime * 0.2 + i * 0.13);
    vec2 p = normalize(vec2(hash(vec2(i, 0.0)) - 0.5, hash(vec2(0.0, i)) - 0.5));
    p *= t * 0.45;
    float d = length(center - p);
    particles += smoothstep(0.015, 0.0, d) * (1.0 - t);
  }

  vec3 color = mix(vec3(1.0), uColor1, fade * 0.25);
  color *= shimmer;
  color += vec3(0.95) * particles;

  float alpha = ring * uIntensity * (0.2 + fade * 0.5 + particles * 0.3);

  gl_FragColor = vec4(color, alpha);
}
