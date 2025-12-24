import ExpoModulesCore
import UIKit
import FamilyControls
import DeviceActivity
import ManagedSettings

/// iOS Usage Stats Module
/// Uses Family Controls and Device Activity frameworks for screen time data.
/// Requires: com.apple.developer.family-controls entitlement
public class UsageStatsModule: Module {
    private let authCenter = AuthorizationCenter.shared

    public func definition() -> ModuleDefinition {
        Name("UsageStats")

        // Check if Screen Time permission is available
        AsyncFunction("hasUsageStatsPermission") { () -> Bool in
            return self.authCenter.authorizationStatus == .approved
        }

        // Request Screen Time permission
        AsyncFunction("requestPermission") { (promise: Promise) in
            Task {
                do {
                    try await self.authCenter.requestAuthorization(for: .individual)
                    promise.resolve(true)
                } catch {
                    promise.resolve(false)
                }
            }
        }

        // Open Screen Time settings
        Function("openUsageStatsSettings") {
            DispatchQueue.main.async {
                // Try to open Screen Time settings directly
                if let url = URL(string: "App-Prefs:SCREEN_TIME") {
                    if UIApplication.shared.canOpenURL(url) {
                        UIApplication.shared.open(url)
                        return
                    }
                }
                // Fallback to general settings
                if let url = URL(string: UIApplication.openSettingsURLString) {
                    UIApplication.shared.open(url)
                }
            }
        }

        // Get usage stats
        AsyncFunction("getUsageStats") { (startTime: Double, endTime: Double) -> [String: Any] in
            return await self.getUsageData()
        }

        AsyncFunction("getTodayUsageStats") { () -> [String: Any] in
            return await self.getUsageData()
        }

        AsyncFunction("getWeekUsageStats") { (weekOffset: Int) -> [String: Any] in
            return await self.getUsageData()
        }

        AsyncFunction("getDailyUsageForWeek") { (weekOffset: Int) -> [[String: Any]] in
            return self.getMockDailyUsage()
        }

        AsyncFunction("getInstalledApps") { () -> [[String: String]] in
            // iOS doesn't allow listing installed apps for privacy
            return []
        }

        // Get authorization status
        Function("getAuthorizationStatus") { () -> String in
            switch self.authCenter.authorizationStatus {
            case .notDetermined:
                return "notDetermined"
            case .denied:
                return "denied"
            case .approved:
                return "approved"
            @unknown default:
                return "unknown"
            }
        }
    }

    // MARK: - Usage Data

    private func getUsageData() async -> [String: Any] {
        let isAuthorized = authCenter.authorizationStatus == .approved

        if !isAuthorized {
            return [
                "hasPermission": false,
                "apps": [] as [[String: Any]],
                "totalScreenTime": 0,
                "pickups": 0,
                "message": "Screen Time permission not granted"
            ]
        }

        // When authorized, we can access device activity data
        // Note: Detailed per-app usage data requires DeviceActivityReport extension
        // The main app can access aggregate data

        return [
            "hasPermission": true,
            "apps": [] as [[String: Any]], // Per-app data requires report extension
            "totalScreenTime": 0, // Would be populated from DeviceActivityReport
            "pickups": 0, // Would be populated from DeviceActivityReport
            "message": "Use DeviceActivityReport extension for detailed usage data"
        ]
    }

    // MARK: - Mock Data

    private func getMockDailyUsage() -> [[String: Any]] {
        let days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        return days.map { day in
            [
                "day": day,
                "hours": 0.0
            ]
        }
    }
}

// MARK: - Device Activity Report Extension Data Source
// Note: This would be implemented in a separate DeviceActivityReportExtension target
// to provide detailed per-app usage data to the main app.

/*
 To get real usage data, you need to create a DeviceActivityReportExtension that implements:

 import DeviceActivity
 import SwiftUI

 struct UsageReport: DeviceActivityReportScene {
     let context: DeviceActivityReport.Context = .init(rawValue: "UsageReport")

     let content: (DeviceActivityResults<DeviceActivityData>) -> AnyView

     func makeConfiguration(representing data: DeviceActivityResults<DeviceActivityData>) async -> DeviceActivityReportConfiguration {
         // Parse usage data here
         let apps = data.flatMap { $0.activitySegments }
         // Calculate screen time, pickups, etc.
         return DeviceActivityReportConfiguration()
     }
 }
 */
