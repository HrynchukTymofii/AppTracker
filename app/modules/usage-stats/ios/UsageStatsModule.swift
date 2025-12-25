import ExpoModulesCore
import UIKit
import FamilyControls
import DeviceActivity
import ManagedSettings

/// iOS Usage Stats Module
/// Uses Family Controls and Device Activity frameworks for screen time data.
/// Requires: com.apple.developer.family-controls entitlement
public class UsageStatsModule: Module {
    @available(iOS 16.0, *)
    private var authCenter: AuthorizationCenter {
        return AuthorizationCenter.shared
    }

    public func definition() -> ModuleDefinition {
        Name("UsageStats")

        // Check if Screen Time permission is available
        AsyncFunction("hasUsageStatsPermission") { () -> Bool in
            if #available(iOS 16.0, *) {
                return self.authCenter.authorizationStatus == .approved
            }
            return false
        }

        // Request Screen Time permission
        AsyncFunction("requestPermission") { (promise: Promise) in
            if #available(iOS 16.0, *) {
                Task {
                    do {
                        try await self.authCenter.requestAuthorization(for: .individual)
                        promise.resolve(true)
                    } catch {
                        print("UsageStats: Authorization error - \(error)")
                        promise.resolve(false)
                    }
                }
            } else {
                promise.resolve(false)
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
            if #available(iOS 16.0, *) {
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
            return "unavailable"
        }
    }

    // MARK: - Usage Data

    private func getUsageData() async -> [String: Any] {
        if #available(iOS 16.0, *) {
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

            return [
                "hasPermission": true,
                "apps": [] as [[String: Any]],
                "totalScreenTime": 0,
                "pickups": 0,
                "message": "Use DeviceActivityReport extension for detailed usage data"
            ]
        }

        return [
            "hasPermission": false,
            "apps": [] as [[String: Any]],
            "totalScreenTime": 0,
            "pickups": 0,
            "message": "Family Controls requires iOS 16.0 or newer"
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
