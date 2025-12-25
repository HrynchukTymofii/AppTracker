import ExpoModulesCore
import UIKit
import FamilyControls
import ManagedSettings
import DeviceActivity
import SwiftUI

/// iOS App Blocker Module using Family Controls
/// Requires: com.apple.developer.family-controls entitlement
public class AppBlockerModule: Module {
    @available(iOS 16.0, *)
    private var authCenter: AuthorizationCenter {
        return AuthorizationCenter.shared
    }

    @available(iOS 16.0, *)
    private var store: ManagedSettingsStore {
        return ManagedSettingsStore()
    }

    // Store the selected apps/categories (iOS 16+)
    private var _selectedApps: Any?

    @available(iOS 16.0, *)
    private var selectedApps: FamilyActivitySelection {
        get {
            return (_selectedApps as? FamilyActivitySelection) ?? FamilyActivitySelection()
        }
        set {
            _selectedApps = newValue
        }
    }

    // Temp unblock state
    private var tempUnblockEndTime: Date?
    private var tempUnblockTimer: Timer?

    public func definition() -> ModuleDefinition {
        Name("AppBlocker")

        // MARK: - Authorization

        /// Request Family Controls authorization
        AsyncFunction("requestAuthorization") { (promise: Promise) in
            if #available(iOS 16.0, *) {
                Task { @MainActor in
                    do {
                        try await self.authCenter.requestAuthorization(for: .individual)
                        promise.resolve(self.authCenter.authorizationStatus == .approved)
                    } catch {
                        print("AppBlocker: Authorization error - \(error)")
                        promise.resolve(false)
                    }
                }
            } else {
                promise.resolve(false)
            }
        }

        /// Check if Family Controls is authorized
        Function("isAuthorized") { () -> Bool in
            if #available(iOS 16.0, *) {
                return self.authCenter.authorizationStatus == .approved
            }
            return false
        }

        /// Check accessibility service (iOS uses Family Controls instead)
        AsyncFunction("isAccessibilityServiceEnabled") { () -> Bool in
            if #available(iOS 16.0, *) {
                return self.authCenter.authorizationStatus == .approved
            }
            return false
        }

        /// Open accessibility settings (redirects to Screen Time on iOS)
        Function("openAccessibilitySettings") {
            self.openScreenTimeSettings()
        }

        /// Check overlay permission (always true on iOS, uses shield instead)
        AsyncFunction("hasOverlayPermission") { () -> Bool in
            return true
        }

        /// Open overlay settings (not applicable on iOS)
        Function("openOverlaySettings") {
            self.openScreenTimeSettings()
        }

        // MARK: - App Picker

        /// Show FamilyActivityPicker to select apps to block
        AsyncFunction("showAppPicker") { (promise: Promise) in
            if #available(iOS 16.0, *) {
                DispatchQueue.main.async {
                    self.presentAppPicker(promise: promise)
                }
            } else {
                promise.resolve(nil)
            }
        }

        // MARK: - Blocking Controls

        /// Apply blocking to selected apps
        Function("applyBlocking") {
            if #available(iOS 16.0, *) {
                self.applyShield()
            }
        }

        /// Clear all blocking
        Function("clearBlocking") {
            if #available(iOS 16.0, *) {
                self.clearShield()
            }
        }

        /// Get count of blocked apps
        AsyncFunction("getBlockedAppsCount") { () -> Int in
            if #available(iOS 16.0, *) {
                return self.selectedApps.applicationTokens.count + self.selectedApps.categoryTokens.count
            }
            return 0
        }

        /// Check if any apps are blocked
        AsyncFunction("hasBlockedApps") { () -> Bool in
            if #available(iOS 16.0, *) {
                return !self.selectedApps.applicationTokens.isEmpty || !self.selectedApps.categoryTokens.isEmpty
            }
            return false
        }

        // MARK: - Temporary Unblock

        /// Temporarily unblock all apps for specified minutes
        Function("setTempUnblock") { (minutes: Int) in
            if #available(iOS 16.0, *) {
                self.startTempUnblock(minutes: minutes)
            }
        }

        /// Check if currently in temp unblock mode
        AsyncFunction("isTempUnblocked") { () -> Bool in
            if let endTime = self.tempUnblockEndTime {
                return Date() < endTime
            }
            return false
        }

        /// End temp unblock immediately
        Function("endTempUnblock") {
            if #available(iOS 16.0, *) {
                self.endTempUnblock()
            }
        }

        // MARK: - Scheduled Blocking

        /// Schedule blocking for specific hours
        Function("scheduleBlocking") { (startHour: Int, startMinute: Int, endHour: Int, endMinute: Int) in
            if #available(iOS 16.0, *) {
                self.scheduleDeviceActivityBlocking(
                    startHour: startHour,
                    startMinute: startMinute,
                    endHour: endHour,
                    endMinute: endMinute
                )
            }
        }

        /// Stop scheduled blocking
        Function("stopScheduledBlocking") {
            if #available(iOS 16.0, *) {
                self.stopDeviceActivityMonitoring()
            }
        }

        // MARK: - Block Interstitial (iOS uses shield overlay automatically)

        Function("showBlockInterstitial") { (packageName: String, appName: String) in
            // On iOS, the shield is shown automatically by ManagedSettings
            // This is a no-op since Apple handles the UI
        }
    }

    // MARK: - Private Methods

    private func openScreenTimeSettings() {
        DispatchQueue.main.async {
            if let url = URL(string: "App-Prefs:SCREEN_TIME") {
                if UIApplication.shared.canOpenURL(url) {
                    UIApplication.shared.open(url)
                    return
                }
            }
            if let url = URL(string: UIApplication.openSettingsURLString) {
                UIApplication.shared.open(url)
            }
        }
    }

    @available(iOS 16.0, *)
    private func presentAppPicker(promise: Promise) {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let rootViewController = windowScene.windows.first?.rootViewController else {
            promise.resolve(nil)
            return
        }

        // Create the SwiftUI picker view
        let pickerView = FamilyActivityPicker(selection: Binding(
            get: { self.selectedApps },
            set: { newSelection in
                self.selectedApps = newSelection
            }
        ))

        // Wrap in hosting controller
        let hostingController = UIHostingController(rootView:
            NavigationView {
                pickerView
                    .navigationTitle("Select Apps to Block")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) {
                            Button("Cancel") {
                                rootViewController.dismiss(animated: true) {
                                    promise.resolve(nil)
                                }
                            }
                        }
                        ToolbarItem(placement: .confirmationAction) {
                            Button("Done") {
                                rootViewController.dismiss(animated: true) {
                                    let result: [String: Any] = [
                                        "appsCount": self.selectedApps.applicationTokens.count,
                                        "categoriesCount": self.selectedApps.categoryTokens.count
                                    ]
                                    promise.resolve(result)
                                }
                            }
                        }
                    }
            }
        )

        hostingController.modalPresentationStyle = .pageSheet

        // Find topmost presented controller
        var topController = rootViewController
        while let presented = topController.presentedViewController {
            topController = presented
        }

        topController.present(hostingController, animated: true)
    }

    @available(iOS 16.0, *)
    private func applyShield() {
        let managedStore = ManagedSettingsStore()
        // Apply shields to selected apps and categories
        managedStore.shield.applications = selectedApps.applicationTokens
        managedStore.shield.applicationCategories = .specific(selectedApps.categoryTokens)
        managedStore.shield.webDomainCategories = .specific(selectedApps.categoryTokens)
    }

    @available(iOS 16.0, *)
    private func clearShield() {
        let managedStore = ManagedSettingsStore()
        managedStore.shield.applications = nil
        managedStore.shield.applicationCategories = nil
        managedStore.shield.webDomainCategories = nil
    }

    @available(iOS 16.0, *)
    private func startTempUnblock(minutes: Int) {
        // Clear the shield temporarily
        clearShield()

        // Set end time
        tempUnblockEndTime = Date().addingTimeInterval(TimeInterval(minutes * 60))

        // Cancel existing timer
        tempUnblockTimer?.invalidate()

        // Start timer to re-apply shield
        tempUnblockTimer = Timer.scheduledTimer(withTimeInterval: TimeInterval(minutes * 60), repeats: false) { [weak self] _ in
            if #available(iOS 16.0, *) {
                self?.endTempUnblock()
            }
        }
    }

    @available(iOS 16.0, *)
    private func endTempUnblock() {
        tempUnblockTimer?.invalidate()
        tempUnblockTimer = nil
        tempUnblockEndTime = nil
        applyShield()
    }

    @available(iOS 16.0, *)
    private func scheduleDeviceActivityBlocking(startHour: Int, startMinute: Int, endHour: Int, endMinute: Int) {
        let center = DeviceActivityCenter()

        // Create schedule
        let schedule = DeviceActivitySchedule(
            intervalStart: DateComponents(hour: startHour, minute: startMinute),
            intervalEnd: DateComponents(hour: endHour, minute: endMinute),
            repeats: true
        )

        // Start monitoring
        do {
            try center.startMonitoring(
                DeviceActivityName("blocking_schedule"),
                during: schedule
            )
        } catch {
            print("AppBlocker: Failed to schedule blocking - \(error)")
        }
    }

    @available(iOS 16.0, *)
    private func stopDeviceActivityMonitoring() {
        let center = DeviceActivityCenter()
        center.stopMonitoring([DeviceActivityName("blocking_schedule")])
    }
}
