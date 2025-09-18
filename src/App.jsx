/**
 * App.jsx
 * -------
 * Wires everything together:
 *  - Sets up the <Canvas>, lights, Sky, postprocessing.
 *  - Hosts OrbitControls (ref is passed down to CameraController).
 *  - Exposes a simple goTo(name) that applies camera presets.
 *
 * Key choices:
 *  - No history API usage (user request) — the browser back/forward
 *    buttons won't affect zooms.
 *  - CameraController sits inside <Canvas> so hooks are safe.
 *  - RoomModelInteractive handles all picking/hover and calls onGoToGroup.
 */

import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Bounds, Sky } from '@react-three/drei';
import { EffectComposer, GodRays } from '@react-three/postprocessing';

import RoomModelInteractive from './components/RoomModelInteractive';
import { CameraController } from './camera/CameraController';
import { CAMERA_PRESETS } from './camera/presets';

export default function App() {
  // Refs shared across components
  const sunRef = useRef(); // Light visualizer for GodRays
  const controlsRef = useRef(null); // OrbitControls instance
  const cameraCtrlRef = useRef(null); // CameraController API

  // Static-ish sun position for Sky + GodRays light mesh
  const sunPos = [-12, 10, 3];

  // Simple API for children to switch views
  const goTo = (name) => cameraCtrlRef.current?.applyViewPreset(name);

  return (
    <div style={{ width: '100vw', height: '100dvh' }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        camera={{ position: CAMERA_PRESETS.overview.position, fov: 50, near: 0.1, far: 100 }}
        style={{ width: '100%', height: '100%' }}
        // Ensure first render starts from the overview view without an animation "snap"
        onCreated={() => cameraCtrlRef.current?.applyViewPreset('overview', { animate: false })}
      >
        {/* Headless controller that animates camera and sets orbit limits */}
        <CameraController ref={cameraCtrlRef} controlsRef={controlsRef} />

        {/* Ambient + key directional light (with shadows) */}
        <ambientLight intensity={0.1} />
        <directionalLight
          position={sunPos}
          intensity={2.4}
          color="#fff4d6"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0002}
          shadow-camera-near={1}
          shadow-camera-far={50}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />

        {/* Procedural sky to match the sun position */}
        <Sky
          sunPosition={sunPos}
          turbidity={4}
          rayleigh={1.2}
          mieCoefficient={0.005}
          mieDirectionalG={0.9}
        />

        {/* Bright sphere to feed the GodRays pass (not culled) */}
        <mesh ref={sunRef} position={sunPos} frustumCulled={false}>
          <sphereGeometry args={[1.2, 32, 32]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* OrbitControls: limits are updated per-preset by CameraController */}
        <OrbitControls ref={controlsRef} makeDefault enableDamping />

        {/* Model + interaction. Bounds keeps things neatly framed initially. */}
        <Suspense fallback={<Html center>Loading room…</Html>}>
          <Bounds fit clip observe margin={1.2}>
            <RoomModelInteractive onGoToGroup={goTo} />
          </Bounds>
        </Suspense>

        {/* Post-processing: God Rays from the sun mesh */}
        <EffectComposer>
          {sunRef.current && (
            <GodRays
              sun={sunRef.current}
              samples={60}
              density={0.9}
              decay={0.95}
              weight={0.3}
              exposure={0.6}
              clampMax={1.0}
              blur
            />
          )}
        </EffectComposer>
      </Canvas>
    </div>
  );
}
