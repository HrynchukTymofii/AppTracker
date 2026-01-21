import Foundation
import Observation

@Observable
final class StatsService {
    private let appGroupId = "group.com.hrynchuk.appblocker"

    // Track if data was loaded from extension
    var dataLoadedFromExtension: Bool = false
    var loadAttempts: Int = 0

    // Today's stats
    var totalScreenTimeToday: TimeInterval = 0
    var pickupsToday: Int = 0
    var healthScore: Int = 75

    // Weekly stats
    var weeklyUsage: [DailyUsage] = []
    var averageScreenTime: TimeInterval = 0

    // App usage
    var appUsage: [AppUsageInfo] = []

    // Streak
    var currentStreak: Int = 0
    var longestStreak: Int = 0

    // Last update
    var lastUpdated: Date?

    init() {
        loadStats()
        // Retry loading after a delay (extension might not have saved data yet)
        scheduleRetryLoad()
    }

    private func scheduleRetryLoad() {
        // Try reloading after extension has had time to process
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { [weak self] in
            guard let self = self else { return }
            if self.totalScreenTimeToday == 0 && self.loadAttempts < 5 {
                self.loadAttempts += 1
                print("StatsService: Retry load attempt \(self.loadAttempts)")
                self.loadStats()
                if self.totalScreenTimeToday == 0 {
                    self.scheduleRetryLoad()
                }
            }
        }
    }

    // MARK: - Health Score

    func calculateHealthScore() -> Int {
        // Legacy method - uses default values
        // For proper calculation, use calculateHealthScore(earnedToday:spentToday:availableBalance:streak:)
        healthScore = 50
        return healthScore
    }

    /// Calculate health score based on earned/spent activity
    /// - Parameters:
    ///   - earnedToday: Minutes earned today through exercises
    ///   - spentToday: Minutes spent today on blocked apps
    ///   - availableBalance: Current available balance in time bank
    ///   - streak: Current streak days
    /// - Returns: Health score 0-100
    func calculateHealthScore(earnedToday: Double, spentToday: Double, availableBalance: Double, streak: Int) -> Int {
        var score: Double = 50  // Base score

        // 1. Earned today bonus (max +25 points)
        // Earning 30+ minutes today = full bonus
        let earnedBonus = min(25, earnedToday / 30 * 25)
        score += earnedBonus

        // 2. Earned vs Spent ratio bonus (max +25 points)
        // If earned more than spent = bonus, if spent more = penalty
        if spentToday > 0 {
            let ratio = earnedToday / spentToday
            if ratio >= 1 {
                // Earned more than spent - bonus (max +25 at 2:1 ratio)
                score += min(25, (ratio - 1) * 25)
            } else {
                // Spent more than earned - penalty (max -25 at 0:1 ratio)
                score -= (1 - ratio) * 25
            }
        } else if earnedToday > 0 {
            // Earned but didn't spend - good! +15 bonus
            score += 15
        }

        // 3. Available balance bonus (max +15 points)
        // Having 60+ minutes saved = full bonus
        let balanceBonus = min(15, availableBalance / 60 * 15)
        score += balanceBonus

        // 4. Streak bonus (max +10 points)
        // 7+ day streak = full bonus
        let streakBonus = min(10, Double(streak) / 7 * 10)
        score += streakBonus

        // Clamp to 0-100
        healthScore = max(0, min(100, Int(score)))
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

    var formattedTodayScreenTime: String {
        if totalScreenTimeToday == 0 {
            return "--"
        }
        return formatDuration(totalScreenTimeToday)
    }

    // MARK: - Comparison

    var timeComparisonToAverage: (isLess: Bool, difference: String) {
        if averageScreenTime == 0 && totalScreenTimeToday == 0 {
            return (true, "--")
        }
        let diff = totalScreenTimeToday - averageScreenTime
        let isLess = diff < 0
        return (isLess, formatDuration(abs(diff)))
    }

    // MARK: - Loading Data from DeviceActivityReport Extension

    func loadStats() {
        print("StatsService: loadStats() called - attempting to access App Group: \(appGroupId)")

        // First try to load from shared file (more reliable cross-process)
        if loadFromSharedFile() {
            print("StatsService: Successfully loaded from shared file")
            _ = calculateHealthScore()
            loadStreak()
            return
        }

        // Fallback to UserDefaults
        guard let defaults = UserDefaults(suiteName: appGroupId) else {
            print("StatsService: ERROR - Failed to access App Group container!")
            return
        }

        // Debug: List all keys in the App Group
        let allKeys = defaults.dictionaryRepresentation().keys
        print("StatsService: App Group keys available: \(Array(allKeys).sorted())")

        // Load total screen time (saved by DeviceActivityReport extension)
        totalScreenTimeToday = defaults.double(forKey: "totalScreenTime")
        lastUpdated = defaults.object(forKey: "lastUpdated") as? Date

        // Load week average (saved by DeviceActivityReport extension)
        let savedAverage = defaults.double(forKey: "averageScreenTime")
        if savedAverage > 0 {
            averageScreenTime = savedAverage
        }

        print("StatsService: Loaded totalScreenTime = \(totalScreenTimeToday) seconds (\(formatDuration(totalScreenTimeToday))), average = \(formatDuration(averageScreenTime))")
        if let updated = lastUpdated {
            print("StatsService: Last updated: \(updated)")
            dataLoadedFromExtension = true
        } else {
            print("StatsService: No lastUpdated timestamp found - extension may not have run yet")
        }

        // Load app usage data
        loadAppUsageData(from: defaults)

        // Load weekly/daily data
        loadWeeklyData(from: defaults)

        // Calculate health score
        _ = calculateHealthScore()
        loadStreak()
    }

    private func loadFromSharedFile() -> Bool {
        guard let containerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupId) else {
            print("StatsService: Failed to get App Group container URL")
            return false
        }

        let fileURL = containerURL.appendingPathComponent("screenTimeData.json")

        guard FileManager.default.fileExists(atPath: fileURL.path) else {
            print("StatsService: No shared file found at \(fileURL.path)")
            return false
        }

        do {
            let data = try Data(contentsOf: fileURL)
            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                return false
            }

            // Parse total duration
            if let duration = json["totalDuration"] as? TimeInterval {
                totalScreenTimeToday = duration
            }

            // Parse last updated
            if let timestamp = json["lastUpdated"] as? TimeInterval {
                lastUpdated = Date(timeIntervalSince1970: timestamp)
                dataLoadedFromExtension = true
            }

            // Parse apps
            if let appsArray = json["apps"] as? [[String: Any]] {
                appUsage = appsArray.compactMap { dict -> AppUsageInfo? in
                    guard let appName = dict["appName"] as? String,
                          let duration = dict["duration"] as? TimeInterval else {
                        return nil
                    }
                    let bundleId = dict["bundleId"] as? String ?? ""
                    return AppUsageInfo(appName: appName, bundleId: bundleId, durationSeconds: duration)
                }
                appUsage.sort { $0.durationSeconds > $1.durationSeconds }
            }

            print("StatsService: Loaded from file - Total: \(formatDuration(totalScreenTimeToday)), Apps: \(appUsage.count)")
            return totalScreenTimeToday > 0 || !appUsage.isEmpty

        } catch {
            print("StatsService: Failed to read shared file: \(error)")
            return false
        }
    }

    private func loadAppUsageData(from defaults: UserDefaults) {
        guard let data = defaults.data(forKey: "appUsageData"),
              let apps = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
            print("StatsService: No app usage data found")
            return
        }

        appUsage = apps.compactMap { dict -> AppUsageInfo? in
            guard let appName = dict["appName"] as? String,
                  let duration = dict["duration"] as? Double else {
                return nil
            }
            let bundleId = dict["bundleId"] as? String ?? ""
            return AppUsageInfo(appName: appName, bundleId: bundleId, durationSeconds: duration)
        }

        // Sort by duration descending
        appUsage.sort { $0.durationSeconds > $1.durationSeconds }

        print("StatsService: Loaded \(appUsage.count) apps")
    }

    private func loadWeeklyData(from defaults: UserDefaults) {
        // Try to load date-keyed data first (more accurate)
        if let data = defaults.data(forKey: "dailyUsageByDate"),
           let dateData = try? JSONSerialization.jsonObject(with: data) as? [String: [String: Any]] {

            let calendar = Calendar.current
            let today = Date()

            weeklyUsage = (0..<7).map { dayOffset -> DailyUsage in
                let date = calendar.date(byAdding: .day, value: -dayOffset, to: today) ?? today
                let dateFormatter = DateFormatter()
                dateFormatter.dateFormat = "yyyy-MM-dd"
                let dateKey = dateFormatter.string(from: date)

                if let dayInfo = dateData[dateKey],
                   let hours = dayInfo["hours"] as? Double {
                    return DailyUsage(date: date, screenTimeMinutes: Int(hours * 60))
                } else {
                    return DailyUsage(date: date, screenTimeMinutes: 0)
                }
            }.reversed()

        } else if let data = defaults.data(forKey: "dailyUsageData"),
                  let weekly = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
            // Fallback to day-of-week data
            let calendar = Calendar.current
            let today = Date()

            weeklyUsage = (0..<7).map { dayOffset -> DailyUsage in
                let date = calendar.date(byAdding: .day, value: -dayOffset, to: today) ?? today
                let weekday = calendar.component(.weekday, from: date) - 1 // 0-indexed

                if weekday < weekly.count, let hours = weekly[weekday]["hours"] as? Double {
                    return DailyUsage(date: date, screenTimeMinutes: Int(hours * 60))
                } else {
                    return DailyUsage(date: date, screenTimeMinutes: 0)
                }
            }.reversed()
        } else {
            // No data - create empty entries
            let calendar = Calendar.current
            let today = Date()
            weeklyUsage = (0..<7).map { dayOffset -> DailyUsage in
                let date = calendar.date(byAdding: .day, value: -dayOffset, to: today) ?? today
                return DailyUsage(date: date, screenTimeMinutes: 0)
            }.reversed()
        }

        // Calculate average
        let daysWithData = weeklyUsage.filter { $0.screenTimeMinutes > 0 }
        if !daysWithData.isEmpty {
            let total = daysWithData.reduce(0) { $0 + $1.screenTimeMinutes }
            averageScreenTime = TimeInterval(total / daysWithData.count) * 60
        }

        print("StatsService: Loaded \(weeklyUsage.count) days of weekly data")
    }

    func refresh() async {
        // Reload from App Group (set by DeviceActivityReport extension)
        loadStats()
    }

    private let sharedDefaults = UserDefaults(suiteName: "group.com.hrynchuk.appblocker")
    private let taskCompletionDatesKey = "timeBank.taskCompletionDates"

    private func loadStreak() {
        // Calculate streak from actual task completion dates
        calculateStreakFromCompletionDates()
    }

    /// Calculate streak from stored task completion dates
    /// A day counts if user completed at least one exercise or photo task
    func calculateStreakFromCompletionDates() {
        let defaults = UserDefaults.standard

        // Get completion dates from shared defaults (written by TimeBankService)
        let completionDates = sharedDefaults?.stringArray(forKey: taskCompletionDatesKey) ?? []

        guard !completionDates.isEmpty else {
            currentStreak = 0
            longestStreak = defaults.integer(forKey: "longestStreak")
            return
        }

        // Parse dates and sort descending (newest first)
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"

        let parsedDates = completionDates.compactMap { formatter.date(from: $0) }.sorted(by: >)

        guard !parsedDates.isEmpty else {
            currentStreak = 0
            return
        }

        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let yesterday = calendar.date(byAdding: .day, value: -1, to: today)!

        // Check if the most recent completion was today or yesterday
        let mostRecentDate = calendar.startOfDay(for: parsedDates[0])

        if mostRecentDate != today && mostRecentDate != yesterday {
            // Streak is broken - last completion was more than 1 day ago
            currentStreak = 0
            longestStreak = max(longestStreak, defaults.integer(forKey: "longestStreak"))
            defaults.set(longestStreak, forKey: "longestStreak")
            defaults.set(currentStreak, forKey: "currentStreak")
            return
        }

        // Count consecutive days
        var streak = 0
        var expectedDate = mostRecentDate

        for date in parsedDates {
            let completionDay = calendar.startOfDay(for: date)

            if completionDay == expectedDate {
                streak += 1
                expectedDate = calendar.date(byAdding: .day, value: -1, to: expectedDate)!
            } else if completionDay < expectedDate {
                // Gap in streak - check if we already counted this day
                let daysDiff = calendar.dateComponents([.day], from: completionDay, to: expectedDate).day ?? 0
                if daysDiff > 1 {
                    // More than 1 day gap - streak ends here
                    break
                }
                // Same day (duplicate entry) - continue
            }
        }

        currentStreak = streak
        longestStreak = max(streak, defaults.integer(forKey: "longestStreak"))

        defaults.set(currentStreak, forKey: "currentStreak")
        defaults.set(longestStreak, forKey: "longestStreak")
    }

    /// Update streak - called after task completion
    func updateStreak(earnedTimeToday: Double) {
        // Recalculate from completion dates
        calculateStreakFromCompletionDates()
    }

    /// Check if user completed a task today
    var hasCompletedTaskToday: Bool {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let todayString = formatter.string(from: Date())

        let completionDates = sharedDefaults?.stringArray(forKey: taskCompletionDatesKey) ?? []
        return completionDates.contains(todayString)
    }

    /// Legacy method - kept for backward compatibility
    func updateStreak(completedTaskToday: Bool) {
        updateStreak(earnedTimeToday: completedTaskToday ? 1.0 : 0.0)
    }

    // MARK: - Debug / Test Data

    func loadTestData() {
        // For testing when DeviceActivityReport hasn't run yet
        totalScreenTimeToday = 3 * 3600 + 45 * 60 // 3h 45m
        pickupsToday = 42

        let calendar = Calendar.current
        let today = Date()
        weeklyUsage = (0..<7).map { dayOffset -> DailyUsage in
            let date = calendar.date(byAdding: .day, value: -dayOffset, to: today) ?? today
            let hours = [2.5, 3.1, 4.2, 2.8, 3.5, 5.1, 3.75][dayOffset % 7]
            return DailyUsage(date: date, screenTimeMinutes: Int(hours * 60))
        }.reversed()

        appUsage = [
            AppUsageInfo(appName: "Instagram", bundleId: "com.instagram.instagram", durationSeconds: 45 * 60),
            AppUsageInfo(appName: "TikTok", bundleId: "com.zhiliaoapp.musically", durationSeconds: 38 * 60),
            AppUsageInfo(appName: "YouTube", bundleId: "com.google.ios.youtube", durationSeconds: 32 * 60),
            AppUsageInfo(appName: "Safari", bundleId: "com.apple.mobilesafari", durationSeconds: 25 * 60),
            AppUsageInfo(appName: "Twitter", bundleId: "com.twitter.twitter", durationSeconds: 18 * 60),
        ]

        // Don't overwrite real streak - keep value from loadStreak()
        _ = calculateHealthScore()
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

// MARK: - App Usage Info

struct AppUsageInfo: Identifiable {
    let id = UUID()
    let appName: String
    let bundleId: String
    let durationSeconds: Double

    var formattedDuration: String {
        let minutes = Int(durationSeconds / 60)
        if minutes < 60 {
            return "\(minutes)m"
        } else {
            let hours = minutes / 60
            let mins = minutes % 60
            return mins > 0 ? "\(hours)h \(mins)m" : "\(hours)h"
        }
    }
}
