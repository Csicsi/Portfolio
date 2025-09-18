import * as THREE from 'three';

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
