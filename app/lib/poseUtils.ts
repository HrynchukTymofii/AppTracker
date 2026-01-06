/**
 * Pose Detection Utilities
 *
 * Uses MediaPipe pose landmarks to detect exercises:
 * - Pushups: Track shoulder-elbow-wrist angle
 * - Squats: Track hip-knee-ankle angle
 * - Plank: Detect horizontal body alignment
 */

import type { Landmarks, Landmark } from 'vision-camera-pose-landmarks-plugin';

export type ExerciseType =
  | 'pushups' | 'squats' | 'plank'  // existing
  | 'jumping-jacks' | 'lunges' | 'crunches' | 'shoulder-press'
  | 'leg-raises' | 'high-knees' | 'pull-ups'  // new rep-based
  | 'wall-sit' | 'side-plank';  // new hold-based
export type ExercisePosition = 'up' | 'down' | 'neutral' | 'holding';

export interface Point3D {
  x: number;
  y: number;
  z?: number;
}

export interface ExerciseState {
  type: ExerciseType;
  position: ExercisePosition;
  repCount: number;
  holdTime: number; // For plank, in seconds
  lastPositionChange: number;
  isInCorrectForm: boolean;
  feedback: string;
  currentAngle?: number;
}

/**
 * Calculate angle between three points (in degrees)
 * Point B is the vertex of the angle
 */
export function calculateAngle(a: Point3D, b: Point3D, c: Point3D): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);

  if (angle > 180.0) {
    angle = 360 - angle;
  }

  return angle;
}

/**
 * Calculate distance between two points
 */
export function calculateDistance(a: Point3D, b: Point3D): number {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

/**
 * Calculate body angle relative to horizontal (for plank detection)
 */
export function calculateBodyAngle(shoulder: Point3D, hip: Point3D, ankle: Point3D): number {
  const deltaY = ankle.y - shoulder.y;
  const deltaX = ankle.x - shoulder.x;
  const angleRadians = Math.atan2(deltaY, deltaX);
  return Math.abs((angleRadians * 180.0) / Math.PI);
}

/**
 * Check if a landmark is visible enough
 */
function isLandmarkVisible(landmark: Landmark, threshold = 0.5): boolean {
  return landmark.visibility >= threshold;
}

/**
 * Convert Landmark to Point3D
 */
function toPoint(landmark: Landmark): Point3D {
  return { x: landmark.x, y: landmark.y, z: landmark.z };
}

/**
 * Detect pushup position using named landmarks
 */
export function detectPushupPosition(landmarks: Landmarks): {
  position: ExercisePosition;
  angle: number;
  isValid: boolean;
} {
  const { leftShoulder, leftElbow, leftWrist, rightShoulder, rightElbow, rightWrist } = landmarks;

  // Check visibility
  const leftVisible = isLandmarkVisible(leftShoulder) && isLandmarkVisible(leftElbow) && isLandmarkVisible(leftWrist);
  const rightVisible = isLandmarkVisible(rightShoulder) && isLandmarkVisible(rightElbow) && isLandmarkVisible(rightWrist);

  if (!leftVisible && !rightVisible) {
    return { position: 'neutral', angle: 0, isValid: false };
  }

  let avgAngle = 0;
  let count = 0;

  if (leftVisible) {
    const leftAngle = calculateAngle(toPoint(leftShoulder), toPoint(leftElbow), toPoint(leftWrist));
    avgAngle += leftAngle;
    count++;
  }

  if (rightVisible) {
    const rightAngle = calculateAngle(toPoint(rightShoulder), toPoint(rightElbow), toPoint(rightWrist));
    avgAngle += rightAngle;
    count++;
  }

  avgAngle = avgAngle / count;

  // Pushup positions based on elbow angle
  if (avgAngle < 100) {
    return { position: 'down', angle: avgAngle, isValid: true };
  } else if (avgAngle > 150) {
    return { position: 'up', angle: avgAngle, isValid: true };
  }

  return { position: 'neutral', angle: avgAngle, isValid: true };
}

/**
 * Detect squat position using named landmarks
 */
export function detectSquatPosition(landmarks: Landmarks): {
  position: ExercisePosition;
  angle: number;
  isValid: boolean;
} {
  const { leftHip, leftKnee, leftAnkle, rightHip, rightKnee, rightAnkle } = landmarks;

  const leftVisible = isLandmarkVisible(leftHip) && isLandmarkVisible(leftKnee) && isLandmarkVisible(leftAnkle);
  const rightVisible = isLandmarkVisible(rightHip) && isLandmarkVisible(rightKnee) && isLandmarkVisible(rightAnkle);

  if (!leftVisible && !rightVisible) {
    return { position: 'neutral', angle: 0, isValid: false };
  }

  let avgAngle = 0;
  let count = 0;

  if (leftVisible) {
    const leftAngle = calculateAngle(toPoint(leftHip), toPoint(leftKnee), toPoint(leftAnkle));
    avgAngle += leftAngle;
    count++;
  }

  if (rightVisible) {
    const rightAngle = calculateAngle(toPoint(rightHip), toPoint(rightKnee), toPoint(rightAnkle));
    avgAngle += rightAngle;
    count++;
  }

  avgAngle = avgAngle / count;

  // Squat positions based on knee angle
  if (avgAngle < 100) {
    return { position: 'down', angle: avgAngle, isValid: true };
  } else if (avgAngle > 160) {
    return { position: 'up', angle: avgAngle, isValid: true };
  }

  return { position: 'neutral', angle: avgAngle, isValid: true };
}

/**
 * Detect plank position using named landmarks
 */
export function detectPlankPosition(landmarks: Landmarks): {
  position: ExercisePosition;
  bodyAngle: number;
  isValid: boolean;
} {
  const { leftShoulder, rightShoulder, leftHip, rightHip, leftAnkle, rightAnkle } = landmarks;

  const shouldersVisible = isLandmarkVisible(leftShoulder) && isLandmarkVisible(rightShoulder);
  const hipsVisible = isLandmarkVisible(leftHip) && isLandmarkVisible(rightHip);
  const anklesVisible = isLandmarkVisible(leftAnkle) && isLandmarkVisible(rightAnkle);

  if (!shouldersVisible || !hipsVisible || !anklesVisible) {
    return { position: 'neutral', bodyAngle: 0, isValid: false };
  }

  // Calculate midpoints
  const midShoulder: Point3D = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
  };

  const midHip: Point3D = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
  };

  const midAnkle: Point3D = {
    x: (leftAnkle.x + rightAnkle.x) / 2,
    y: (leftAnkle.y + rightAnkle.y) / 2,
  };

  const bodyAngle = calculateBodyAngle(midShoulder, midHip, midAnkle);

  // Check hip alignment
  const shoulderAnkleDistance = calculateDistance(midShoulder, midAnkle);
  const shoulderHipDistance = calculateDistance(midShoulder, midHip);
  const hipAnkleDistance = calculateDistance(midHip, midAnkle);

  const alignmentRatio = (shoulderHipDistance + hipAnkleDistance) / shoulderAnkleDistance;
  const isAligned = alignmentRatio < 1.15;

  const isHorizontal = bodyAngle < 30 || bodyAngle > 150;

  if (isHorizontal && isAligned) {
    return { position: 'holding', bodyAngle, isValid: true };
  }

  return { position: 'neutral', bodyAngle, isValid: true };
}

/**
 * Detect jumping jacks position - measures arm and leg spread
 */
export function detectJumpingJacksPosition(landmarks: Landmarks): {
  position: ExercisePosition;
  angle: number;
  isValid: boolean;
} {
  const { leftShoulder, rightShoulder, leftWrist, rightWrist, leftAnkle, rightAnkle, leftHip, rightHip } = landmarks;

  const shouldersVisible = isLandmarkVisible(leftShoulder) && isLandmarkVisible(rightShoulder);
  const wristsVisible = isLandmarkVisible(leftWrist) && isLandmarkVisible(rightWrist);
  const anklesVisible = isLandmarkVisible(leftAnkle) && isLandmarkVisible(rightAnkle);
  const hipsVisible = isLandmarkVisible(leftHip) && isLandmarkVisible(rightHip);

  if (!shouldersVisible || !wristsVisible || !anklesVisible || !hipsVisible) {
    return { position: 'neutral', angle: 0, isValid: false };
  }

  // Calculate arm spread (distance between wrists relative to shoulder width)
  const shoulderWidth = calculateDistance(toPoint(leftShoulder), toPoint(rightShoulder));
  const wristSpread = calculateDistance(toPoint(leftWrist), toPoint(rightWrist));
  const armSpreadRatio = wristSpread / shoulderWidth;

  // Calculate leg spread (distance between ankles relative to hip width)
  const hipWidth = calculateDistance(toPoint(leftHip), toPoint(rightHip));
  const ankleSpread = calculateDistance(toPoint(leftAnkle), toPoint(rightAnkle));
  const legSpreadRatio = ankleSpread / hipWidth;

  // Combined spread indicator
  const spreadScore = (armSpreadRatio + legSpreadRatio) / 2;

  // Down position: arms and legs spread wide
  if (spreadScore > 2.5) {
    return { position: 'down', angle: spreadScore * 30, isValid: true };
  }
  // Up position: arms down, legs together
  else if (spreadScore < 1.5) {
    return { position: 'up', angle: spreadScore * 30, isValid: true };
  }

  return { position: 'neutral', angle: spreadScore * 30, isValid: true };
}

/**
 * Detect lunges position - tracks front knee angle
 */
export function detectLungesPosition(landmarks: Landmarks): {
  position: ExercisePosition;
  angle: number;
  isValid: boolean;
} {
  const { leftHip, leftKnee, leftAnkle, rightHip, rightKnee, rightAnkle } = landmarks;

  const leftVisible = isLandmarkVisible(leftHip) && isLandmarkVisible(leftKnee) && isLandmarkVisible(leftAnkle);
  const rightVisible = isLandmarkVisible(rightHip) && isLandmarkVisible(rightKnee) && isLandmarkVisible(rightAnkle);

  if (!leftVisible && !rightVisible) {
    return { position: 'neutral', angle: 0, isValid: false };
  }

  // Find the front leg (the one with smaller knee angle)
  let frontKneeAngle = 180;

  if (leftVisible) {
    const leftAngle = calculateAngle(toPoint(leftHip), toPoint(leftKnee), toPoint(leftAnkle));
    frontKneeAngle = Math.min(frontKneeAngle, leftAngle);
  }

  if (rightVisible) {
    const rightAngle = calculateAngle(toPoint(rightHip), toPoint(rightKnee), toPoint(rightAnkle));
    frontKneeAngle = Math.min(frontKneeAngle, rightAngle);
  }

  // Lunge down: front knee bent < 110°
  if (frontKneeAngle < 110) {
    return { position: 'down', angle: frontKneeAngle, isValid: true };
  }
  // Standing: legs relatively straight > 155°
  else if (frontKneeAngle > 155) {
    return { position: 'up', angle: frontKneeAngle, isValid: true };
  }

  return { position: 'neutral', angle: frontKneeAngle, isValid: true };
}

/**
 * Detect crunches/sit-ups position - tracks torso-leg angle
 */
export function detectCrunchesPosition(landmarks: Landmarks): {
  position: ExercisePosition;
  angle: number;
  isValid: boolean;
} {
  const { leftShoulder, rightShoulder, leftHip, rightHip, leftKnee, rightKnee } = landmarks;

  const shouldersVisible = isLandmarkVisible(leftShoulder) && isLandmarkVisible(rightShoulder);
  const hipsVisible = isLandmarkVisible(leftHip) && isLandmarkVisible(rightHip);
  const kneesVisible = isLandmarkVisible(leftKnee) && isLandmarkVisible(rightKnee);

  if (!shouldersVisible || !hipsVisible || !kneesVisible) {
    return { position: 'neutral', angle: 0, isValid: false };
  }

  const midShoulder: Point3D = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
  };

  const midHip: Point3D = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
  };

  const midKnee: Point3D = {
    x: (leftKnee.x + rightKnee.x) / 2,
    y: (leftKnee.y + rightKnee.y) / 2,
  };

  // Calculate shoulder-hip-knee angle (torso to thigh angle)
  const crunchAngle = calculateAngle(midShoulder, midHip, midKnee);

  // Crunch up: torso raised, angle < 100°
  if (crunchAngle < 100) {
    return { position: 'up', angle: crunchAngle, isValid: true };
  }
  // Lying down: torso flat, angle > 140°
  else if (crunchAngle > 140) {
    return { position: 'down', angle: crunchAngle, isValid: true };
  }

  return { position: 'neutral', angle: crunchAngle, isValid: true };
}

/**
 * Detect shoulder press position - tracks elbow angle (arms overhead)
 */
export function detectShoulderPressPosition(landmarks: Landmarks): {
  position: ExercisePosition;
  angle: number;
  isValid: boolean;
} {
  const { leftShoulder, leftElbow, leftWrist, rightShoulder, rightElbow, rightWrist } = landmarks;

  const leftVisible = isLandmarkVisible(leftShoulder) && isLandmarkVisible(leftElbow) && isLandmarkVisible(leftWrist);
  const rightVisible = isLandmarkVisible(rightShoulder) && isLandmarkVisible(rightElbow) && isLandmarkVisible(rightWrist);

  if (!leftVisible && !rightVisible) {
    return { position: 'neutral', angle: 0, isValid: false };
  }

  let avgAngle = 0;
  let count = 0;

  if (leftVisible) {
    const leftAngle = calculateAngle(toPoint(leftShoulder), toPoint(leftElbow), toPoint(leftWrist));
    avgAngle += leftAngle;
    count++;
  }

  if (rightVisible) {
    const rightAngle = calculateAngle(toPoint(rightShoulder), toPoint(rightElbow), toPoint(rightWrist));
    avgAngle += rightAngle;
    count++;
  }

  avgAngle = avgAngle / count;

  // Press up: arms extended overhead > 160°
  if (avgAngle > 160) {
    return { position: 'up', angle: avgAngle, isValid: true };
  }
  // Down position: elbows bent at ~90° (< 110°)
  else if (avgAngle < 110) {
    return { position: 'down', angle: avgAngle, isValid: true };
  }

  return { position: 'neutral', angle: avgAngle, isValid: true };
}

/**
 * Detect leg raises position - tracks hip angle while lying
 */
export function detectLegRaisesPosition(landmarks: Landmarks): {
  position: ExercisePosition;
  angle: number;
  isValid: boolean;
} {
  const { leftShoulder, rightShoulder, leftHip, rightHip, leftKnee, rightKnee } = landmarks;

  const shouldersVisible = isLandmarkVisible(leftShoulder) && isLandmarkVisible(rightShoulder);
  const hipsVisible = isLandmarkVisible(leftHip) && isLandmarkVisible(rightHip);
  const kneesVisible = isLandmarkVisible(leftKnee) && isLandmarkVisible(rightKnee);

  if (!shouldersVisible || !hipsVisible || !kneesVisible) {
    return { position: 'neutral', angle: 0, isValid: false };
  }

  const midShoulder: Point3D = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
  };

  const midHip: Point3D = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
  };

  const midKnee: Point3D = {
    x: (leftKnee.x + rightKnee.x) / 2,
    y: (leftKnee.y + rightKnee.y) / 2,
  };

  // Calculate shoulder-hip-knee angle (leg raise angle)
  const legAngle = calculateAngle(midShoulder, midHip, midKnee);

  // Legs raised: angle < 110° (legs up toward ceiling)
  if (legAngle < 110) {
    return { position: 'up', angle: legAngle, isValid: true };
  }
  // Legs down: angle > 160° (legs flat on ground)
  else if (legAngle > 160) {
    return { position: 'down', angle: legAngle, isValid: true };
  }

  return { position: 'neutral', angle: legAngle, isValid: true };
}

/**
 * Detect high knees position - tracks knee height relative to hip
 */
export function detectHighKneesPosition(landmarks: Landmarks): {
  position: ExercisePosition;
  angle: number;
  isValid: boolean;
} {
  const { leftHip, leftKnee, rightHip, rightKnee } = landmarks;

  const leftVisible = isLandmarkVisible(leftHip) && isLandmarkVisible(leftKnee);
  const rightVisible = isLandmarkVisible(rightHip) && isLandmarkVisible(rightKnee);

  if (!leftVisible && !rightVisible) {
    return { position: 'neutral', angle: 0, isValid: false };
  }

  // Check if either knee is raised above hip level
  // Note: y increases downward in screen coordinates
  let kneeRaised = false;
  let heightRatio = 0;

  if (leftVisible) {
    const leftHeightDiff = leftHip.y - leftKnee.y; // Positive if knee is above hip
    if (leftHeightDiff > 0.05) { // Knee is above hip
      kneeRaised = true;
      heightRatio = Math.max(heightRatio, leftHeightDiff);
    }
  }

  if (rightVisible) {
    const rightHeightDiff = rightHip.y - rightKnee.y;
    if (rightHeightDiff > 0.05) {
      kneeRaised = true;
      heightRatio = Math.max(heightRatio, rightHeightDiff);
    }
  }

  // Convert to pseudo-angle for display
  const displayAngle = heightRatio * 500;

  if (kneeRaised) {
    return { position: 'up', angle: displayAngle, isValid: true };
  }

  return { position: 'down', angle: displayAngle, isValid: true };
}

/**
 * Detect pull-ups position - similar to pushups but vertical orientation
 */
export function detectPullUpsPosition(landmarks: Landmarks): {
  position: ExercisePosition;
  angle: number;
  isValid: boolean;
} {
  const { leftShoulder, leftElbow, leftWrist, rightShoulder, rightElbow, rightWrist } = landmarks;

  const leftVisible = isLandmarkVisible(leftShoulder) && isLandmarkVisible(leftElbow) && isLandmarkVisible(leftWrist);
  const rightVisible = isLandmarkVisible(rightShoulder) && isLandmarkVisible(rightElbow) && isLandmarkVisible(rightWrist);

  if (!leftVisible && !rightVisible) {
    return { position: 'neutral', angle: 0, isValid: false };
  }

  let avgAngle = 0;
  let count = 0;

  if (leftVisible) {
    const leftAngle = calculateAngle(toPoint(leftShoulder), toPoint(leftElbow), toPoint(leftWrist));
    avgAngle += leftAngle;
    count++;
  }

  if (rightVisible) {
    const rightAngle = calculateAngle(toPoint(rightShoulder), toPoint(rightElbow), toPoint(rightWrist));
    avgAngle += rightAngle;
    count++;
  }

  avgAngle = avgAngle / count;

  // Pull-up top: arms bent, angle < 90°
  if (avgAngle < 90) {
    return { position: 'up', angle: avgAngle, isValid: true };
  }
  // Hanging: arms extended, angle > 150°
  else if (avgAngle > 150) {
    return { position: 'down', angle: avgAngle, isValid: true };
  }

  return { position: 'neutral', angle: avgAngle, isValid: true };
}

/**
 * Detect wall sit position - knee at ~90°, body upright (hold exercise)
 */
export function detectWallSitPosition(landmarks: Landmarks): {
  position: ExercisePosition;
  bodyAngle: number;
  isValid: boolean;
} {
  const { leftHip, leftKnee, leftAnkle, rightHip, rightKnee, rightAnkle, leftShoulder, rightShoulder } = landmarks;

  const leftVisible = isLandmarkVisible(leftHip) && isLandmarkVisible(leftKnee) && isLandmarkVisible(leftAnkle);
  const rightVisible = isLandmarkVisible(rightHip) && isLandmarkVisible(rightKnee) && isLandmarkVisible(rightAnkle);
  const shouldersVisible = isLandmarkVisible(leftShoulder) && isLandmarkVisible(rightShoulder);

  if ((!leftVisible && !rightVisible) || !shouldersVisible) {
    return { position: 'neutral', bodyAngle: 0, isValid: false };
  }

  // Calculate knee angles
  let avgKneeAngle = 0;
  let count = 0;

  if (leftVisible) {
    const leftAngle = calculateAngle(toPoint(leftHip), toPoint(leftKnee), toPoint(leftAnkle));
    avgKneeAngle += leftAngle;
    count++;
  }

  if (rightVisible) {
    const rightAngle = calculateAngle(toPoint(rightHip), toPoint(rightKnee), toPoint(rightAnkle));
    avgKneeAngle += rightAngle;
    count++;
  }

  avgKneeAngle = avgKneeAngle / count;

  // Wall sit position: knees at approximately 90° (80-110° range)
  const isKneesBent = avgKneeAngle >= 70 && avgKneeAngle <= 120;

  if (isKneesBent) {
    return { position: 'holding', bodyAngle: avgKneeAngle, isValid: true };
  }

  return { position: 'neutral', bodyAngle: avgKneeAngle, isValid: true };
}

/**
 * Detect side plank position - body sideways with arm extended (hold exercise)
 */
export function detectSidePlankPosition(landmarks: Landmarks): {
  position: ExercisePosition;
  bodyAngle: number;
  isValid: boolean;
} {
  const { leftShoulder, rightShoulder, leftHip, rightHip, leftAnkle, rightAnkle, leftWrist, rightWrist } = landmarks;

  const shouldersVisible = isLandmarkVisible(leftShoulder) && isLandmarkVisible(rightShoulder);
  const hipsVisible = isLandmarkVisible(leftHip) && isLandmarkVisible(rightHip);
  const anklesVisible = isLandmarkVisible(leftAnkle) && isLandmarkVisible(rightAnkle);

  if (!shouldersVisible || !hipsVisible || !anklesVisible) {
    return { position: 'neutral', bodyAngle: 0, isValid: false };
  }

  // Calculate midpoints for body alignment
  const midShoulder: Point3D = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
  };

  const midHip: Point3D = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
  };

  const midAnkle: Point3D = {
    x: (leftAnkle.x + rightAnkle.x) / 2,
    y: (leftAnkle.y + rightAnkle.y) / 2,
  };

  // Check body alignment (shoulder-hip-ankle should be roughly linear)
  const shoulderAnkleDistance = calculateDistance(midShoulder, midAnkle);
  const shoulderHipDistance = calculateDistance(midShoulder, midHip);
  const hipAnkleDistance = calculateDistance(midHip, midAnkle);

  const alignmentRatio = (shoulderHipDistance + hipAnkleDistance) / shoulderAnkleDistance;
  const isAligned = alignmentRatio < 1.2;

  // Calculate body angle relative to horizontal
  const bodyAngle = calculateBodyAngle(midShoulder, midHip, midAnkle);

  // Side plank: body at an angle (not completely horizontal like regular plank)
  // Typically 30-70 degrees from horizontal when viewed from front
  const isSidePosition = bodyAngle >= 20 && bodyAngle <= 160;

  if (isAligned && isSidePosition) {
    return { position: 'holding', bodyAngle, isValid: true };
  }

  return { position: 'neutral', bodyAngle, isValid: true };
}

/**
 * Create initial exercise state
 */
export function createExerciseState(type: ExerciseType): ExerciseState {
  return {
    type,
    position: 'neutral',
    repCount: 0,
    holdTime: 0,
    lastPositionChange: Date.now(),
    isInCorrectForm: false,
    feedback: getInitialFeedback(type),
  };
}

function getInitialFeedback(type: ExerciseType): string {
  switch (type) {
    case 'pushups':
      return 'Get into pushup position';
    case 'squats':
      return 'Stand with feet shoulder-width apart';
    case 'plank':
      return 'Get into plank position';
    case 'jumping-jacks':
      return 'Stand with arms at sides';
    case 'lunges':
      return 'Stand tall, ready to step forward';
    case 'crunches':
      return 'Lie on your back, knees bent';
    case 'shoulder-press':
      return 'Hold weights at shoulder height';
    case 'leg-raises':
      return 'Lie flat on your back';
    case 'high-knees':
      return 'Stand tall, ready to run in place';
    case 'pull-ups':
      return 'Hang from the bar with arms extended';
    case 'wall-sit':
      return 'Slide down the wall, knees at 90°';
    case 'side-plank':
      return 'Get into side plank position';
    default:
      return 'Get ready';
  }
}

/**
 * Update exercise state based on detected pose (for use in JS thread)
 */
export function updateExerciseState(
  state: ExerciseState,
  landmarks: Landmarks,
  deltaTimeMs: number
): ExerciseState {
  switch (state.type) {
    case 'pushups': {
      const detection = detectPushupPosition(landmarks);

      if (!detection.isValid) {
        return {
          ...state,
          isInCorrectForm: false,
          feedback: 'Position your whole body in frame',
          currentAngle: undefined,
        };
      }

      let newRepCount = state.repCount;
      let feedback = state.feedback;

      // Count rep: down -> up transition
      if (state.position === 'down' && detection.position === 'up') {
        newRepCount = state.repCount + 1;
        feedback = `Great! ${newRepCount} pushups`;
      } else if (detection.position === 'down') {
        feedback = 'Push up!';
      } else if (detection.position === 'up') {
        feedback = 'Go down';
      } else {
        feedback = 'Lower your chest to the ground';
      }

      return {
        ...state,
        position: detection.position,
        repCount: newRepCount,
        lastPositionChange: detection.position !== state.position ? Date.now() : state.lastPositionChange,
        isInCorrectForm: detection.isValid,
        feedback,
        currentAngle: Math.round(detection.angle),
      };
    }

    case 'squats': {
      const detection = detectSquatPosition(landmarks);

      if (!detection.isValid) {
        return {
          ...state,
          isInCorrectForm: false,
          feedback: 'Position your whole body in frame',
          currentAngle: undefined,
        };
      }

      let newRepCount = state.repCount;
      let feedback = state.feedback;

      // Count rep: down -> up transition
      if (state.position === 'down' && detection.position === 'up') {
        newRepCount = state.repCount + 1;
        feedback = `Great! ${newRepCount} squats`;
      } else if (detection.position === 'down') {
        feedback = 'Stand up!';
      } else if (detection.position === 'up') {
        feedback = 'Squat down';
      } else {
        feedback = 'Bend your knees more';
      }

      return {
        ...state,
        position: detection.position,
        repCount: newRepCount,
        lastPositionChange: detection.position !== state.position ? Date.now() : state.lastPositionChange,
        isInCorrectForm: detection.isValid,
        feedback,
        currentAngle: Math.round(detection.angle),
      };
    }

    case 'plank': {
      const detection = detectPlankPosition(landmarks);

      if (!detection.isValid) {
        return {
          ...state,
          isInCorrectForm: false,
          feedback: 'Position your whole body in frame',
          currentAngle: undefined,
        };
      }

      let holdTime = state.holdTime;
      let feedback = state.feedback;
      const position = detection.position;

      if (position === 'holding') {
        // Increment hold time
        if (state.position === 'holding') {
          holdTime = state.holdTime + (deltaTimeMs / 1000);
        }
        const seconds = Math.floor(holdTime);
        feedback = `Hold it! ${seconds}s`;
      } else {
        feedback = 'Keep your body straight';
      }

      return {
        ...state,
        position,
        holdTime,
        lastPositionChange: Date.now(),
        isInCorrectForm: position === 'holding',
        feedback,
        currentAngle: Math.round(detection.bodyAngle),
      };
    }

    case 'jumping-jacks': {
      const detection = detectJumpingJacksPosition(landmarks);

      if (!detection.isValid) {
        return {
          ...state,
          isInCorrectForm: false,
          feedback: 'Position your whole body in frame',
          currentAngle: undefined,
        };
      }

      let newRepCount = state.repCount;
      let feedback = state.feedback;

      // Count rep: up -> down -> up cycle (start closed, spread, close)
      if (state.position === 'down' && detection.position === 'up') {
        newRepCount = state.repCount + 1;
        feedback = `Great! ${newRepCount} jumping jacks`;
      } else if (detection.position === 'down') {
        feedback = 'Bring arms down!';
      } else if (detection.position === 'up') {
        feedback = 'Jump and spread!';
      } else {
        feedback = 'Spread arms and legs wide';
      }

      return {
        ...state,
        position: detection.position,
        repCount: newRepCount,
        lastPositionChange: detection.position !== state.position ? Date.now() : state.lastPositionChange,
        isInCorrectForm: detection.isValid,
        feedback,
        currentAngle: Math.round(detection.angle),
      };
    }

    case 'lunges': {
      const detection = detectLungesPosition(landmarks);

      if (!detection.isValid) {
        return {
          ...state,
          isInCorrectForm: false,
          feedback: 'Position your whole body in frame',
          currentAngle: undefined,
        };
      }

      let newRepCount = state.repCount;
      let feedback = state.feedback;

      if (state.position === 'down' && detection.position === 'up') {
        newRepCount = state.repCount + 1;
        feedback = `Great! ${newRepCount} lunges`;
      } else if (detection.position === 'down') {
        feedback = 'Stand up!';
      } else if (detection.position === 'up') {
        feedback = 'Step forward and lunge';
      } else {
        feedback = 'Bend your front knee more';
      }

      return {
        ...state,
        position: detection.position,
        repCount: newRepCount,
        lastPositionChange: detection.position !== state.position ? Date.now() : state.lastPositionChange,
        isInCorrectForm: detection.isValid,
        feedback,
        currentAngle: Math.round(detection.angle),
      };
    }

    case 'crunches': {
      const detection = detectCrunchesPosition(landmarks);

      if (!detection.isValid) {
        return {
          ...state,
          isInCorrectForm: false,
          feedback: 'Position your whole body in frame',
          currentAngle: undefined,
        };
      }

      let newRepCount = state.repCount;
      let feedback = state.feedback;

      if (state.position === 'up' && detection.position === 'down') {
        newRepCount = state.repCount + 1;
        feedback = `Great! ${newRepCount} crunches`;
      } else if (detection.position === 'up') {
        feedback = 'Lower down!';
      } else if (detection.position === 'down') {
        feedback = 'Crunch up!';
      } else {
        feedback = 'Lift your shoulders off the ground';
      }

      return {
        ...state,
        position: detection.position,
        repCount: newRepCount,
        lastPositionChange: detection.position !== state.position ? Date.now() : state.lastPositionChange,
        isInCorrectForm: detection.isValid,
        feedback,
        currentAngle: Math.round(detection.angle),
      };
    }

    case 'shoulder-press': {
      const detection = detectShoulderPressPosition(landmarks);

      if (!detection.isValid) {
        return {
          ...state,
          isInCorrectForm: false,
          feedback: 'Position your whole body in frame',
          currentAngle: undefined,
        };
      }

      let newRepCount = state.repCount;
      let feedback = state.feedback;

      if (state.position === 'down' && detection.position === 'up') {
        newRepCount = state.repCount + 1;
        feedback = `Great! ${newRepCount} presses`;
      } else if (detection.position === 'up') {
        feedback = 'Lower down!';
      } else if (detection.position === 'down') {
        feedback = 'Press up!';
      } else {
        feedback = 'Extend your arms overhead';
      }

      return {
        ...state,
        position: detection.position,
        repCount: newRepCount,
        lastPositionChange: detection.position !== state.position ? Date.now() : state.lastPositionChange,
        isInCorrectForm: detection.isValid,
        feedback,
        currentAngle: Math.round(detection.angle),
      };
    }

    case 'leg-raises': {
      const detection = detectLegRaisesPosition(landmarks);

      if (!detection.isValid) {
        return {
          ...state,
          isInCorrectForm: false,
          feedback: 'Position your whole body in frame',
          currentAngle: undefined,
        };
      }

      let newRepCount = state.repCount;
      let feedback = state.feedback;

      if (state.position === 'up' && detection.position === 'down') {
        newRepCount = state.repCount + 1;
        feedback = `Great! ${newRepCount} leg raises`;
      } else if (detection.position === 'up') {
        feedback = 'Lower legs down!';
      } else if (detection.position === 'down') {
        feedback = 'Raise your legs!';
      } else {
        feedback = 'Lift legs toward ceiling';
      }

      return {
        ...state,
        position: detection.position,
        repCount: newRepCount,
        lastPositionChange: detection.position !== state.position ? Date.now() : state.lastPositionChange,
        isInCorrectForm: detection.isValid,
        feedback,
        currentAngle: Math.round(detection.angle),
      };
    }

    case 'high-knees': {
      const detection = detectHighKneesPosition(landmarks);

      if (!detection.isValid) {
        return {
          ...state,
          isInCorrectForm: false,
          feedback: 'Position your whole body in frame',
          currentAngle: undefined,
        };
      }

      let newRepCount = state.repCount;
      let feedback = state.feedback;

      // Count each time knee goes up
      if (state.position === 'down' && detection.position === 'up') {
        newRepCount = state.repCount + 1;
        feedback = `Go! ${newRepCount} high knees`;
      } else if (detection.position === 'up') {
        feedback = 'Keep going!';
      } else {
        feedback = 'Lift your knees high!';
      }

      return {
        ...state,
        position: detection.position,
        repCount: newRepCount,
        lastPositionChange: detection.position !== state.position ? Date.now() : state.lastPositionChange,
        isInCorrectForm: detection.isValid,
        feedback,
        currentAngle: Math.round(detection.angle),
      };
    }

    case 'pull-ups': {
      const detection = detectPullUpsPosition(landmarks);

      if (!detection.isValid) {
        return {
          ...state,
          isInCorrectForm: false,
          feedback: 'Position your whole body in frame',
          currentAngle: undefined,
        };
      }

      let newRepCount = state.repCount;
      let feedback = state.feedback;

      if (state.position === 'down' && detection.position === 'up') {
        newRepCount = state.repCount + 1;
        feedback = `Awesome! ${newRepCount} pull-ups`;
      } else if (detection.position === 'up') {
        feedback = 'Lower down!';
      } else if (detection.position === 'down') {
        feedback = 'Pull up!';
      } else {
        feedback = 'Pull chin over bar';
      }

      return {
        ...state,
        position: detection.position,
        repCount: newRepCount,
        lastPositionChange: detection.position !== state.position ? Date.now() : state.lastPositionChange,
        isInCorrectForm: detection.isValid,
        feedback,
        currentAngle: Math.round(detection.angle),
      };
    }

    case 'wall-sit': {
      const detection = detectWallSitPosition(landmarks);

      if (!detection.isValid) {
        return {
          ...state,
          isInCorrectForm: false,
          feedback: 'Position your whole body in frame',
          currentAngle: undefined,
        };
      }

      let holdTime = state.holdTime;
      let feedback = state.feedback;
      const position = detection.position;

      if (position === 'holding') {
        if (state.position === 'holding') {
          holdTime = state.holdTime + (deltaTimeMs / 1000);
        }
        const seconds = Math.floor(holdTime);
        feedback = `Hold it! ${seconds}s`;
      } else {
        feedback = 'Bend knees to 90°';
      }

      return {
        ...state,
        position,
        holdTime,
        lastPositionChange: Date.now(),
        isInCorrectForm: position === 'holding',
        feedback,
        currentAngle: Math.round(detection.bodyAngle),
      };
    }

    case 'side-plank': {
      const detection = detectSidePlankPosition(landmarks);

      if (!detection.isValid) {
        return {
          ...state,
          isInCorrectForm: false,
          feedback: 'Position your whole body in frame',
          currentAngle: undefined,
        };
      }

      let holdTime = state.holdTime;
      let feedback = state.feedback;
      const position = detection.position;

      if (position === 'holding') {
        if (state.position === 'holding') {
          holdTime = state.holdTime + (deltaTimeMs / 1000);
        }
        const seconds = Math.floor(holdTime);
        feedback = `Hold it! ${seconds}s`;
      } else {
        feedback = 'Keep body straight & aligned';
      }

      return {
        ...state,
        position,
        holdTime,
        lastPositionChange: Date.now(),
        isInCorrectForm: position === 'holding',
        feedback,
        currentAngle: Math.round(detection.bodyAngle),
      };
    }

    default:
      return state;
  }
}

/**
 * Exercise rewards configuration
 */
export interface ExerciseReward {
  type: ExerciseType;
  minutesPerRep?: number;
  minutesPerSecond?: number;
  minimumReps?: number;
  minimumSeconds?: number;
  bonusMultiplier?: number;
}

export const DEFAULT_EXERCISE_REWARDS: Record<ExerciseType, ExerciseReward> = {
  // Existing exercises
  pushups: {
    type: 'pushups',
    minutesPerRep: 0.5,
    minimumReps: 3,
    bonusMultiplier: 1.1,
  },
  squats: {
    type: 'squats',
    minutesPerRep: 0.5,
    minimumReps: 3,
    bonusMultiplier: 1.1,
  },
  plank: {
    type: 'plank',
    minutesPerSecond: 0.1,
    minimumSeconds: 10,
    bonusMultiplier: 1.1,
  },
  // New rep-based exercises (varying by difficulty)
  'jumping-jacks': {
    type: 'jumping-jacks',
    minutesPerRep: 0.3,
    minimumReps: 5,
    bonusMultiplier: 1.1,
  },
  lunges: {
    type: 'lunges',
    minutesPerRep: 0.5,
    minimumReps: 3,
    bonusMultiplier: 1.1,
  },
  crunches: {
    type: 'crunches',
    minutesPerRep: 0.4,
    minimumReps: 5,
    bonusMultiplier: 1.1,
  },
  'shoulder-press': {
    type: 'shoulder-press',
    minutesPerRep: 0.5,
    minimumReps: 3,
    bonusMultiplier: 1.1,
  },
  'leg-raises': {
    type: 'leg-raises',
    minutesPerRep: 0.4,
    minimumReps: 5,
    bonusMultiplier: 1.1,
  },
  'high-knees': {
    type: 'high-knees',
    minutesPerRep: 0.2,
    minimumReps: 10,
    bonusMultiplier: 1.1,
  },
  'pull-ups': {
    type: 'pull-ups',
    minutesPerRep: 0.8,
    minimumReps: 2,
    bonusMultiplier: 1.15,
  },
  // New hold-based exercises
  'wall-sit': {
    type: 'wall-sit',
    minutesPerSecond: 0.15,
    minimumSeconds: 10,
    bonusMultiplier: 1.1,
  },
  'side-plank': {
    type: 'side-plank',
    minutesPerSecond: 0.12,
    minimumSeconds: 10,
    bonusMultiplier: 1.1,
  },
};

// Bonus thresholds (reps for rep-based, seconds for hold-based)
export const BONUS_THRESHOLDS: Record<ExerciseType, number> = {
  // Existing
  pushups: 20,
  squats: 20,
  plank: 30,
  // New rep-based
  'jumping-jacks': 30,
  lunges: 15,
  crunches: 20,
  'shoulder-press': 15,
  'leg-raises': 15,
  'high-knees': 40,
  'pull-ups': 10,
  // New hold-based (seconds)
  'wall-sit': 45,
  'side-plank': 30,
};

export function calculateEarnedMinutes(
  state: ExerciseState,
  rewards: ExerciseReward = DEFAULT_EXERCISE_REWARDS[state.type]
): number {
  switch (state.type) {
    // Rep-based exercises
    case 'pushups':
    case 'squats':
    case 'jumping-jacks':
    case 'lunges':
    case 'crunches':
    case 'shoulder-press':
    case 'leg-raises':
    case 'high-knees':
    case 'pull-ups': {
      if (state.repCount < (rewards.minimumReps || 0)) {
        return 0;
      }
      const baseMinutes = state.repCount * (rewards.minutesPerRep || 0.5);
      const bonus = state.repCount >= BONUS_THRESHOLDS[state.type]
        ? (rewards.bonusMultiplier || 1)
        : 1;
      return Math.round(baseMinutes * bonus * 10) / 10;
    }

    // Hold-based exercises
    case 'plank':
    case 'wall-sit':
    case 'side-plank': {
      if (state.holdTime < (rewards.minimumSeconds || 0)) {
        return 0;
      }
      const baseMinutes = state.holdTime * (rewards.minutesPerSecond || 0.1);
      const bonus = state.holdTime >= BONUS_THRESHOLDS[state.type]
        ? (rewards.bonusMultiplier || 1)
        : 1;
      return Math.round(baseMinutes * bonus * 10) / 10;
    }

    default:
      return 0;
  }
}

/**
 * Get exercise display info
 */
export function getExerciseInfo(type: ExerciseType): {
  name: string;
  icon: string;
  description: string;
  instructions: string[];
} {
  switch (type) {
    case 'pushups':
      return {
        name: 'Pushups',
        icon: '💪',
        description: 'Earn 0.5 min per rep (min 3 reps)',
        instructions: [
          'Position your phone to see your full body from the side',
          'Get into pushup position with arms extended',
          'Lower your chest to the ground',
          'Push back up to complete a rep',
          '1.1x bonus after 20 reps!',
        ],
      };
    case 'squats':
      return {
        name: 'Squats',
        icon: '🏋️',
        description: 'Earn 0.5 min per rep (min 3 reps)',
        instructions: [
          'Position your phone to see your full body from the side',
          'Stand with feet shoulder-width apart',
          'Squat down until thighs are parallel to ground',
          'Stand back up to complete a rep',
          '1.1x bonus after 20 reps!',
        ],
      };
    case 'plank':
      return {
        name: 'Plank',
        icon: '🧘',
        description: 'Earn 0.1 min per second (min 10s)',
        instructions: [
          'Position your phone to see your full body from the side',
          'Get into plank position with body straight',
          'Hold the position as long as you can',
          'Keep your hips level - no sagging or raising',
          '1.1x bonus after 30 seconds!',
        ],
      };
    case 'jumping-jacks':
      return {
        name: 'Jumping Jacks',
        icon: '⭐',
        description: 'Earn 0.3 min per rep (min 5 reps)',
        instructions: [
          'Position your phone to see your full body',
          'Stand with feet together, arms at sides',
          'Jump while spreading legs and raising arms',
          'Jump back to starting position',
          '1.1x bonus after 30 reps!',
        ],
      };
    case 'lunges':
      return {
        name: 'Lunges',
        icon: '🦵',
        description: 'Earn 0.5 min per rep (min 3 reps)',
        instructions: [
          'Position your phone to see your full body from the side',
          'Stand tall with feet hip-width apart',
          'Step forward and lower until front knee is at 90°',
          'Push back to standing position',
          '1.1x bonus after 15 reps!',
        ],
      };
    case 'crunches':
      return {
        name: 'Crunches',
        icon: '🔥',
        description: 'Earn 0.4 min per rep (min 5 reps)',
        instructions: [
          'Position your phone to see your full body from the side',
          'Lie on your back with knees bent',
          'Curl your shoulders up toward your knees',
          'Lower back down with control',
          '1.1x bonus after 20 reps!',
        ],
      };
    case 'shoulder-press':
      return {
        name: 'Shoulder Press',
        icon: '🙆',
        description: 'Earn 0.5 min per rep (min 3 reps)',
        instructions: [
          'Position your phone to see your upper body',
          'Hold weights at shoulder height',
          'Press arms straight up overhead',
          'Lower back to shoulder height',
          '1.1x bonus after 15 reps!',
        ],
      };
    case 'leg-raises':
      return {
        name: 'Leg Raises',
        icon: '🦿',
        description: 'Earn 0.4 min per rep (min 5 reps)',
        instructions: [
          'Position your phone to see your full body from the side',
          'Lie flat on your back, legs straight',
          'Raise legs up toward the ceiling',
          'Lower legs back down with control',
          '1.1x bonus after 15 reps!',
        ],
      };
    case 'high-knees':
      return {
        name: 'High Knees',
        icon: '🏃',
        description: 'Earn 0.2 min per rep (min 10 reps)',
        instructions: [
          'Position your phone to see your full body',
          'Stand tall, ready to run in place',
          'Drive knees up above hip level',
          'Alternate legs quickly',
          '1.1x bonus after 40 reps!',
        ],
      };
    case 'pull-ups':
      return {
        name: 'Pull-ups',
        icon: '💪',
        description: 'Earn 0.8 min per rep (min 2 reps)',
        instructions: [
          'Position your phone to see your body from the side',
          'Hang from the bar with arms extended',
          'Pull yourself up until chin is over the bar',
          'Lower back down with control',
          '1.15x bonus after 10 reps!',
        ],
      };
    case 'wall-sit':
      return {
        name: 'Wall Sit',
        icon: '🧱',
        description: 'Earn 0.15 min per second (min 10s)',
        instructions: [
          'Position your phone to see your full body from the side',
          'Lean against a wall with feet shoulder-width apart',
          'Slide down until knees are at 90 degrees',
          'Hold the position - thighs parallel to ground',
          '1.1x bonus after 45 seconds!',
        ],
      };
    case 'side-plank':
      return {
        name: 'Side Plank',
        icon: '🔷',
        description: 'Earn 0.12 min per second (min 10s)',
        instructions: [
          'Position your phone to see your full body',
          'Lie on your side, prop up on your elbow',
          'Lift hips to form a straight line',
          'Keep body aligned from head to feet',
          '1.1x bonus after 30 seconds!',
        ],
      };
    default:
      return {
        name: 'Exercise',
        icon: '🏋️',
        description: 'Complete the exercise',
        instructions: ['Follow the on-screen instructions'],
      };
  }
}
