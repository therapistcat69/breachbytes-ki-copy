'use client';
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Plane } from '@react-three/drei';
import * as THREE from 'three';

const WaterMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 1.0 },
    color: { value: new THREE.Color(0x0040c0) }, 
  },
  vertexShader: `
    uniform float time;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 pos = position;
      pos.z += sin(pos.x * 10.0 + time) * 0.1;
      pos.z += sin(pos.y * 10.0 + time) * 0.1;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform vec3 color;
    varying vec2 vUv;
    void main() {
      // Create ripples and color variations based on sine waves
      float R = sin(vUv.x * 20.0 + time * 2.0) * 0.5 + 0.5;
      float G = sin(vUv.y * 20.0 + time * 2.0) * 0.5 + 0.5;
      vec3 finalColor = color * (R + G);
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
});

const Water = () => {
  const ref = useRef<THREE.ShaderMaterial>(null);
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.uniforms.time.value += delta;
    }
  });

  return (
    <Plane
      args={[100, 100, 256, 256]} 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -1, 0]} 
    >
      <primitive object={WaterMaterial} attach="material" ref={ref} />
    </Plane>
  );
};

const WaterScene2 = () => {
  return (
    <Canvas
      camera={{ position: [0, 5, 15], fov: 75 }} // Set up the default camera position
      style={{ background: 'skyblue' }} // Blue background
    >
      {/* Ambient light: soft illumination */}
      <ambientLight intensity={0.5} />
      {/* Directional light simulates a sun */}
      <directionalLight position={[10, 10, 5]} intensity={1.5} />
      
      <Water />

      {/* OrbitControls: Controls for camera with your mouse */}
        <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            minPolarAngle={Math.PI / 2}
            maxPolarAngle={Math.PI / 2}
        />
    </Canvas>
  );
};

export default WaterScene2;
