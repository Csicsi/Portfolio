/**
 * CameraController
 * ----------------
 * A headless (no visual output) R3F component that:
 *  - Animates the camera between positions/targets (smooth tween).
 *  - Updates OrbitControls "soft limits" to base ± spread per preset.
 *  - Exposes an imperative API to parent via ref: { applyViewPreset }.
 *
 * Why separate file?
 *  - Keeps all camera math and animation isolated from App.jsx.
 *  - Avoids the "hooks outside Canvas" error (it lives inside <Canvas>).
 */

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { CAMERA_PRESETS } from './presets';

// Small helper: degrees → radians
const deg = (d) => THREE.MathUtils.degToRad(d);

export const CameraController = forwardRef(function CameraController({ controlsRef }, ref) {
  // R3F hook that gives us access to the shared WebGL camera.
  const { camera } = useThree();

  // We store the current animation state here (null = no animation).
  const animRef = useRef(null);

  /**
   * Per-frame loop (R3F). Lerp camera position/target toward the target values
   * while an animation is active.
   */
  useFrame((_, delta) => {
    const anim = animRef.current;
    if (!anim) return;

    const { fromPos, toPos, fromTarget, toTarget, duration, t } = anim;
    const nt = Math.min(t + delta / duration, 1);

    // Interpolate position and target
    const pos = new THREE.Vector3().lerpVectors(fromPos, toPos, nt);
    const tgt = new THREE.Vector3().lerpVectors(fromTarget, toTarget, nt);

    camera.position.copy(pos);
    camera.up.set(0, 1, 0);

    if (controlsRef?.current) {
      controlsRef.current.target.copy(tgt);
      controlsRef.current.update();
    }

    // Stop when we reach t=1
    animRef.current = nt >= 1 ? null : { ...anim, t: nt };
  });

  /**
   * Start a camera/target tween.
   * @param {Array|THREE.Vector3} toPos    - [x,y,z] or Vector3
   * @param {Array|THREE.Vector3} toTarget - [x,y,z] or Vector3
   * @param {number} durationSeconds
   */
  const startAnim = (toPos, toTarget, durationSeconds = 0.9) => {
    const fromPos = camera.position.clone();
    const fromTarget = controlsRef?.current
      ? controlsRef.current.target.clone()
      : new THREE.Vector3();

    const toP = toPos.clone ? toPos.clone() : new THREE.Vector3(...toPos);
    const toT = toTarget.clone ? toTarget.clone() : new THREE.Vector3(...toTarget);

    animRef.current = {
      fromPos,
      toPos: toP,
      fromTarget,
      toTarget: toT,
      duration: durationSeconds,
      t: 0,
    };
  };

  /**
   * Apply a named preset:
   *  - Update OrbitControls limits to base ± spread.
   *  - Animate (or jump) to the preset position/target.
   */
  const applyViewPreset = (name, { animate = true } = {}) => {
    const p = CAMERA_PRESETS[name];
    if (!p) return;

    // 1) Update orbit "soft limits" (so user can deviate within a bounded range)
    if (controlsRef?.current) {
      controlsRef.current.minAzimuthAngle = deg(p.azimuthBaseDeg - p.azimuthSpreadDeg);
      controlsRef.current.maxAzimuthAngle = deg(p.azimuthBaseDeg + p.azimuthSpreadDeg);
      controlsRef.current.minPolarAngle = deg(Math.max(0, p.polarBaseDeg - p.polarSpreadDeg));
      controlsRef.current.maxPolarAngle = deg(Math.min(179.9, p.polarBaseDeg + p.polarSpreadDeg));
      controlsRef.current.update();
    }

    // 2) Move the camera
    if (animate) startAnim(p.position, p.target, 0.9);
    else {
      camera.position.set(...p.position);
      if (controlsRef?.current) {
        controlsRef.current.target.set(...p.target);
        controlsRef.current.update();
      }
    }
  };

  // Expose imperative API up to <App />
  useImperativeHandle(ref, () => ({ applyViewPreset }));

  // Nothing to render (controller only)
  return null;
});
