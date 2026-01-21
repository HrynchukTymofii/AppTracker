import Foundation
import SwiftUI
import Observation

/// Reads cached screen time data from the shared App Group container
/// Data is written by the DeviceActivityReport extension
@Observable
final class ScreenTimeDataService {
    private let appGroupID = "group.com.hrynchuk.appblocker"

    // MARK: - Published Data

    var totalScreenTimeToday: TimeInterval = 0
    var lastUpdated: Date?
    var topApps: [CachedAppUsage] = []
    var weeklyData: [CachedDailyUsage] = []

    // MARK: - Computed Properties

    var formattedTotalTime: String {
        formatDuration(totalScreenTimeToday)
    }

    var formattedLastUpdated: String {
        guard let date = lastUpdated else { return "Never" }
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }

    var hasData: Bool {
        totalScreenTimeToday > 0 || !topApps.isEmpty
    }

    // MARK: - Init

    init() {
        loadCachedData()
    }

    // MARK: - Public Methods

    /// Reload data from shared container
    func refresh() {
        loadCachedData()
    }

    // MARK: - Private Methods

    private func loadCachedData() {
        // First try to load from shared file (more reliable cross-process)
        if loadFromSharedFile() {
            print("ScreenTimeDataService: Loaded from shared file")
            return
        }

        // Fallback to UserDefaults
        guard let defaults = UserDefaults(suiteName: appGroupID) else {
            print("ScreenTimeDataService: Failed to access App Group")
            return
        }

        // Load total screen time
        totalScreenTimeToday = defaults.double(forKey: "totalScreenTime")

        // Load last updated
        lastUpdated = defaults.object(forKey: "lastUpdated") as? Date

        // Load app usage data
        if let jsonData = defaults.data(forKey: "appUsageData"),
           let appArray = try? JSONSerialization.jsonObject(with: jsonData) as? [[String: Any]] {
            topApps = appArray.compactMap { dict -> CachedAppUsage? in
                guard let appName = dict["appName"] as? String,
                      let bundleId = dict["bundleId"] as? String,
                      let duration = dict["duration"] as? TimeInterval else {
                    return nil
                }
                return CachedAppUsage(
                    appName: appName,
                    bundleId: bundleId,
                    duration: duration
                )
            }
        }

        // Load weekly data
        if let jsonData = defaults.data(forKey: "dailyUsageData"),
           let weekArray = try? JSONSerialization.jsonObject(with: jsonData) as? [[String: Any]] {
            weeklyData = weekArray.compactMap { dict -> CachedDailyUsage? in
                guard let day = dict["day"] as? String,
                      let hours = dict["hours"] as? Double else {
                    return nil
                }
                return CachedDailyUsage(day: day, hours: hours)
            }
        }

        print("ScreenTimeDataService: Loaded from UserDefaults - Total: \(formattedTotalTime), Apps: \(topApps.count), Updated: \(formattedLastUpdated)")
    }

    private func loadFromSharedFile() -> Bool {
        guard let containerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupID) else {
            print("ScreenTimeDataService: Failed to get App Group container URL")
            return false
        }

        let fileURL = containerURL.appendingPathComponent("screenTimeData.json")

        guard FileManager.default.fileExists(atPath: fileURL.path) else {
            print("ScreenTimeDataService: No shared file found at \(fileURL.path)")
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
            }

            // Parse apps
            if let appsArray = json["apps"] as? [[String: Any]] {
                topApps = appsArray.compactMap { dict -> CachedAppUsage? in
                    guard let appName = dict["appName"] as? String,
                          let bundleId = dict["bundleId"] as? String,
                          let duration = dict["duration"] as? TimeInterval else {
                        return nil
                    }
                    return CachedAppUsage(appName: appName, bundleId: bundleId, duration: duration)
                }
            }

            print("ScreenTimeDataService: Loaded from file - Total: \(formattedTotalTime), Apps: \(topApps.count)")
            return totalScreenTimeToday > 0 || !topApps.isEmpty

        } catch {
            print("ScreenTimeDataService: Failed to read shared file: \(error)")
            return false
        }
    }

    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration) / 3600
        let minutes = (Int(duration) % 3600) / 60

        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else if minutes > 0 {
            return "\(minutes)m"
        } else {
            return "0m"
        }
    }
}

// MARK: - Data Models

struct CachedAppUsage: Identifiable {
    let id = UUID()
    let appName: String
    let bundleId: String
    let duration: TimeInterval

    var formattedDuration: String {
        let hours = Int(duration) / 3600
        let minutes = (Int(duration) % 3600) / 60

        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }

    /// Get app icon color based on bundle ID hash
    var iconColor: Color {
        let colors: [Color] = [
            Color(red: 239/255, green: 68/255, blue: 68/255),   // Red
            Color(red: 245/255, green: 158/255, blue: 11/255),  // Orange
            Color(red: 59/255, green: 130/255, blue: 246/255),  // Blue
            Color(red: 168/255, green: 85/255, blue: 247/255),  // Purple
            Color(red: 236/255, green: 72/255, blue: 153/255),  // Pink
            Color(red: 16/255, green: 185/255, blue: 129/255),  // Green
            Color(red: 20/255, green: 184/255, blue: 166/255),  // Teal
        ]
        let hash = abs(bundleId.hashValue)
        return colors[hash % colors.count]
    }
}

struct CachedDailyUsage: Identifiable {
    let id = UUID()
    let day: String
    let hours: Double

    var formattedHours: String {
        if hours >= 1 {
            return String(format: "%.1fh", hours)
        } else {
            return "\(Int(hours * 60))m"
        }
    }
}
