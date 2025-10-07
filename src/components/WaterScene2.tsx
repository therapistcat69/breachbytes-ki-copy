'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';

const WaterShaderMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color(0x005b96), // Deep blue
    waterHighlight: new THREE.Color(0xadd8e6), // Light blue for highlights
  },
  `
    uniform float time;
    varying vec2 vUv;
    
    // Simplex noise function for natural-looking waves
    // Source: https://github.com/hughsk/glsl-noise/blob/master/src/classic/3d.glsl
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
    }

    void main() {
      vUv = uv;
      vec3 pos = position;
      
      // Layer multiple noise functions for more complex waves
      float noise_freq_1 = 1.5;
      float noise_amp_1 = 0.15;
      pos.z += snoise(vec3(vUv * noise_freq_1, time * 0.2)) * noise_amp_1;

      float noise_freq_2 = 3.5;
      float noise_amp_2 = 0.05;
      pos.z += snoise(vec3(vUv * noise_freq_2, time * 0.4)) * noise_amp_2;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  `
    uniform float time;
    uniform vec3 color;
    uniform vec3 waterHighlight;
    varying vec2 vUv;
    
    void main() {
      // Create a highlight effect that moves across the water
      float highlight = clamp(0.2, 1.0, 1.0 - (vUv.y + sin(vUv.x * 5.0 + time * 0.5) * 0.1));
      vec3 finalColor = mix(color, waterHighlight, highlight);
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);
extend({ WaterShaderMaterial });

// Component to render the ocean plane
const Ocean = () => {
  const ref = useRef<typeof WaterShaderMaterial & { time: number }>(null);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.time += delta;
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[100, 100, 256, 256]} />
      {/* @ts-ignore */}
      <waterShaderMaterial ref={ref} />
    </mesh>
  );
};

const WaterScene = () => {
  return (
    <Canvas
      camera={{ position: [0, 2, 20], fov: 75 }}
      style={{ background: '#111' }}
    >
      <Sky sunPosition={[100, 20, 100]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[100, 20, 100]} intensity={1.5} />

      <Ocean />

      <OrbitControls
        enableZoom={true}
        enablePan={true}
        minPolarAngle={Math.PI / 2.2}
        maxPolarAngle={Math.PI / 2.05}
        maxDistance={50}
        minDistance={10}
      />
    </Canvas>
  );
};

export default WaterScene;

