/**
 * ================================================================================
 * CAMERA PRESETS - Predefined camera positions and targets
 * ================================================================================
 *
 * FOR C/C++/Python DEVELOPERS:
 * Think of this like a configuration file or constants header.
 * Each preset defines where the camera should be positioned and what it should look at.
 *
 * COORDINATE SYSTEM:
 * - Origin [0, 0, 0] is the center of the room (after Bounds centering)
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
  overview: {
    position: [2.6, 1.6, 3.0], // Camera positioned right, up, and forward of room center
    target: [0, 1, 0], // Looking at center of room, slightly above floor
  },

  // Workstation area - focuses on desk/computer setup
  workstation: {
    position: [2.6, 1.6, 3.2], // Similar to overview but slightly further forward
    target: [2.6, 1.55, 2.55], // Looking at workstation area (right side of room)
  },

  // Maker area - focuses on 3D printer and electronics
  makerbay: {
    position: [-1.4, 1.5, 1.6], // Camera on left side of room
    target: [-0.6, 1.0, 0.1], // Looking at maker/electronics area
  },

  // Server rack - focuses on computer equipment
  server: {
    position: [0.4, 1.6, -1.8], // Camera positioned behind the room
    target: [0.2, 1.1, -0.4], // Looking at server/equipment area
  },

  // Shelf area - focuses on storage and display items
  shelf: {
    position: [-2.2, 1.5, -0.5], // Camera on far left side
    target: [-0.9, 1.1, 0.0], // Looking at shelf area
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
