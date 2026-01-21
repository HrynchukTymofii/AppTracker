import SwiftUI
import DeviceActivity

struct StatsView: View {
    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService

    // @State private var showShareSheet = false  // Disabled for now
    @State private var isLoadingStats = true
    @State private var reportRefreshId = UUID()
    @State private var lastReportLoadTime: Date?
    @State private var hasLoadedReportOnce = false

    // Cache duration - only reload if 30+ minutes passed
    private let cacheMinutes: TimeInterval = 30 * 60

    private var isDark: Bool { colorScheme == .dark }

    // Fetch stats from shared container for sharing (disabled for now)
    /*
    private var weekStats: WeekStatsData {
        guard let defaults = UserDefaults(suiteName: "group.com.hrynchuk.appblocker") else {
            return WeekStatsData()
        }

        let thisWeekTotal = defaults.double(forKey: "stats.thisWeekTotal")
        let lastWeekTotal = defaults.double(forKey: "stats.lastWeekTotal")
        let todayDuration = defaults.double(forKey: "totalScreenTime")

        return WeekStatsData(
            thisWeekTotal: thisWeekTotal,
            lastWeekTotal: lastWeekTotal,
            todayDuration: todayDuration
        )
    }
    */

    // Request 30 days of data
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
        ThemedBackground {
            VStack(spacing: 0) {
                // Header
                headerSection

                // ZStack with both report and skeleton
                // Both are ALWAYS rendered, controlled by opacity
                ZStack {
                    // Skeleton - visible while loading
                    StatsPageSkeletonLoader()
                        .padding(.horizontal, 20)
                        .padding(.top, 4)
                        .opacity(isLoadingStats ? 1 : 0)

                    // Report - visible after loading
                    DeviceActivityReport(
                        DeviceActivityReport.Context.totalActivity,
                        filter: deviceActivityFilter
                    )
                    .id(reportRefreshId)
                    .opacity(isLoadingStats ? 0 : 1)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .animation(.easeInOut(duration: 0.3), value: isLoadingStats)
        }
        .onAppear {
            // Check if we need to reload (first load OR 30+ minutes passed)
            let shouldReload: Bool
            if let lastLoad = lastReportLoadTime {
                shouldReload = Date().timeIntervalSince(lastLoad) > cacheMinutes
            } else {
                shouldReload = true  // First load
            }

            if shouldReload && !hasLoadedReportOnce {
                // First load - show skeleton
                isLoadingStats = true
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                    withAnimation {
                        isLoadingStats = false
                        hasLoadedReportOnce = true
                        lastReportLoadTime = Date()
                    }
                }
            } else if shouldReload && hasLoadedReportOnce {
                // Subsequent reload after 30 min - just refresh in background
                lastReportLoadTime = Date()
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                    reportRefreshId = UUID()
                }
            }
            // If cache is fresh, do nothing - keep showing existing data
        }
        // Share sheet disabled for now
        /*
        .sheet(isPresented: $showShareSheet) {
            StatsShareSheet(stats: weekStats)
        }
        */
    }

    // MARK: - Header Section

    private var headerSection: some View {
        HStack {
            Text(L10n.Tab.stats)
                .font(.system(size: 32, weight: .bold))
                .foregroundStyle(isDark ? .white : Color(hex: "111827"))

            Spacer()

            // Share button - glassy style (disabled for now)
            // TODO: Fix share functionality
            /*
            Button {
                showShareSheet = true
            } label: {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(
                            LinearGradient(
                                colors: isDark
                                    ? [Color.white.opacity(0.12), Color.white.opacity(0.06)]
                                    : [Color.white.opacity(0.6), Color.white.opacity(0.4)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(
                                    LinearGradient(
                                        colors: [
                                            Color(hex: "3b82f6").opacity(0.4),
                                            Color(hex: "8b5cf6").opacity(0.2)
                                        ],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    ),
                                    lineWidth: 1
                                )
                        )
                        .shadow(color: Color(hex: "3b82f6").opacity(isDark ? 0.2 : 0.1), radius: 8, y: 2)

                    Image(systemName: "square.and.arrow.up")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [Color(hex: "3b82f6"), Color(hex: "8b5cf6")],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                }
                .frame(width: 40, height: 40)
            }
            */

            // Period badge
            Text(L10n.Stats.thisWeek)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(isDark ? Color.white.opacity(0.6) : Color(hex: "64748b"))
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(
                    RoundedRectangle(cornerRadius: 10)
                        .fill(isDark ? Color.white.opacity(0.08) : Color.white.opacity(0.5))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.04), lineWidth: 0.5)
                )
        }
        .padding(.horizontal, 20)
        .padding(.top, 16)
        .padding(.bottom, 12)
    }
}

// MARK: - Week Stats Data

struct WeekStatsData {
    var thisWeekTotal: TimeInterval = 0
    var lastWeekTotal: TimeInterval = 0
    var todayDuration: TimeInterval = 0

    var weekChange: Double {
        guard lastWeekTotal > 0 else { return 0 }
        return ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100
    }

    var improved: Bool { weekChange < 0 }

    var dailyAverage: TimeInterval {
        thisWeekTotal / 7
    }

    func formatHours(_ duration: TimeInterval) -> String {
        let hours = duration / 3600
        if hours >= 1 {
            return String(format: "%.1fh", hours)
        }
        let minutes = Int(duration / 60)
        return "\(minutes)m"
    }
}

// MARK: - Stats Share Sheet

struct StatsShareSheet: View {
    let stats: WeekStatsData
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme

    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBackground.ignoresSafeArea()

                VStack(spacing: 24) {
                    Text(L10n.Stats.shareProgress)
                        .font(.system(size: 20, weight: .bold))
                        .foregroundStyle(isDark ? .white : Color(hex: "111827"))
                        .padding(.top, 8)

                    // Preview card
                    ShareableStatsCard(stats: stats, isDark: true)
                        .frame(width: 320)
                        .padding(20)
                        .background(
                            RoundedRectangle(cornerRadius: 20)
                                .fill(isDark ? Color.white.opacity(0.05) : Color.white.opacity(0.5))
                        )

                    // Share button
                    Button {
                        shareStats()
                    } label: {
                        HStack(spacing: 10) {
                            Image(systemName: "square.and.arrow.up")
                                .font(.system(size: 18, weight: .semibold))
                            Text(L10n.Stats.share)
                                .font(.system(size: 17, weight: .bold))
                        }
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(
                            RoundedRectangle(cornerRadius: 14)
                                .fill(
                                    LinearGradient(
                                        colors: [Color(hex: "3b82f6"), Color(hex: "1d4ed8")],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                        )
                        .shadow(color: Color(hex: "3b82f6").opacity(0.4), radius: 12, y: 4)
                    }
                    .padding(.horizontal, 40)

                    Spacer()
                }
                .padding(.top, 20)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 24))
                            .foregroundStyle(isDark ? Color.white.opacity(0.3) : Color.black.opacity(0.2))
                    }
                }
            }
        }
    }

    @MainActor
    private func shareStats() {
        let cardView = ShareableStatsCard(stats: stats, isDark: true)
            .frame(width: 340)
            .padding(24)
            .background(Color.black)

        let renderer = ImageRenderer(content: cardView)
        renderer.scale = 3.0

        guard let image = renderer.uiImage else { return }

        let improved = stats.improved
        let changePercent = abs(Int(stats.weekChange))
        let message = improved
            ? "Down \(changePercent)% this week! Tracking my screen time with LockIn"
            : "Tracking my screen time with LockIn"

        let activityItems: [Any] = [image, message]
        let activityVC = UIActivityViewController(activityItems: activityItems, applicationActivities: nil)

        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first {
            var topController = window.rootViewController
            while let presented = topController?.presentedViewController {
                topController = presented
            }
            topController?.present(activityVC, animated: true)
        }
    }
}

// MARK: - Shareable Stats Card

struct ShareableStatsCard: View {
    let stats: WeekStatsData
    let isDark: Bool

    private var improved: Bool { stats.improved }
    private var changePercent: Int { abs(Int(stats.weekChange)) }

    private var bgColor: Color { isDark ? Color.black : .white }
    private var textColor: Color { isDark ? .white : Color(hex: "111827") }
    private var mutedColor: Color { isDark ? Color(hex: "9ca3af") : Color(hex: "6b7280") }
    private var cardBg: Color { isDark ? Color.white.opacity(0.05) : Color.white.opacity(0.5) }
    private var cardBorder: Color { isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.06) }

    var body: some View {
        VStack(spacing: 20) {
            // App branding
            HStack(spacing: 8) {
                Image(systemName: "chart.bar.fill")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [Color(hex: "3b82f6"), Color(hex: "8b5cf6")],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                Text(L10n.Stats.weeklyStats)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(textColor)

                Spacer()

                Text("LockIn")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(mutedColor)
            }

            // Main comparison card
            VStack(spacing: 16) {
                // Week comparison
                HStack {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(L10n.Stats.vsLastWeek)
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(mutedColor)
                            .tracking(0.5)

                        HStack(spacing: 10) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 10)
                                    .fill(improved
                                          ? Color(hex: "10b981").opacity(0.15)
                                          : Color(hex: "ef4444").opacity(0.15))
                                    .frame(width: 36, height: 36)

                                Image(systemName: improved ? "arrow.down.right" : "arrow.up.right")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundStyle(improved ? Color(hex: "10b981") : Color(hex: "ef4444"))
                            }

                            VStack(alignment: .leading, spacing: 2) {
                                Text("\(changePercent)%")
                                    .font(.system(size: 32, weight: .heavy))
                                    .foregroundStyle(improved ? Color(hex: "10b981") : Color(hex: "ef4444"))

                                Text(improved ? L10n.Stats.lessScreenTime : L10n.Stats.moreScreenTime)
                                    .font(.system(size: 12))
                                    .foregroundStyle(mutedColor)
                            }
                        }
                    }

                    Spacer()
                }

                // Divider
                Rectangle()
                    .fill(cardBorder)
                    .frame(height: 1)

                // Stats row
                HStack(spacing: 0) {
                    statItem(title: L10n.Stats.thisWeek, value: stats.formatHours(stats.thisWeekTotal))
                    statItem(title: L10n.Stats.lastWeek, value: stats.formatHours(stats.lastWeekTotal))
                    statItem(title: L10n.Stats.dailyAvg, value: stats.formatHours(stats.dailyAverage))
                }
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(cardBg)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(improved ? Color(hex: "10b981").opacity(0.3) : Color(hex: "ef4444").opacity(0.3), lineWidth: 1)
            )
        }
    }

    private func statItem(title: String, value: String) -> some View {
        VStack(spacing: 4) {
            Text(title.uppercased())
                .font(.system(size: 9, weight: .bold))
                .foregroundStyle(mutedColor)
                .tracking(0.3)

            Text(value)
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(textColor)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - DeviceActivityReport Context Extension

extension DeviceActivityReport.Context {
    static let totalActivity = Self("TotalActivity")
}

// MARK: - Stats Page Skeleton Loader

struct StatsPageSkeletonLoader: View {
    @Environment(\.colorScheme) private var colorScheme
    @State private var isAnimating = false

    private var isDark: Bool { colorScheme == .dark }

    private var shimmerGradient: LinearGradient {
        LinearGradient(
            colors: [
                isDark ? Color.white.opacity(0.03) : Color.white.opacity(0.3),
                isDark ? Color.white.opacity(0.08) : Color.white.opacity(0.6),
                isDark ? Color.white.opacity(0.03) : Color.white.opacity(0.3)
            ],
            startPoint: .leading,
            endPoint: .trailing
        )
    }

    private var skeletonBg: Color {
        isDark ? Color.white.opacity(0.05) : Color.white.opacity(0.5)
    }

    private var cardBg: Color {
        isDark ? Color.white.opacity(0.05) : Color.white.opacity(0.5)
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 24) {
                // Week Comparison Card Skeleton
                weekComparisonSkeleton

                // 2x2 Stats Grid Skeleton
                statsGridSkeleton

                // Chart Section Skeleton
                chartSectionSkeleton

                // Top Apps Section Skeleton
                topAppsSkeleton
            }
            .padding(.bottom, 100)
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) {
                isAnimating = true
            }
        }
    }

    private var weekComparisonSkeleton: some View {
        VStack(alignment: .leading, spacing: 12) {
            skeletonPill(width: 80, height: 12)

            HStack(spacing: 10) {
                RoundedRectangle(cornerRadius: 12)
                    .fill(skeletonBg)
                    .frame(width: 40, height: 40)
                    .overlay(shimmerOverlay)

                VStack(alignment: .leading, spacing: 4) {
                    skeletonPill(width: 60, height: 28)
                    skeletonPill(width: 100, height: 12)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    skeletonPill(width: 80, height: 18)
                    skeletonPill(width: 60, height: 12)
                }
            }
        }
        .padding(20)
        .background(cardBg)
        .cornerRadius(14)
    }

    private var statsGridSkeleton: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                statCardSkeleton
                statCardSkeleton
            }
            HStack(spacing: 12) {
                statCardSkeleton
                statCardSkeleton
            }
        }
    }

    private var statCardSkeleton: some View {
        VStack(spacing: 6) {
            skeletonPill(width: 60, height: 10)
            skeletonPill(width: 50, height: 24)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(cardBg)
        .cornerRadius(14)
    }

    private var chartSectionSkeleton: some View {
        VStack(spacing: 20) {
            // Header
            HStack(spacing: 10) {
                RoundedRectangle(cornerRadius: 10)
                    .fill(skeletonBg)
                    .frame(width: 32, height: 32)
                    .overlay(shimmerOverlay)

                skeletonPill(width: 100, height: 16)
                Spacer()
            }

            // Bar chart skeleton
            HStack(alignment: .bottom, spacing: 8) {
                ForEach(0..<7, id: \.self) { index in
                    VStack(spacing: 4) {
                        RoundedRectangle(cornerRadius: 6)
                            .fill(skeletonBg)
                            .frame(height: CGFloat([60, 90, 45, 100, 75, 55, 80][index]))
                            .overlay(shimmerOverlay)

                        skeletonPill(width: 24, height: 10)
                        skeletonPill(width: 28, height: 8)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .frame(height: 150)
        }
        .padding(20)
        .background(cardBg)
        .cornerRadius(14)
    }

    private var topAppsSkeleton: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack(spacing: 10) {
                RoundedRectangle(cornerRadius: 10)
                    .fill(skeletonBg)
                    .frame(width: 32, height: 32)
                    .overlay(shimmerOverlay)

                skeletonPill(width: 120, height: 18)
            }

            // App rows
            VStack(spacing: 0) {
                ForEach(0..<5, id: \.self) { index in
                    appRowSkeleton
                    if index < 4 {
                        Rectangle()
                            .fill(isDark ? Color.white.opacity(0.06) : Color.black.opacity(0.06))
                            .frame(height: 1)
                            .padding(.leading, 72)
                    }
                }
            }
            .background(cardBg)
            .cornerRadius(14)
        }
    }

    private var appRowSkeleton: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 10)
                .fill(skeletonBg)
                .frame(width: 44, height: 44)
                .overlay(shimmerOverlay)

            VStack(alignment: .leading, spacing: 4) {
                skeletonPill(width: 100, height: 14)

                RoundedRectangle(cornerRadius: 3)
                    .fill(skeletonBg)
                    .frame(height: 6)
                    .overlay(
                        GeometryReader { geo in
                            RoundedRectangle(cornerRadius: 3)
                                .fill(shimmerGradient)
                                .frame(width: geo.size.width * 0.5)
                                .opacity(isAnimating ? 1 : 0.5)
                        }
                    )
            }

            Spacer()

            skeletonPill(width: 40, height: 14)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
    }

    private var shimmerOverlay: some View {
        RoundedRectangle(cornerRadius: 10)
            .fill(shimmerGradient)
            .opacity(isAnimating ? 1 : 0.5)
    }

    private func skeletonPill(width: CGFloat, height: CGFloat) -> some View {
        RoundedRectangle(cornerRadius: height / 2)
            .fill(skeletonBg)
            .frame(width: width, height: height)
            .overlay(
                RoundedRectangle(cornerRadius: height / 2)
                    .fill(shimmerGradient)
                    .opacity(isAnimating ? 1 : 0.5)
            )
    }
}

#Preview {
    StatsView()
        .environment(ThemeService())
}
