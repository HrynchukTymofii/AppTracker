import ExpoModulesCore
import UIKit

/**
 iOS Usage Stats Module
 
 IMPORTANT: This requires Apple entitlements for production use:
 - com.apple.developer.family-controls
 - com.apple.developer.device-activity
 
 Request these at: https://developer.apple.com/contact/request/family-controls-distribution
 
 Without entitlements, this module returns mock data.
 After approval, uncomment the FamilyControls/DeviceActivity code.
 */
public class UsageStatsModule: Module {
    public func definition() -> ModuleDefinition {
        Name("UsageStats")
        
        // Check if Screen Time permission is available
        AsyncFunction("hasUsageStatsPermission") { () -> Bool in
            return await self.checkScreenTimePermission()
        }
        
        // Open Screen Time settings
        Function("openUsageStatsSettings") {
            if let url = URL(string: "App-Prefs:SCREEN_TIME") {
                DispatchQueue.main.async {
                    UIApplication.shared.open(url)
                }
            } else if let url = URL(string: UIApplication.openSettingsURLString) {
                DispatchQueue.main.async {
                    UIApplication.shared.open(url)
                }
            }
        }
        
        // Get usage stats (requires entitlements for real data)
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
            return self.getDailyUsage()
        }
        
        AsyncFunction("getInstalledApps") { () -> [[String: String]] in
            return []  // iOS doesn't allow listing installed apps
        }
    }
    
    private func checkScreenTimePermission() async -> Bool {
        // TODO: When entitlements are approved, uncomment:
        // import FamilyControls
        // return AuthorizationCenter.shared.authorizationStatus == .approved
        
        // For now, return false (no permission without entitlements)
        return false
    }
    
    private func getUsageData() async -> [String: Any] {
        // TODO: When entitlements are approved, use DeviceActivity framework:
        /*
        import DeviceActivity
        import ManagedSettings
        
        let store = DeviceActivityReport()
        // Query actual usage data
        */
        
        // Return indicator that real data is not available
        return [
            "hasPermission": false,
            "apps": [] as [[String: Any]],
            "totalScreenTime": 0,
            "pickups": 0,
            "message": "Screen Time API requires Apple entitlements. Request at developer.apple.com"
        ]
    }
    
    private func getDailyUsage() -> [[String: Any]] {
        let days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        return days.map { day in
            return [
                "day": day,
                "hours": 0.0
            ]
        }
    }
}
