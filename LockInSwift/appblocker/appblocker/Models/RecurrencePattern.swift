import Foundation
import SwiftData

@Model
final class RecurrencePattern {
    @Attribute(.unique) var id: UUID

    // MARK: - Recurrence Configuration
    var frequencyRaw: String          // RecurrenceFrequency raw value
    var interval: Int                 // Every X days/weeks
    var weekdays: [Int]               // [0-6] for Sunday-Saturday
    var endDate: Date?                // Optional end date
    var maxOccurrences: Int?          // Optional max count
    var occurrenceCount: Int          // Current count

    var isActive: Bool
    var createdAt: Date

    // MARK: - Template Task Data
    var taskTemplateData: Data        // JSON encoded TaskTemplate

    // MARK: - Computed Properties

    var frequency: RecurrenceFrequency {
        get { RecurrenceFrequency(rawValue: frequencyRaw) ?? .daily }
        set { frequencyRaw = newValue.rawValue }
    }

    var taskTemplate: TaskTemplate? {
        get {
            try? JSONDecoder().decode(TaskTemplate.self, from: taskTemplateData)
        }
        set {
            if let template = newValue {
                taskTemplateData = (try? JSONEncoder().encode(template)) ?? Data()
            }
        }
    }

    // MARK: - Convenience

    var weekdayNames: [String] {
        let formatter = DateFormatter()
        formatter.locale = Locale.current
        let symbols = formatter.shortWeekdaySymbols ?? []
        return weekdays.compactMap { index in
            guard index >= 0 && index < symbols.count else { return nil }
            return symbols[index]
        }
    }

    var shouldGenerateMore: Bool {
        guard isActive else { return false }
        if let maxOccurrences = maxOccurrences, occurrenceCount >= maxOccurrences {
            return false
        }
        if let endDate = endDate, Date() > endDate {
            return false
        }
        return true
    }

    // MARK: - Initializer

    init(
        id: UUID = UUID(),
        frequency: RecurrenceFrequency,
        interval: Int = 1,
        weekdays: [Int] = [],
        endDate: Date? = nil,
        maxOccurrences: Int? = nil,
        template: TaskTemplate
    ) {
        self.id = id
        self.frequencyRaw = frequency.rawValue
        self.interval = interval
        self.weekdays = weekdays
        self.endDate = endDate
        self.maxOccurrences = maxOccurrences
        self.occurrenceCount = 0
        self.isActive = true
        self.createdAt = Date()
        self.taskTemplateData = (try? JSONEncoder().encode(template)) ?? Data()
    }

    // MARK: - Methods

    /// Calculate the next occurrence date from a given date
    func nextOccurrence(after date: Date) -> Date? {
        guard shouldGenerateMore else { return nil }

        let calendar = Calendar.current

        switch frequency {
        case .daily:
            return calendar.date(byAdding: .day, value: interval, to: date)

        case .weekly:
            if weekdays.isEmpty {
                return calendar.date(byAdding: .weekOfYear, value: interval, to: date)
            } else {
                // Find next matching weekday
                var nextDate = date
                for _ in 0..<(7 * interval + 7) {
                    guard let candidate = calendar.date(byAdding: .day, value: 1, to: nextDate) else {
                        return nil
                    }
                    nextDate = candidate
                    let weekday = calendar.component(.weekday, from: nextDate) - 1 // Convert to 0-6
                    if weekdays.contains(weekday) {
                        if let endDate = endDate, nextDate > endDate {
                            return nil
                        }
                        return nextDate
                    }
                }
                return nil
            }

        case .custom:
            // Custom interval in days
            return calendar.date(byAdding: .day, value: interval, to: date)
        }
    }

    /// Generate occurrences from a start date until an end date
    func generateOccurrences(from startDate: Date, until endDate: Date) -> [Date] {
        var occurrences: [Date] = []
        var currentDate = startDate

        while let nextDate = nextOccurrence(after: currentDate), nextDate <= endDate {
            occurrences.append(nextDate)
            currentDate = nextDate

            // Safety limit
            if occurrences.count >= 100 {
                break
            }
        }

        return occurrences
    }
}

// MARK: - Recurrence Frequency Enum

enum RecurrenceFrequency: String, Codable, CaseIterable {
    case daily = "daily"
    case weekly = "weekly"
    case custom = "custom"

    var displayName: String {
        switch self {
        case .daily: return "Daily"
        case .weekly: return "Weekly"
        case .custom: return "Custom"
        }
    }
}

// MARK: - Task Template (for recurring task generation)

struct TaskTemplate: Codable {
    var title: String
    var taskDescription: String?
    var timeOfDay: TimeOfDay          // Store time relative to day
    var duration: Int                 // minutes
    var verificationType: VerificationType

    // Optional configs
    var exerciseConfig: ExerciseConfig?
    var voiceConfig: VoiceConfig?
    var stepCountConfig: StepCountConfig?

    struct TimeOfDay: Codable {
        var hour: Int
        var minute: Int

        func date(on day: Date) -> Date {
            let calendar = Calendar.current
            return calendar.date(bySettingHour: hour, minute: minute, second: 0, of: day) ?? day
        }
    }
}
