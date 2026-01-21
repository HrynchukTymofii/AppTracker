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
    var appIds: [String]  // References to BlockedApp IDs
    var startTime: Date
    var endTime: Date
    var weekdays: [Int]   // 1-7 for Monday-Sunday
    var isActive: Bool
    var createdAt: Date

    init(
        id: UUID = UUID(),
        name: String,
        appIds: [String],
        startTime: Date,
        endTime: Date,
        weekdays: [Int],
        isActive: Bool = true
    ) {
        self.id = id
        self.name = name
        self.appIds = appIds
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
}
