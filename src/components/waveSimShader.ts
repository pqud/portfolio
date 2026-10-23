export const simVertex = `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

export const simFragment = `
uniform sampler2D u_prev;
uniform float     u_hasDrop;
uniform vec2      u_dropUV;
uniform float     u_dropStr;

const float SIM = 256.0;
const float C2  = 0.24;

void main() {
  vec2  uv   = gl_FragCoord.xy / SIM;
  float tx   = 1.0 / SIM;

  float curr  = texture2D(u_prev, uv).r;
  float prev  = texture2D(u_prev, uv).g;
  float left  = texture2D(u_prev, vec2(mod(uv.x - tx + 1.0, 1.0), uv.y)).r;
  float right = texture2D(u_prev, vec2(mod(uv.x + tx,        1.0), uv.y)).r;
  float up    = texture2D(u_prev, vec2(uv.x, min(uv.y + tx, 1.0 - tx))).r;
  float down  = texture2D(u_prev, vec2(uv.x, max(uv.y - tx, tx))).r;

  float next = (2.0 - 4.0 * C2) * curr - prev + C2 * (left + right + up + down);

  // stronger damping near poles to absorb equirectangular distortion
  float poleW = smoothstep(0.0, 0.12, uv.y) * smoothstep(0.0, 0.12, 1.0 - uv.y);
  next *= 0.985 - 0.075 * (1.0 - poleW);

  if (u_hasDrop > 0.5) {
    float d = length(uv - u_dropUV);
    next   -= u_dropStr * smoothstep(0.06, 0.0, d);
  }

  gl_FragColor = vec4(clamp(next, -1.5, 1.5), curr, 0.0, 1.0);
}
`
