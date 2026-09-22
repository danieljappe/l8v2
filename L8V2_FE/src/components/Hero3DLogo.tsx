import React, { Suspense, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * The L8 logo at the top of the home hero.
 *
 * On desktop this is the interactive 3D logo the client asked to keep after the
 * platform-choice screen was retired; everywhere else it is the flat webp that
 * was there before, with identical markup and classes. The gate is decided
 * before <Scene> is referenced, so Three.js is neither fetched nor parsed on
 * the fallback path.
 */

// Lazy — the whole Three.js/drei chunk lives behind this import.
const Scene = React.lazy(() => import('./Hero3DLogoScene'));

const LOGO_SRC = '/l8logo_nobackground.webp';

/** The flat logo's slot, unchanged from before the 3D scene was added. */
const FLAT_SLOT = 'w-40 sm:w-52 md:w-64 mx-auto mb-8';
/** The canvas slot. Square, because the logo artwork is 954×923. */
const SCENE_SLOT = 'w-64 h-64 mx-auto mb-8 relative';

const ENTRANCE = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1.05, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const },
};

// Desktop only, and only with a real pointer — the scene's whole interaction
// is cursor tilt, which a touch screen cannot drive.
const DESKTOP_QUERY = '(min-width: 1024px) and (pointer: fine)';
const MOTION_QUERY = '(prefers-reduced-motion: no-preference)';

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function sceneAllowed(): boolean {
  // Media queries first: the WebGL probe allocates a context, and a phone
  // should never pay for it.
  if (!window.matchMedia(DESKTOP_QUERY).matches) return false;
  if (!window.matchMedia(MOTION_QUERY).matches) return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return false;
  return supportsWebGL();
}

/** Re-evaluates on breakpoint and reduced-motion changes, e.g. a resized window. */
function useSceneAllowed(): boolean {
  const [allowed, setAllowed] = useState(sceneAllowed);

  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const reducedMotion = window.matchMedia(MOTION_QUERY);
    const sync = () => setAllowed(sceneAllowed());
    desktop.addEventListener('change', sync);
    reducedMotion.addEventListener('change', sync);
    return () => {
      desktop.removeEventListener('change', sync);
      reducedMotion.removeEventListener('change', sync);
    };
  }, []);

  return allowed;
}

/**
 * True only while the hero is on screen and the tab is in the foreground —
 * the scene stops rendering entirely the moment either stops being true.
 */
function useActiveWhenVisible(ref: React.RefObject<HTMLElement>): boolean {
  const [active, setActive] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let onScreen = true;
    const sync = () => setActive(onScreen && document.visibilityState === 'visible');

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      },
      { rootMargin: '120px' },
    );
    observer.observe(element);
    document.addEventListener('visibilitychange', sync);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [ref]);

  return active;
}

/**
 * WebGL context creation can still throw after the probe passes (GPU blocklist,
 * context limits, driver resets). The logo is decorative — fall back to the
 * flat one rather than taking the hero down with it.
 */
class SceneErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) {
    console.error('[Hero3DLogo] falling back to the flat logo —', error.message);
  }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

/** Fills the canvas slot while the chunk loads, and if the scene fails. */
const SlotLogo: React.FC = () => (
  <img src={LOGO_SRC} alt="L8 Events" className="w-full h-full object-contain" />
);

const Hero3DLogo: React.FC = () => {
  const allowed = useSceneAllowed();
  const slotRef = useRef<HTMLDivElement>(null);
  const active = useActiveWhenVisible(slotRef);

  if (!allowed) {
    return (
      <motion.img src={LOGO_SRC} alt="L8 Events" className={FLAT_SLOT} {...ENTRANCE} />
    );
  }

  return (
    <motion.div ref={slotRef} className={SCENE_SLOT} {...ENTRANCE}>
      {/* The canvas carries no accessible name of its own. */}
      <span className="sr-only">L8 Events</span>
      <SceneErrorBoundary fallback={<SlotLogo />}>
        <Suspense fallback={<SlotLogo />}>
          <Scene active={active} />
        </Suspense>
      </SceneErrorBoundary>
    </motion.div>
  );
};

export default Hero3DLogo;
