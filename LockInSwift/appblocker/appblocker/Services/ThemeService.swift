import Foundation
import SwiftUI
import UIKit
import Observation

// MARK: - Theme Mode

enum ThemeMode: String, CaseIterable {
    case light
    case dark
    case system

    var displayName: String {
        switch self {
        case .light: return "settings.theme.light".localized
        case .dark: return "settings.theme.dark".localized
        case .system: return "settings.theme.system".localized
        }
    }
}

// MARK: - Accent Color Option

enum AccentColorOption: String, CaseIterable {
    case blue
    case purple
    case green
    case orange
    case pink
    case red
    case teal
    case indigo

    var color: Color {
        switch self {
        case .blue: return Color(hex: "#0d7ff2")
        case .purple: return Color(hex: "#8B5CF6")
        case .green: return Color(hex: "#10B981")
        case .orange: return Color(hex: "#F97316")
        case .pink: return Color(hex: "#EC4899")
        case .red: return Color(hex: "#EF4444")
        case .teal: return Color(hex: "#14B8A6")
        case .indigo: return Color(hex: "#6366F1")
        }
    }

    var hexValue: String {
        switch self {
        case .blue: return "#0d7ff2"
        case .purple: return "#8B5CF6"
        case .green: return "#10B981"
        case .orange: return "#F97316"
        case .pink: return "#EC4899"
        case .red: return "#EF4444"
        case .teal: return "#14B8A6"
        case .indigo: return "#6366F1"
        }
    }

    var darkVariant: Color {
        switch self {
        case .blue: return Color(hex: "#0a66c2")
        case .purple: return Color(hex: "#7C3AED")
        case .green: return Color(hex: "#059669")
        case .orange: return Color(hex: "#EA580C")
        case .pink: return Color(hex: "#DB2777")
        case .red: return Color(hex: "#DC2626")
        case .teal: return Color(hex: "#0D9488")
        case .indigo: return Color(hex: "#4F46E5")
        }
    }

    var displayName: String {
        switch self {
        case .blue: return "settings.color.blue".localized
        case .purple: return "settings.color.purple".localized
        case .green: return "settings.color.green".localized
        case .orange: return "settings.color.orange".localized
        case .pink: return "settings.color.pink".localized
        case .red: return "settings.color.red".localized
        case .teal: return "settings.color.teal".localized
        case .indigo: return "settings.color.indigo".localized
        }
    }
}

@Observable
final class ThemeService {
    private let themeModeKey = "themeMode"
    private let accentColorKey = "accentColor"
    private let resolvedDarkModeKey = "resolvedIsDarkMode"
    private let sharedDefaults = UserDefaults(suiteName: "group.com.hrynchuk.appblocker")

    var themeMode: ThemeMode {
        didSet {
            UserDefaults.standard.set(themeMode.rawValue, forKey: themeModeKey)
            // Also save to app group for shield extension
            sharedDefaults?.set(themeMode.rawValue, forKey: themeModeKey)
            updateResolvedDarkMode()
            sharedDefaults?.synchronize()
        }
    }

    /// Updates the resolved dark mode state based on current settings and system appearance.
    /// Call this when the app appears or when system appearance changes.
    func updateResolvedDarkMode(systemIsDark: Bool? = nil) {
        let isDark: Bool
        switch themeMode {
        case .dark:
            isDark = true
        case .light:
            isDark = false
        case .system:
            // Use provided system state, or try to detect from UIScreen
            if let systemIsDark = systemIsDark {
                isDark = systemIsDark
            } else {
                isDark = UIScreen.main.traitCollection.userInterfaceStyle == .dark
            }
        }
        sharedDefaults?.set(isDark, forKey: resolvedDarkModeKey)
        sharedDefaults?.synchronize()
    }

    var accentColorOption: AccentColorOption {
        didSet {
            UserDefaults.standard.set(accentColorOption.rawValue, forKey: accentColorKey)
            // Also save to App Group for DeviceActivityReport extension
            sharedDefaults?.set(accentColorOption.rawValue, forKey: accentColorKey)
            sharedDefaults?.synchronize()
        }
    }

    init() {
        // Load saved preferences
        if let savedMode = UserDefaults.standard.string(forKey: themeModeKey),
           let mode = ThemeMode(rawValue: savedMode) {
            self.themeMode = mode
        } else {
            self.themeMode = .system
        }

        if let savedColor = UserDefaults.standard.string(forKey: accentColorKey),
           let color = AccentColorOption(rawValue: savedColor) {
            self.accentColorOption = color
        } else {
            self.accentColorOption = .blue  // Default to blue like RN app
        }

        // Sync theme and accent color to app group on init
        sharedDefaults?.set(themeMode.rawValue, forKey: themeModeKey)
        sharedDefaults?.set(accentColorOption.rawValue, forKey: accentColorKey)

        // Update resolved dark mode state for shield extension
        updateResolvedDarkMode()
    }

    var colorScheme: ColorScheme? {
        switch themeMode {
        case .light: return .light
        case .dark: return .dark
        case .system: return nil
        }
    }

    var accentColor: Color {
        accentColorOption.color
    }

    var accentColorDark: Color {
        accentColorOption.darkVariant
    }

    // MARK: - Liquid Glass Background Colors

    /// Main background color - #050505 for dark, #FAF9F6 for light
    func backgroundColor(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#050505") : Color(hex: "#FAF9F6")
    }

    /// Secondary background color
    func secondaryBackgroundColor(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#0a0a0a") : Color(hex: "#F5F4F0")
    }

    // MARK: - Liquid Glass Effect Colors

    /// Glass background - white at 3% for dark, 60% for light
    func glassBackground(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color.white.opacity(0.03) : Color.white.opacity(0.6)
    }

    /// Glass border - white at 8% for dark, 40% for light
    func glassBorder(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color.white.opacity(0.08) : Color.white.opacity(0.4)
    }

    /// Glass card background with tint
    func glassCardBackground(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#182634").opacity(0.4) : Color.white.opacity(0.6)
    }

    // MARK: - Text Colors (Liquid Glass)

    func textPrimary(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? .white : Color(hex: "#333333")
    }

    func textSecondary(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#a1a1aa") : Color(hex: "#7D7A74")
    }

    func textMuted(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#71717a") : Color(hex: "#7D7A74")
    }

    // MARK: - Accent Derived Colors

    /// Glow color - accent at 40% for dark, 25% for light
    func glowColor(for colorScheme: ColorScheme) -> Color {
        accentColor.opacity(colorScheme == .dark ? 0.4 : 0.25)
    }

    /// Glow intensity based on theme
    func glowIntensity(for colorScheme: ColorScheme) -> CGFloat {
        colorScheme == .dark ? 0.4 : 0.25
    }

    /// Accent background at 10% opacity
    var accentBackground: Color {
        accentColor.opacity(0.1)
    }

    /// Accent background at 20% opacity
    var accentBackgroundStrong: Color {
        accentColor.opacity(0.2)
    }

    /// Accent border at 20% opacity
    var accentBorder: Color {
        accentColor.opacity(0.2)
    }

    /// Subtle accent tint at 5% opacity
    var subtleAccentTint: Color {
        accentColor.opacity(0.05)
    }

    /// Glass accent background at 8% opacity
    var glassAccentBackground: Color {
        accentColor.opacity(0.08)
    }

    // MARK: - Component-Specific Colors

    func progressBarBackground(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#27272a").opacity(0.5) : Color(hex: "#e7e5e4").opacity(0.6)
    }

    func blockedAppBackground(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#27272a").opacity(0.8) : Color.white.opacity(0.5)
    }

    func cardShadowColor(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color.black.opacity(0.37) : Color.black.opacity(0.04)
    }

    // MARK: - Legacy Card Background (kept for compatibility)

    func cardBackground(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark
            ? Color(white: 0.1)
            : Color(white: 0.97)
    }

    // MARK: - Gradients

    var primaryGradient: LinearGradient {
        LinearGradient(
            colors: [accentColor, accentColorDark],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    /// Navigation bar gradient for dark mode
    var navBarGradient: LinearGradient {
        LinearGradient(
            colors: [
                accentColor.opacity(0.25),
                accentColor.opacity(0.15)
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    /// Radial glow gradient
    var glowGradient: RadialGradient {
        RadialGradient(
            colors: [accentColor.opacity(0.3), accentColor.opacity(0)],
            center: .center,
            startRadius: 0,
            endRadius: 100
        )
    }
}

// MARK: - Color Extensions for Hex Support

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }

    func toHex() -> String {
        guard let components = UIColor(self).cgColor.components, components.count >= 3 else {
            return "#000000"
        }
        let r = Int(components[0] * 255)
        let g = Int(components[1] * 255)
        let b = Int(components[2] * 255)
        return String(format: "#%02X%02X%02X", r, g, b)
    }
}

// MARK: - Legacy Color Extensions (kept for backward compatibility)

extension Color {
    static let appBackground = Color(UIColor.systemBackground)
    static let appSecondaryBackground = Color(UIColor.secondarySystemBackground)
    static let appTertiaryBackground = Color(UIColor.tertiarySystemBackground)

    // Health score colors
    static let healthExcellent = Color(hex: "#10B981")
    static let healthGood = Color(hex: "#22C55E")
    static let healthAverage = Color(hex: "#EAB308")
    static let healthPoor = Color(hex: "#F97316")
    static let healthCritical = Color(hex: "#EF4444")

    static func healthColor(for score: Int) -> Color {
        switch score {
        case 80...100: return .healthExcellent
        case 60..<80: return .healthGood
        case 40..<60: return .healthAverage
        case 20..<40: return .healthPoor
        default: return .healthCritical
        }
    }
}

// MARK: - Design Tokens

struct DesignTokens {
    // Spacing
    static let paddingPage: CGFloat = 24
    static let paddingCard: CGFloat = 20
    static let paddingSmall: CGFloat = 8
    static let paddingMedium: CGFloat = 16

    // Corner Radius
    static let cornerRadiusSmall: CGFloat = 8
    static let cornerRadiusMedium: CGFloat = 12
    static let cornerRadiusCard: CGFloat = 16
    static let cornerRadiusLarge: CGFloat = 20
    static let cornerRadiusPill: CGFloat = 9999

    // Typography Sizes
    static let fontSizeXs: CGFloat = 10
    static let fontSizeSm: CGFloat = 12
    static let fontSizeBase: CGFloat = 14
    static let fontSizeLg: CGFloat = 18
    static let fontSizeXl: CGFloat = 20
    static let fontSize2xl: CGFloat = 24
    static let fontSize3xl: CGFloat = 30
    static let fontSize4xl: CGFloat = 36

    // Shadows
    static let shadowRadiusSmall: CGFloat = 8
    static let shadowRadiusMedium: CGFloat = 15
    static let shadowRadiusLarge: CGFloat = 24

    // Animation
    static let animationDuration: Double = 0.3
    static let springResponse: Double = 0.3
    static let springDamping: Double = 0.7
}
