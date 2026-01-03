/**
 * Pose Detection Utilities
 *
 * Uses MediaPipe pose landmarks to detect exercises:
 * - Pushups: Track shoulder-elbow-wrist angle
 * - Squats: Track hip-knee-ankle angle
 * - Plank: Detect horizontal body alignment
 */

import type { Landmarks, Landmark } from 'vision-camera-pose-landmarks-plugin';

export type ExerciseType = 'pushups' | 'squats' | 'plank';
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
};

// Bonus thresholds
export const BONUS_THRESHOLDS = {
  pushups: 20,
  squats: 20,
  plank: 30, // seconds
};

export function calculateEarnedMinutes(
  state: ExerciseState,
  rewards: ExerciseReward = DEFAULT_EXERCISE_REWARDS[state.type]
): number {
  switch (state.type) {
    case 'pushups':
    case 'squats': {
      if (state.repCount < (rewards.minimumReps || 0)) {
        return 0;
      }
      const baseMinutes = state.repCount * (rewards.minutesPerRep || 0.5);
      // Apply 1.1x bonus after 20 reps
      const bonus = state.repCount >= BONUS_THRESHOLDS[state.type]
        ? (rewards.bonusMultiplier || 1)
        : 1;
      return Math.round(baseMinutes * bonus * 10) / 10;
    }

    case 'plank': {
      if (state.holdTime < (rewards.minimumSeconds || 0)) {
        return 0;
      }
      const baseMinutes = state.holdTime * (rewards.minutesPerSecond || 0.1);
      // Apply 1.1x bonus after 30 seconds
      const bonus = state.holdTime >= BONUS_THRESHOLDS.plank
        ? (rewards.bonusMultiplier || 1)
        : 1;
      return Math.round(baseMinutes * bonus * 10) / 10;
    }
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
  }
}
