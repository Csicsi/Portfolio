/**
 * ================================================================================
 * CAMERA CONTROLLER - Handles smooth camera animations and preset switching
 * ================================================================================
 *
 * FOR C/C++/Python DEVELOPERS:
 * Think of this like a camera animation system in a 3D engine or game.
 * It handles smooth transitions between different viewpoints.
 *
 * KEY CONCEPTS:
 * - "Headless" component = does logic but renders nothing visible
 * - Interpolation/tweening = smoothly animating between two values over time
 * - Frame-based animation = updating values every render frame (like a game loop)
 *
 * REACT SPECIFIC CONCEPTS:
 * - forwardRef = allows parent components to call methods on this component
 * - useImperativeHandle = exposes specific methods to parent via ref
 * - useFrame = React Three Fiber's render loop (called every frame)
 * - useThree = access to Three.js camera, scene, etc.
 *
 * WHY SEPARATE FILE:
 * - Keeps camera logic isolated and reusable
 * - Must be inside <Canvas> to use React Three Fiber hooks
 * - Prevents "hooks outside Canvas" errors
 *
 * ANIMATION SYSTEM:
 * Similar to tweening in game engines - interpolates between start and end values
 * over a specified duration using linear interpolation (lerp).
 */

// React imports for component logic
import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
// React Three Fiber imports for 3D functionality
import { useFrame, useThree } from '@react-three/fiber';
// Three.js for 3D math and vector operations
import * as THREE from 'three';

// Import our camera preset definitions
import { CAMERA_PRESETS } from './presets';

// TypeScript type for valid preset names (ensures we only use defined presets)
type CameraPresetName = keyof typeof CAMERA_PRESETS;

/**
 * COMPONENT PROPS INTERFACE
 * Like function parameters but for React components
 */
type CameraControllerProps = {
  controlsRef: React.RefObject<any>; // Reference to OrbitControls component
};

/**
 * MAIN CAMERA CONTROLLER COMPONENT
 *
 * FORWARDREF EXPLANATION:
 * - Normally React components can't expose methods to parent components
 * - forwardRef + useImperativeHandle allows parent to call methods on this component
 * - Like exposing a public API from a class
 *
 * GENERIC TYPES:
 * - First type: what methods we expose to parent
 * - Second type: what props this component accepts
 */
export const CameraController = forwardRef<
  { applyViewPreset: (name: CameraPresetName, options?: { animate?: boolean }) => void },
  CameraControllerProps
>(function CameraController({ controlsRef }, ref) {
  // ============================================================================
  // COMPONENT STATE AND REFERENCES
  // ============================================================================

  // Get access to the Three.js camera object (like getting a pointer to camera in 3D engine)
  const { camera } = useThree();

  /**
   * ANIMATION STATE STRUCTURE
   * Stores all information needed for smooth camera transitions
   * Think of this like animation keyframes with interpolation data
   */
  type AnimState = {
    fromPos: THREE.Vector3; // Starting camera position
    toPos: THREE.Vector3; // Target camera position
    fromTarget: THREE.Vector3; // Starting look-at target
    toTarget: THREE.Vector3; // Target look-at point
    duration: number; // How long animation should take (seconds)
    t: number; // Current animation progress (0.0 to 1.0)
  } | null; // null = no animation running

  // Store current animation state (like animation controller state in game engines)
  const animRef = useRef<AnimState>(null);

  // ============================================================================
  // INITIALIZATION AND SETUP
  // ============================================================================

  /**
   * CLEAR ORBIT LIMITS ON COMPONENT MOUNT
   *
   * USEEFFECT EXPLANATION:
   * - Runs code when component mounts (like constructor or initialization)
   * - Dependency array [controlsRef] means it runs when controlsRef changes
   * - Like calling an init() function in C++
   *
   * ORBIT LIMITS EXPLANATION:
   * - OrbitControls can restrict how far user can rotate camera
   * - We set to -Infinity/+Infinity to allow full 360° rotation
   * - minPolarAngle/maxPolarAngle control vertical rotation limits
   * - 0 to Math.PI allows full vertical rotation (straight up to straight down)
   */
  useEffect(() => {
    if (controlsRef?.current) {
      // Remove horizontal rotation limits (allow full 360° spin)
      controlsRef.current.minAzimuthAngle = -Infinity;
      controlsRef.current.maxAzimuthAngle = Infinity;

      // Set vertical rotation limits (0 = straight up, PI = straight down)
      controlsRef.current.minPolarAngle = 0;
      controlsRef.current.maxPolarAngle = Math.PI;

      // Apply the changes to the controls
      controlsRef.current.update();
    }
  }, [controlsRef]);

  // ============================================================================
  // ANIMATION UPDATE LOOP
  // ============================================================================

  /**
   * USEFRAME - React Three Fiber's render loop
   *
   * FOR C/C++/Python DEVELOPERS:
   * - This is like the update() function in a game loop
   * - Called every frame (typically 60 FPS)
   * - Similar to while(running) { update(); render(); } in game engines
   *
   * PARAMETERS:
   * - _ (unused): the Three.js state object
   * - delta: time elapsed since last frame (in seconds)
   *
   * INTERPOLATION (LERP) EXPLANATION:
   * - Linear interpolation smoothly blends between two values
   * - result = start + (end - start) * t
   * - where t goes from 0.0 (start) to 1.0 (end)
   */
  useFrame((_, delta) => {
    // Get current animation state (if any)
    const anim = animRef.current;
    if (!anim) return; // No animation running, skip this frame

    // Destructure animation data for easier access
    const { fromPos, toPos, fromTarget, toTarget, duration, t } = anim;

    // Calculate new animation progress
    // t + delta/duration = current progress + (frame time / total duration)
    // Math.min ensures we don't go past 1.0 (100% complete)
    const nt = Math.min(t + delta / duration, 1);

    // VECTOR INTERPOLATION:
    // lerpVectors() does: result = from + (to - from) * t
    // Creates smooth motion between start and end positions
    const pos = new THREE.Vector3().lerpVectors(fromPos, toPos, nt); // Camera position
    const tgt = new THREE.Vector3().lerpVectors(fromTarget, toTarget, nt); // Look-at target

    // Apply the interpolated values to the actual 3D camera
    camera.position.copy(pos); // Move camera to interpolated position
    camera.up.set(0, 1, 0); // Ensure camera stays upright (Y is up)

    // Update orbit controls to look at the interpolated target
    if (controlsRef?.current) {
      controlsRef.current.target.copy(tgt); // Set orbit center to interpolated target
      controlsRef.current.update(); // Refresh the controls
    }

    // Check if animation is complete and clean up
    if (nt >= 1) {
      animRef.current = null; // Animation finished, clear state
    } else {
      // Animation still running, update progress for next frame
      animRef.current = { ...anim, t: nt };
    }
  });

  // ============================================================================
  // ANIMATION HELPER FUNCTIONS
  // ============================================================================

  /**
   * START ANIMATION FUNCTION
   *
   * PURPOSE:
   * Sets up a new camera animation from current position to target position
   * Like setting up keyframes in animation software
   *
   * PARAMETERS:
   * - toPos: destination camera position (where camera should end up)
   * - toTarget: destination look-at point (what camera should look at)
   * - durationSeconds: how long the animation should take
   *
   * FUNCTION OVERLOADING:
   * Accepts either Three.js Vector3 objects or [x,y,z] arrays for convenience
   */
  const startAnim = (
    toPos: THREE.Vector3 | [number, number, number],
    toTarget: THREE.Vector3 | [number, number, number],
    durationSeconds = 0.9 // Default animation duration
  ) => {
    // Capture current camera state as animation starting point
    const fromPos = camera.position.clone(); // Current camera position

    // Get current orbit target (what camera is currently looking at)
    const fromTarget = controlsRef?.current
      ? controlsRef.current.target.clone() // Use orbit controls target if available
      : new THREE.Vector3(); // Default to origin if no controls

    // Convert input parameters to Three.js Vector3 objects
    // This handles both Vector3 objects and [x,y,z] array inputs
    const toP =
      toPos instanceof THREE.Vector3
        ? toPos.clone() // Already a Vector3, just clone it
        : new THREE.Vector3(...toPos); // Convert [x,y,z] array to Vector3

    const toT =
      toTarget instanceof THREE.Vector3 ? toTarget.clone() : new THREE.Vector3(...toTarget);

    // Set up the animation state object
    animRef.current = {
      fromPos, // Where animation starts (current camera position)
      toPos: toP, // Where animation ends (target camera position)
      fromTarget, // Current look-at point
      toTarget: toT, // Target look-at point
      duration: durationSeconds, // How long animation takes
      t: 0, // Animation progress (starts at 0%)
    };
  };

  // ============================================================================
  // PUBLIC API - Methods exposed to parent components
  // ============================================================================

  /**
   * APPLY VIEW PRESET FUNCTION
   *
   * PURPOSE:
   * Main public method for switching camera views
   * Called by parent component when user clicks objects or UI buttons
   *
   * PARAMETERS:
   * - name: which preset to apply (must be defined in CAMERA_PRESETS)
   * - options: animation settings (animate: true/false)
   *
   * FUNCTIONALITY:
   * - Looks up preset configuration by name
   * - Either animates smoothly to preset or jumps instantly
   * - Sets up orbit controls to work with the new target
   */
  const applyViewPreset = (name: CameraPresetName, { animate = true } = {}) => {
    // Look up the preset configuration
    const p = CAMERA_PRESETS[name];
    if (!p) return; // Preset doesn't exist, do nothing

    if (animate) {
      // Smooth animation to preset (default behavior)
      startAnim(
        p.position as [number, number, number], // Destination camera position
        p.target as [number, number, number], // Destination look-at target
        0.9 // Animation duration in seconds
      );
    } else {
      // Instant jump to preset (no animation)
      // Useful for initial setup or when animation would be distracting
      camera.position.set(...(p.position as [number, number, number]));

      if (controlsRef?.current) {
        controlsRef.current.target.set(...(p.target as [number, number, number]));
        controlsRef.current.update(); // Refresh orbit controls
      }
    }
  };

  // ============================================================================
  // COMPONENT INTERFACE SETUP
  // ============================================================================

  /**
   * EXPOSE PUBLIC METHODS TO PARENT
   *
   * useImperativeHandle allows parent components to call our methods
   * Think of this like exposing a public API from a class
   *
   * The parent can now call: cameraCtrlRef.current.applyViewPreset('overview')
   */
  useImperativeHandle(ref, () => ({
    applyViewPreset, // Only method we expose to parent
  }));

  // Return null because this is a "headless" component
  // It does logic but renders nothing visible to the screen
  return null;
});

/**
 * ================================================================================
 * SUMMARY FOR C/C++/Python DEVELOPERS:
 * ================================================================================
 *
 * This component is like a camera animation controller in a 3D engine.
 *
 * KEY CONCEPTS:
 * - Frame-based animation using linear interpolation (lerp)
 * - Smooth transitions between predefined camera positions
 * - Integration with orbit controls for user interaction
 * - Headless design pattern (logic without visual output)
 *
 * ANIMATION FLOW:
 * 1. applyViewPreset() is called with a preset name
 * 2. startAnim() sets up animation from current to target position
 * 3. useFrame() runs every frame, updating interpolation
 * 4. Camera position/target is updated smoothly over time
 * 5. Animation completes when t reaches 1.0 (100%)
 *
 * INTEGRATION POINTS:
 * - Reads from: CAMERA_PRESETS configuration
 * - Controls: Three.js camera and OrbitControls
 * - Exposes: applyViewPreset() method to parent
 *
 * TO MODIFY:
 * - Change animation duration in startAnim() calls
 * - Add easing functions for different animation curves
 * - Add new public methods for more camera control
 * - Modify orbit limits in useEffect for restricted movement
 */
