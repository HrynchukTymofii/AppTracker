import ManagedSettingsUI
import ManagedSettings
import FamilyControls
import Foundation

// App Group for sharing data with main app
private let appGroupId = "group.com.hrynchuk.appblocker"
private let tempUnblockEndKey = "tempUnblockEndTime"
private let blockedAppsKey = "blockedFamilyActivitySelection"

/// Shield Action Extension
/// Handles user interactions with the blocking screen buttons.
class ShieldActionExtension: ShieldActionDelegate {

    private let store = ManagedSettingsStore()

    private var sharedDefaults: UserDefaults? {
        UserDefaults(suiteName: appGroupId)
    }

    // MARK: - Handle Application Shield Actions

    override func handle(
        action: ShieldAction,
        for application: Application,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        switch action {
        case .primaryButtonPressed:
            // "Unlock for 15 min" pressed
            handleTempUnlock(completionHandler: completionHandler)

        case .secondaryButtonPressed:
            // "Close" pressed
            completionHandler(.close)

        @unknown default:
            completionHandler(.close)
        }
    }

    // MARK: - Handle Application Category Shield Actions

    override func handle(
        action: ShieldAction,
        for category: ActivityCategory,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        switch action {
        case .primaryButtonPressed:
            handleTempUnlock(completionHandler: completionHandler)

        case .secondaryButtonPressed:
            completionHandler(.close)

        @unknown default:
            completionHandler(.close)
        }
    }

    // MARK: - Handle Web Domain Shield Actions

    override func handle(
        action: ShieldAction,
        for webDomain: WebDomain,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        switch action {
        case .primaryButtonPressed:
            handleTempUnlock(completionHandler: completionHandler)

        case .secondaryButtonPressed:
            completionHandler(.close)

        @unknown default:
            completionHandler(.close)
        }
    }

    // MARK: - Handle Web Domain Category Shield Actions

    override func handle(
        action: ShieldAction,
        for category: ActivityCategory,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        switch action {
        case .primaryButtonPressed:
            handleTempUnlock(completionHandler: completionHandler)

        case .secondaryButtonPressed:
            completionHandler(.close)

        @unknown default:
            completionHandler(.close)
        }
    }

    // MARK: - Temp Unlock Logic

    private func handleTempUnlock(completionHandler: @escaping (ShieldActionResponse) -> Void) {
        // Set temp unblock end time (15 minutes from now)
        let tempUnlockMinutes = 15
        let endTime = Date().addingTimeInterval(TimeInterval(tempUnlockMinutes * 60))
        sharedDefaults?.set(endTime.timeIntervalSince1970, forKey: tempUnblockEndKey)

        // Clear blocking temporarily
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        store.shield.webDomainCategories = nil

        print("ShieldAction: Temp unblocked for \(tempUnlockMinutes) minutes")

        // Note: The main app's FamilyControlsManager should handle re-applying
        // blocking after the temp unblock period expires.
        // The DeviceActivityMonitor extension will also re-apply on next schedule event.

        // Defer means the app will open (temp unblock successful)
        completionHandler(.defer)
    }
}
