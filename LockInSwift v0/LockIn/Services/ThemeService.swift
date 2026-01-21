import Foundation
import SwiftUI
import Observation

enum ThemeMode: String, CaseIterable {
    case light
    case dark
    case system

    var displayName: String {
        switch self {
        case .light: return "Light"
        case .dark: return "Dark"
        case .system: return "System"
        }
    }
}

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
        case .blue: return Color(red: 59/255, green: 130/255, blue: 246/255)
        case .purple: return Color(red: 139/255, green: 92/255, blue: 246/255)
        case .green: return Color(red: 16/255, green: 185/255, blue: 129/255)
        case .orange: return Color(red: 249/255, green: 115/255, blue: 22/255)
        case .pink: return Color(red: 236/255, green: 72/255, blue: 153/255)
        case .red: return Color(red: 239/255, green: 68/255, blue: 68/255)
        case .teal: return Color(red: 20/255, green: 184/255, blue: 166/255)
        case .indigo: return Color(red: 99/255, green: 102/255, blue: 241/255)
        }
    }

    var darkVariant: Color {
        switch self {
        case .blue: return Color(red: 37/255, green: 99/255, blue: 235/255)
        case .purple: return Color(red: 124/255, green: 58/255, blue: 237/255)
        case .green: return Color(red: 5/255, green: 150/255, blue: 105/255)
        case .orange: return Color(red: 234/255, green: 88/255, blue: 12/255)
        case .pink: return Color(red: 219/255, green: 39/255, blue: 119/255)
        case .red: return Color(red: 220/255, green: 38/255, blue: 38/255)
        case .teal: return Color(red: 13/255, green: 148/255, blue: 136/255)
        case .indigo: return Color(red: 79/255, green: 70/255, blue: 229/255)
        }
    }

    var displayName: String {
        rawValue.capitalized
    }
}

@Observable
final class ThemeService {
    private let themeModeKey = "themeMode"
    private let accentColorKey = "accentColor"

    var themeMode: ThemeMode {
        didSet {
            UserDefaults.standard.set(themeMode.rawValue, forKey: themeModeKey)
        }
    }

    var accentColorOption: AccentColorOption {
        didSet {
            UserDefaults.standard.set(accentColorOption.rawValue, forKey: accentColorKey)
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
            self.accentColorOption = .green
        }
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

    // MARK: - Color Helpers

    var primaryGradient: LinearGradient {
        LinearGradient(
            colors: [accentColor, accentColorDark],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    // Dynamic colors based on color scheme
    func cardBackground(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark
            ? Color(white: 0.1)
            : Color(white: 0.97)
    }

    func textPrimary(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark
            ? .white
            : Color(red: 17/255, green: 24/255, blue: 39/255)
    }

    func textSecondary(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark
            ? Color(white: 0.6)
            : Color(white: 0.4)
    }
}

// MARK: - Color Extensions

extension Color {
    static let appBackground = Color(UIColor.systemBackground)
    static let appSecondaryBackground = Color(UIColor.secondarySystemBackground)
    static let appTertiaryBackground = Color(UIColor.tertiarySystemBackground)

    // Health score colors
    static let healthExcellent = Color(red: 16/255, green: 185/255, blue: 129/255)
    static let healthGood = Color(red: 34/255, green: 197/255, blue: 94/255)
    static let healthAverage = Color(red: 234/255, green: 179/255, blue: 8/255)
    static let healthPoor = Color(red: 249/255, green: 115/255, blue: 22/255)
    static let healthCritical = Color(red: 239/255, green: 68/255, blue: 68/255)

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
