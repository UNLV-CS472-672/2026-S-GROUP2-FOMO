export const CREATE_CAMERA_REVEAL_THRESHOLD = 0.25;

// Use a wider hysteresis window so slow drags near the boundary do not chatter.
export const CREATE_CAMERA_REVEAL_RESET_THRESHOLD = 0.17;

// Activate the camera pipeline before it becomes visible so the feed is ready
// by the time the fade-in completes.
export const CREATE_CAMERA_WARMUP_THRESHOLD = 0.02;

// The hint→camera cross-fade is driven directly off animatedIndex so the
// transition is physically coupled to the gesture, with no timing artifacts.
// Starting late (0.55) gives the camera pipeline ~53% of drawer travel to warm up.
export const CREATE_CAMERA_CROSSFADE_START = 0.25;
export const CREATE_CAMERA_CROSSFADE_END = 0.5;
