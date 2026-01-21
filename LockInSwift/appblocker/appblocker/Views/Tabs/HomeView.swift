import SwiftUI
import DeviceActivity

// MARK: - New Liquid Glass HomeView

struct HomeView: View {
    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService
    @Environment(TimeBankService.self) private var timeBank
    @Environment(StatsService.self) private var statsService
    @Environment(BlockingService.self) private var blockingService

    @Binding var selectedTab: Int

    @State private var showSettings = false
    @State private var currentTaskTimeRemaining: TimeInterval = 24 * 60 + 12 // 24:12
    @State private var timer: Timer?

    private var isDark: Bool { colorScheme == .dark }

    // Sample data - replace with real data from services
    private var completedTasks: Int { 3 }
    private var totalTasks: Int { 7 }
    private var progressPercentage: Int {
        guard totalTasks > 0 else { return 0 }
        return Int((Double(completedTasks) / Double(totalTasks)) * 100)
    }

    var body: some View {
        ZStack {
            // Background
            themeService.backgroundColor(for: colorScheme)
                .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 0) {
                    // Header
                    headerSection

                    // Daily Progress Card
                    dailyProgressCard
                        .padding(.horizontal, DesignTokens.paddingPage)
                        .padding(.top, 16)

                    // Current Task Card
                    currentTaskCard
                        .padding(.horizontal, DesignTokens.paddingPage)
                        .padding(.top, 24)

                    // Blocked Applications Section
                    blockedAppsSection
                        .padding(.top, 32)

                    // Community Section
                    communitySection
                        .padding(.horizontal, DesignTokens.paddingPage)
                        .padding(.top, 24)
                        .padding(.bottom, 120)
                }
            }
            .scrollIndicators(.hidden)
        }
        .sheet(isPresented: $showSettings) {
            FullSettingsView()
        }
        .onAppear {
            startTimer()
        }
        .onDisappear {
            timer?.invalidate()
        }
    }

    // MARK: - Header Section

    private var headerSection: some View {
        HStack {
            // Left: Calendar icon + Date
            HStack(spacing: 12) {
                // Calendar icon in accent circle
                ZStack {
                    Circle()
                        .fill(themeService.accentColor.opacity(0.1))
                        .frame(width: 40, height: 40)
                        .overlay(
                            Circle()
                                .stroke(themeService.accentColor.opacity(0.2), lineWidth: 1)
                        )

                    Image(systemName: "calendar")
                        .font(.system(size: 18))
                        .foregroundStyle(themeService.accentColor)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(currentDayOfWeek.uppercased())
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(themeService.accentColor)
                        .tracking(1.5)

                    Text(currentDateFormatted)
                        .font(.system(size: 20, weight: .bold))
                        .foregroundStyle(themeService.textPrimary(for: colorScheme))
                }
            }

            Spacer()

            // Right: Status + Settings
            HStack(spacing: 8) {
                // Status indicator
                VStack(alignment: .trailing, spacing: 2) {
                    Text("STATUS")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(themeService.textMuted(for: colorScheme))
                        .tracking(0.5)

                    HStack(spacing: 6) {
                        Circle()
                            .fill(themeService.accentColor)
                            .frame(width: 8, height: 8)
                            .shadow(color: themeService.accentColor.opacity(0.6), radius: 4)

                        Text("Focused")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(themeService.textSecondary(for: colorScheme))
                    }
                }

                // Settings button
                Button {
                    showSettings = true
                } label: {
                    Image(systemName: "gearshape")
                        .font(.system(size: 18))
                        .foregroundStyle(themeService.textPrimary(for: colorScheme))
                        .frame(width: 40, height: 40)
                        .background(
                            Circle()
                                .fill(isDark ? Color.white.opacity(0.03) : Color.white.opacity(0.6))
                                .background(.ultraThinMaterial)
                                .clipShape(Circle())
                        )
                        .overlay(
                            Circle()
                                .stroke(isDark ? Color.white.opacity(0.08) : Color.white.opacity(0.4), lineWidth: 1)
                        )
                }
            }
        }
        .padding(.horizontal, DesignTokens.paddingPage)
        .padding(.top, 16)
        .padding(.bottom, 8)
    }

    // MARK: - Daily Progress Card

    private var dailyProgressCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("DAILY PROGRESS")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(themeService.textSecondary(for: colorScheme))
                        .tracking(1)

                    Text("\(completedTasks)/\(totalTasks) tasks")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundStyle(themeService.textPrimary(for: colorScheme))
                }

                Spacer()

                Text("\(progressPercentage)% done")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(themeService.accentColor)
            }

            // Progress bar
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(isDark ? Color(hex: "#27272a").opacity(0.5) : Color(hex: "#e5e5e5"))
                        .frame(height: 12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 6)
                                .stroke(Color.white.opacity(0.05), lineWidth: 1)
                        )

                    RoundedRectangle(cornerRadius: 6)
                        .fill(themeService.accentColor)
                        .frame(width: geometry.size.width * CGFloat(progressPercentage) / 100, height: 12)
                        .shadow(color: themeService.accentColor.opacity(0.6), radius: 8)
                }
            }
            .frame(height: 12)

            // Motivational text
            HStack(spacing: 8) {
                Image(systemName: "sparkles")
                    .font(.system(size: 14))
                    .foregroundStyle(themeService.accentColor)

                Text("Almost halfway to your goal today!")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(themeService.textSecondary(for: colorScheme))
            }
            .padding(.top, 4)
        }
        .padding(20)
        .liquidGlass(cornerRadius: 16)
    }

    // MARK: - Current Task Card

    private var currentTaskCard: some View {
        VStack(spacing: 0) {
            // Header image
            ZStack(alignment: .bottomLeading) {
                Rectangle()
                    .fill(
                        LinearGradient(
                            colors: [themeService.accentColor.opacity(0.3), themeService.accentColor.opacity(0.1)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(height: 176)
                    .overlay(
                        Image(systemName: "brain.head.profile")
                            .font(.system(size: 80))
                            .foregroundStyle(themeService.accentColor.opacity(0.2))
                    )

                // Gradient overlay
                LinearGradient(
                    colors: [.clear, themeService.backgroundColor(for: colorScheme).opacity(0.9)],
                    startPoint: .top,
                    endPoint: .bottom
                )

                // Focus Mode badge
                Text("FOCUS MODE")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(.white)
                    .tracking(1.5)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(themeService.accentColor)
                    .clipShape(RoundedRectangle(cornerRadius: 4))
                    .padding(16)
            }
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))

            // Content
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Deep Work Session")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundStyle(themeService.textPrimary(for: colorScheme))

                    Text("Designing the Liquid Glass interface for the next generation productivity suite.")
                        .font(.system(size: 16))
                        .foregroundStyle(themeService.textSecondary(for: colorScheme))
                        .lineSpacing(4)
                }

                HStack {
                    // Timer display
                    HStack(spacing: 12) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 12)
                                .fill(isDark ? Color(hex: "#27272a").opacity(0.5) : Color.white.opacity(0.5))
                                .frame(width: 40, height: 40)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(Color.white.opacity(0.1), lineWidth: 1)
                                )

                            Image(systemName: "timer")
                                .font(.system(size: 18))
                                .foregroundStyle(themeService.textSecondary(for: colorScheme))
                        }

                        VStack(alignment: .leading, spacing: 2) {
                            Text("REMAINING")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(themeService.textMuted(for: colorScheme))
                                .tracking(1)

                            Text(formatTime(currentTaskTimeRemaining))
                                .font(.system(size: 18, weight: .bold))
                                .foregroundStyle(themeService.textPrimary(for: colorScheme))
                        }
                    }

                    Spacer()

                    // Complete button
                    Button {
                        // Complete task action
                    } label: {
                        Text("Complete")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 24)
                            .padding(.vertical, 12)
                            .background(themeService.accentColor)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .shadow(color: themeService.accentColor.opacity(0.6), radius: 12, y: 4)
                    }
                }
            }
            .padding(24)
        }
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(isDark ? Color.white.opacity(0.03) : Color.white.opacity(0.6))
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 16))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(isDark ? Color.white.opacity(0.08) : Color.white.opacity(0.4), lineWidth: 1)
        )
    }

    // MARK: - Blocked Apps Section

    private var blockedAppsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                Text("BLOCKED APPLICATIONS")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(themeService.textPrimary(for: colorScheme).opacity(0.8))
                    .tracking(1.5)

                Spacer()

                Button {
                    // Edit list action
                } label: {
                    Text("EDIT LIST")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(themeService.accentColor)
                        .tracking(0.5)
                }
            }
            .padding(.horizontal, DesignTokens.paddingPage)

            // Apps horizontal scroll
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    // Blocked apps
                    ForEach(blockedApps, id: \.name) { app in
                        BlockedAppIcon(
                            icon: app.icon,
                            name: app.name,
                            isUnlocked: app.isUnlocked
                        )
                    }
                }
                .padding(.horizontal, DesignTokens.paddingPage)
                .padding(.vertical, 16)
            }
        }
    }

    // MARK: - Community Section

    private var communitySection: some View {
        HStack {
            // Avatars stack
            HStack(spacing: -8) {
                ForEach(0..<3, id: \.self) { index in
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [themeService.accentColor, themeService.accentColorDark],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 40, height: 40)
                        .overlay(
                            Text(["A", "J", "M"][index])
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(.white)
                        )
                        .overlay(
                            Circle()
                                .stroke(themeService.backgroundColor(for: colorScheme), lineWidth: 2)
                        )
                }

                // +12 indicator
                Circle()
                    .fill(isDark ? Color(hex: "#27272a") : Color.white)
                    .frame(width: 40, height: 40)
                    .overlay(
                        Text("+12")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(themeService.textMuted(for: colorScheme))
                    )
                    .overlay(
                        Circle()
                            .stroke(themeService.backgroundColor(for: colorScheme), lineWidth: 2)
                    )
            }

            Spacer()

            // Text
            VStack(alignment: .trailing, spacing: 2) {
                Text("In Deep Focus")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(themeService.textPrimary(for: colorScheme))

                Text("Community Active")
                    .font(.system(size: 10))
                    .foregroundStyle(themeService.textMuted(for: colorScheme))
            }
        }
        .padding(16)
        .liquidGlass(cornerRadius: 16)
    }

    // MARK: - Helper Properties

    private var currentDayOfWeek: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE"
        return formatter.string(from: Date())
    }

    private var currentDateFormatted: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"
        return formatter.string(from: Date())
    }

    private var blockedApps: [BlockedAppData] {
        [
            BlockedAppData(icon: "camera.fill", name: "Instagram", isUnlocked: false),
            BlockedAppData(icon: "play.rectangle.fill", name: "TikTok", isUnlocked: false),
            BlockedAppData(icon: "bubble.left.fill", name: "Twitter", isUnlocked: false),
            BlockedAppData(icon: "gamecontroller.fill", name: "Arcade", isUnlocked: false),
            BlockedAppData(icon: "lock.open.fill", name: "Unlocked", isUnlocked: true)
        ]
    }

    // MARK: - Helper Methods

    private func formatTime(_ seconds: TimeInterval) -> String {
        let minutes = Int(seconds) / 60
        let secs = Int(seconds) % 60
        return String(format: "%d:%02d", minutes, secs)
    }

    private func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
            if currentTaskTimeRemaining > 0 {
                currentTaskTimeRemaining -= 1
            }
        }
    }
}

// MARK: - Blocked App Data

struct BlockedAppData {
    let icon: String
    let name: String
    let isUnlocked: Bool
}

// MARK: - Blocked App Icon Component

struct BlockedAppIcon: View {
    @Environment(ThemeService.self) private var themeService
    @Environment(\.colorScheme) private var colorScheme

    let icon: String
    let name: String
    let isUnlocked: Bool

    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                RoundedRectangle(cornerRadius: 16)
                    .fill(
                        isUnlocked
                            ? themeService.accentColor.opacity(0.2)
                            : (isDark ? Color(hex: "#27272a").opacity(0.8) : Color.white.opacity(0.5))
                    )
                    .frame(width: 56, height: 56)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(
                                isUnlocked
                                    ? themeService.accentColor.opacity(0.3)
                                    : Color.white.opacity(0.1),
                                lineWidth: 1
                            )
                    )
                    .shadow(
                        color: isUnlocked ? themeService.accentColor.opacity(0.4) : .clear,
                        radius: isUnlocked ? 12 : 0
                    )

                Image(systemName: icon)
                    .font(.system(size: 24))
                    .foregroundStyle(
                        isUnlocked
                            ? themeService.accentColor
                            : themeService.textPrimary(for: colorScheme)
                    )
            }
            .opacity(isUnlocked ? 1.0 : 0.4)

            Text(name)
                .font(.system(size: 10, weight: isUnlocked ? .bold : .medium))
                .foregroundStyle(
                    isUnlocked
                        ? themeService.accentColor
                        : themeService.textMuted(for: colorScheme)
                )
        }
    }
}

// MARK: - Preview

#Preview {
    HomeView(selectedTab: .constant(0))
        .environment(ThemeService())
        .environment(TimeBankService())
        .environment(StatsService())
        .environment(BlockingService())
        .environment(ExerciseFavoritesService())
        .preferredColorScheme(.dark)
}
