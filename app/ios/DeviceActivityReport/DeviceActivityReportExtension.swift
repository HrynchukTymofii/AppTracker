import DeviceActivity
import SwiftUI
import FamilyControls
import ManagedSettings

@main
struct LockInDeviceActivityReport: DeviceActivityReportExtension {
    var body: some DeviceActivityReportScene {
        // Total activity report
        TotalActivityReport { totalActivity in
            TotalActivityView(totalActivity: totalActivity)
        }

        // Per-app activity report
        AppActivityReport { appActivity in
            AppActivityView(appActivity: appActivity)
        }
    }
}

// MARK: - Report Contexts

extension DeviceActivityReport.Context {
    static let totalActivity = Self("TotalActivity")
    static let appActivity = Self("AppActivity")
}

// MARK: - Total Activity Report

struct TotalActivityReport: DeviceActivityReportScene {
    let context: DeviceActivityReport.Context = .totalActivity

    let content: (ActivityReport) -> TotalActivityView

    func makeConfiguration(representing data: DeviceActivityResults<DeviceActivityData>) async -> ActivityReport {
        var totalDuration: TimeInterval = 0
        var appUsages: [AppUsageData] = []

        for await activityData in data {
            // Iterate through segments to calculate total duration
            for await segment in activityData.activitySegments {
                for await categoryActivity in segment.categories {
                    for await appActivity in categoryActivity.applications {
                        let appName = appActivity.application.localizedDisplayName ?? "Unknown"
                        let bundleId = appActivity.application.bundleIdentifier ?? "unknown"
                        let duration = appActivity.totalActivityDuration

                        totalDuration += duration

                        // Find existing or create new
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

        // Sort by duration descending
        appUsages.sort { $0.duration > $1.duration }

        // Save to shared container for main app to access
        saveToSharedContainer(totalDuration: totalDuration, apps: appUsages)

        return ActivityReport(
            totalDuration: totalDuration,
            apps: appUsages,
            pickupCount: 0
        )
    }

    private func saveToSharedContainer(totalDuration: TimeInterval, apps: [AppUsageData]) {
        let defaults = UserDefaults(suiteName: "group.com.hrynchuk.appblocker")

        // Save total screen time
        defaults?.set(totalDuration, forKey: "totalScreenTime")
        defaults?.set(Date(), forKey: "lastUpdated")

        // Save app data as JSON
        let appData = apps.map { app in
            [
                "appName": app.appName,
                "bundleId": app.bundleId,
                "duration": app.duration
            ] as [String: Any]
        }

        if let jsonData = try? JSONSerialization.data(withJSONObject: appData) {
            defaults?.set(jsonData, forKey: "appUsageData")
        }
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

// MARK: - SwiftUI Views

struct TotalActivityView: View {
    let totalActivity: ActivityReport

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Total screen time header
            VStack(alignment: .leading, spacing: 4) {
                Text("Screen Time Today")
                    .font(.headline)
                    .foregroundColor(.secondary)

                Text(formatDuration(totalActivity.totalDuration))
                    .font(.system(size: 34, weight: .bold))
            }
            .padding()

            // App list
            if !totalActivity.apps.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Apps")
                        .font(.headline)
                        .padding(.horizontal)

                    ForEach(totalActivity.apps.prefix(10)) { app in
                        HStack {
                            Label(app.appName, systemImage: "app.fill")
                            Spacer()
                            Text(app.formattedDuration)
                                .foregroundColor(.secondary)
                        }
                        .padding(.horizontal)
                        .padding(.vertical, 4)
                    }
                }
            }
        }
    }

    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration) / 3600
        let minutes = (Int(duration) % 3600) / 60

        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes) min"
        }
    }
}

struct AppActivityView: View {
    let appActivity: [AppUsageData]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(appActivity) { app in
                HStack {
                    Label(app.appName, systemImage: "app.fill")
                    Spacer()
                    Text(app.formattedDuration)
                        .foregroundColor(.secondary)
                }
                .padding(.vertical, 4)
            }
        }
        .padding()
    }
}
