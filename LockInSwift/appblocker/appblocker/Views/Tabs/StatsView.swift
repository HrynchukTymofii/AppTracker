import SwiftUI
import DeviceActivity

struct StatsView: View {
    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService

    @State private var isLoadingStats = true
    @State private var reportRefreshId = UUID()
    @State private var lastReportLoadTime: Date?
    @State private var hasLoadedReportOnce = false
    @State private var selectedPeriod = "Week"

    private let cacheMinutes: TimeInterval = 30 * 60
    private var isDark: Bool { colorScheme == .dark }

    // Sample data for demo
    private let streakDays = 12
    private let focusHours = 4.5
    private let focusMinutes = 32
    private let efficiencyPercent = 87
    private let tasksCompleted = 24
    private let totalTasks = 28

    // Weekly activity data (hours per day)
    private let weeklyActivity: [(day: String, hours: Double)] = [
        ("Mon", 3.2),
        ("Tue", 4.5),
        ("Wed", 2.8),
        ("Thu", 5.1),
        ("Fri", 4.2),
        ("Sat", 1.5),
        ("Sun", 2.0)
    ]

    // Heatmap data (4 weeks x 7 days)
    private let heatmapData: [[Int]] = [
        [2, 3, 1, 4, 2, 1, 0],
        [3, 4, 2, 3, 4, 2, 1],
        [1, 2, 3, 4, 3, 2, 1],
        [4, 3, 2, 4, 5, 3, 2]
    ]

    // Milestones
    private let milestones: [(icon: String, title: String, achieved: Bool)] = [
        ("flame.fill", "7 Day Streak", true),
        ("star.fill", "First Focus Session", true),
        ("trophy.fill", "100 Tasks", false),
        ("bolt.fill", "Power User", false)
    ]

    // Top apps (mock data)
    private let topApps: [(name: String, icon: String, time: String, percent: Double)] = [
        ("Instagram", "camera.fill", "2h 15m", 0.45),
        ("TikTok", "play.fill", "1h 48m", 0.36),
        ("YouTube", "play.rectangle.fill", "1h 12m", 0.24),
        ("Twitter", "bird", "45m", 0.15)
    ]

    private var deviceActivityFilter: DeviceActivityFilter {
        let calendar = Calendar.current
        let today = Date()
        let monthAgo = calendar.date(byAdding: .day, value: -30, to: today) ?? today

        return DeviceActivityFilter(
            segment: .daily(
                during: DateInterval(
                    start: calendar.startOfDay(for: monthAgo),
                    end: today
                )
            )
        )
    }

    var body: some View {
        ZStack {
            themeService.backgroundColor(for: colorScheme).ignoresSafeArea()

            ScrollView(showsIndicators: false) {
                VStack(spacing: 24) {
                    // Header
                    headerSection

                    // Hero Streak Card
                    heroStreakCard

                    // Stats Grid (Focus Time + Efficiency)
                    statsGridSection

                    // Activity Chart
                    activityChartCard

                    // Activity Heatmap
                    heatmapCard

                    // Milestones
                    milestonesCard

                    // App Usage (from DeviceActivity)
                    appUsageCard
                }
                .padding(.horizontal, 20)
                .padding(.top, 16)
                .padding(.bottom, 120)
            }
        }
        .onAppear {
            let shouldReload: Bool
            if let lastLoad = lastReportLoadTime {
                shouldReload = Date().timeIntervalSince(lastLoad) > cacheMinutes
            } else {
                shouldReload = true
            }

            if shouldReload && !hasLoadedReportOnce {
                isLoadingStats = true
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                    withAnimation {
                        isLoadingStats = false
                        hasLoadedReportOnce = true
                        lastReportLoadTime = Date()
                    }
                }
            } else if shouldReload && hasLoadedReportOnce {
                lastReportLoadTime = Date()
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                    reportRefreshId = UUID()
                }
            }
        }
    }

    // MARK: - Header Section

    private var headerSection: some View {
        HStack {
            Text("Stats")
                .font(.system(size: 32, weight: .bold))
                .foregroundStyle(themeService.textPrimary(for: colorScheme))

            Spacer()

            // Period Selector
            HStack(spacing: 4) {
                ForEach(["Week", "Month"], id: \.self) { period in
                    Button {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            selectedPeriod = period
                        }
                    } label: {
                        Text(period)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(
                                selectedPeriod == period
                                    ? (isDark ? .white : themeService.accentColor)
                                    : themeService.textSecondary(for: colorScheme)
                            )
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(
                                Group {
                                    if selectedPeriod == period {
                                        RoundedRectangle(cornerRadius: 10)
                                            .fill(
                                                isDark
                                                    ? themeService.accentColor.opacity(0.3)
                                                    : themeService.accentColor.opacity(0.15)
                                            )
                                    }
                                }
                            )
                    }
                }
            }
            .padding(4)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(themeService.glassBackground(for: colorScheme))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(themeService.glassBorder(for: colorScheme), lineWidth: 1)
            )
        }
    }

    // MARK: - Hero Streak Card

    private var heroStreakCard: some View {
        HStack {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 8) {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 24))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [Color.orange, Color.red],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )

                    Text("\(streakDays)")
                        .font(.system(size: 48, weight: .bold))
                        .foregroundStyle(themeService.textPrimary(for: colorScheme))
                }

                Text("Day Streak")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(themeService.textSecondary(for: colorScheme))

                Text("Keep going! You're on fire!")
                    .font(.system(size: 13))
                    .foregroundStyle(themeService.textMuted(for: colorScheme))
            }

            Spacer()

            // Streak flame visualization
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [
                                Color.orange.opacity(0.3),
                                Color.red.opacity(0.1)
                            ],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .frame(width: 80, height: 80)
                    .blur(radius: 10)

                Image(systemName: "flame.fill")
                    .font(.system(size: 44))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [Color.orange, Color.red],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(themeService.glassBackground(for: colorScheme))
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 20))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(
                    LinearGradient(
                        colors: [
                            Color.orange.opacity(0.4),
                            Color.red.opacity(0.2),
                            Color.clear
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1
                )
        )
        .shadow(color: Color.orange.opacity(isDark ? 0.2 : 0.1), radius: 20, y: 8)
    }

    // MARK: - Stats Grid Section

    private var statsGridSection: some View {
        HStack(spacing: 16) {
            // Focus Time Card
            focusTimeCard

            // Efficiency Card
            efficiencyCard
        }
    }

    private var focusTimeCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                ZStack {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(themeService.accentColor.opacity(0.2))
                        .frame(width: 36, height: 36)

                    Image(systemName: "clock.fill")
                        .font(.system(size: 18))
                        .foregroundStyle(themeService.accentColor)
                }

                Spacer()

                Text("+12%")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Color.green)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(
                        Capsule()
                            .fill(Color.green.opacity(0.15))
                    )
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack(alignment: .firstTextBaseline, spacing: 2) {
                    Text("\(Int(focusHours))")
                        .font(.system(size: 32, weight: .bold))
                        .foregroundStyle(themeService.textPrimary(for: colorScheme))

                    Text("h")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(themeService.textSecondary(for: colorScheme))

                    Text("\(focusMinutes)")
                        .font(.system(size: 32, weight: .bold))
                        .foregroundStyle(themeService.textPrimary(for: colorScheme))

                    Text("m")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(themeService.textSecondary(for: colorScheme))
                }

                Text("Focus Time")
                    .font(.system(size: 13))
                    .foregroundStyle(themeService.textMuted(for: colorScheme))
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(themeService.glassBackground(for: colorScheme))
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 16))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(themeService.glassBorder(for: colorScheme), lineWidth: 1)
        )
    }

    private var efficiencyCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                ZStack {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(Color.purple.opacity(0.2))
                        .frame(width: 36, height: 36)

                    Image(systemName: "bolt.fill")
                        .font(.system(size: 18))
                        .foregroundStyle(Color.purple)
                }

                Spacer()

                // Circular progress
                ZStack {
                    Circle()
                        .stroke(
                            themeService.glassBorder(for: colorScheme),
                            lineWidth: 4
                        )
                        .frame(width: 36, height: 36)

                    Circle()
                        .trim(from: 0, to: CGFloat(efficiencyPercent) / 100)
                        .stroke(
                            Color.purple,
                            style: StrokeStyle(lineWidth: 4, lineCap: .round)
                        )
                        .frame(width: 36, height: 36)
                        .rotationEffect(.degrees(-90))
                }
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack(alignment: .firstTextBaseline, spacing: 2) {
                    Text("\(efficiencyPercent)")
                        .font(.system(size: 32, weight: .bold))
                        .foregroundStyle(themeService.textPrimary(for: colorScheme))

                    Text("%")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(themeService.textSecondary(for: colorScheme))
                }

                Text("Efficiency")
                    .font(.system(size: 13))
                    .foregroundStyle(themeService.textMuted(for: colorScheme))
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(themeService.glassBackground(for: colorScheme))
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 16))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(themeService.glassBorder(for: colorScheme), lineWidth: 1)
        )
    }

    // MARK: - Activity Chart Card

    private var activityChartCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Activity")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(themeService.textPrimary(for: colorScheme))

                Spacer()

                Text("This Week")
                    .font(.system(size: 13))
                    .foregroundStyle(themeService.textMuted(for: colorScheme))
            }

            // Bar Chart
            HStack(alignment: .bottom, spacing: 12) {
                ForEach(Array(weeklyActivity.enumerated()), id: \.offset) { index, data in
                    VStack(spacing: 8) {
                        // Bar
                        RoundedRectangle(cornerRadius: 6)
                            .fill(
                                LinearGradient(
                                    colors: [
                                        themeService.accentColor.opacity(0.8),
                                        themeService.accentColor.opacity(0.4)
                                    ],
                                    startPoint: .top,
                                    endPoint: .bottom
                                )
                            )
                            .frame(height: CGFloat(data.hours) * 20)
                            .frame(maxWidth: .infinity)

                        // Day label
                        Text(data.day)
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(themeService.textMuted(for: colorScheme))
                    }
                }
            }
            .frame(height: 140)
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(themeService.glassBackground(for: colorScheme))
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 20))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(themeService.glassBorder(for: colorScheme), lineWidth: 1)
        )
    }

    // MARK: - Heatmap Card

    private var heatmapCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Focus Heatmap")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(themeService.textPrimary(for: colorScheme))

                Spacer()

                // Legend
                HStack(spacing: 4) {
                    Text("Less")
                        .font(.system(size: 10))
                        .foregroundStyle(themeService.textMuted(for: colorScheme))

                    ForEach(0..<5) { level in
                        RoundedRectangle(cornerRadius: 2)
                            .fill(heatmapColor(for: level))
                            .frame(width: 12, height: 12)
                    }

                    Text("More")
                        .font(.system(size: 10))
                        .foregroundStyle(themeService.textMuted(for: colorScheme))
                }
            }

            // Heatmap Grid
            VStack(spacing: 4) {
                ForEach(0..<4, id: \.self) { week in
                    HStack(spacing: 4) {
                        ForEach(0..<7, id: \.self) { day in
                            RoundedRectangle(cornerRadius: 4)
                                .fill(heatmapColor(for: heatmapData[week][day]))
                                .frame(height: 24)
                                .frame(maxWidth: .infinity)
                        }
                    }
                }
            }

            // Day labels
            HStack(spacing: 4) {
                ForEach(["S", "M", "T", "W", "T", "F", "S"], id: \.self) { day in
                    Text(day)
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(themeService.textMuted(for: colorScheme))
                        .frame(maxWidth: .infinity)
                }
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(themeService.glassBackground(for: colorScheme))
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 20))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(themeService.glassBorder(for: colorScheme), lineWidth: 1)
        )
    }

    private func heatmapColor(for level: Int) -> Color {
        switch level {
        case 0: return themeService.glassBorder(for: colorScheme)
        case 1: return themeService.accentColor.opacity(0.25)
        case 2: return themeService.accentColor.opacity(0.5)
        case 3: return themeService.accentColor.opacity(0.75)
        default: return themeService.accentColor
        }
    }

    // MARK: - Milestones Card

    private var milestonesCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Milestones")
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(themeService.textPrimary(for: colorScheme))

            LazyVGrid(columns: [
                GridItem(.flexible(), spacing: 12),
                GridItem(.flexible(), spacing: 12)
            ], spacing: 12) {
                ForEach(milestones.indices, id: \.self) { index in
                    let milestone = milestones[index]
                    milestoneItem(
                        icon: milestone.icon,
                        title: milestone.title,
                        achieved: milestone.achieved
                    )
                }
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(themeService.glassBackground(for: colorScheme))
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 20))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(themeService.glassBorder(for: colorScheme), lineWidth: 1)
        )
    }

    private func milestoneItem(icon: String, title: String, achieved: Bool) -> some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(
                        achieved
                            ? themeService.accentColor.opacity(0.2)
                            : themeService.glassBorder(for: colorScheme)
                    )
                    .frame(width: 40, height: 40)

                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundStyle(
                        achieved
                            ? themeService.accentColor
                            : themeService.textMuted(for: colorScheme)
                    )
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(
                        achieved
                            ? themeService.textPrimary(for: colorScheme)
                            : themeService.textMuted(for: colorScheme)
                    )

                if achieved {
                    Text("Achieved")
                        .font(.system(size: 11))
                        .foregroundStyle(Color.green)
                } else {
                    Text("Locked")
                        .font(.system(size: 11))
                        .foregroundStyle(themeService.textMuted(for: colorScheme))
                }
            }

            Spacer()

            if achieved {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 20))
                    .foregroundStyle(Color.green)
            } else {
                Image(systemName: "lock.fill")
                    .font(.system(size: 16))
                    .foregroundStyle(themeService.textMuted(for: colorScheme))
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(
                    achieved
                        ? themeService.accentColor.opacity(0.05)
                        : Color.clear
                )
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(
                    achieved
                        ? themeService.accentColor.opacity(0.2)
                        : themeService.glassBorder(for: colorScheme),
                    lineWidth: 1
                )
        )
    }

    // MARK: - App Usage Card

    private var appUsageCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("App Usage")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(themeService.textPrimary(for: colorScheme))

                Spacer()

                Text("Today")
                    .font(.system(size: 13))
                    .foregroundStyle(themeService.textMuted(for: colorScheme))
            }

            VStack(spacing: 0) {
                ForEach(topApps.indices, id: \.self) { index in
                    let app = topApps[index]

                    HStack(spacing: 12) {
                        // App icon placeholder
                        ZStack {
                            RoundedRectangle(cornerRadius: 10)
                                .fill(
                                    LinearGradient(
                                        colors: appGradient(for: index),
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .frame(width: 44, height: 44)

                            Image(systemName: app.icon)
                                .font(.system(size: 20))
                                .foregroundStyle(.white)
                        }

                        VStack(alignment: .leading, spacing: 6) {
                            Text(app.name)
                                .font(.system(size: 15, weight: .medium))
                                .foregroundStyle(themeService.textPrimary(for: colorScheme))

                            // Progress bar
                            GeometryReader { geo in
                                ZStack(alignment: .leading) {
                                    RoundedRectangle(cornerRadius: 3)
                                        .fill(themeService.glassBorder(for: colorScheme))
                                        .frame(height: 6)

                                    RoundedRectangle(cornerRadius: 3)
                                        .fill(
                                            LinearGradient(
                                                colors: appGradient(for: index),
                                                startPoint: .leading,
                                                endPoint: .trailing
                                            )
                                        )
                                        .frame(width: geo.size.width * app.percent, height: 6)
                                }
                            }
                            .frame(height: 6)
                        }

                        Spacer()

                        Text(app.time)
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(themeService.textSecondary(for: colorScheme))
                    }
                    .padding(.vertical, 12)

                    if index < topApps.count - 1 {
                        Divider()
                            .background(themeService.glassBorder(for: colorScheme))
                            .padding(.leading, 56)
                    }
                }
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(themeService.glassBackground(for: colorScheme))
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 20))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(themeService.glassBorder(for: colorScheme), lineWidth: 1)
        )
    }

    private func appGradient(for index: Int) -> [Color] {
        let gradients: [[Color]] = [
            [Color(hex: "#E1306C"), Color(hex: "#F77737")], // Instagram
            [Color(hex: "#000000"), Color(hex: "#00f2ea")], // TikTok
            [Color(hex: "#FF0000"), Color(hex: "#FF4444")], // YouTube
            [Color(hex: "#1DA1F2"), Color(hex: "#0077B5")]  // Twitter
        ]
        return gradients[index % gradients.count]
    }
}

// MARK: - DeviceActivityReport Context Extension

extension DeviceActivityReport.Context {
    static let totalActivity = Self("TotalActivity")
}

#Preview {
    StatsView()
        .environment(ThemeService())
}
