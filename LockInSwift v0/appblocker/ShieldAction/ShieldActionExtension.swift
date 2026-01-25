import DeviceActivity
import Foundation
import ManagedSettings
import FamilyControls
import UserNotifications
import os.log

// MARK: - Localization Helper for Shield Action
private struct ActionL10n {
    private static let appGroupId = "group.com.hrynchuk.appblocker"

    private static var cachedStrings: [String: String] {
        UserDefaults(suiteName: appGroupId)?.dictionary(forKey: "cachedActionStrings") as? [String: String] ?? [:]
    }

    static func string(_ key: String, fallback: String) -> String {
        cachedStrings[key] ?? fallback
    }

    // Notification titles
    static var talkToCoach: String { string("action.talk_to_coach", fallback: "Talk to Coach") }
    static var earnScreenTime: String { string("action.earn_screen_time", fallback: "Earn Screen Time") }
    static var timesUp: String { string("action.times_up", fallback: "Time's Up") }

    // Notification bodies
    static var chatWithCoachBonus: String { string("action.chat_coach_bonus", fallback: "Chat with your AI coach to earn bonus time.") }
    static var getPersonalizedAdvice: String { string("action.get_personalized_advice", fallback: "Get personalized advice from your AI coach.") }
    static var completeExercises: String { string("action.complete_exercises", fallback: "Complete exercises to unlock your apps.") }

    static func unlockExpired(_ minutes: Int) -> String {
        let format = cachedStrings["action.unlock_expired"] ?? "Your %d-minute unlock window has expired. Tap to re-enable blocking."
        return String(format: format, minutes)
    }
}

/// Handles user interactions with the shield (blocking screen)
class ShieldActionExtension: ShieldActionDelegate {

    let store = ManagedSettingsStore()
    let center = DeviceActivityCenter()
    private let logger = Logger(subsystem: "com.hrynchuk.appblocker.ShieldAction", category: "Action")
    private let appGroupId = "group.com.hrynchuk.appblocker"
    private let earnedTimeKey = "timeBank.availableMinutes"
    private let unlockWindowKey = "blocking.unlockWindow"  // Must match BlockingService key
    private let limitReachedKey = "blocking.limitReached"
    private let dailyGoalReachedKey = "blocking.dailyGoalReached"

    // MARK: - Shield Action Handlers

    override func handle(action: ShieldAction, for application: ApplicationToken, completionHandler: @escaping (ShieldActionResponse) -> Void) {
        let appName = getAppName(for: application)
        logger.info("Shield action for app: \(appName)")
        handleAction(action: action, itemName: appName, completionHandler: completionHandler)
    }

    override func handle(action: ShieldAction, for webDomain: WebDomainToken, completionHandler: @escaping (ShieldActionResponse) -> Void) {
        logger.info("Shield action for web domain")
        handleAction(action: action, itemName: "Website", completionHandler: completionHandler)
    }

    override func handle(action: ShieldAction, for category: ActivityCategoryToken, completionHandler: @escaping (ShieldActionResponse) -> Void) {
        logger.info("Shield action for category")
        handleAction(action: action, itemName: "Category", completionHandler: completionHandler)
    }

    // MARK: - Unified Action Handler

    private func handleAction(action: ShieldAction, itemName: String, completionHandler: @escaping (ShieldActionResponse) -> Void) {
        switch action {
        case .primaryButtonPressed:
            let dailyGoalReached = isDailyGoalReached()
            let limitReached = isLimitReached()
            let unlockWindow = getUnlockWindow()
            let earnedTime = getEarnedTime()
            let hasEnoughForWindow = earnedTime >= Double(unlockWindow) && !dailyGoalReached

            if dailyGoalReached {
                // DAILY GOAL REACHED → Open Coach page (can earn bonus time)
                logger.info("Daily goal reached - opening Coach for bonus time")
                openApp(deepLink: "lockin://coach", title: ActionL10n.talkToCoach, body: ActionL10n.chatWithCoachBonus)
                completionHandler(.close)

            } else if limitReached {
                // PER-APP LIMIT REACHED → Open Coach page
                logger.info("Per-app limit reached - opening Coach")
                openApp(deepLink: "lockin://coach", title: ActionL10n.talkToCoach, body: ActionL10n.getPersonalizedAdvice)
                completionHandler(.close)

            } else if hasSessionJustExpired() {
                // SESSION JUST EXPIRED → Don't auto-unlock, redirect to app
                // This prevents the "Restricted" screen from auto-unlocking
                logger.info("Session just expired - redirecting to LockIn app instead of auto-unlock")
                clearSessionExpiredFlag()
                // Just open app without notification - shield already shown
                openAppSilently(deepLink: "lockin://earn")
                completionHandler(.close)

            } else if hasEnoughForWindow {
                // HAS ENOUGH TIME → Deduct window upfront and unlock
                logger.info("Unlocking \(itemName) for \(unlockWindow) minutes")

                // Deduct the full window amount upfront
                deductTime(minutes: Double(unlockWindow))

                // Clear shields to allow access
                store.shield.applications = nil
                store.shield.applicationCategories = nil
                store.shield.webDomainCategories = nil

                // Start unlock window with expiry tracking and notification
                startUnlockWindow(minutes: unlockWindow)

                completionHandler(.defer)

            } else {
                // NOT ENOUGH TIME → Open Earn page
                logger.info("Not enough time for window - opening Earn page")
                openApp(deepLink: "lockin://earn", title: ActionL10n.earnScreenTime, body: ActionL10n.completeExercises)
                completionHandler(.close)
            }

        case .secondaryButtonPressed:
            completionHandler(.close)

        @unknown default:
            completionHandler(.close)
        }
    }

    // MARK: - State Checks

    private func getEarnedTime() -> Double {
        let defaults = UserDefaults(suiteName: appGroupId)
        return defaults?.double(forKey: earnedTimeKey) ?? 0
    }

    private func getUnlockWindow() -> Int {
        let defaults = UserDefaults(suiteName: appGroupId)
        let window = defaults?.integer(forKey: unlockWindowKey) ?? 0
        return window > 0 ? window : 5 // Default 5 minutes
    }

    private func isLimitReached() -> Bool {
        let defaults = UserDefaults(suiteName: appGroupId)
        return defaults?.bool(forKey: limitReachedKey) ?? false
    }

    private func isDailyGoalReached() -> Bool {
        let defaults = UserDefaults(suiteName: appGroupId)
        return defaults?.bool(forKey: dailyGoalReachedKey) ?? false
    }

    /// Check if a session just expired (prevents auto-unlock from Restricted screen)
    /// Returns true if session expired within the last 30 seconds
    private func hasSessionJustExpired() -> Bool {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return false }
        let expiredAt = defaults.double(forKey: "blocking.sessionExpiredAt")
        guard expiredAt > 0 else { return false }

        let expiredDate = Date(timeIntervalSince1970: expiredAt)
        let secondsSinceExpiry = Date().timeIntervalSince(expiredDate)

        // Consider session "just expired" for 30 seconds
        // This prevents auto-unlock when "Restricted" screen appears after window expires
        let justExpired = secondsSinceExpiry < 30
        if justExpired {
            logger.info("Session just expired \(Int(secondsSinceExpiry))s ago - will redirect to app instead of auto-unlock")
        }
        return justExpired
    }

    /// Clear the session expired flag
    private func clearSessionExpiredFlag() {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return }
        defaults.removeObject(forKey: "blocking.sessionExpiredAt")
        defaults.synchronize()
    }

    // MARK: - Fixed Window Time Management

    /// Deduct time upfront from earned balance and record for Daily Goal
    private func deductTime(minutes: Double) {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return }
        let currentTime = defaults.double(forKey: earnedTimeKey)
        let newTime = max(0, currentTime - minutes)

        // Save the new balance
        defaults.set(newTime, forKey: earnedTimeKey)

        // Track spending for main app to detect
        let previousSpent = defaults.double(forKey: "timeBank.totalSpentViaShield")
        defaults.set(previousSpent + minutes, forKey: "timeBank.totalSpentViaShield")
        defaults.set(Date().timeIntervalSince1970, forKey: "timeBank.lastSpendTime")

        // Track Daily Goal spending (reset if new day)
        let lastResetTimestamp = defaults.double(forKey: "dailyGoal.lastResetTimestamp")
        let lastResetDate = Date(timeIntervalSince1970: lastResetTimestamp)
        let isNewDay = !Calendar.current.isDateInToday(lastResetDate)

        if isNewDay {
            // Reset for new day
            defaults.set(minutes, forKey: "dailyGoal.todaySpentViaShield")
            defaults.set(Date().timeIntervalSince1970, forKey: "dailyGoal.lastResetTimestamp")
            logger.info("New day - reset daily goal spending to \(minutes) minutes")
        } else {
            // Add to today's spending
            let currentTodaySpent = defaults.double(forKey: "dailyGoal.todaySpentViaShield")
            defaults.set(currentTodaySpent + minutes, forKey: "dailyGoal.todaySpentViaShield")
            logger.info("Added \(minutes)m to daily goal, today total: \(currentTodaySpent + minutes)m")
        }

        defaults.synchronize()
        logger.info("Deducted \(minutes) minutes upfront, new balance: \(newTime)")
    }

    /// Store the unlock expiry time, start DeviceActivity monitoring, and schedule notification
    private func startUnlockWindow(minutes: Int) {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return }

        let now = Date()
        // Calculate expiry timestamp
        let expiryDate = now.addingTimeInterval(Double(minutes) * 60)

        // Store expiry time for main app to check
        defaults.set(expiryDate.timeIntervalSince1970, forKey: "blocking.unlockExpiryTime")
        defaults.set(true, forKey: "blocking.isUnlocked")
        defaults.synchronize()

        logger.info("Unlock window started - expires at \(expiryDate)")

        // Stop any existing unlock window monitoring first
        let activityName = DeviceActivityName("unlockWindow")
        center.stopMonitoring([activityName])

        // Start DeviceActivity monitoring for the unlock window
        // This will trigger intervalDidEnd in DeviceActivityMonitorExtension when the window expires
        startUnlockWindowMonitoring(startDate: now, endDate: expiryDate)

        // Note: Notification disabled - shield screen handles this
        // scheduleReblockNotification(at: expiryDate, windowMinutes: minutes)
    }

    /// Start DeviceActivity monitoring for the unlock window
    /// When the schedule ends, DeviceActivityMonitorExtension.intervalDidEnd will be called
    private func startUnlockWindowMonitoring(startDate: Date, endDate: Date) {
        let calendar = Calendar.current

        // Create DateComponents with full date+time for one-time schedule
        // Using all components ensures it's a specific point in time, not a daily repeat
        let startComponents = calendar.dateComponents(
            [.year, .month, .day, .hour, .minute, .second],
            from: startDate
        )
        let endComponents = calendar.dateComponents(
            [.year, .month, .day, .hour, .minute, .second],
            from: endDate
        )

        // Create a non-repeating schedule
        let schedule = DeviceActivitySchedule(
            intervalStart: startComponents,
            intervalEnd: endComponents,
            repeats: false  // Critical: one-time schedule, not repeating
        )

        let activityName = DeviceActivityName("unlockWindow")

        do {
            try center.startMonitoring(activityName, during: schedule)
            logger.info("Started DeviceActivity monitoring for unlock window until \(endDate)")
        } catch {
            logger.error("Failed to start unlock window monitoring: \(error.localizedDescription)")
            // The notification will serve as backup if monitoring fails
        }
    }

    /// Schedule a notification that will fire when unlock window expires
    private func scheduleReblockNotification(at date: Date, windowMinutes: Int) {
        let center = UNUserNotificationCenter.current()

        let content = UNMutableNotificationContent()
        content.title = ActionL10n.timesUp
        content.body = ActionL10n.unlockExpired(windowMinutes)
        content.sound = .default
        content.categoryIdentifier = "REBLOCK_APPS"
        content.userInfo = [
            "action": "reblock",
            "deepLink": "lockin://reblock"
        ]

        let trigger = UNTimeIntervalNotificationTrigger(
            timeInterval: max(1, date.timeIntervalSinceNow),
            repeats: false
        )

        let request = UNNotificationRequest(
            identifier: "unlockWindowExpiry",
            content: content,
            trigger: trigger
        )

        center.add(request) { error in
            if let error = error {
                self.logger.error("Failed to schedule reblock notification: \(error.localizedDescription)")
            } else {
                self.logger.info("Scheduled reblock notification for \(windowMinutes) minutes from now")
            }
        }
    }

    // MARK: - App Opening

    /// Open app silently without notification (used when shield already shown)
    private func openAppSilently(deepLink: String) {
        // Store the deep link for the app to handle when it opens
        let defaults = UserDefaults(suiteName: appGroupId)
        defaults?.set(deepLink, forKey: "pendingDeepLink")
        defaults?.synchronize()

        logger.info("Stored pending deep link: \(deepLink)")

        // Track the attempt
        saveBlockedAccessAttempt(deepLink: deepLink)
    }

    private func openApp(deepLink: String, title: String, body: String) {
        let center = UNUserNotificationCenter.current()

        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        content.categoryIdentifier = "OPEN_APP"
        content.userInfo = [
            "action": "openApp",
            "deepLink": deepLink
        ]

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 0.1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "openApp_\(Date().timeIntervalSince1970)",
            content: content,
            trigger: trigger
        )

        center.add(request) { error in
            if let error = error {
                self.logger.error("Failed to send notification: \(error.localizedDescription)")
            } else {
                self.logger.info("Notification sent: \(deepLink)")
            }
        }

        // Track the attempt
        saveBlockedAccessAttempt(deepLink: deepLink)
    }

    // MARK: - Helpers

    private func getAppName(for token: ApplicationToken) -> String {
        let defaults = UserDefaults(suiteName: appGroupId)
        if let appNames = defaults?.dictionary(forKey: "appTokenNames") as? [String: String] {
            let tokenHash = String(describing: token).hash
            if let name = appNames[String(tokenHash)] {
                return name
            }
        }
        return "App"
    }

    private func saveBlockedAccessAttempt(deepLink: String) {
        let defaults = UserDefaults(suiteName: appGroupId)
        let attempts = (defaults?.integer(forKey: "blockedAccessAttempts") ?? 0) + 1
        defaults?.set(attempts, forKey: "blockedAccessAttempts")
        defaults?.set(Date(), forKey: "lastBlockedAccessAttempt")
        defaults?.set(deepLink, forKey: "lastDeepLink")
        defaults?.synchronize()
    }
}
