import SwiftUI

struct HomeView: View {
    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService
    @Environment(TimeBankService.self) private var timeBank
    @Environment(StatsService.self) private var statsService
    @Environment(BlockingService.self) private var blockingService

    @State private var showQuickMenu = false
    @State private var showHelpCarousel = false
    @State private var isRefreshing = false

    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        NavigationStack {
            ZStack {
                // Background
                Color.appBackground.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 0) {
                        // Header
                        headerSection

                        // Animated Orb
                        orbSection

                        // Health Progress Bar
                        healthProgressBar

                        // Quick Stats (3 cards)
                        quickStatsSection

                        // Time Bank Card
                        timeBankCard

                        // Schedules Section
                        schedulesSection

                        // App Usage Section
                        appUsageSection
                    }
                    .padding(.bottom, 100)
                }
                .refreshable {
                    await refreshData()
                }

                // Quick Action FAB
                quickActionButton
            }
            .sheet(isPresented: $showHelpCarousel) {
                HelpCarouselView()
            }
        }
    }

    // MARK: - Header

    private var headerSection: some View {
        HStack {
            Text("Home")
                .font(.system(size: 32, weight: .bold))
                .foregroundStyle(isDark ? .white : Color(red: 17/255, green: 24/255, blue: 39/255))

            Spacer()

            Button {
                showHelpCarousel = true
            } label: {
                Circle()
                    .fill(isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.05))
                    .frame(width: 48, height: 48)
                    .overlay {
                        Image(systemName: "questionmark.circle")
                            .font(.system(size: 24, weight: .medium))
                            .foregroundStyle(isDark ? .white : Color(red: 17/255, green: 24/255, blue: 39/255))
                    }
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 16)
        .padding(.bottom, 8)
    }

    // MARK: - Animated Orb

    private var orbSection: some View {
        AnimatedOrbView(
            size: 160,
            level: statsService.getOrbLevel(),
            healthScore: statsService.healthScore
        )
        .frame(height: 220)
        .padding(.vertical, 20)
    }

    // MARK: - Health Progress Bar

    private var healthProgressBar: some View {
        VStack(spacing: 8) {
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    // Background
                    RoundedRectangle(cornerRadius: 6)
                        .fill(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.06))

                    // Progress
                    RoundedRectangle(cornerRadius: 6)
                        .fill(healthGradient)
                        .frame(width: geometry.size.width * CGFloat(statsService.healthScore) / 100)
                        .shadow(color: Color.healthColor(for: statsService.healthScore).opacity(0.5), radius: 8)
                }
            }
            .frame(height: 12)

            Text("Health \u{2022} \(statsService.healthScore)")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(isDark ? Color(white: 0.6) : Color(white: 0.4))
                .tracking(0.5)
        }
        .padding(.horizontal, 40)
        .padding(.bottom, 24)
    }

    private var healthGradient: LinearGradient {
        let score = statsService.healthScore
        let colors: [Color]

        if score >= 80 {
            colors = [Color(red: 16/255, green: 185/255, blue: 129/255),
                      Color(red: 52/255, green: 211/255, blue: 153/255),
                      Color(red: 110/255, green: 231/255, blue: 183/255)]
        } else if score >= 60 {
            colors = [Color(red: 34/255, green: 197/255, blue: 94/255),
                      Color(red: 74/255, green: 222/255, blue: 128/255),
                      Color(red: 134/255, green: 239/255, blue: 172/255)]
        } else if score >= 40 {
            colors = [Color(red: 234/255, green: 179/255, blue: 8/255),
                      Color(red: 250/255, green: 204/255, blue: 21/255),
                      Color(red: 253/255, green: 224/255, blue: 71/255)]
        } else {
            colors = [Color(red: 249/255, green: 115/255, blue: 22/255),
                      Color(red: 251/255, green: 146/255, blue: 60/255),
                      Color(red: 253/255, green: 186/255, blue: 116/255)]
        }

        return LinearGradient(colors: colors, startPoint: .leading, endPoint: .trailing)
    }

    // MARK: - Quick Stats

    private var quickStatsSection: some View {
        HStack(spacing: 10) {
            // Streak
            StatCard(
                title: "STREAK",
                value: "\(statsService.currentStreak)",
                icon: nil,
                emoji: "\u{1F525}"
            )

            // Today
            StatCard(
                title: "TODAY",
                value: statsService.formattedTodayScreenTime,
                icon: nil,
                emoji: nil
            )

            // vs Average
            let comparison = statsService.timeComparisonToAverage
            StatCard(
                title: "VS AVG",
                value: "\(comparison.isLess ? "-" : "+")\(comparison.difference)",
                icon: comparison.isLess ? "arrow.down.right" : "arrow.up.right",
                iconColor: comparison.isLess ? .healthExcellent : .healthCritical,
                emoji: nil
            )
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 24)
    }

    // MARK: - Time Bank Card

    private var timeBankCard: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: "clock.fill")
                    .font(.system(size: 20))
                    .foregroundStyle(themeService.accentColor)

                Text("Time Bank")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(isDark ? .white : .black)

                Spacer()

                Text(timeBank.formattedBalance)
                    .font(.system(size: 24, weight: .bold))
                    .foregroundStyle(themeService.accentColor)
            }

            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Earned today")
                        .font(.system(size: 12))
                        .foregroundStyle(.secondary)
                    Text("+\(timeBank.todayEarned)m")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(.green)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    Text("Spent today")
                        .font(.system(size: 12))
                        .foregroundStyle(.secondary)
                    Text("-\(timeBank.todaySpent)m")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(.red)
                }
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(isDark ? Color.white.opacity(0.05) : .white)
                .shadow(color: .black.opacity(0.05), radius: 10)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.04), lineWidth: 1)
        )
        .padding(.horizontal, 20)
        .padding(.bottom, 16)
    }

    // MARK: - Schedules Section

    private var schedulesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Upcoming")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(.secondary)
                .textCase(.uppercase)
                .tracking(0.5)
                .padding(.horizontal, 20)

            // Placeholder for schedules
            NavigationLink {
                BlockingView()
            } label: {
                HStack(spacing: 12) {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(themeService.accentColor)
                        .frame(width: 40, height: 40)
                        .overlay {
                            Image(systemName: "plus")
                                .font(.system(size: 20, weight: .medium))
                                .foregroundStyle(.white)
                        }

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Create a Schedule")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(themeService.accentColor)
                        Text("Set unblock windows for your apps")
                            .font(.system(size: 12))
                            .foregroundStyle(.secondary)
                    }

                    Spacer()
                }
                .padding(16)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(themeService.accentColor.opacity(0.08))
                        .strokeBorder(themeService.accentColor, style: StrokeStyle(lineWidth: 1.5, dash: [6]))
                )
                .padding(.horizontal, 20)
            }
        }
        .padding(.bottom, 24)
    }

    // MARK: - App Usage Section

    private var appUsageSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("App Usage Today")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(isDark ? .white : Color(red: 17/255, green: 24/255, blue: 39/255))

                Spacer()

                NavigationLink {
                    StatsView()
                } label: {
                    HStack(spacing: 4) {
                        Text("View All")
                            .font(.system(size: 14, weight: .semibold))
                        Image(systemName: "chevron.right")
                            .font(.system(size: 12, weight: .semibold))
                    }
                    .foregroundStyle(themeService.accentColor)
                }
            }
            .padding(.horizontal, 20)

            // Screen Time Card
            Button {
                Task {
                    await refreshData()
                }
            } label: {
                HStack(spacing: 16) {
                    // Icon
                    RoundedRectangle(cornerRadius: 16)
                        .fill(
                            LinearGradient(
                                colors: [Color.healthExcellent, Color(red: 5/255, green: 150/255, blue: 105/255)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 56, height: 56)
                        .overlay {
                            Image(systemName: "clock.fill")
                                .font(.system(size: 28, weight: .medium))
                                .foregroundStyle(.white)
                        }

                    VStack(alignment: .leading, spacing: 4) {
                        Text("View Screen Time")
                            .font(.system(size: 17, weight: .bold))
                            .foregroundStyle(isDark ? .white : Color(red: 17/255, green: 24/255, blue: 39/255))
                        Text("Tap to see your detailed app usage")
                            .font(.system(size: 13))
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    Image(systemName: "chevron.right")
                        .font(.system(size: 16))
                        .foregroundStyle(.secondary)
                }
                .padding(20)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(isDark ? Color.white.opacity(0.05) : .white)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.05), lineWidth: 1)
                )
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 20)
        }
    }

    // MARK: - Quick Action Button

    private var quickActionButton: some View {
        VStack {
            Spacer()
            HStack {
                Spacer()
                Button {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                        showQuickMenu.toggle()
                    }
                } label: {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(themeService.primaryGradient)
                        .frame(width: 56, height: 56)
                        .overlay {
                            Image(systemName: showQuickMenu ? "xmark" : "bolt.fill")
                                .font(.system(size: 26, weight: .medium))
                                .foregroundStyle(.white)
                        }
                        .shadow(color: themeService.accentColor.opacity(0.5), radius: 12, y: 6)
                }
                .padding(.trailing, 24)
                .padding(.bottom, 140)
            }
        }
    }

    // MARK: - Refresh

    private func refreshData() async {
        isRefreshing = true
        await statsService.refresh()
        _ = statsService.calculateHealthScore()
        isRefreshing = false
    }
}

// MARK: - Stat Card

struct StatCard: View {
    let title: String
    let value: String
    var icon: String?
    var iconColor: Color?
    var emoji: String?

    @Environment(\.colorScheme) private var colorScheme
    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        VStack(spacing: 6) {
            Text(title)
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(Color(white: 0.5))
                .tracking(0.5)
                .textCase(.uppercase)

            HStack(spacing: 4) {
                if let emoji = emoji {
                    Text(emoji)
                        .font(.system(size: 14))
                }
                if let icon = icon {
                    Image(systemName: icon)
                        .font(.system(size: 14))
                        .foregroundStyle(iconColor ?? .primary)
                }
                Text(value)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(iconColor ?? (isDark ? .white : Color(red: 17/255, green: 24/255, blue: 39/255)))
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(isDark ? Color.white.opacity(0.05) : Color(white: 0.97))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.04), lineWidth: 1)
        )
    }
}

// MARK: - Help Carousel

struct HelpCarouselView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack {
                Text("Help & Tips")
                    .font(.title)
                    .padding()

                Spacer()

                Text("Coming soon...")
                    .foregroundStyle(.secondary)

                Spacer()
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    HomeView()
        .environment(ThemeService())
        .environment(TimeBankService())
        .environment(StatsService())
        .environment(BlockingService())
}
