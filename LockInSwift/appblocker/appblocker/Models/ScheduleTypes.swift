import Foundation

// MARK: - Task Parse Result (from AI)

struct TaskParseResult: Codable {
    let title: String
    let description: String?
    let scheduledTime: String?        // ISO 8601
    let endTime: String?              // ISO 8601
    let duration: Int?                // minutes
    let verificationType: VerificationType
    let verificationConfig: VerificationConfig?
    let exerciseConfig: ExerciseConfig?
    let voiceConfig: VoiceConfig?
    let stepCountConfig: StepCountConfig?
    let hasConflict: Bool?
    let conflictDetails: String?

    // Convert parsed times to Dates (treating as local timezone)
    func scheduledDate(fallback: Date) -> Date {
        guard let timeString = scheduledTime else { return fallback }
        return Self.parseDateTime(timeString) ?? fallback
    }

    func endDate(fallback: Date) -> Date {
        guard let timeString = endTime else {
            // Calculate from duration if available
            let startDate = scheduledDate(fallback: fallback)
            let durationMinutes = duration ?? 30
            return Calendar.current.date(byAdding: .minute, value: durationMinutes, to: startDate) ?? fallback
        }
        return Self.parseDateTime(timeString) ?? fallback
    }

    /// Parse ISO 8601 datetime string, ALWAYS treating the time value as LOCAL time
    /// Even if the AI returns "2024-01-22T06:00:00Z", we interpret 06:00 as local 6am
    private static func parseDateTime(_ timeString: String) -> Date? {
        // Strip timezone indicators (Z, +00:00, etc.) and parse as local time
        // This is because when user says "6am", they mean local 6am, not UTC 6am
        var cleanedString = timeString
            .replacingOccurrences(of: "Z", with: "")
            .replacingOccurrences(of: "+00:00", with: "")

        // Also remove any timezone offset like +02:00, -05:00
        if let range = cleanedString.range(of: #"[+-]\d{2}:\d{2}$"#, options: .regularExpression) {
            cleanedString.removeSubrange(range)
        }

        let localFormatter = DateFormatter()
        localFormatter.timeZone = TimeZone.current

        // Try common ISO 8601 formats (without timezone)
        let formats = [
            "yyyy-MM-dd'T'HH:mm:ss.SSS",
            "yyyy-MM-dd'T'HH:mm:ss",
            "yyyy-MM-dd'T'HH:mm",
            "yyyy-MM-dd HH:mm:ss",
            "yyyy-MM-dd HH:mm"
        ]

        for format in formats {
            localFormatter.dateFormat = format
            if let date = localFormatter.date(from: cleanedString) {
                return date
            }
        }

        return nil
    }
}

// MARK: - Verification Config

struct VerificationConfig: Codable {
    var photoMode: PhotoMode?
    var requiresProof: Bool

    enum PhotoMode: String, Codable {
        case afterOnly = "after_only"
        case beforeAfter = "before_after"
    }
}

// MARK: - Exercise Config

struct ExerciseConfig: Codable {
    var exerciseType: String          // ExerciseVerificationType raw value
    var targetReps: Int?
    var targetDuration: Int?          // seconds for hold exercises
    var difficulty: ExerciseDifficulty?

    enum ExerciseDifficulty: String, Codable {
        case easy = "easy"
        case medium = "medium"
        case hard = "hard"
    }

    var exerciseVerificationType: ExerciseVerificationType? {
        ExerciseVerificationType(rawValue: exerciseType)
    }
}

// MARK: - Voice Config

struct VoiceConfig: Codable {
    var prompt: String                // What to say or translate
    var language: String?             // Target language code (e.g., "es", "fr")
    var evaluationCriteria: String?   // How AI should evaluate
    var isTranslation: Bool?          // Whether this is a translation task
}

// MARK: - Step Count Config

struct StepCountConfig: Codable {
    var targetSteps: Int
    var minDuration: Int?             // Minimum minutes to complete
    var maxDuration: Int?             // Maximum minutes allowed
}

// MARK: - Schedule Context (for AI parsing)

struct ScheduleContext: Codable {
    let date: Date
    let existingTasks: [TaskSummary]
    let userTimezone: String

    init(date: Date, existingTasks: [TaskSummary]) {
        self.date = date
        self.existingTasks = existingTasks
        self.userTimezone = TimeZone.current.identifier
    }
}

struct TaskSummary: Codable {
    let id: String
    let title: String
    let startTime: String             // ISO 8601
    let endTime: String               // ISO 8601
    let status: String

    init(from task: ScheduledTask) {
        let formatter = ISO8601DateFormatter()
        self.id = task.id.uuidString
        self.title = task.title
        self.startTime = formatter.string(from: task.startTime)
        self.endTime = formatter.string(from: task.endTime)
        self.status = task.statusRaw
    }
}

// MARK: - Conflict Resolution

struct ConflictResolution: Codable {
    let hasConflict: Bool
    let conflictingTaskIds: [String]
    let suggestedResolutions: [String]
    var userChoice: String?
}

// MARK: - Task Parsing Response

struct TaskParsingResponse: Codable {
    let tasks: [TaskParseResult]
    let hasConflicts: Bool
    let conflictDetails: String?
    let suggestedResolutions: [String]?
    let requiresUserInput: Bool
    let promptForUser: String?
}

// MARK: - Verification Result

struct VerificationResult: Codable {
    var success: Bool
    var confidence: Double            // 0.0 - 1.0
    var feedback: String
    var timestamp: Date

    // Type-specific details
    var photoAnalysis: PhotoAnalysisResult?
    var exerciseResult: ExerciseVerificationResult?
    var voiceResult: VoiceVerificationResult?
    var stepCountResult: StepCountVerificationResult?
}

struct PhotoAnalysisResult: Codable {
    var isTaskCompleted: Bool
    var completionConfidence: Double  // 0.0 - 1.0
    var analysis: String              // AI description of what it sees
    var beforeAfterComparison: String? // For before/after tasks
    var suggestionsForImprovement: String?
}

struct ExerciseVerificationResult: Codable {
    var exerciseType: String
    var targetReps: Int?
    var actualReps: Int?
    var targetDuration: Int?          // seconds
    var actualDuration: Int?
    var formScore: Double?            // 0.0 - 1.0
    var formFeedback: String?
    var isCompleted: Bool
}

struct VoiceVerificationResult: Codable {
    var transcription: String
    var isCorrect: Bool
    var pronunciationScore: Double?   // 0.0 - 1.0
    var languageAccuracyScore: Double? // 0.0 - 1.0
    var feedback: String
    var expectedResponse: String?     // For translation tasks
}

struct StepCountVerificationResult: Codable {
    var targetSteps: Int
    var actualSteps: Int
    var isCompleted: Bool
    var distance: Double?             // meters
    var averagePace: Double?          // steps per minute
    var feedback: String
}

// MARK: - Voice Evaluation Result (for task model)

struct VoiceEvaluationResult: Codable {
    var transcription: String
    var isCorrect: Bool
    var score: Double                 // 0.0 - 1.0
    var feedback: String
    var timestamp: Date
}

// MARK: - Verification Session

struct VerificationSession: Codable, Identifiable {
    var id: UUID
    var taskId: UUID
    var verificationType: VerificationType
    var startedAt: Date
    var status: VerificationSessionStatus

    // Type-specific state
    var photoState: PhotoVerificationState?
    var exerciseState: ExerciseVerificationState?
    var voiceState: VoiceVerificationState?
    var stepCountState: StepCountVerificationState?
}

enum VerificationSessionStatus: String, Codable {
    case ready = "ready"
    case inProgress = "in_progress"
    case awaitingSubmission = "awaiting_submission"
    case evaluating = "evaluating"
    case completed = "completed"
    case failed = "failed"
}

struct PhotoVerificationState: Codable {
    var needsBeforePhoto: Bool
    var beforePhotoTaken: Bool
    var afterPhotoTaken: Bool
    var beforePhotoPath: String?
    var afterPhotoPath: String?
}

struct ExerciseVerificationState: Codable {
    var exerciseType: String
    var targetReps: Int?
    var targetDuration: Int?
    var currentReps: Int
    var currentDuration: Int
    var isTracking: Bool
}

struct VoiceVerificationState: Codable {
    var prompt: String
    var isRecording: Bool
    var audioPath: String?
    var transcription: String?
}

struct StepCountVerificationState: Codable {
    var targetSteps: Int
    var currentSteps: Int
    var startedAt: Date?
    var isTracking: Bool
}

// MARK: - Verification Submission

struct VerificationSubmission: Codable {
    var taskId: UUID
    var verificationType: VerificationType
    var timestamp: Date

    // Photo submission
    var photoPath: String?
    var beforePhotoPath: String?
    var afterPhotoPath: String?

    // Exercise submission
    var exerciseData: ExerciseSubmissionData?

    // Voice submission
    var voiceData: VoiceSubmissionData?

    // Step count submission
    var stepCountData: StepCountSubmissionData?
}

struct ExerciseSubmissionData: Codable {
    var exerciseType: String
    var repsCompleted: Int?
    var durationCompleted: Int?       // seconds
    var formScore: Double?
}

struct VoiceSubmissionData: Codable {
    var audioPath: String?
    var transcription: String?
}

struct StepCountSubmissionData: Codable {
    var stepsCompleted: Int
    var startTime: Date
    var endTime: Date
    var distance: Double?
}
