/**
 * App.tsx - Main Application Component
 * ====================================
 *
 * OVERVIEW FOR C/C++/Python DEVELOPERS:
 * This is the main entry point, like main() in C++ or if __name__ == "__main__" in Python.
 * React works with "components" - think of them like classes that render HTML and manage state.
 *
 * WEB CONCEPTS EXPLAINED:
 * - JSX: The HTML-like syntax mixed with JavaScript (like template strings but more powerful)
 * - useState: React's way to store variables that cause re-rendering when changed (like reactive variables)
 * - useRef: Like a pointer that persists across renders, used to access DOM elements or store mutable values
 * - useCallback: Memoizes functions to prevent unnecessary re-creation (performance optimization)
 *
 * THREE.JS CONCEPTS:
 * - Canvas: The 3D rendering context (like OpenGL context)
 * - Scene: Container for all 3D objects (like a world/level in a game)
 * - Camera: Viewpoint into the 3D world (like a player's eyes)
 * - Lights: Illuminate 3D objects (like light sources in ray tracing)
 *
 * ARCHITECTURE FLOW:
 * 1. Set up 3D scene with lights, sky, and camera controls
 * 2. Load and display the room model with interaction
 * 3. Apply post-processing effects (like shaders/filters)
 * 4. Handle user interactions (clicks, camera movement)
 */

// REACT IMPORTS - Core React functionality
import { Suspense, useRef, useState, useCallback } from 'react';

// THREE.JS IMPORTS - 3D rendering through React Three Fiber (R3F)
import { Canvas } from '@react-three/fiber'; // Main 3D canvas (like OpenGL context)
import { OrbitControls, Html, Bounds, Sky } from '@react-three/drei'; // Common 3D utilities
import { EffectComposer, GodRays } from '@react-three/postprocessing'; // Visual effects (like post-processing shaders)

// LOCAL COMPONENT IMPORTS - Our custom components
import RoomModelInteractive from './components/RoomModelInteractive'; // Handles 3D model and user interaction
import { CameraController } from './camera/CameraController'; // Manages camera animations and positioning
import { CAMERA_PRESETS } from './camera/presets'; // Static camera position definitions
import CameraReadout from './camera/CameraReadout'; // Debug overlay showing camera info

/**
 * Main App Component Function
 * ===========================
 *
 * REACT CONCEPTS:
 * - This is a "functional component" (like a function that returns HTML)
 * - export default means this is the main thing other files import
 * - React calls this function every time something changes (like a render loop)
 */
export default function App() {
  // ============================================================================
  // STATE MANAGEMENT - Variables that cause re-rendering when changed
  // ============================================================================

  /**
   * REFS - Think of these like pointers that don't change between renders
   * - useRef() creates a mutable reference that persists across re-renders
   * - Like storing a pointer to an object, but in React's system
   */

  // Reference to the sun mesh (3D sphere) for post-processing effects
  const sunRef = useRef(null);

  // Boolean state to track if the sun mesh is ready for rendering effects
  // useState() creates a reactive variable - when it changes, component re-renders
  const [sunReady, setSunReady] = useState(false);

  // Reference to OrbitControls instance (handles mouse/touch camera movement)
  const controlsRef = useRef(null);

  // Reference to CameraController component with TypeScript type annotation
  // This allows calling methods on the CameraController from outside
  const cameraCtrlRef = useRef<{
    applyViewPreset: (name: any, options?: { animate?: boolean }) => void;
  } | null>(null);

  // Tracks UI state - are we zoomed into a specific object or viewing overview?
  const [isZoomedIn, setIsZoomedIn] = useState(false);

  // ============================================================================
  // CONFIGURATION - Static values used throughout the scene
  // ============================================================================

  // 3D coordinates for sun position [x, y, z] - affects lighting and sky
  // This is like a const vec3 in C++ or a tuple in Python
  const sunPos: [number, number, number] = [-12, 10, 3];

  // ============================================================================
  // EVENT HANDLERS & CALLBACKS - Functions that respond to user actions or system events
  // ============================================================================

  /**
   * useCallback - Memoizes functions to prevent unnecessary re-creation
   * Like caching a function pointer to avoid recomputation in a render loop
   * The dependency array [sunReady] means this function only changes when sunReady changes
   */
  const handleSunRef = useCallback(
    (node: any) => {
      sunRef.current = node; // Store reference to the 3D sun mesh
      // Update state based on whether mesh exists or not
      if (node && !sunReady) setSunReady(true);
      if (!node && sunReady) setSunReady(false);
    },
    [sunReady] // Dependency array - function recreated only when sunReady changes
  );

  /**
   * Camera Preset Navigation Functions
   * Like switching between different viewpoints in a 3D application
   */
  const goTo = (name: any) => {
    // Call method on CameraController (like calling a method on an object pointer)
    // The ?. operator is "optional chaining" - like null checking before dereferencing
    cameraCtrlRef.current?.applyViewPreset(name);

    // Update UI state - are we looking at overview or a specific object?
    setIsZoomedIn(name !== 'overview');
  };

  // Convenience function to return to main overview
  const goToOverview = () => goTo('overview');

  // ============================================================================
  // RENDER FUNCTION - This returns the HTML/JSX that gets displayed
  // ============================================================================

  /**
   * JSX SYNTAX EXPLANATION:
   * - JSX looks like HTML but is actually JavaScript that creates DOM elements
   * - {} brackets let you embed JavaScript expressions inside JSX
   * - Components like <div> become actual HTML elements
   * - Custom components like <Canvas> are React components that render complex functionality
   *
   * THINK OF THIS LIKE:
   * - return statement in a function that builds a UI tree
   * - Similar to building a scene graph in 3D graphics
   * - Each element is like a node with properties and children
   */
  return (
    // Main container - full viewport size (100vw = 100% viewport width, 100dvh = 100% viewport height)
    <div style={{ width: '100vw', height: '100dvh' }}>
      {/* 
        DEBUG OVERLAY - Fixed UI element outside the 3D canvas
        - Shows current camera position and settings
        - Position fixed means it stays in same screen position when camera moves
        - Think of this like a HUD (heads-up display) in a game
      */}
      <CameraReadout controlsRef={controlsRef} />

      {/* 
        CONDITIONAL CLOSE BUTTON - Only shows when zoomed into an object
        - {condition && <element>} is React's way of conditional rendering
        - Like an if statement that controls whether HTML gets created
        - Similar to setVisible(true/false) on a UI element in other frameworks
      */}
      {isZoomedIn && (
        <div
          title="Back to overview" // Tooltip text on hover
          onClick={goToOverview} // Click handler - calls function when clicked
          style={{
            position: 'fixed', // Fixed to screen, not affected by 3D camera
            top: 12, // 12 pixels from top of screen
            right: 12, // 12 pixels from right edge
            display: 'flex', // CSS flexbox for centering content
            alignItems: 'center', // Center vertically
            justifyContent: 'center', // Center horizontally
            width: 36, // 36x36 pixel button
            height: 36,
            borderRadius: 10, // Rounded corners
            background: 'rgba(0,0,0,0.55)', // Semi-transparent black background
            color: '#fff', // White text
            fontSize: 20,
            lineHeight: '36px',
            cursor: 'pointer', // Show hand cursor on hover
            userSelect: 'none', // Prevent text selection
            backdropFilter: 'blur(4px)', // Blur background behind button
            boxShadow: '0 2px 10px rgba(0,0,0,0.25)', // Drop shadow
            zIndex: 2147483646, // High z-index to appear above 3D content
            pointerEvents: 'auto', // Ensure button can be clicked
          }}
        >
          × {/* X symbol for close button */}
        </div>
      )}

      {/* 
        ============================================================================
        THREE.JS CANVAS - The main 3D rendering area
        ============================================================================
        
        CANVAS EXPLANATION:
        - Think of this like initializing OpenGL context in C++ or creating a renderer
        - Everything inside <Canvas> has access to Three.js functionality
        - Similar to a game engine's render window or viewport
        
        CANVAS PROPERTIES EXPLAINED:
      */}
      <Canvas
        shadows // Enable shadow rendering (like enabling shadow mapping in OpenGL)
        dpr={[1, 2]} // Device pixel ratio - handles high-DPI screens (retina displays)
        gl={{
          // WebGL renderer settings (like OpenGL context parameters)
          antialias: true, // Smooth jagged edges
          alpha: false, // No transparency (solid background)
          powerPreference: 'high-performance', // Prefer dedicated GPU over integrated
        }}
        camera={{
          // Default camera settings (like setting up a camera in 3D space)
          position: CAMERA_PRESETS.overview.position as [number, number, number], // Where camera starts
          fov: 50, // Field of view in degrees (like zoom level)
          near: 0.1, // Near clipping plane (closest visible distance)
          far: 100, // Far clipping plane (furthest visible distance)
        }}
        style={{ width: '100%', height: '100%' }} // Fill the parent container
        // Callback fired when Three.js is ready - sets initial camera position without animation
        onCreated={() => cameraCtrlRef.current?.applyViewPreset('overview', { animate: false })}
      >
        {/* 
          ========================================================================
          SCENE COMPONENTS - The 3D objects and systems inside the Canvas
          ========================================================================
          
          IMPORTANT: Everything inside <Canvas> has access to Three.js context
          Think of this like objects added to a 3D scene graph
        */}

        {/* 
          CAMERA CONTROLLER - Handles smooth camera animations and user input
          - "Headless" means it doesn't render anything visible, just manages camera
          - Like a camera controller class in a 3D engine
          - ref={cameraCtrlRef} lets us call methods on it from outside
        */}
        <CameraController ref={cameraCtrlRef} controlsRef={controlsRef} />

        {/* 
          LIGHTING SETUP - Illuminates the 3D scene
          Think of this like setting up lights in a 3D modeling program
        */}

        {/* Ambient light - provides base illumination from all directions (like global illumination) */}
        <ambientLight intensity={0.1} />

        {/* Directional light - like sunlight, parallel rays from one direction */}
        <directionalLight
          position={sunPos} // Where the light comes from [x, y, z]
          intensity={2.4} // Brightness level
          color="#fff4d6" // Warm white color (hex color code)
          castShadow // Enable this light to cast shadows
          // Shadow mapping parameters - like configuring shadow quality in a game engine
          shadow-mapSize-width={2048} // Shadow texture resolution (higher = better quality)
          shadow-mapSize-height={2048}
          shadow-bias={-0.0002} // Fixes shadow acne (z-fighting)
          // Shadow camera bounds - defines area that can cast shadows
          shadow-camera-near={1} // Near clipping for shadow camera
          shadow-camera-far={50} // Far clipping for shadow camera
          shadow-camera-left={-8} // Left bound of shadow area
          shadow-camera-right={8} // Right bound of shadow area
          shadow-camera-top={8} // Top bound of shadow area
          shadow-camera-bottom={-8} // Bottom bound of shadow area
        />

        {/* 
          PROCEDURAL SKY - Generates realistic sky based on sun position
          Like a skybox but procedurally generated using atmospheric scattering
        */}
        <Sky
          sunPosition={sunPos} // Where the sun appears in the sky
          turbidity={4} // Atmospheric haze/pollution (1-10)
          rayleigh={1.2} // Blue light scattering
          mieCoefficient={0.005} // Particle scattering in atmosphere
          mieDirectionalG={0.9} // How directional the scattering is
        />

        {/* 
          SUN VISUALIZATION - Bright sphere that appears as the sun
          This is needed for the GodRays post-processing effect
        */}
        <mesh ref={handleSunRef} position={sunPos} frustumCulled={false}>
          {/* 
            MESH EXPLANATION:
            - mesh = geometry + material (like a 3D model with textures)
            - Think of geometry as the shape/vertices, material as the surface properties
          */}
          <sphereGeometry args={[1.2, 32, 32]} />{' '}
          {/* Sphere: radius=1.2, 32x32 segments for smoothness */}
          <meshBasicMaterial color="#ffffff" /> {/* Unlit white material (always bright) */}
        </mesh>

        {/* 
          ORBIT CONTROLS - Handles mouse/touch interaction with the camera
          Like FPS camera controls but orbiting around a target point
        */}
        <OrbitControls
          ref={controlsRef} // Reference so other components can control it
          makeDefault // Make this the default camera controller
          enableDamping // Smooth motion with momentum (like inertia)
        />

        {/* 
          ========================================================================
          3D MODEL LOADING AND INTERACTION
          ========================================================================
        */}

        {/* 
          SUSPENSE - React's way of handling async loading (like loading screens)
          Shows fallback content while the 3D model is loading from the server
          Similar to showing a loading spinner while loading game assets
        */}
        <Suspense fallback={<Html center>Loading room…</Html>}>
          {/* 
            BOUNDS - Automatically centers and scales the 3D model
            Like auto-framing in a 3D modeling program
            - fit: scales model to fit in view
            - clip: prevents model from going outside bounds  
            - observe: updates when model changes
            - margin: adds padding around the model
          */}
          <Bounds fit clip observe margin={1.2}>
            {/* 
              MAIN 3D MODEL COMPONENT - Loads room.glb and handles user interaction
              This is where all the clicking, hovering, and object selection happens
            */}
            <RoomModelInteractive
              onGoToGroup={goTo} // Callback when user clicks an object group
              onGoToOverview={goToOverview} // Callback to return to overview
            />
          </Bounds>
        </Suspense>

        {/* 
          ========================================================================
          POST-PROCESSING EFFECTS - Visual effects applied after 3D rendering
          ========================================================================
          
          Think of this like Instagram filters but for 3D graphics
          Effects are applied to the final rendered image
        */}
        <EffectComposer>
          {/* 
            CONDITIONAL EFFECT RENDERING - Only add God Rays when sun mesh is ready
            God Rays = light beams emanating from bright light sources
            Like lens flares or sunbeams through fog
          */}
          {sunReady && sunRef.current ? (
            <GodRays
              sun={sunRef.current} // Source of the light rays (our sun mesh)
              samples={60} // Quality setting (more = better but slower)
              density={0.9} // How thick/dense the rays appear
              decay={0.95} // How quickly rays fade with distance
              weight={0.3} // Overall intensity of the effect
              exposure={0.6} // Brightness adjustment
              clampMax={1.0} // Maximum brightness clamp
              blur // Add blur to soften the effect
            />
          ) : (
            <></> // Empty fragment - renders nothing when sun isn't ready
          )}
        </EffectComposer>
      </Canvas>
    </div>
  );
}

/**
 * ================================================================================
 * SUMMARY FOR C/C++/Python DEVELOPERS:
 * ================================================================================
 *
 * This App component is like the main() function of your 3D application.
 *
 * KEY CONCEPTS MAPPING:
 * - React components = Classes/functions that render UI
 * - useState = Reactive variables that trigger re-rendering
 * - useRef = Persistent references/pointers across renders
 * - JSX = Template language for building UI trees
 * - Canvas = OpenGL/DirectX context for 3D rendering
 * - Three.js = High-level 3D graphics library (like Unity/Unreal but for web)
 * - Post-processing = Shader effects applied to final render
 *
 * EXECUTION FLOW:
 * 1. Component initializes with default state
 * 2. 3D scene is set up with lights, sky, and camera
 * 3. Room model is loaded asynchronously
 * 4. User can interact with objects (click to zoom)
 * 5. Camera animates smoothly between preset positions
 * 6. Visual effects are applied to enhance the scene
 *
 * TO MODIFY THIS:
 * - Change sunPos to move lighting and sky
 * - Modify camera presets in CAMERA_PRESETS
 * - Adjust lighting intensity/colors for different moods
 * - Tweak post-processing parameters for visual effects
 * - Add new UI elements outside the Canvas for 2D overlays
 */
