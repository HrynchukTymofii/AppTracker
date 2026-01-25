import DeviceActivity
import SwiftUI
import UIKit
import FamilyControls
import ManagedSettings
import os.log

private let logger = Logger(subsystem: "com.hrynchuk.appblocker.DeviceActivityReport", category: "Report")

// MARK: - Localization Helper
private struct ReportL10n {
    private static let appGroupId = "group.com.hrynchuk.appblocker"

    private static var cachedStrings: [String: String] {
        UserDefaults(suiteName: appGroupId)?.dictionary(forKey: "cachedReportStrings") as? [String: String] ?? [:]
    }

    static func string(_ key: String, fallback: String) -> String {
        cachedStrings[key] ?? fallback
    }

    // Common strings
    static var noData: String { string("report.no_data", fallback: "No Screen Time Data") }
    static var noDataDesc: String { string("report.no_data_desc", fallback: "Use your device and come back to see your statistics") }
    static var vsLastWeek: String { string("report.vs_last_week", fallback: "VS LAST WEEK") }
    static var lessScreenTime: String { string("report.less_screen_time", fallback: "less screen time") }
    static var moreScreenTime: String { string("report.more_screen_time", fallback: "more screen time") }
    static var vs: String { string("report.vs", fallback: "vs") }
    static var difference: String { string("report.difference", fallback: "difference") }
    static var totalHours: String { string("report.total_hours", fallback: "Total Hours") }
    static var dailyAvg: String { string("report.daily_avg", fallback: "Daily Avg") }
    static var peakDay: String { string("report.peak_day", fallback: "Peak Day") }
    static var today: String { string("report.today", fallback: "Today") }
    static var statsPerDay: String { string("report.stats_per_day", fallback: "Stats per Day") }
    static var totalTimePerApp: String { string("report.total_time_per_app", fallback: "Total Time per App") }
    static var noAppData: String { string("report.no_app_data", fallback: "No app usage data") }
    static var less: String { string("report.less", fallback: "Less") }
    static var more: String { string("report.more", fallback: "More") }
    static var streak: String { string("report.streak", fallback: "STREAK") }
    static var vsAvg: String { string("report.vs_avg", fallback: "VS AVG") }
    static var topApps: String { string("report.top_apps", fallback: "Top Apps") }
    static var noAppUsage: String { string("report.no_app_usage", fallback: "No app usage today") }
    static var startUsing: String { string("report.start_using", fallback: "Start using apps to see your stats") }
    static var screenTime: String { string("report.screen_time", fallback: "Screen Time") }
    static var notifications: String { string("report.notifications", fallback: "Notifications") }
    static var todaysProgress: String { string("report.todays_progress", fallback: "TODAY'S PROGRESS") }
    static var used: String { string("report.used", fallback: "used") }
    static var left: String { string("report.left", fallback: "left") }
    static var goalReached: String { string("report.goal_reached", fallback: "Goal reached") }
    static var thisWeek: String { string("report.this_week", fallback: "This Week") }
    static var remaining: String { string("report.remaining", fallback: "Remaining") }
    static var ofGoal: String { string("report.of_goal", fallback: "Of goal") }
    static var goal: String { string("report.goal", fallback: "goal") }
    static var avg: String { string("report.avg", fallback: "avg") }

    // Day names
    static var daySun: String { string("report.day_sun", fallback: "Sun") }
    static var dayMon: String { string("report.day_mon", fallback: "Mon") }
    static var dayTue: String { string("report.day_tue", fallback: "Tue") }
    static var dayWed: String { string("report.day_wed", fallback: "Wed") }
    static var dayThu: String { string("report.day_thu", fallback: "Thu") }
    static var dayFri: String { string("report.day_fri", fallback: "Fri") }
    static var daySat: String { string("report.day_sat", fallback: "Sat") }

    static var dayS: String { string("report.day_s", fallback: "S") }
    static var dayM: String { string("report.day_m", fallback: "M") }
    static var dayT: String { string("report.day_t", fallback: "T") }
    static var dayW: String { string("report.day_w", fallback: "W") }
    static var dayF: String { string("report.day_f", fallback: "F") }

    static func localizedDayName(_ englishDay: String) -> String {
        switch englishDay {
        case "Sun": return daySun
        case "Mon": return dayMon
        case "Tue": return dayTue
        case "Wed": return dayWed
        case "Thu": return dayThu
        case "Fri": return dayFri
        case "Sat": return daySat
        case "S": return dayS
        case "M": return dayM
        case "T": return dayT
        case "W": return dayW
        case "F": return dayF
        default: return englishDay
        }
    }
}

@main
struct LockInDeviceActivityReport: DeviceActivityReportExtension {
    init() {
        logger.info("🚀 DeviceActivityReport extension initialized")

        // DEBUG: Write to UserDefaults to confirm extension init runs
        if let debugDefaults = UserDefaults(suiteName: "group.com.hrynchuk.appblocker") {
            debugDefaults.set(Date().timeIntervalSince1970, forKey: "debug.extensionInitTime")
            debugDefaults.set("Extension init ran", forKey: "debug.extensionInitStatus")
            debugDefaults.synchronize()
        }
    }

    var body: some DeviceActivityReportScene {
        // Total activity report (with header - for Stats page)
        TotalActivityReport { totalActivity in
            TotalActivityView(totalActivity: totalActivity)
        }

        // Compact report (no header - for Home page)
        HomeCompactReport { totalActivity in
            HomeCompactView(totalActivity: totalActivity)
        }

        // Per-app activity report
        AppActivityReport { appActivity in
            AppActivityView(appActivity: appActivity)
        }

        // Settings summary (compact view)
        SettingsSummaryReport { summary in
            SettingsSummaryView(summary: summary)
        }

        // Daily goal progress (tracks blocked apps usage) - compact for Home
        DailyGoalProgressReport { goalData in
            DailyGoalProgressView(goalData: goalData)
        }

        // Goals page progress (full card with stats) - for Goals page
        GoalsPageProgressReport { goalData in
            GoalsPageProgressView(goalData: goalData)
        }

        // Home quick stats only (STREAK, TODAY, VS AVG) - compact row for Home page top
        HomeQuickStatsReport { statsData in
            HomeQuickStatsOnlyView(statsData: statsData)
        }

        // Stats page app usage list with real icons
        StatsAppUsageReport { appData in
            StatsAppUsageView(appData: appData)
        }
    }
}

// MARK: - Report Contexts

extension DeviceActivityReport.Context {
    static let totalActivity = Self("TotalActivity")
    static let homeCompact = Self("HomeCompact")
    static let appActivity = Self("AppActivity")
    static let settingsSummary = Self("SettingsSummary")
    static let dailyGoalProgress = Self("DailyGoalProgress")
    static let goalsPageProgress = Self("GoalsPageProgress")
    static let homeQuickStats = Self("HomeQuickStats")
    static let statsAppUsage = Self("StatsAppUsage")
}

// MARK: - Total Activity Report (Full Stats Page)

struct TotalActivityReport: DeviceActivityReportScene {
    let context: DeviceActivityReport.Context = .totalActivity

    let content: (StatsActivityData) -> TotalActivityView

    func makeConfiguration(representing data: DeviceActivityResults<DeviceActivityData>) async -> StatsActivityData {
        logger.info("TotalActivityReport: makeConfiguration called - collecting data...")

        let calendar = Calendar.current
        let today = Date()
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"

        // Find this week's Sunday
        let weekday = calendar.component(.weekday, from: today)
        let daysFromSunday = weekday - 1
        let thisWeekSunday = calendar.date(byAdding: .day, value: -daysFromSunday, to: calendar.startOfDay(for: today))!
        let lastWeekSunday = calendar.date(byAdding: .day, value: -7, to: thisWeekSunday)!

        // Data structures
        var dailyTotals: [String: TimeInterval] = [:] // date string -> duration
        var appUsages: [AppUsageData] = []
        var todayDuration: TimeInterval = 0
        let todayString = dateFormatter.string(from: today)

        for await activityData in data {
            for await segment in activityData.activitySegments {
                let segmentDate = segment.dateInterval.start
                let segmentDateString = dateFormatter.string(from: segmentDate)
                let isToday = segmentDateString == todayString

                for await categoryActivity in segment.categories {
                    for await appActivity in categoryActivity.applications {
                        let appName = appActivity.application.localizedDisplayName ?? "Unknown"
                        let bundleId = appActivity.application.bundleIdentifier ?? "unknown"
                        let duration = appActivity.totalActivityDuration

                        // Skip system apps
                        if bundleId.hasPrefix("com.apple.family") ||
                           bundleId.hasPrefix("com.apple.ScreenTime") ||
                           bundleId == "com.apple.FamilyControlsAuthentication" {
                            continue
                        }

                        // Add to daily totals
                        dailyTotals[segmentDateString, default: 0] += duration

                        if isToday {
                            todayDuration += duration
                        }

                        // Aggregate apps (for today)
                        if isToday {
                            if let index = appUsages.firstIndex(where: { $0.bundleId == bundleId }) {
                                appUsages[index].duration += duration
                            } else {
                                appUsages.append(AppUsageData(
                                    appName: appName,
                                    bundleId: bundleId,
                                    duration: duration,
                                    token: appActivity.application.token
                                ))
                            }
                        }
                    }
                }
            }
        }

        appUsages.sort { $0.duration > $1.duration }

        // Build this week data (Sun-Sat)
        var thisWeekDays: [DayUsageData] = []
        var thisWeekTotal: TimeInterval = 0
        for dayOffset in 0..<7 {
            let date = calendar.date(byAdding: .day, value: dayOffset, to: thisWeekSunday)!
            let dateStr = dateFormatter.string(from: date)
            let duration = dailyTotals[dateStr] ?? 0
            let dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayOffset]
            thisWeekDays.append(DayUsageData(day: dayName, date: dateStr, duration: duration))
            thisWeekTotal += duration
        }

        // Build last week data (Sun-Sat)
        var lastWeekTotal: TimeInterval = 0
        for dayOffset in 0..<7 {
            let date = calendar.date(byAdding: .day, value: dayOffset, to: lastWeekSunday)!
            let dateStr = dateFormatter.string(from: date)
            let duration = dailyTotals[dateStr] ?? 0
            lastWeekTotal += duration
        }

        // Build heatmap data (last 28 days)
        var heatmapDays: [DayUsageData] = []
        for dayOffset in (0..<28).reversed() {
            let date = calendar.date(byAdding: .day, value: -dayOffset, to: today)!
            let dateStr = dateFormatter.string(from: date)
            let duration = dailyTotals[dateStr] ?? 0
            let dayName = dateFormatter.weekdaySymbols[calendar.component(.weekday, from: date) - 1]
            heatmapDays.append(DayUsageData(day: String(dayName.prefix(3)), date: dateStr, duration: duration))
        }

        // Save to shared container
        saveToSharedContainer(todayDuration: todayDuration, dailyTotals: dailyTotals, apps: appUsages, thisWeekTotal: thisWeekTotal, lastWeekTotal: lastWeekTotal)

        return StatsActivityData(
            todayDuration: todayDuration,
            thisWeekTotal: thisWeekTotal,
            lastWeekTotal: lastWeekTotal,
            thisWeekDays: thisWeekDays,
            heatmapDays: heatmapDays,
            apps: appUsages
        )
    }

    private func saveToSharedContainer(todayDuration: TimeInterval, dailyTotals: [String: TimeInterval], apps: [AppUsageData], thisWeekTotal: TimeInterval, lastWeekTotal: TimeInterval) {
        guard let defaults = UserDefaults(suiteName: "group.com.hrynchuk.appblocker") else { return }

        // Save basic stats
        defaults.set(todayDuration / 60.0, forKey: "stats.todayMinutes")
        defaults.set(thisWeekTotal / 60.0, forKey: "stats.thisWeekMinutes")
        defaults.set(lastWeekTotal / 60.0, forKey: "stats.lastWeekMinutes")

        // Save per-app usage for app limits sync
        // Format: { "base64EncodedToken": { "minutes": X, "name": "AppName" } }
        var usageSync: [String: [String: Any]] = [:]
        for app in apps {
            if let token = app.token {
                do {
                    let tokenData = try PropertyListEncoder().encode(token)
                    let base64Key = tokenData.base64EncodedString()
                    usageSync[base64Key] = [
                        "minutes": app.duration / 60.0,
                        "name": app.appName
                    ]
                } catch {
                    // Skip if encoding fails
                }
            }
        }

        if !usageSync.isEmpty {
            if let data = try? JSONSerialization.data(withJSONObject: usageSync) {
                defaults.set(data, forKey: "appLimits.usageSync")
                defaults.set(Date().timeIntervalSince1970, forKey: "appLimits.lastSyncTime")
            }
        }

        defaults.synchronize()
    }
}

// Stats data model
struct StatsActivityData {
    let todayDuration: TimeInterval
    let thisWeekTotal: TimeInterval
    let lastWeekTotal: TimeInterval
    let thisWeekDays: [DayUsageData]
    let heatmapDays: [DayUsageData]
    let apps: [AppUsageData]

    var weekChange: Double {
        guard lastWeekTotal > 0 else { return 0 }
        return ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100
    }

    var dailyAverage: TimeInterval {
        let daysWithData = thisWeekDays.filter { $0.duration > 0 }.count
        guard daysWithData > 0 else { return 0 }
        return thisWeekTotal / Double(daysWithData)
    }
}

struct DayUsageData: Identifiable {
    let id = UUID()
    let day: String
    let date: String
    let duration: TimeInterval

    var hours: Double { duration / 3600 }
}

// MARK: - Home Compact Report (No header, just apps list)

struct HomeCompactReport: DeviceActivityReportScene {
    let context: DeviceActivityReport.Context = .homeCompact

    let content: (HomeActivityData) -> HomeCompactView

    func makeConfiguration(representing data: DeviceActivityResults<DeviceActivityData>) async -> HomeActivityData {
        logger.info("🏠 HomeCompactReport.makeConfiguration() STARTED")

        // DEBUG: Write to UserDefaults to confirm this code runs
        if let debugDefaults = UserDefaults(suiteName: "group.com.hrynchuk.appblocker") {
            debugDefaults.set(Date().timeIntervalSince1970, forKey: "debug.homeCompactReportLastRun")
            debugDefaults.set("HomeCompactReport ran", forKey: "debug.homeCompactReportStatus")
            debugDefaults.synchronize()
        }

        let today = Date()
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let todayString = dateFormatter.string(from: today)

        var todayDuration: TimeInterval = 0
        var todayApps: [AppUsageData] = []
        // Dictionary to aggregate duration by date string (for past days)
        var pastDayTotals: [String: TimeInterval] = [:]

        for await activityData in data {
            for await segment in activityData.activitySegments {
                // Check if this segment is from today
                let segmentDate = segment.dateInterval.start
                let segmentDateString = dateFormatter.string(from: segmentDate)
                let isToday = segmentDateString == todayString

                for await categoryActivity in segment.categories {
                    for await appActivity in categoryActivity.applications {
                        let appName = appActivity.application.localizedDisplayName ?? "Unknown"
                        let bundleId = appActivity.application.bundleIdentifier ?? "unknown"
                        let duration = appActivity.totalActivityDuration

                        if bundleId.hasPrefix("com.apple.family") ||
                           bundleId.hasPrefix("com.apple.ScreenTime") ||
                           bundleId == "com.apple.FamilyControlsAuthentication" {
                            continue
                        }

                        if isToday {
                            // Today's data
                            todayDuration += duration
                            if let index = todayApps.firstIndex(where: { $0.bundleId == bundleId }) {
                                todayApps[index].duration += duration
                            } else {
                                todayApps.append(AppUsageData(
                                    appName: appName,
                                    bundleId: bundleId,
                                    duration: duration,
                                    token: appActivity.application.token
                                ))
                            }
                        } else {
                            // Aggregate past days by date
                            pastDayTotals[segmentDateString, default: 0] += duration
                        }
                    }
                }
            }
        }

        todayApps.sort { $0.duration > $1.duration }

        // Calculate average from ALL days with data (including today)
        // This matches how TotalActivityReport calculates dailyAverage
        var allDayTotals = pastDayTotals
        if todayDuration > 0 {
            allDayTotals[todayString] = todayDuration
        }

        let weekAverage: TimeInterval
        let daysWithData = allDayTotals.values.filter { $0 > 0 }.count
        if daysWithData > 0 {
            let totalAll = allDayTotals.values.reduce(0, +)
            weekAverage = totalAll / Double(daysWithData)
        } else {
            weekAverage = 0
        }

        // Save today's screen time and app usage to shared container
        saveHomeDataToSharedContainer(todayDuration: todayDuration, weekAverage: weekAverage, apps: todayApps)

        return HomeActivityData(
            todayDuration: todayDuration,
            weekAverage: weekAverage,
            apps: todayApps
        )
    }

    /// Save usage data to App Group for app limits sync and quick stats
    private func saveHomeDataToSharedContainer(todayDuration: TimeInterval, weekAverage: TimeInterval, apps: [AppUsageData]) {
        guard let defaults = UserDefaults(suiteName: "group.com.hrynchuk.appblocker") else { return }

        // Save today's total in SECONDS (for StatsService.totalScreenTimeToday)
        defaults.set(todayDuration, forKey: "totalScreenTime")
        defaults.set(Date(), forKey: "lastUpdated")

        // Save week average in SECONDS (for StatsService.averageScreenTime)
        defaults.set(weekAverage, forKey: "averageScreenTime")

        // Also save in minutes for backward compatibility
        defaults.set(todayDuration / 60.0, forKey: "stats.todayMinutes")

        // SIMPLE: Save ALL app usage by name - main app will match to limits
        // Format: { "Instagram": 45.5, "TikTok": 30.0, "YouTube": 15.0, ... }
        var usageByName: [String: Double] = [:]
        for app in apps {
            usageByName[app.appName] = app.duration / 60.0
        }

        if let data = try? JSONEncoder().encode(usageByName) {
            defaults.set(data, forKey: "appUsage.byName")
            defaults.set(Date().timeIntervalSince1970, forKey: "appUsage.lastSync")
        }

        defaults.synchronize()
    }
}

// Data model for Home Compact view
struct HomeActivityData {
    let todayDuration: TimeInterval  // Just today
    let weekAverage: TimeInterval    // Average of past days
    let apps: [AppUsageData]         // Today's apps
}

// MARK: - Home Quick Stats Report (Just STREAK, TODAY, VS AVG row)

struct HomeQuickStatsReport: DeviceActivityReportScene {
    let context: DeviceActivityReport.Context = .homeQuickStats

    let content: (QuickStatsData) -> HomeQuickStatsOnlyView

    func makeConfiguration(representing data: DeviceActivityResults<DeviceActivityData>) async -> QuickStatsData {
        let today = Date()
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let todayString = dateFormatter.string(from: today)

        var todayDuration: TimeInterval = 0
        var pastDayTotals: [String: TimeInterval] = [:]

        for await activityData in data {
            for await segment in activityData.activitySegments {
                let segmentDate = segment.dateInterval.start
                let segmentDateString = dateFormatter.string(from: segmentDate)
                let isToday = segmentDateString == todayString

                for await categoryActivity in segment.categories {
                    for await appActivity in categoryActivity.applications {
                        let bundleId = appActivity.application.bundleIdentifier ?? "unknown"
                        let duration = appActivity.totalActivityDuration

                        if bundleId.hasPrefix("com.apple.family") ||
                           bundleId.hasPrefix("com.apple.ScreenTime") ||
                           bundleId == "com.apple.FamilyControlsAuthentication" {
                            continue
                        }

                        if isToday {
                            todayDuration += duration
                        } else {
                            pastDayTotals[segmentDateString, default: 0] += duration
                        }
                    }
                }
            }
        }

        // Calculate average from ALL days with data (including today)
        var allDayTotals = pastDayTotals
        if todayDuration > 0 {
            allDayTotals[todayString] = todayDuration
        }

        let weekAverage: TimeInterval
        let daysWithData = allDayTotals.values.filter { $0 > 0 }.count
        if daysWithData > 0 {
            let totalAll = allDayTotals.values.reduce(0, +)
            weekAverage = totalAll / Double(daysWithData)
        } else {
            weekAverage = 0
        }

        // Get streak from App Group
        let defaults = UserDefaults(suiteName: "group.com.hrynchuk.appblocker")
        let streak = defaults?.integer(forKey: "currentStreak") ?? 0

        return QuickStatsData(
            todayDuration: todayDuration,
            weekAverage: weekAverage,
            streak: streak
        )
    }
}

// Data model for quick stats only
struct QuickStatsData {
    let todayDuration: TimeInterval
    let weekAverage: TimeInterval
    let streak: Int
}

// MARK: - Home Quick Stats Only View

struct HomeQuickStatsOnlyView: View {
    let statsData: QuickStatsData

    private var isDark: Bool {
        UITraitCollection.current.userInterfaceStyle == .dark
    }

    // Format today's time as "1h 37m"
    private var todayFormatted: String {
        let totalSeconds = Int(statsData.todayDuration)
        let hours = totalSeconds / 3600
        let minutes = (totalSeconds % 3600) / 60
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        }
        return "\(minutes)m"
    }

    // Calculate vs average
    private var vsAverage: (text: String, isLess: Bool) {
        let diff = statsData.todayDuration - statsData.weekAverage
        let diffSeconds = Int(abs(diff))

        if diffSeconds < 60 { // Less than 1 minute difference
            return ("0m", true)
        }

        let hours = diffSeconds / 3600
        let minutes = (diffSeconds % 3600) / 60
        let formatted = hours > 0 ? "\(hours)h \(minutes)m" : "\(minutes)m"

        return (formatted, diff < 0)
    }

    var body: some View {
        HStack(spacing: 10) {
            // Streak
            HomeQuickStatCard(
                title: ReportL10n.streak,
                value: "\(statsData.streak)",
                emoji: "🔥",
                glowColor: Color(hex: "f97316"),
                isDark: isDark
            )

            // Today
            HomeQuickStatCard(
                title: ReportL10n.today.uppercased(),
                value: todayFormatted,
                glowColor: ReportColors.accentColor,
                isDark: isDark
            )

            // vs Average
            HomeQuickStatCard(
                title: ReportL10n.vsAvg,
                value: vsAverage.text,
                icon: vsAverage.isLess ? "arrow.down" : "arrow.up",
                iconColor: vsAverage.isLess ? Color(hex: "10b981") : Color(hex: "ef4444"),
                valueColor: vsAverage.isLess ? Color(hex: "10b981") : Color(hex: "ef4444"),
                glowColor: vsAverage.isLess ? Color(hex: "10b981") : Color(hex: "ef4444"),
                isDark: isDark
            )
        }
        .padding(.horizontal, 20)
    }
}

// MARK: - App Activity Report

struct AppActivityReport: DeviceActivityReportScene {
    let context: DeviceActivityReport.Context = .appActivity

    let content: ([AppUsageData]) -> AppActivityView

    func makeConfiguration(representing data: DeviceActivityResults<DeviceActivityData>) async -> [AppUsageData] {
        var appUsages: [AppUsageData] = []

        for await activityData in data {
            for await segment in activityData.activitySegments {
                for await categoryActivity in segment.categories {
                    for await appActivity in categoryActivity.applications {
                        let appName = appActivity.application.localizedDisplayName ?? "Unknown"
                        let bundleId = appActivity.application.bundleIdentifier ?? "unknown"
                        let duration = appActivity.totalActivityDuration

                        if let index = appUsages.firstIndex(where: { $0.bundleId == bundleId }) {
                            appUsages[index].duration += duration
                        } else {
                            appUsages.append(AppUsageData(
                                appName: appName,
                                bundleId: bundleId,
                                duration: duration,
                                token: appActivity.application.token
                            ))
                        }
                    }
                }
            }
        }

        return appUsages.sorted { $0.duration > $1.duration }
    }
}

// MARK: - Settings Summary Report (Compact view for Settings page)

struct SettingsSummaryReport: DeviceActivityReportScene {
    let context: DeviceActivityReport.Context = .settingsSummary

    let content: (SettingsSummaryData) -> SettingsSummaryView

    func makeConfiguration(representing data: DeviceActivityResults<DeviceActivityData>) async -> SettingsSummaryData {
        var totalDuration: TimeInterval = 0
        var appUsages: [AppUsageData] = []
        var notificationCount = 0

        for await activityData in data {
            for await segment in activityData.activitySegments {
                for await categoryActivity in segment.categories {
                    for await appActivity in categoryActivity.applications {
                        let appName = appActivity.application.localizedDisplayName ?? "Unknown"
                        let bundleId = appActivity.application.bundleIdentifier ?? "unknown"
                        let duration = appActivity.totalActivityDuration

                        // Skip system apps
                        if bundleId.hasPrefix("com.apple.family") ||
                           bundleId.hasPrefix("com.apple.ScreenTime") ||
                           bundleId == "com.apple.FamilyControlsAuthentication" {
                            continue
                        }

                        totalDuration += duration
                        notificationCount += appActivity.numberOfNotifications

                        if let index = appUsages.firstIndex(where: { $0.bundleId == bundleId }) {
                            appUsages[index].duration += duration
                        } else {
                            appUsages.append(AppUsageData(
                                appName: appName,
                                bundleId: bundleId,
                                duration: duration,
                                token: appActivity.application.token
                            ))
                        }
                    }
                }
            }
        }

        appUsages.sort { $0.duration > $1.duration }

        // Get pickup count from shared container (if tracked elsewhere)
        let pickups = UserDefaults(suiteName: "group.com.hrynchuk.appblocker")?.integer(forKey: "todayPickups") ?? 0

        return SettingsSummaryData(
            totalDuration: totalDuration,
            pickupCount: pickups,
            notificationCount: notificationCount,
            topApps: Array(appUsages.prefix(5))
        )
    }
}

struct SettingsSummaryData {
    let totalDuration: TimeInterval
    let pickupCount: Int
    let notificationCount: Int
    let topApps: [AppUsageData]
}

// MARK: - Data Models

struct ActivityReport {
    let totalDuration: TimeInterval
    let apps: [AppUsageData]
    let pickupCount: Int
}

struct AppUsageData: Identifiable {
    let id = UUID()
    let appName: String
    let bundleId: String
    var duration: TimeInterval
    let token: ApplicationToken?

    var formattedDuration: String {
        let hours = Int(duration) / 3600
        let minutes = (Int(duration) % 3600) / 60

        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }
}

// MARK: - App Colors (respects system color scheme)

struct ReportColors {
    // Primary accent - emerald green (same in both themes)
    static let primary = Color(red: 16/255, green: 185/255, blue: 129/255) // #10b981

    // MARK: - Accent Color from App Settings
    private static let appGroupId = "group.com.hrynchuk.appblocker"
    private static let accentColorKey = "accentColor"

    // Read saved accent color from App Group
    private static var savedAccentColor: String {
        UserDefaults(suiteName: appGroupId)?.string(forKey: accentColorKey) ?? "blue"
    }

    // Accent color (light variant)
    static var accentColor: Color {
        switch savedAccentColor {
        case "purple": return Color(red: 139/255, green: 92/255, blue: 246/255)
        case "green": return Color(red: 16/255, green: 185/255, blue: 129/255)
        case "orange": return Color(red: 249/255, green: 115/255, blue: 22/255)
        case "pink": return Color(red: 236/255, green: 72/255, blue: 153/255)
        case "red": return Color(red: 239/255, green: 68/255, blue: 68/255)
        case "teal": return Color(red: 20/255, green: 184/255, blue: 166/255)
        case "indigo": return Color(red: 99/255, green: 102/255, blue: 241/255)
        default: return Color(red: 59/255, green: 130/255, blue: 246/255) // blue
        }
    }

    // Accent color (dark variant for gradient)
    static var accentColorDark: Color {
        switch savedAccentColor {
        case "purple": return Color(red: 124/255, green: 58/255, blue: 237/255)
        case "green": return Color(red: 5/255, green: 150/255, blue: 105/255)
        case "orange": return Color(red: 234/255, green: 88/255, blue: 12/255)
        case "pink": return Color(red: 219/255, green: 39/255, blue: 119/255)
        case "red": return Color(red: 220/255, green: 38/255, blue: 38/255)
        case "teal": return Color(red: 13/255, green: 148/255, blue: 136/255)
        case "indigo": return Color(red: 79/255, green: 70/255, blue: 229/255)
        default: return Color(red: 37/255, green: 99/255, blue: 235/255) // blue
        }
    }

    // Accent gradient for charts and progress bars
    static var accentGradient: LinearGradient {
        LinearGradient(
            colors: [accentColor, accentColorDark],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    // Horizontal accent gradient for progress bars
    static var accentGradientHorizontal: LinearGradient {
        LinearGradient(
            colors: [accentColor, accentColorDark],
            startPoint: .leading,
            endPoint: .trailing
        )
    }

    // Dynamic colors that respect system color scheme
    static var background: Color {
        Color(UIColor.systemBackground)
    }

    static var cardBackground: Color {
        Color(UIColor.secondarySystemBackground)
    }

    static var text: Color {
        Color(UIColor.label)
    }

    static var secondaryText: Color {
        Color(UIColor.secondaryLabel)
    }

    static var border: Color {
        Color(UIColor.separator)
    }

    static var barBackground: Color {
        Color(UIColor.tertiarySystemFill)
    }
}

// MARK: - SwiftUI Views

struct TotalActivityView: View {
    let totalActivity: StatsActivityData

    private var maxAppDuration: TimeInterval {
        totalActivity.apps.first?.duration ?? 1
    }

    private var maxDayDuration: TimeInterval {
        totalActivity.thisWeekDays.map(\.duration).max() ?? 1
    }

    private var hasData: Bool {
        totalActivity.thisWeekTotal > 0 || totalActivity.todayDuration > 0
    }

    // Colors matching Home/Blocking pages
    private var cardBg: Color {
        Color(UIColor { traitCollection in
            traitCollection.userInterfaceStyle == .dark
                ? UIColor(white: 1, alpha: 0.05)
                : UIColor(red: 249/255, green: 250/255, blue: 251/255, alpha: 1) // f9fafb
        })
    }

    private var cardBorder: Color {
        Color(UIColor { traitCollection in
            traitCollection.userInterfaceStyle == .dark
                ? UIColor(white: 1, alpha: 0.08)
                : UIColor(white: 0, alpha: 0.04)
        })
    }

    // Use accent color from user settings
    private var accentGradient: LinearGradient {
        ReportColors.accentGradient
    }

    var body: some View {
        if hasData {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 24) {
                    // Week Comparison Card (only if we have last week data)
                    if totalActivity.lastWeekTotal > 0 {
                        weekComparisonCard
                    }

                    // 2x2 Stats Grid
                    statsGrid

                    // Bar Chart / Calendar toggle
                    chartSection

                    // Top Apps
                    topAppsSection
                }
                .padding(.horizontal, 20)
                .padding(.top, 4)
                .padding(.bottom, 100)
            }
            .background(Color.clear)
        } else {
            // Empty state
            VStack(spacing: 20) {
                Spacer()

                Image(systemName: "chart.bar.xaxis")
                    .font(.system(size: 60))
                    .foregroundColor(ReportColors.secondaryText)

                Text(ReportL10n.noData)
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundColor(ReportColors.text)

                Text(ReportL10n.noDataDesc)
                    .font(.system(size: 14))
                    .foregroundColor(ReportColors.secondaryText)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)

                Spacer()
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    // MARK: - Week Comparison Card

    private var weekComparisonCard: some View {
        let improved = totalActivity.weekChange < 0
        let changePercent = abs(Int(totalActivity.weekChange))
        let statusColor = improved ? Color(hex: "10b981") : Color(hex: "ef4444")
        let iconBgOpacity = isDark ? 0.15 : 0.2
        let glowOpacity = isDark ? 0.08 : 0.15

        return VStack(spacing: 0) {
            HStack {
                VStack(alignment: .leading, spacing: 6) {
                    Text(ReportL10n.vsLastWeek)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(ReportColors.secondaryText)
                        .tracking(0.5)

                    HStack(spacing: 10) {
                        // Icon
                        ZStack {
                            RoundedRectangle(cornerRadius: 12)
                                .fill(statusColor.opacity(iconBgOpacity))
                                .frame(width: 40, height: 40)

                            Image(systemName: improved ? "arrow.down.right" : "arrow.up.right")
                                .font(.system(size: 18, weight: .semibold))
                                .foregroundColor(statusColor)
                        }

                        VStack(alignment: .leading, spacing: 2) {
                            Text("\(changePercent)%")
                                .font(.system(size: 28, weight: .heavy))
                                .foregroundColor(statusColor)
                                .tracking(-0.5)

                            Text(improved ? ReportL10n.lessScreenTime : ReportL10n.moreScreenTime)
                                .font(.system(size: 12))
                                .foregroundColor(ReportColors.secondaryText)
                        }
                    }
                }

                Spacer()

                // Mini comparison
                VStack(alignment: .trailing, spacing: 2) {
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(formatHours(totalActivity.thisWeekTotal))
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(ReportColors.text)

                        Text("\(ReportL10n.vs) \(formatHours(totalActivity.lastWeekTotal))")
                            .font(.system(size: 12))
                            .foregroundColor(ReportColors.secondaryText)
                    }

                    let diff = (totalActivity.thisWeekTotal - totalActivity.lastWeekTotal) / 3600
                    Text("\(diff > 0 ? "+" : "")\(Int(diff))h \(ReportL10n.difference)")
                        .font(.system(size: 11))
                        .foregroundColor(ReportColors.secondaryText)
                }
            }
        }
        .padding(20)
        .background(
            ZStack {
                // Glassy base with color tint
                if isDark {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color.white.opacity(0.03))
                } else {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(statusColor.opacity(0.08))
                }

                // Subtle top shine
                VStack {
                    LinearGradient(
                        colors: isDark
                            ? [Color.white.opacity(0.04), Color.clear]
                            : [statusColor.opacity(0.12), Color.clear],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                    .frame(height: 35)
                    Spacer()
                }
                .clipShape(RoundedRectangle(cornerRadius: 16))

                // Bottom glow from status color
                VStack {
                    Spacer()
                    LinearGradient(
                        colors: [statusColor.opacity(glowOpacity), Color.clear],
                        startPoint: .bottom,
                        endPoint: .top
                    )
                    .frame(height: 50)
                }
                .clipShape(RoundedRectangle(cornerRadius: 16))
            }
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(isDark ? Color.white.opacity(0.08) : statusColor.opacity(0.2), lineWidth: 0.5)
        )
        .cornerRadius(16)
    }

    // MARK: - 2x2 Stats Grid

    private var statsGrid: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                StatCardView(
                    title: ReportL10n.totalHours,
                    value: formatHours(totalActivity.thisWeekTotal),
                    cardBg: cardBg,
                    cardBorder: cardBorder
                )

                StatCardView(
                    title: ReportL10n.dailyAvg,
                    value: formatHours(totalActivity.dailyAverage),
                    cardBg: cardBg,
                    cardBorder: cardBorder
                )
            }

            HStack(spacing: 12) {
                // Peak Day
                let peakDay = totalActivity.thisWeekDays.max(by: { $0.duration < $1.duration })

                StatCardView(
                    title: ReportL10n.peakDay,
                    value: peakDay != nil ? ReportL10n.localizedDayName(peakDay!.day) : "--",
                    subtitle: peakDay != nil ? formatHours(peakDay!.duration) : nil,
                    cardBg: cardBg,
                    cardBorder: cardBorder
                )

                // Today
                StatCardView(
                    title: ReportL10n.today,
                    value: formatHours(totalActivity.todayDuration),
                    cardBg: cardBg,
                    cardBorder: cardBorder
                )
            }
        }
    }

    // MARK: - Chart Section

    private var isDark: Bool {
        UITraitCollection.current.userInterfaceStyle == .dark
    }

    private var chartSection: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                HStack(spacing: 10) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 10)
                            .fill(accentGradient)
                            .frame(width: 32, height: 32)

                        Image(systemName: "chart.bar.fill")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.white)
                    }

                    Text(ReportL10n.statsPerDay)
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(ReportColors.text)
                        .tracking(-0.3)
                }

                Spacer()
            }
            .padding(.bottom, 20)

            barChart
        }
        .padding(20)
        .background(
            ZStack {
                // Glassy background
                if isDark {
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Color.white.opacity(0.03))
                } else {
                    RoundedRectangle(cornerRadius: 20)
                        .fill(.ultraThinMaterial)
                }

                // Very subtle top shine
                VStack {
                    LinearGradient(
                        colors: isDark
                            ? [Color.white.opacity(0.04), Color.clear]
                            : [Color.white.opacity(0.3), Color.clear],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                    .frame(height: 35)
                    Spacer()
                }
            }
        )
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }

    // MARK: - Bar Chart

    private var barChart: some View {
        VStack(spacing: 0) {
            // Average line position
            let avgHeight = totalActivity.dailyAverage > 0 && maxDayDuration > 0
                ? CGFloat(totalActivity.dailyAverage / maxDayDuration) * 120
                : 0

            ZStack(alignment: .top) {
                // Average indicator - full width dashed line like RN
                if avgHeight > 0 {
                    VStack {
                        Spacer()
                            .frame(height: 120 - avgHeight)

                        HStack(spacing: 6) {
                            // Dashed line
                            DashedLine()
                                .stroke(
                                    isDark ? Color.white.opacity(0.2) : Color.black.opacity(0.15),
                                    style: StrokeStyle(lineWidth: 1, dash: [4, 3])
                                )
                                .frame(height: 1)

                            // "avg" label
                            Text(ReportL10n.avg)
                                .font(.system(size: 9, weight: .semibold))
                                .foregroundColor(isDark ? Color.white.opacity(0.4) : Color.black.opacity(0.3))
                        }

                        Spacer()
                    }
                    .frame(height: 120)
                }

                // Bars
                HStack(alignment: .bottom, spacing: 8) {
                    ForEach(totalActivity.thisWeekDays) { day in
                        VStack(spacing: 4) {
                            // Bar - palette gradient color
                            let barHeight = maxDayDuration > 0 ? CGFloat(day.duration / maxDayDuration) * 120 : 0

                            RoundedRectangle(cornerRadius: 6)
                                .fill(accentGradient)
                                .frame(height: max(barHeight, 4))

                            // Day label
                            Text(ReportL10n.localizedDayName(day.day))
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundColor(ReportColors.secondaryText)

                            // Hours
                            Text(String(format: "%.1fh", day.hours))
                                .font(.system(size: 10))
                                .foregroundColor(ReportColors.secondaryText.opacity(0.6))
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
                .frame(height: 150)
            }
        }
    }
    // MARK: - Calendar Heatmap

    private var calendarHeatmap: some View {
        VStack(alignment: .leading, spacing: 12) {
            let columns = Array(repeating: GridItem(.flexible(), spacing: 4), count: 7)
            let maxHeatmap = totalActivity.heatmapDays.map(\.duration).max() ?? 1

            LazyVGrid(columns: columns, spacing: 4) {
                ForEach(totalActivity.heatmapDays) { day in
                    let intensity = maxHeatmap > 0 ? day.duration / maxHeatmap : 0
                    RoundedRectangle(cornerRadius: 4)
                        .fill(ReportColors.accentColor.opacity(0.15 + intensity * 0.75))
                        .aspectRatio(1, contentMode: .fit)
                }
            }

            // Legend
            HStack(spacing: 4) {
                Text(ReportL10n.less)
                    .font(.system(size: 10))
                    .foregroundColor(ReportColors.secondaryText)

                ForEach([0.15, 0.35, 0.55, 0.75, 0.9], id: \.self) { opacity in
                    RoundedRectangle(cornerRadius: 2)
                        .fill(ReportColors.accentColor.opacity(opacity))
                        .frame(width: 12, height: 12)
                }

                Text(ReportL10n.more)
                    .font(.system(size: 10))
                    .foregroundColor(ReportColors.secondaryText)

                Spacer()
            }
            .padding(.top, 8)
        }
    }

    // MARK: - Top Apps (Glassy Style)

    private var topAppsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack(spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(accentGradient)
                        .frame(width: 32, height: 32)

                    Image(systemName: "chart.bar.fill")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.white)
                }

                Text(ReportL10n.totalTimePerApp)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(ReportColors.text)
                    .tracking(-0.3)
            }

            if totalActivity.apps.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "app.badge")
                        .font(.system(size: 40))
                        .foregroundColor(ReportColors.secondaryText)
                    Text(ReportL10n.noAppData)
                        .font(.system(size: 14))
                        .foregroundColor(ReportColors.secondaryText)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 40)
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(totalActivity.apps.prefix(8).enumerated()), id: \.element.id) { index, app in
                        StatsAppRow(
                            app: app,
                            maxDuration: maxAppDuration,
                            index: index,
                            isLast: index == min(7, totalActivity.apps.count - 1),
                            cardBg: cardBg,
                            cardBorder: cardBorder
                        )
                    }
                }
                .padding(8)
                .background(
                    ZStack {
                        // Glassy background
                        if isDark {
                            RoundedRectangle(cornerRadius: 20)
                                .fill(Color.white.opacity(0.03))
                        } else {
                            RoundedRectangle(cornerRadius: 20)
                                .fill(.ultraThinMaterial)
                        }

                        // Very subtle top shine
                        VStack {
                            LinearGradient(
                                colors: isDark
                                    ? [Color.white.opacity(0.04), Color.clear]
                                    : [Color.white.opacity(0.3), Color.clear],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                            .frame(height: 35)
                            Spacer()
                        }
                    }
                )
                .clipShape(RoundedRectangle(cornerRadius: 20))
            }
        }
    }

    // MARK: - Helpers

    private func formatHours(_ duration: TimeInterval) -> String {
        let hours = duration / 3600
        if hours >= 1 {
            return String(format: "%.1fh", hours)
        }
        let minutes = Int(duration / 60)
        return "\(minutes)m"
    }

    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration) / 3600
        let minutes = (Int(duration) % 3600) / 60
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        }
        return "\(minutes)m"
    }
}

// MARK: - Dashed Line Shape (for avg line in chart)

struct DashedLine: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: 0, y: rect.midY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.midY))
        return path
    }
}

// MARK: - Stat Card View (Simple style with top shine)

struct StatCardView: View {
    let title: String
    let value: String
    var subtitle: String? = nil
    let cardBg: Color
    let cardBorder: Color

    private var isDark: Bool {
        UITraitCollection.current.userInterfaceStyle == .dark
    }

    // Height depends on whether card has subtitle
    private var cardHeight: CGFloat {
        subtitle != nil ? 90 : 72  // Shorter for first row (no subtitle)
    }

    var body: some View {
        VStack(spacing: 4) {
            Spacer(minLength: 0)

            Text(title.uppercased())
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(ReportColors.secondaryText)
                .tracking(0.5)

            Text(value)
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(ReportColors.text)

            if let subtitle = subtitle {
                Text(subtitle)
                    .font(.system(size: 12))
                    .foregroundColor(ReportColors.secondaryText)
            }

            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity)
        .frame(height: cardHeight)
        .background(
            ZStack {
                // Glassy background
                if isDark {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color.white.opacity(0.03))
                } else {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(.ultraThinMaterial)
                }

                // Very subtle top shine
                VStack {
                    LinearGradient(
                        colors: isDark
                            ? [Color.white.opacity(0.04), Color.clear]
                            : [Color.white.opacity(0.3), Color.clear],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                    .frame(height: 25)
                    Spacer()
                }
            }
        )
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Stats App Row

struct StatsAppRow: View {
    let app: AppUsageData
    let maxDuration: TimeInterval
    let index: Int
    let isLast: Bool
    let cardBg: Color
    let cardBorder: Color

    private var progress: Double {
        guard maxDuration > 0 else { return 0 }
        return min(app.duration / maxDuration, 1.0)
    }

    // Use accent color from user settings
    private var barGradient: LinearGradient {
        ReportColors.accentGradientHorizontal
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                // App Icon
                if let token = app.token {
                    Label(token)
                        .labelStyle(.iconOnly)
                        .scaleEffect(1.3)
                        .frame(width: 44, height: 44)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                } else {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(Color.secondary.opacity(0.2))
                        .frame(width: 44, height: 44)
                        .overlay {
                            Image(systemName: "app.fill")
                                .foregroundColor(.secondary)
                        }
                }

                // App Info
                VStack(alignment: .leading, spacing: 4) {
                    Text(app.appName)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(ReportColors.text)
                        .lineLimit(1)

                    // Progress bar with accent gradient
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 3)
                                .fill(ReportColors.barBackground)
                                .frame(height: 6)

                            RoundedRectangle(cornerRadius: 3)
                                .fill(barGradient)
                                .frame(width: geo.size.width * progress, height: 6)
                        }
                    }
                    .frame(height: 6)
                }

                // Duration
                Text(app.formattedDuration)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(ReportColors.secondaryText)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)

            if !isLast {
                Rectangle()
                    .fill(cardBorder)
                    .frame(height: 0.5)
                    .padding(.leading, 72)
            }
        }
    }
}

// MARK: - Home Compact View (Quick stats + Apps list) - Glassy Style

struct HomeCompactView: View {
    let totalActivity: HomeActivityData

    private var maxAppDuration: TimeInterval {
        totalActivity.apps.first?.duration ?? 1
    }

    // Dynamic colors based on color scheme
    private var isDark: Bool {
        UITraitCollection.current.userInterfaceStyle == .dark
    }

    private var glassyBg: Color {
        Color(UIColor { traitCollection in
            traitCollection.userInterfaceStyle == .dark
                ? UIColor(white: 1, alpha: 0.05)
                : UIColor.white
        })
    }

    private var glassyBorder: Color {
        Color(UIColor { traitCollection in
            traitCollection.userInterfaceStyle == .dark
                ? UIColor(white: 1, alpha: 0.08)
                : UIColor(white: 0, alpha: 0.04)
        })
    }

    // Calculate today's formatted time
    private var todayFormatted: String {
        let hours = Int(totalActivity.todayDuration) / 3600
        let minutes = (Int(totalActivity.todayDuration) % 3600) / 60
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        }
        return "\(minutes)m"
    }

    // Compare today vs week average (passed from report)
    private var vsAverage: (text: String, isLess: Bool) {
        guard totalActivity.weekAverage > 0 else {
            return ("--", true)
        }

        let diff = totalActivity.todayDuration - totalActivity.weekAverage
        let diffMinutes = abs(Int(diff / 60))

        if diffMinutes < 5 {
            return ("~0m", true)
        }

        let hours = diffMinutes / 60
        let mins = diffMinutes % 60
        let formatted = hours > 0 ? "\(hours)h \(mins)m" : "\(mins)m"

        return (formatted, diff < 0)
    }

    // Streak - consecutive days where user completed at least one task in LockIn
    private var currentStreak: Int {
        guard let defaults = UserDefaults(suiteName: "group.com.hrynchuk.appblocker"),
              let completionDates = defaults.stringArray(forKey: "timeBank.taskCompletionDates") else {
            return 0
        }

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let calendar = Calendar.current
        let todayString = formatter.string(from: Date())

        // Convert to Set for fast lookup
        let datesSet = Set(completionDates)

        // Check if today has a completion
        var streak = datesSet.contains(todayString) ? 1 : 0

        // Count consecutive days going backwards
        for dayOffset in 1...60 {
            if let date = calendar.date(byAdding: .day, value: -dayOffset, to: Date()) {
                let dateString = formatter.string(from: date)
                if datesSet.contains(dateString) {
                    streak += 1
                } else {
                    // If today has no completion yet, check if yesterday started the streak
                    if dayOffset == 1 && streak == 0 {
                        continue // Give one day grace - check previous days
                    }
                    break
                }
            }
        }

        return streak
    }

    // MARK: - Body Sub-views

    private var sectionHeader: some View {
        HStack(spacing: 10) {
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(
                        LinearGradient(
                            colors: [Color(hex: "ec4899"), Color(hex: "db2777")],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 28, height: 28)

                Image(systemName: "chart.bar.fill")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.white)
            }

            Text(ReportL10n.topApps)
                .font(.system(size: 15, weight: .bold))
                .foregroundColor(ReportColors.text)

            Spacer()

            Text(ReportL10n.today)
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(ReportColors.secondaryText)
        }
    }

    private var appsListView: some View {
        let strokeColor: Color = isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.06)
        let shadowOpacity: Double = isDark ? 0 : 0.04

        return VStack(spacing: 0) {
            ForEach(Array(totalActivity.apps.prefix(5).enumerated()), id: \.element.id) { index, app in
                GlassyAppRow(
                    app: app,
                    maxDuration: maxAppDuration,
                    index: index,
                    isLast: index == min(4, totalActivity.apps.count - 1)
                )
            }
        }
        .padding(12)
        .background(
            Group {
                if isDark {
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Color.white.opacity(0.03))
                } else {
                    RoundedRectangle(cornerRadius: 20)
                        .fill(.ultraThinMaterial)
                }
            }
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(strokeColor, lineWidth: 0.5)
        )
        .shadow(color: .black.opacity(shadowOpacity), radius: 12, y: 4)
    }

    private var emptyStateView: some View {
        let iconColor: Color = isDark ? Color(hex: "4b5563") : Color(hex: "9ca3af")
        let strokeColor: Color = isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.06)
        let shadowOpacity: Double = isDark ? 0 : 0.04

        return VStack(spacing: 12) {
            Image(systemName: "iphone")
                .font(.system(size: 40))
                .foregroundColor(iconColor)

            Text(ReportL10n.noAppUsage)
                .font(.system(size: 14))
                .foregroundColor(ReportColors.secondaryText)
                .multilineTextAlignment(.center)
        }
        .padding(.vertical, 40)
        .frame(maxWidth: .infinity)
        .background(
            Group {
                if isDark {
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Color.white.opacity(0.03))
                } else {
                    RoundedRectangle(cornerRadius: 20)
                        .fill(.ultraThinMaterial)
                }
            }
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(strokeColor, lineWidth: 0.5)
        )
        .shadow(color: .black.opacity(shadowOpacity), radius: 12, y: 4)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 12) {
                sectionHeader

                if !totalActivity.apps.isEmpty {
                    appsListView
                } else {
                    emptyStateView
                }
            }

            Spacer(minLength: 0)
        }
        .padding(.horizontal, 4)
        .padding(.top, 0)
        .padding(.bottom, 8)
        .frame(maxHeight: .infinity, alignment: .top)
        .background(Color.clear)
        .onAppear {
            saveUsageByName()
        }
    }

    /// Save app usage by name to App Group
    private func saveUsageByName() {
        guard let defaults = UserDefaults(suiteName: "group.com.hrynchuk.appblocker") else { return }

        var usageByName: [String: Double] = [:]
        for app in totalActivity.apps {
            usageByName[app.appName] = app.duration / 60.0
        }

        if let data = try? JSONEncoder().encode(usageByName) {
            defaults.set(data, forKey: "appUsage.byName")
            defaults.set(Date().timeIntervalSince1970, forKey: "appUsage.lastSync")
            defaults.synchronize()
        }
    }

    // Format VS AVG text
    private var vsAverageText: String {
        if totalActivity.weekAverage == 0 {
            return "--"
        }
        return vsAverage.text
    }
}

// MARK: - Home Quick Stat Card (for TODAY, VS AVG, STREAK)

struct HomeQuickStatCard: View {
    let title: String
    let value: String
    var icon: String? = nil
    var emoji: String? = nil
    var iconColor: Color = .white
    var valueColor: Color? = nil
    var glowColor: Color
    let isDark: Bool

    var body: some View {
        VStack(spacing: 6) {
            // Title
            Text(title)
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(isDark ? Color.white.opacity(0.5) : Color(hex: "9ca3af"))
                .tracking(0.5)

            // Value with optional icon/emoji
            HStack(spacing: 4) {
                if let emoji = emoji {
                    Text(emoji)
                        .font(.system(size: 16))
                }
                if let icon = icon {
                    Image(systemName: icon)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(iconColor)
                }
                Text(value)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(valueColor ?? (isDark ? .white : Color(hex: "111827")))
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(
            ZStack {
                // Glassy background
                if isDark {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color.white.opacity(0.05))
                } else {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(.ultraThinMaterial)
                }

                // Subtle glow at bottom
                VStack {
                    Spacer()
                    RoundedRectangle(cornerRadius: 16)
                        .fill(glowColor.opacity(0.1))
                        .frame(height: 20)
                        .blur(radius: 8)
                }
            }
        )
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.04), lineWidth: 0.5)
        )
        .shadow(color: glowColor.opacity(isDark ? 0.15 : 0.1), radius: 8, y: 2)
    }
}

// MARK: - Glassy Stat Box (for Home Compact) - Matches RN GlassStatCard

struct GlassyStatBox: View {
    let title: String
    let value: String
    var icon: String? = nil
    var emoji: String? = nil
    var accentColor: Color = ReportColors.accentColor
    var valueColor: Color? = nil
    var glowColor: Color? = nil

    private var isDark: Bool {
        UITraitCollection.current.userInterfaceStyle == .dark
    }

    private var glassyBorder: Color {
        isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.08)
    }

    var body: some View {
        VStack(spacing: 8) {
            // Title at top
            Text(title)
                .font(.system(size: 10, weight: .semibold))
                .foregroundColor(isDark ? Color.white.opacity(0.5) : Color(hex: "9ca3af"))
                .tracking(0.5)
                .textCase(.uppercase)

            // Icon/Emoji + Value
            HStack(spacing: 6) {
                if let emoji = emoji {
                    Text(emoji)
                        .font(.system(size: 18))
                } else if let icon = icon {
                    Image(systemName: icon)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(valueColor ?? accentColor)
                }

                Text(value)
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(valueColor ?? ReportColors.text)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(
            ZStack {
                // Glassy background
                if isDark {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color.white.opacity(0.06))
                } else {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(.ultraThinMaterial)
                }

                // Optional glow from bottom
                if let glow = glowColor {
                    LinearGradient(
                        colors: [glow.opacity(0.12), Color.clear],
                        startPoint: .bottom,
                        endPoint: .top
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                }
            }
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.06), lineWidth: 0.5)
        )
    }
}

// MARK: - Glassy App Row

struct GlassyAppRow: View {
    let app: AppUsageData
    let maxDuration: TimeInterval
    let index: Int
    let isLast: Bool

    private var isDark: Bool {
        UITraitCollection.current.userInterfaceStyle == .dark
    }

    private var progress: CGFloat {
        CGFloat(app.duration / maxDuration)
    }

    // Use accent color from user settings
    private var barGradient: LinearGradient {
        ReportColors.accentGradientHorizontal
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                // App Icon using Label with token
                if let token = app.token {
                    Label(token)
                        .labelStyle(.iconOnly)
                        .scaleEffect(1.5)
                        .frame(width: 40, height: 40)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                } else {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(isDark ? Color(hex: "374151") : Color(hex: "e5e7eb"))
                        .frame(width: 40, height: 40)
                        .overlay {
                            Image(systemName: "iphone")
                                .font(.system(size: 20))
                                .foregroundColor(isDark ? Color(hex: "9ca3af") : Color(hex: "6b7280"))
                        }
                }

                // App Info
                VStack(alignment: .leading, spacing: 4) {
                    Text(app.appName)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(ReportColors.text)
                        .lineLimit(1)

                    // Progress Bar with accent gradient
                    GeometryReader { geometry in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 2)
                                .fill(isDark ? Color.white.opacity(0.1) : Color(hex: "e2e8f0"))
                                .frame(height: 4)

                            RoundedRectangle(cornerRadius: 2)
                                .fill(barGradient)
                                .frame(width: geometry.size.width * progress, height: 4)
                        }
                    }
                    .frame(height: 4)
                }

                // Duration
                Text(app.formattedDuration)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(isDark ? Color(hex: "9ca3af") : Color(hex: "6b7280"))
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 12)

            // Divider (except for last item)
            if !isLast {
                Rectangle()
                    .fill(isDark ? Color.white.opacity(0.06) : Color.black.opacity(0.08))
                    .frame(height: 1)
                    .padding(.leading, 60)
            }
        }
    }
}

// MARK: - App Row View with Icon - matching app's AppUsageItem style

struct AppRowView: View {
    let app: AppUsageData
    let maxDuration: TimeInterval
    let index: Int
    let isLast: Bool

    private var progress: CGFloat {
        CGFloat(app.duration / maxDuration)
    }

    // Bar colors matching the app's stats screen
    private var barColor: Color {
        switch index {
        case 0: return Color(red: 239/255, green: 68/255, blue: 68/255)   // Red
        case 1: return Color(red: 245/255, green: 158/255, blue: 11/255)  // Orange
        case 2: return Color(red: 59/255, green: 130/255, blue: 246/255)  // Blue
        case 3: return Color(red: 168/255, green: 85/255, blue: 247/255)  // Purple
        case 4: return Color(red: 236/255, green: 72/255, blue: 153/255)  // Pink
        case 5: return Color(red: 20/255, green: 184/255, blue: 166/255)  // Teal
        case 6: return Color(red: 234/255, green: 179/255, blue: 8/255)   // Yellow
        default: return ReportColors.primary
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                // App Icon using Label with token - scaled 1.5x
                if let token = app.token {
                    Label(token)
                        .labelStyle(.iconOnly)
                        .scaleEffect(1.5)
                        .frame(width: 54, height: 54)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                } else {
                    Image(systemName: "app.fill")
                        .font(.system(size: 28))
                        .foregroundColor(ReportColors.secondaryText)
                        .frame(width: 54, height: 54)
                }

                // App Info
                VStack(alignment: .leading, spacing: 4) {
                    Text(app.appName)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(ReportColors.text)
                        .lineLimit(1)

                    // Progress Bar
                    GeometryReader { geometry in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 2)
                                .fill(ReportColors.barBackground)
                                .frame(height: 4)

                            RoundedRectangle(cornerRadius: 2)
                                .fill(barColor)
                                .frame(width: geometry.size.width * progress, height: 4)
                        }
                    }
                    .frame(height: 4)
                }

                // Usage Time
                Text(app.formattedDuration)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(ReportColors.secondaryText)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)

            // Divider (except for last item)
            if !isLast {
                Rectangle()
                    .fill(ReportColors.border)
                    .frame(height: 0.5)
                    .padding(.leading, 78)
            }
        }
    }
}

struct AppActivityView: View {
    let appActivity: [AppUsageData]

    var body: some View {
        // No ScrollView - let parent scroll handle it
        VStack(spacing: 0) {
            ForEach(Array(appActivity.enumerated()), id: \.element.id) { index, app in
                AppRowView(
                    app: app,
                    maxDuration: appActivity.first?.duration ?? 1,
                    index: index,
                    isLast: index == appActivity.count - 1
                )
            }
        }
        .background(ReportColors.cardBackground)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(ReportColors.border, lineWidth: 0.5)
        )
        .cornerRadius(16)
        .padding(16)
        .background(ReportColors.background)
    }
}

// MARK: - Settings Summary View (Compact)

struct SettingsSummaryView: View {
    let summary: SettingsSummaryData

    private var maxAppDuration: TimeInterval {
        summary.topApps.first?.duration ?? 1
    }

    var body: some View {
        VStack(spacing: 16) {
            // Stats Row: Screen Time & Notifications
            HStack(spacing: 12) {
                // Screen Time
                StatCard(
                    icon: "clock.fill",
                    value: formatDuration(summary.totalDuration),
                    label: ReportL10n.screenTime,
                    color: ReportColors.primary
                )

                // Notifications (since iOS doesn't expose pickups)
                StatCard(
                    icon: "bell.fill",
                    value: "\(summary.notificationCount)",
                    label: ReportL10n.notifications,
                    color: Color(red: 249/255, green: 115/255, blue: 22/255)
                )
            }

            // Top Apps Section
            if !summary.topApps.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text(ReportL10n.topApps)
                            .font(.system(size: 15, weight: .bold))
                            .foregroundColor(ReportColors.text)
                        Spacer()
                        Text(ReportL10n.today)
                            .font(.system(size: 12))
                            .foregroundColor(ReportColors.secondaryText)
                    }

                    VStack(spacing: 0) {
                        ForEach(Array(summary.topApps.enumerated()), id: \.element.id) { index, app in
                            CompactAppRow(
                                app: app,
                                maxDuration: maxAppDuration,
                                index: index,
                                isLast: index == summary.topApps.count - 1
                            )
                        }
                    }
                    .background(ReportColors.background.opacity(0.5))
                    .cornerRadius(12)
                }
            }
        }
        .padding(16)
        .background(ReportColors.cardBackground)
        .cornerRadius(16)
    }

    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration) / 3600
        let minutes = (Int(duration) % 3600) / 60

        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }
}

// MARK: - Stat Card for Settings Summary

struct StatCard: View {
    let icon: String
    let value: String
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(color)

                Text(value)
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                    .foregroundColor(ReportColors.text)
            }

            Text(label)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(ReportColors.secondaryText)
                .textCase(.uppercase)
                .tracking(0.3)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(color.opacity(0.1))
        .cornerRadius(12)
    }
}

// MARK: - Compact App Row for Settings

struct CompactAppRow: View {
    let app: AppUsageData
    let maxDuration: TimeInterval
    let index: Int
    let isLast: Bool

    private var progress: CGFloat {
        CGFloat(app.duration / maxDuration)
    }

    private var barColor: Color {
        let colors: [Color] = [
            Color(red: 239/255, green: 68/255, blue: 68/255),
            Color(red: 245/255, green: 158/255, blue: 11/255),
            Color(red: 59/255, green: 130/255, blue: 246/255),
            Color(red: 168/255, green: 85/255, blue: 247/255),
            Color(red: 236/255, green: 72/255, blue: 153/255)
        ]
        return colors[index % colors.count]
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 10) {
                // App Icon
                if let token = app.token {
                    Label(token)
                        .labelStyle(.iconOnly)
                        .frame(width: 32, height: 32)
                        .background(ReportColors.barBackground)
                        .cornerRadius(8)
                } else {
                    Image(systemName: "app.fill")
                        .font(.system(size: 16))
                        .foregroundColor(ReportColors.secondaryText)
                        .frame(width: 32, height: 32)
                        .background(ReportColors.barBackground)
                        .cornerRadius(8)
                }

                // App Name + Progress
                VStack(alignment: .leading, spacing: 3) {
                    Text(app.appName)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(ReportColors.text)
                        .lineLimit(1)

                    GeometryReader { geometry in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 2)
                                .fill(ReportColors.barBackground)
                                .frame(height: 3)

                            RoundedRectangle(cornerRadius: 2)
                                .fill(barColor)
                                .frame(width: geometry.size.width * progress, height: 3)
                        }
                    }
                    .frame(height: 3)
                }

                // Duration
                Text(app.formattedDuration)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(ReportColors.secondaryText)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 10)

            if !isLast {
                Rectangle()
                    .fill(ReportColors.border)
                    .frame(height: 0.5)
                    .padding(.leading, 52)
            }
        }
    }
}

// MARK: - Daily Goal Progress Report (Blocked Apps Only)

struct WeekDayUsage: Identifiable {
    let id = UUID()
    let dayLabel: String
    let percentage: Double  // 0.0 to 1.0
    let isToday: Bool
}

struct DailyGoalProgressData {
    let blockedAppsUsageMinutes: Double  // Total usage of blocked apps today
    let targetMinutes: Int               // Daily goal target
    let topBlockedApps: [AppUsageData]   // Top 3 blocked apps used today
    var weeklyUsage: [WeekDayUsage] = [] // Last 7 days usage percentages

    var progressPercentage: Double {
        guard targetMinutes > 0 else { return 0 }
        return min(1.0, blockedAppsUsageMinutes / Double(targetMinutes))
    }

    var remainingMinutes: Double {
        max(0, Double(targetMinutes) - blockedAppsUsageMinutes)
    }

    var isGoalReached: Bool {
        blockedAppsUsageMinutes >= Double(targetMinutes)
    }

    var formattedUsed: String {
        formatMinutes(Int(blockedAppsUsageMinutes))
    }

    var formattedTarget: String {
        formatMinutes(targetMinutes)
    }

    var formattedRemaining: String {
        let remaining = Int(remainingMinutes)
        if remaining <= 0 { return ReportL10n.goalReached }
        return "\(formatMinutes(remaining))"
    }

    private func formatMinutes(_ minutes: Int) -> String {
        if minutes >= 60 {
            let h = minutes / 60
            let m = minutes % 60
            return m > 0 ? "\(h)h \(m)m" : "\(h)h"
        }
        return "\(minutes)m"
    }
}

struct DailyGoalProgressReport: DeviceActivityReportScene {
    let context: DeviceActivityReport.Context = .dailyGoalProgress

    let content: (DailyGoalProgressData) -> DailyGoalProgressView

    private let appGroupId = "group.com.hrynchuk.appblocker"

    func makeConfiguration(representing data: DeviceActivityResults<DeviceActivityData>) async -> DailyGoalProgressData {
        logger.info("🚀 DailyGoalProgressReport.makeConfiguration() STARTED")

        // DEBUG: Write to UserDefaults so main app can read debug info
        let debugDefaults = UserDefaults(suiteName: appGroupId)
        debugDefaults?.set(Date().timeIntervalSince1970, forKey: "debug.dailyGoalReportLastRun")
        debugDefaults?.set("DailyGoalProgressReport STARTED", forKey: "debug.dailyGoalReportStatus")
        debugDefaults?.synchronize()

        let today = Date()
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let todayString = dateFormatter.string(from: today)
        logger.info("📅 Today string: \(todayString)")

        // Load blocked apps selection from app group
        let blockedTokens = loadBlockedAppTokens()
        logger.info("🔒 Loaded \(blockedTokens.count) blocked tokens")

        // Load app limit names (apps with limits set) - use names for more reliable matching
        let appLimitNames = loadAppLimitNames()
        logger.info("⏱️ Loaded \(appLimitNames.count) app limit names: \(appLimitNames.joined(separator: ", "))")

        // DEBUG: Save app limit names to UserDefaults for debugging
        debugDefaults?.set(appLimitNames, forKey: "debug.appLimitNames")
        debugDefaults?.set(appLimitNames.count, forKey: "debug.appLimitNamesCount")
        debugDefaults?.synchronize()

        var blockedAppsUsage: TimeInterval = 0
        var blockedAppsList: [AppUsageData] = []
        var limitedAppsList: [AppUsageData] = []  // Apps with limits (for usage sync)

        for await activityData in data {
            for await segment in activityData.activitySegments {
                let segmentDateString = dateFormatter.string(from: segment.dateInterval.start)
                guard segmentDateString == todayString else { continue }

                for await categoryActivity in segment.categories {
                    for await appActivity in categoryActivity.applications {
                        let appName = appActivity.application.localizedDisplayName ?? "Unknown"
                        let bundleId = appActivity.application.bundleIdentifier ?? "unknown"
                        let duration = appActivity.totalActivityDuration
                        let token = appActivity.application.token

                        // Skip system apps
                        if bundleId.hasPrefix("com.apple.family") ||
                           bundleId.hasPrefix("com.apple.ScreenTime") ||
                           bundleId == "com.apple.FamilyControlsAuthentication" {
                            continue
                        }

                        // Check if this app is in our blocked list
                        let isBlocked = blockedTokens.contains { $0 == token }

                        // Check if this app has a limit set (match by name, case-insensitive)
                        let appNameLower = appName.lowercased()
                        let hasLimit = appLimitNames.contains { limitName in
                            let limitNameLower = limitName.lowercased()
                            return appNameLower == limitNameLower ||
                                   appNameLower.contains(limitNameLower) ||
                                   limitNameLower.contains(appNameLower)
                        }

                        if isBlocked {
                            blockedAppsUsage += duration

                            if let index = blockedAppsList.firstIndex(where: { $0.bundleId == bundleId }) {
                                blockedAppsList[index].duration += duration
                            } else {
                                blockedAppsList.append(AppUsageData(
                                    appName: appName,
                                    bundleId: bundleId,
                                    duration: duration,
                                    token: token
                                ))
                            }
                        }

                        // Track apps with limits separately for usage sync
                        if hasLimit {
                            if let index = limitedAppsList.firstIndex(where: { $0.bundleId == bundleId }) {
                                limitedAppsList[index].duration += duration
                            } else {
                                limitedAppsList.append(AppUsageData(
                                    appName: appName,
                                    bundleId: bundleId,
                                    duration: duration,
                                    token: token
                                ))
                            }
                            logger.info("📱 App with limit MATCHED: \(appName) = \(String(format: "%.1f", duration / 60.0)) min")
                        }
                    }
                }
            }
        }

        logger.info("📊 After processing: blockedAppsList has \(blockedAppsList.count) apps, limitedAppsList has \(limitedAppsList.count) apps")

        // DEBUG: Save matched limited apps info
        let limitedAppsDebug = limitedAppsList.map { "\($0.appName): \(String(format: "%.1f", $0.duration / 60.0))min" }
        debugDefaults?.set(limitedAppsDebug, forKey: "debug.limitedAppsMatched")
        debugDefaults?.set(limitedAppsList.count, forKey: "debug.limitedAppsCount")
        debugDefaults?.set("Processed \(blockedAppsList.count) blocked, \(limitedAppsList.count) limited", forKey: "debug.dailyGoalReportStatus")
        debugDefaults?.synchronize()

        // Sort by duration and get top 3
        blockedAppsList.sort { $0.duration > $1.duration }
        let topApps = Array(blockedAppsList.prefix(3))

        // Log each blocked app
        for app in blockedAppsList {
            logger.info("📱 Blocked app: \(app.appName) = \(String(format: "%.1f", app.duration / 60.0)) min")
        }

        // Load daily goal target from app group
        let targetMinutes = loadDailyGoalTarget()
        logger.info("🎯 Daily goal target: \(targetMinutes) min")

        // Convert to minutes
        let usedMinutes = blockedAppsUsage / 60.0

        // Save usage to app group for sync with main app
        saveBlockedAppsUsage(minutes: usedMinutes)
        logger.info("💾 Saved blocked apps usage: \(String(format: "%.1f", usedMinutes)) min")

        // Sync per-app usage for App Limits feature (includes both blocked and limited apps)
        // Combine blocked and limited apps, deduplicating by bundleId
        var allTrackedApps = blockedAppsList
        for limitedApp in limitedAppsList {
            if !allTrackedApps.contains(where: { $0.bundleId == limitedApp.bundleId }) {
                allTrackedApps.append(limitedApp)
            }
        }
        logger.info("🔄 Calling syncAppLimitsUsage with \(allTrackedApps.count) apps (blocked + limited)")
        syncAppLimitsUsage(apps: allTrackedApps)

        logger.info("✅ DailyGoalProgressReport.makeConfiguration() COMPLETED")

        return DailyGoalProgressData(
            blockedAppsUsageMinutes: usedMinutes,
            targetMinutes: targetMinutes,
            topBlockedApps: topApps
        )
    }

    /// Save app usage by name to App Group for App Limits feature
    private func syncAppLimitsUsage(apps: [AppUsageData]) {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return }

        // Simple: save all app usage by name
        var usageByName: [String: Double] = [:]
        for app in apps {
            usageByName[app.appName] = app.duration / 60.0
        }

        if let data = try? JSONEncoder().encode(usageByName) {
            defaults.set(data, forKey: "appUsage.byName")
            defaults.set(Date().timeIntervalSince1970, forKey: "appUsage.lastSync")
            defaults.synchronize()
        }
    }

    private func loadBlockedAppTokens() -> Set<ApplicationToken> {
        guard let defaults = UserDefaults(suiteName: appGroupId),
              let data = defaults.data(forKey: "selectedApps") else {
            return []
        }

        do {
            let decoder = PropertyListDecoder()
            let selection = try decoder.decode(FamilyActivitySelection.self, from: data)
            return selection.applicationTokens
        } catch {
            logger.error("Failed to load blocked apps: \(error.localizedDescription)")
            return []
        }
    }

    /// Load app names from app limits (for reliable name-based matching)
    private func loadAppLimitNames() -> [String] {
        guard let defaults = UserDefaults(suiteName: appGroupId),
              let data = defaults.data(forKey: "blocking.appLimits") else {
            logger.info("⚠️ No app limits data found in UserDefaults")
            return []
        }

        // Simplified AppLimit structure for decoding (must match main app's AppLimit)
        struct AppLimitInfo: Codable {
            let id: UUID
            let appTokenData: Data
            var appName: String
            var dailyLimitMinutes: Int
            var usedTodayMinutes: Double?
            var lastResetDate: Date?
            var isLimitEnforced: Bool?
        }

        do {
            let limits = try JSONDecoder().decode([AppLimitInfo].self, from: data)
            let names = limits.map { $0.appName }
            logger.info("✅ Loaded \(limits.count) app limits: \(names.joined(separator: ", "))")
            return names
        } catch {
            logger.error("❌ Failed to decode app limits: \(error.localizedDescription)")
            return []
        }
    }

    private func loadDailyGoalTarget() -> Int {
        guard let defaults = UserDefaults(suiteName: appGroupId),
              let data = defaults.data(forKey: "blocking.dailyGoal") else {
            return 120 // Default 2 hours
        }

        do {
            struct DailyGoalData: Codable {
                var targetMinutes: Int
            }
            let goal = try JSONDecoder().decode(DailyGoalData.self, from: data)
            return goal.targetMinutes
        } catch {
            return 120
        }
    }

    private func saveBlockedAppsUsage(minutes: Double) {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return }

        // Save for main app to read
        defaults.set(minutes, forKey: "dailyGoal.blockedAppsUsageMinutes")
        defaults.set(Date().timeIntervalSince1970, forKey: "dailyGoal.lastUpdatedTimestamp")
        defaults.synchronize()
    }
}

// MARK: - Daily Goal Progress View

struct DailyGoalProgressView: View {
    let goalData: DailyGoalProgressData

    @Environment(\.colorScheme) private var colorScheme
    private var isDark: Bool { colorScheme == .dark }

    // Progress color based on usage percentage
    private var progressColor: Color {
        let pct = goalData.progressPercentage
        if pct >= 0.9 { return Color(hex: "ef4444") }      // Red - danger
        if pct >= 0.7 { return Color(hex: "f59e0b") }      // Orange - warning
        return Color(hex: "10b981")                         // Green - good
    }

    private var progressGradient: [Color] {
        let pct = goalData.progressPercentage
        if pct >= 0.9 { return [Color(hex: "ef4444"), Color(hex: "dc2626")] }
        if pct >= 0.7 { return [Color(hex: "f59e0b"), Color(hex: "d97706")] }
        return [Color(hex: "10b981"), Color(hex: "059669")]
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 20) {
                // Circular Progress Ring
                circularProgress
                    .frame(width: 80, height: 80)

                // Text Content
                VStack(alignment: .leading, spacing: 6) {
                    Text(ReportL10n.todaysProgress)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(isDark ? Color(hex: "9ca3af") : Color(hex: "6b7280"))
                        .tracking(0.5)

                    // Target display
                    Text(goalData.formattedTarget)
                        .font(.system(size: 24, weight: .bold))
                        .foregroundStyle(isDark ? .white : Color(hex: "111827"))

                    // Progress bar
                    progressBar

                    // Used time
                    HStack(spacing: 4) {
                        Text(goalData.formattedUsed)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(progressColor)

                        Text(ReportL10n.used)
                            .font(.system(size: 13))
                            .foregroundStyle(isDark ? Color(hex: "6b7280") : Color(hex: "9ca3af"))

                        Spacer()

                        Text(goalData.formattedRemaining)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(isDark ? Color(hex: "9ca3af") : Color(hex: "6b7280"))
                    }
                }
            }
            .padding(20)
            .background(
                Group {
                    if isDark {
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.white.opacity(0.05))
                    } else {
                        RoundedRectangle(cornerRadius: 16)
                            .fill(.ultraThinMaterial)
                    }
                }
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.04), lineWidth: 0.5)
            )
        }
        .padding(.horizontal, 4)
    }

    // MARK: - Circular Progress

    private var circularProgress: some View {
        ZStack {
            // Background ring
            Circle()
                .stroke(
                    isDark ? Color.white.opacity(0.08) : Color(hex: "e2e8f0"),
                    lineWidth: 8
                )

            // Progress ring
            Circle()
                .trim(from: 0, to: goalData.progressPercentage)
                .stroke(
                    LinearGradient(
                        colors: progressGradient,
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    style: StrokeStyle(lineWidth: 8, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .shadow(color: progressColor.opacity(0.4), radius: 4)

            // Center text
            VStack(spacing: 0) {
                if goalData.isGoalReached {
                    Image(systemName: "flag.checkered")
                        .font(.system(size: 20, weight: .medium))
                        .foregroundStyle(progressColor)
                } else {
                    Text(formatRemainingShort(goalData.remainingMinutes))
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(progressColor)

                    Text(ReportL10n.left)
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(isDark ? Color(hex: "6b7280") : Color(hex: "9ca3af"))
                }
            }
        }
    }

    // MARK: - Progress Bar

    private var progressBar: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                // Background
                RoundedRectangle(cornerRadius: 4)
                    .fill(isDark ? Color.white.opacity(0.08) : Color(hex: "e2e8f0"))

                // Progress
                RoundedRectangle(cornerRadius: 4)
                    .fill(
                        LinearGradient(
                            colors: progressGradient,
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: geometry.size.width * goalData.progressPercentage)
                    .shadow(color: progressColor.opacity(0.5), radius: 4)
            }
        }
        .frame(height: 6)
    }

    private func formatRemainingShort(_ minutes: Double) -> String {
        let mins = Int(minutes)
        if mins >= 60 {
            let h = mins / 60
            let m = mins % 60
            return m > 0 ? "\(h)h\(m)" : "\(h)h"
        }
        return "\(mins)m"
    }
}

// MARK: - Goals Page Progress Report (Full card with stats for Goals page)

struct GoalsPageProgressReport: DeviceActivityReportScene {
    let context: DeviceActivityReport.Context = .goalsPageProgress

    let content: (DailyGoalProgressData) -> GoalsPageProgressView

    private let appGroupId = "group.com.hrynchuk.appblocker"

    func makeConfiguration(representing data: DeviceActivityResults<DeviceActivityData>) async -> DailyGoalProgressData {
        let calendar = Calendar.current
        let today = Date()
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let todayString = dateFormatter.string(from: today)

        let blockedTokens = loadBlockedAppTokens()
        let targetMinutes = loadDailyGoalTarget()

        var blockedAppsUsage: TimeInterval = 0
        var blockedAppsList: [AppUsageData] = []
        var dailyBlockedUsage: [String: TimeInterval] = [:] // date -> blocked usage

        for await activityData in data {
            for await segment in activityData.activitySegments {
                let segmentDate = segment.dateInterval.start
                let segmentDateString = dateFormatter.string(from: segmentDate)

                for await categoryActivity in segment.categories {
                    for await appActivity in categoryActivity.applications {
                        let appName = appActivity.application.localizedDisplayName ?? "Unknown"
                        let bundleId = appActivity.application.bundleIdentifier ?? "unknown"
                        let duration = appActivity.totalActivityDuration
                        let token = appActivity.application.token

                        if bundleId.hasPrefix("com.apple.family") ||
                           bundleId.hasPrefix("com.apple.ScreenTime") ||
                           bundleId == "com.apple.FamilyControlsAuthentication" {
                            continue
                        }

                        let isBlocked = blockedTokens.contains { $0 == token }

                        if isBlocked {
                            // Track daily totals for all days
                            dailyBlockedUsage[segmentDateString, default: 0] += duration

                            // Track today's details
                            if segmentDateString == todayString {
                                blockedAppsUsage += duration

                                if let index = blockedAppsList.firstIndex(where: { $0.bundleId == bundleId }) {
                                    blockedAppsList[index].duration += duration
                                } else {
                                    blockedAppsList.append(AppUsageData(
                                        appName: appName,
                                        bundleId: bundleId,
                                        duration: duration,
                                        token: token
                                    ))
                                }
                            }
                        }
                    }
                }
            }
        }

        // Build weekly usage data (last 7 days)
        let dayLabels = ["S", "M", "T", "W", "T", "F", "S"]
        var weeklyUsage: [WeekDayUsage] = []

        for dayOffset in (0..<7).reversed() {
            let date = calendar.date(byAdding: .day, value: -dayOffset, to: today)!
            let dateString = dateFormatter.string(from: date)
            let weekday = calendar.component(.weekday, from: date) - 1 // 0 = Sunday
            let dayLabel = dayLabels[weekday]
            let isToday = dayOffset == 0

            let usageMinutes = (dailyBlockedUsage[dateString] ?? 0) / 60.0
            let percentage = targetMinutes > 0 ? min(1.0, usageMinutes / Double(targetMinutes)) : 0

            weeklyUsage.append(WeekDayUsage(
                dayLabel: dayLabel,
                percentage: percentage,
                isToday: isToday
            ))
        }

        blockedAppsList.sort { $0.duration > $1.duration }
        let topApps = Array(blockedAppsList.prefix(3))
        let usedMinutes = blockedAppsUsage / 60.0

        saveBlockedAppsUsage(minutes: usedMinutes)

        return DailyGoalProgressData(
            blockedAppsUsageMinutes: usedMinutes,
            targetMinutes: targetMinutes,
            topBlockedApps: topApps,
            weeklyUsage: weeklyUsage
        )
    }

    private func loadBlockedAppTokens() -> Set<ApplicationToken> {
        guard let defaults = UserDefaults(suiteName: appGroupId),
              let data = defaults.data(forKey: "selectedApps") else {
            return []
        }

        do {
            let decoder = PropertyListDecoder()
            let selection = try decoder.decode(FamilyActivitySelection.self, from: data)
            return selection.applicationTokens
        } catch {
            return []
        }
    }

    private func loadDailyGoalTarget() -> Int {
        guard let defaults = UserDefaults(suiteName: appGroupId),
              let data = defaults.data(forKey: "blocking.dailyGoal") else {
            return 120
        }

        do {
            struct DailyGoalData: Codable {
                var targetMinutes: Int
            }
            let goal = try JSONDecoder().decode(DailyGoalData.self, from: data)
            return goal.targetMinutes
        } catch {
            return 120
        }
    }

    private func saveBlockedAppsUsage(minutes: Double) {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return }
        defaults.set(minutes, forKey: "dailyGoal.blockedAppsUsageMinutes")
        defaults.set(Date().timeIntervalSince1970, forKey: "dailyGoal.lastUpdatedTimestamp")
        defaults.synchronize()
    }
}

// MARK: - Goals Page Progress View (Ring LEFT, Bar Chart RIGHT, Stats Row)

// TODO: Restore original GoalsPageProgressView when app limits work properly
// Original design had: Ring LEFT (100x100), Chart RIGHT, Bottom stats row
// New full-page design: Big progress ring in center, stats row, bar chart at bottom

struct GoalsPageProgressView: View {
    let goalData: DailyGoalProgressData

    @Environment(\.colorScheme) private var colorScheme
    private var isDark: Bool { colorScheme == .dark }

    private var progressColor: Color {
        let pct = goalData.progressPercentage
        if pct >= 0.9 { return Color(hex: "ef4444") }
        if pct >= 0.7 { return Color(hex: "f59e0b") }
        return Color(hex: "10b981")
    }

    private var progressGradient: [Color] {
        let pct = goalData.progressPercentage
        if pct >= 0.9 { return [Color(hex: "ef4444"), Color(hex: "dc2626")] }
        if pct >= 0.7 { return [Color(hex: "f59e0b"), Color(hex: "d97706")] }
        return [Color(hex: "10b981"), Color(hex: "059669")]
    }

    var body: some View {
        VStack(spacing: 20) {
            // MAIN: Big Circular Progress Ring in CENTER
            VStack(spacing: 12) {
                ZStack {
                    // Outer glow effect
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [progressColor.opacity(0.15), Color.clear],
                                center: .center,
                                startRadius: 60,
                                endRadius: 120
                            )
                        )
                        .frame(width: 200, height: 200)

                    // Background ring
                    Circle()
                        .stroke(
                            isDark ? Color.white.opacity(0.08) : Color(hex: "e2e8f0"),
                            lineWidth: 16
                        )
                        .frame(width: 160, height: 160)

                    // Progress ring
                    Circle()
                        .trim(from: 0, to: goalData.progressPercentage)
                        .stroke(
                            LinearGradient(
                                colors: progressGradient,
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            style: StrokeStyle(lineWidth: 16, lineCap: .round)
                        )
                        .frame(width: 160, height: 160)
                        .rotationEffect(.degrees(-90))
                        .shadow(color: progressColor.opacity(0.5), radius: 8)

                    // Center content
                    VStack(spacing: 4) {
                        if goalData.isGoalReached {
                            Image(systemName: "flag.checkered")
                                .font(.system(size: 36, weight: .medium))
                                .foregroundStyle(progressColor)
                            Text(ReportL10n.goalReached)
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(progressColor)
                        } else {
                            Text(formatTimeShort(goalData.remainingMinutes))
                                .font(.system(size: 36, weight: .bold))
                                .foregroundStyle(progressColor)

                            Text(ReportL10n.left)
                                .font(.system(size: 14, weight: .medium))
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                // Goal label under ring
                HStack(spacing: 4) {
                    Text(goalData.formattedTarget)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(isDark ? .white : Color(hex: "111827"))
                    Text(ReportL10n.goal)
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(.secondary)
                }
            }
            .padding(.top, 16)

            // Stats Row
            HStack(spacing: 0) {
                // Used
                VStack(spacing: 6) {
                    Text(goalData.formattedUsed)
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(progressColor)

                    Text(ReportL10n.used.capitalized)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)

                Rectangle()
                    .fill(isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.08))
                    .frame(width: 1, height: 44)

                // Remaining
                VStack(spacing: 6) {
                    Text(goalData.formattedRemaining)
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(isDark ? .white : Color(hex: "111827"))

                    Text(ReportL10n.remaining)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)

                Rectangle()
                    .fill(isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.08))
                    .frame(width: 1, height: 44)

                // Percentage
                VStack(spacing: 6) {
                    Text("\(Int(goalData.progressPercentage * 100))%")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(isDark ? .white : Color(hex: "111827"))

                    Text(ReportL10n.ofGoal)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
            }
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(isDark ? Color.white.opacity(0.03) : Color.black.opacity(0.02))
            )
            .padding(.horizontal, 16)

            // Weekly Bar Chart at BOTTOM
            VStack(alignment: .leading, spacing: 12) {
                Text(ReportL10n.thisWeek)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(.secondary)
                    .padding(.leading, 4)

                // Bar chart
                HStack(alignment: .bottom, spacing: 8) {
                    ForEach(goalData.weeklyUsage) { day in
                        VStack(spacing: 6) {
                            // Bar
                            RoundedRectangle(cornerRadius: 6)
                                .fill(
                                    day.isToday
                                        ? LinearGradient(colors: progressGradient, startPoint: .bottom, endPoint: .top)
                                        : LinearGradient(colors: [isDark ? Color.white.opacity(0.15) : Color(hex: "e2e8f0")], startPoint: .bottom, endPoint: .top)
                                )
                                .frame(height: max(6, CGFloat(day.percentage) * 100))

                            // Day label
                            Text(ReportL10n.localizedDayName(day.dayLabel))
                                .font(.system(size: 11, weight: day.isToday ? .bold : .medium))
                                .foregroundStyle(day.isToday ? progressColor : .secondary)
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
                .frame(height: 120, alignment: .bottom)
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 30)
        }
        .background(Color.clear)
    }

    private func formatTimeShort(_ minutes: Double) -> String {
        let mins = Int(minutes)
        if mins >= 60 {
            let h = mins / 60
            let m = mins % 60
            return m > 0 ? "\(h)h\(m)m" : "\(h)h"
        }
        return "\(mins)m"
    }
}

// MARK: - Stats App Usage Report (For Stats Page)

struct StatsAppUsageData {
    let apps: [AppUsageData]
    let totalAppsCount: Int

    var hasData: Bool {
        !apps.isEmpty
    }
}

struct StatsAppUsageReport: DeviceActivityReportScene {
    let context: DeviceActivityReport.Context = .statsAppUsage

    let content: (StatsAppUsageData) -> StatsAppUsageView

    func makeConfiguration(representing data: DeviceActivityResults<DeviceActivityData>) async -> StatsAppUsageData {
        let today = Date()
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let todayString = dateFormatter.string(from: today)

        var todayApps: [AppUsageData] = []

        for await activityData in data {
            for await segment in activityData.activitySegments {
                let segmentDate = segment.dateInterval.start
                let segmentDateString = dateFormatter.string(from: segmentDate)
                let isToday = segmentDateString == todayString

                guard isToday else { continue }

                for await categoryActivity in segment.categories {
                    for await appActivity in categoryActivity.applications {
                        let appName = appActivity.application.localizedDisplayName ?? "Unknown"
                        let bundleId = appActivity.application.bundleIdentifier ?? "unknown"
                        let duration = appActivity.totalActivityDuration

                        // Skip system apps
                        if bundleId.hasPrefix("com.apple.family") ||
                           bundleId.hasPrefix("com.apple.ScreenTime") ||
                           bundleId == "com.apple.FamilyControlsAuthentication" {
                            continue
                        }

                        if let index = todayApps.firstIndex(where: { $0.bundleId == bundleId }) {
                            todayApps[index].duration += duration
                        } else {
                            todayApps.append(AppUsageData(
                                appName: appName,
                                bundleId: bundleId,
                                duration: duration,
                                token: appActivity.application.token
                            ))
                        }
                    }
                }
            }
        }

        // Filter apps with more than 30 seconds of usage and sort by duration
        let filteredApps = todayApps.filter { $0.duration > 30 }.sorted { $0.duration > $1.duration }

        return StatsAppUsageData(
            apps: filteredApps,
            totalAppsCount: filteredApps.count
        )
    }
}

// MARK: - Stats App Usage View (Matching Stats page style)

struct StatsAppUsageView: View {
    let appData: StatsAppUsageData
    @State private var showAllApps = false

    private var isDark: Bool {
        UITraitCollection.current.userInterfaceStyle == .dark
    }

    private var maxAppDuration: TimeInterval {
        appData.apps.first?.duration ?? 1
    }

    private var displayedApps: [AppUsageData] {
        if showAllApps {
            return appData.apps
        }
        return Array(appData.apps.prefix(7))
    }

    private var hasMoreApps: Bool {
        appData.totalAppsCount > 7
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack {
                Text("App Usage")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(ReportColors.text)

                Spacer()
            }
            .padding(.horizontal, 4)

            if appData.hasData {
                // Apps List
                VStack(spacing: 12) {
                    ForEach(Array(displayedApps.enumerated()), id: \.element.id) { index, app in
                        StatsAppUsageRow(
                            app: app,
                            maxDuration: maxAppDuration
                        )
                    }
                }

                // View all apps button (only if more than 7 apps)
                if hasMoreApps {
                    Button {
                        withAnimation(.spring(response: 0.3)) {
                            showAllApps.toggle()
                        }
                    } label: {
                        Text(showAllApps ? "Show less" : "View all apps")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(ReportColors.accentGradient)
                            .clipShape(RoundedRectangle(cornerRadius: 20))
                            .shadow(color: ReportColors.accentColor.opacity(0.3), radius: 20, y: 8)
                            .shadow(color: ReportColors.accentColor.opacity(0.6), radius: 10)
                            .overlay(
                                RoundedRectangle(cornerRadius: 20)
                                    .stroke(Color.white.opacity(0.2), lineWidth: 1)
                            )
                    }
                    .padding(.top, 8)
                }
            } else {
                // Empty state
                VStack(spacing: 12) {
                    Image(systemName: "iphone")
                        .font(.system(size: 40))
                        .foregroundColor(isDark ? Color(hex: "4b5563") : Color(hex: "9ca3af"))

                    Text("No app usage today")
                        .font(.system(size: 14))
                        .foregroundColor(ReportColors.secondaryText)
                        .multilineTextAlignment(.center)
                }
                .padding(.vertical, 40)
                .frame(maxWidth: .infinity)
            }
        }
    }
}

// MARK: - Stats App Usage Row (Matching Stats page design)

struct StatsAppUsageRow: View {
    let app: AppUsageData
    let maxDuration: TimeInterval

    private var isDark: Bool {
        UITraitCollection.current.userInterfaceStyle == .dark
    }

    private var progress: CGFloat {
        CGFloat(app.duration / maxDuration)
    }

    private var barGradient: LinearGradient {
        ReportColors.accentGradientHorizontal
    }

    var body: some View {
        HStack(spacing: 16) {
            // App icon using Label with token (real icon)
            if let token = app.token {
                Label(token)
                    .labelStyle(.iconOnly)
                    .scaleEffect(1.5)
                    .frame(width: 48, height: 48)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            } else {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(isDark ? ReportColors.accentColorDark.opacity(0.3) : ReportColors.accentColor.opacity(0.15))
                        .frame(width: 48, height: 48)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.white.opacity(0.1), lineWidth: 1)
                        )

                    Image(systemName: "app.fill")
                        .font(.system(size: 20))
                        .foregroundColor(ReportColors.accentColor)
                }
            }

            // Name and category
            VStack(alignment: .leading, spacing: 2) {
                Text(app.appName)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(ReportColors.text)
                    .lineLimit(1)

                Text(getCategoryForBundle(app.bundleId).uppercased())
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(ReportColors.secondaryText.opacity(0.7))
                    .tracking(1)
            }

            Spacer()

            // Time and progress
            VStack(alignment: .trailing, spacing: 8) {
                Text(app.formattedDuration)
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundColor(ReportColors.text)

                // Progress bar
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color.white.opacity(0.1))
                        .frame(width: 80, height: 4)

                    RoundedRectangle(cornerRadius: 2)
                        .fill(barGradient)
                        .frame(width: 80 * progress, height: 4)
                        .shadow(color: ReportColors.accentColor.opacity(0.6), radius: 4)
                }
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(isDark ? Color.white.opacity(0.03) : Color.white)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(isDark ? Color.white.opacity(0.05) : Color.black.opacity(0.03), lineWidth: 1)
        )
    }

    // Helper to categorize apps by bundle ID
    private func getCategoryForBundle(_ bundleId: String) -> String {
        let lowered = bundleId.lowercased()
        if lowered.contains("instagram") || lowered.contains("tiktok") || lowered.contains("facebook") || lowered.contains("twitter") || lowered.contains("snapchat") {
            return "Social"
        } else if lowered.contains("youtube") || lowered.contains("netflix") || lowered.contains("spotify") || lowered.contains("music") {
            return "Entertainment"
        } else if lowered.contains("safari") || lowered.contains("chrome") || lowered.contains("firefox") {
            return "Browser"
        } else if lowered.contains("slack") || lowered.contains("teams") || lowered.contains("zoom") || lowered.contains("mail") {
            return "Communication"
        } else if lowered.contains("game") || lowered.contains("games") {
            return "Games"
        } else if lowered.contains("photos") || lowered.contains("camera") {
            return "Photos"
        } else {
            return "App"
        }
    }
}

// MARK: - Color Hex Extension

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

