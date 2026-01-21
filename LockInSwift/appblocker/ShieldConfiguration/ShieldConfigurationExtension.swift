import Foundation
import ManagedSettings
import ManagedSettingsUI
import UIKit

/// Shield screen styled to match LockIn app
class ShieldConfigurationExtension: ShieldConfigurationDataSource {

    // MARK: - Brand Colors

    private let redColor = UIColor(red: 239/255, green: 68/255, blue: 68/255, alpha: 1)           // #ef4444
    private let successGreen = UIColor(red: 16/255, green: 185/255, blue: 129/255, alpha: 1)      // #10b981

    // MARK: - App Group

    private let appGroupId = "group.com.hrynchuk.appblocker"

    // MARK: - Accent Color (from user settings)

    private var accentColor: UIColor {
        let defaults = UserDefaults(suiteName: appGroupId)
        let savedColor = defaults?.string(forKey: "accentColor") ?? "blue"

        switch savedColor {
        case "purple": return UIColor(red: 139/255, green: 92/255, blue: 246/255, alpha: 1)
        case "green": return UIColor(red: 16/255, green: 185/255, blue: 129/255, alpha: 1)
        case "orange": return UIColor(red: 249/255, green: 115/255, blue: 22/255, alpha: 1)
        case "pink": return UIColor(red: 236/255, green: 72/255, blue: 153/255, alpha: 1)
        case "red": return UIColor(red: 239/255, green: 68/255, blue: 68/255, alpha: 1)
        case "teal": return UIColor(red: 20/255, green: 184/255, blue: 166/255, alpha: 1)
        case "indigo": return UIColor(red: 99/255, green: 102/255, blue: 241/255, alpha: 1)
        default: return UIColor(red: 59/255, green: 130/255, blue: 246/255, alpha: 1) // blue
        }
    }

    private var accentColorDark: UIColor {
        let defaults = UserDefaults(suiteName: appGroupId)
        let savedColor = defaults?.string(forKey: "accentColor") ?? "blue"

        switch savedColor {
        case "purple": return UIColor(red: 124/255, green: 58/255, blue: 237/255, alpha: 1)
        case "green": return UIColor(red: 5/255, green: 150/255, blue: 105/255, alpha: 1)
        case "orange": return UIColor(red: 234/255, green: 88/255, blue: 12/255, alpha: 1)
        case "pink": return UIColor(red: 219/255, green: 39/255, blue: 119/255, alpha: 1)
        case "red": return UIColor(red: 220/255, green: 38/255, blue: 38/255, alpha: 1)
        case "teal": return UIColor(red: 13/255, green: 148/255, blue: 136/255, alpha: 1)
        case "indigo": return UIColor(red: 79/255, green: 70/255, blue: 229/255, alpha: 1)
        default: return UIColor(red: 37/255, green: 99/255, blue: 235/255, alpha: 1) // blue
        }
    }

    // MARK: - Theme Detection

    private var isDarkMode: Bool {
        let defaults = UserDefaults(suiteName: appGroupId) ?? UserDefaults.standard
        let savedMode = defaults.string(forKey: "themeMode") ?? "system"

        switch savedMode {
        case "dark": return true
        case "light": return false
        default:
            // For system mode, read the resolved dark mode state saved by the main app
            // (UIScreen.main.traitCollection doesn't work correctly in extension processes)
            return defaults.bool(forKey: "resolvedIsDarkMode")
        }
    }

    // MARK: - Background Color (uses accent color with opacity)

    private var backgroundColor: UIColor {
        // Use accent color with low opacity for a subtle tinted background
        if isDarkMode {
            // Dark mode: dark background with accent color tint
            return accentColorDark.withAlphaComponent(0.15).blended(with: UIColor(white: 0.05, alpha: 1))
        } else {
            // Light mode: light background with accent color tint
            return accentColor.withAlphaComponent(0.08).blended(with: .white)
        }
    }

    private var backgroundBlurStyle: UIBlurEffect.Style? {
        // Use blur style for nice effect
        return isDarkMode ? .systemMaterialDark : .systemMaterial
    }

    // MARK: - Text Colors (ALWAYS light on dark, dark on light)

    private var titleColor: UIColor {
        isDarkMode ? .white : UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1)
    }

    private var subtitleColor: UIColor {
        isDarkMode
            ? UIColor(red: 220/255, green: 225/255, blue: 235/255, alpha: 1)  // Light gray for dark mode
            : UIColor(red: 71/255, green: 85/255, blue: 105/255, alpha: 1)    // Dark gray for light mode
    }

    // MARK: - App Icon Mapping

    private let appIconMapping: [String: String] = [
        "com.burbn.instagram": "instagram",
        "com.facebook.Facebook": "facebook",
        "com.zhiliaoapp.musically": "tiktok",
        "com.google.ios.youtube": "youtube",
        "com.atebits.Tweetie2": "x",
        "com.twitter.twitter": "x",
        "ph.telegra.Telegraph": "telegram",
        "com.linkedin.LinkedIn": "linkedin",
        "pinterest": "pinterest",
        "com.pinterest": "pinterest",
    ]

    /// Get app icon resized with rounded corners (1.5x bigger, square with rounded corners)
    private func getAppIcon(for bundleId: String?) -> UIImage? {
        guard let bundleId = bundleId,
              let iconName = appIconMapping[bundleId] else {
            return nil
        }

        let bundle = Bundle(for: ShieldConfigurationExtension.self)
        guard let originalIcon = UIImage(named: iconName, in: bundle, compatibleWith: nil) else {
            return nil
        }

        // Make icon 1.5x bigger with rounded corners
        let iconSize: CGFloat = 120  // 1.5x of typical 80pt icon
        let cornerRadius: CGFloat = 24

        let rect = CGRect(origin: .zero, size: CGSize(width: iconSize, height: iconSize))

        UIGraphicsBeginImageContextWithOptions(rect.size, false, 0)
        defer { UIGraphicsEndImageContext() }

        let path = UIBezierPath(roundedRect: rect, cornerRadius: cornerRadius)
        path.addClip()

        originalIcon.draw(in: rect)

        return UIGraphicsGetImageFromCurrentImageContext()
    }

    // MARK: - Data Helpers

    private var defaults: UserDefaults? {
        UserDefaults(suiteName: appGroupId)
    }

    private func getEarnedTime() -> Double {
        defaults?.double(forKey: "timeBank.availableMinutes") ?? 0
    }

    private func getUnlockWindow() -> Int {
        let window = defaults?.integer(forKey: "blocking.unlockWindow") ?? 0
        return window > 0 ? window : 5
    }

    private func isLimitReached() -> Bool {
        defaults?.bool(forKey: "blocking.limitReached") ?? false
    }

    private func isDailyGoalReached() -> Bool {
        defaults?.bool(forKey: "blocking.dailyGoalReached") ?? false
    }

    private func formatTime(_ minutes: Double) -> String {
        if minutes >= 60 {
            let h = Int(minutes) / 60
            let m = Int(minutes) % 60
            return m > 0 ? "\(h)h \(m)m" : "\(h)h"
        }
        return "\(Int(minutes))m"
    }

    // MARK: - Localization Helpers

    private var cachedStrings: [String: String] {
        defaults?.dictionary(forKey: "cachedShieldStrings") as? [String: String] ?? [:]
    }

    private func localizedString(_ key: String, fallback: String) -> String {
        cachedStrings[key] ?? fallback
    }

    private func localizedString(_ key: String, fallback: String, args: CVarArg...) -> String {
        let format = cachedStrings[key] ?? fallback
        return String(format: format, arguments: args)
    }

    // MARK: - Shield Configuration

    override func configuration(shielding application: Application) -> ShieldConfiguration {
        let appName = application.localizedDisplayName ?? "App"
        let earnedTime = getEarnedTime()
        let unlockWindow = getUnlockWindow()
        let limitReached = isLimitReached()
        let dailyGoalReached = isDailyGoalReached()
        let hasEnoughTime = earnedTime >= Double(unlockWindow) && !dailyGoalReached

        // Save unlock window for ShieldAction
        let defaults = UserDefaults(suiteName: appGroupId)
        defaults?.set(unlockWindow, forKey: "blocking.currentUnlockWindow")
        defaults?.synchronize()

        // Get icon
        let icon: UIImage?
        if dailyGoalReached || limitReached {
            let config = UIImage.SymbolConfiguration(pointSize: 100, weight: .semibold)
            let symbolName = dailyGoalReached ? "flag.checkered" : "exclamationmark.circle.fill"
            icon = UIImage(systemName: symbolName, withConfiguration: config)?
                .withTintColor(redColor, renderingMode: .alwaysOriginal)
        } else if let appIcon = getAppIcon(for: application.bundleIdentifier) {
            icon = appIcon
        } else {
            let config = UIImage.SymbolConfiguration(pointSize: 100, weight: .semibold)
            let symbolName = hasEnoughTime ? "lock.open.fill" : "lock.fill"
            icon = UIImage(systemName: symbolName, withConfiguration: config)?
                .withTintColor(accentColor, renderingMode: .alwaysOriginal)
        }

        // Determine content using localized strings
        let title: String
        let stateTitleColor: UIColor
        let subtitle: String
        let primaryButton: String
        let primaryButtonBg: UIColor
        let secondaryButton: String

        if dailyGoalReached {
            title = localizedString("shield.goal_complete", fallback: "Goal Complete!")
            stateTitleColor = redColor
            subtitle = localizedString("shield.goal_complete_desc", fallback: "You've hit your daily screen time goal.\n\nReady for a break? Your AI coach can help you earn bonus time.")
            primaryButton = localizedString("shield.talk_to_coach", fallback: "Talk to Coach")
            primaryButtonBg = redColor
            secondaryButton = localizedString("shield.close", fallback: "Close")
        } else if limitReached {
            title = localizedString("shield.times_up", fallback: "Time's Up")
            stateTitleColor = redColor
            let descFormat = cachedStrings["shield.time_up_desc"] ?? "You've used all your time for %@ today.\n\nChat with your AI coach about building better habits."
            subtitle = String(format: descFormat, appName)
            primaryButton = localizedString("shield.talk_to_coach", fallback: "Talk to Coach")
            primaryButtonBg = redColor
            secondaryButton = localizedString("shield.close", fallback: "Close")
        } else if hasEnoughTime {
            title = localizedString("shield.ready_to_unlock", fallback: "Ready to Unlock")
            stateTitleColor = titleColor
            let descFormat = cachedStrings["shield.ready_unlock_desc"] ?? "%@ is blocked.\n\nYou have %@ earned.\nUnlocking uses %dm of your balance."
            subtitle = String(format: descFormat, appName, formatTime(earnedTime), unlockWindow)
            let unlockFormat = cachedStrings["shield.unlock_minutes"] ?? "Unlock %dm"
            primaryButton = String(format: unlockFormat, unlockWindow)
            primaryButtonBg = accentColor
            secondaryButton = localizedString("shield.stay_focused", fallback: "Stay Focused")
        } else if earnedTime > 0 {
            title = localizedString("shield.almost_there", fallback: "Almost There")
            stateTitleColor = accentColor
            let descFormat = cachedStrings["shield.almost_there_desc"] ?? "%@ is blocked.\n\nYou have %@ but need %dm.\nEarn %@ more to unlock."
            subtitle = String(format: descFormat, appName, formatTime(earnedTime), unlockWindow, formatTime(Double(unlockWindow) - earnedTime))
            primaryButton = localizedString("shield.earn_more_time", fallback: "Earn More Time")
            primaryButtonBg = accentColor
            secondaryButton = localizedString("shield.close", fallback: "Close")
        } else {
            title = localizedString("shield.app_blocked", fallback: "App Blocked")
            stateTitleColor = titleColor
            let descFormat = cachedStrings["shield.app_blocked_desc"] ?? "%@ is blocked.\n\nComplete exercises to earn screen time.\nYou need %dm to unlock."
            subtitle = String(format: descFormat, appName, unlockWindow)
            primaryButton = localizedString("shield.earn_time", fallback: "Earn Time")
            primaryButtonBg = accentColor
            secondaryButton = localizedString("shield.close", fallback: "Close")
        }

        return ShieldConfiguration(
            backgroundBlurStyle: backgroundBlurStyle,
            backgroundColor: backgroundColor,
            icon: icon,
            title: ShieldConfiguration.Label(text: title, color: stateTitleColor),
            subtitle: ShieldConfiguration.Label(text: subtitle, color: subtitleColor),
            primaryButtonLabel: ShieldConfiguration.Label(text: primaryButton, color: .white),
            primaryButtonBackgroundColor: primaryButtonBg,
            secondaryButtonLabel: ShieldConfiguration.Label(text: secondaryButton, color: subtitleColor)
        )
    }

    override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
        return configuration(shielding: application)
    }

    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        let domain = webDomain.domain ?? "Website"
        let earnedTime = getEarnedTime()
        let unlockWindow = getUnlockWindow()
        let limitReached = isLimitReached()
        let dailyGoalReached = isDailyGoalReached()
        let hasEnoughTime = earnedTime >= Double(unlockWindow) && !dailyGoalReached

        let config = UIImage.SymbolConfiguration(pointSize: 100, weight: .semibold)
        let symbolName: String
        let symbolColor: UIColor

        if dailyGoalReached {
            symbolName = "flag.checkered"
            symbolColor = redColor
        } else if limitReached {
            symbolName = "exclamationmark.circle.fill"
            symbolColor = redColor
        } else if hasEnoughTime {
            symbolName = "globe.badge.chevron.backward"
            symbolColor = accentColor
        } else {
            symbolName = "globe"
            symbolColor = accentColor
        }

        let icon = UIImage(systemName: symbolName, withConfiguration: config)?
            .withTintColor(symbolColor, renderingMode: .alwaysOriginal)

        // Determine content using localized strings
        let title: String
        let stateTitleColor: UIColor
        let subtitle: String
        let primaryButton: String
        let primaryButtonBg: UIColor
        let secondaryButton: String

        if dailyGoalReached {
            title = localizedString("shield.daily_goal_reached", fallback: "Daily Goal Reached")
            stateTitleColor = redColor
            subtitle = localizedString("shield.daily_goal_reached_desc", fallback: "You've reached your screen time goal for today.\n\nTalk to your AI coach to earn bonus time.")
            primaryButton = localizedString("shield.talk_to_coach", fallback: "Talk to Coach")
            primaryButtonBg = redColor
            secondaryButton = localizedString("shield.close", fallback: "Close")
        } else if limitReached {
            title = localizedString("shield.site_limit_reached", fallback: "Site Limit Reached")
            stateTitleColor = redColor
            subtitle = localizedString("shield.site_limit_desc", fallback: "You've used all your time for browsing today.\n\nTalk to your AI coach about building better habits.")
            primaryButton = localizedString("shield.talk_to_coach", fallback: "Talk to Coach")
            primaryButtonBg = redColor
            secondaryButton = localizedString("shield.close", fallback: "Close")
        } else if hasEnoughTime {
            title = localizedString("shield.ready_to_unlock", fallback: "Ready to Unlock")
            stateTitleColor = titleColor
            let descFormat = cachedStrings["shield.web_ready_unlock_desc"] ?? "%@ is blocked.\n\nYou have %@ earned.\nUnlocking will use %dm of your time."
            subtitle = String(format: descFormat, domain, formatTime(earnedTime), unlockWindow)
            let unlockFormat = cachedStrings["shield.unlock_for_minutes"] ?? "Unlock for %dm"
            primaryButton = String(format: unlockFormat, unlockWindow)
            primaryButtonBg = accentColor
            secondaryButton = localizedString("shield.stay_focused", fallback: "Stay Focused")
        } else if earnedTime > 0 {
            title = localizedString("shield.not_enough_time", fallback: "Not Enough Time")
            stateTitleColor = titleColor
            let descFormat = cachedStrings["shield.web_not_enough_desc"] ?? "%@ is blocked.\n\nYou have %@ but need %dm.\nEarn %@ more to unlock."
            subtitle = String(format: descFormat, domain, formatTime(earnedTime), unlockWindow, formatTime(Double(unlockWindow) - earnedTime))
            primaryButton = localizedString("shield.earn_more_time", fallback: "Earn More Time")
            primaryButtonBg = accentColor
            secondaryButton = localizedString("shield.close", fallback: "Close")
        } else {
            title = localizedString("shield.no_time_available", fallback: "No Time Available")
            stateTitleColor = titleColor
            let descFormat = cachedStrings["shield.web_no_time_desc"] ?? "%@ is blocked.\n\nComplete exercises to earn screen time.\nYou need %dm to unlock."
            subtitle = String(format: descFormat, domain, unlockWindow)
            primaryButton = localizedString("shield.earn_time_now", fallback: "Earn Time Now")
            primaryButtonBg = accentColor
            secondaryButton = localizedString("shield.close", fallback: "Close")
        }

        return ShieldConfiguration(
            backgroundBlurStyle: backgroundBlurStyle,
            backgroundColor: backgroundColor,
            icon: icon,
            title: ShieldConfiguration.Label(text: title, color: stateTitleColor),
            subtitle: ShieldConfiguration.Label(text: subtitle, color: subtitleColor),
            primaryButtonLabel: ShieldConfiguration.Label(text: primaryButton, color: .white),
            primaryButtonBackgroundColor: primaryButtonBg,
            secondaryButtonLabel: ShieldConfiguration.Label(text: secondaryButton, color: subtitleColor)
        )
    }

    override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory) -> ShieldConfiguration {
        return configuration(shielding: webDomain)
    }
}

// MARK: - UIColor Extension for Blending

extension UIColor {
    func blended(with color: UIColor) -> UIColor {
        var r1: CGFloat = 0, g1: CGFloat = 0, b1: CGFloat = 0, a1: CGFloat = 0
        var r2: CGFloat = 0, g2: CGFloat = 0, b2: CGFloat = 0, a2: CGFloat = 0

        self.getRed(&r1, green: &g1, blue: &b1, alpha: &a1)
        color.getRed(&r2, green: &g2, blue: &b2, alpha: &a2)

        // Blend based on alpha
        let r = r1 * a1 + r2 * (1 - a1)
        let g = g1 * a1 + g2 * (1 - a1)
        let b = b1 * a1 + b2 * (1 - a1)

        return UIColor(red: r, green: g, blue: b, alpha: 1.0)
    }
}
