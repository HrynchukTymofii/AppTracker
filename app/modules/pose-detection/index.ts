import { NativeModulesProxy, requireNativeModule } from 'expo-modules-core';

// Landmark interface matching ML Kit output
export interface PoseLandmark {
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  z: number; // Depth
  visibility: number; // 0-1 confidence
  type: number; // Landmark type enum
}

export interface PoseResult {
  landmarks: PoseLandmark[];
  detected: boolean;
}

// Landmark type constants (matching ML Kit)
export const LandmarkType = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  LEFT_MOUTH: 9,
  RIGHT_MOUTH: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

// Skeleton connections for drawing
export const POSE_CONNECTIONS: [number, number][] = [
  // Face
  [LandmarkType.NOSE, LandmarkType.LEFT_EYE_INNER],
  [LandmarkType.LEFT_EYE_INNER, LandmarkType.LEFT_EYE],
  [LandmarkType.LEFT_EYE, LandmarkType.LEFT_EYE_OUTER],
  [LandmarkType.NOSE, LandmarkType.RIGHT_EYE_INNER],
  [LandmarkType.RIGHT_EYE_INNER, LandmarkType.RIGHT_EYE],
  [LandmarkType.RIGHT_EYE, LandmarkType.RIGHT_EYE_OUTER],
  [LandmarkType.LEFT_EYE_OUTER, LandmarkType.LEFT_EAR],
  [LandmarkType.RIGHT_EYE_OUTER, LandmarkType.RIGHT_EAR],
  [LandmarkType.LEFT_MOUTH, LandmarkType.RIGHT_MOUTH],
  // Torso
  [LandmarkType.LEFT_SHOULDER, LandmarkType.RIGHT_SHOULDER],
  [LandmarkType.LEFT_SHOULDER, LandmarkType.LEFT_HIP],
  [LandmarkType.RIGHT_SHOULDER, LandmarkType.RIGHT_HIP],
  [LandmarkType.LEFT_HIP, LandmarkType.RIGHT_HIP],
  // Left arm
  [LandmarkType.LEFT_SHOULDER, LandmarkType.LEFT_ELBOW],
  [LandmarkType.LEFT_ELBOW, LandmarkType.LEFT_WRIST],
  [LandmarkType.LEFT_WRIST, LandmarkType.LEFT_PINKY],
  [LandmarkType.LEFT_WRIST, LandmarkType.LEFT_INDEX],
  [LandmarkType.LEFT_WRIST, LandmarkType.LEFT_THUMB],
  [LandmarkType.LEFT_PINKY, LandmarkType.LEFT_INDEX],
  // Right arm
  [LandmarkType.RIGHT_SHOULDER, LandmarkType.RIGHT_ELBOW],
  [LandmarkType.RIGHT_ELBOW, LandmarkType.RIGHT_WRIST],
  [LandmarkType.RIGHT_WRIST, LandmarkType.RIGHT_PINKY],
  [LandmarkType.RIGHT_WRIST, LandmarkType.RIGHT_INDEX],
  [LandmarkType.RIGHT_WRIST, LandmarkType.RIGHT_THUMB],
  [LandmarkType.RIGHT_PINKY, LandmarkType.RIGHT_INDEX],
  // Left leg
  [LandmarkType.LEFT_HIP, LandmarkType.LEFT_KNEE],
  [LandmarkType.LEFT_KNEE, LandmarkType.LEFT_ANKLE],
  [LandmarkType.LEFT_ANKLE, LandmarkType.LEFT_HEEL],
  [LandmarkType.LEFT_ANKLE, LandmarkType.LEFT_FOOT_INDEX],
  [LandmarkType.LEFT_HEEL, LandmarkType.LEFT_FOOT_INDEX],
  // Right leg
  [LandmarkType.RIGHT_HIP, LandmarkType.RIGHT_KNEE],
  [LandmarkType.RIGHT_KNEE, LandmarkType.RIGHT_ANKLE],
  [LandmarkType.RIGHT_ANKLE, LandmarkType.RIGHT_HEEL],
  [LandmarkType.RIGHT_ANKLE, LandmarkType.RIGHT_FOOT_INDEX],
  [LandmarkType.RIGHT_HEEL, LandmarkType.RIGHT_FOOT_INDEX],
];

// Get native module
const PoseDetectionModule = requireNativeModule('PoseDetection');

/**
 * Initialize the ML Kit Pose Detector
 * Must be called before detectPose
 */
export function initialize(): boolean {
  return PoseDetectionModule.initialize();
}

/**
 * Detect pose from a base64 encoded image
 * @param base64Image - Base64 encoded image data
 * @param width - Image width
 * @param height - Image height
 * @param rotation - Image rotation (0, 90, 180, 270)
 */
export async function detectPose(
  base64Image: string,
  width: number,
  height: number,
  rotation: number = 0
): Promise<PoseResult> {
  return PoseDetectionModule.detectPose(base64Image, width, height, rotation);
}

/**
 * Detect pose from YUV frame data (from Vision Camera)
 */
export async function detectPoseFromFrame(
  yData: string,
  uData: string,
  vData: string,
  width: number,
  height: number,
  rotation: number = 0
): Promise<PoseResult> {
  return PoseDetectionModule.detectPoseFromFrame(yData, uData, vData, width, height, rotation);
}

/**
 * Close and cleanup the pose detector
 */
export function close(): boolean {
  return PoseDetectionModule.close();
}

export default {
  initialize,
  detectPose,
  detectPoseFromFrame,
  close,
  LandmarkType,
  POSE_CONNECTIONS,
};
