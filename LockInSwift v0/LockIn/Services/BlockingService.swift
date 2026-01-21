import Foundation
import SwiftData
import Observation
import FamilyControls
import ManagedSettings
import DeviceActivity

@Observable
final class BlockingService {
    private let appGroupId = "group.com.hrynchuk.appblocker"

    // Authorization
    var isAuthorized: Bool = false

    // Selected apps from FamilyActivityPicker
    var selectedApps: FamilyActivitySelection = FamilyActivitySelection() {
        didSet {
            saveSelectionToContainer()
        }
    }

    // Temp unblock state
    var tempUnblockEndTime: Date?
    private var tempUnblockTimer: Timer?

    // Managed Settings
    private var store: ManagedSettingsStore { ManagedSettingsStore() }

    init() {
        loadSelectionFromContainer()
        checkAuthorization()
    }

    // MARK: - Authorization

    func checkAuthorization() {
        isAuthorized = AuthorizationCenter.shared.authorizationStatus == .approved
    }

    @MainActor
    func requestAuthorization() async -> Bool {
        do {
            try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
            isAuthorized = AuthorizationCenter.shared.authorizationStatus == .approved
            return isAuthorized
        } catch {
            print("BlockingService: Authorization error - \(error)")
            return false
        }
    }

    // MARK: - Blocking

    /// Apply shields to all selected apps (block them)
    func applyBlocking() {
        guard !selectedApps.applicationTokens.isEmpty || !selectedApps.categoryTokens.isEmpty else {
            return
        }

        store.shield.applications = selectedApps.applicationTokens
        store.shield.applicationCategories = .specific(selectedApps.categoryTokens)
        store.shield.webDomainCategories = .specific(selectedApps.categoryTokens)

        print("BlockingService: Applied shields to \(selectedApps.applicationTokens.count) apps")
    }

    /// Remove all shields (unblock all apps)
    func clearBlocking() {
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        store.shield.webDomainCategories = nil

        print("BlockingService: Cleared all shields")
    }

    /// Check if an app is accessible (not blocked or in unblock window)
    func isAppAccessible(_ appId: String, schedules: [UnblockSchedule], timeBank: TimeBankService) -> Bool {
        // Check if in temp unblock
        if let endTime = tempUnblockEndTime, Date() < endTime {
            return true
        }

        // Check if in any unblock schedule
        for schedule in schedules where schedule.isCurrentlyActive {
            if schedule.appIds.contains(appId) {
                return true
            }
        }

        // Otherwise, app is blocked unless user spends time
        return false
    }

    // MARK: - Temp Unblock

    func startTempUnblock(minutes: Int) {
        clearBlocking()
        tempUnblockEndTime = Date().addingTimeInterval(TimeInterval(minutes * 60))

        tempUnblockTimer?.invalidate()
        tempUnblockTimer = Timer.scheduledTimer(withTimeInterval: TimeInterval(minutes * 60), repeats: false) { [weak self] _ in
            self?.endTempUnblock()
        }

        print("BlockingService: Started temp unblock for \(minutes) minutes")
    }

    func endTempUnblock() {
        tempUnblockTimer?.invalidate()
        tempUnblockTimer = nil
        tempUnblockEndTime = nil
        applyBlocking()

        print("BlockingService: Ended temp unblock")
    }

    var isTempUnblocked: Bool {
        guard let endTime = tempUnblockEndTime else { return false }
        return Date() < endTime
    }

    var tempUnblockRemainingSeconds: Int {
        guard let endTime = tempUnblockEndTime else { return 0 }
        return max(0, Int(endTime.timeIntervalSinceNow))
    }

    // MARK: - Scheduled Blocking

    func createSchedule(name: String, startHour: Int, startMinute: Int, endHour: Int, endMinute: Int, repeats: Bool = true) {
        let center = DeviceActivityCenter()

        let schedule = DeviceActivitySchedule(
            intervalStart: DateComponents(hour: startHour, minute: startMinute),
            intervalEnd: DateComponents(hour: endHour, minute: endMinute),
            repeats: repeats
        )

        do {
            try center.startMonitoring(DeviceActivityName(name), during: schedule)
            print("BlockingService: Created schedule '\(name)'")
        } catch {
            print("BlockingService: Failed to create schedule - \(error)")
        }
    }

    func stopSchedule(name: String) {
        let center = DeviceActivityCenter()
        center.stopMonitoring([DeviceActivityName(name)])
        print("BlockingService: Stopped schedule '\(name)'")
    }

    func getActiveScheduleNames() -> [String] {
        let center = DeviceActivityCenter()
        return center.activities.map { $0.rawValue }
    }

    // MARK: - Persistence

    private func saveSelectionToContainer() {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return }

        do {
            let encoder = PropertyListEncoder()
            let data = try encoder.encode(selectedApps)
            defaults.set(data, forKey: "selectedApps")
            defaults.set(Date(), forKey: "selectionUpdated")
            defaults.synchronize()
        } catch {
            print("BlockingService: Failed to save selection - \(error)")
        }
    }

    private func loadSelectionFromContainer() {
        guard let defaults = UserDefaults(suiteName: appGroupId),
              let data = defaults.data(forKey: "selectedApps") else { return }

        do {
            let decoder = PropertyListDecoder()
            selectedApps = try decoder.decode(FamilyActivitySelection.self, from: data)
        } catch {
            print("BlockingService: Failed to load selection - \(error)")
        }
    }

    // MARK: - Stats

    var blockedAppsCount: Int {
        selectedApps.applicationTokens.count
    }

    var blockedCategoriesCount: Int {
        selectedApps.categoryTokens.count
    }

    var totalBlockedCount: Int {
        blockedAppsCount + blockedCategoriesCount
    }
}
