import Foundation
import Observation

@Observable
final class StatsService {
    private let appGroupId = "group.com.hrynchuk.appblocker"

    // Today's stats
    var totalScreenTimeToday: TimeInterval = 0
    var pickupsToday: Int = 0
    var healthScore: Int = 75

    // Weekly stats
    var weeklyUsage: [DailyUsage] = []
    var averageScreenTime: TimeInterval = 0

    // Streak
    var currentStreak: Int = 0
    var longestStreak: Int = 0

    init() {
        loadStats()
    }

    // MARK: - Health Score

    func calculateHealthScore() -> Int {
        // Score based on screen time and goals
        let targetMinutes: Double = 120 // 2 hours target
        let actualMinutes = totalScreenTimeToday / 60

        var score = 100

        // Reduce score for excess usage
        if actualMinutes > targetMinutes {
            let excess = actualMinutes - targetMinutes
            score -= Int(excess / 10) // -1 point per 10 minutes over
        }

        // Reduce for high pickups
        if pickupsToday > 50 {
            score -= (pickupsToday - 50) / 5
        }

        healthScore = max(0, min(100, score))
        return healthScore
    }

    func getOrbLevel() -> Int {
        switch healthScore {
        case 80...100: return 5  // Excellent
        case 60..<80: return 4   // Good
        case 40..<60: return 3   // Average
        case 20..<40: return 2   // Poor
        default: return 1        // Critical
        }
    }

    // MARK: - Time Formatting

    func formatDuration(_ seconds: TimeInterval) -> String {
        let totalMinutes = Int(seconds / 60)

        if totalMinutes < 60 {
            return "\(totalMinutes)m"
        } else {
            let hours = totalMinutes / 60
            let minutes = totalMinutes % 60
            return minutes > 0 ? "\(hours)h \(minutes)m" : "\(hours)h"
        }
    }

    func formattedTodayScreenTime: String {
        formatDuration(totalScreenTimeToday)
    }

    // MARK: - Comparison

    var timeComparisonToAverage: (isLess: Bool, difference: String) {
        let diff = totalScreenTimeToday - averageScreenTime
        let isLess = diff < 0
        return (isLess, formatDuration(abs(diff)))
    }

    // MARK: - Loading Data

    func loadStats() {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return }

        totalScreenTimeToday = defaults.double(forKey: "totalScreenTime")
        pickupsToday = defaults.integer(forKey: "pickupsToday")

        _ = calculateHealthScore()
        loadWeeklyData()
        loadStreak()
    }

    func refresh() async {
        // Reload from App Group (set by DeviceActivityReport extension)
        loadStats()
    }

    private func loadWeeklyData() {
        guard let defaults = UserDefaults(suiteName: appGroupId),
              let data = defaults.data(forKey: "weeklyUsageData"),
              let weekly = try? JSONDecoder().decode([DailyUsage].self, from: data) else {
            // Generate placeholder data
            weeklyUsage = (0..<7).map { dayOffset in
                let date = Calendar.current.date(byAdding: .day, value: -dayOffset, to: Date()) ?? Date()
                return DailyUsage(date: date, screenTimeMinutes: 0)
            }.reversed()
            return
        }

        weeklyUsage = weekly

        // Calculate average
        let daysWithData = weekly.filter { $0.screenTimeMinutes > 0 }
        if !daysWithData.isEmpty {
            let total = daysWithData.reduce(0) { $0 + $1.screenTimeMinutes }
            averageScreenTime = TimeInterval(total / daysWithData.count) * 60
        }
    }

    private func loadStreak() {
        let defaults = UserDefaults.standard
        currentStreak = defaults.integer(forKey: "currentStreak")
        longestStreak = defaults.integer(forKey: "longestStreak")
    }

    func updateStreak(completedTaskToday: Bool) {
        let defaults = UserDefaults.standard
        let lastStreakDate = defaults.object(forKey: "lastStreakDate") as? Date

        let calendar = Calendar.current

        if let lastDate = lastStreakDate {
            if calendar.isDateInToday(lastDate) {
                // Already updated today
                return
            } else if calendar.isDateInYesterday(lastDate) {
                // Continuing streak
                if completedTaskToday {
                    currentStreak += 1
                    defaults.set(Date(), forKey: "lastStreakDate")
                }
            } else {
                // Streak broken, reset
                currentStreak = completedTaskToday ? 1 : 0
                if completedTaskToday {
                    defaults.set(Date(), forKey: "lastStreakDate")
                }
            }
        } else {
            // First time
            currentStreak = completedTaskToday ? 1 : 0
            if completedTaskToday {
                defaults.set(Date(), forKey: "lastStreakDate")
            }
        }

        if currentStreak > longestStreak {
            longestStreak = currentStreak
            defaults.set(longestStreak, forKey: "longestStreak")
        }

        defaults.set(currentStreak, forKey: "currentStreak")
    }
}

// MARK: - Daily Usage Model

struct DailyUsage: Codable, Identifiable {
    var id: Date { date }
    let date: Date
    var screenTimeMinutes: Int

    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE"
        return formatter.string(from: date)
    }

    var hours: Double {
        Double(screenTimeMinutes) / 60.0
    }
}
