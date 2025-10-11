/**
 * == * COORDINATE SYSTEM:
 * - Origin [0, 0, 0]: Back wall center, floor level (model's natural origin)
 * - X axis: left (-) to right (+)
 * - Y axis: down (-) to up (+)
 * - Z axis: back wall (-) to front of room (+)
 * - Camera targets: Usually positive Z values (toward front of room)========================================================================
 * CAMERA PRESETS - Predefined camera positions and targets
 * ================================================================================
 *
 * FOR C/C++/Python DEVELOPERS:
 * Think of this like a configuration file or constants header.
 * Each preset defines where the camera should be positioned and what it should look at.
 *
 * COORDINATE SYSTEM:
 * - Model Origin: [0, 0, 0] is at the back wall center, floor level (in raw model)
 * - Scene Origin: After Bounds centering, [0, 0, 0] becomes the visual center of room
 * - X axis: left (-) to right (+)
 * - Y axis: down (-) to up (+)
 * - Z axis: into screen (-) to out of screen (+)
 *
 * PRESET STRUCTURE:
 * - position: [x, y, z] - Where the camera is located in 3D space
 * - target: [x, y, z] - What point the camera is looking at
 *
 * The camera system automatically:
 * 1. Animates smoothly between these positions when switching views
 * 2. Sets up orbit controls so you can rotate around the target point
 * 3. Maintains free 360° rotation (no restrictions)
 *
 * MODIFICATION TIPS:
 * - Higher Y values = camera positioned higher up
 * - Target Y around 1.0-1.5 works well for room objects at table height
 * - Position should be far enough from target to get good viewing angle
 * - Use the CameraReadout component to see current position/target values when exploring
 */

export const CAMERA_PRESETS = {
  // Main overview - shows the entire room from a good vantage point
  // Back wall origin: camera positioned forward and up from back wall
  overview: {
    position: [0, 2, 6], // Camera positioned at back wall center, up, and forward
    target: [0, 1, 2], // Looking toward middle of room from back wall
  },

  // Workstation area - focuses on desk/computer setup
  workstation: {
    position: [0, 1.4, 2.4], // Camera on right side, forward from back wall
    target: [0, 0.6, 0], // Looking at workstation area
  },

  // Maker area - focuses on 3D printer and electronics
  makerbay: {
    position: [-2, 1.4, 2.1], // Camera on left side, forward from back wall
    target: [-2.2, 1, 1], // Looking at maker/electronics area
  },

  // Server rack - focuses on computer equipment
  server: {
    position: [1.5, 2.6, 3.5], // Camera close to back wall, elevated
    target: [2.4, 1.2, 0.5], // Looking at equipment near back wall
  },

  // Shelf area - focuses on storage and display items
  shelf: {
    position: [0, 2, 2], // Camera on far left side
    target: [0, 1.9, 1], // Looking at shelf area
  },
};

/**
 * HOW TO ADD NEW PRESETS:
 *
 * 1. Explore the scene manually with mouse/touch controls
 * 2. When you find a good view, press 'P' to copy current camera position
 * 3. Add a new entry to this object with a descriptive name
 * 4. Update the group mappings in RoomModelInteractive.tsx if needed
 *
 * Example:
 * newview: {
 *   position: [x, y, z],  // From CameraReadout
 *   target: [x, y, z],    // From CameraReadout
 * },
 */
