import Foundation
import FamilyControls
import ManagedSettings

/// Per-app daily limit configuration
struct AppLimit: Codable, Identifiable {
    let id: UUID
    let appTokenData: Data       // Encoded ApplicationToken
    var appName: String          // Display name
    var dailyLimitMinutes: Int   // User-adjustable (default 30)
    var usedTodayMinutes: Double
    var lastResetDate: Date
    var isLimitEnforced: Bool    // Tracks if limit has been enforced (shielded) today

    init(
        id: UUID = UUID(),
        appTokenData: Data,
        appName: String,
        dailyLimitMinutes: Int = AppLimit.defaultLimit
    ) {
        self.id = id
        self.appTokenData = appTokenData
        self.appName = appName
        self.dailyLimitMinutes = dailyLimitMinutes
        self.usedTodayMinutes = 0
        self.lastResetDate = Calendar.current.startOfDay(for: Date())
        self.isLimitEnforced = false
    }

    // Custom decoder for backwards compatibility (old data won't have isLimitEnforced)
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(UUID.self, forKey: .id)
        appTokenData = try container.decode(Data.self, forKey: .appTokenData)
        appName = try container.decode(String.self, forKey: .appName)
        dailyLimitMinutes = try container.decode(Int.self, forKey: .dailyLimitMinutes)
        usedTodayMinutes = try container.decode(Double.self, forKey: .usedTodayMinutes)
        lastResetDate = try container.decode(Date.self, forKey: .lastResetDate)
        // Default to false if not present (backwards compatibility)
        isLimitEnforced = try container.decodeIfPresent(Bool.self, forKey: .isLimitEnforced) ?? false
    }

    private enum CodingKeys: String, CodingKey {
        case id, appTokenData, appName, dailyLimitMinutes, usedTodayMinutes, lastResetDate, isLimitEnforced
    }

    /// Decode the ApplicationToken from stored data
    var applicationToken: ApplicationToken? {
        try? PropertyListDecoder().decode(ApplicationToken.self, from: appTokenData)
    }

    var remainingToday: Double {
        max(0, Double(dailyLimitMinutes) - usedTodayMinutes)
    }

    var isLimitReached: Bool {
        usedTodayMinutes >= Double(dailyLimitMinutes)
    }

    var usagePercentage: Double {
        guard dailyLimitMinutes > 0 else { return 0 }
        return min(1.0, usedTodayMinutes / Double(dailyLimitMinutes))
    }

    /// Check if daily reset is needed (new day)
    mutating func checkDailyReset() {
        let today = Calendar.current.startOfDay(for: Date())
        if lastResetDate < today {
            usedTodayMinutes = 0
            isLimitEnforced = false
            lastResetDate = today
        }
    }

    /// Add usage time
    mutating func addUsage(minutes: Double) {
        usedTodayMinutes += minutes
    }

    // Limits
    static let minLimit = 5          // 5 minutes minimum
    static let maxLimit = 120        // 2 hours maximum
    static let defaultLimit = 30    // 30 minutes default
}

/// Result of checking app access
enum AccessResult {
    case allowed(consumesEarnedTime: Bool)
    case blocked(reason: BlockReason)

    var isAllowed: Bool {
        if case .allowed = self { return true }
        return false
    }
}

/// Reason for blocking an app
enum BlockReason {
    case dailyGoalReached      // Total screen time goal reached (route to coach)
    case dailyLimitReached     // Per-app daily limit reached
    case noTimeAvailable
    case appNotSelected

    var displayMessage: String {
        switch self {
        case .dailyGoalReached:
            return "Daily screen time goal reached"
        case .dailyLimitReached:
            return "Daily limit reached for this app"
        case .noTimeAvailable:
            return "No earned time available"
        case .appNotSelected:
            return "App not in blocked list"
        }
    }

    var icon: String {
        switch self {
        case .dailyGoalReached:
            return "flag.checkered"
        case .dailyLimitReached:
            return "clock.badge.xmark"
        case .noTimeAvailable:
            return "hourglass.bottomhalf.filled"
        case .appNotSelected:
            return "questionmark.circle"
        }
    }

    /// Whether this block reason should route to coach
    var shouldRouteToCoach: Bool {
        switch self {
        case .dailyGoalReached:
            return true
        default:
            return false
        }
    }
}
