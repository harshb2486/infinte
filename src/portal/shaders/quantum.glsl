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

  // Iridescent rainbow shift
  float hue = fract(atan(center.y, center.x) / 6.283 + dist * 2.0 - uTime * 0.08);
  vec3 rainbow = 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + hue));

  // Probability cloud diffusion
  float cloud = 0.0;
  for (float i = 0.0; i < 5.0; i++) {
    float scale = 4.0 + i * 3.0;
    cloud += hash(floor(vUv * scale + i * 10.0 + uTime * 0.1));
  }
  cloud /= 5.0;
  cloud = smoothstep(0.4, 0.7, cloud) * smoothstep(0.5, 0.0, dist);

  // Superposition flicker
  float flicker = sin(uTime * 8.0) * 0.5 + 0.5;

  // Twist distortion
  float twist = sin(dist * 12.0 + uTime) * 0.2;
  float twistedAngle = atan(center.y, center.x) + twist * dist * 5.0;
  float spoke = abs(sin(twistedAngle * 4.0));

  vec3 color = mix(uColor1, rainbow, cloud * 0.6 + flicker * 0.1);
  color += uColor2 * smoothstep(0.9, 1.0, spoke) * ring * 0.5;

  float alpha = ring * uIntensity * (0.35 + cloud * 0.4 + flicker * 0.1);

  gl_FragColor = vec4(color, alpha);
}
