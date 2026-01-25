import Foundation
import AVFoundation
import Observation
import CoreImage
import MLKitPoseDetectionAccurate
import MLKitVision

enum ExercisePhase {
    case unknown
    case up
    case down
}

struct ExerciseResult {
    let isCompleted: Bool
    let count: Int
    let duration: TimeInterval
    let confidence: Double
}

/// Represents a detected body joint for skeleton visualization
struct DetectedJoint {
    let position: CGPoint  // Normalized 0-1 coordinates (flipped Y for display)
    let confidence: Float
}

/// Snapshot of pose for smoothing
struct PoseSnapshot {
    let joints: [String: DetectedJoint]
    let timestamp: Date
}

@Observable
final class ExerciseDetectionService {
    // MARK: - State
    var isDetecting = false
    var currentCount = 0
    var targetCount = 0
    var confidence: Double = 0
    var currentPhase: ExercisePhase = .unknown
    var isInCorrectForm = false

    // Skeleton visualization - normalized coordinates for display
    var detectedJoints: [String: DetectedJoint] = [:]

    // Body connections for skeleton drawing
    static let bodyConnections: [(String, String)] = [
        // Torso
        ("leftShoulder", "rightShoulder"),
        ("leftShoulder", "leftHip"),
        ("rightShoulder", "rightHip"),
        ("leftHip", "rightHip"),
        // Right arm
        ("rightShoulder", "rightElbow"),
        ("rightElbow", "rightWrist"),
        // Left arm
        ("leftShoulder", "leftElbow"),
        ("leftElbow", "leftWrist"),
        // Right leg
        ("rightHip", "rightKnee"),
        ("rightKnee", "rightAnkle"),
        // Left leg
        ("leftHip", "leftKnee"),
        ("leftKnee", "leftAnkle"),
    ]

    // Plank detection
    var isPlankPositionValid = false
    var plankDuration: TimeInterval = 0
    private var plankStartTime: Date?

    // Exercise phase tracking
    private var lastValidPhase: ExercisePhase? = nil

    // MARK: - ML Kit Pose Detector
    private let poseDetector: PoseDetector

    // MARK: - Detection Parameters

    // Minimum confidence threshold for landmarks
    private let minConfidence: Float = 0.5
    private let pushupWristMinConfidence: Float = 0.3

    // Frame processing optimization
    private var frameCounter = 0
    private let analyzeEveryNFrames = 2  // Process every 2nd frame (~15 FPS at 30 FPS input)

    // Phase history for smoothing (8 frames for faster response)
    private var phaseHistory: [ExercisePhase] = []
    private let phaseHistorySize = 8

    // Skeleton history for smooth display (20 frames)
    private var skeletonHistory: [PoseSnapshot] = []
    private let skeletonHistorySize = 20

    // Dead zone thresholds - widened for camera angle tolerance
    private let pushupDownThreshold: Double = 105  // More forgiving for tilted cameras
    private let pushupUpThreshold: Double = 145    // Easier to trigger "up"
    private let squatDownThreshold: Double = 120   // Was 110
    private let squatUpThreshold: Double = 145     // Was 150

    // Velocity tracking to prevent jitter counts
    private var lastAngle: Double = 0
    private var angleVelocity: Double = 0
    private let minVelocityForRep: Double = 5      // Minimum angle change to count
    private let maxVelocityForRep: Double = 50     // Maximum (too fast = jitter)

    // Fallback: last known wrist positions for pushup detection
    private var lastLeftWristPos: CGPoint?
    private var lastRightWristPos: CGPoint?
    private var baselineWristDistance: Double?

    // Image size for coordinate normalization
    private var lastImageSize: CGSize = .zero

    // MARK: - Initialization

    init() {
        let options = AccuratePoseDetectorOptions()
        options.detectorMode = .stream
        poseDetector = PoseDetector.poseDetector(options: options)
    }

    // MARK: - Frame Processing

    func processFrame(_ sampleBuffer: CMSampleBuffer, for exerciseType: ExerciseType) {
        // Frame skipping for performance
        frameCounter += 1
        guard frameCounter % analyzeEveryNFrames == 0 else { return }

        let visionImage = VisionImage(buffer: sampleBuffer)
        visionImage.orientation = imageOrientation()

        // Get image dimensions for coordinate normalization
        if let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) {
            let width = CVPixelBufferGetWidth(pixelBuffer)
            let height = CVPixelBufferGetHeight(pixelBuffer)
            lastImageSize = CGSize(width: width, height: height)
        }

        var poses: [Pose] = []
        do {
            poses = try poseDetector.results(in: visionImage)
        } catch {
            print("ExerciseDetection: ML Kit error - \(error)")
            return
        }

        guard let pose = poses.first else {
            DispatchQueue.main.async {
                self.confidence = 0
                self.detectedJoints = [:]
                self.isInCorrectForm = false
            }
            return
        }

        // Extract all joints for skeleton visualization
        extractAllJoints(from: pose)

        switch exerciseType {
        case .pushups:
            detectPushup(from: pose)
        case .squats:
            detectSquat(from: pose)
        case .plank:
            detectPlank(from: pose)
        case .jumpingJacks:
            detectJumpingJacks(from: pose)
        case .lunges:
            detectLunges(from: pose)
        case .crunches:
            detectCrunches(from: pose)
        case .shoulderPress:
            detectShoulderPress(from: pose)
        case .legRaises:
            detectLegRaises(from: pose)
        case .highKnees:
            detectHighKnees(from: pose)
        case .pullUps:
            detectPullUps(from: pose)
        case .wallSit:
            detectWallSit(from: pose)
        case .sidePlank:
            detectSidePlank(from: pose)
        default:
            break
        }
    }

    // MARK: - Image Orientation Helper

    private func imageOrientation() -> UIImage.Orientation {
        let deviceOrientation = UIDevice.current.orientation
        switch deviceOrientation {
        case .portrait:
            return .right
        case .landscapeLeft:
            return .up
        case .landscapeRight:
            return .down
        case .portraitUpsideDown:
            return .left
        default:
            return .right
        }
    }

    // MARK: - Skeleton Extraction

    private func extractAllJoints(from pose: Pose) {
        var joints: [String: DetectedJoint] = [:]

        let landmarkMapping: [(PoseLandmarkType, String)] = [
            (.nose, "nose"),
            (.leftShoulder, "leftShoulder"),
            (.rightShoulder, "rightShoulder"),
            (.leftElbow, "leftElbow"),
            (.rightElbow, "rightElbow"),
            (.leftWrist, "leftWrist"),
            (.rightWrist, "rightWrist"),
            (.leftHip, "leftHip"),
            (.rightHip, "rightHip"),
            (.leftKnee, "leftKnee"),
            (.rightKnee, "rightKnee"),
            (.leftAnkle, "leftAnkle"),
            (.rightAnkle, "rightAnkle"),
        ]

        for (landmarkType, stringName) in landmarkMapping {
            let landmark = pose.landmark(ofType: landmarkType)
            if landmark.inFrameLikelihood > 0.3 {
                // Normalize ML Kit pixel coordinates to 0-1
                let normalizedX = landmark.position.x / lastImageSize.width
                let normalizedY = landmark.position.y / lastImageSize.height

                // Video is already mirrored by AVFoundation, so don't mirror X again
                let displayX = normalizedX
                let displayY = normalizedY

                joints[stringName] = DetectedJoint(
                    position: CGPoint(x: displayX, y: displayY),
                    confidence: landmark.inFrameLikelihood
                )
            }
        }

        // Add to skeleton history for smoothing
        let snapshot = PoseSnapshot(joints: joints, timestamp: Date())
        skeletonHistory.append(snapshot)
        if skeletonHistory.count > skeletonHistorySize {
            skeletonHistory.removeFirst()
        }

        // Use smoothed skeleton for display
        let smoothedJoints = getSmoothedSkeleton()

        DispatchQueue.main.async {
            self.detectedJoints = smoothedJoints
        }
    }

    // MARK: - Skeleton Smoothing

    private func getSmoothedSkeleton() -> [String: DetectedJoint] {
        guard skeletonHistory.count >= 3 else {
            return skeletonHistory.last?.joints ?? [:]
        }

        var smoothedJoints: [String: DetectedJoint] = [:]
        let recentSnapshots = Array(skeletonHistory.suffix(5))

        // Get all joint names from the most recent snapshot
        guard let latestJoints = recentSnapshots.last?.joints else { return [:] }

        for jointName in latestJoints.keys {
            var totalX: CGFloat = 0
            var totalY: CGFloat = 0
            var totalConfidence: Float = 0
            var count: CGFloat = 0

            // Weighted average - more recent = higher weight
            for (index, snapshot) in recentSnapshots.enumerated() {
                if let joint = snapshot.joints[jointName] {
                    let weight = CGFloat(index + 1)  // 1, 2, 3, 4, 5
                    totalX += joint.position.x * weight
                    totalY += joint.position.y * weight
                    totalConfidence += joint.confidence * Float(weight)
                    count += weight
                }
            }

            if count > 0 {
                smoothedJoints[jointName] = DetectedJoint(
                    position: CGPoint(x: totalX / count, y: totalY / count),
                    confidence: totalConfidence / Float(count)
                )
            }
        }

        return smoothedJoints
    }

    // MARK: - Angle Calculation

    private func calculateAngle(a: CGPoint, b: CGPoint, c: CGPoint) -> Double {
        let radians = atan2(c.y - b.y, c.x - b.x) - atan2(a.y - b.y, a.x - b.x)
        var angle = abs(radians * 180 / .pi)
        if angle > 180 {
            angle = 360 - angle
        }
        return angle
    }

    // MARK: - Velocity Tracking

    private func updateVelocity(newAngle: Double) {
        angleVelocity = abs(newAngle - lastAngle)
        lastAngle = newAngle
    }

    private func isValidVelocity() -> Bool {
        return angleVelocity > minVelocityForRep && angleVelocity < maxVelocityForRep
    }

    // MARK: - Pushup Detection

    private func detectPushup(from pose: Pose) {
        let leftShoulder = pose.landmark(ofType: .leftShoulder)
        let rightShoulder = pose.landmark(ofType: .rightShoulder)
        let leftElbow = pose.landmark(ofType: .leftElbow)
        let rightElbow = pose.landmark(ofType: .rightElbow)
        let leftWrist = pose.landmark(ofType: .leftWrist)
        let rightWrist = pose.landmark(ofType: .rightWrist)

        // Check visibility for both sides (full arm chain)
        let leftFullVisible = leftShoulder.inFrameLikelihood > minConfidence &&
                              leftElbow.inFrameLikelihood > minConfidence &&
                              leftWrist.inFrameLikelihood > minConfidence

        let rightFullVisible = rightShoulder.inFrameLikelihood > minConfidence &&
                               rightElbow.inFrameLikelihood > minConfidence &&
                               rightWrist.inFrameLikelihood > minConfidence

        // Check if at least wrists are visible (for fallback)
        let bothWristsVisible = leftWrist.inFrameLikelihood > pushupWristMinConfidence &&
                                rightWrist.inFrameLikelihood > pushupWristMinConfidence

        var phase: ExercisePhase = .unknown
        var avgConfidence: Double = 0

        if leftFullVisible || rightFullVisible {
            // Primary detection: use elbow angle
            var totalAngle: Double = 0
            var count: Double = 0
            var totalConfidence: Float = 0

            if leftFullVisible {
                let leftAngle = calculateAngle(
                    a: CGPoint(x: CGFloat(leftShoulder.position.x), y: CGFloat(leftShoulder.position.y)),
                    b: CGPoint(x: CGFloat(leftElbow.position.x), y: CGFloat(leftElbow.position.y)),
                    c: CGPoint(x: CGFloat(leftWrist.position.x), y: CGFloat(leftWrist.position.y))
                )
                totalAngle += leftAngle
                count += 1
                totalConfidence += (leftShoulder.inFrameLikelihood + leftElbow.inFrameLikelihood + leftWrist.inFrameLikelihood) / 3
            }

            if rightFullVisible {
                let rightAngle = calculateAngle(
                    a: CGPoint(x: CGFloat(rightShoulder.position.x), y: CGFloat(rightShoulder.position.y)),
                    b: CGPoint(x: CGFloat(rightElbow.position.x), y: CGFloat(rightElbow.position.y)),
                    c: CGPoint(x: CGFloat(rightWrist.position.x), y: CGFloat(rightWrist.position.y))
                )
                totalAngle += rightAngle
                count += 1
                totalConfidence += (rightShoulder.inFrameLikelihood + rightElbow.inFrameLikelihood + rightWrist.inFrameLikelihood) / 3
            }

            let avgAngle = totalAngle / count
            avgConfidence = Double(totalConfidence / Float(count))

            // Update velocity tracking
            updateVelocity(newAngle: avgAngle)

            // Secondary check: shoulder-to-wrist vertical distance
            // In down position, shoulders are closer to wrists vertically
            var shoulderWristRatio: CGFloat = 0
            if leftFullVisible && rightFullVisible {
                let avgShoulderY = (leftShoulder.position.y + rightShoulder.position.y) / 2
                let avgWristY = (leftWrist.position.y + rightWrist.position.y) / 2
                let avgElbowY = (leftElbow.position.y + rightElbow.position.y) / 2
                // Ratio of shoulder-elbow vs elbow-wrist distance
                shoulderWristRatio = abs(avgShoulderY - avgElbowY) / max(abs(avgElbowY - avgWristY), 1)
            }

            // Pushup phases - combine angle + shoulder position
            // Down: angle < threshold OR shoulders very close to elbows
            // Up: angle > threshold AND shoulders above elbows
            let shouldersLow = shoulderWristRatio < 0.8  // Shoulders close to elbow level

            if avgAngle < pushupDownThreshold || (avgAngle < 135 && shouldersLow) {
                phase = .down
            } else if avgAngle > pushupUpThreshold {
                phase = .up
            } else {
                // In dead zone - keep last valid phase
                phase = lastValidPhase ?? .unknown
            }

            // Update baseline wrist distance when in up position
            if phase == .up && bothWristsVisible {
                let leftPos = CGPoint(x: CGFloat(leftWrist.position.x), y: CGFloat(leftWrist.position.y))
                let rightPos = CGPoint(x: CGFloat(rightWrist.position.x), y: CGFloat(rightWrist.position.y))
                baselineWristDistance = hypot(leftPos.x - rightPos.x, leftPos.y - rightPos.y)
            }
        } else if bothWristsVisible {
            // Fallback detection: use wrist distance
            let leftPos = CGPoint(x: CGFloat(leftWrist.position.x), y: CGFloat(leftWrist.position.y))
            let rightPos = CGPoint(x: CGFloat(rightWrist.position.x), y: CGFloat(rightWrist.position.y))
            let currentDistance = hypot(leftPos.x - rightPos.x, leftPos.y - rightPos.y)

            avgConfidence = Double((leftWrist.inFrameLikelihood + rightWrist.inFrameLikelihood) / 2)

            if let baseline = baselineWristDistance {
                let spreadRatio = currentDistance / baseline

                if spreadRatio > 1.15 {
                    phase = .down
                } else if spreadRatio < 1.08 {
                    phase = .up
                }
            } else {
                // No baseline yet, try to establish one
                if currentDistance < lastImageSize.width * 0.3 {
                    baselineWristDistance = currentDistance
                    phase = .up
                }
            }

            lastLeftWristPos = leftPos
            lastRightWristPos = rightPos
        } else {
            updateState(phase: .unknown, isValid: false, confidence: 0)
            return
        }

        // Add to phase history for smoothing (15 frames)
        if phase != .unknown {
            phaseHistory.append(phase)
            if phaseHistory.count > phaseHistorySize {
                phaseHistory.removeFirst()
            }
        }

        // Use smoothed phase (60% consensus from 15 frames)
        let smoothedPhase = getSmoothedPhase()

        // Count rep: transition from down to up
        if smoothedPhase == .up || smoothedPhase == .down {
            if lastValidPhase == .down && smoothedPhase == .up {
                DispatchQueue.main.async {
                    self.currentCount += 1
                }
            }
            lastValidPhase = smoothedPhase
        }

        updateState(phase: smoothedPhase, isValid: true, confidence: avgConfidence)
    }

    /// Get smoothed phase using 50% consensus from phase history
    private func getSmoothedPhase() -> ExercisePhase {
        guard phaseHistory.count >= 3 else {
            return phaseHistory.last ?? .unknown
        }

        let upCount = phaseHistory.filter { $0 == .up }.count
        let downCount = phaseHistory.filter { $0 == .down }.count
        let threshold = phaseHistory.count / 2  // 50% threshold

        if upCount >= threshold {
            return .up
        } else if downCount >= threshold {
            return .down
        }

        // No clear consensus, return most recent non-unknown
        return phaseHistory.last { $0 != .unknown } ?? .unknown
    }

    // MARK: - Squat Detection

    private func detectSquat(from pose: Pose) {
        let leftHip = pose.landmark(ofType: .leftHip)
        let rightHip = pose.landmark(ofType: .rightHip)
        let leftKnee = pose.landmark(ofType: .leftKnee)
        let rightKnee = pose.landmark(ofType: .rightKnee)
        let leftAnkle = pose.landmark(ofType: .leftAnkle)
        let rightAnkle = pose.landmark(ofType: .rightAnkle)

        // Check visibility for both sides
        let leftVisible = leftHip.inFrameLikelihood > minConfidence &&
                          leftKnee.inFrameLikelihood > minConfidence &&
                          leftAnkle.inFrameLikelihood > minConfidence

        let rightVisible = rightHip.inFrameLikelihood > minConfidence &&
                           rightKnee.inFrameLikelihood > minConfidence &&
                           rightAnkle.inFrameLikelihood > minConfidence

        if !leftVisible && !rightVisible {
            updateState(phase: .unknown, isValid: false, confidence: 0)
            return
        }

        // Calculate knee angles (average of visible sides)
        var totalAngle: Double = 0
        var count: Double = 0
        var totalConfidence: Float = 0

        if leftVisible {
            let leftAngle = calculateAngle(
                a: CGPoint(x: CGFloat(leftHip.position.x), y: CGFloat(leftHip.position.y)),
                b: CGPoint(x: CGFloat(leftKnee.position.x), y: CGFloat(leftKnee.position.y)),
                c: CGPoint(x: CGFloat(leftAnkle.position.x), y: CGFloat(leftAnkle.position.y))
            )
            totalAngle += leftAngle
            count += 1
            totalConfidence += (leftHip.inFrameLikelihood + leftKnee.inFrameLikelihood + leftAnkle.inFrameLikelihood) / 3
        }

        if rightVisible {
            let rightAngle = calculateAngle(
                a: CGPoint(x: CGFloat(rightHip.position.x), y: CGFloat(rightHip.position.y)),
                b: CGPoint(x: CGFloat(rightKnee.position.x), y: CGFloat(rightKnee.position.y)),
                c: CGPoint(x: CGFloat(rightAnkle.position.x), y: CGFloat(rightAnkle.position.y))
            )
            totalAngle += rightAngle
            count += 1
            totalConfidence += (rightHip.inFrameLikelihood + rightKnee.inFrameLikelihood + rightAnkle.inFrameLikelihood) / 3
        }

        let avgAngle = totalAngle / count
        let avgConfidence = Double(totalConfidence / Float(count))

        // Update velocity tracking
        updateVelocity(newAngle: avgAngle)

        // Squat phases with dead zones:
        // - Down: knee angle < 110 degrees (squatted)
        // - Up: knee angle > 150 degrees (standing)
        var phase: ExercisePhase = .unknown
        if avgAngle < squatDownThreshold {
            phase = .down
        } else if avgAngle > squatUpThreshold {
            phase = .up
        } else {
            phase = lastValidPhase ?? .unknown
        }

        // Add to phase history
        if phase != .unknown {
            phaseHistory.append(phase)
            if phaseHistory.count > phaseHistorySize {
                phaseHistory.removeFirst()
            }
        }

        let smoothedPhase = getSmoothedPhase()

        // Count rep: transition from down to up
        if smoothedPhase == .up || smoothedPhase == .down {
            if lastValidPhase == .down && smoothedPhase == .up {
                DispatchQueue.main.async {
                    self.currentCount += 1
                }
            }
            lastValidPhase = smoothedPhase
        }

        updateState(phase: smoothedPhase, isValid: true, confidence: avgConfidence)
    }

    // MARK: - Plank Detection

    private func detectPlank(from pose: Pose) {
        let leftShoulder = pose.landmark(ofType: .leftShoulder)
        let rightShoulder = pose.landmark(ofType: .rightShoulder)
        let leftHip = pose.landmark(ofType: .leftHip)
        let rightHip = pose.landmark(ofType: .rightHip)
        let leftAnkle = pose.landmark(ofType: .leftAnkle)
        let rightAnkle = pose.landmark(ofType: .rightAnkle)

        // Check visibility
        let shouldersVisible = leftShoulder.inFrameLikelihood > minConfidence &&
                               rightShoulder.inFrameLikelihood > minConfidence
        let hipsVisible = leftHip.inFrameLikelihood > minConfidence &&
                          rightHip.inFrameLikelihood > minConfidence
        let anklesVisible = leftAnkle.inFrameLikelihood > minConfidence &&
                            rightAnkle.inFrameLikelihood > minConfidence

        if !shouldersVisible || !hipsVisible || !anklesVisible {
            updatePlankState(isHolding: false, confidence: 0)
            return
        }

        // Calculate midpoints
        let midShoulder = CGPoint(
            x: CGFloat((leftShoulder.position.x + rightShoulder.position.x) / 2),
            y: CGFloat((leftShoulder.position.y + rightShoulder.position.y) / 2)
        )
        let midHip = CGPoint(
            x: CGFloat((leftHip.position.x + rightHip.position.x) / 2),
            y: CGFloat((leftHip.position.y + rightHip.position.y) / 2)
        )
        let midAnkle = CGPoint(
            x: CGFloat((leftAnkle.position.x + rightAnkle.position.x) / 2),
            y: CGFloat((leftAnkle.position.y + rightAnkle.position.y) / 2)
        )

        // Calculate body angle relative to horizontal
        let deltaY = midAnkle.y - midShoulder.y
        let deltaX = midAnkle.x - midShoulder.x
        let bodyAngle = abs(atan2(deltaY, deltaX) * 180 / .pi)

        // Check alignment (body should be roughly straight) - tighter threshold
        let shoulderAnkleDist = sqrt(pow(midAnkle.x - midShoulder.x, 2) + pow(midAnkle.y - midShoulder.y, 2))
        let shoulderHipDist = sqrt(pow(midHip.x - midShoulder.x, 2) + pow(midHip.y - midShoulder.y, 2))
        let hipAnkleDist = sqrt(pow(midAnkle.x - midHip.x, 2) + pow(midAnkle.y - midHip.y, 2))

        let alignmentRatio = (shoulderHipDist + hipAnkleDist) / max(shoulderAnkleDist, 0.001)
        let isAligned = alignmentRatio < 1.08  // Tighter than before (was 1.15)

        // Check hip sag - hip should be close to shoulder-ankle line
        let shoulderAnkleY = (midShoulder.y + midAnkle.y) / 2
        let hipDeviation = abs(midHip.y - shoulderAnkleY) / lastImageSize.height
        let noHipSag = hipDeviation < 0.05  // Hip within 5% of shoulder-ankle line

        // Body should be roughly horizontal (angle close to 0 or 180 degrees)
        let isHorizontal = bodyAngle < 30 || bodyAngle > 150

        let isHolding = isHorizontal && isAligned && noHipSag

        let avgConfidence = (leftShoulder.inFrameLikelihood + rightShoulder.inFrameLikelihood +
                            leftHip.inFrameLikelihood + rightHip.inFrameLikelihood +
                            leftAnkle.inFrameLikelihood + rightAnkle.inFrameLikelihood) / 6

        updatePlankState(isHolding: isHolding, confidence: Double(avgConfidence))
    }

    // MARK: - Jumping Jacks Detection

    private func detectJumpingJacks(from pose: Pose) {
        let leftShoulder = pose.landmark(ofType: .leftShoulder)
        let rightShoulder = pose.landmark(ofType: .rightShoulder)
        let leftWrist = pose.landmark(ofType: .leftWrist)
        let rightWrist = pose.landmark(ofType: .rightWrist)
        let leftAnkle = pose.landmark(ofType: .leftAnkle)
        let rightAnkle = pose.landmark(ofType: .rightAnkle)
        let leftHip = pose.landmark(ofType: .leftHip)
        let rightHip = pose.landmark(ofType: .rightHip)

        let allVisible = leftShoulder.inFrameLikelihood > minConfidence &&
                         rightShoulder.inFrameLikelihood > minConfidence &&
                         leftWrist.inFrameLikelihood > minConfidence &&
                         rightWrist.inFrameLikelihood > minConfidence &&
                         leftAnkle.inFrameLikelihood > minConfidence &&
                         rightAnkle.inFrameLikelihood > minConfidence &&
                         leftHip.inFrameLikelihood > minConfidence &&
                         rightHip.inFrameLikelihood > minConfidence

        if !allVisible {
            updateState(phase: .unknown, isValid: false, confidence: 0)
            return
        }

        // Calculate arm spread (distance between wrists relative to shoulder width)
        let shoulderWidth = hypot(rightShoulder.position.x - leftShoulder.position.x,
                                  rightShoulder.position.y - leftShoulder.position.y)
        let wristSpread = hypot(rightWrist.position.x - leftWrist.position.x,
                                rightWrist.position.y - leftWrist.position.y)
        let armSpreadRatio = wristSpread / shoulderWidth

        // Calculate leg spread
        let hipWidth = hypot(rightHip.position.x - leftHip.position.x,
                            rightHip.position.y - leftHip.position.y)
        let ankleSpread = hypot(rightAnkle.position.x - leftAnkle.position.x,
                               rightAnkle.position.y - leftAnkle.position.y)
        let legSpreadRatio = ankleSpread / hipWidth

        let spreadScore = (armSpreadRatio + legSpreadRatio) / 2
        let avgConfidence = (leftShoulder.inFrameLikelihood + rightWrist.inFrameLikelihood +
                            leftAnkle.inFrameLikelihood) / 3

        var phase: ExercisePhase = .unknown
        // Open position: arms and legs spread wide
        if spreadScore > 2.5 {
            phase = .down
        }
        // Closed position: arms down, legs together
        else if spreadScore < 1.5 {
            phase = .up
        } else {
            phase = lastValidPhase ?? .unknown
        }

        if phase != .unknown {
            phaseHistory.append(phase)
            if phaseHistory.count > phaseHistorySize {
                phaseHistory.removeFirst()
            }
        }

        let smoothedPhase = getSmoothedPhase()

        // Count rep: down (open) -> up (closed) transition
        if smoothedPhase == .up || smoothedPhase == .down {
            if lastValidPhase == .down && smoothedPhase == .up {
                DispatchQueue.main.async {
                    self.currentCount += 1
                }
            }
            lastValidPhase = smoothedPhase
        }

        updateState(phase: smoothedPhase, isValid: true, confidence: Double(avgConfidence))
    }

    // MARK: - Lunges Detection

    private func detectLunges(from pose: Pose) {
        let leftHip = pose.landmark(ofType: .leftHip)
        let rightHip = pose.landmark(ofType: .rightHip)
        let leftKnee = pose.landmark(ofType: .leftKnee)
        let rightKnee = pose.landmark(ofType: .rightKnee)
        let leftAnkle = pose.landmark(ofType: .leftAnkle)
        let rightAnkle = pose.landmark(ofType: .rightAnkle)

        let leftVisible = leftHip.inFrameLikelihood > minConfidence &&
                          leftKnee.inFrameLikelihood > minConfidence &&
                          leftAnkle.inFrameLikelihood > minConfidence

        let rightVisible = rightHip.inFrameLikelihood > minConfidence &&
                           rightKnee.inFrameLikelihood > minConfidence &&
                           rightAnkle.inFrameLikelihood > minConfidence

        if !leftVisible && !rightVisible {
            updateState(phase: .unknown, isValid: false, confidence: 0)
            return
        }

        // Find the front leg (the one with smaller knee angle)
        var frontKneeAngle: Double = 180

        if leftVisible {
            let leftAngle = calculateAngle(
                a: CGPoint(x: CGFloat(leftHip.position.x), y: CGFloat(leftHip.position.y)),
                b: CGPoint(x: CGFloat(leftKnee.position.x), y: CGFloat(leftKnee.position.y)),
                c: CGPoint(x: CGFloat(leftAnkle.position.x), y: CGFloat(leftAnkle.position.y))
            )
            frontKneeAngle = min(frontKneeAngle, leftAngle)
        }

        if rightVisible {
            let rightAngle = calculateAngle(
                a: CGPoint(x: CGFloat(rightHip.position.x), y: CGFloat(rightHip.position.y)),
                b: CGPoint(x: CGFloat(rightKnee.position.x), y: CGFloat(rightKnee.position.y)),
                c: CGPoint(x: CGFloat(rightAnkle.position.x), y: CGFloat(rightAnkle.position.y))
            )
            frontKneeAngle = min(frontKneeAngle, rightAngle)
        }

        var phase: ExercisePhase = .unknown
        // Lunge down: front knee bent < 110°
        if frontKneeAngle < 110 {
            phase = .down
        }
        // Standing: legs relatively straight > 155°
        else if frontKneeAngle > 155 {
            phase = .up
        } else {
            phase = lastValidPhase ?? .unknown
        }

        if phase != .unknown {
            phaseHistory.append(phase)
            if phaseHistory.count > phaseHistorySize {
                phaseHistory.removeFirst()
            }
        }

        let smoothedPhase = getSmoothedPhase()
        let avgConfidence = (leftHip.inFrameLikelihood + rightKnee.inFrameLikelihood) / 2

        if smoothedPhase == .up || smoothedPhase == .down {
            if lastValidPhase == .down && smoothedPhase == .up {
                DispatchQueue.main.async {
                    self.currentCount += 1
                }
            }
            lastValidPhase = smoothedPhase
        }

        updateState(phase: smoothedPhase, isValid: true, confidence: Double(avgConfidence))
    }

    // MARK: - Crunches Detection

    private func detectCrunches(from pose: Pose) {
        let leftShoulder = pose.landmark(ofType: .leftShoulder)
        let rightShoulder = pose.landmark(ofType: .rightShoulder)
        let leftHip = pose.landmark(ofType: .leftHip)
        let rightHip = pose.landmark(ofType: .rightHip)
        let leftKnee = pose.landmark(ofType: .leftKnee)
        let rightKnee = pose.landmark(ofType: .rightKnee)

        let allVisible = leftShoulder.inFrameLikelihood > minConfidence &&
                         rightShoulder.inFrameLikelihood > minConfidence &&
                         leftHip.inFrameLikelihood > minConfidence &&
                         rightHip.inFrameLikelihood > minConfidence &&
                         leftKnee.inFrameLikelihood > minConfidence &&
                         rightKnee.inFrameLikelihood > minConfidence

        if !allVisible {
            updateState(phase: .unknown, isValid: false, confidence: 0)
            return
        }

        let midShoulder = CGPoint(
            x: CGFloat((leftShoulder.position.x + rightShoulder.position.x) / 2),
            y: CGFloat((leftShoulder.position.y + rightShoulder.position.y) / 2)
        )
        let midHip = CGPoint(
            x: CGFloat((leftHip.position.x + rightHip.position.x) / 2),
            y: CGFloat((leftHip.position.y + rightHip.position.y) / 2)
        )
        let midKnee = CGPoint(
            x: CGFloat((leftKnee.position.x + rightKnee.position.x) / 2),
            y: CGFloat((leftKnee.position.y + rightKnee.position.y) / 2)
        )

        // Calculate shoulder-hip-knee angle (torso to thigh angle)
        let crunchAngle = calculateAngle(a: midShoulder, b: midHip, c: midKnee)

        var phase: ExercisePhase = .unknown
        // Crunch up: torso raised, angle < 100°
        if crunchAngle < 100 {
            phase = .up
        }
        // Lying down: torso flat, angle > 140°
        else if crunchAngle > 140 {
            phase = .down
        } else {
            phase = lastValidPhase ?? .unknown
        }

        if phase != .unknown {
            phaseHistory.append(phase)
            if phaseHistory.count > phaseHistorySize {
                phaseHistory.removeFirst()
            }
        }

        let smoothedPhase = getSmoothedPhase()
        let avgConfidence = (leftShoulder.inFrameLikelihood + rightHip.inFrameLikelihood) / 2

        // Count rep: up -> down transition (completed a crunch)
        if smoothedPhase == .up || smoothedPhase == .down {
            if lastValidPhase == .up && smoothedPhase == .down {
                DispatchQueue.main.async {
                    self.currentCount += 1
                }
            }
            lastValidPhase = smoothedPhase
        }

        updateState(phase: smoothedPhase, isValid: true, confidence: Double(avgConfidence))
    }

    // MARK: - Shoulder Press Detection

    private func detectShoulderPress(from pose: Pose) {
        let leftShoulder = pose.landmark(ofType: .leftShoulder)
        let leftElbow = pose.landmark(ofType: .leftElbow)
        let leftWrist = pose.landmark(ofType: .leftWrist)
        let rightShoulder = pose.landmark(ofType: .rightShoulder)
        let rightElbow = pose.landmark(ofType: .rightElbow)
        let rightWrist = pose.landmark(ofType: .rightWrist)

        let leftVisible = leftShoulder.inFrameLikelihood > minConfidence &&
                          leftElbow.inFrameLikelihood > minConfidence &&
                          leftWrist.inFrameLikelihood > minConfidence

        let rightVisible = rightShoulder.inFrameLikelihood > minConfidence &&
                           rightElbow.inFrameLikelihood > minConfidence &&
                           rightWrist.inFrameLikelihood > minConfidence

        if !leftVisible && !rightVisible {
            updateState(phase: .unknown, isValid: false, confidence: 0)
            return
        }

        var totalAngle: Double = 0
        var count: Double = 0
        var totalConfidence: Float = 0

        if leftVisible {
            let leftAngle = calculateAngle(
                a: CGPoint(x: CGFloat(leftShoulder.position.x), y: CGFloat(leftShoulder.position.y)),
                b: CGPoint(x: CGFloat(leftElbow.position.x), y: CGFloat(leftElbow.position.y)),
                c: CGPoint(x: CGFloat(leftWrist.position.x), y: CGFloat(leftWrist.position.y))
            )
            totalAngle += leftAngle
            count += 1
            totalConfidence += (leftShoulder.inFrameLikelihood + leftElbow.inFrameLikelihood + leftWrist.inFrameLikelihood) / 3
        }

        if rightVisible {
            let rightAngle = calculateAngle(
                a: CGPoint(x: CGFloat(rightShoulder.position.x), y: CGFloat(rightShoulder.position.y)),
                b: CGPoint(x: CGFloat(rightElbow.position.x), y: CGFloat(rightElbow.position.y)),
                c: CGPoint(x: CGFloat(rightWrist.position.x), y: CGFloat(rightWrist.position.y))
            )
            totalAngle += rightAngle
            count += 1
            totalConfidence += (rightShoulder.inFrameLikelihood + rightElbow.inFrameLikelihood + rightWrist.inFrameLikelihood) / 3
        }

        let avgAngle = totalAngle / count
        let avgConfidence = Double(totalConfidence / Float(count))

        var phase: ExercisePhase = .unknown
        // Press up: arms extended overhead > 160°
        if avgAngle > 160 {
            phase = .up
        }
        // Down position: elbows bent at ~90° (< 110°)
        else if avgAngle < 110 {
            phase = .down
        } else {
            phase = lastValidPhase ?? .unknown
        }

        if phase != .unknown {
            phaseHistory.append(phase)
            if phaseHistory.count > phaseHistorySize {
                phaseHistory.removeFirst()
            }
        }

        let smoothedPhase = getSmoothedPhase()

        if smoothedPhase == .up || smoothedPhase == .down {
            if lastValidPhase == .down && smoothedPhase == .up {
                DispatchQueue.main.async {
                    self.currentCount += 1
                }
            }
            lastValidPhase = smoothedPhase
        }

        updateState(phase: smoothedPhase, isValid: true, confidence: avgConfidence)
    }

    // MARK: - Leg Raises Detection

    private func detectLegRaises(from pose: Pose) {
        let leftShoulder = pose.landmark(ofType: .leftShoulder)
        let rightShoulder = pose.landmark(ofType: .rightShoulder)
        let leftHip = pose.landmark(ofType: .leftHip)
        let rightHip = pose.landmark(ofType: .rightHip)
        let leftKnee = pose.landmark(ofType: .leftKnee)
        let rightKnee = pose.landmark(ofType: .rightKnee)

        let allVisible = leftShoulder.inFrameLikelihood > minConfidence &&
                         rightShoulder.inFrameLikelihood > minConfidence &&
                         leftHip.inFrameLikelihood > minConfidence &&
                         rightHip.inFrameLikelihood > minConfidence &&
                         leftKnee.inFrameLikelihood > minConfidence &&
                         rightKnee.inFrameLikelihood > minConfidence

        if !allVisible {
            updateState(phase: .unknown, isValid: false, confidence: 0)
            return
        }

        let midShoulder = CGPoint(
            x: CGFloat((leftShoulder.position.x + rightShoulder.position.x) / 2),
            y: CGFloat((leftShoulder.position.y + rightShoulder.position.y) / 2)
        )
        let midHip = CGPoint(
            x: CGFloat((leftHip.position.x + rightHip.position.x) / 2),
            y: CGFloat((leftHip.position.y + rightHip.position.y) / 2)
        )
        let midKnee = CGPoint(
            x: CGFloat((leftKnee.position.x + rightKnee.position.x) / 2),
            y: CGFloat((leftKnee.position.y + rightKnee.position.y) / 2)
        )

        let legAngle = calculateAngle(a: midShoulder, b: midHip, c: midKnee)

        var phase: ExercisePhase = .unknown
        // Legs raised: angle < 110° (legs up toward ceiling)
        if legAngle < 110 {
            phase = .up
        }
        // Legs down: angle > 160° (legs flat on ground)
        else if legAngle > 160 {
            phase = .down
        } else {
            phase = lastValidPhase ?? .unknown
        }

        if phase != .unknown {
            phaseHistory.append(phase)
            if phaseHistory.count > phaseHistorySize {
                phaseHistory.removeFirst()
            }
        }

        let smoothedPhase = getSmoothedPhase()
        let avgConfidence = (leftShoulder.inFrameLikelihood + rightHip.inFrameLikelihood) / 2

        // Count rep: up -> down transition
        if smoothedPhase == .up || smoothedPhase == .down {
            if lastValidPhase == .up && smoothedPhase == .down {
                DispatchQueue.main.async {
                    self.currentCount += 1
                }
            }
            lastValidPhase = smoothedPhase
        }

        updateState(phase: smoothedPhase, isValid: true, confidence: Double(avgConfidence))
    }

    // MARK: - High Knees Detection

    private func detectHighKnees(from pose: Pose) {
        let leftHip = pose.landmark(ofType: .leftHip)
        let leftKnee = pose.landmark(ofType: .leftKnee)
        let rightHip = pose.landmark(ofType: .rightHip)
        let rightKnee = pose.landmark(ofType: .rightKnee)

        let leftVisible = leftHip.inFrameLikelihood > minConfidence &&
                          leftKnee.inFrameLikelihood > minConfidence
        let rightVisible = rightHip.inFrameLikelihood > minConfidence &&
                           rightKnee.inFrameLikelihood > minConfidence

        if !leftVisible && !rightVisible {
            updateState(phase: .unknown, isValid: false, confidence: 0)
            return
        }

        // Check if either knee is raised above hip level
        var kneeRaised = false

        if leftVisible {
            // In image coordinates, y increases downward, so knee above hip means knee.y < hip.y
            let leftHeightDiff = leftHip.position.y - leftKnee.position.y
            if leftHeightDiff > lastImageSize.height * 0.05 {
                kneeRaised = true
            }
        }

        if rightVisible {
            let rightHeightDiff = rightHip.position.y - rightKnee.position.y
            if rightHeightDiff > lastImageSize.height * 0.05 {
                kneeRaised = true
            }
        }

        let avgConfidence = (leftHip.inFrameLikelihood + rightKnee.inFrameLikelihood) / 2

        let phase: ExercisePhase = kneeRaised ? .up : .down

        phaseHistory.append(phase)
        if phaseHistory.count > phaseHistorySize {
            phaseHistory.removeFirst()
        }

        let smoothedPhase = getSmoothedPhase()

        // Count each time knee goes up from down
        if lastValidPhase == .down && smoothedPhase == .up {
            DispatchQueue.main.async {
                self.currentCount += 1
            }
        }
        lastValidPhase = smoothedPhase

        updateState(phase: smoothedPhase, isValid: true, confidence: Double(avgConfidence))
    }

    // MARK: - Pull-ups Detection

    private func detectPullUps(from pose: Pose) {
        let leftShoulder = pose.landmark(ofType: .leftShoulder)
        let leftElbow = pose.landmark(ofType: .leftElbow)
        let leftWrist = pose.landmark(ofType: .leftWrist)
        let rightShoulder = pose.landmark(ofType: .rightShoulder)
        let rightElbow = pose.landmark(ofType: .rightElbow)
        let rightWrist = pose.landmark(ofType: .rightWrist)

        let leftVisible = leftShoulder.inFrameLikelihood > minConfidence &&
                          leftElbow.inFrameLikelihood > minConfidence &&
                          leftWrist.inFrameLikelihood > minConfidence

        let rightVisible = rightShoulder.inFrameLikelihood > minConfidence &&
                           rightElbow.inFrameLikelihood > minConfidence &&
                           rightWrist.inFrameLikelihood > minConfidence

        if !leftVisible && !rightVisible {
            updateState(phase: .unknown, isValid: false, confidence: 0)
            return
        }

        var totalAngle: Double = 0
        var count: Double = 0
        var totalConfidence: Float = 0

        if leftVisible {
            let leftAngle = calculateAngle(
                a: CGPoint(x: CGFloat(leftShoulder.position.x), y: CGFloat(leftShoulder.position.y)),
                b: CGPoint(x: CGFloat(leftElbow.position.x), y: CGFloat(leftElbow.position.y)),
                c: CGPoint(x: CGFloat(leftWrist.position.x), y: CGFloat(leftWrist.position.y))
            )
            totalAngle += leftAngle
            count += 1
            totalConfidence += (leftShoulder.inFrameLikelihood + leftElbow.inFrameLikelihood) / 2
        }

        if rightVisible {
            let rightAngle = calculateAngle(
                a: CGPoint(x: CGFloat(rightShoulder.position.x), y: CGFloat(rightShoulder.position.y)),
                b: CGPoint(x: CGFloat(rightElbow.position.x), y: CGFloat(rightElbow.position.y)),
                c: CGPoint(x: CGFloat(rightWrist.position.x), y: CGFloat(rightWrist.position.y))
            )
            totalAngle += rightAngle
            count += 1
            totalConfidence += (rightShoulder.inFrameLikelihood + rightElbow.inFrameLikelihood) / 2
        }

        let avgAngle = totalAngle / count
        let avgConfidence = Double(totalConfidence / Float(count))

        var phase: ExercisePhase = .unknown
        // Pull-up top: arms bent, angle < 90°
        if avgAngle < 90 {
            phase = .up
        }
        // Hanging: arms extended, angle > 150°
        else if avgAngle > 150 {
            phase = .down
        } else {
            phase = lastValidPhase ?? .unknown
        }

        if phase != .unknown {
            phaseHistory.append(phase)
            if phaseHistory.count > phaseHistorySize {
                phaseHistory.removeFirst()
            }
        }

        let smoothedPhase = getSmoothedPhase()

        if smoothedPhase == .up || smoothedPhase == .down {
            if lastValidPhase == .down && smoothedPhase == .up {
                DispatchQueue.main.async {
                    self.currentCount += 1
                }
            }
            lastValidPhase = smoothedPhase
        }

        updateState(phase: smoothedPhase, isValid: true, confidence: avgConfidence)
    }

    // MARK: - Wall Sit Detection (Hold Exercise)

    private func detectWallSit(from pose: Pose) {
        let leftHip = pose.landmark(ofType: .leftHip)
        let rightHip = pose.landmark(ofType: .rightHip)
        let leftKnee = pose.landmark(ofType: .leftKnee)
        let rightKnee = pose.landmark(ofType: .rightKnee)
        let leftAnkle = pose.landmark(ofType: .leftAnkle)
        let rightAnkle = pose.landmark(ofType: .rightAnkle)

        let leftVisible = leftHip.inFrameLikelihood > minConfidence &&
                          leftKnee.inFrameLikelihood > minConfidence &&
                          leftAnkle.inFrameLikelihood > minConfidence

        let rightVisible = rightHip.inFrameLikelihood > minConfidence &&
                           rightKnee.inFrameLikelihood > minConfidence &&
                           rightAnkle.inFrameLikelihood > minConfidence

        if !leftVisible && !rightVisible {
            updatePlankState(isHolding: false, confidence: 0)
            return
        }

        var avgKneeAngle: Double = 0
        var count: Double = 0

        if leftVisible {
            let leftAngle = calculateAngle(
                a: CGPoint(x: CGFloat(leftHip.position.x), y: CGFloat(leftHip.position.y)),
                b: CGPoint(x: CGFloat(leftKnee.position.x), y: CGFloat(leftKnee.position.y)),
                c: CGPoint(x: CGFloat(leftAnkle.position.x), y: CGFloat(leftAnkle.position.y))
            )
            avgKneeAngle += leftAngle
            count += 1
        }

        if rightVisible {
            let rightAngle = calculateAngle(
                a: CGPoint(x: CGFloat(rightHip.position.x), y: CGFloat(rightHip.position.y)),
                b: CGPoint(x: CGFloat(rightKnee.position.x), y: CGFloat(rightKnee.position.y)),
                c: CGPoint(x: CGFloat(rightAnkle.position.x), y: CGFloat(rightAnkle.position.y))
            )
            avgKneeAngle += rightAngle
            count += 1
        }

        avgKneeAngle = avgKneeAngle / count

        // Wall sit position: knees at approximately 90° (70-120° range)
        let isKneesBent = avgKneeAngle >= 70 && avgKneeAngle <= 120

        let avgConfidence = (leftHip.inFrameLikelihood + rightKnee.inFrameLikelihood) / 2

        updatePlankState(isHolding: isKneesBent, confidence: Double(avgConfidence))
    }

    // MARK: - Side Plank Detection (Hold Exercise)

    private func detectSidePlank(from pose: Pose) {
        let leftShoulder = pose.landmark(ofType: .leftShoulder)
        let rightShoulder = pose.landmark(ofType: .rightShoulder)
        let leftHip = pose.landmark(ofType: .leftHip)
        let rightHip = pose.landmark(ofType: .rightHip)
        let leftAnkle = pose.landmark(ofType: .leftAnkle)
        let rightAnkle = pose.landmark(ofType: .rightAnkle)

        let shouldersVisible = leftShoulder.inFrameLikelihood > minConfidence &&
                               rightShoulder.inFrameLikelihood > minConfidence
        let hipsVisible = leftHip.inFrameLikelihood > minConfidence &&
                          rightHip.inFrameLikelihood > minConfidence
        let anklesVisible = leftAnkle.inFrameLikelihood > minConfidence &&
                            rightAnkle.inFrameLikelihood > minConfidence

        if !shouldersVisible || !hipsVisible || !anklesVisible {
            updatePlankState(isHolding: false, confidence: 0)
            return
        }

        // Calculate midpoints for body alignment
        let midShoulder = CGPoint(
            x: CGFloat((leftShoulder.position.x + rightShoulder.position.x) / 2),
            y: CGFloat((leftShoulder.position.y + rightShoulder.position.y) / 2)
        )
        let midHip = CGPoint(
            x: CGFloat((leftHip.position.x + rightHip.position.x) / 2),
            y: CGFloat((leftHip.position.y + rightHip.position.y) / 2)
        )
        let midAnkle = CGPoint(
            x: CGFloat((leftAnkle.position.x + rightAnkle.position.x) / 2),
            y: CGFloat((leftAnkle.position.y + rightAnkle.position.y) / 2)
        )

        // Check body alignment
        let shoulderAnkleDist = sqrt(pow(midAnkle.x - midShoulder.x, 2) + pow(midAnkle.y - midShoulder.y, 2))
        let shoulderHipDist = sqrt(pow(midHip.x - midShoulder.x, 2) + pow(midHip.y - midShoulder.y, 2))
        let hipAnkleDist = sqrt(pow(midAnkle.x - midHip.x, 2) + pow(midAnkle.y - midHip.y, 2))

        let alignmentRatio = (shoulderHipDist + hipAnkleDist) / max(shoulderAnkleDist, 0.001)
        let isAligned = alignmentRatio < 1.2

        // Calculate body angle relative to horizontal
        let deltaY = midAnkle.y - midShoulder.y
        let deltaX = midAnkle.x - midShoulder.x
        let bodyAngle = abs(atan2(deltaY, deltaX) * 180 / .pi)

        // Side plank: body at an angle (not completely horizontal)
        let isSidePosition = bodyAngle >= 20 && bodyAngle <= 160

        let isHolding = isAligned && isSidePosition

        let avgConfidence = (leftShoulder.inFrameLikelihood + rightHip.inFrameLikelihood + leftAnkle.inFrameLikelihood) / 3

        updatePlankState(isHolding: isHolding, confidence: Double(avgConfidence))
    }

    // MARK: - State Updates

    private func updateState(phase: ExercisePhase, isValid: Bool, confidence: Double) {
        DispatchQueue.main.async {
            self.currentPhase = phase
            self.isInCorrectForm = isValid
            self.confidence = confidence
        }
    }

    private func updatePlankState(isHolding: Bool, confidence: Double) {
        DispatchQueue.main.async {
            self.isPlankPositionValid = isHolding
            self.isInCorrectForm = isHolding
            self.confidence = confidence
            self.currentPhase = isHolding ? .down : .up

            if isHolding {
                if self.plankStartTime == nil {
                    self.plankStartTime = Date()
                }
                self.plankDuration = Date().timeIntervalSince(self.plankStartTime!)
            } else {
                self.plankStartTime = nil
            }
        }
    }

    // MARK: - Control

    func startDetection(type: ExerciseType, target: Int) {
        isDetecting = true
        currentCount = 0
        targetCount = target
        confidence = 0
        currentPhase = .unknown
        lastValidPhase = nil
        isPlankPositionValid = false
        plankDuration = 0
        plankStartTime = nil
        isInCorrectForm = false
        // Reset state
        phaseHistory.removeAll()
        skeletonHistory.removeAll()
        lastLeftWristPos = nil
        lastRightWristPos = nil
        baselineWristDistance = nil
        frameCounter = 0
        lastAngle = 0
        angleVelocity = 0
    }

    func stopDetection() -> ExerciseResult {
        isDetecting = false

        let result = ExerciseResult(
            isCompleted: currentCount >= targetCount,
            count: currentCount,
            duration: plankDuration,
            confidence: confidence
        )

        return result
    }

    func reset() {
        isDetecting = false
        currentCount = 0
        targetCount = 0
        confidence = 0
        plankDuration = 0
        plankStartTime = nil
        currentPhase = .unknown
        lastValidPhase = nil
        isInCorrectForm = false
        detectedJoints = [:]
        phaseHistory.removeAll()
        skeletonHistory.removeAll()
        lastLeftWristPos = nil
        lastRightWristPos = nil
        baselineWristDistance = nil
        frameCounter = 0
        lastAngle = 0
        angleVelocity = 0
    }

    // MARK: - Plank Pause/Resume

    func pausePlank() {
        if let startTime = plankStartTime {
            plankDuration = Date().timeIntervalSince(startTime)
        }
        plankStartTime = nil
    }

    func resumePlank() {
        plankDuration = 0
        plankStartTime = Date()
    }
}
