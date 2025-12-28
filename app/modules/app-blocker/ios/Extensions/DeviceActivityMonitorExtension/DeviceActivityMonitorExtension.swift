import DeviceActivity
import ManagedSettings
import FamilyControls
import Foundation

// App Group for sharing data with main app
private let appGroupId = "group.com.hrynchuk.appblocker"
private let blockedAppsKey = "blockedFamilyActivitySelection"

/// Device Activity Monitor Extension
/// This extension runs in the background and monitors app usage.
/// It applies/removes blocking based on schedules set by the main app.
class DeviceActivityMonitorExtension: DeviceActivityMonitor {

    private let store = ManagedSettingsStore()

    private var sharedDefaults: UserDefaults? {
        UserDefaults(suiteName: appGroupId)
    }

    // MARK: - Schedule Events

    /// Called when a scheduled blocking interval starts
    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)

        print("DeviceActivityMonitor: Interval started for \(activity.rawValue)")

        // Load and apply blocking
        applyBlockingFromSharedData()
    }

    /// Called when a scheduled blocking interval ends
    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)

        print("DeviceActivityMonitor: Interval ended for \(activity.rawValue)")

        // Remove all blocking
        clearBlocking()
    }

    // MARK: - Threshold Events

    /// Called when app usage reaches a defined threshold (e.g., time limit)
    override func eventDidReachThreshold(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
        super.eventDidReachThreshold(event, activity: activity)

        print("DeviceActivityMonitor: Threshold reached for event \(event.rawValue)")

        // Apply blocking when usage limit is reached
        applyBlockingFromSharedData()

        // Send notification
        sendThresholdNotification()
    }

    /// Called when warning threshold is reached (before main threshold)
    override func eventWillReachThresholdWarning(
        _ event: DeviceActivityEvent.Name,
        activity: DeviceActivityName
    ) {
        super.eventWillReachThresholdWarning(event, activity: activity)

        print("DeviceActivityMonitor: Warning - approaching threshold for \(event.rawValue)")

        // Send warning notification
        sendWarningNotification()
    }

    // MARK: - Blocking Logic

    private func applyBlockingFromSharedData() {
        guard let defaults = sharedDefaults,
              let data = defaults.data(forKey: blockedAppsKey) else {
            print("DeviceActivityMonitor: No blocked apps data found")
            return
        }

        do {
            let selection = try PropertyListDecoder().decode(FamilyActivitySelection.self, from: data)

            // Apply shield to applications
            store.shield.applications = selection.applicationTokens
            store.shield.applicationCategories = .specific(selection.categoryTokens)
            store.shield.webDomainCategories = .specific(selection.categoryTokens)

            print("DeviceActivityMonitor: Applied blocking to \(selection.applicationTokens.count) apps")
        } catch {
            print("DeviceActivityMonitor: Failed to decode selection: \(error)")
        }
    }

    private func clearBlocking() {
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        store.shield.webDomainCategories = nil

        print("DeviceActivityMonitor: Cleared all blocking")
    }

    // MARK: - Notifications

    private func sendThresholdNotification() {
        // Note: Extensions have limited notification capabilities
        // This is mainly for logging/debugging
        print("DeviceActivityMonitor: Would send threshold notification")
    }

    private func sendWarningNotification() {
        print("DeviceActivityMonitor: Would send warning notification")
    }
}

// MARK: - Device Activity Name Extension

extension DeviceActivityName {
    static let daily = DeviceActivityName("daily_blocking")
    static let focus = DeviceActivityName("focus_session")
    static let lockIn = DeviceActivityName("lockin_session")
}

// MARK: - Device Activity Event Name Extension

extension DeviceActivityEvent.Name {
    static let screenTimeLimit = DeviceActivityEvent.Name("screen_time_limit")
    static let appLimit = DeviceActivityEvent.Name("app_limit")
}
