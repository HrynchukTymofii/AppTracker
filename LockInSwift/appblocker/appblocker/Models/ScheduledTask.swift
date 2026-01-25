import Foundation
import SwiftData

@Model
final class ScheduledTask {
    @Attribute(.unique) var id: UUID

    // MARK: - Core Fields
    var title: String
    var taskDescription: String?
    var scheduledDate: Date           // The day this task is for
    var startTime: Date               // Start time
    var endTime: Date                 // End time
    var duration: Int                 // Duration in minutes

    // MARK: - Status
    var statusRaw: String             // TaskStatus raw value
    var completedAt: Date?
    var createdAt: Date
    var updatedAt: Date

    // MARK: - Verification Configuration
    var verificationTypeRaw: String   // VerificationType raw value
    var verificationConfigData: Data? // JSON encoded VerificationConfig

    // MARK: - Verification Results
    var verificationStatusRaw: String // VerificationStatus raw value
    var verificationResultData: Data? // JSON encoded result

    // MARK: - Photo Storage (paths to compressed images)
    var beforeImagePath: String?
    var afterImagePath: String?

    // MARK: - Exercise Results (if exercise type)
    var exerciseTypeRaw: String?      // ExerciseType raw value
    var targetReps: Int?
    var actualReps: Int?
    var targetDuration: Int?          // For hold exercises (seconds)
    var actualDuration: Int?
    var formScore: Double?            // 0.0 - 1.0

    // MARK: - Voice Verification (if voice type)
    var voicePrompt: String?          // What user needs to say/translate
    var voiceResponsePath: String?    // Path to recorded audio
    var voiceEvaluationData: Data?    // AI evaluation result

    // MARK: - Step Count Verification (if stepCount type)
    var targetSteps: Int?
    var actualSteps: Int?
    var stepCountStartTime: Date?     // When step counting started
    var stepCountEndTime: Date?       // When step counting ended

    // MARK: - Recurrence
    var isRecurring: Bool
    var recurrencePatternId: UUID?    // Link to RecurrencePattern
    var parentTaskId: UUID?           // If generated from recurring pattern

    // MARK: - AI Parsing Context
    var originalInput: String?        // Raw user input that created this
    var parsingConversationId: UUID?  // Link to AIConversation

    // MARK: - Computed Properties

    var status: ScheduledTaskStatus {
        get { ScheduledTaskStatus(rawValue: statusRaw) ?? .pending }
        set { statusRaw = newValue.rawValue }
    }

    var verificationType: VerificationType {
        get { VerificationType(rawValue: verificationTypeRaw) ?? .check }
        set { verificationTypeRaw = newValue.rawValue }
    }

    var verificationStatus: VerificationStatus {
        get { VerificationStatus(rawValue: verificationStatusRaw) ?? .notStarted }
        set { verificationStatusRaw = newValue.rawValue }
    }

    var exerciseType: ExerciseVerificationType? {
        get {
            guard let raw = exerciseTypeRaw else { return nil }
            return ExerciseVerificationType(rawValue: raw)
        }
        set { exerciseTypeRaw = newValue?.rawValue }
    }

    var verificationConfig: VerificationConfig? {
        get {
            guard let data = verificationConfigData else { return nil }
            return try? JSONDecoder().decode(VerificationConfig.self, from: data)
        }
        set {
            verificationConfigData = try? JSONEncoder().encode(newValue)
        }
    }

    var verificationResult: VerificationResult? {
        get {
            guard let data = verificationResultData else { return nil }
            return try? JSONDecoder().decode(VerificationResult.self, from: data)
        }
        set {
            verificationResultData = try? JSONEncoder().encode(newValue)
        }
    }

    var voiceEvaluation: VoiceEvaluationResult? {
        get {
            guard let data = voiceEvaluationData else { return nil }
            return try? JSONDecoder().decode(VoiceEvaluationResult.self, from: data)
        }
        set {
            voiceEvaluationData = try? JSONEncoder().encode(newValue)
        }
    }

    // MARK: - Convenience Properties

    var isCompleted: Bool {
        status == ScheduledTaskStatus.completed
    }

    var isOverdue: Bool {
        !isCompleted && endTime < Date()
    }

    var formattedTimeRange: String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return "\(formatter.string(from: startTime)) - \(formatter.string(from: endTime))"
    }

    // MARK: - Initializer

    init(
        id: UUID = UUID(),
        title: String,
        taskDescription: String? = nil,
        scheduledDate: Date,
        startTime: Date,
        endTime: Date,
        duration: Int,
        verificationType: VerificationType = .check,
        isRecurring: Bool = false,
        originalInput: String? = nil
    ) {
        self.id = id
        self.title = title
        self.taskDescription = taskDescription
        self.scheduledDate = scheduledDate
        self.startTime = startTime
        self.endTime = endTime
        self.duration = duration
        self.statusRaw = ScheduledTaskStatus.pending.rawValue
        self.verificationTypeRaw = verificationType.rawValue
        self.verificationStatusRaw = VerificationStatus.notStarted.rawValue
        self.isRecurring = isRecurring
        self.originalInput = originalInput
        self.createdAt = Date()
        self.updatedAt = Date()
    }
}

// MARK: - Scheduled Task Status Enum

enum ScheduledTaskStatus: String, Codable, CaseIterable {
    case pending = "pending"
    case inProgress = "in_progress"
    case completed = "completed"
    case skipped = "skipped"
    case failed = "failed"

    var displayName: String {
        switch self {
        case .pending: return "Pending"
        case .inProgress: return "In Progress"
        case .completed: return "Completed"
        case .skipped: return "Skipped"
        case .failed: return "Failed"
        }
    }

    var icon: String {
        switch self {
        case .pending: return "circle"
        case .inProgress: return "circle.dotted"
        case .completed: return "checkmark.circle.fill"
        case .skipped: return "forward.circle"
        case .failed: return "xmark.circle"
        }
    }
}

// MARK: - Verification Type Enum

enum VerificationType: String, Codable, CaseIterable {
    case photoAfter = "photo_after"
    case photoBeforeAfter = "photo_before_after"
    case exercise = "exercise"
    case voice = "voice"
    case stepCount = "step_count"
    case check = "check"

    var displayName: String {
        switch self {
        case .photoAfter: return "Photo Proof"
        case .photoBeforeAfter: return "Before & After"
        case .exercise: return "Exercise"
        case .voice: return "Voice"
        case .stepCount: return "Step Count"
        case .check: return "Check Off"
        }
    }

    var icon: String {
        switch self {
        case .photoAfter: return "camera"
        case .photoBeforeAfter: return "camera.on.rectangle"
        case .exercise: return "figure.run"
        case .voice: return "mic"
        case .stepCount: return "figure.walk"
        case .check: return "checkmark"
        }
    }

    var description: String {
        switch self {
        case .photoAfter: return "Take a photo after completing the task"
        case .photoBeforeAfter: return "Take photos before and after for comparison"
        case .exercise: return "Complete a tracked exercise"
        case .voice: return "Complete a voice/speaking task"
        case .stepCount: return "Walk the required number of steps"
        case .check: return "Simply mark as done"
        }
    }
}

// MARK: - Verification Status Enum

enum VerificationStatus: String, Codable, CaseIterable {
    case notStarted = "not_started"
    case inProgress = "in_progress"
    case verified = "verified"
    case failed = "failed"

    var displayName: String {
        switch self {
        case .notStarted: return "Not Started"
        case .inProgress: return "In Progress"
        case .verified: return "Verified"
        case .failed: return "Failed"
        }
    }
}

// MARK: - Exercise Type for Verification

enum ExerciseVerificationType: String, Codable, CaseIterable {
    case pushups = "pushups"
    case squats = "squats"
    case pullups = "pullups"
    case plank = "plank"
    case jumpingJacks = "jumping_jacks"
    case lunges = "lunges"
    case crunches = "crunches"
    case shoulderPress = "shoulder_press"
    case legRaises = "leg_raises"
    case highKnees = "high_knees"
    case wallSit = "wall_sit"
    case sidePlank = "side_plank"

    var displayName: String {
        switch self {
        case .pushups: return "Push-ups"
        case .squats: return "Squats"
        case .pullups: return "Pull-ups"
        case .plank: return "Plank"
        case .jumpingJacks: return "Jumping Jacks"
        case .lunges: return "Lunges"
        case .crunches: return "Crunches"
        case .shoulderPress: return "Shoulder Press"
        case .legRaises: return "Leg Raises"
        case .highKnees: return "High Knees"
        case .wallSit: return "Wall Sit"
        case .sidePlank: return "Side Plank"
        }
    }

    var isHoldExercise: Bool {
        switch self {
        case .plank, .wallSit, .sidePlank:
            return true
        default:
            return false
        }
    }
}
