import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { CAMERA_PRESETS } from './presets';

type CameraPresetName = keyof typeof CAMERA_PRESETS;

type CameraControllerProps = {
  controlsRef: React.RefObject<any>;
};

export const CameraController = forwardRef<
  { applyViewPreset: (name: CameraPresetName, options?: { animate?: boolean }) => void },
  CameraControllerProps
>(function CameraController({ controlsRef }, ref) {
  const { camera } = useThree();

  type AnimState = {
    fromPos: THREE.Vector3;
    toPos: THREE.Vector3;
    fromTarget: THREE.Vector3;
    toTarget: THREE.Vector3;
    duration: number;
    t: number;
  } | null;

  const animRef = useRef<AnimState>(null);

  useEffect(() => {
    if (controlsRef?.current) {
      controlsRef.current.minAzimuthAngle = -Infinity;
      controlsRef.current.maxAzimuthAngle = Infinity;

      controlsRef.current.minPolarAngle = 0;
      controlsRef.current.maxPolarAngle = Math.PI;

      controlsRef.current.update();
    }
  }, [controlsRef]);

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

    if (nt >= 1) {
      animRef.current = null;
    } else {
      animRef.current = { ...anim, t: nt };
    }
  });

  const setPosition = (position: [number, number, number]) => {
    animRef.current = null;

    camera.position.set(...position);

    if (controlsRef?.current) {
      controlsRef.current.update();
    }
  };

  const setTarget = (target: [number, number, number]) => {
    animRef.current = null;

    if (controlsRef?.current) {
      controlsRef.current.target.set(...target);
      controlsRef.current.update();
    }
  };

  const setPositionAndTarget = (
    position: [number, number, number],
    target: [number, number, number]
  ) => {
    animRef.current = null;

    camera.position.set(...position);

    if (controlsRef?.current) {
      controlsRef.current.target.set(...target);
      controlsRef.current.update();
    }
  };

  const startAnim = (
    toPos: THREE.Vector3 | [number, number, number],
    toTarget: THREE.Vector3 | [number, number, number],
    durationSeconds = 0.9
  ) => {
    const fromPos = camera.position.clone();

    const fromTarget = controlsRef?.current
      ? controlsRef.current.target.clone()
      : new THREE.Vector3();

    const toP = toPos instanceof THREE.Vector3 ? toPos.clone() : new THREE.Vector3(...toPos);

    const toT =
      toTarget instanceof THREE.Vector3 ? toTarget.clone() : new THREE.Vector3(...toTarget);

    animRef.current = {
      fromPos,
      toPos: toP,
      fromTarget,
      toTarget: toT,
      duration: durationSeconds,
      t: 0,
    };
  };

  const applyViewPreset = (name: CameraPresetName, { animate = true } = {}) => {
    const p = CAMERA_PRESETS[name];
    if (!p) return;

    if (animate) {
      startAnim(p.position as [number, number, number], p.target as [number, number, number], 0.9);
    } else {
      camera.position.set(...(p.position as [number, number, number]));

      if (controlsRef?.current) {
        controlsRef.current.target.set(...(p.target as [number, number, number]));
        controlsRef.current.update();
      }
    }
  };

  useImperativeHandle(ref, () => ({
    applyViewPreset,
    setPosition,
    setTarget,
    setPositionAndTarget,
  }));

  return null;
});
