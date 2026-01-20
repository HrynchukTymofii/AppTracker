import SwiftUI

// MARK: - Tab Item Enum

enum NavTabItem: Int, CaseIterable {
    case home = 0
    case schedule = 1
    case stats = 2
    case profile = 3

    var icon: String {
        switch self {
        case .home: return "house"
        case .schedule: return "calendar"
        case .stats: return "chart.bar"
        case .profile: return "person"
        }
    }

    var selectedIcon: String {
        switch self {
        case .home: return "house.fill"
        case .schedule: return "calendar"
        case .stats: return "chart.bar.fill"
        case .profile: return "person.fill"
        }
    }

    var title: String {
        switch self {
        case .home: return L10n.Tab.home
        case .schedule: return L10n.Tab.schedule
        case .stats: return L10n.Tab.stats
        case .profile: return L10n.Tab.profile
        }
    }
}

// MARK: - Adaptive Nav Bar

/// Automatically switches between GrassyGlassNavBar (dark) and LightGlassNavBar (light)
struct AdaptiveNavBar: View {
    @Environment(ThemeService.self) private var theme
    @Environment(\.colorScheme) private var colorScheme
    @Binding var selectedTab: Int

    private var isDark: Bool {
        colorScheme == .dark
    }

    var body: some View {
        if isDark {
            GrassyGlassNavBar(selectedTab: $selectedTab)
        } else {
            LightGlassNavBar(selectedTab: $selectedTab)
        }
    }
}

// MARK: - Grassy Glass Nav Bar (Dark Mode)

/// Apple-style grassy glass navigation bar for dark mode
struct GrassyGlassNavBar: View {
    @Environment(ThemeService.self) private var theme
    @Binding var selectedTab: Int

    var body: some View {
        HStack(spacing: 0) {
            ForEach(NavTabItem.allCases, id: \.rawValue) { tab in
                Button(action: {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                        selectedTab = tab.rawValue
                    }
                }) {
                    ZStack {
                        if selectedTab == tab.rawValue {
                            Capsule()
                                .fill(theme.accentColor.opacity(0.3))
                                .overlay(
                                    Capsule()
                                        .stroke(theme.accentColor.opacity(0.4), lineWidth: 1)
                                )
                                .shadow(color: theme.accentColor.opacity(0.5), radius: 10)
                                .padding(.horizontal, 4)
                                .padding(.vertical, 6)
                        }

                        Image(systemName: selectedTab == tab.rawValue ? tab.selectedIcon : tab.icon)
                            .font(.system(size: 24))
                            .foregroundColor(selectedTab == tab.rawValue ? theme.accentColor : .white.opacity(0.4))
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 8)
        .frame(height: 64)
        .background(
            Capsule()
                .fill(
                    LinearGradient(
                        colors: [
                            theme.accentColor.opacity(0.25),
                            theme.accentColor.opacity(0.15)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .background(.ultraThinMaterial)
                .clipShape(Capsule())
        )
        .overlay(
            Capsule()
                .stroke(theme.accentColor.opacity(0.2), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.37), radius: 16, y: 8)
        .shadow(color: theme.accentColor.opacity(0.15), radius: 20, y: 0)
        .padding(.horizontal, 24)
        .padding(.bottom, 24)
    }
}

// MARK: - Light Glass Nav Bar (Light Mode)

/// Clean glass navigation bar for light mode
struct LightGlassNavBar: View {
    @Environment(ThemeService.self) private var theme
    @Binding var selectedTab: Int

    var body: some View {
        HStack(spacing: 0) {
            ForEach(NavTabItem.allCases, id: \.rawValue) { tab in
                Button(action: {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                        selectedTab = tab.rawValue
                    }
                }) {
                    Image(systemName: selectedTab == tab.rawValue ? tab.selectedIcon : tab.icon)
                        .font(.system(size: 24))
                        .foregroundColor(selectedTab == tab.rawValue ? theme.accentColor : Color(hex: "#7D7A74").opacity(0.6))
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.plain)
            }
        }
        .frame(height: 64)
        .background(
            Capsule()
                .fill(Color.white.opacity(0.7))
                .background(.regularMaterial)
                .clipShape(Capsule())
        )
        .overlay(
            Capsule()
                .stroke(Color.white.opacity(0.4), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.04), radius: 24, y: 4)
        .padding(.horizontal, 24)
        .padding(.bottom, 24)
    }
}

// MARK: - Preview

#Preview("Dark Mode Nav") {
    ZStack {
        Color(hex: "#050505").ignoresSafeArea()

        VStack {
            Spacer()
            GrassyGlassNavBar(selectedTab: .constant(0))
        }
    }
    .environment(ThemeService())
    .preferredColorScheme(.dark)
}

#Preview("Light Mode Nav") {
    ZStack {
        Color(hex: "#FAF9F6").ignoresSafeArea()

        VStack {
            Spacer()
            LightGlassNavBar(selectedTab: .constant(0))
        }
    }
    .environment(ThemeService())
    .preferredColorScheme(.light)
}

#Preview("Adaptive Nav") {
    ZStack {
        Color(hex: "#050505").ignoresSafeArea()

        VStack {
            Spacer()
            AdaptiveNavBar(selectedTab: .constant(0))
        }
    }
    .environment(ThemeService())
}
