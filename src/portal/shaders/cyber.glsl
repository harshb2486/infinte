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

  // Digital grid
  vec2 grid = abs(sin(center * 30.0 + uTime * 0.3));
  float gridLines = smoothstep(0.95, 1.0, max(grid.x, grid.y));

  // Scan lines
  float scanline = smoothstep(0.45, 0.5, abs(sin(vUv.y * 80.0 + uTime * 3.0)));

  // Glitch blocks
  float glitch = step(0.96, hash(vec2(floor(uTime * 8.0), 0.0)));
  float glitchOffset = (hash(vec2(floor(uTime * 30.0), 0.0)) - 0.5) * 0.1;
  vec2 gUv = center + vec2(glitchOffset, 0.0) * glitch;

  // Data stream particles
  float streams = 0.0;
  for (float i = 0.0; i < 6.0; i++) {
    float y = fract(vUv.y * 2.0 + uTime * (0.2 + i * 0.1) + i * 0.3);
    float x = (hash(vec2(i, 0.0)) - 0.5) * 0.4;
    float d = length(gUv - vec2(x, y - 0.5));
    streams += smoothstep(0.02, 0.0, d);
  }

  vec3 color = mix(uColor2, uColor1, gridLines);
  color += uColor1 * streams * 0.5;
  color += vec3(0.9, 0.95, 1.0) * scanline * 0.15;

  float alpha = ring * uIntensity * (0.3 + gridLines * 0.5 + streams * 0.4 + glitch * 0.2);

  gl_FragColor = vec4(color, alpha);
}
