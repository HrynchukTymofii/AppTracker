import Foundation
import SwiftData

@Model
final class UsageRecord {
    @Attribute(.unique) var id: UUID
    var appId: String
    var appName: String
    var date: Date
    var durationMinutes: Int
    var category: String?

    init(
        id: UUID = UUID(),
        appId: String,
        appName: String,
        date: Date = Date(),
        durationMinutes: Int,
        category: String? = nil
    ) {
        self.id = id
        self.appId = appId
        self.appName = appName
        self.date = date
        self.durationMinutes = durationMinutes
        self.category = category
    }
}

@Model
final class Achievement {
    @Attribute(.unique) var id: String
    var name: String
    var achievementDescription: String
    var icon: String
    var unlockedAt: Date?
    var progress: Int
    var target: Int

    init(
        id: String,
        name: String,
        description: String,
        icon: String,
        target: Int = 1
    ) {
        self.id = id
        self.name = name
        self.achievementDescription = description
        self.icon = icon
        self.target = target
        self.progress = 0
    }

    var isUnlocked: Bool {
        unlockedAt != nil
    }

    var progressPercentage: Double {
        guard target > 0 else { return 0 }
        return min(Double(progress) / Double(target), 1.0)
    }
}

// MARK: - User Model

struct User: Codable, Identifiable {
    let id: String
    var email: String
    var displayName: String?
    var avatarURL: String?
    var isPro: Bool
    var createdAt: Date

    init(id: String, email: String, displayName: String? = nil, isPro: Bool = false) {
        self.id = id
        self.email = email
        self.displayName = displayName
        self.isPro = isPro
        self.createdAt = Date()
    }
}
