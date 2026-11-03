import * as THREE from 'three';

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const ease = (start, end, v) => {
  const t = clamp((v - start) / (end - start));
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const pulse = (t, start, up, down, end) => ease(start, up, t) * (1 - ease(down, end, t));
const cycle = (v, length) => ((v % length) + length) % length;

/** Room pixels. The painted chest overlap buries the head and paw cut edges. */
export const CAT_LAYOUT = {
  atlas: [1774, 887],
  torso: { crop: [20, 120, 454, 291], size: [172, 105], center: [27, 0], pivot: [37, -50], z: .4 },
  neck: { crop: [112, 240, 95, 145], size: [60, 54], center: [-33, -22], pivot: [-33, -22], z: .45 },
  head: { crop: [525, 87, 319, 314], size: [85, 84], center: [-55, -2], pivot: [-27, -28], z: .5 },
  nearPaw: { crop: [56, 571, 365, 195], size: [81, 43], center: [-37, -43], pivot: [-3, -30], z: .25 },
  farPaw: { crop: [490, 588, 320, 175], size: [69, 36], center: [-58, -35], pivot: [-27, -25], z: .1 },
  tail: { crop: [892, 560, 438, 208], size: [134, 48], center: [43, -43], pivot: [98, -25], z: .2 },
};

/** Continuous rigid-part targets. Eye frames are intentionally discrete. */
export function catMotion(time, petAt = -100, hover = false, reaction = 0) {
  // Rest is the default. A brief, smaller spontaneous wake happens only once
  // every 132 seconds, and a pet postpones that quiet idle cycle.
  const idleClock = time - (petAt >= 0 ? petAt + 24 : 0);
  const idleAge = cycle(idleClock, 132) - 94;
  const petAge = time - petAt;
  const interacting = petAge >= 0 && petAge < 10.5;
  const age = interacting ? petAge : idleAge;
  const variant = ((reaction % 3) + 3) % 3;
  const energy = interacting ? 1 : .68;
  const wake = pulse(age, 0, 1.12, 6.0, 9.6) * energy;
  const stretch = pulse(age, .72, 2.0, 2.7, 4.5) * (interacting ? (variant === 1 ? .78 : 1) : .35);
  const farStretch = pulse(age, 1.2, 2.45, 3.15, 4.85) * (interacting ? 1 : .35);
  const look = pulse(age, 2.55, 3.2, 5.0, 5.95) * energy;
  const nuzzle = interacting ? pulse(age, 2.65, 3.15, 4.95, 5.8) * Math.sin((age - 2.65) * (variant === 1 ? 4.1 : 2.9)) * (variant === 1 ? 1 : .45) : 0;
  const knead = interacting && variant === 2 ? pulse(age, 3.4, 3.72, 3.92, 4.28) + pulse(age, 4.5, 4.82, 5.02, 5.38) : 0;
  const farKnead = interacting && variant === 2 ? pulse(age, 3.9, 4.22, 4.42, 4.78) + pulse(age, 5.0, 5.32, 5.52, 5.88) : 0;
  const breathe = .42 * Math.sin(time * Math.PI * 2 / 5.4);
  const tailAge = cycle(time, 21);
  const tailIdle = pulse(tailAge, 5, 6.3, 8.0, 10.0);
  const swish = (tailIdle * .52 + wake * .65) * Math.sin(time * 1.7 - .6);
  return {
    age, wake,
    breath: breathe,
    // Lift a resting cheek from the forepaws, keeping its collar in the chest.
    headAngle: -.74 * wake + .055 * look + .09 * nuzzle,
    headX: 1.4 * wake - .7 * look + 1.2 * nuzzle,
    headY: 6.0 * wake + .6 * look - 1.1 * Math.abs(nuzzle),
    nearX: -8.4 * stretch - 2.0 * knead,
    nearY: -.7 * stretch + 2.4 * knead,
    nearAngle: .026 * stretch - .045 * knead,
    farX: -4.7 * farStretch - 1.5 * farKnead,
    farY: -.3 * farStretch + 1.9 * farKnead,
    farAngle: -.018 * farStretch + .035 * farKnead,
    tailAngle: 0,
    tailTip: .11 * swish,
    look,
  };
}

export const catVertexShader = `
varying vec2 vUv;
uniform float tailTip;
uniform vec2 tailJoint;
uniform float isTail;
void main() {
  vUv = uv;
  vec3 p = position;
  // The curled root and middle never move. Only the exposed distal tip
  // has bend weights; every vertex at u >= .29 is fixed in place.
  float weight = (1. - smoothstep(.08, .29, uv.x)) * isTail;
  vec2 d = p.xy - tailJoint;
  float a = tailTip * weight;
  p.xy = tailJoint + mat2(cos(a), sin(a), -sin(a), cos(a)) * d;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`;

export const catFragmentShader = `
uniform sampler2D parts;
uniform vec4 crop;
uniform vec2 atlasSize;
uniform vec3 tint;
uniform float eyeFrame;
uniform float isHead;
varying vec2 vUv;
vec4 atlas(vec2 p) {
  return texture2D(parts, vec2(p.x / atlasSize.x, 1. - p.y / atlasSize.y));
}
void main() {
  vec2 p = crop.xy + vec2(vUv.x, 1. - vUv.y) * crop.zw;
  vec4 paint = atlas(p);
  // Keep the awake head's outline, ears, muzzle and fur fixed. The generated
  // expression tiles are slightly different, so only eyelid pigment is cut in.
  // This is a discrete eye change with a spatial feather, never a pose fade.
  if (isHead > .5 && eyeFrame > .5) {
    vec2 nearEye = vec2(622., 268.);
    vec2 farEye = vec2(721., 249.);
    float nearMask = 1. - smoothstep(.84, 1., length((p - nearEye) / vec2(39., 26.)));
    float farMask = 1. - smoothstep(.84, 1., length((p - farEye) / vec2(37., 26.)));
    vec2 nearOffset = eyeFrame < 1.5 ? vec2(422., 3.) : vec2(874., 3.);
    vec2 farOffset = eyeFrame < 1.5 ? vec2(433., 1.) : vec2(880., 1.);
    paint.rgb = mix(paint.rgb, atlas(p + nearOffset).rgb, nearMask);
    paint.rgb = mix(paint.rgb, atlas(p + farOffset).rgb, farMask);
  }
  // The atlas is truly transparent; vivid fringe colors exist only below 16/255.
  float alpha = paint.a * smoothstep(.06, .10, paint.a);
  // Bury the head's cut collar inside a painted chest overlap. Preserve the
  // jaw, muzzle and cheek; this spatial mask never changes with the pose.
  float neckJoin = max(
    smoothstep(1070., 1120., p.x + p.y) * smoothstep(303., 344., p.y),
    smoothstep(758., 797., p.x) * smoothstep(292., 318., p.y)
  );
  alpha *= 1. - max(0., isHead) * neckJoin;
  // isHead = -1 identifies the small chest patch sampled from torso fur.
  if (isHead < -.5) alpha *= 1. - smoothstep(.73, 1., length((vUv - .5) * 2.));
  if (alpha < .005) discard;
  gl_FragColor = vec4(paint.rgb * tint, alpha);
  #include <colorspace_fragment>
}`;

const motionKeys = ['wake', 'breath', 'headAngle', 'headX', 'headY', 'nearX', 'nearY', 'nearAngle', 'farX', 'farY', 'farAngle', 'tailAngle', 'tailTip', 'look'];

/**
 * A painted puppet with a fixed chest overlap and five articulated parts.
 * Head expression uses aligned eye frames with hard eyelid cuts. There are
 * no whole-cat frame changes and no pose opacity blending.
 */
export class PaintedCat {
  constructor(texture, reduced = false) {
    this.reduced = reduced;
    this.petAt = -100;
    this.lastTime = null;
    this.petCount = 0;
    this.reaction = 0;
    this.pose = Object.fromEntries(motionKeys.map(k => [k, 0]));
    this.group = new THREE.Group();
    this.group.name = 'PaintedCatPuppet';
    this.group.position.set(1545 - 836, 470.5 - 611, 7);
    this.tint = { value: new THREE.Color() };
    this.parts = {};
    for (const name of ['farPaw', 'nearPaw', 'torso', 'neck', 'head', 'tail']) {
      const part = CAT_LAYOUT[name];
      const crop = part.crop;
      const uniforms = {
        parts: { value: texture }, tint: this.tint,
        crop: { value: new THREE.Vector4(...crop) },
        atlasSize: { value: new THREE.Vector2(...CAT_LAYOUT.atlas) },
        tailTip: { value: 0 },
        tailJoint: { value: new THREE.Vector2(-part.size[0] * .21, -part.size[1] * .15) },
        isTail: { value: name === 'tail' ? 1 : 0 },
        eyeFrame: { value: 1 },
        isHead: { value: name === 'head' ? 1 : name === 'neck' ? -1 : 0 },
      };
      const pivot = new THREE.Group();
      pivot.position.set(...part.pivot, part.z);
      const geometry = new THREE.PlaneGeometry(...part.size, name === 'tail' ? 28 : 1, name === 'tail' ? 8 : 1);
      const material = new THREE.ShaderMaterial({ uniforms, vertexShader: catVertexShader, fragmentShader: catFragmentShader, transparent: true, depthWrite: false });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(part.center[0] - part.pivot[0], part.center[1] - part.pivot[1], 0);
      mesh.frustumCulled = false;
      mesh.name = `Cat_${name}`;
      pivot.add(mesh);
      this.group.add(pivot);
      this.parts[name] = { pivot, mesh, uniforms };
    }
    this.eyeFrame = 1;
  }

  pet(time) {
    // Clicks alternate stretch, nuzzle, and knead accents. Repeated pets hold
    // the raised head while the damped targets ease into the new reaction.
    this.reaction = this.petCount++ % 3;
    this.petAt = time - (this.pose.wake > .35 ? 1.1 : 0);
  }

  update(time, tint, hover = false) {
    // Passing the pointer over a sleeping cat does not wake it.
    const target = catMotion(time, this.petAt, hover, this.reaction);
    const dt = this.lastTime === null ? 0 : clamp(time - this.lastTime, 0, .12);
    const blend = this.lastTime === null ? 1 : 1 - Math.exp(-dt / .085);
    this.lastTime = time;
    for (const key of motionKeys) this.pose[key] = this.reduced ? 0 : this.pose[key] + (target[key] - this.pose[key]) * blend;
    const p = this.pose;
    const torso = this.parts.torso.pivot;
    // Less than one room pixel of ribcage travel; no per-vertex body warping.
    torso.scale.y = 1 + p.breath * .006;
    const head = this.parts.head.pivot;
    head.rotation.z = .57 + p.headAngle;
    head.position.x = CAT_LAYOUT.head.pivot[0] + p.headX;
    head.position.y = CAT_LAYOUT.head.pivot[1] + p.headY + p.breath * .12;
    for (const [name, prefix] of [['nearPaw', 'near'], ['farPaw', 'far']]) {
      const paw = this.parts[name].pivot;
      paw.position.x = CAT_LAYOUT[name].pivot[0] + p[`${prefix}X`];
      paw.position.y = CAT_LAYOUT[name].pivot[1] + p[`${prefix}Y`];
      paw.rotation.z = p[`${prefix}Angle`];
    }
    // Root occlusion cannot change: only the shader bends the distal tip.
    this.parts.tail.pivot.rotation.z = 0;
    this.parts.tail.uniforms.tailTip.value = p.tailTip;
    let eyeFrame = p.wake < .2 ? 1 : p.wake < .53 ? 2 : 0;
    // A slow blink while looking at the viewer, then a smaller second blink.
    if (eyeFrame === 0) {
      const blinkAge = cycle(target.age - 2.9, 2.4);
      if (blinkAge < .07 || (blinkAge >= .31 && blinkAge < .4)) eyeFrame = 2;
      else if (blinkAge < .31) eyeFrame = 1;
    }
    if (this.reduced) eyeFrame = time - this.petAt < 4.8 ? 0 : 1;
    if (eyeFrame !== this.eyeFrame) {
      this.parts.head.uniforms.eyeFrame.value = eyeFrame;
      this.eyeFrame = eyeFrame;
    }
    this.tint.value.copy(tint);
  }

  dispose() {
    for (const { mesh } of Object.values(this.parts)) {
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
  }
}
