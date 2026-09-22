import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/**
 * The hero's 3D L8 logo — the WebGL half of <Hero3DLogo>.
 *
 * This module is the only place Three.js is imported from the events site, and
 * it is behind React.lazy, so the ~600 kB of Three never reaches a visitor who
 * does not get the scene (mobile, no WebGL, reduced motion).
 *
 * Performance shape:
 *  - frameloop="demand": no render loop at rest. Frames are requested by
 *    pointer movement and by the tilt easing until it settles, so an idle
 *    hero costs 0% GPU.
 *  - frameloop="never" while the hero is off-screen or the tab is hidden
 *    (driven by the `active` prop from the parent).
 *  - No <Stars> and no HDR `preset` (which fetches multiple MB from a CDN).
 *    Reflections come from a 64px cubemap baked once from <Lightformer>s.
 */

const MODEL_URL = '/3dlogo/l8_v2.gltf';

/** Brand palette — cream at the top of the logo, cyan at the bottom. */
const CREAM = '#f9dfc7';
const CYAN = '#00c0ff';
/** Where the cream→cyan blend starts and ends, as a share of the logo height. */
const RAMP_START = 0.18;
const RAMP_END = 0.8;

/**
 * Share of the canvas height the logo spans. Well under 1 so it sits back in
 * the frame rather than filling it — the hero reads as a scene with the logo
 * in it, not as a logo with a canvas around it.
 */
const FILL = 0.585;
/** atan(TILT_REACH / TILT_DEPTH) is the tilt at a screen corner — ~10°. */
const TILT_REACH = 1.05;
const TILT_DEPTH = 6;
/**
 * Exponential follow rate, per second. Deliberately languid: the logo drifts
 * after the cursor rather than tracking it. Time-based rather than a fixed
 * fraction per frame, so a 120 Hz display does not get twice the speed.
 */
const FOLLOW_RATE = 2.4;
/**
 * Frame gaps are unbounded under frameloop="demand" — the clock keeps running
 * while nothing renders. Clamp, or the first frame after a pause eases across
 * the whole gap at once and snaps.
 */
const MAX_DELTA = 1 / 30;
/** Below this angular error the tilt is visually settled — stop asking for frames. */
const SETTLED = 0.003;
/** The model's own facing axis, turned toward the cursor. */
const FORWARD = new THREE.Vector3(0, 0, 1);

useGLTF.preload(MODEL_URL);

/**
 * Must live inside Canvas so useThree() works. React unmounts children before
 * the parent, so this cleanup runs before R3F's own disposal — forceContextLoss()
 * fires first, preventing INVALID_OPERATION cascades when gl.delete*() is later
 * called against an already-lost context.
 */
function ContextLossGuard() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    return () => {
      try { gl.forceContextLoss(); } catch { /* already lost, ignore */ }
    };
  }, [gl]);
  return null;
}

/**
 * Cursor position in window-normalised coords, written to a ref rather than
 * state: a mousemove must not re-render the React tree, only request a frame.
 */
function PointerTracker({ pointer }: { pointer: React.MutableRefObject<THREE.Vector2> }) {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -((event.clientY / window.innerHeight) * 2 - 1),
      );
      invalidate();
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [pointer, invalidate]);

  return null;
}

/** Coming back from frameloop="never" needs one frame to catch up. */
function ResumeOnActive({ active }: { active: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (active) invalidate();
  }, [active, invalidate]);
  return null;
}

/**
 * Writes the cream→cyan brand ramp into the geometry as vertex colours, keyed
 * on each vertex's height. Baking it into the mesh (rather than reflecting it
 * off the environment) is what keeps the gradient readable once the logo tilts
 * away from the camera. Idempotent: the geometry is shared with useGLTF's cache.
 */
function bakeBrandGradient(geometry: THREE.BufferGeometry) {
  if (geometry.getAttribute('color')) return;

  const position = geometry.getAttribute('position');
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  if (!bounds) return;

  const minY = bounds.min.y;
  const spanY = Math.max(bounds.max.y - minY, 1e-6);
  const top = new THREE.Color(CREAM);
  const bottom = new THREE.Color(CYAN);
  const blend = new THREE.Color();
  const colors = new Float32Array(position.count * 3);

  for (let i = 0; i < position.count; i += 1) {
    const height = (position.getY(i) - minY) / spanY;
    blend.copy(bottom).lerp(top, THREE.MathUtils.smoothstep(height, RAMP_START, RAMP_END));
    colors[i * 3] = blend.r;
    colors[i * 3 + 1] = blend.g;
    colors[i * 3 + 2] = blend.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

function Logo({ pointer }: { pointer: React.MutableRefObject<THREE.Vector2> }) {
  const { scene } = useGLTF(MODEL_URL);
  const invalidate = useThree((s) => s.invalidate);
  const viewportHeight = useThree((s) => s.viewport.height);
  const tiltRef = useRef<THREE.Group>(null);

  // Clone before touching materials: useGLTF caches the source scene, and
  // StrictMode mounts this twice in development.
  const model = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      bakeBrandGradient(mesh.geometry);
      const material = (mesh.material as THREE.MeshStandardMaterial).clone();
      // The GLTF ships a flat dark navy metal. White base + vertex colours
      // puts the brand gradient in the surface itself; a moderate metalness
      // then adds sheen without the logo turning to chrome when it tilts.
      material.color.set('#ffffff');
      material.vertexColors = true;
      material.metalness = 0.5;
      material.roughness = 0.32;
      material.envMapIntensity = 1.0;
      mesh.material = material;
    });
    return root;
  }, [scene]);

  // R3F does not dispose a <primitive> subtree, and this route is mounted and
  // unmounted repeatedly in an SPA, so the per-mount material clones would
  // otherwise pile up on the GPU. The geometry is the cache's — leave it.
  useEffect(() => {
    return () => {
      model.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.isMesh) (mesh.material as THREE.Material).dispose();
      });
    };
  }, [model]);

  // Fit to the canvas rather than to hard-coded numbers, so the slot can be
  // resized in CSS without the logo drifting out of frame.
  const { fit, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = (viewportHeight * FILL) / Math.max(size.x, size.y);
    return { fit: scale, offset: center.multiplyScalar(-scale) };
  }, [model, viewportHeight]);

  // Scratch objects, reused every frame — no allocation in the render loop.
  const direction = useMemo(() => new THREE.Vector3(), []);
  const desired = useMemo(() => new THREE.Quaternion(), []);

  useFrame((_, delta) => {
    const group = tiltRef.current;
    if (!group) return;

    const x = THREE.MathUtils.clamp(pointer.current.x, -1, 1);
    const y = THREE.MathUtils.clamp(pointer.current.y, -1, 1);
    direction.set(x * TILT_REACH, y * TILT_REACH, TILT_DEPTH).normalize();
    desired.setFromUnitVectors(FORWARD, direction);
    group.quaternion.slerp(desired, 1 - Math.exp(-FOLLOW_RATE * Math.min(delta, MAX_DELTA)));

    if (group.quaternion.angleTo(desired) > SETTLED) invalidate();
  });

  return (
    <group ref={tiltRef}>
      <group scale={fit} position={[offset.x, offset.y, offset.z]}>
        <primitive object={model} />
      </group>
    </group>
  );
}

const Hero3DLogoScene: React.FC<{ active: boolean }> = ({ active }) => {
  const pointer = useRef(new THREE.Vector2());

  // `flat` = no ACES tone mapping: the logo is flat brand colour, not a
  // photographic subject, and ACES washes the cream and cyan toward white.
  return (
    <Canvas
      frameloop={active ? 'demand' : 'never'}
      flat
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 6], fov: 35, near: 0.1, far: 50 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'default' }}
      style={{ pointerEvents: 'none' }}
    >
      <ContextLossGuard />
      <ResumeOnActive active={active} />
      {active && <PointerTracker pointer={pointer} />}

      <ambientLight intensity={0.55} />
      <directionalLight position={[2.5, 3.5, 4]} intensity={1.1} />

      {/* Baked once into a 64px cubemap — no HDR fetched from a CDN. The
          panels sit behind the camera, which is what a face pointing at the
          camera reflects, so the sheen picks up the brand colours too. */}
      <Environment resolution={64} frames={1}>
        <color attach="background" args={['#0a1420']} />
        <Lightformer form="rect" intensity={1.0} color={CREAM} position={[0, 3.8, 8]} scale={[14, 6, 1]} />
        <Lightformer form="rect" intensity={1.3} color={CYAN} position={[0, -2.6, 8]} scale={[14, 6, 1]} />
        {/* Rim light from behind, to separate the extruded sides from the page. */}
        <Lightformer form="rect" intensity={0.9} color="#ffffff" position={[0, 0, -7]} scale={[8, 8, 1]} />
      </Environment>

      <Suspense fallback={null}>
        <Logo pointer={pointer} />
      </Suspense>
    </Canvas>
  );
};

export default Hero3DLogoScene;
