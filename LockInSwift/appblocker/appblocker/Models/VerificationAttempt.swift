import Foundation
import SwiftData

@Model
final class VerificationAttempt {
    @Attribute(.unique) var id: UUID

    // MARK: - Properties
    var taskId: UUID
    var attemptNumber: Int
    var timestamp: Date

    var verificationTypeRaw: String   // VerificationType raw value
    var inputData: Data?              // What was submitted (image ref, audio, etc.)
    var resultData: Data?             // AI/ML evaluation result

    var isSuccessful: Bool
    var confidence: Double?           // 0.0 - 1.0
    var feedback: String?             // Human-readable feedback

    // MARK: - Computed Properties

    var verificationType: VerificationType {
        get { VerificationType(rawValue: verificationTypeRaw) ?? .check }
        set { verificationTypeRaw = newValue.rawValue }
    }

    var verificationInput: VerificationInput? {
        get {
            guard let data = inputData else { return nil }
            return try? JSONDecoder().decode(VerificationInput.self, from: data)
        }
        set {
            inputData = try? JSONEncoder().encode(newValue)
        }
    }

    var verificationResult: AttemptResult? {
        get {
            guard let data = resultData else { return nil }
            return try? JSONDecoder().decode(AttemptResult.self, from: data)
        }
        set {
            resultData = try? JSONEncoder().encode(newValue)
        }
    }

    // MARK: - Initializer

    init(
        id: UUID = UUID(),
        taskId: UUID,
        attemptNumber: Int,
        verificationType: VerificationType,
        isSuccessful: Bool = false,
        confidence: Double? = nil,
        feedback: String? = nil
    ) {
        self.id = id
        self.taskId = taskId
        self.attemptNumber = attemptNumber
        self.verificationTypeRaw = verificationType.rawValue
        self.isSuccessful = isSuccessful
        self.confidence = confidence
        self.feedback = feedback
        self.timestamp = Date()
    }
}

// MARK: - Verification Input

struct VerificationInput: Codable {
    var type: String                  // "photo", "audio", "exercise", "steps"
    var photoPath: String?            // Path to photo file
    var beforePhotoPath: String?      // For before/after comparison
    var afterPhotoPath: String?
    var audioPath: String?            // Path to audio file
    var exerciseData: ExerciseInputData?
    var stepCountData: StepCountInputData?
}

struct ExerciseInputData: Codable {
    var exerciseType: String
    var targetReps: Int?
    var targetDuration: Int?          // seconds
    var actualReps: Int?
    var actualDuration: Int?
    var formScore: Double?            // 0.0 - 1.0
}

struct StepCountInputData: Codable {
    var targetSteps: Int
    var actualSteps: Int
    var startTime: Date
    var endTime: Date
    var distance: Double?             // meters
}

// MARK: - Attempt Result

struct AttemptResult: Codable {
    var success: Bool
    var confidence: Double            // 0.0 - 1.0
    var feedback: String
    var details: ResultDetails?
}

struct ResultDetails: Codable {
    // Photo verification
    var photoAnalysis: String?
    var beforeAfterComparison: String?

    // Exercise verification
    var repsCounted: Int?
    var durationMeasured: Int?        // seconds
    var formAnalysis: String?

    // Voice verification
    var transcription: String?
    var languageAccuracy: Double?     // 0.0 - 1.0
    var pronunciationScore: Double?   // 0.0 - 1.0

    // Step count verification
    var stepsRecorded: Int?
    var distanceCovered: Double?      // meters
}
