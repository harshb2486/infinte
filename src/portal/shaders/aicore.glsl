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

  // Neural pulses along dendrites
  float pulse = 0.0;
  for (float i = 0.0; i < 10.0; i++) {
    float angle = i * 0.628;
    float d = abs(atan(center.y, center.x) - angle);
    d = min(d, 6.283 - d);
    float wave = sin(dist * 25.0 - uTime * 4.0 + i * 0.8) * 0.5 + 0.5;
    pulse += smoothstep(0.06, 0.0, d) * wave;
  }

  // Synapse flashes
  float synapse = 0.0;
  for (float i = 0.0; i < 8.0; i++) {
    vec2 p = vec2(hash(vec2(i, 0.0)), hash(vec2(0.0, i))) * 0.6 - 0.3;
    float d = length(center - p);
    float flash = step(0.92, hash(vec2(i, floor(uTime * 3.0))));
    synapse += smoothstep(0.04, 0.0, d) * flash;
  }

  // Data streams
  float streams = smoothstep(0.97, 1.0, hash(vec2(floor(vUv.x * 30.0), floor(vUv.y * 30.0 + uTime * 8.0))));

  vec3 color = mix(uColor2, uColor1, pulse * 0.5 + synapse * 0.3 + streams * 0.2);
  color += vec3(0.8, 0.92, 1.0) * streams;

  float alpha = ring * uIntensity * (0.35 + pulse * 0.45 + synapse * 0.4 + streams * 0.15);

  gl_FragColor = vec4(color, alpha);
}
