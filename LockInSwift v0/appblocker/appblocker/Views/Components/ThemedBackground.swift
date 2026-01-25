import SwiftUI

/// A themed gradient background that adapts to the user's accent color choice.
/// Use this as the root container for any screen to get consistent theming.
struct ThemedBackground<Content: View>: View {
    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService

    let intensity: BackgroundIntensity
    let content: Content

    private var isDark: Bool { colorScheme == .dark }

    enum BackgroundIntensity {
        case subtle
        case medium
        case strong

        var startOpacity: Double {
            switch self {
            case .subtle: return 0.08
            case .medium: return 0.15
            case .strong: return 0.25
            }
        }

        var midOpacity: Double {
            switch self {
            case .subtle: return 0.04
            case .medium: return 0.06
            case .strong: return 0.10
            }
        }

        var cornerOpacity: Double {
            switch self {
            case .subtle: return 0.06
            case .medium: return 0.10
            case .strong: return 0.15
            }
        }
    }

    init(intensity: BackgroundIntensity = .medium, @ViewBuilder content: () -> Content) {
        self.intensity = intensity
        self.content = content()
    }

    var body: some View {
        ZStack {
            // Base background
            (isDark ? Color.black : Color.white)
                .ignoresSafeArea()

            // Primary gradient from top-left corner
            LinearGradient(
                colors: isDark ? [
                    themeService.accentColor.opacity(intensity.startOpacity),
                    themeService.accentColor.opacity(intensity.midOpacity),
                    Color.clear
                ] : [
                    themeService.accentColor.opacity(intensity.startOpacity * 2.5),
                    themeService.accentColor.opacity(intensity.midOpacity * 2.0),
                    Color.white
                ],
                startPoint: .topLeading,
                endPoint: UnitPoint(x: 1, y: 0.6)
            )
            .ignoresSafeArea()

            // Secondary gradient from bottom-right for depth
            LinearGradient(
                colors: isDark ? [
                    themeService.accentColor.opacity(intensity.cornerOpacity),
                    Color.clear
                ] : [
                    themeService.accentColor.opacity(intensity.cornerOpacity * 1.8),
                    Color.clear
                ],
                startPoint: .bottomTrailing,
                endPoint: UnitPoint(x: 0.2, y: 0.4)
            )
            .ignoresSafeArea()

            // Top edge glow
            LinearGradient(
                colors: isDark ? [
                    themeService.accentColor.opacity(intensity.midOpacity),
                    Color.clear
                ] : [
                    themeService.accentColor.opacity(intensity.midOpacity * 2.0),
                    Color.clear
                ],
                startPoint: UnitPoint(x: 0.5, y: 0),
                endPoint: UnitPoint(x: 0.5, y: 0.35)
            )
            .ignoresSafeArea()

            content
        }
    }
}

#Preview {
    ThemedBackground {
        VStack {
            Text("Hello World")
                .font(.largeTitle)
                .foregroundStyle(.primary)

            Text("With themed gradient background")
                .foregroundStyle(.secondary)
        }
    }
    .environment(ThemeService())
}
