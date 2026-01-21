import Foundation
import DeviceActivity
import ManagedSettings
import FamilyControls
import UserNotifications
import os.log

private let logger = Logger(subsystem: "com.hrynchuk.appblocker.DeviceActivityMonitor", category: "Monitor")

/// Extension that monitors device activity and enforces app blocking
/// Supports per-schedule app selections for individual app schedules
/// Tracks usage time and deducts from earned time/daily limits
class DeviceActivityMonitorExtension: DeviceActivityMonitor {

    let store = ManagedSettingsStore()
    let appGroupId = "group.com.hrynchuk.appblocker"

    // Keys for shared UserDefaults
    private let earnedTimeKey = "timeBank.availableMinutes"
    private let appLimitsKey = "blocking.appLimits"
    private let usageSessionsKey = "blocking.usageSessions"

    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)
        logger.info("⏰ Interval started: \(activity.rawValue)")

        // Check if this is an unblock schedule (free access window)
        if isUnblockScheduleActive(activity.rawValue) {
            logger.info("🔓 Unblock schedule active - allowing access")
            store.shield.applications = nil
            store.shield.applicationCategories = nil
            recordSessionStart(activity: activity.rawValue, consumesEarnedTime: false)
            return
        }

        // Check earned time
        let earnedTime = loadEarnedTime()
        if earnedTime > 0 {
            logger.info("💰 Earned time available: \(earnedTime) min - allowing access")
            store.shield.applications = nil
            store.shield.applicationCategories = nil
            recordSessionStart(activity: activity.rawValue, consumesEarnedTime: true)
            return
        }

        // No earned time - apply shields
        if let selection = loadSelectionForSchedule(activity.rawValue) ?? loadGlobalSelection() {
            logger.info("🔒 No earned time - applying shields for \(selection.applicationTokens.count) apps")
            store.shield.applications = selection.applicationTokens
            store.shield.applicationCategories = .specific(selection.categoryTokens)
            store.shield.webDomainCategories = .specific(selection.categoryTokens)
        }
    }

    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)
        logger.info("⏰ Interval ended: \(activity.rawValue)")

        // Handle fixed unlock window ending
        // Time was already deducted upfront by ShieldAction - just re-block
        if activity.rawValue == "unlockWindow" {
            logger.info("🔒 Unlock window expired - re-applying shields")

            // Clear the unlock state in UserDefaults first
            clearUnlockWindowState()

            // Re-apply shields to block apps again
            reapplyShields()

            // Note: Notification disabled - shield screen handles this
            // sendUnlockWindowEndedNotification()
            return
        }

        // Record usage and deduct earned time if applicable (for other session types)
        if let session = loadActiveSession(activity: activity.rawValue) {
            let usageMinutes = calculateUsageMinutes(from: session.startTime)

            // Update daily limit usage
            updateDailyLimitUsage(activity: activity.rawValue, minutes: usageMinutes)

            // Deduct earned time if this session consumed it
            if session.consumesEarnedTime {
                deductEarnedTime(minutes: usageMinutes)
            }

            clearActiveSession(activity: activity.rawValue)
            logger.info("📊 Session ended: \(usageMinutes) min used")
        }

        // Re-apply shields
        if let selection = loadGlobalSelection() {
            store.shield.applications = selection.applicationTokens
            store.shield.applicationCategories = .specific(selection.categoryTokens)
            store.shield.webDomainCategories = .specific(selection.categoryTokens)
        }
        logger.info("🔒 Shields reapplied")
    }

    /// Send a notification when unlock window expires
    private func sendUnlockWindowEndedNotification() {
        let center = UNUserNotificationCenter.current()

        let content = UNMutableNotificationContent()
        content.title = "Time's Up"
        content.body = "Your unlock window has expired. Apps are blocked again."
        content.sound = .default

        let request = UNNotificationRequest(
            identifier: "unlockWindowEnded_\(Date().timeIntervalSince1970)",
            content: content,
            trigger: nil // Deliver immediately
        )

        center.add(request) { error in
            if let error = error {
                logger.error("Failed to send notification: \(error.localizedDescription)")
            }
        }
    }

    /// Clear unlock window state from UserDefaults
    private func clearUnlockWindowState() {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return }

        // Set "session just expired" flag to prevent auto-unlock from Restricted screen
        defaults.set(Date().timeIntervalSince1970, forKey: "blocking.sessionExpiredAt")

        defaults.set(false, forKey: "blocking.isUnlocked")
        defaults.removeObject(forKey: "blocking.unlockExpiryTime")
        defaults.synchronize()

        logger.info("📝 Cleared unlock window state, set sessionExpiredAt flag")
    }

    override func eventDidReachThreshold(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
        super.eventDidReachThreshold(event, activity: activity)
        logger.info("⚠️ Threshold reached: \(event.rawValue) for \(activity.rawValue)")

        // Handle per-minute earned time deduction
        if event.rawValue.starts(with: "earnedTime_minute_") {
            logger.info("⏱️ Minute passed - deducting earned time and updating daily usage")
            deductEarnedTime(minutes: 1.0)

            // Also update daily limit usage
            updateDailyLimitUsage(activity: activity.rawValue, minutes: 1.0)

            // Check if earned time depleted
            let remainingTime = loadEarnedTime()
            if remainingTime <= 0 {
                logger.info("🛑 Earned time depleted - re-applying shields")
                reapplyShields()

                // Stop monitoring
                let center = DeviceActivityCenter()
                center.stopMonitoring([activity])

                // Clear the session
                clearActiveSession()
                return
            }

            // Also check if daily limit reached
            if checkDailyLimitReached() {
                logger.info("🛑 Daily limit reached - re-applying shields")
                reapplyShields()

                // Set limit reached flag
                let defaults = UserDefaults(suiteName: appGroupId)
                defaults?.set(true, forKey: "blocking.limitReached")
                defaults?.synchronize()

                // Stop monitoring
                let center = DeviceActivityCenter()
                center.stopMonitoring([activity])

                // Clear the session
                clearActiveSession()
            }
            return
        }

        // Threshold events used for daily limits
        if event.rawValue.starts(with: "dailyLimit_") {
            logger.info("🛑 Daily limit reached - blocking app")
            reapplyShields()

            // Set limit reached flag
            let defaults = UserDefaults(suiteName: appGroupId)
            defaults?.set(true, forKey: "blocking.limitReached")
            defaults?.synchronize()
        }

        // Per-app limit reached (from app limits feature)
        if event.rawValue.starts(with: "limit_") {
            logger.info("🛑 Per-app limit reached - blocking specific app")

            // Extract limit UUID from event name
            let limitIdString = String(event.rawValue.dropFirst("limit_".count))

            // Load the app limit and shield that specific app
            if let limitId = UUID(uuidString: limitIdString) {
                shieldAppWithLimit(limitId: limitId)
            }

            // Mark limit as reached
            let defaults = UserDefaults(suiteName: appGroupId)
            defaults?.set(true, forKey: "appLimit.\(limitIdString).reached")
            defaults?.synchronize()
        }
    }

    /// Shield a specific app that has reached its limit
    private func shieldAppWithLimit(limitId: UUID) {
        guard let defaults = UserDefaults(suiteName: appGroupId),
              let data = defaults.data(forKey: appLimitsKey) else { return }

        do {
            let limits = try JSONDecoder().decode([AppLimitData].self, from: data)

            // Find the limit with this ID
            if let limit = limits.first(where: { $0.id == limitId }) {
                // Decode the app token
                if let token = try? PropertyListDecoder().decode(ApplicationToken.self, from: limit.appTokenData) {
                    // Add this app to shields
                    var currentApps = store.shield.applications ?? Set()
                    currentApps.insert(token)
                    store.shield.applications = currentApps
                    logger.info("🔒 Shielded app: \(limit.appName) (limit reached)")
                }
            }
        } catch {
            logger.error("❌ Failed to shield app: \(error.localizedDescription)")
        }
    }

    /// Re-apply shields to block apps again
    private func reapplyShields() {
        if let selection = loadGlobalSelection() {
            store.shield.applications = selection.applicationTokens
            store.shield.applicationCategories = .specific(selection.categoryTokens)
            store.shield.webDomainCategories = .specific(selection.categoryTokens)
            logger.info("🔒 Shields reapplied for \(selection.applicationTokens.count) apps")
        }
    }

    /// Clear the active earned time session
    private func clearActiveSession() {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return }
        defaults.removeObject(forKey: "blocking.activeSession")
        defaults.set(false, forKey: "isUsingEarnedTime")
        defaults.synchronize()
        logger.info("📝 Active session cleared")
    }

    override func intervalWillStartWarning(for activity: DeviceActivityName) {
        super.intervalWillStartWarning(for: activity)
        logger.info("⏳ Schedule will start soon: \(activity.rawValue)")
    }

    override func intervalWillEndWarning(for activity: DeviceActivityName) {
        super.intervalWillEndWarning(for: activity)
        logger.info("⏳ Schedule will end soon: \(activity.rawValue)")
    }

    override func eventWillReachThresholdWarning(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
        super.eventWillReachThresholdWarning(event, activity: activity)
        logger.info("⏳ Threshold warning: \(event.rawValue)")
    }

    // MARK: - Usage Session Tracking

    private struct UsageSession: Codable {
        let activity: String
        let startTime: Date
        let consumesEarnedTime: Bool
    }

    private func recordSessionStart(activity: String, consumesEarnedTime: Bool) {
        let session = UsageSession(
            activity: activity,
            startTime: Date(),
            consumesEarnedTime: consumesEarnedTime
        )

        guard let defaults = UserDefaults(suiteName: appGroupId) else { return }

        do {
            var sessions = loadAllSessions()
            sessions[activity] = session
            let data = try JSONEncoder().encode(sessions)
            defaults.set(data, forKey: usageSessionsKey)
            defaults.synchronize()
            logger.info("📝 Session started for: \(activity)")
        } catch {
            logger.error("❌ Failed to record session: \(error.localizedDescription)")
        }
    }

    private func loadActiveSession(activity: String) -> UsageSession? {
        let sessions = loadAllSessions()
        return sessions[activity]
    }

    private func loadAllSessions() -> [String: UsageSession] {
        guard let defaults = UserDefaults(suiteName: appGroupId),
              let data = defaults.data(forKey: usageSessionsKey) else {
            return [:]
        }

        do {
            return try JSONDecoder().decode([String: UsageSession].self, from: data)
        } catch {
            return [:]
        }
    }

    private func clearActiveSession(activity: String) {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return }

        do {
            var sessions = loadAllSessions()
            sessions.removeValue(forKey: activity)
            let data = try JSONEncoder().encode(sessions)
            defaults.set(data, forKey: usageSessionsKey)
            defaults.synchronize()
        } catch {
            logger.error("❌ Failed to clear session: \(error.localizedDescription)")
        }
    }

    private func calculateUsageMinutes(from startTime: Date) -> Double {
        let seconds = Date().timeIntervalSince(startTime)
        return seconds / 60.0
    }

    // MARK: - Earned Time Management

    private func loadEarnedTime() -> Double {
        let defaults = UserDefaults(suiteName: appGroupId)
        return defaults?.double(forKey: earnedTimeKey) ?? 0
    }

    private func deductEarnedTime(minutes: Double) {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return }

        let current = loadEarnedTime()
        let newBalance = max(0, current - minutes)
        defaults.set(newBalance, forKey: earnedTimeKey)
        defaults.synchronize()

        logger.info("💸 Deducted \(minutes) min, new balance: \(newBalance)")
    }

    // MARK: - Daily Limit Usage

    private func updateDailyLimitUsage(activity: String, minutes: Double) {
        // Note: Per-app usage is now tracked via DeviceActivityReport
        // This function is deprecated - actual usage stats come from Screen Time API
        // The BlockingService.syncUsageFromReport() method should be used instead
        logger.info("📊 Usage tracking delegated to DeviceActivityReport")
    }

    /// Check if any daily limit has been reached
    private func checkDailyLimitReached() -> Bool {
        guard let defaults = UserDefaults(suiteName: appGroupId),
              let data = defaults.data(forKey: appLimitsKey) else {
            return false
        }

        do {
            let limits = try JSONDecoder().decode([AppLimitData].self, from: data)
            for limit in limits {
                let remaining = Double(limit.dailyLimitMinutes) - limit.usedTodayMinutes
                if remaining <= 0 {
                    return true
                }
            }
            return false
        } catch {
            logger.error("❌ Failed to check daily limits: \(error.localizedDescription)")
            return false
        }
    }

    // MARK: - Unblock Schedule Check

    private func isUnblockScheduleActive(_ activityName: String) -> Bool {
        // Check if this activity is an unblock schedule by checking its name prefix
        return activityName.starts(with: "unblock_")
    }

    /// Load a specific unblock schedule by its UUID (extracted from activity name)
    private func loadUnblockSchedule(_ activityName: String) -> CodableScheduleData? {
        // Activity name format: "unblock_<UUID>"
        guard activityName.starts(with: "unblock_"),
              let defaults = UserDefaults(suiteName: appGroupId),
              let data = defaults.data(forKey: "blocking.schedules") else {
            return nil
        }

        let uuidString = String(activityName.dropFirst("unblock_".count))

        do {
            let schedules = try JSONDecoder().decode([CodableScheduleData].self, from: data)
            return schedules.first { $0.id.uuidString == uuidString }
        } catch {
            logger.error("❌ Failed to load schedule: \(error.localizedDescription)")
            return nil
        }
    }

    /// Get the apps that should remain blocked (global selection minus schedule's apps)
    private func getAppsToKeepBlocked(excluding schedule: CodableScheduleData) -> FamilyActivitySelection? {
        guard let globalSelection = loadGlobalSelection() else { return nil }

        // For now, if a schedule is active, unblock ALL apps
        // A more sophisticated approach would filter specific app tokens
        // But FamilyActivitySelection tokens aren't easily comparable to schedule app tokens
        return nil // Return nil to unblock everything during schedule
    }

    // MARK: - Per-Schedule Selection Loading

    /// Load app selection for a specific schedule by name
    private func loadSelectionForSchedule(_ scheduleName: String) -> FamilyActivitySelection? {
        let defaults = UserDefaults(suiteName: appGroupId)

        // Try to load from schedule-specific key: "schedule_<name>_apps"
        let key = "schedule_\(scheduleName)_apps"
        guard let data = defaults?.data(forKey: key) else {
            logger.info("📂 No schedule-specific selection for: \(scheduleName)")
            return nil
        }

        do {
            let decoder = PropertyListDecoder()
            let selection = try decoder.decode(FamilyActivitySelection.self, from: data)
            logger.info("✅ Loaded selection for schedule: \(scheduleName) with \(selection.applicationTokens.count) apps")
            return selection
        } catch {
            logger.error("❌ Failed to decode selection for \(scheduleName): \(error.localizedDescription)")
            return nil
        }
    }

    /// Load global app selection (fallback for backward compatibility)
    private func loadGlobalSelection() -> FamilyActivitySelection? {
        let defaults = UserDefaults(suiteName: appGroupId)
        guard let data = defaults?.data(forKey: "selectedApps") else {
            logger.info("📂 No global selection found")
            return nil
        }

        do {
            let decoder = PropertyListDecoder()
            let selection = try decoder.decode(FamilyActivitySelection.self, from: data)
            logger.info("✅ Loaded global selection with \(selection.applicationTokens.count) apps")
            return selection
        } catch {
            logger.error("❌ Failed to decode global selection: \(error.localizedDescription)")
            return nil
        }
    }
}

// MARK: - Simplified AppLimit for Extension

/// Simplified version of AppLimit for extension use (6MB memory limit)
private struct AppLimitData: Codable {
    let id: UUID
    let appTokenData: Data
    var appName: String
    var dailyLimitMinutes: Int
    var usedTodayMinutes: Double
    var lastResetDate: Date
}

/// Simplified schedule data for extension use
private struct CodableScheduleData: Codable {
    let id: UUID
    var name: String
    var appIds: [String]
    var appTokens: [Data]
    var startTime: Date
    var endTime: Date
    var weekdays: [Int]
    var isActive: Bool
}
