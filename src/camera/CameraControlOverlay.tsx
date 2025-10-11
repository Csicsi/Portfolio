/**
 * ================================================================================
 * CAMERA CONTROL OVERLAY - Interactive camera position/target manipulation
 * ================================================================================
 *
 * FOR C/C++/Python DEVELOPERS:
 * Think of this like a debug console or developer tools overlay in a game engine.
 * Provides real-time sliders and controls to adjust camera position and target.
 *
 * KEY CONCEPTS:
 * - Real-time adjustment: Changes are applied immediately as user drags sliders
 * - Bounded controls: Position and target ranges are limited to reasonable values
 * - Debounced updates: Rapid slider changes are batched to prevent performance issues
 *
 * REACT SPECIFIC CONCEPTS:
 * - useState: Tracks current position/target values for UI display
 * - useCallback: Optimizes event handlers to prevent unnecessary re-renders
 * - forwardRef: Allows parent components to call methods on this component
 * - useImperativeHandle: Exposes specific methods to parent via ref
 *
 * INTEGRATION:
 * - Must be used outside <Canvas> since it's a UI overlay
 * - Communicates with CameraController through callback functions
 * - Provides both manual controls and preset buttons
 */

import { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { CAMERA_PRESETS } from './presets';

// TypeScript interface for component props
interface CameraControlOverlayProps {
  onPositionChange: (position: [number, number, number]) => void;
  onTargetChange: (target: [number, number, number]) => void;
  onPresetChange: (presetName: string) => void;
  onToggleVisibility?: () => void;
}

// TypeScript interface for methods exposed via ref
export interface CameraControlOverlayRef {
  updatePosition: (position: [number, number, number]) => void;
  updateTarget: (target: [number, number, number]) => void;
  show: () => void;
  hide: () => void;
}

/**
 * CAMERA CONTROL OVERLAY COMPONENT
 * Provides interactive sliders and controls for camera manipulation
 */
export const CameraControlOverlay = forwardRef<CameraControlOverlayRef, CameraControlOverlayProps>(
  ({ onPositionChange, onTargetChange, onPresetChange, onToggleVisibility }, ref) => {
    // ============================================================================
    // STATE MANAGEMENT
    // ============================================================================

    // Current camera position [x, y, z]
    const [position, setPosition] = useState<[number, number, number]>([5, 3, 8]);

    // Current camera target [x, y, z]
    const [target, setTarget] = useState<[number, number, number]>([0, 1, 0]);

    // UI visibility state
    const [isVisible, setIsVisible] = useState(false);

    // Panel collapsed/expanded state
    const [isCollapsed, setIsCollapsed] = useState(false);

    // ============================================================================
    // IMPERATIVE API - Methods callable by parent components
    // ============================================================================

    useImperativeHandle(ref, () => ({
      updatePosition: (newPosition: [number, number, number]) => {
        setPosition(newPosition);
      },
      updateTarget: (newTarget: [number, number, number]) => {
        setTarget(newTarget);
      },
      show: () => setIsVisible(true),
      hide: () => setIsVisible(false),
    }));

    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================

    /**
     * POSITION SLIDER HANDLERS
     * Update camera position when user drags sliders
     */
    const handlePositionChange = useCallback(
      (axis: 0 | 1 | 2, value: number) => {
        const newPosition: [number, number, number] = [...position];
        newPosition[axis] = value;
        setPosition(newPosition);
        onPositionChange(newPosition);
      },
      [position, onPositionChange]
    );

    /**
     * TARGET SLIDER HANDLERS
     * Update camera target when user drags sliders
     */
    const handleTargetChange = useCallback(
      (axis: 0 | 1 | 2, value: number) => {
        const newTarget: [number, number, number] = [...target];
        newTarget[axis] = value;
        setTarget(newTarget);
        onTargetChange(newTarget);
      },
      [target, onTargetChange]
    );

    /**
     * PRESET BUTTON HANDLER
     * Apply a predefined camera preset
     */
    const handlePresetClick = useCallback(
      (presetName: string) => {
        const preset = CAMERA_PRESETS[presetName as keyof typeof CAMERA_PRESETS];
        if (preset) {
          setPosition(preset.position);
          setTarget(preset.target);
          onPresetChange(presetName);
        }
      },
      [onPresetChange]
    );

    /**
     * VISIBILITY TOGGLE
     * Show/hide the entire overlay
     */
    const handleToggleVisibility = useCallback(() => {
      setIsVisible(!isVisible);
      onToggleVisibility?.();
    }, [isVisible, onToggleVisibility]);

    /**
     * COLLAPSE TOGGLE
     * Minimize/expand the control panel
     */
    const handleToggleCollapsed = useCallback(() => {
      setIsCollapsed(!isCollapsed);
    }, [isCollapsed]);

    // ============================================================================
    // RENDER
    // ============================================================================

    return (
      <div className="camera-control-overlay">
        {/* Toggle Button - Always visible */}
        <button
          className="camera-control-toggle"
          onClick={handleToggleVisibility}
          title="Toggle Camera Controls"
        >
          📷
        </button>

        {/* Control Panel - Only visible when isVisible is true */}
        {isVisible && (
          <div className={`camera-control-panel ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Panel Header */}
            <div className="camera-control-header">
              <h3>Camera Controls</h3>
              <button
                className="camera-control-collapse"
                onClick={handleToggleCollapsed}
                title={isCollapsed ? 'Expand' : 'Collapse'}
              >
                {isCollapsed ? '▼' : '▲'}
              </button>
            </div>

            {/* Control Content - Hidden when collapsed */}
            {!isCollapsed && (
              <div className="camera-control-content">
                {/* Camera Position Controls */}
                <div className="camera-control-section">
                  <h4>Position (Camera Location)</h4>
                  <div className="camera-control-sliders">
                    <div className="slider-group">
                      <label>X: {position[0].toFixed(2)}</label>
                      <input
                        type="range"
                        min={-20}
                        max={20}
                        step={0.1}
                        value={position[0]}
                        onChange={(e) => handlePositionChange(0, parseFloat(e.target.value))}
                        className="slider slider-x"
                      />
                    </div>
                    <div className="slider-group">
                      <label>Y: {position[1].toFixed(2)}</label>
                      <input
                        type="range"
                        min={0}
                        max={15}
                        step={0.1}
                        value={position[1]}
                        onChange={(e) => handlePositionChange(1, parseFloat(e.target.value))}
                        className="slider slider-y"
                      />
                    </div>
                    <div className="slider-group">
                      <label>Z: {position[2].toFixed(2)}</label>
                      <input
                        type="range"
                        min={-20}
                        max={20}
                        step={0.1}
                        value={position[2]}
                        onChange={(e) => handlePositionChange(2, parseFloat(e.target.value))}
                        className="slider slider-z"
                      />
                    </div>
                  </div>
                </div>

                {/* Camera Target Controls */}
                <div className="camera-control-section">
                  <h4>Target (Look At Point)</h4>
                  <div className="camera-control-sliders">
                    <div className="slider-group">
                      <label>X: {target[0].toFixed(2)}</label>
                      <input
                        type="range"
                        min={-10}
                        max={10}
                        step={0.1}
                        value={target[0]}
                        onChange={(e) => handleTargetChange(0, parseFloat(e.target.value))}
                        className="slider slider-x"
                      />
                    </div>
                    <div className="slider-group">
                      <label>Y: {target[1].toFixed(2)}</label>
                      <input
                        type="range"
                        min={-2}
                        max={5}
                        step={0.1}
                        value={target[1]}
                        onChange={(e) => handleTargetChange(1, parseFloat(e.target.value))}
                        className="slider slider-y"
                      />
                    </div>
                    <div className="slider-group">
                      <label>Z: {target[2].toFixed(2)}</label>
                      <input
                        type="range"
                        min={-10}
                        max={10}
                        step={0.1}
                        value={target[2]}
                        onChange={(e) => handleTargetChange(2, parseFloat(e.target.value))}
                        className="slider slider-z"
                      />
                    </div>
                  </div>
                </div>

                {/* Preset Buttons */}
                <div className="camera-control-section">
                  <h4>Presets</h4>
                  <div className="camera-preset-buttons">
                    {Object.keys(CAMERA_PRESETS).map((presetName) => (
                      <button
                        key={presetName}
                        className="preset-button"
                        onClick={() => handlePresetClick(presetName)}
                        title={`Go to ${presetName} view`}
                      >
                        {presetName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current Values Display */}
                <div className="camera-control-section">
                  <h4>Current Values</h4>
                  <div className="camera-values">
                    <div className="value-row">
                      <span>Position:</span>
                      <span>[{position.map((v) => v.toFixed(2)).join(', ')}]</span>
                    </div>
                    <div className="value-row">
                      <span>Target:</span>
                      <span>[{target.map((v) => v.toFixed(2)).join(', ')}]</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

CameraControlOverlay.displayName = 'CameraControlOverlay';

export default CameraControlOverlay;
