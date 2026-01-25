import Foundation
import SwiftData
import SwiftUI

enum TimeSource: Codable {
    case photoTask(taskId: String)
    case pushups(reps: Int)
    case plank(seconds: Int)
    case squats(reps: Int)
    case customExercise(name: String, value: Int)
    case schedule(scheduleId: String)
    case appUsage(appId: String)  // Spending time
    case bonus(reason: String)
    case focusSession(minutes: Int)  // Focus mode Pomodoro

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
        case .focusSession(let minutes): return "\(minutes)m Focus"
        }
    }

    var icon: String {
        switch self {
        case .photoTask: return "camera.fill"
        case .pushups: return "figure.strengthtraining.traditional"
        case .plank: return "figure.core.training"
        case .squats: return "figure.strengthtraining.traditional"
        case .customExercise: return "figure.mixed.cardio"
        case .schedule: return "calendar"
        case .appUsage: return "app.fill"
        case .bonus: return "gift.fill"
        case .focusSession: return "brain.head.profile"
        }
    }

    var color: Color {
        switch self {
        case .photoTask: return Color(hex: "3b82f6")     // Blue
        case .pushups: return Color(hex: "ef4444")       // Red
        case .plank: return Color(hex: "10b981")         // Green
        case .squats: return Color(hex: "8b5cf6")        // Purple
        case .customExercise: return Color(hex: "f59e0b") // Amber
        case .schedule: return Color(hex: "06b6d4")      // Cyan
        case .appUsage: return Color(hex: "6b7280")      // Gray
        case .bonus: return Color(hex: "ec4899")         // Pink
        case .focusSession: return Color(hex: "6366f1")  // Indigo
        }
    }
}

@Model
final class TimeTransaction {
    @Attribute(.unique) var id: UUID
    var amount: Double  // Minutes (positive = earned, negative = spent)
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

    init(id: UUID = UUID(), amount: Double, source: TimeSource, note: String? = nil, timestamp: Date = Date()) {
        self.id = id
        self.amount = amount
        self.sourceData = (try? JSONEncoder().encode(source)) ?? Data()
        self.timestamp = timestamp
        self.note = note
    }

    var isEarned: Bool { amount > 0 }
    var isSpent: Bool { amount < 0 }

    /// Formatted amount for display (e.g., "+2.5" or "-1.0")
    var formattedAmount: String {
        let prefix = amount >= 0 ? "+" : ""
        if amount == floor(amount) {
            return "\(prefix)\(Int(amount))"
        } else {
            return String(format: "%@%.1f", prefix, amount)
        }
    }
}
