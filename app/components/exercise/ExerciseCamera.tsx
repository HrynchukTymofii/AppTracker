import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Camera, useCameraDevice, PhotoFile } from 'react-native-vision-camera';
import { readAsStringAsync, deleteAsync } from 'expo-file-system/legacy';
import Svg, { Circle, Line } from 'react-native-svg';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import {
  initialize as initPoseDetection,
  detectPose,
  close as closePoseDetection,
  PoseLandmark,
  PoseResult,
  POSE_CONNECTIONS,
} from 'pose-detection-module';
import {
  ExerciseType,
  ExerciseState,
  createExerciseState,
  calculateEarnedMinutes,
  getExerciseInfo,
} from '@/lib/poseUtils';

interface ExerciseCameraProps {
  exerciseType: ExerciseType;
  isDark: boolean;
  onStateUpdate: (state: ExerciseState) => void;
  onComplete?: (state: ExerciseState, earnedMinutes: number) => void;
  isActive: boolean; // Controls counting/detection
  cameraActive?: boolean; // Controls camera display (defaults to isActive)
  hideStats?: boolean; // Hide the stats overlay (for complete screen)
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAMERA_HEIGHT = SCREEN_WIDTH * 1.33;

// Detection interval in ms (20 FPS = 50ms for smoother tracking)
const DETECTION_INTERVAL = 50;

export const ExerciseCamera: React.FC<ExerciseCameraProps> = ({
  exerciseType,
  isDark,
  onStateUpdate,
  onComplete,
  isActive,
  cameraActive,
  hideStats = false,
}) => {
  // Keep screen awake during exercise/pose detection
  useEffect(() => {
    activateKeepAwakeAsync('exercise-camera').catch(() => {
      // Ignore errors - keep awake is not critical
    });
    return () => {
      deactivateKeepAwake('exercise-camera');
    };
  }, []);

  // Camera is active if cameraActive is true OR if isActive is true (for detection)
  const isCameraOn = cameraActive ?? isActive;
  const device = useCameraDevice('front');
  const cameraRef = useRef<Camera>(null);
  const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isProcessingRef = useRef(false);

  const [hasPermission, setHasPermission] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [poseDetected, setPoseDetected] = useState(false);
  const [landmarks, setLandmarks] = useState<PoseLandmark[] | null>(null);
  const [fps, setFps] = useState(0);
  const [debugMessage, setDebugMessage] = useState('Initializing...');
  const [repCount, setRepCount] = useState(0);
  const [exercisePhase, setExercisePhase] = useState<'up' | 'down' | 'unknown'>('unknown');
  const [frameWidth, setFrameWidth] = useState(1);
  const [frameHeight, setFrameHeight] = useState(1);
  const [exerciseState, setExerciseState] = useState<ExerciseState>(
    createExerciseState(exerciseType)
  );

  // Interpolation refs for smooth skeleton display (refs to avoid stale closures)
  const prevLandmarksRef = useRef<PoseLandmark[] | null>(null);
  const targetLandmarksRef = useRef<PoseLandmark[] | null>(null);
  const [interpolatedLandmarks, setInterpolatedLandmarks] = useState<PoseLandmark[] | null>(null);
  const detectionTimeRef = useRef<number>(Date.now());
  const DISPLAY_INTERVAL = 50; // 20 FPS for smooth skeleton display

  // Test skeleton for debugging - shows a static skeleton to verify SVG works
  const TEST_SKELETON: PoseLandmark[] = [
    { x: 0.5, y: 0.15, z: 0, visibility: 1, type: 0 },   // nose
    { x: 0.48, y: 0.13, z: 0, visibility: 1, type: 1 },  // left eye inner
    { x: 0.46, y: 0.13, z: 0, visibility: 1, type: 2 },  // left eye
    { x: 0.44, y: 0.13, z: 0, visibility: 1, type: 3 },  // left eye outer
    { x: 0.52, y: 0.13, z: 0, visibility: 1, type: 4 },  // right eye inner
    { x: 0.54, y: 0.13, z: 0, visibility: 1, type: 5 },  // right eye
    { x: 0.56, y: 0.13, z: 0, visibility: 1, type: 6 },  // right eye outer
    { x: 0.40, y: 0.15, z: 0, visibility: 1, type: 7 },  // left ear
    { x: 0.60, y: 0.15, z: 0, visibility: 1, type: 8 },  // right ear
    { x: 0.47, y: 0.18, z: 0, visibility: 1, type: 9 },  // mouth left
    { x: 0.53, y: 0.18, z: 0, visibility: 1, type: 10 }, // mouth right
    { x: 0.35, y: 0.30, z: 0, visibility: 1, type: 11 }, // left shoulder
    { x: 0.65, y: 0.30, z: 0, visibility: 1, type: 12 }, // right shoulder
    { x: 0.25, y: 0.45, z: 0, visibility: 1, type: 13 }, // left elbow
    { x: 0.75, y: 0.45, z: 0, visibility: 1, type: 14 }, // right elbow
    { x: 0.20, y: 0.60, z: 0, visibility: 1, type: 15 }, // left wrist
    { x: 0.80, y: 0.60, z: 0, visibility: 1, type: 16 }, // right wrist
    { x: 0.18, y: 0.62, z: 0, visibility: 1, type: 17 }, // left pinky
    { x: 0.82, y: 0.62, z: 0, visibility: 1, type: 18 }, // right pinky
    { x: 0.19, y: 0.63, z: 0, visibility: 1, type: 19 }, // left index
    { x: 0.81, y: 0.63, z: 0, visibility: 1, type: 20 }, // right index
    { x: 0.21, y: 0.61, z: 0, visibility: 1, type: 21 }, // left thumb
    { x: 0.79, y: 0.61, z: 0, visibility: 1, type: 22 }, // right thumb
    { x: 0.40, y: 0.55, z: 0, visibility: 1, type: 23 }, // left hip
    { x: 0.60, y: 0.55, z: 0, visibility: 1, type: 24 }, // right hip
    { x: 0.38, y: 0.75, z: 0, visibility: 1, type: 25 }, // left knee
    { x: 0.62, y: 0.75, z: 0, visibility: 1, type: 26 }, // right knee
    { x: 0.36, y: 0.95, z: 0, visibility: 1, type: 27 }, // left ankle
    { x: 0.64, y: 0.95, z: 0, visibility: 1, type: 28 }, // right ankle
    { x: 0.34, y: 0.97, z: 0, visibility: 1, type: 29 }, // left heel
    { x: 0.66, y: 0.97, z: 0, visibility: 1, type: 30 }, // right heel
    { x: 0.38, y: 0.98, z: 0, visibility: 1, type: 31 }, // left foot index
    { x: 0.62, y: 0.98, z: 0, visibility: 1, type: 32 }, // right foot index
  ];

  const lastFrameTimeRef = useRef(Date.now());
  const frameCountRef = useRef(0);
  const lastValidPhaseRef = useRef<'up' | 'down' | null>(null); // Track last VALID phase (up/down only)
  const lastPlankCheckTimeRef = useRef<number | null>(null);
  const accumulatedPlankTimeRef = useRef(0);
  const [holdTime, setHoldTime] = useState(0);

  // Body-only connections (excludes face landmarks 0-10, fingers 17-22, and toes 29-32)
  // Face landmarks: 0=nose, 1-6=eyes, 7-8=ears, 9-10=mouth
  // Fingers: 17-22 (pinky, index, thumb on each hand)
  // Toes: 29-32 (heel, foot index on each foot)
  const BODY_CONNECTIONS = POSE_CONNECTIONS.filter(([start, end]) => {
    // Must be body landmarks (>= 11)
    if (start < 11 || end < 11) return false;
    // Exclude fingers (17-22)
    if ((start >= 17 && start <= 22) || (end >= 17 && end <= 22)) return false;
    // Exclude toes (29-32)
    if (start >= 29 || end >= 29) return false;
    return true;
  });

  // Calculate angle between three points (in degrees)
  const calculateAngle = (a: PoseLandmark, b: PoseLandmark, c: PoseLandmark): number => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180 / Math.PI);
    if (angle > 180) angle = 360 - angle;
    return angle;
  };

  // Detect pushup phase based on elbow angle
  const detectPushupPhase = (landmarks: PoseLandmark[]): 'up' | 'down' | 'unknown' => {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftElbow = landmarks[13];
    const rightElbow = landmarks[14];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];

    // Check visibility
    if (!leftShoulder || !rightShoulder || !leftElbow || !rightElbow || !leftWrist || !rightWrist) {
      return 'unknown';
    }

    const minVisibility = 0.5;
    if (leftShoulder.visibility < minVisibility || leftElbow.visibility < minVisibility ||
        leftWrist.visibility < minVisibility) {
      return 'unknown';
    }

    // Calculate elbow angles (average of both arms)
    const leftAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    const avgAngle = (leftAngle + rightAngle) / 2;

    // Pushup phases:
    // - Down: elbow angle < 100 degrees (arms bent)
    // - Up: elbow angle > 150 degrees (arms extended)
    if (avgAngle < 100) {
      return 'down';
    } else if (avgAngle > 150) {
      return 'up';
    }
    return 'unknown';
  };

  // Detect squat phase based on knee angle
  const detectSquatPhase = (landmarks: PoseLandmark[]): 'up' | 'down' | 'unknown' => {
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];

    // Check visibility
    if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle) {
      return 'unknown';
    }

    const minVisibility = 0.5;
    const leftVisible = (leftHip.visibility ?? 0) >= minVisibility &&
                        (leftKnee.visibility ?? 0) >= minVisibility &&
                        (leftAnkle.visibility ?? 0) >= minVisibility;
    const rightVisible = (rightHip.visibility ?? 0) >= minVisibility &&
                         (rightKnee.visibility ?? 0) >= minVisibility &&
                         (rightAnkle.visibility ?? 0) >= minVisibility;

    if (!leftVisible && !rightVisible) {
      return 'unknown';
    }

    // Calculate knee angles
    let totalAngle = 0;
    let count = 0;

    if (leftVisible) {
      const leftAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
      totalAngle += leftAngle;
      count++;
    }
    if (rightVisible) {
      const rightAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
      totalAngle += rightAngle;
      count++;
    }

    const avgAngle = totalAngle / count;

    // Squat phases:
    // - Down: knee angle < 100 degrees (squatted)
    // - Up: knee angle > 160 degrees (standing)
    if (avgAngle < 100) {
      return 'down';
    } else if (avgAngle > 160) {
      return 'up';
    }
    return 'unknown';
  };

  // Detect plank position based on body alignment
  const detectPlankPosition = (landmarks: PoseLandmark[]): { isHolding: boolean; bodyAngle: number } => {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];

    const minVisibility = 0.5;
    const shouldersVisible = (leftShoulder?.visibility ?? 0) >= minVisibility &&
                             (rightShoulder?.visibility ?? 0) >= minVisibility;
    const hipsVisible = (leftHip?.visibility ?? 0) >= minVisibility &&
                        (rightHip?.visibility ?? 0) >= minVisibility;
    const anklesVisible = (leftAnkle?.visibility ?? 0) >= minVisibility &&
                          (rightAnkle?.visibility ?? 0) >= minVisibility;

    if (!shouldersVisible || !hipsVisible || !anklesVisible) {
      return { isHolding: false, bodyAngle: 0 };
    }

    // Calculate midpoints
    const midShoulder = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
    const midHip = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
    const midAnkle = { x: (leftAnkle.x + rightAnkle.x) / 2, y: (leftAnkle.y + rightAnkle.y) / 2 };

    // Calculate body angle relative to horizontal
    const deltaY = midAnkle.y - midShoulder.y;
    const deltaX = midAnkle.x - midShoulder.x;
    const bodyAngle = Math.abs(Math.atan2(deltaY, deltaX) * 180 / Math.PI);

    // Check alignment (body should be roughly straight)
    const shoulderAnkleDist = Math.sqrt(Math.pow(midAnkle.x - midShoulder.x, 2) + Math.pow(midAnkle.y - midShoulder.y, 2));
    const shoulderHipDist = Math.sqrt(Math.pow(midHip.x - midShoulder.x, 2) + Math.pow(midHip.y - midShoulder.y, 2));
    const hipAnkleDist = Math.sqrt(Math.pow(midAnkle.x - midHip.x, 2) + Math.pow(midAnkle.y - midHip.y, 2));

    const alignmentRatio = (shoulderHipDist + hipAnkleDist) / shoulderAnkleDist;
    const isAligned = alignmentRatio < 1.15;

    // Body should be roughly horizontal (angle close to 0 or 180 degrees)
    const isHorizontal = bodyAngle < 30 || bodyAngle > 150;

    return { isHolding: isHorizontal && isAligned, bodyAngle };
  };

  // Detect jumping jacks position - arm and leg spread
  const detectJumpingJacksPhase = (landmarks: PoseLandmark[]): 'up' | 'down' | 'unknown' => {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];

    const minVisibility = 0.5;
    const allVisible = (leftShoulder?.visibility ?? 0) >= minVisibility &&
                       (rightShoulder?.visibility ?? 0) >= minVisibility &&
                       (leftWrist?.visibility ?? 0) >= minVisibility &&
                       (rightWrist?.visibility ?? 0) >= minVisibility &&
                       (leftHip?.visibility ?? 0) >= minVisibility &&
                       (rightHip?.visibility ?? 0) >= minVisibility &&
                       (leftAnkle?.visibility ?? 0) >= minVisibility &&
                       (rightAnkle?.visibility ?? 0) >= minVisibility;

    if (!allVisible) return 'unknown';

    // Calculate arm spread
    const shoulderWidth = Math.sqrt(Math.pow(rightShoulder.x - leftShoulder.x, 2) + Math.pow(rightShoulder.y - leftShoulder.y, 2));
    const wristSpread = Math.sqrt(Math.pow(rightWrist.x - leftWrist.x, 2) + Math.pow(rightWrist.y - leftWrist.y, 2));
    const armRatio = wristSpread / shoulderWidth;

    // Calculate leg spread
    const hipWidth = Math.sqrt(Math.pow(rightHip.x - leftHip.x, 2) + Math.pow(rightHip.y - leftHip.y, 2));
    const ankleSpread = Math.sqrt(Math.pow(rightAnkle.x - leftAnkle.x, 2) + Math.pow(rightAnkle.y - leftAnkle.y, 2));
    const legRatio = ankleSpread / hipWidth;

    const spreadScore = (armRatio + legRatio) / 2;

    // Spread position (arms and legs wide) - lowered threshold for faster detection
    if (spreadScore > 1.8) return 'down';
    // Closed position (arms down, legs together)
    if (spreadScore < 1.4) return 'up';
    return 'unknown';
  };

  // Detect lunges position - front knee angle
  const detectLungesPhase = (landmarks: PoseLandmark[]): 'up' | 'down' | 'unknown' => {
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];

    const minVisibility = 0.5;
    const leftVisible = (leftHip?.visibility ?? 0) >= minVisibility &&
                        (leftKnee?.visibility ?? 0) >= minVisibility &&
                        (leftAnkle?.visibility ?? 0) >= minVisibility;
    const rightVisible = (rightHip?.visibility ?? 0) >= minVisibility &&
                         (rightKnee?.visibility ?? 0) >= minVisibility &&
                         (rightAnkle?.visibility ?? 0) >= minVisibility;

    if (!leftVisible && !rightVisible) return 'unknown';

    // Find front leg (smaller knee angle)
    let frontKneeAngle = 180;
    if (leftVisible) {
      frontKneeAngle = Math.min(frontKneeAngle, calculateAngle(leftHip, leftKnee, leftAnkle));
    }
    if (rightVisible) {
      frontKneeAngle = Math.min(frontKneeAngle, calculateAngle(rightHip, rightKnee, rightAnkle));
    }

    if (frontKneeAngle < 110) return 'down';
    if (frontKneeAngle > 155) return 'up';
    return 'unknown';
  };

  // Detect crunches position - torso angle
  const detectCrunchesPhase = (landmarks: PoseLandmark[]): 'up' | 'down' | 'unknown' => {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];

    const minVisibility = 0.5;
    const allVisible = (leftShoulder?.visibility ?? 0) >= minVisibility &&
                       (rightShoulder?.visibility ?? 0) >= minVisibility &&
                       (leftHip?.visibility ?? 0) >= minVisibility &&
                       (rightHip?.visibility ?? 0) >= minVisibility &&
                       (leftKnee?.visibility ?? 0) >= minVisibility &&
                       (rightKnee?.visibility ?? 0) >= minVisibility;

    if (!allVisible) return 'unknown';

    const midShoulder = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2, visibility: 1, z: 0, type: 0 };
    const midHip = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2, visibility: 1, z: 0, type: 0 };
    const midKnee = { x: (leftKnee.x + rightKnee.x) / 2, y: (leftKnee.y + rightKnee.y) / 2, visibility: 1, z: 0, type: 0 };

    const crunchAngle = calculateAngle(midShoulder, midHip, midKnee);

    if (crunchAngle < 100) return 'up'; // Crunched up
    if (crunchAngle > 140) return 'down'; // Lying flat
    return 'unknown';
  };

  // Detect shoulder press position - arm angle overhead
  const detectShoulderPressPhase = (landmarks: PoseLandmark[]): 'up' | 'down' | 'unknown' => {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftElbow = landmarks[13];
    const rightElbow = landmarks[14];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];

    const minVisibility = 0.5;
    const leftVisible = (leftShoulder?.visibility ?? 0) >= minVisibility &&
                        (leftElbow?.visibility ?? 0) >= minVisibility &&
                        (leftWrist?.visibility ?? 0) >= minVisibility;
    const rightVisible = (rightShoulder?.visibility ?? 0) >= minVisibility &&
                         (rightElbow?.visibility ?? 0) >= minVisibility &&
                         (rightWrist?.visibility ?? 0) >= minVisibility;

    if (!leftVisible && !rightVisible) return 'unknown';

    let totalAngle = 0;
    let count = 0;
    if (leftVisible) { totalAngle += calculateAngle(leftShoulder, leftElbow, leftWrist); count++; }
    if (rightVisible) { totalAngle += calculateAngle(rightShoulder, rightElbow, rightWrist); count++; }
    const avgAngle = totalAngle / count;

    if (avgAngle > 160) return 'up'; // Arms extended overhead
    if (avgAngle < 110) return 'down'; // Arms bent
    return 'unknown';
  };

  // Detect leg raises position
  const detectLegRaisesPhase = (landmarks: PoseLandmark[]): 'up' | 'down' | 'unknown' => {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];

    const minVisibility = 0.5;
    const allVisible = (leftShoulder?.visibility ?? 0) >= minVisibility &&
                       (rightShoulder?.visibility ?? 0) >= minVisibility &&
                       (leftHip?.visibility ?? 0) >= minVisibility &&
                       (rightHip?.visibility ?? 0) >= minVisibility &&
                       (leftKnee?.visibility ?? 0) >= minVisibility &&
                       (rightKnee?.visibility ?? 0) >= minVisibility;

    if (!allVisible) return 'unknown';

    const midShoulder = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2, visibility: 1, z: 0, type: 0 };
    const midHip = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2, visibility: 1, z: 0, type: 0 };
    const midKnee = { x: (leftKnee.x + rightKnee.x) / 2, y: (leftKnee.y + rightKnee.y) / 2, visibility: 1, z: 0, type: 0 };

    const legAngle = calculateAngle(midShoulder, midHip, midKnee);

    if (legAngle < 110) return 'up'; // Legs raised
    if (legAngle > 160) return 'down'; // Legs flat
    return 'unknown';
  };

  // Detect high knees position - knee above hip
  const detectHighKneesPhase = (landmarks: PoseLandmark[]): 'up' | 'down' | 'unknown' => {
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];

    const minVisibility = 0.5;
    const leftVisible = (leftHip?.visibility ?? 0) >= minVisibility && (leftKnee?.visibility ?? 0) >= minVisibility;
    const rightVisible = (rightHip?.visibility ?? 0) >= minVisibility && (rightKnee?.visibility ?? 0) >= minVisibility;

    if (!leftVisible && !rightVisible) return 'unknown';

    // Check if either knee is above hip level (y decreases going up)
    let kneeRaised = false;
    if (leftVisible && leftHip.y - leftKnee.y > 0.05) kneeRaised = true;
    if (rightVisible && rightHip.y - rightKnee.y > 0.05) kneeRaised = true;

    return kneeRaised ? 'up' : 'down';
  };

  // Detect pull-ups position - elbow angle
  const detectPullUpsPhase = (landmarks: PoseLandmark[]): 'up' | 'down' | 'unknown' => {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftElbow = landmarks[13];
    const rightElbow = landmarks[14];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];

    const minVisibility = 0.5;
    const leftVisible = (leftShoulder?.visibility ?? 0) >= minVisibility &&
                        (leftElbow?.visibility ?? 0) >= minVisibility &&
                        (leftWrist?.visibility ?? 0) >= minVisibility;
    const rightVisible = (rightShoulder?.visibility ?? 0) >= minVisibility &&
                         (rightElbow?.visibility ?? 0) >= minVisibility &&
                         (rightWrist?.visibility ?? 0) >= minVisibility;

    if (!leftVisible && !rightVisible) return 'unknown';

    let totalAngle = 0;
    let count = 0;
    if (leftVisible) { totalAngle += calculateAngle(leftShoulder, leftElbow, leftWrist); count++; }
    if (rightVisible) { totalAngle += calculateAngle(rightShoulder, rightElbow, rightWrist); count++; }
    const avgAngle = totalAngle / count;

    if (avgAngle < 90) return 'up'; // Pulled up
    if (avgAngle > 150) return 'down'; // Hanging
    return 'unknown';
  };

  // Detect wall sit position (hold exercise)
  const detectWallSitPosition = (landmarks: PoseLandmark[]): { isHolding: boolean; angle: number } => {
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];

    const minVisibility = 0.5;
    const leftVisible = (leftHip?.visibility ?? 0) >= minVisibility &&
                        (leftKnee?.visibility ?? 0) >= minVisibility &&
                        (leftAnkle?.visibility ?? 0) >= minVisibility;
    const rightVisible = (rightHip?.visibility ?? 0) >= minVisibility &&
                         (rightKnee?.visibility ?? 0) >= minVisibility &&
                         (rightAnkle?.visibility ?? 0) >= minVisibility;

    if (!leftVisible && !rightVisible) return { isHolding: false, angle: 0 };

    let totalAngle = 0;
    let count = 0;
    if (leftVisible) { totalAngle += calculateAngle(leftHip, leftKnee, leftAnkle); count++; }
    if (rightVisible) { totalAngle += calculateAngle(rightHip, rightKnee, rightAnkle); count++; }
    const avgAngle = totalAngle / count;

    // Wall sit: knees at ~90 degrees (70-120 range)
    const isHolding = avgAngle >= 70 && avgAngle <= 120;
    return { isHolding, angle: avgAngle };
  };

  // Detect side plank position (hold exercise)
  const detectSidePlankPosition = (landmarks: PoseLandmark[]): { isHolding: boolean; angle: number } => {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];

    const minVisibility = 0.5;
    const allVisible = (leftShoulder?.visibility ?? 0) >= minVisibility &&
                       (rightShoulder?.visibility ?? 0) >= minVisibility &&
                       (leftHip?.visibility ?? 0) >= minVisibility &&
                       (rightHip?.visibility ?? 0) >= minVisibility &&
                       (leftAnkle?.visibility ?? 0) >= minVisibility &&
                       (rightAnkle?.visibility ?? 0) >= minVisibility;

    if (!allVisible) return { isHolding: false, angle: 0 };

    const midShoulder = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
    const midHip = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
    const midAnkle = { x: (leftAnkle.x + rightAnkle.x) / 2, y: (leftAnkle.y + rightAnkle.y) / 2 };

    // Check alignment
    const shoulderAnkleDist = Math.sqrt(Math.pow(midAnkle.x - midShoulder.x, 2) + Math.pow(midAnkle.y - midShoulder.y, 2));
    const shoulderHipDist = Math.sqrt(Math.pow(midHip.x - midShoulder.x, 2) + Math.pow(midHip.y - midShoulder.y, 2));
    const hipAnkleDist = Math.sqrt(Math.pow(midAnkle.x - midHip.x, 2) + Math.pow(midAnkle.y - midHip.y, 2));
    const alignmentRatio = (shoulderHipDist + hipAnkleDist) / shoulderAnkleDist;
    const isAligned = alignmentRatio < 1.2;

    // Body angle
    const deltaY = midAnkle.y - midShoulder.y;
    const deltaX = midAnkle.x - midShoulder.x;
    const bodyAngle = Math.abs(Math.atan2(deltaY, deltaX) * 180 / Math.PI);

    const isSidePosition = bodyAngle >= 20 && bodyAngle <= 160;
    return { isHolding: isAligned && isSidePosition, angle: bodyAngle };
  };

  // Request camera permission
  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
      console.log('[ExerciseCamera] Camera permission:', status);
    })();
  }, []);

  // Initialize pose detection
  useEffect(() => {
    try {
      const result = initPoseDetection();
      setIsInitialized(result);
      setDebugMessage(result ? 'Pose detector ready' : 'Init failed');
      console.log('[ExerciseCamera] Pose detection initialized:', result);
    } catch (e: any) {
      setDebugMessage(`Init error: ${e.message}`);
      console.error('[ExerciseCamera] Failed to initialize pose detection:', e);
    }

    return () => {
      closePoseDetection();
    };
  }, []);

  // Process a single frame
  const processFrame = useCallback(async () => {
    if (!cameraRef.current || isProcessingRef.current || !isActive || !isInitialized) {
      return;
    }

    isProcessingRef.current = true;

    try {
      setDebugMessage('Taking snapshot...');

      // Take a snapshot from the camera (lower quality = faster processing)
      const photo: PhotoFile = await cameraRef.current.takeSnapshot({
        quality: 25,
      });

      setDebugMessage('Reading image...');

      // Read the photo as base64 (add file:// prefix for expo-file-system)
      const filePath = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;
      const base64 = await readAsStringAsync(filePath, {
        encoding: 'base64',
      });

      setDebugMessage('Detecting pose...');

      // Detect pose
      const result: PoseResult = await detectPose(
        base64,
        photo.width,
        photo.height,
        0 // rotation
      );

      // Store frame dimensions for skeleton positioning
      setFrameWidth(photo.width);
      setFrameHeight(photo.height);

      // Update state
      setPoseDetected(result.detected);
      if (result.detected && result.landmarks.length > 0) {
        // Store for interpolation (move current to previous, set new target)
        prevLandmarksRef.current = targetLandmarksRef.current;
        targetLandmarksRef.current = result.landmarks;
        detectionTimeRef.current = Date.now();

        setLandmarks(result.landmarks);
        const visibleCount = result.landmarks.filter(l => (l?.visibility ?? 0) > 0.5).length;

        // Detect exercise phase and count reps
        if (exerciseType === 'pushups') {
          const phase = detectPushupPhase(result.landmarks);
          setExercisePhase(phase);

          // Only update lastValidPhase when we detect a clear up or down
          if (phase === 'up' || phase === 'down') {
            // Count rep when transitioning from down to up
            if (lastValidPhaseRef.current === 'down' && phase === 'up') {
              setRepCount(prev => prev + 1);
            }
            lastValidPhaseRef.current = phase;
          }

          setDebugMessage(`${visibleCount} pts | Phase: ${phase}`);
        } else if (exerciseType === 'squats') {
          const phase = detectSquatPhase(result.landmarks);
          setExercisePhase(phase);

          // Only update lastValidPhase when we detect a clear up or down
          if (phase === 'up' || phase === 'down') {
            // Count rep when transitioning from down to up
            if (lastValidPhaseRef.current === 'down' && phase === 'up') {
              setRepCount(prev => prev + 1);
            }
            lastValidPhaseRef.current = phase;
          }

          setDebugMessage(`${visibleCount} pts | Phase: ${phase}`);
        } else if (exerciseType === 'plank') {
          const plankResult = detectPlankPosition(result.landmarks);
          const now = Date.now();

          if (plankResult.isHolding) {
            setExercisePhase('down'); // Use 'down' to indicate holding
            // Accumulate time only when holding
            if (lastPlankCheckTimeRef.current !== null) {
              const deltaTime = (now - lastPlankCheckTimeRef.current) / 1000;
              accumulatedPlankTimeRef.current += deltaTime;
              setHoldTime(accumulatedPlankTimeRef.current);
            }
            lastPlankCheckTimeRef.current = now;
            setDebugMessage(`${visibleCount} pts | Holding: ${accumulatedPlankTimeRef.current.toFixed(1)}s`);
          } else {
            setExercisePhase('up'); // Use 'up' to indicate not holding
            // Reset the last check time so we don't count time when not holding
            lastPlankCheckTimeRef.current = null;
            setDebugMessage(`${visibleCount} pts | Get in position`);
          }
        } else if (exerciseType === 'jumping-jacks') {
          const phase = detectJumpingJacksPhase(result.landmarks);
          setExercisePhase(phase);

          if (phase === 'up' || phase === 'down') {
            // Count rep when transitioning from spread (down) to closed (up)
            if (lastValidPhaseRef.current === 'down' && phase === 'up') {
              setRepCount(prev => prev + 1);
            }
            lastValidPhaseRef.current = phase;
          }

          setDebugMessage(`${visibleCount} pts | Phase: ${phase}`);
        } else if (exerciseType === 'lunges') {
          const phase = detectLungesPhase(result.landmarks);
          setExercisePhase(phase);

          if (phase === 'up' || phase === 'down') {
            if (lastValidPhaseRef.current === 'down' && phase === 'up') {
              setRepCount(prev => prev + 1);
            }
            lastValidPhaseRef.current = phase;
          }

          setDebugMessage(`${visibleCount} pts | Phase: ${phase}`);
        } else if (exerciseType === 'crunches') {
          const phase = detectCrunchesPhase(result.landmarks);
          setExercisePhase(phase);

          if (phase === 'up' || phase === 'down') {
            // Count rep when going from up (crunched) back to down (lying)
            if (lastValidPhaseRef.current === 'up' && phase === 'down') {
              setRepCount(prev => prev + 1);
            }
            lastValidPhaseRef.current = phase;
          }

          setDebugMessage(`${visibleCount} pts | Phase: ${phase}`);
        } else if (exerciseType === 'shoulder-press') {
          const phase = detectShoulderPressPhase(result.landmarks);
          setExercisePhase(phase);

          if (phase === 'up' || phase === 'down') {
            if (lastValidPhaseRef.current === 'down' && phase === 'up') {
              setRepCount(prev => prev + 1);
            }
            lastValidPhaseRef.current = phase;
          }

          setDebugMessage(`${visibleCount} pts | Phase: ${phase}`);
        } else if (exerciseType === 'leg-raises') {
          const phase = detectLegRaisesPhase(result.landmarks);
          setExercisePhase(phase);

          if (phase === 'up' || phase === 'down') {
            // Count rep when legs come back down
            if (lastValidPhaseRef.current === 'up' && phase === 'down') {
              setRepCount(prev => prev + 1);
            }
            lastValidPhaseRef.current = phase;
          }

          setDebugMessage(`${visibleCount} pts | Phase: ${phase}`);
        } else if (exerciseType === 'high-knees') {
          const phase = detectHighKneesPhase(result.landmarks);
          setExercisePhase(phase);

          if (phase === 'up' || phase === 'down') {
            // Count each time knee goes up
            if (lastValidPhaseRef.current === 'down' && phase === 'up') {
              setRepCount(prev => prev + 1);
            }
            lastValidPhaseRef.current = phase;
          }

          setDebugMessage(`${visibleCount} pts | Phase: ${phase}`);
        } else if (exerciseType === 'pull-ups') {
          const phase = detectPullUpsPhase(result.landmarks);
          setExercisePhase(phase);

          if (phase === 'up' || phase === 'down') {
            if (lastValidPhaseRef.current === 'down' && phase === 'up') {
              setRepCount(prev => prev + 1);
            }
            lastValidPhaseRef.current = phase;
          }

          setDebugMessage(`${visibleCount} pts | Phase: ${phase}`);
        } else if (exerciseType === 'wall-sit') {
          const wallSitResult = detectWallSitPosition(result.landmarks);
          const now = Date.now();

          if (wallSitResult.isHolding) {
            setExercisePhase('down');
            if (lastPlankCheckTimeRef.current !== null) {
              const deltaTime = (now - lastPlankCheckTimeRef.current) / 1000;
              accumulatedPlankTimeRef.current += deltaTime;
              setHoldTime(accumulatedPlankTimeRef.current);
            }
            lastPlankCheckTimeRef.current = now;
            setDebugMessage(`${visibleCount} pts | Holding: ${accumulatedPlankTimeRef.current.toFixed(1)}s`);
          } else {
            setExercisePhase('up');
            lastPlankCheckTimeRef.current = null;
            setDebugMessage(`${visibleCount} pts | Get in position`);
          }
        } else if (exerciseType === 'side-plank') {
          const sidePlankResult = detectSidePlankPosition(result.landmarks);
          const now = Date.now();

          if (sidePlankResult.isHolding) {
            setExercisePhase('down');
            if (lastPlankCheckTimeRef.current !== null) {
              const deltaTime = (now - lastPlankCheckTimeRef.current) / 1000;
              accumulatedPlankTimeRef.current += deltaTime;
              setHoldTime(accumulatedPlankTimeRef.current);
            }
            lastPlankCheckTimeRef.current = now;
            setDebugMessage(`${visibleCount} pts | Holding: ${accumulatedPlankTimeRef.current.toFixed(1)}s`);
          } else {
            setExercisePhase('up');
            lastPlankCheckTimeRef.current = null;
            setDebugMessage(`${visibleCount} pts | Get in position`);
          }
        } else {
          setDebugMessage(`Detected ${visibleCount}/33 landmarks`);
        }
      } else {
        setLandmarks(null);
        setDebugMessage('No pose detected');
      }

      // Calculate FPS
      frameCountRef.current++;
      const now = Date.now();
      if (now - lastFrameTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastFrameTimeRef.current = now;
      }

      // Cleanup temp file
      await deleteAsync(filePath, { idempotent: true });
    } catch (e: any) {
      console.log('[ExerciseCamera] Frame processing error:', e);
      setDebugMessage(`Error: ${e.message?.substring(0, 50)}`);
    } finally {
      isProcessingRef.current = false;
    }
  }, [isActive, isInitialized, exerciseType]);

  // Start/stop detection loop
  useEffect(() => {
    if (isActive && isInitialized && hasPermission && device) {
      console.log('[ExerciseCamera] Starting detection loop');
      detectionIntervalRef.current = setInterval(processFrame, DETECTION_INTERVAL);
    } else {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    }

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [isActive, isInitialized, hasPermission, device, processFrame]);

  // Predictive display loop - shows landmarks with forward prediction based on velocity
  // This reduces perceived latency by predicting where the body will be
  useEffect(() => {
    if (!isActive) {
      setInterpolatedLandmarks(null);
      return;
    }

    const displayInterval = setInterval(() => {
      const prev = prevLandmarksRef.current;
      const target = targetLandmarksRef.current;

      if (!target) {
        setInterpolatedLandmarks(prev);
        return;
      }

      if (!prev) {
        setInterpolatedLandmarks(target);
        return;
      }

      // Calculate time since last detection
      const elapsed = Date.now() - detectionTimeRef.current;

      // Predict forward based on velocity to compensate for detection latency
      // Assume ~200ms detection latency, so predict ahead by elapsed time
      const predictionFactor = Math.min(elapsed / 200, 1.5); // Predict up to 1.5x movement ahead

      const predicted = target.map((targetLandmark, i) => {
        const prevLandmark = prev[i];
        if (!prevLandmark || !targetLandmark) return targetLandmark;

        // Calculate velocity (movement between last two detections)
        const velocityX = targetLandmark.x - prevLandmark.x;
        const velocityY = targetLandmark.y - prevLandmark.y;

        // Predict ahead from target position
        return {
          ...targetLandmark,
          x: targetLandmark.x + velocityX * predictionFactor,
          y: targetLandmark.y + velocityY * predictionFactor,
        };
      });

      setInterpolatedLandmarks(predicted);
    }, DISPLAY_INTERVAL);

    return () => clearInterval(displayInterval);
  }, [isActive]);

  const exerciseInfo = getExerciseInfo(exerciseType);

  // Store callback in ref to avoid dependency issues
  const onStateUpdateRef = useRef(onStateUpdate);
  onStateUpdateRef.current = onStateUpdate;

  // Update exercise state and notify parent whenever repCount or holdTime changes
  useEffect(() => {
    const newState: ExerciseState = {
      type: exerciseType,
      position: exercisePhase === 'down' ? 'down' : exercisePhase === 'up' ? 'up' : 'neutral',
      repCount: repCount,
      holdTime: holdTime,
      lastPositionChange: Date.now(),
      isInCorrectForm: poseDetected,
      feedback: '',
    };
    setExerciseState(newState);
    onStateUpdateRef.current(newState);
  }, [repCount, holdTime, exercisePhase, poseDetected, exerciseType]);

  const earnedMinutes = calculateEarnedMinutes(exerciseState);

  // Use interpolated landmarks for smooth display, fall back to detected or test skeleton
  const displayLandmarks = interpolatedLandmarks || landmarks || TEST_SKELETON;
  const showSkeleton = true; // Always show skeleton (test or real)

  // Calculate aspect ratio adjustment
  const frameAspect = frameWidth / frameHeight;
  const screenAspect = SCREEN_WIDTH / CAMERA_HEIGHT;

  // Convert normalized coordinates (0-1) to screen coordinates
  // Note: Front camera snapshot is already in the same orientation as the preview
  // so we don't need to mirror the skeleton coordinates
  const toScreenX = (x: number) => {
    if (frameAspect > screenAspect) {
      // Frame is wider - need to crop sides
      const scale = screenAspect / frameAspect;
      const offset = (1 - scale) / 2;
      return ((x - offset) / scale) * SCREEN_WIDTH;
    }
    return x * SCREEN_WIDTH;
  };

  const toScreenY = (y: number) => {
    if (frameAspect < screenAspect) {
      // Frame is taller - need to crop top/bottom
      const scale = frameAspect / screenAspect;
      const offset = (1 - scale) / 2;
      return ((y - offset) / scale) * CAMERA_HEIGHT;
    }
    return y * CAMERA_HEIGHT;
  };

  // Render skeleton lines (body only, no face)
  const renderSkeleton = () => {
    if (!displayLandmarks) return null;

    const isTestSkeleton = !landmarks;

    return BODY_CONNECTIONS.map(([startIdx, endIdx], index) => {
      const start = displayLandmarks[startIdx];
      const end = displayLandmarks[endIdx];

      if (!start || !end) return null;

      // Check visibility threshold
      const startVisible = (start.visibility ?? 0) > 0.5;
      const endVisible = (end.visibility ?? 0) > 0.5;

      if (!startVisible || !endVisible) return null;

      return (
        <Line
          key={`line-${index}`}
          x1={toScreenX(start.x)}
          y1={toScreenY(start.y)}
          x2={toScreenX(end.x)}
          y2={toScreenY(end.y)}
          stroke={isTestSkeleton ? '#ffffff' : '#10b981'}
          strokeWidth={isTestSkeleton ? 2 : 3}
          opacity={isTestSkeleton ? 0.4 : 1}
        />
      );
    });
  };

  // Render landmark points (body only - skip face 0-10, fingers 17-22, toes 29+)
  const renderLandmarks = () => {
    if (!displayLandmarks) return null;

    const isTestSkeleton = !landmarks;

    return displayLandmarks.map((landmark, index) => {
      // Skip face landmarks (0-10)
      if (index <= 10) return null;
      // Skip fingers (17-22)
      if (index >= 17 && index <= 22) return null;
      // Skip toes (29-32)
      if (index >= 29) return null;
      if (!landmark || (landmark.visibility ?? 0) < 0.5) return null;

      // Color based on body part
      let color = '#10b981'; // default green
      if (index <= 16) color = '#f59e0b'; // arms/shoulders (11-16) - orange
      else if (index <= 24) color = '#ec4899'; // hips (23-24) - pink
      else color = '#8b5cf6'; // legs (25-28) - purple

      return (
        <Circle
          key={`point-${index}`}
          cx={toScreenX(landmark.x)}
          cy={toScreenY(landmark.y)}
          r={isTestSkeleton ? 8 : 6}
          fill={color}
          opacity={isTestSkeleton ? 0.5 : 1}
        />
      );
    });
  };

  if (!hasPermission) {
    return (
      <View style={[styles.container, styles.centered, isDark && styles.containerDark]}>
        <Text style={[styles.permissionText, isDark && styles.textDark]}>
          Camera permission is required
        </Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={[styles.container, styles.centered, isDark && styles.containerDark]}>
        <Text style={[styles.permissionText, isDark && styles.textDark]}>
          No camera device found
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive={isCameraOn}
          photo={true}
        />

        {/* Body skeleton overlay - always shows (test or real) */}
        {showSkeleton && (
          <Svg style={StyleSheet.absoluteFill}>
            {renderSkeleton()}
            {renderLandmarks()}
          </Svg>
        )}

        {/* Overlay */}
        <View style={styles.overlay} pointerEvents="box-none">
          {/* Top: Exercise info - hidden when hideStats is true */}
          {!hideStats && (
            <View style={styles.topOverlay}>
              <Text style={styles.exerciseIcon}>{exerciseInfo.icon}</Text>
              <Text style={styles.exerciseName}>{exerciseInfo.name}</Text>
            </View>
          )}

          {/* Center: Rep counter / Hold timer - hidden when hideStats is true */}
          {!hideStats && (
            <View style={styles.centerOverlay}>
              <View style={[
                styles.statContainer,
                poseDetected && styles.statContainerSuccess,
                exercisePhase === 'down' && styles.statContainerDown,
              ]}>
                <Text style={styles.statValue}>
                  {(exerciseType === 'plank' || exerciseType === 'wall-sit' || exerciseType === 'side-plank')
                    ? Math.floor(holdTime)
                    : repCount}
                </Text>
                <Text style={styles.statLabel}>
                  {exerciseType === 'pushups' ? 'PUSH-UPS' :
                   exerciseType === 'squats' ? 'SQUATS' :
                   exerciseType === 'jumping-jacks' ? 'JUMPING JACKS' :
                   exerciseType === 'lunges' ? 'LUNGES' :
                   exerciseType === 'crunches' ? 'CRUNCHES' :
                   exerciseType === 'shoulder-press' ? 'PRESSES' :
                   exerciseType === 'leg-raises' ? 'LEG RAISES' :
                   exerciseType === 'high-knees' ? 'HIGH KNEES' :
                   exerciseType === 'pull-ups' ? 'PULL-UPS' :
                   'SECONDS'}
                </Text>
                {poseDetected && (
                  <Text style={styles.phaseText}>
                    {(exerciseType === 'plank' || exerciseType === 'wall-sit' || exerciseType === 'side-plank')
                      ? (exercisePhase === 'down' ? '✓ HOLDING' : '⚠️ GET IN POSITION')
                      : (exercisePhase === 'down' ? '⬇️ DOWN' : exercisePhase === 'up' ? '⬆️ UP' : '...')}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Bottom: Status info - commented out for production
          <View style={styles.bottomOverlay}>
            <View style={styles.debugContainer}>
              <Text style={styles.debugText}>
                {debugMessage}
              </Text>
              <Text style={styles.debugText}>
                {landmarks ? '🟢 Real Pose' : '⚪ Test Skeleton'}
              </Text>
              <Text style={styles.debugText}>
                Init: {isInitialized ? '✓' : '✗'} | Active: {isActive ? '✓' : '✗'}
              </Text>
            </View>
          </View>
          */}
        </View>

        {/* Detection indicator */}
        <View
          style={[
            styles.formIndicator,
            poseDetected ? styles.formIndicatorGood : styles.formIndicatorBad,
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: CAMERA_HEIGHT,
    backgroundColor: '#000',
    borderRadius: 20,
    overflow: 'hidden',
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 20,
  },
  topOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  exerciseIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  exerciseName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  centerOverlay: {
    alignItems: 'center',
  },
  statContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.6)',
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  statContainerSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.6)',
    borderColor: '#10b981',
  },
  statContainerDown: {
    backgroundColor: 'rgba(245, 158, 11, 0.6)',
    borderColor: '#f59e0b',
  },
  phaseText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 56,
    fontWeight: '800',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bottomOverlay: {
    alignItems: 'center',
  },
  debugContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  debugText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  formIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  formIndicatorGood: {
    backgroundColor: '#10b981',
  },
  formIndicatorBad: {
    backgroundColor: '#ef4444',
  },
  permissionText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  textDark: {
    color: '#999',
  },
});

export default ExerciseCamera;
