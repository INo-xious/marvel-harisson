/** Painted contour strokes for the existing articulated macbook-painted.glb.
 * Pass the page's THREE namespace; no extra addons or asset transforms needed.
 * Call after applyPaintedMacBookMaterials(), before the first world render.
 *
 * EdgesGeometry supplies real 35-degree crease edges. We keep only the largest
 * closed perimeter at each requested slab height, excluding ports, keys and
 * coplanar triangle edges. Triangle ribbons provide reliable CSS-pixel widths
 * on WebGL implementations where LineBasicMaterial.linewidth is fixed at 1.
 */
const installedLaptopInk = new WeakMap();

export function addPaintedLaptopInk(THREE, model, options = {}) {
  if (installedLaptopInk.has(model)) return installedLaptopInk.get(model);
  const settings = {
    color: '#51483f', opacity: .86, width: 1.55,
    detailWidth: .82, detailOpacity: .62, thresholdAngle: 35,
    ribbon: null, roomTint: null,
    // View-space metres: below the 0.6 mm shell bevel, preventing z-fighting
    // without pulling an edge through the opposite side of the closed lid.
    depthLift: .00008,
    ...options,
  };
  const strokes = [], paths = [], materials = [], geometries = [];
  const viewport = new THREE.Vector2(1672, 941);
  const inkTint = settings.roomTint || { value: new THREE.Color(1, 1, 1) };
  const excluded = new Map();
  // Replace the old expanded-normal hull only on the laptop. This also prevents
  // a second contour around small keys if OutlineEffect remains on the world.
  model.traverse(object => {
    if (!object.isMesh) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!excluded.has(material)) excluded.set(material, material.userData.outlineParameters);
      material.userData.outlineParameters = { visible: false };
    }
  });

  const vertexShader = `
    attribute vec3 inkPrevious;
    attribute vec3 inkNext;
    attribute float inkSide;
    attribute float inkDistance;
    uniform vec2 inkViewport;
    uniform float inkWidth;
    uniform float inkDepthLift;
    uniform float inkFaceSign;
    varying float vInkAcross;
    varying float vInkHalfWidth;
    varying float vInkDistance;
    void main() {
      vec4 view = modelViewMatrix * vec4(position, 1.0);
      vec4 previousView = modelViewMatrix * vec4(inkPrevious, 1.0);
      vec4 nextView = modelViewMatrix * vec4(inkNext, 1.0);

      vec4 p = projectionMatrix * view;
      vec4 a = projectionMatrix * previousView;
      vec4 b = projectionMatrix * nextView;
      vec2 projectedTangent = (b.xy / b.w - a.xy / a.w) * inkViewport;
      vec2 tangent = projectedTangent / max(length(projectedTangent), .00001);
      vec2 normal = vec2(-tangent.y, tangent.x);
      // Keep the cap ribbon stable. Its authored alpha, rather than displaced
      // vertices or repeated noise, supplies the unequal painted contour.
      float halfWidth = inkWidth * .5;
      float across = inkSide * (halfWidth + 1.0);
      vec2 offset = normal * across;
      // Intersect the offset screen ray with the REAL slab cap. A billboard
      // ribbon cuts alternately through a grazing lid plane and creates a
      // dotted/z-fighting front seam. This ribbon remains coplanar, with one
      // tiny view-depth lift to keep its pigment above the existing surface.
      vec3 capNormal = normalize(normalMatrix * vec3(0.0, inkFaceSign, 0.0));
      vec3 screenRay = view.xyz + vec3(
        offset.x * 2.0 * -view.z / (inkViewport.x * projectionMatrix[0][0]),
        offset.y * 2.0 * -view.z / (inkViewport.y * projectionMatrix[1][1]), 0.0);
      float denominator = dot(capNormal, screenRay);
      float planeScale = abs(denominator) > .000001 ? dot(capNormal, view.xyz) / denominator : 1.0;
      vec3 onCap = screenRay * planeScale;
      onCap.z += inkDepthLift;
      gl_Position = projectionMatrix * vec4(onCap, 1.0);
      vInkAcross = across;
      vInkHalfWidth = halfWidth;
      vInkDistance = inkDistance;
    }
  `;
  const fragmentShader = `
    uniform vec3 inkColor;
    uniform float inkOpacity;
    uniform sampler2D inkRibbon;
    uniform float inkPerimeter, inkRow;
    uniform vec2 inkRange;
    uniform vec3 inkTint;
    varying float vInkAcross;
    varying float vInkHalfWidth;
    varying float vInkDistance;
    void main() {
      float feather = max(fwidth(vInkAcross) * .75, .2);
      float coverage = 1.0 - smoothstep(vInkHalfWidth - feather, vInkHalfWidth + feather, abs(vInkAcross));
      #ifdef NATIVE_INK
        float along = clamp(vInkDistance / max(inkPerimeter, .0001), 0., 1.);
        float ribbonX = mix(inkRange.x, inkRange.y, along);
        float across = (32. + vInkAcross / max(vInkHalfWidth, .01) * 12.) / 64.;
        // Four unique 64px rows; the first row is at the PNG's upper edge.
        vec2 ribbonUV = vec2(ribbonX, 1. - (inkRow + clamp(across, 0., 1.)) / 4.);
        vec4 paint = texture2D(inkRibbon, ribbonUV);
        gl_FragColor = vec4(paint.rgb * inkTint, inkOpacity * paint.a * coverage);
      #else
        gl_FragColor = vec4(inkColor * inkTint, inkOpacity * .93 * coverage);
      #endif
      #include <colorspace_fragment>
    }
  `;

  function strokeMaterial(width, opacity) {
    const material = new THREE.ShaderMaterial({
      name: 'Painted laptop ink', vertexShader, fragmentShader,
      defines: settings.ribbon ? { NATIVE_INK: 1 } : {},
      uniforms: {
        inkViewport: { value: viewport },
        inkWidth: { value: width },
        inkColor: { value: new THREE.Color(settings.color) },
        inkOpacity: { value: opacity },
        inkDepthLift: { value: settings.depthLift },
        inkFaceSign: { value: 1 },
        inkRibbon: { value: settings.ribbon },
        inkPerimeter: { value: 1 },
        inkRow: { value: 0 },
        inkRange: { value: new THREE.Vector2(0, 1) },
        inkTint,
      },
      transparent: true, depthWrite: false, depthTest: true,
      // Cap and bevel depth slopes differ at grazing angles. A slope-scaled
      // raster bias keeps their shared contour continuous without changing
      // its position or bypassing occlusion by the opposite lid surface.
      polygonOffset: true, polygonOffsetFactor: -.75, polygonOffsetUnits: -2,
      side: THREE.DoubleSide, toneMapped: false,
    });
    material.userData.outlineParameters = { visible: false };
    materials.push(material);
    return material;
  }
  const outerMaterial = strokeMaterial(settings.width, settings.opacity);
  const lowerMaterial = strokeMaterial(settings.width * .72, settings.opacity * .76);
  const detailMaterial = strokeMaterial(settings.detailWidth, settings.detailOpacity);

  function slabPerimeter(mesh, face) {
    const source = mesh.geometry;
    source.computeBoundingBox();
    const height = source.boundingBox[face === 'top' ? 'max' : 'min'].y;
    // EdgesGeometry hashes to four decimal places. Work in centimetres so the
    // trackpad's 0.05 mm surfaces do not collapse into degenerate triangles.
    const scaled = source.clone().scale(100, 100, 100);
    const edges = new THREE.EdgesGeometry(scaled, settings.thresholdAngle);
    scaled.dispose();
    edges.scale(.01, .01, .01);
    const p = edges.attributes.position;
    const nodes = new Map(), usedEdges = new Set();
    const key = p => p.map(v => Math.round(v * 1e7)).join(',');
    for (let i = 0; i < p.count; i += 2) {
      const a = [p.getX(i), p.getY(i), p.getZ(i)];
      const b = [p.getX(i + 1), p.getY(i + 1), p.getZ(i + 1)];
      if (Math.abs(a[1] - height) > 1e-6 || Math.abs(b[1] - height) > 1e-6) continue;
      const ka = key(a), kb = key(b), edgeKey = [ka, kb].sort().join('|');
      if (ka === kb || usedEdges.has(edgeKey)) continue;
      usedEdges.add(edgeKey);
      if (!nodes.has(ka)) nodes.set(ka, { p: a, next: [] });
      if (!nodes.has(kb)) nodes.set(kb, { p: b, next: [] });
      nodes.get(ka).next.push(kb); nodes.get(kb).next.push(ka);
    }
    edges.dispose();
    const visited = new Set(), loops = [];
    for (const [start, first] of nodes) {
      if (visited.has(start) || first.next.length !== 2) continue;
      const loop = [];
      let current = start, previous = null, closed = false;
      for (let i = 0; i <= nodes.size; i++) {
        if (current === start && loop.length) { closed = true; break; }
        const node = nodes.get(current);
        if (!node || node.next.length !== 2 || visited.has(current)) break;
        visited.add(current); loop.push(node.p);
        const next = node.next.find(k => k !== previous);
        previous = current; current = next;
      }
      if (closed && loop.length >= 3) loops.push(loop);
    }
    // Merged source primitives can contain many small loops. Only the exterior
    // slab ring is useful; the largest signed XZ area identifies it reliably.
    const area = loop => Math.abs(loop.reduce((sum, a, i) => {
      const b = loop[(i + 1) % loop.length];
      return sum + a[0] * b[2] - b[0] * a[2];
    }, 0));
    loops.sort((a, b) => area(b) - area(a));
    if (!loops.length) throw new Error(`No ${face} perimeter on ${mesh.name}`);
    return loops[0];
  }

  function makeStroke(mesh, face, material, label) {
    material = material.clone();
    material.uniforms.inkFaceSign.value = face === 'top' ? 1 : -1;
    material.uniforms.inkTint = inkTint;
    const row = label === 'lid_outer' ? 0 : label === 'lid_inner_rim' ? 1 : label.startsWith('base_') ? 2 : 3;
    material.uniforms.inkRow.value = row;
    if (label === 'trackpad') material.uniforms.inkRange.value.set(0, .34);
    if (label === 'keyboard_well') material.uniforms.inkRange.value.set(.33, .70);
    if (label === 'display_bezel') material.uniforms.inkRange.value.set(.66, 1);
    material.userData.outlineParameters = { visible: false };
    materials.push(material);
    const loop = slabPerimeter(mesh, face), sampled = [];
    for (let i = 0; i < loop.length; i++) {
      const a = new THREE.Vector3(...loop[i]);
      const b = new THREE.Vector3(...loop[(i + 1) % loop.length]);
      const steps = Math.max(1, Math.ceil(a.distanceTo(b) / .002));
      for (let j = 0; j < steps; j++) sampled.push(a.clone().lerp(b, j / steps));
    }
    const positions = [], previous = [], next = [], sides = [], distances = [], indices = [];
    let distance = 0;
    for (let i = 0; i <= sampled.length; i++) {
      const p = sampled[i % sampled.length];
      const before = sampled[(i - 1 + sampled.length) % sampled.length];
      const after = sampled[(i + 1) % sampled.length];
      if (i) distance += before.distanceTo(p);
      for (const side of [-1, 1]) {
        positions.push(...p); previous.push(...before); next.push(...after);
        sides.push(side); distances.push(distance);
      }
      if (i < sampled.length) {
        const k = i * 2;
        indices.push(k, k + 1, k + 2, k + 2, k + 1, k + 3);
      }
    }
    material.uniforms.inkPerimeter.value = distance;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('inkPrevious', new THREE.Float32BufferAttribute(previous, 3));
    geometry.setAttribute('inkNext', new THREE.Float32BufferAttribute(next, 3));
    geometry.setAttribute('inkSide', new THREE.Float32BufferAttribute(sides, 1));
    geometry.setAttribute('inkDistance', new THREE.Float32BufferAttribute(distances, 1));
    // OutlineEffect only honors outlineParameters on geometry with normals.
    // The custom shader ignores these; their presence suppresses its second pass.
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(positions.length), 3));
    geometry.setIndex(indices);
    geometry.computeBoundingSphere();
    const stroke = new THREE.Mesh(geometry, material);
    stroke.name = `PaintedInk_${label}`;
    stroke.castShadow = false; stroke.receiveShadow = false;
    stroke.frustumCulled = false; stroke.renderOrder = 12;
    stroke.raycast = () => {}; // Preserve the original laptop interaction meshes.
    // Material.clone() also clones Vector2 uniforms. Update the stroke's actual
    // viewport, including the extra opening-fade clone, after every resize.
    stroke.onBeforeRender = renderer => renderer.getSize(stroke.material.uniforms.inkViewport.value);
    mesh.add(stroke); // Inherits actual mesh transform, including the lid hinge.
    strokes.push(stroke); geometries.push(geometry);
    stroke.userData.baseInkOpacity = material.uniforms.inkOpacity.value;
    paths.push({ name: label, mesh: mesh.name, face, points: loop,
      width: material.uniforms.inkWidth.value,
      opacity: material.uniforms.inkOpacity.value,
      perimeter: distance, ribbonRow: row });
  }

  function findMesh(name, materialName) {
    const object = model.getObjectByName(name) || model.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(name));
    if (!object) throw new Error(`Laptop ink requires ${name}`);
    let match = null;
    object.traverse(child => {
      if (match || !child.isMesh) return;
      const list = Array.isArray(child.material) ? child.material : [child.material];
      if (!materialName || list.some(m => m.name.startsWith(materialName))) match = child;
    });
    if (!match) throw new Error(`Laptop ink requires mesh under ${name}`);
    return match;
  }

  const lid = findMesh('Thin silver lid shell');
  const base = findMesh('MacBookBase_Aluminum_Silver', 'Aluminum_Silver');
  makeStroke(lid, 'top', outerMaterial, 'lid_outer');
  makeStroke(lid, 'bottom', lowerMaterial, 'lid_inner_rim');
  makeStroke(base, 'top', outerMaterial, 'base_top');
  makeStroke(base, 'bottom', lowerMaterial, 'base_lower');
  makeStroke(findMesh('Large Force Touch trackpad'), 'top', detailMaterial, 'trackpad');
  makeStroke(findMesh('Keyboard recessed black well'), 'top', detailMaterial, 'keyboard_well');
  // The bezel face is local -Y, facing the user after the lid opens.
  makeStroke(findMesh('Thin black display bezel'), 'bottom', detailMaterial, 'display_bezel');

  // One outer lid contour reads as a thin machined shell when closed. Four
  // equally strong nested perimeters resembled a thick book. The opening
  // animation reveals the real base and inner rim gradually.
  const fading = new Map();
  for (const stroke of strokes) {
    if (stroke.name === 'PaintedInk_base_lower') { stroke.visible = false; continue; }
    if (!['PaintedInk_base_top','PaintedInk_lid_inner_rim','PaintedInk_display_bezel','PaintedInk_keyboard_well','PaintedInk_trackpad'].includes(stroke.name)) continue;
    stroke.material = stroke.material.clone();
    stroke.material.uniforms.inkTint = inkTint;
    stroke.material.userData.outlineParameters = { visible: false };
    materials.push(stroke.material);
    fading.set(stroke, stroke.material.uniforms.inkOpacity.value);
  }
  let lastOpening = 0, opacityFactor = 1;
  function updateOpening(angle = 0) {
    lastOpening = Math.abs(angle);
    for (const [stroke, opacity] of fading) {
      const inner = stroke.name === 'PaintedInk_lid_inner_rim';
      const internal=['PaintedInk_display_bezel','PaintedInk_keyboard_well','PaintedInk_trackpad'].includes(stroke.name);
      const lower = inner ? .14 : internal ? .08 : .025, upper = inner ? .40 : internal ? .30 : .18;
      const t = Math.max(0,Math.min(1,(lastOpening-lower)/(upper-lower)));
      const fade = t*t*(3-2*t);
      stroke.visible = fade > .001;
      stroke.material.uniforms.inkOpacity.value = opacity * fade * opacityFactor * (inner ? .55 : .82);
    }
  }
  updateOpening();
  const handle = {
    strokes, paths, materials,
    setOpening: updateOpening,
    setOpacity(factor = 1) {
      outerMaterial.uniforms.inkOpacity.value = settings.opacity * factor;
      lowerMaterial.uniforms.inkOpacity.value = settings.opacity * .76 * factor;
      detailMaterial.uniforms.inkOpacity.value = settings.detailOpacity * factor;
      for (const stroke of strokes) stroke.material.uniforms.inkOpacity.value = stroke.userData.baseInkOpacity * factor;
      opacityFactor = factor; updateOpening(lastOpening);
    },
    dispose() {
      for (const stroke of strokes) stroke.removeFromParent();
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
      excluded.forEach((value, m) => {
        if (value === undefined) delete m.userData.outlineParameters;
        else m.userData.outlineParameters = value;
      });
      installedLaptopInk.delete(model);
    },
  };
  installedLaptopInk.set(model, handle);
  return handle;
}
