import { Suspense, useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';
import Model from './3DModel';

// Moving stars component that responds to mouse
const MovingStars = ({ mousePosition }: { mousePosition: THREE.Vector2 }) => {
  const starsRef = useRef<THREE.Points>(null);
  
  useFrame(() => {
    if (starsRef.current) {
      // Very subtle rotation based on mouse position
      starsRef.current.rotation.x = mousePosition.y * 0.03;
      starsRef.current.rotation.y = mousePosition.x * 0.03;
    }
  });

  return (
    <Stars 
      ref={starsRef}
      radius={100} 
      depth={50} 
      count={5000} 
      factor={4} 
      saturation={0} 
      fade 
      speed={1}
    />
  );
};

// Moving lights component that follows mouse
const MovingLights = ({ mousePosition }: { mousePosition: THREE.Vector2 }) => {
  const light1Ref = useRef<THREE.PointLight>(null);
  const light2Ref = useRef<THREE.PointLight>(null);
  
  useFrame(() => {
    if (light1Ref.current) {
      light1Ref.current.position.x = 10 + mousePosition.x * 2;
      light1Ref.current.position.y = 10 + mousePosition.y * 2;
    }
    if (light2Ref.current) {
      light2Ref.current.position.x = -10 - mousePosition.x * 1.5;
      light2Ref.current.position.y = -10 - mousePosition.y * 1.5;
    }
  });

  return (
    <>
      <pointLight 
        ref={light1Ref}
        position={[10, 10, 10]} 
        intensity={0.5} 
        color="#ff6b6b" 
      />
      <pointLight 
        ref={light2Ref}
        position={[-10, -10, -10]} 
        intensity={0.3} 
        color="#4ecdc4" 
      />
    </>
  );
};

interface SceneProps {
  onReady?: () => void;
}

const Scene = ({ onReady }: SceneProps) => {
  const [mousePosition, setMousePosition] = useState(new THREE.Vector2());
  const [canvasReady, setCanvasReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const readyCallbackRef = useRef<(() => void) | undefined>(onReady);
  const modelReadyRef = useRef(false);
  
  // Update ref when onReady changes
  useEffect(() => {
    readyCallbackRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
      setMousePosition(new THREE.Vector2(mouseX, mouseY));
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Check if both are ready
  useEffect(() => {
    if (canvasReady && modelReady && readyCallbackRef.current) {
      const win = window as Window & { __sceneTimeout?: number };
      if (win.__sceneTimeout) {
        clearTimeout(win.__sceneTimeout);
        delete win.__sceneTimeout;
      }
      readyCallbackRef.current();
    }
  }, [canvasReady, modelReady]);

  const handleModelReady = () => {
    modelReadyRef.current = true;
    setModelReady(true);
  };

  return (
    <Canvas 
      camera={{ position: [0, 0, 0], fov: 75 }}
      style={{ background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)' }}
      onCreated={() => {
        setCanvasReady(true);
        // Fallback timeout in case model takes too long to load
        const timeout = setTimeout(() => {
          if (readyCallbackRef.current && !modelReadyRef.current) {
            readyCallbackRef.current();
          }
        }, 3000);
        // Store timeout to clear if model loads first
        const win = window as Window & { __sceneTimeout?: number };
        win.__sceneTimeout = timeout;
      }}
    >
      {/* Moving atmospheric background elements */}
      <MovingStars mousePosition={mousePosition} />
      
      {/* Environment for realistic lighting */}
      <Environment preset="night" />
      
      {/* Enhanced lighting setup with mouse interaction */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[0, 10, 5]} intensity={1} />
      <MovingLights mousePosition={mousePosition} />
      
      <Suspense fallback={null}>
        <Model mousePosition={mousePosition} onReady={handleModelReady} />
      </Suspense>
    </Canvas>
  );
};

export default Scene;
