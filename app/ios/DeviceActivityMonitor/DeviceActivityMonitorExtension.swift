import Foundation
import DeviceActivity
import ManagedSettings
import FamilyControls

/// Extension that monitors device activity and enforces app blocking
class DeviceActivityMonitorExtension: DeviceActivityMonitor {

    let store = ManagedSettingsStore()

    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)

        // When a scheduled interval starts, apply the shields
        if let selection = loadSelection() {
            store.shield.applications = selection.applicationTokens
            store.shield.applicationCategories = .specific(selection.categoryTokens)
            store.shield.webDomainCategories = .specific(selection.categoryTokens)
        }
    }

    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)

        // When interval ends, remove shields
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        store.shield.webDomainCategories = nil
    }

    override func eventDidReachThreshold(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
        super.eventDidReachThreshold(event, activity: activity)

        // When usage threshold is reached, apply shields
        if let selection = loadSelection() {
            store.shield.applications = selection.applicationTokens
            store.shield.applicationCategories = .specific(selection.categoryTokens)
        }
    }

    override func intervalWillStartWarning(for activity: DeviceActivityName) {
        super.intervalWillStartWarning(for: activity)
    }

    override func intervalWillEndWarning(for activity: DeviceActivityName) {
        super.intervalWillEndWarning(for: activity)
    }

    override func eventWillReachThresholdWarning(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
        super.eventWillReachThresholdWarning(event, activity: activity)
    }

    // MARK: - Shared Data

    private func loadSelection() -> FamilyActivitySelection? {
        let defaults = UserDefaults(suiteName: "group.com.hrynchuk.appblocker")
        guard let data = defaults?.data(forKey: "selectedApps") else { return nil }

        do {
            let decoder = PropertyListDecoder()
            let selection = try decoder.decode(FamilyActivitySelection.self, from: data)
            return selection
        } catch {
            return nil
        }
    }
}
