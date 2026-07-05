import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Stars } from '@react-three/drei';

function AnimatedSphere({ isActive }) {
  const meshRef = useRef();
  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      meshRef.current.rotation.y = t * (isActive ? 0.4 : 0.12);
      meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.2;
    }
  });
  return (
    <Sphere ref={meshRef} args={[1, 96, 96]} scale={isActive ? 1.75 : 1.5}>
      <MeshDistortMaterial
        color={isActive ? '#21F1A8' : '#0a1a14'}
        attach="material"
        distort={isActive ? 0.45 : 0.08}
        speed={isActive ? 5 : 1.2}
        roughness={0.05}
        metalness={0.9}
        wireframe={!isActive}
        emissive={isActive ? '#21F1A8' : '#000000'}
        emissiveIntensity={isActive ? 0.6 : 0}
      />
    </Sphere>
  );
}

export default function Earth({ isActive }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      <Canvas camera={{ position: [0, 0, 3.5], fov: 55 }}>
        <ambientLight intensity={isActive ? 0.4 : 0.15} />
        <pointLight position={[4, 4, 4]} intensity={isActive ? 2 : 0.5} color={isActive ? '#21F1A8' : '#ffffff'} />
        <pointLight position={[-4, -4, -4]} intensity={0.3} color="#21F1A8" />
        <Stars radius={100} depth={50} count={isActive ? 2000 : 800} factor={3} fade speed={isActive ? 2 : 0.5} />
        <AnimatedSphere isActive={isActive} />
      </Canvas>
    </div>
  );
}
