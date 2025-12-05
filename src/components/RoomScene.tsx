import '../App.css';
import { Suspense, useRef, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Sky } from '@react-three/drei';
import { EffectComposer, GodRays } from '@react-three/postprocessing';
import RoomModelInteractive from './RoomModelInteractive';
import { CameraController } from '../camera/CameraController';
import { CAMERA_PRESETS } from '../camera/presets';

export default function RoomScene() {
  const sunRef = useRef(null);
  const [sunReady, setSunReady] = useState(false);
  const controlsRef = useRef(null);
  const cameraCtrlRef = useRef<{
    applyViewPreset: (name: any, options?: { animate?: boolean }) => void;
    setPosition: (position: [number, number, number]) => void;
    setTarget: (target: [number, number, number]) => void;
    setPositionAndTarget: (
      position: [number, number, number],
      target: [number, number, number]
    ) => void;
  } | null>(null);

  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const sunPos: [number, number, number] = [-12, 10, 3];

  const handleSunRef = useCallback(
    (node: any) => {
      sunRef.current = node;
      if (node && !sunReady) setSunReady(true);
      if (!node && sunReady) setSunReady(false);
    },
    [sunReady]
  );

  const goTo = (name: any) => {
    cameraCtrlRef.current?.applyViewPreset(name);
    setIsZoomedIn(name !== 'overview');
  };

  const goToOverview = () => goTo('overview');

  return (
    <div style={{ width: '100vw', height: '100dvh' }}>
      {isZoomedIn && (
        <div
          title="Back to overview"
          onClick={goToOverview}
          style={{
            position: 'fixed',
            top: 12,
            right: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'rgba(0,0,0,0.55)',
            color: '#fff',
            fontSize: 20,
            lineHeight: '36px',
            cursor: 'pointer',
            userSelect: 'none',
            backdropFilter: 'blur(4px)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
            zIndex: 2147483646,
            pointerEvents: 'auto',
          }}
        >
          ×
        </div>
      )}

      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        camera={{
          position: CAMERA_PRESETS.overview.position as [number, number, number],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        style={{ width: '100%', height: '100%' }}
        onCreated={() => cameraCtrlRef.current?.applyViewPreset('overview', { animate: false })}
      >
        <CameraController ref={cameraCtrlRef} controlsRef={controlsRef} />

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

        <Sky
          sunPosition={sunPos}
          turbidity={4}
          rayleigh={1.2}
          mieCoefficient={0.005}
          mieDirectionalG={0.9}
        />

        <mesh ref={handleSunRef} position={sunPos} frustumCulled={false}>
          <sphereGeometry args={[1.2, 32, 32]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        <OrbitControls ref={controlsRef} makeDefault enableDamping />

        <Suspense fallback={<Html center>Loading room…</Html>}>
          <RoomModelInteractive
            onGoToGroup={goTo}
            onGoToOverview={goToOverview}
            isZoomedIn={isZoomedIn}
          />
        </Suspense>

        <EffectComposer>
          {sunReady && sunRef.current ? (
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
          ) : (
            <></>
          )}
        </EffectComposer>
      </Canvas>
    </div>
  );
}
