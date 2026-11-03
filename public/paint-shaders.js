export const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
export const motion=`// GLSL ES 1.00-compatible fragment-shader chunk. All input UVs are TOP-LEFT.
// Bind the neutral painted RGBA foreground, with clamp-to-edge + linear sampling.
// Rename these uniforms if the host already declares equivalent values.
uniform sampler2D uRoom;
uniform float uTime;    // Monotonic seconds; do not reset when changing lighting.
uniform float uPetAge;  // Seconds since pet; -1 means no active reaction.
const vec2 ROOM_PX = vec2(1672.0, 941.0);

float roomBox(vec2 p, vec4 b, float feather) {
  vec2 enter = smoothstep(b.xy, b.xy + vec2(feather), p);
  vec2 leave = 1.0 - smoothstep(b.zw - vec2(feather), b.zw, p);
  return enter.x * enter.y * leave.x * leave.y;
}

float roomOval(vec2 p, vec2 center, vec2 radius) {
  return 1.0 - smoothstep(0.60, 1.0, length((p - center) / radius));
}

// A soft breeze continues between the more visible, gently eased gusts.
float roomGust(float seconds, float offset) {
  float phase = mod(seconds + offset, 14.0);
  return .28 + .72 * smoothstep(0.6, 2.8, phase) *
         (1.0 - smoothstep(7.0, 10.0, phase));
}

vec4 roomSample(vec2 uv){return texture2D(uRoom,vec2(uv.x,1.0-uv.y));}

// Architecture is a completely static clean plate. Foliage lives on separate
// alpha layers in foliage.js; no displacement field touches the room image.
vec2 roomPaintedUV(vec2 uvTopLeft) { return uvTopLeft; }

`;
