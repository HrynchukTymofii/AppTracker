import Foundation
import SwiftUI
import Observation

struct AvailableLanguage: Identifiable {
    let id: String
    let code: String
    let name: String
    let nativeName: String
    let flag: String
}

@Observable
final class LocalizationService {
    private let languageKey = "selectedLanguage"
    private let appGroupId = "group.com.hrynchuk.appblocker"

    private var sharedDefaults: UserDefaults? {
        UserDefaults(suiteName: appGroupId)
    }

    /// Increments on language change to trigger view refreshes
    var refreshTrigger: Int = 0

    var currentLanguageCode: String {
        didSet {
            UserDefaults.standard.set(currentLanguageCode, forKey: languageKey)
            // Also save to App Groups for extensions to access
            sharedDefaults?.set(currentLanguageCode, forKey: languageKey)
            sharedDefaults?.synchronize()
            Bundle.setLanguage(currentLanguageCode)
            // Cache shield strings for extension
            cacheShieldStrings()
            // Trigger view refresh
            refreshTrigger += 1
        }
    }

    // Cache localized shield strings for the extension
    func cacheShieldStrings() {
        let shieldStrings: [String: String] = [
            // Titles
            "shield.goal_complete": L10n.Shield.goalComplete,
            "shield.times_up": L10n.Shield.timesUp,
            "shield.ready_to_unlock": L10n.Shield.readyToUnlock,
            "shield.almost_there": L10n.Shield.almostThere,
            "shield.app_blocked": L10n.Shield.appBlocked,
            "shield.daily_goal_reached": L10n.Shield.dailyGoalReached,
            "shield.site_limit_reached": L10n.Shield.siteLimitReached,
            "shield.not_enough_time": L10n.Shield.notEnoughTime,
            "shield.no_time_available": L10n.Shield.noTimeAvailable,
            // Buttons
            "shield.talk_to_coach": L10n.Shield.talkToCoach,
            "shield.earn_time": L10n.Shield.earnTime,
            "shield.earn_more_time": L10n.Shield.earnMoreTime,
            "shield.earn_time_now": L10n.Shield.earnTimeNow,
            "shield.stay_focused": L10n.Shield.stayFocused,
            "shield.close": L10n.Shield.close,
            "shield.unlock_minutes": L10n.Shield.unlockMinutes,
            "shield.unlock_for_minutes": L10n.Shield.unlockForMinutes,
            // App Shield Descriptions
            "shield.goal_complete_desc": L10n.Shield.goalCompleteDesc,
            "shield.time_up_desc": L10n.Shield.timeUpDesc,
            "shield.ready_unlock_desc": L10n.Shield.readyUnlockDesc,
            "shield.almost_there_desc": L10n.Shield.almostThereDesc,
            "shield.app_blocked_desc": L10n.Shield.appBlockedDesc,
            // Web Shield Descriptions
            "shield.daily_goal_reached_desc": L10n.Shield.dailyGoalReachedDesc,
            "shield.site_limit_desc": L10n.Shield.siteLimitDesc,
            "shield.web_ready_unlock_desc": L10n.Shield.webReadyUnlockDesc,
            "shield.web_not_enough_desc": L10n.Shield.webNotEnoughDesc,
            "shield.web_no_time_desc": L10n.Shield.webNoTimeDesc
        ]
        sharedDefaults?.set(shieldStrings, forKey: "cachedShieldStrings")
        sharedDefaults?.synchronize()

        // Also cache report strings
        cacheReportStrings()
    }

    // Cache localized report strings for the DeviceActivityReport extension
    func cacheReportStrings() {
        let reportStrings: [String: String] = [
            "report.no_data": "report.no_data".localized,
            "report.no_data_desc": "report.no_data_desc".localized,
            "report.vs_last_week": "report.vs_last_week".localized,
            "report.less_screen_time": "report.less_screen_time".localized,
            "report.more_screen_time": "report.more_screen_time".localized,
            "report.vs": "report.vs".localized,
            "report.difference": "report.difference".localized,
            "report.total_hours": "report.total_hours".localized,
            "report.daily_avg": "report.daily_avg".localized,
            "report.peak_day": "report.peak_day".localized,
            "report.today": "report.today".localized,
            "report.stats_per_day": "report.stats_per_day".localized,
            "report.total_time_per_app": "report.total_time_per_app".localized,
            "report.no_app_data": "report.no_app_data".localized,
            "report.less": "report.less".localized,
            "report.more": "report.more".localized,
            "report.streak": "report.streak".localized,
            "report.vs_avg": "report.vs_avg".localized,
            "report.top_apps": "report.top_apps".localized,
            "report.no_app_usage": "report.no_app_usage".localized,
            "report.start_using": "report.start_using".localized,
            "report.screen_time": "report.screen_time".localized,
            "report.notifications": "report.notifications".localized,
            "report.todays_progress": "report.todays_progress".localized,
            "report.used": "report.used".localized,
            "report.left": "report.left".localized,
            "report.goal_reached": "report.goal_reached".localized,
            "report.this_week": "report.this_week".localized,
            "report.remaining": "report.remaining".localized,
            "report.of_goal": "report.of_goal".localized,
            "report.goal": "report.goal".localized,
            "report.day_sun": "report.day_sun".localized,
            "report.day_mon": "report.day_mon".localized,
            "report.day_tue": "report.day_tue".localized,
            "report.day_wed": "report.day_wed".localized,
            "report.day_thu": "report.day_thu".localized,
            "report.day_fri": "report.day_fri".localized,
            "report.day_sat": "report.day_sat".localized,
            "report.day_s": "report.day_s".localized,
            "report.day_m": "report.day_m".localized,
            "report.day_t": "report.day_t".localized,
            "report.day_w": "report.day_w".localized,
            "report.day_f": "report.day_f".localized,
            "report.avg": "report.avg".localized
        ]
        sharedDefaults?.set(reportStrings, forKey: "cachedReportStrings")
        sharedDefaults?.synchronize()

        // Also cache action strings
        cacheActionStrings()
    }

    // Cache localized action strings for the ShieldAction extension
    func cacheActionStrings() {
        let actionStrings: [String: String] = [
            "action.talk_to_coach": "action.talk_to_coach".localized,
            "action.earn_screen_time": "action.earn_screen_time".localized,
            "action.times_up": "action.times_up".localized,
            "action.chat_coach_bonus": "action.chat_coach_bonus".localized,
            "action.get_personalized_advice": "action.get_personalized_advice".localized,
            "action.complete_exercises": "action.complete_exercises".localized,
            "action.unlock_expired": "action.unlock_expired".localized
        ]
        sharedDefaults?.set(actionStrings, forKey: "cachedActionStrings")
        sharedDefaults?.synchronize()
    }

    // Languages matching React Native project (15 languages)
    static let availableLanguages: [AvailableLanguage] = [
        AvailableLanguage(id: "en-US", code: "en-US", name: "English (US)", nativeName: "English (US)", flag: "🇺🇸"),
        AvailableLanguage(id: "en-GB", code: "en-GB", name: "English (UK)", nativeName: "English (UK)", flag: "🇬🇧"),
        AvailableLanguage(id: "de-DE", code: "de-DE", name: "German", nativeName: "Deutsch", flag: "🇩🇪"),
        AvailableLanguage(id: "fr-FR", code: "fr-FR", name: "French", nativeName: "Français", flag: "🇫🇷"),
        AvailableLanguage(id: "uk-UA", code: "uk-UA", name: "Ukrainian", nativeName: "Українська", flag: "🇺🇦"),
        AvailableLanguage(id: "es-ES", code: "es-ES", name: "Spanish", nativeName: "Español", flag: "🇪🇸"),
        AvailableLanguage(id: "zh-CN", code: "zh-CN", name: "Chinese (Simplified)", nativeName: "简体中文", flag: "🇨🇳"),
        AvailableLanguage(id: "ja-JP", code: "ja-JP", name: "Japanese", nativeName: "日本語", flag: "🇯🇵"),
        AvailableLanguage(id: "pt-BR", code: "pt-BR", name: "Portuguese (Brazil)", nativeName: "Português (Brasil)", flag: "🇧🇷"),
        AvailableLanguage(id: "it-IT", code: "it-IT", name: "Italian", nativeName: "Italiano", flag: "🇮🇹"),
        AvailableLanguage(id: "ko-KR", code: "ko-KR", name: "Korean", nativeName: "한국어", flag: "🇰🇷"),
        AvailableLanguage(id: "nl-NL", code: "nl-NL", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱"),
        AvailableLanguage(id: "pl-PL", code: "pl-PL", name: "Polish", nativeName: "Polski", flag: "🇵🇱"),
        AvailableLanguage(id: "ar-SA", code: "ar-SA", name: "Arabic", nativeName: "العربية", flag: "🇸🇦"),
        AvailableLanguage(id: "hi-IN", code: "hi-IN", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳"),
    ]

    var currentLanguage: AvailableLanguage {
        Self.availableLanguages.first { $0.code == currentLanguageCode } ?? Self.availableLanguages[0]
    }

    init() {
        // First check standard UserDefaults, then App Groups for consistency
        if let saved = UserDefaults.standard.string(forKey: languageKey) {
            self.currentLanguageCode = saved
        } else if let saved = UserDefaults(suiteName: appGroupId)?.string(forKey: languageKey) {
            self.currentLanguageCode = saved
        } else {
            // Get system language
            let systemLanguage = Locale.current.language.languageCode?.identifier ?? "en"
            let systemRegion = Locale.current.region?.identifier ?? "US"
            let fullCode = "\(systemLanguage)-\(systemRegion)"

            // Try to find exact match, then fallback to language match
            if Self.availableLanguages.contains(where: { $0.code == fullCode }) {
                self.currentLanguageCode = fullCode
            } else if let match = Self.availableLanguages.first(where: { $0.code.hasPrefix(systemLanguage) }) {
                self.currentLanguageCode = match.code
            } else {
                self.currentLanguageCode = "en-US"
            }
        }

        // Ensure language is also saved in App Groups for extensions
        sharedDefaults?.set(currentLanguageCode, forKey: languageKey)
        sharedDefaults?.synchronize()

        // Set up bundle for current language
        Bundle.setLanguage(currentLanguageCode)

        // Initial cache of shield strings
        cacheShieldStrings()
    }

    func changeLanguage(to code: String) {
        currentLanguageCode = code
    }
}

// Extension to allow runtime language changes
extension Bundle {
    private static var bundleKey: UInt8 = 0

    // Maps language codes to .lproj folder names
    private static let languageToFolderMap: [String: String] = [
        "en-US": "en",
        "en-GB": "en-GB",
        "de-DE": "de",
        "fr-FR": "fr",
        "uk-UA": "uk",
        "es-ES": "es",
        "zh-CN": "zh-Hans",
        "ja-JP": "ja",
        "pt-BR": "pt-BR",
        "it-IT": "it",
        "ko-KR": "ko",
        "nl-NL": "nl",
        "pl-PL": "pl",
        "ar-SA": "ar",
        "hi-IN": "hi"
    ]

    // Custom bundle that loads from a specific .lproj folder
    private class LocalizedBundle: Bundle {
        override func localizedString(forKey key: String, value: String?, table tableName: String?) -> String {
            if let bundle = objc_getAssociatedObject(self, &Bundle.bundleKey) as? Bundle {
                return bundle.localizedString(forKey: key, value: value, table: tableName)
            }
            return super.localizedString(forKey: key, value: value, table: tableName)
        }
    }

    static func setLanguage(_ language: String) {
        // Map the language code to the correct folder name
        let folderName = languageToFolderMap[language] ?? language.components(separatedBy: "-").first ?? "en"

        // Save for next app launch
        UserDefaults.standard.set([folderName], forKey: "AppleLanguages")
        UserDefaults.standard.synchronize()

        // Apply immediately by swizzling the bundle
        guard let path = Bundle.main.path(forResource: folderName, ofType: "lproj"),
              let bundle = Bundle(path: path) else {
            // Fallback to English if folder not found
            if let enPath = Bundle.main.path(forResource: "en", ofType: "lproj"),
               let enBundle = Bundle(path: enPath) {
                objc_setAssociatedObject(Bundle.main, &bundleKey, enBundle, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
            }
            return
        }

        objc_setAssociatedObject(Bundle.main, &bundleKey, bundle, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)

        // Swizzle Bundle.main if not already done
        swizzleMainBundleIfNeeded()
    }

    private static var hasSwizzled = false

    private static func swizzleMainBundleIfNeeded() {
        guard !hasSwizzled else { return }
        hasSwizzled = true

        // Swizzle the localizedString method on Bundle.main's class
        object_setClass(Bundle.main, LocalizedBundle.self)
    }
}

// Custom String extension that re-evaluates localization every time
extension String {
    /// Returns the localized version of this string (re-evaluated on each access)
    var localized: String {
        Bundle.main.localizedString(forKey: self, value: nil, table: nil)
    }

    /// Returns the localized version with format arguments
    func localized(with arguments: CVarArg...) -> String {
        String(format: Bundle.main.localizedString(forKey: self, value: nil, table: nil), arguments: arguments)
    }
}
