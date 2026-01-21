import Foundation
import UserNotifications
import UIKit

/// Notification categories for routing
enum NotificationCategory: String {
    case earnTime = "EARN_TIME"
    case dailyReminder = "DAILY_REMINDER"
    case streakRisk = "STREAK_RISK"
    case goalProgress = "GOAL_PROGRESS"
    case achievement = "ACHIEVEMENT"
    case focusComplete = "FOCUS_COMPLETE"

    var deepLinkURL: URL? {
        switch self {
        case .earnTime:
            return URL(string: "lockin://earn")
        case .dailyReminder:
            return URL(string: "lockin://home")
        case .streakRisk:
            return URL(string: "lockin://earn")
        case .goalProgress:
            return URL(string: "lockin://stats")
        case .achievement:
            return URL(string: "lockin://profile")
        case .focusComplete:
            return URL(string: "lockin://earn")
        }
    }
}

/// Service for handling local notifications and routing
final class NotificationService: NSObject, UNUserNotificationCenterDelegate {
    static let shared = NotificationService()

    private let center = UNUserNotificationCenter.current()
    private let userDefaults = UserDefaults.standard
    private let notificationsEnabledKey = "notifications.enabled"

    /// Pending tab navigation (for cold start)
    var pendingTabNavigation: Int?

    var isEnabled: Bool {
        get { userDefaults.bool(forKey: notificationsEnabledKey) }
        set { userDefaults.set(newValue, forKey: notificationsEnabledKey) }
    }

    private override init() {
        super.init()
        center.delegate = self
    }

    /// Check and consume pending navigation
    func consumePendingNavigation() -> Int? {
        let tab = pendingTabNavigation
        pendingTabNavigation = nil
        return tab
    }

    // MARK: - Permission

    /// Request notification permission
    func requestPermission(completion: @escaping (Bool) -> Void) {
        center.requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
            DispatchQueue.main.async {
                self.isEnabled = granted
                if granted {
                    self.registerCategories()
                }
                completion(granted)
            }
        }
    }

    /// Check current permission status
    func checkPermissionStatus(completion: @escaping (UNAuthorizationStatus) -> Void) {
        center.getNotificationSettings { settings in
            DispatchQueue.main.async {
                completion(settings.authorizationStatus)
            }
        }
    }

    // MARK: - Categories

    private func registerCategories() {
        // Earn time category with action
        let earnAction = UNNotificationAction(
            identifier: "EARN_NOW",
            title: L10n.Notification.earnTimeAction,
            options: [.foreground]
        )
        let earnCategory = UNNotificationCategory(
            identifier: NotificationCategory.earnTime.rawValue,
            actions: [earnAction],
            intentIdentifiers: []
        )

        // Focus complete category
        let viewStatsAction = UNNotificationAction(
            identifier: "VIEW_STATS",
            title: L10n.Notification.viewStatsAction,
            options: [.foreground]
        )
        let focusCategory = UNNotificationCategory(
            identifier: NotificationCategory.focusComplete.rawValue,
            actions: [viewStatsAction],
            intentIdentifiers: []
        )

        center.setNotificationCategories([earnCategory, focusCategory])
    }

    // MARK: - Schedule Notifications

    /// Schedule daily reminder notification
    func scheduleDailyReminder(at hour: Int, minute: Int) {
        let content = UNMutableNotificationContent()
        content.title = L10n.Notification.dailyReminderTitle
        content.body = L10n.Notification.dailyReminderBody
        content.sound = .default
        content.categoryIdentifier = NotificationCategory.dailyReminder.rawValue
        content.userInfo = ["category": NotificationCategory.dailyReminder.rawValue]

        var dateComponents = DateComponents()
        dateComponents.hour = hour
        dateComponents.minute = minute

        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
        let request = UNNotificationRequest(
            identifier: "daily_reminder",
            content: content,
            trigger: trigger
        )

        center.add(request)
    }

    /// Schedule streak risk notification
    func scheduleStreakReminder(streakDays: Int) {
        let content = UNMutableNotificationContent()
        content.title = L10n.Notification.streakRiskTitle
        content.body = L10n.Notification.streakRiskBody(streakDays)
        content.sound = .default
        content.categoryIdentifier = NotificationCategory.streakRisk.rawValue
        content.userInfo = ["category": NotificationCategory.streakRisk.rawValue]

        // Schedule for 8 PM
        var dateComponents = DateComponents()
        dateComponents.hour = 20
        dateComponents.minute = 0

        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: false)
        let request = UNNotificationRequest(
            identifier: "streak_reminder",
            content: content,
            trigger: trigger
        )

        center.add(request)
    }

    /// Schedule earn time reminder
    func scheduleEarnTimeReminder(after minutes: Int = 60) {
        let content = UNMutableNotificationContent()
        content.title = L10n.Notification.needMoreTimeTitle
        content.body = L10n.Notification.needMoreTimeBody
        content.sound = .default
        content.categoryIdentifier = NotificationCategory.earnTime.rawValue
        content.userInfo = ["category": NotificationCategory.earnTime.rawValue]

        let trigger = UNTimeIntervalNotificationTrigger(
            timeInterval: TimeInterval(minutes * 60),
            repeats: false
        )
        let request = UNNotificationRequest(
            identifier: "earn_time_\(Date().timeIntervalSince1970)",
            content: content,
            trigger: trigger
        )

        center.add(request)
    }

    /// Schedule focus complete notification
    func scheduleFocusCompleteNotification(earnedMinutes: Double) {
        let content = UNMutableNotificationContent()
        content.title = L10n.Notification.focusCompleteTitle
        content.body = L10n.Notification.focusCompleteBody(String(format: "%.0f", earnedMinutes))
        content.sound = .default
        content.categoryIdentifier = NotificationCategory.focusComplete.rawValue
        content.userInfo = ["category": NotificationCategory.focusComplete.rawValue]

        let request = UNNotificationRequest(
            identifier: "focus_complete",
            content: content,
            trigger: nil // Deliver immediately
        )

        center.add(request)
    }

    /// Cancel all pending notifications
    func cancelAllNotifications() {
        center.removeAllPendingNotificationRequests()
    }

    /// Cancel specific notification
    func cancelNotification(identifier: String) {
        center.removePendingNotificationRequests(withIdentifiers: [identifier])
    }

    // MARK: - UNUserNotificationCenterDelegate

    /// Handle notification when app is in foreground
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        let userInfo = notification.request.content.userInfo

        // Check if this is a reblock notification - auto re-block immediately
        if let action = userInfo["action"] as? String, action == "reblock" {
            print("📱 Reblock notification received in foreground - forcing re-block")
            // Post notification to trigger re-blocking
            DispatchQueue.main.async {
                NotificationCenter.default.post(name: .forceReblock, object: nil)
            }
        }

        // Also check for unlock window ended notification
        if notification.request.identifier.starts(with: "unlockWindowEnded") ||
           notification.request.identifier == "unlockWindowExpiry" {
            print("📱 Unlock window ended notification - forcing re-block")
            DispatchQueue.main.async {
                NotificationCenter.default.post(name: .forceReblock, object: nil)
            }
        }

        // Show notification even when app is in foreground
        completionHandler([.banner, .sound, .badge])
    }

    /// Handle notification tap
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        print("📱 Notification tapped: \(response.actionIdentifier)")

        let userInfo = response.notification.request.content.userInfo
        print("📱 UserInfo: \(userInfo)")

        // Default to LockIn tab for any notification tap
        var targetTab: Int = 2

        // Get category from userInfo to determine specific tab
        if let categoryString = userInfo["category"] as? String,
           let category = NotificationCategory(rawValue: categoryString) {
            print("📱 Category: \(category)")
            switch category {
            case .earnTime, .streakRisk, .focusComplete, .dailyReminder:
                targetTab = 2 // LockIn tab
            case .goalProgress:
                targetTab = 3 // Stats tab
            case .achievement:
                targetTab = 4 // Profile tab
            }
        }

        // Check if this is a reblock notification - force re-block when tapped
        if let action = userInfo["action"] as? String, action == "reblock" {
            print("📱 Reblock notification tapped - forcing re-block")
            DispatchQueue.main.async {
                NotificationCenter.default.post(name: .forceReblock, object: nil)
            }
            // Navigate to LockIn tab after re-blocking
            targetTab = 2
        }

        // Handle specific action buttons (override category-based tab)
        switch response.actionIdentifier {
        case "EARN_NOW":
            targetTab = 2 // LockIn tab
        case "VIEW_STATS":
            targetTab = 3 // Stats tab
        case UNNotificationDefaultActionIdentifier:
            // User just tapped the notification - use category-based tab (already set above)
            print("📱 Default tap action")
        case UNNotificationDismissActionIdentifier:
            // User dismissed - don't navigate
            print("📱 Notification dismissed")
            completionHandler()
            return
        default:
            print("📱 Unknown action: \(response.actionIdentifier)")
        }

        print("📱 Navigating to tab: \(targetTab)")

        // Store for cold start case (consumed by LockInApp)
        pendingTabNavigation = targetTab

        // Post notification for when app is already running
        // Use multiple delays to ensure the notification is received
        DispatchQueue.main.async {
            print("📱 Posting navigateToTab notification immediately")
            NotificationCenter.default.post(
                name: .navigateToTab,
                object: nil,
                userInfo: ["tab": targetTab]
            )
        }

        // Also post after a small delay for cases where UI isn't ready yet
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            print("📱 Posting navigateToTab notification (delayed)")
            NotificationCenter.default.post(
                name: .navigateToTab,
                object: nil,
                userInfo: ["tab": targetTab]
            )
        }

        completionHandler()
    }
}

// MARK: - Navigation Notification

extension Notification.Name {
    static let navigateToTab = Notification.Name("navigateToTab")
    static let forceReblock = Notification.Name("forceReblock")
}
