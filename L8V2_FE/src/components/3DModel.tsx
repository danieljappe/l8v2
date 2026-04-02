import React, { useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';

interface ModelProps {
  mousePosition: THREE.Vector2;
  onReady?: () => void;
}

function Model({ mousePosition, onReady }: ModelProps) {
  const { scene } = useGLTF('/3dlogo/l8_v2.gltf');
  const modelRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const target = new THREE.Vector3();
  const intersectionPoint = new THREE.Vector3();
  const planeNormal = new THREE.Vector3();
  const plane = new THREE.Plane();
  const raycaster = new THREE.Raycaster();
  const rotationSpeed = 0.05;

  useEffect(() => {
    if (!camera) return;

    const updateTarget = () => {
      planeNormal.set(0, 0, 1).normalize();
      plane.setFromNormalAndCoplanarPoint(planeNormal, scene.position);
      raycaster.setFromCamera(mousePosition, camera);
      raycaster.ray.intersectPlane(plane, intersectionPoint);

      target.set(intersectionPoint.x, intersectionPoint.y, 2);
    };

    updateTarget();
  }, [camera, mousePosition, scene.position]);

  useFrame(() => {
    if (modelRef.current) {
      const direction = target.clone().sub(modelRef.current.position).normalize();
      const desiredRotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
      modelRef.current.quaternion.slerp(desiredRotation, rotationSpeed);
    }
  });

  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.position.set(0, 0, -20);
      modelRef.current.scale.setScalar(0.7);
      // Notify that model is ready
      if (onReady) {
        // Small delay to ensure everything is rendered
        setTimeout(() => onReady(), 100);
      }
    }
  }, [onReady]);

  return <primitive ref={modelRef} object={scene} />;
}

export default Model;
