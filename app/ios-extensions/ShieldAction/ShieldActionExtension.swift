import DeviceActivity
import Foundation
import ManagedSettings
import os.log

/// Handles user interactions with the shield (blocking screen)
class ShieldActionExtension: ShieldActionDelegate {

    let store = ManagedSettingsStore()

    override func handle(action: ShieldAction, for application: ApplicationToken, completionHandler: @escaping (ShieldActionResponse) -> Void) {
        switch action {
        case .primaryButtonPressed:
            temporarilyUnblock(minutes: 5)
            completionHandler(.close)

        case .secondaryButtonPressed:
            completionHandler(.close)

        @unknown default:
            completionHandler(.close)
        }
    }

    override func handle(action: ShieldAction, for webDomain: WebDomainToken, completionHandler: @escaping (ShieldActionResponse) -> Void) {
        switch action {
        case .primaryButtonPressed:
            temporarilyUnblock(minutes: 5)
            completionHandler(.close)

        case .secondaryButtonPressed:
            completionHandler(.close)

        @unknown default:
            completionHandler(.close)
        }
    }

    override func handle(action: ShieldAction, for category: ActivityCategoryToken, completionHandler: @escaping (ShieldActionResponse) -> Void) {
        switch action {
        case .primaryButtonPressed:
            temporarilyUnblock(minutes: 5)
            completionHandler(.close)

        case .secondaryButtonPressed:
            completionHandler(.close)

        @unknown default:
            completionHandler(.close)
        }
    }

    // MARK: - Private Methods

    private func temporarilyUnblock(minutes: Int) {
        // Clear shields temporarily
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        store.shield.webDomainCategories = nil

        // Save unblock end time to shared container
        let defaults = UserDefaults(suiteName: "group.com.hrynchuk.appblocker")
        let endTime = Date().addingTimeInterval(TimeInterval(minutes * 60))
        defaults?.set(endTime, forKey: "tempUnblockEndTime")
    }
}
