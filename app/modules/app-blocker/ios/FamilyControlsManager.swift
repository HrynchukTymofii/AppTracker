import Foundation
import FamilyControls
import ManagedSettings
import DeviceActivity
import UserNotifications

// App Group for sharing data with extensions
private let appGroupId = "group.com.hrynchuk.appblocker"
private let blockedAppsKey = "blockedFamilyActivitySelection"
private let tempUnblockEndKey = "tempUnblockEndTime"

@MainActor
class FamilyControlsManager: ObservableObject {
    static let shared = FamilyControlsManager()

    private let store = ManagedSettingsStore()
    private let center = DeviceActivityCenter()

    // Published selection for SwiftUI binding
    @Published var activitySelection = FamilyActivitySelection() {
        didSet {
            saveSelection()
        }
    }

    // Temp unblock state
    @Published var isTempUnblocked: Bool = false
    private var tempUnblockTimer: Timer?

    var isAuthorized: Bool {
        AuthorizationCenter.shared.authorizationStatus == .approved
    }

    private var sharedDefaults: UserDefaults? {
        UserDefaults(suiteName: appGroupId)
    }

    private init() {
        setupNotifications()
        loadSelection()
        checkTempUnblockStatus()
    }

    // MARK: - Authorization

    func requestAuthorization() async throws {
        try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
    }

    // MARK: - App Blocking with FamilyActivitySelection

    /// Apply blocking using the current activity selection
    func applyBlocking() {
        guard isAuthorized else {
            print("FamilyControls: Not authorized")
            return
        }

        guard !isTempUnblocked else {
            print("FamilyControls: Temp unblocked, skipping")
            return
        }

        // Apply shield to selected applications
        store.shield.applications = activitySelection.applicationTokens
        store.shield.applicationCategories = .specific(activitySelection.categoryTokens)
        store.shield.webDomainCategories = .specific(activitySelection.categoryTokens)

        print("FamilyControls: Applied blocking to \(activitySelection.applicationTokens.count) apps")
    }

    /// Clear all blocking
    func clearBlocking() {
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        store.shield.webDomainCategories = nil
        print("FamilyControls: Cleared all blocking")
    }

    /// Update selection and apply blocking
    func setSelection(_ selection: FamilyActivitySelection) {
        self.activitySelection = selection
        applyBlocking()
    }

    /// Check if any apps are selected for blocking
    var hasBlockedApps: Bool {
        !activitySelection.applicationTokens.isEmpty || !activitySelection.categoryTokens.isEmpty
    }

    /// Get count of blocked apps
    var blockedAppsCount: Int {
        activitySelection.applicationTokens.count
    }

    // MARK: - Temporary Unblock

    func temporaryUnblock(minutes: Int) {
        let endTime = Date().addingTimeInterval(TimeInterval(minutes * 60))
        sharedDefaults?.set(endTime.timeIntervalSince1970, forKey: tempUnblockEndKey)

        isTempUnblocked = true
        clearBlocking()

        // Set timer to re-apply blocking
        tempUnblockTimer?.invalidate()
        tempUnblockTimer = Timer.scheduledTimer(withTimeInterval: TimeInterval(minutes * 60), repeats: false) { [weak self] _ in
            Task { @MainActor in
                self?.endTempUnblock()
            }
        }

        print("FamilyControls: Temp unblocked for \(minutes) minutes")
    }

    func endTempUnblock() {
        sharedDefaults?.removeObject(forKey: tempUnblockEndKey)
        isTempUnblocked = false
        tempUnblockTimer?.invalidate()
        tempUnblockTimer = nil
        applyBlocking()
        print("FamilyControls: Temp unblock ended, blocking re-applied")
    }

    private func checkTempUnblockStatus() {
        guard let endTime = sharedDefaults?.double(forKey: tempUnblockEndKey), endTime > 0 else {
            return
        }

        let endDate = Date(timeIntervalSince1970: endTime)
        if endDate > Date() {
            // Still in temp unblock period
            let remaining = endDate.timeIntervalSince(Date())
            isTempUnblocked = true

            tempUnblockTimer = Timer.scheduledTimer(withTimeInterval: remaining, repeats: false) { [weak self] _ in
                Task { @MainActor in
                    self?.endTempUnblock()
                }
            }
        } else {
            // Temp unblock expired
            sharedDefaults?.removeObject(forKey: tempUnblockEndKey)
        }
    }

    // MARK: - Persistence

    private func saveSelection() {
        guard let defaults = sharedDefaults else { return }

        do {
            let data = try PropertyListEncoder().encode(activitySelection)
            defaults.set(data, forKey: blockedAppsKey)
            print("FamilyControls: Saved selection")
        } catch {
            print("FamilyControls: Failed to save selection: \(error)")
        }
    }

    private func loadSelection() {
        guard let defaults = sharedDefaults,
              let data = defaults.data(forKey: blockedAppsKey) else {
            return
        }

        do {
            activitySelection = try PropertyListDecoder().decode(FamilyActivitySelection.self, from: data)
            print("FamilyControls: Loaded selection with \(activitySelection.applicationTokens.count) apps")
        } catch {
            print("FamilyControls: Failed to load selection: \(error)")
        }
    }

    // MARK: - Device Activity Scheduling

    func scheduleBlocking(startHour: Int, startMinute: Int, endHour: Int, endMinute: Int) {
        let schedule = DeviceActivitySchedule(
            intervalStart: DateComponents(hour: startHour, minute: startMinute),
            intervalEnd: DateComponents(hour: endHour, minute: endMinute),
            repeats: true
        )

        do {
            try center.startMonitoring(.daily, during: schedule)
            print("FamilyControls: Scheduled blocking from \(startHour):\(startMinute) to \(endHour):\(endMinute)")
        } catch {
            print("FamilyControls: Failed to schedule: \(error)")
        }
    }

    func stopScheduledBlocking() {
        center.stopMonitoring([.daily])
        print("FamilyControls: Stopped scheduled blocking")
    }

    // MARK: - Notifications

    private func setupNotifications() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if let error = error {
                print("FamilyControls: Notification auth error: \(error)")
            }
        }
    }

    func showBlockNotification(appName: String) {
        let content = UNMutableNotificationContent()
        content.title = "App Blocked"
        content.body = "\(appName) is currently blocked. Stay focused!"
        content.sound = .default

        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: nil
        )

        UNUserNotificationCenter.current().add(request)
    }
}

// MARK: - Device Activity Name Extension

extension DeviceActivityName {
    static let daily = DeviceActivityName("daily_blocking")
}
