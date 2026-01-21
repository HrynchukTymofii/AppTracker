import Foundation
import SwiftData
import SwiftUI

/// Reward configuration for per-rep/second calculation with tiered rates
struct RewardConfig {
    let baseRate: Double         // Base minutes per rep or second
    let bonusRate: Double        // Bonus rate after threshold
    let minimum: Int             // Minimum reps/seconds required
    let bonusThreshold: Int      // Threshold for bonus rate (tiered)
}

enum ExerciseType: String, Codable, CaseIterable {
    // Original exercises
    case pushups
    case squats
    case plank
    // New rep-based exercises
    case jumpingJacks = "jumping-jacks"
    case lunges
    case crunches
    case shoulderPress = "shoulder-press"
    case legRaises = "leg-raises"
    case highKnees = "high-knees"
    case pullUps = "pull-ups"
    // New hold-based exercises
    case wallSit = "wall-sit"
    case sidePlank = "side-plank"
    // Special types
    case photoVerification
    case custom

    /// Whether this is an exercise that can be favorited (excludes photo/custom)
    var isFavoritable: Bool {
        switch self {
        case .photoVerification, .custom: return false
        default: return true
        }
    }

    /// Whether this is a hold-based exercise (time) vs rep-based
    var isHoldBased: Bool {
        switch self {
        case .plank, .wallSit, .sidePlank: return true
        default: return false
        }
    }

    var displayName: String {
        switch self {
        case .pushups: return "exercise.pushups".localized
        case .squats: return "exercise.squats".localized
        case .plank: return "exercise.plank".localized
        case .jumpingJacks: return "exercise.jumping_jacks".localized
        case .lunges: return "exercise.lunges".localized
        case .crunches: return "exercise.crunches".localized
        case .shoulderPress: return "exercise.shoulder_press".localized
        case .legRaises: return "exercise.leg_raises".localized
        case .highKnees: return "exercise.high_knees".localized
        case .pullUps: return "exercise.pull_ups".localized
        case .wallSit: return "exercise.wall_sit".localized
        case .sidePlank: return "exercise.side_plank".localized
        case .photoVerification: return "exercise.photo_task".localized
        case .custom: return "exercise.custom".localized
        }
    }

    var icon: String {
        switch self {
        case .pushups: return "figure.strengthtraining.traditional"
        case .squats: return "figure.stand"
        case .plank: return "figure.core.training"
        case .jumpingJacks: return "figure.jumprope"
        case .lunges: return "figure.walk"
        case .crunches: return "figure.core.training"
        case .shoulderPress: return "figure.arms.open"
        case .legRaises: return "figure.flexibility"
        case .highKnees: return "figure.run"
        case .pullUps: return "figure.strengthtraining.functional"
        case .wallSit: return "figure.seated.side"
        case .sidePlank: return "figure.pilates"
        case .photoVerification: return "camera.fill"
        case .custom: return "star.fill"
        }
    }

    var emoji: String {
        switch self {
        case .pushups: return "💪"
        case .squats: return "🏋️"
        case .plank: return "🧘"
        case .jumpingJacks: return "⭐"
        case .lunges: return "🦵"
        case .crunches: return "🔥"
        case .shoulderPress: return "🙆"
        case .legRaises: return "🦿"
        case .highKnees: return "🏃"
        case .pullUps: return "💪"
        case .wallSit: return "🧱"
        case .sidePlank: return "🔷"
        case .photoVerification: return "📷"
        case .custom: return "⭐"
        }
    }

    /// Asset catalog image name for this exercise
    var imageName: String? {
        switch self {
        case .pushups: return "pushups"
        case .squats: return "squats"
        case .plank: return "plank"
        case .jumpingJacks: return "jumping-jacks"
        case .lunges: return "lunges"
        case .crunches: return "crunches"
        case .shoulderPress: return "shoulder-press"
        case .legRaises: return "leg-raises"
        case .highKnees: return "high-knees"
        case .pullUps: return "pull-ups"
        case .wallSit: return "wall-sit"
        case .sidePlank: return "side-plank"
        case .photoVerification, .custom: return nil
        }
    }

    var unit: String {
        switch self {
        case .plank, .wallSit, .sidePlank: return "exercise.seconds_unit".localized
        case .photoVerification, .custom: return ""
        default: return "exercise.reps".localized
        }
    }

    /// Gradient colors for this exercise type
    var gradientColors: [Color] {
        switch self {
        case .pushups: return [Color(hex: "ef4444"), Color(hex: "dc2626")]      // Red
        case .squats: return [Color(hex: "8b5cf6"), Color(hex: "7c3aed")]       // Purple
        case .plank: return [Color(hex: "10b981"), Color(hex: "059669")]        // Green
        case .jumpingJacks: return [Color(hex: "f59e0b"), Color(hex: "d97706")] // Amber
        case .lunges: return [Color(hex: "06b6d4"), Color(hex: "0891b2")]       // Cyan
        case .crunches: return [Color(hex: "ec4899"), Color(hex: "db2777")]     // Pink
        case .shoulderPress: return [Color(hex: "6366f1"), Color(hex: "4f46e5")] // Indigo
        case .legRaises: return [Color(hex: "14b8a6"), Color(hex: "0d9488")]    // Teal
        case .highKnees: return [Color(hex: "f97316"), Color(hex: "ea580c")]    // Orange
        case .pullUps: return [Color(hex: "a855f7"), Color(hex: "9333ea")]      // Violet
        case .wallSit: return [Color(hex: "22c55e"), Color(hex: "16a34a")]      // Emerald
        case .sidePlank: return [Color(hex: "0ea5e9"), Color(hex: "0284c7")]    // Sky
        case .photoVerification: return [Color(hex: "3b82f6"), Color(hex: "2563eb")] // Blue
        case .custom: return [Color(hex: "6b7280"), Color(hex: "4b5563")]       // Gray
        }
    }

    /// Reward configuration for this exercise type with tiered rates
    var rewardConfig: RewardConfig {
        switch self {
        case .pushups:
            // Base: 0.5 min/rep, After 20 reps: 0.6 min/rep
            return RewardConfig(baseRate: 0.5, bonusRate: 0.6, minimum: 3, bonusThreshold: 20)
        case .squats:
            // Base: 0.5 min/rep, After 20 reps: 0.6 min/rep
            return RewardConfig(baseRate: 0.5, bonusRate: 0.6, minimum: 3, bonusThreshold: 20)
        case .plank:
            // Base: 0.1 min/sec, After 20 sec: 0.15 min/sec
            return RewardConfig(baseRate: 0.1, bonusRate: 0.15, minimum: 10, bonusThreshold: 20)
        case .jumpingJacks:
            // Base: 0.3 min/rep, Min 5 reps
            return RewardConfig(baseRate: 0.3, bonusRate: 0.35, minimum: 5, bonusThreshold: 30)
        case .lunges:
            // Base: 0.5 min/rep, Min 3 reps
            return RewardConfig(baseRate: 0.5, bonusRate: 0.6, minimum: 3, bonusThreshold: 20)
        case .crunches:
            // Base: 0.4 min/rep, Min 5 reps
            return RewardConfig(baseRate: 0.4, bonusRate: 0.5, minimum: 5, bonusThreshold: 25)
        case .shoulderPress:
            // Base: 0.5 min/rep, Min 3 reps
            return RewardConfig(baseRate: 0.5, bonusRate: 0.6, minimum: 3, bonusThreshold: 20)
        case .legRaises:
            // Base: 0.4 min/rep, Min 5 reps
            return RewardConfig(baseRate: 0.4, bonusRate: 0.5, minimum: 5, bonusThreshold: 25)
        case .highKnees:
            // Base: 0.2 min/rep, Min 10 reps
            return RewardConfig(baseRate: 0.2, bonusRate: 0.25, minimum: 10, bonusThreshold: 40)
        case .pullUps:
            // Base: 0.8 min/rep, Min 2 reps (hardest exercise)
            return RewardConfig(baseRate: 0.8, bonusRate: 1.0, minimum: 2, bonusThreshold: 10)
        case .wallSit:
            // Base: 0.15 min/sec, Min 10s
            return RewardConfig(baseRate: 0.15, bonusRate: 0.2, minimum: 10, bonusThreshold: 30)
        case .sidePlank:
            // Base: 0.12 min/sec, Min 10s
            return RewardConfig(baseRate: 0.12, bonusRate: 0.15, minimum: 10, bonusThreshold: 25)
        case .photoVerification:
            return RewardConfig(baseRate: 15.0, bonusRate: 15.0, minimum: 1, bonusThreshold: 1)
        case .custom:
            return RewardConfig(baseRate: 1.0, bonusRate: 1.2, minimum: 1, bonusThreshold: 10)
        }
    }

    /// Calculate reward for given count using tiered rate system
    func calculateReward(count: Int) -> Double {
        let config = rewardConfig

        // Must meet minimum
        guard count >= config.minimum else { return 0 }

        var minutes: Double = 0

        if count <= config.bonusThreshold {
            // All reps/seconds at base rate
            minutes = Double(count) * config.baseRate
        } else {
            // First threshold reps at base rate, remaining at bonus rate
            let baseMinutes = Double(config.bonusThreshold) * config.baseRate
            let bonusMinutes = Double(count - config.bonusThreshold) * config.bonusRate
            minutes = baseMinutes + bonusMinutes
        }

        // Round to 1 decimal
        return (minutes * 10).rounded() / 10
    }

    /// Description of the reward rate
    var rewardDescription: String {
        let config = rewardConfig
        switch self {
        case .plank, .wallSit, .sidePlank:
            return String(format: "exercise.reward_per_sec".localized, config.baseRate, config.minimum, config.bonusRate, config.bonusThreshold)
        case .photoVerification:
            return "exercise.verify_task".localized
        case .custom:
            return String(format: "exercise.reward_per_unit".localized, config.baseRate)
        default:
            // All rep-based exercises
            return String(format: "exercise.reward_per_rep".localized, config.baseRate, config.minimum, config.bonusRate, config.bonusThreshold)
        }
    }

    var defaultTarget: Int {
        switch self {
        case .pushups: return 10
        case .squats: return 10
        case .plank: return 30
        case .jumpingJacks: return 20
        case .lunges: return 10
        case .crunches: return 15
        case .shoulderPress: return 10
        case .legRaises: return 12
        case .highKnees: return 30
        case .pullUps: return 5
        case .wallSit: return 30
        case .sidePlank: return 20
        case .photoVerification: return 1
        case .custom: return 1
        }
    }

    var defaultReward: Int {
        Int(calculateReward(count: defaultTarget))
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
    var reward: Int      // Minutes earned (rounded)
    var actualReward: Double  // Precise minutes earned (for per-rep calculation)
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
        self.actualReward = Double(reward ?? type.defaultReward)
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
