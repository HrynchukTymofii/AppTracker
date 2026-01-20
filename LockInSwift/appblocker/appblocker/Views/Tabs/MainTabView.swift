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

                BlockingView()
                    .tag(1)

                LockInView()
                    .tag(2)

                StatsView()
                    .tag(3)

                ProfileView()
                    .tag(4)
            }

            // Custom Glassy Tab Bar
            glassyTabBar
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

    // MARK: - Glassy Tab Bar

    private var glassyTabBar: some View {
        HStack(spacing: 0) {
            // Home
            GlassyTabButton(
                icon: "house.fill",
                title: L10n.Tab.home,
                isSelected: selectedTab == 0,
                isDark: isDark,
                accentColor: themeService.accentColor
            ) {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                    selectedTab = 0
                }
            }

            // Goals
            GlassyTabButton(
                icon: "target",
                title: L10n.Tab.goals,
                isSelected: selectedTab == 1,
                isDark: isDark,
                accentColor: themeService.accentColor
            ) {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                    selectedTab = 1
                }
            }

            // LockIn - Center floating button
            glassyLockInButton

            // Stats
            GlassyTabButton(
                icon: "chart.bar.fill",
                title: L10n.Tab.stats,
                isSelected: selectedTab == 3,
                isDark: isDark,
                accentColor: themeService.accentColor
            ) {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                    selectedTab = 3
                }
            }

            // Profile
            GlassyTabButton(
                icon: "person.fill",
                title: L10n.Tab.profile,
                isSelected: selectedTab == 4,
                isDark: isDark,
                accentColor: themeService.accentColor
            ) {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                    selectedTab = 4
                }
            }
        }
        .padding(.horizontal, 4)
        .padding(.top, 6)
        .padding(.bottom, 16)
        .background(
            ZStack {
                // Solid base matching app background with Liquid Glass effect
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .fill(isDark ? themeService.backgroundColor(for: colorScheme) : Color.white)

                // Grassy glass gradient for dark mode
                if isDark {
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [
                                    themeService.accentColor.opacity(0.15),
                                    themeService.accentColor.opacity(0.08)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .background(.ultraThinMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
                } else {
                    // Light mode: clean glass effect
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .fill(Color.white.opacity(0.7))
                        .background(.regularMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
                }

                // Border
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .stroke(
                        isDark
                            ? themeService.accentColor.opacity(0.2)
                            : Color.white.opacity(0.4),
                        lineWidth: 1
                    )
            }
            .shadow(color: .black.opacity(isDark ? 0.37 : 0.04), radius: isDark ? 16 : 24, y: isDark ? 8 : 4)
            .shadow(color: isDark ? themeService.accentColor.opacity(0.15) : .clear, radius: 20, y: 0)
        )
        .padding(.horizontal, 12)
    }

    // MARK: - Glassy LockIn Center Button

    private var glassyLockInButton: some View {
        Button {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                selectedTab = 2
            }
        } label: {
            VStack(spacing: 2) {
                // Floating gradient button
                ZStack {
                    // Bright gradient button
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [
                                    themeService.accentColor.opacity(0.9),
                                    themeService.accentColor,
                                    themeService.accentColorDark
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 48, height: 48)
                        .overlay(
                            // Shine highlight
                            Circle()
                                .fill(
                                    LinearGradient(
                                        colors: [Color.white.opacity(0.5), Color.clear],
                                        startPoint: .topLeading,
                                        endPoint: .center
                                    )
                                )
                                .frame(width: 48, height: 48)
                        )
                        .shadow(color: themeService.accentColor.opacity(0.6), radius: 10, y: 4)

                    // Icon - brighter
                    Image(systemName: "scope")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundStyle(.white)
                }
                .offset(y: -8)
                .scaleEffect(selectedTab == 2 ? 1.08 : 1.0)

                Text(L10n.Tab.lockin)
                    .font(.system(size: 9, weight: .bold))
                    .foregroundStyle(
                        selectedTab == 2
                            ? themeService.accentColor
                            : (isDark ? Color.white.opacity(0.5) : Color(hex: "94a3b8"))
                    )
                    .offset(y: -4)
            }
        }
        .frame(maxWidth: .infinity)
        .buttonStyle(ScaleButtonStyle())
    }
}

// MARK: - Glassy Tab Button

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
                // Icon with subtle pill background when selected
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

// MARK: - Scale Button Style

struct ScaleButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.92 : 1.0)
            .animation(.spring(response: 0.2, dampingFraction: 0.6), value: configuration.isPressed)
    }
}

// MARK: - Legacy Tab Button (kept for reference)

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
