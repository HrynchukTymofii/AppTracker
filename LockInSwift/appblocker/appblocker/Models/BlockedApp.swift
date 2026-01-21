import Foundation
import SwiftData
import FamilyControls

@Model
final class BlockedApp {
    @Attribute(.unique) var id: String  // Bundle ID or token identifier
    var name: String
    var iconData: Data?
    var blockedAt: Date
    var isActive: Bool

    // For Family Controls token storage
    var tokenData: Data?

    init(id: String, name: String, iconData: Data? = nil, blockedAt: Date = Date(), isActive: Bool = true) {
        self.id = id
        self.name = name
        self.iconData = iconData
        self.blockedAt = blockedAt
        self.isActive = isActive
    }
}

@Model
final class UnblockSchedule {
    @Attribute(.unique) var id: UUID
    var name: String
    var appIds: [String]  // References to BlockedApp IDs (legacy)
    var appTokens: [Data] // FamilyControls app tokens
    var startTime: Date
    var endTime: Date
    var weekdays: [Int]   // 1-7 for Sunday-Saturday
    var isActive: Bool
    var createdAt: Date

    init(
        id: UUID = UUID(),
        name: String,
        appIds: [String] = [],
        appTokens: [Data] = [],
        startTime: Date,
        endTime: Date,
        weekdays: [Int],
        isActive: Bool = true
    ) {
        self.id = id
        self.name = name
        self.appIds = appIds
        self.appTokens = appTokens
        self.startTime = startTime
        self.endTime = endTime
        self.weekdays = weekdays
        self.isActive = isActive
        self.createdAt = Date()
    }

    var isCurrentlyActive: Bool {
        guard isActive else { return false }

        let now = Date()
        let calendar = Calendar.current
        let currentWeekday = calendar.component(.weekday, from: now)

        guard weekdays.contains(currentWeekday) else { return false }

        let currentTime = calendar.dateComponents([.hour, .minute], from: now)
        let startComponents = calendar.dateComponents([.hour, .minute], from: startTime)
        let endComponents = calendar.dateComponents([.hour, .minute], from: endTime)

        guard let currentMinutes = currentTime.hour.map({ $0 * 60 + (currentTime.minute ?? 0) }),
              let startMinutes = startComponents.hour.map({ $0 * 60 + (startComponents.minute ?? 0) }),
              let endMinutes = endComponents.hour.map({ $0 * 60 + (endComponents.minute ?? 0) }) else {
            return false
        }

        return currentMinutes >= startMinutes && currentMinutes < endMinutes
    }

    /// Formatted time range string
    var timeRangeString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        return "\(formatter.string(from: startTime)) - \(formatter.string(from: endTime))"
    }

    /// Formatted weekdays string
    var weekdaysString: String {
        let dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        let activeDays = weekdays.sorted().compactMap { day -> String? in
            guard day >= 1 && day <= 7 else { return nil }
            return dayNames[day - 1]
        }
        return activeDays.joined(separator: ", ")
    }
}
