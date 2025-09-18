import { Suspense, useRef, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Bounds, Sky } from '@react-three/drei';
import { EffectComposer, GodRays } from '@react-three/postprocessing';
import * as THREE from 'three';

import RoomModelInteractive from '../components/RoomModelInteractive';

// -------------------- CAMERA PRESETS --------------------
export const CAMERA_PRESETS = {
  overview: {
    position: [2.6, 1.6, 3.0],
    target: [0, 1, 0],
    azimuthBaseDeg: 13,
    azimuthSpreadDeg: 20,
    polarBaseDeg: 25,
    polarSpreadDeg: 15,
  },
  workstation: {
    position: [1.8, 1.4, 1.4],
    target: [0.6, 1.0, 0.1],
    azimuthBaseDeg: 18,
    azimuthSpreadDeg: 10,
    polarBaseDeg: 22,
    polarSpreadDeg: 10,
  },
  makerbay: {
    position: [-1.4, 1.5, 1.6],
    target: [-0.6, 1.0, 0.1],
    azimuthBaseDeg: 5,
    azimuthSpreadDeg: 10,
    polarBaseDeg: 28,
    polarSpreadDeg: 10,
  },
  server: {
    position: [0.4, 1.6, -1.8],
    target: [0.2, 1.1, -0.4],
    azimuthBaseDeg: -35,
    azimuthSpreadDeg: 8,
    polarBaseDeg: 30,
    polarSpreadDeg: 8,
  },
  shelf: {
    position: [-2.2, 1.5, -0.5],
    target: [-0.9, 1.1, 0.0],
    azimuthBaseDeg: -10,
    azimuthSpreadDeg: 10,
    polarBaseDeg: 26,
    polarSpreadDeg: 10,
  },
};

const deg = (d) => THREE.MathUtils.degToRad(d);

// -------------------- CAMERA CONTROLLER (inside Canvas) --------------------
const CameraController = forwardRef(function CameraController({ controlsRef }, ref) {
  const { camera } = useThree();
  const animRef = useRef(null);

  useFrame((_, delta) => {
    const anim = animRef.current;
    if (!anim) return;
    const { fromPos, toPos, fromTarget, toTarget, duration, t } = anim;
    const nt = Math.min(t + delta / duration, 1);

    const pos = new THREE.Vector3().lerpVectors(fromPos, toPos, nt);
    const tgt = new THREE.Vector3().lerpVectors(fromTarget, toTarget, nt);

    camera.position.copy(pos);
    camera.up.set(0, 1, 0);

    if (controlsRef?.current) {
      controlsRef.current.target.copy(tgt);
      controlsRef.current.update();
    }

    animRef.current = nt >= 1 ? null : { ...anim, t: nt };
  });

  const startAnim = (toPos, toTarget, duration = 0.9) => {
    const fromPos = camera.position.clone();
    const fromTarget = controlsRef?.current
      ? controlsRef.current.target.clone()
      : new THREE.Vector3();

    const toP = toPos.clone ? toPos.clone() : new THREE.Vector3(...toPos);
    const toT = toTarget.clone ? toTarget.clone() : new THREE.Vector3(...toTarget);

    animRef.current = { fromPos, toPos: toP, fromTarget, toTarget: toT, duration, t: 0 };
  };

  const applyViewPreset = (name, { animate = true } = {}) => {
    const p = CAMERA_PRESETS[name];
    if (!p) return;

    // Update orbit spreads to base ± spread for this preset
    if (controlsRef?.current) {
      controlsRef.current.minAzimuthAngle = deg(p.azimuthBaseDeg - p.azimuthSpreadDeg);
      controlsRef.current.maxAzimuthAngle = deg(p.azimuthBaseDeg + p.azimuthSpreadDeg);
      controlsRef.current.minPolarAngle = deg(Math.max(0, p.polarBaseDeg - p.polarSpreadDeg));
      controlsRef.current.maxPolarAngle = deg(Math.min(179.9, p.polarBaseDeg + p.polarSpreadDeg));
      controlsRef.current.update();
    }

    if (animate) startAnim(p.position, p.target, 0.9);
    else {
      camera.position.set(...p.position);
      if (controlsRef?.current) {
        controlsRef.current.target.set(...p.target);
        controlsRef.current.update();
      }
    }
  };

  useImperativeHandle(ref, () => ({ applyViewPreset }));
  return null;
});

// -------------------- APP --------------------
export default function App() {
  const sunRef = useRef();
  const sunPos = [-12, 10, 3];
  const controlsRef = useRef(null);
  const cameraCtrlRef = useRef(null);

  const goTo = (name) => cameraCtrlRef.current?.applyViewPreset(name);

  return (
    <div style={{ width: '100vw', height: '100dvh' }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        camera={{ position: CAMERA_PRESETS.overview.position, fov: 50, near: 0.1, far: 100 }}
        style={{ width: '100%', height: '100%' }}
        onCreated={() => cameraCtrlRef.current?.applyViewPreset('overview', { animate: false })}
      >
        {/* Camera controller (must be inside Canvas) */}
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
        <mesh ref={sunRef} position={sunPos} frustumCulled={false}>
          <sphereGeometry args={[1.2, 32, 32]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* OrbitControls — limits are updated per preset by CameraController */}
        <OrbitControls ref={controlsRef} makeDefault enableDamping />

        <Suspense fallback={<Html center>Loading room…</Html>}>
          <Bounds fit clip observe margin={1.2}>
            <RoomModelInteractive onGoToGroup={goTo} />
          </Bounds>
        </Suspense>

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
