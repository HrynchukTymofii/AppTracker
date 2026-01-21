import Foundation
import Vision
import AVFoundation
import Observation
import CoreImage

enum PushupState {
    case unknown
    case up
    case down
}

enum SquatState {
    case unknown
    case standing
    case squatting
}

struct ExerciseResult {
    let isCompleted: Bool
    let count: Int
    let duration: TimeInterval
    let confidence: Double
}

@Observable
final class ExerciseDetectionService {
    // State
    var isDetecting = false
    var currentCount = 0
    var targetCount = 0
    var confidence: Double = 0

    // Pushup detection
    private var pushupState: PushupState = .unknown
    private var lastPushupState: PushupState = .unknown

    // Squat detection
    private var squatState: SquatState = .unknown
    private var lastSquatState: SquatState = .unknown

    // Plank detection
    var isPlankPositionValid = false
    var plankDuration: TimeInterval = 0
    private var plankStartTime: Date?

    // Vision
    private let bodyPoseRequest = VNDetectHumanBodyPoseRequest()

    // MARK: - Frame Processing

    func processFrame(_ sampleBuffer: CMSampleBuffer, for exerciseType: ExerciseType) {
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }

        let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: .up, options: [:])

        do {
            try handler.perform([bodyPoseRequest])

            guard let observation = bodyPoseRequest.results?.first else {
                confidence = 0
                return
            }

            switch exerciseType {
            case .pushups:
                detectPushup(from: observation)
            case .squats:
                detectSquat(from: observation)
            case .plank:
                detectPlank(from: observation)
            default:
                break
            }
        } catch {
            print("ExerciseDetection: Vision error - \(error)")
        }
    }

    // MARK: - Pushup Detection

    private func detectPushup(from observation: VNHumanBodyPoseObservation) {
        guard let shoulder = try? observation.recognizedPoint(.rightShoulder),
              let elbow = try? observation.recognizedPoint(.rightElbow),
              let wrist = try? observation.recognizedPoint(.rightWrist),
              shoulder.confidence > 0.3 && elbow.confidence > 0.3 && wrist.confidence > 0.3 else {
            confidence = 0
            return
        }

        confidence = Double((shoulder.confidence + elbow.confidence + wrist.confidence) / 3)

        // Calculate arm angle
        let armAngle = calculateAngle(
            point1: CGPoint(x: shoulder.location.x, y: shoulder.location.y),
            point2: CGPoint(x: elbow.location.x, y: elbow.location.y),
            point3: CGPoint(x: wrist.location.x, y: wrist.location.y)
        )

        // Determine state based on arm angle
        // Extended arms (up position) = angle > 150
        // Bent arms (down position) = angle < 90
        if armAngle > 150 {
            pushupState = .up
        } else if armAngle < 90 {
            pushupState = .down
        }

        // Count rep on transition from down to up
        if lastPushupState == .down && pushupState == .up {
            currentCount += 1
        }

        lastPushupState = pushupState
    }

    // MARK: - Squat Detection

    private func detectSquat(from observation: VNHumanBodyPoseObservation) {
        guard let hip = try? observation.recognizedPoint(.rightHip),
              let knee = try? observation.recognizedPoint(.rightKnee),
              let ankle = try? observation.recognizedPoint(.rightAnkle),
              hip.confidence > 0.3 && knee.confidence > 0.3 && ankle.confidence > 0.3 else {
            confidence = 0
            return
        }

        confidence = Double((hip.confidence + knee.confidence + ankle.confidence) / 3)

        // Calculate leg angle
        let legAngle = calculateAngle(
            point1: CGPoint(x: hip.location.x, y: hip.location.y),
            point2: CGPoint(x: knee.location.x, y: knee.location.y),
            point3: CGPoint(x: ankle.location.x, y: ankle.location.y)
        )

        // Determine state
        // Standing = angle > 160
        // Squatting = angle < 100
        if legAngle > 160 {
            squatState = .standing
        } else if legAngle < 100 {
            squatState = .squatting
        }

        // Count rep on transition from squat to stand
        if lastSquatState == .squatting && squatState == .standing {
            currentCount += 1
        }

        lastSquatState = squatState
    }

    // MARK: - Plank Detection

    private func detectPlank(from observation: VNHumanBodyPoseObservation) {
        guard let shoulder = try? observation.recognizedPoint(.rightShoulder),
              let hip = try? observation.recognizedPoint(.rightHip),
              let ankle = try? observation.recognizedPoint(.rightAnkle),
              shoulder.confidence > 0.3 && hip.confidence > 0.3 && ankle.confidence > 0.3 else {
            isPlankPositionValid = false
            confidence = 0
            pausePlankTimer()
            return
        }

        confidence = Double((shoulder.confidence + hip.confidence + ankle.confidence) / 3)

        // Check if body is roughly horizontal
        // In a proper plank, shoulder, hip, and ankle should be roughly aligned
        let shoulderY = shoulder.location.y
        let hipY = hip.location.y
        let ankleY = ankle.location.y

        // Calculate how aligned the body is (smaller difference = more aligned)
        let alignmentThreshold = 0.15 // 15% of screen height tolerance
        let shoulderHipDiff = abs(shoulderY - hipY)
        let hipAnkleDiff = abs(hipY - ankleY)

        isPlankPositionValid = shoulderHipDiff < alignmentThreshold && hipAnkleDiff < alignmentThreshold

        if isPlankPositionValid {
            if plankStartTime == nil {
                plankStartTime = Date()
            }
            plankDuration = Date().timeIntervalSince(plankStartTime!)
        } else {
            pausePlankTimer()
        }
    }

    private func pausePlankTimer() {
        // Don't reset completely, just pause
        // plankStartTime = nil would reset the timer
    }

    // MARK: - Utilities

    private func calculateAngle(point1: CGPoint, point2: CGPoint, point3: CGPoint) -> Double {
        let vector1 = CGPoint(x: point1.x - point2.x, y: point1.y - point2.y)
        let vector2 = CGPoint(x: point3.x - point2.x, y: point3.y - point2.y)

        let dot = vector1.x * vector2.x + vector1.y * vector2.y
        let mag1 = sqrt(vector1.x * vector1.x + vector1.y * vector1.y)
        let mag2 = sqrt(vector2.x * vector2.x + vector2.y * vector2.y)

        guard mag1 > 0 && mag2 > 0 else { return 0 }

        let cosAngle = dot / (mag1 * mag2)
        let clampedCos = min(max(cosAngle, -1), 1)
        return acos(clampedCos) * 180 / .pi
    }

    // MARK: - Control

    func startDetection(type: ExerciseType, target: Int) {
        isDetecting = true
        currentCount = 0
        targetCount = target
        confidence = 0

        pushupState = .unknown
        lastPushupState = .unknown
        squatState = .unknown
        lastSquatState = .unknown
        isPlankPositionValid = false
        plankDuration = 0
        plankStartTime = nil
    }

    func stopDetection() -> ExerciseResult {
        isDetecting = false

        let result = ExerciseResult(
            isCompleted: currentCount >= targetCount,
            count: currentCount,
            duration: plankDuration,
            confidence: confidence
        )

        // Reset
        currentCount = 0
        plankDuration = 0
        plankStartTime = nil

        return result
    }

    func reset() {
        isDetecting = false
        currentCount = 0
        targetCount = 0
        confidence = 0
        plankDuration = 0
        plankStartTime = nil
    }
}
