import Foundation

/// Daily screen time goal - total limit across ALL apps
struct DailyGoal: Codable {
    var targetMinutes: Int          // User's daily goal (30-240 minutes, max 4h)
    var usedTodayMinutes: Double    // Tracked usage today
    var lastResetDate: Date         // For daily reset check

    // MARK: - Preset Options

    /// Available goal options in minutes (30m to 4h max)
    static let presetOptions: [Int] = [30, 45, 60, 90, 120, 150, 180, 240]  // 30min to 4h

    /// Default goal (2 hours)
    static let defaultGoal = DailyGoal(
        targetMinutes: 120,
        usedTodayMinutes: 0,
        lastResetDate: Calendar.current.startOfDay(for: Date())
    )

    // MARK: - Computed Properties

    /// Remaining minutes until goal is reached
    var remainingMinutes: Double {
        max(0, Double(targetMinutes) - usedTodayMinutes)
    }

    /// Progress percentage (0.0 to 1.0)
    var progressPercentage: Double {
        guard targetMinutes > 0 else { return 0 }
        return min(1.0, usedTodayMinutes / Double(targetMinutes))
    }

    /// Whether the daily goal has been reached
    var isGoalReached: Bool {
        usedTodayMinutes >= Double(targetMinutes)
    }

    /// Formatted target time (e.g., "2h")
    var formattedTarget: String {
        formatMinutes(targetMinutes)
    }

    /// Formatted used time (e.g., "1h 23m")
    var formattedUsed: String {
        formatMinutes(Int(usedTodayMinutes))
    }

    /// Formatted remaining time (e.g., "37m left")
    var formattedRemaining: String {
        let remaining = Int(remainingMinutes)
        if remaining <= 0 {
            return "Goal reached"
        }
        return "\(formatMinutes(remaining)) left"
    }

    // MARK: - Daily Reset

    /// Check if needs daily reset and perform it
    mutating func checkDailyReset() {
        let today = Calendar.current.startOfDay(for: Date())
        if lastResetDate < today {
            usedTodayMinutes = 0
            lastResetDate = today
        }
    }

    /// Add usage minutes
    mutating func addUsage(minutes: Double) {
        usedTodayMinutes += minutes
    }

    // MARK: - Formatting Helpers

    private func formatMinutes(_ minutes: Int) -> String {
        if minutes >= 60 {
            let h = minutes / 60
            let m = minutes % 60
            return m > 0 ? "\(h)h \(m)m" : "\(h)h"
        }
        return "\(minutes)m"
    }
}

// MARK: - App Group Persistence Keys

extension DailyGoal {
    static let storageKey = "blocking.dailyGoal"
    static let appGroupId = "group.com.hrynchuk.appblocker"

    /// Load from app group UserDefaults
    static func load() -> DailyGoal {
        guard let defaults = UserDefaults(suiteName: appGroupId),
              let data = defaults.data(forKey: storageKey) else {
            return .defaultGoal
        }

        do {
            var goal = try JSONDecoder().decode(DailyGoal.self, from: data)
            goal.checkDailyReset()
            return goal
        } catch {
            print("DailyGoal: Failed to load - \(error)")
            return .defaultGoal
        }
    }

    /// Save to app group UserDefaults
    func save() {
        guard let defaults = UserDefaults(suiteName: DailyGoal.appGroupId) else { return }

        do {
            let data = try JSONEncoder().encode(self)
            defaults.set(data, forKey: DailyGoal.storageKey)
            defaults.synchronize()
        } catch {
            print("DailyGoal: Failed to save - \(error)")
        }
    }
}
