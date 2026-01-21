import Foundation
import SwiftData

enum ExerciseType: String, Codable, CaseIterable {
    case pushups
    case squats
    case plank
    case photoVerification
    case custom

    var displayName: String {
        switch self {
        case .pushups: return "Pushups"
        case .squats: return "Squats"
        case .plank: return "Plank"
        case .photoVerification: return "Photo Task"
        case .custom: return "Custom"
        }
    }

    var icon: String {
        switch self {
        case .pushups: return "figure.strengthtraining.traditional"
        case .squats: return "figure.squats"
        case .plank: return "figure.core.training"
        case .photoVerification: return "camera.fill"
        case .custom: return "star.fill"
        }
    }

    var unit: String {
        switch self {
        case .pushups, .squats: return "reps"
        case .plank: return "seconds"
        case .photoVerification, .custom: return ""
        }
    }

    var defaultTarget: Int {
        switch self {
        case .pushups: return 20
        case .squats: return 30
        case .plank: return 60
        case .photoVerification: return 1
        case .custom: return 1
        }
    }

    var defaultReward: Int {
        switch self {
        case .pushups: return 5
        case .squats: return 7
        case .plank: return 10
        case .photoVerification: return 15
        case .custom: return 5
        }
    }
}

enum TaskStatus: String, Codable {
    case pending
    case inProgress
    case completed
    case failed
    case expired
}

@Model
final class ExerciseTask {
    @Attribute(.unique) var id: UUID
    var typeRaw: String  // ExerciseType raw value
    var target: Int      // Reps or seconds
    var reward: Int      // Minutes earned
    var statusRaw: String // TaskStatus raw value
    var title: String?
    var taskDescription: String?
    var createdAt: Date
    var completedAt: Date?
    var progress: Int    // Current progress toward target

    // For photo verification
    var beforeImageData: Data?
    var afterImageData: Data?
    var verificationResult: String?

    var type: ExerciseType {
        get { ExerciseType(rawValue: typeRaw) ?? .custom }
        set { typeRaw = newValue.rawValue }
    }

    var status: TaskStatus {
        get { TaskStatus(rawValue: statusRaw) ?? .pending }
        set { statusRaw = newValue.rawValue }
    }

    init(
        id: UUID = UUID(),
        type: ExerciseType,
        target: Int? = nil,
        reward: Int? = nil,
        title: String? = nil,
        description: String? = nil
    ) {
        self.id = id
        self.typeRaw = type.rawValue
        self.target = target ?? type.defaultTarget
        self.reward = reward ?? type.defaultReward
        self.statusRaw = TaskStatus.pending.rawValue
        self.title = title
        self.taskDescription = description
        self.createdAt = Date()
        self.progress = 0
    }

    var isComplete: Bool {
        status == .completed
    }

    var progressPercentage: Double {
        guard target > 0 else { return 0 }
        return min(Double(progress) / Double(target), 1.0)
    }

    var displayTitle: String {
        title ?? "\(target) \(type.displayName)"
    }
}
