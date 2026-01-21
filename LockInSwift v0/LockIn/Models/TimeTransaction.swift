import Foundation
import SwiftData

enum TimeSource: Codable {
    case photoTask(taskId: String)
    case pushups(reps: Int)
    case plank(seconds: Int)
    case squats(reps: Int)
    case customExercise(name: String, value: Int)
    case schedule(scheduleId: String)
    case appUsage(appId: String)  // Spending time
    case bonus(reason: String)

    var displayName: String {
        switch self {
        case .photoTask: return "Photo Task"
        case .pushups(let reps): return "\(reps) Pushups"
        case .plank(let seconds): return "\(seconds)s Plank"
        case .squats(let reps): return "\(reps) Squats"
        case .customExercise(let name, _): return name
        case .schedule: return "Scheduled Free Time"
        case .appUsage(let appId): return "Used \(appId)"
        case .bonus(let reason): return reason
        }
    }

    var icon: String {
        switch self {
        case .photoTask: return "camera.fill"
        case .pushups: return "figure.strengthtraining.traditional"
        case .plank: return "figure.core.training"
        case .squats: return "figure.squats"
        case .customExercise: return "figure.mixed.cardio"
        case .schedule: return "calendar"
        case .appUsage: return "app.fill"
        case .bonus: return "gift.fill"
        }
    }
}

@Model
final class TimeTransaction {
    @Attribute(.unique) var id: UUID
    var amount: Int  // Minutes (positive = earned, negative = spent)
    var sourceData: Data  // Encoded TimeSource
    var timestamp: Date
    var note: String?

    var source: TimeSource {
        get {
            (try? JSONDecoder().decode(TimeSource.self, from: sourceData)) ?? .bonus(reason: "Unknown")
        }
        set {
            sourceData = (try? JSONEncoder().encode(newValue)) ?? Data()
        }
    }

    init(id: UUID = UUID(), amount: Int, source: TimeSource, note: String? = nil) {
        self.id = id
        self.amount = amount
        self.sourceData = (try? JSONEncoder().encode(source)) ?? Data()
        self.timestamp = Date()
        self.note = note
    }

    var isEarned: Bool { amount > 0 }
    var isSpent: Bool { amount < 0 }
}
