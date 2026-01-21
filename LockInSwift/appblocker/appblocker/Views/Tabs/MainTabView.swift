import SwiftUI

struct MainTabView: View {
    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService
    @Environment(TimeBankService.self) private var timeBank
    @Environment(\.deepLinkTab) private var deepLinkTab
    @Environment(\.showCoach) private var showCoach

    @State private var selectedTab = 0

    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        ZStack(alignment: .bottom) {
            // Content
            TabView(selection: $selectedTab) {
                HomeView(selectedTab: $selectedTab)
                    .tag(0)

                ScheduleView()
                    .tag(1)

                StatsView()
                    .tag(2)

                ProfileView()
                    .tag(3)
            }

            // Custom Liquid Glass Tab Bar
            liquidGlassTabBar
        }
        .onChange(of: deepLinkTab.wrappedValue) { _, newTab in
            if let tab = newTab {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                    selectedTab = tab
                }
                // Clear the deep link after navigation
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                    deepLinkTab.wrappedValue = nil
                }
            }
        }
        .sheet(isPresented: showCoach) {
            CoachChatView()
        }
    }

    // MARK: - Liquid Glass Tab Bar

    private var liquidGlassTabBar: some View {
        HStack(spacing: 0) {
            // Home
            LiquidGlassTabButton(
                icon: selectedTab == 0 ? "house.fill" : "house",
                title: L10n.Tab.home,
                isSelected: selectedTab == 0
            ) {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                    selectedTab = 0
                }
            }

            // Schedule
            LiquidGlassTabButton(
                icon: selectedTab == 1 ? "calendar.badge.clock" : "calendar",
                title: L10n.Tab.schedule,
                isSelected: selectedTab == 1
            ) {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                    selectedTab = 1
                }
            }

            // Stats
            LiquidGlassTabButton(
                icon: selectedTab == 2 ? "chart.bar.fill" : "chart.bar",
                title: L10n.Tab.stats,
                isSelected: selectedTab == 2
            ) {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                    selectedTab = 2
                }
            }

            // Profile
            LiquidGlassTabButton(
                icon: selectedTab == 3 ? "person.fill" : "person",
                title: L10n.Tab.profile,
                isSelected: selectedTab == 3
            ) {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                    selectedTab = 3
                }
            }
        }
        .padding(.horizontal, 8)
        .frame(height: 64)
        .background(
            Group {
                if isDark {
                    // Dark mode: Grassy Glass Nav Bar
                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: [
                                    themeService.accentColor.opacity(0.25),
                                    themeService.accentColor.opacity(0.15)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .background(.ultraThinMaterial)
                        .clipShape(Capsule())
                        .overlay(
                            Capsule()
                                .stroke(themeService.accentColor.opacity(0.2), lineWidth: 1)
                        )
                        .shadow(color: .black.opacity(0.37), radius: 16, y: 8)
                        .shadow(color: themeService.accentColor.opacity(0.15), radius: 20, y: 0)
                } else {
                    // Light mode: Clean Glass Nav Bar
                    Capsule()
                        .fill(Color.white.opacity(0.7))
                        .background(.regularMaterial)
                        .clipShape(Capsule())
                        .overlay(
                            Capsule()
                                .stroke(Color.white.opacity(0.4), lineWidth: 1)
                        )
                        .shadow(color: .black.opacity(0.04), radius: 24, y: 4)
                }
            }
        )
        .padding(.horizontal, 24)
        .padding(.bottom, 24)
    }

}

// MARK: - Liquid Glass Tab Button

struct LiquidGlassTabButton: View {
    @Environment(ThemeService.self) private var themeService
    @Environment(\.colorScheme) private var colorScheme

    let icon: String
    let title: String
    let isSelected: Bool
    let action: () -> Void

    private var isDark: Bool { colorScheme == .dark }

    private var inactiveColor: Color {
        isDark ? Color.white.opacity(0.4) : Color(hex: "#7D7A74").opacity(0.6)
    }

    var body: some View {
        Button(action: action) {
            ZStack {
                // Selected indicator (capsule background in dark mode)
                if isSelected && isDark {
                    Capsule()
                        .fill(themeService.accentColor.opacity(0.3))
                        .overlay(
                            Capsule()
                                .stroke(themeService.accentColor.opacity(0.4), lineWidth: 1)
                        )
                        .shadow(color: themeService.accentColor.opacity(0.5), radius: 10)
                        .frame(width: 48, height: 36)
                }

                Image(systemName: icon)
                    .font(.system(size: 22))
                    .foregroundColor(isSelected ? themeService.accentColor : inactiveColor)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 48)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Scale Button Style

struct ScaleButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.92 : 1.0)
            .animation(.spring(response: 0.2, dampingFraction: 0.6), value: configuration.isPressed)
    }
}

// MARK: - Legacy Components (kept for compatibility)

struct GlassyTabButton: View {
    let icon: String
    let title: String
    let isSelected: Bool
    let isDark: Bool
    let accentColor: Color
    let action: () -> Void

    private var inactiveColor: Color {
        isDark ? Color.white.opacity(0.5) : Color(hex: "64748b")
    }

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                ZStack {
                    if isSelected {
                        Capsule()
                            .fill(accentColor.opacity(isDark ? 0.2 : 0.12))
                            .frame(width: 44, height: 28)
                    }

                    Image(systemName: icon)
                        .font(.system(size: 17, weight: isSelected ? .semibold : .medium))
                        .foregroundStyle(isSelected ? accentColor : inactiveColor)
                        .symbolEffect(.bounce, value: isSelected)
                }
                .frame(height: 28)

                Text(title)
                    .font(.system(size: 9, weight: .semibold))
                    .foregroundStyle(isSelected ? accentColor : inactiveColor)
            }
        }
        .frame(maxWidth: .infinity)
        .buttonStyle(ScaleButtonStyle())
    }
}

struct TabButton: View {
    let icon: String
    let title: String
    let isSelected: Bool
    let isDark: Bool
    let action: () -> Void

    private let activeColor = Color(red: 59/255, green: 130/255, blue: 246/255)
    private var inactiveColor: Color {
        isDark ? Color.white.opacity(0.5) : Color(red: 148/255, green: 163/255, blue: 184/255)
    }

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                ZStack {
                    if isSelected {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(activeColor.opacity(isDark ? 0.15 : 0.1))
                            .frame(width: 44, height: 32)
                    }

                    Image(systemName: icon)
                        .font(.system(size: 20, weight: isSelected ? .semibold : .regular))
                        .foregroundStyle(isSelected ? activeColor : inactiveColor)
                }
                .frame(height: 32)

                Text(title)
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(isSelected ? activeColor : inactiveColor)
            }
        }
        .frame(maxWidth: .infinity)
    }
}

#Preview {
    MainTabView()
        .environment(ThemeService())
        .environment(TimeBankService())
        .environment(BlockingService())
        .environment(StatsService())
        .environment(AuthService())
}
