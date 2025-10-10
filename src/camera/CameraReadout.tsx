// camera/CameraReadout.tsx
import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';

type Props = {
  controlsRef: React.RefObject<any>;
  /** Update frequency in seconds for the on-screen panel (not the console) */
  panelUpdateS?: number;
};

function toFixed3(n: number) {
  return Number(n.toFixed(3));
}

function vecToArray3(v: THREE.Vector3) {
  return [toFixed3(v.x), toFixed3(v.y), toFixed3(v.z)] as [number, number, number];
}

/** Compute azimuth & polar (degrees) from camera->target vector */
function sphericalAnglesDeg(from: THREE.Vector3, to: THREE.Vector3) {
  const offset = new THREE.Vector3().copy(from).sub(to);
  const s = new THREE.Spherical().setFromVector3(offset);

  // Three.js Spherical: phi = polar angle from +Y (0..PI), theta = around Y (-PI..PI)
  const polarDeg = THREE.MathUtils.radToDeg(s.phi);
  let azimuthDeg = THREE.MathUtils.radToDeg(s.theta);
  // Normalize to [-180, 180]
  if (azimuthDeg > 180) azimuthDeg -= 360;
  if (azimuthDeg < -180) azimuthDeg += 360;

  return { azimuthDeg: toFixed3(azimuthDeg), polarDeg: toFixed3(polarDeg) };
}

export default function CameraReadout({ controlsRef, panelUpdateS = 200 }: Props) {
  const [panel, setPanel] = useState(() => ({
    position: [0, 0, 0] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    azimuthBaseDeg: 0,
    polarBaseDeg: 0,
    fov: 50,
    near: 0.1,
    far: 1000,
  }));

  // Build the JSON object you can paste into your presets file
  const presetJSON = useMemo(() => {
    return {
      position: panel.position,
      target: panel.target,
    };
  }, [panel]);

  // Update panel data using RAF for smooth updates
  useEffect(() => {
    let animationId: number;
    let lastUpdate = 0;

    const updatePanel = (timestamp: number) => {
      if (timestamp - lastUpdate >= panelUpdateS) {
        if (controlsRef.current) {
          const controls = controlsRef.current;
          const camera = controls.object; // OrbitControls stores the camera as .object

          if (camera) {
            const target = controls.target || new THREE.Vector3();
            const pos = camera.position;
            const { azimuthDeg, polarDeg } = sphericalAnglesDeg(pos, target);

            setPanel({
              position: vecToArray3(pos),
              target: vecToArray3(target),
              azimuthBaseDeg: azimuthDeg,
              polarBaseDeg: polarDeg,
              fov: toFixed3(camera.fov ?? 50),
              near: toFixed3(camera.near ?? 0.1),
              far: toFixed3(camera.far ?? 1000),
            });
          }
        }
        lastUpdate = timestamp;
      }
      animationId = requestAnimationFrame(updatePanel);
    };

    animationId = requestAnimationFrame(updatePanel);
    return () => cancelAnimationFrame(animationId);
  }, [controlsRef, panelUpdateS]);

  // Keyboard: press "P" to print the current preset JSON to console and copy to clipboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'p') {
        const txt = JSON.stringify(presetJSON, null, 2);
        // eslint-disable-next-line no-console
        console.log('[Camera Preset]', txt);
        navigator.clipboard?.writeText(txt).catch(() => {});
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [presetJSON]);

  const copyToClipboard = () => {
    const txt = JSON.stringify(presetJSON, null, 2);
    navigator.clipboard?.writeText(txt).catch(() => {});
    // eslint-disable-next-line no-console
    console.log('[Camera Preset]', txt);
  };

  return (
    <div
      style={{
        position: 'fixed', // pinned to viewport
        left: 12,
        bottom: 12,
        maxWidth: 380,
        padding: '10px 12px',
        borderRadius: 12,
        background: 'rgba(0,0,0,0.55)',
        color: '#fff',
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: 12,
        lineHeight: 1.35,
        backdropFilter: 'blur(4px)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
        userSelect: 'text',
        whiteSpace: 'pre-wrap',
        zIndex: 2147483647, // ensure above canvas + other UI
        pointerEvents: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6, gap: 8 }}>
        <strong style={{ fontSize: 12, opacity: 0.9 }}>Camera Readout</strong>
        <button
          onClick={copyToClipboard}
          style={{
            marginLeft: 'auto',
            padding: '4px 8px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.25)',
            background: 'rgba(255,255,255,0.08)',
            color: '#fff',
            cursor: 'pointer',
          }}
          title='Copy JSON (also logged to console). Keyboard: press "P".'
        >
          Copy JSON
        </button>
      </div>

      {`{
  "position": [${panel.position.join(', ')}],
  "target": [${panel.target.join(', ')}]
}`}

      <div style={{ opacity: 0.7, marginTop: 6 }}>
        Press <kbd>P</kbd> to log + copy current camera preset.
      </div>
    </div>
  );
}
