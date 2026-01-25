import SwiftUI
import DeviceActivity

struct HomeView_OLD: View {
    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService
    @Environment(TimeBankService.self) private var timeBank
    @Environment(StatsService.self) private var statsService
    @Environment(BlockingService.self) private var blockingService
    @Environment(ExerciseFavoritesService.self) private var favoritesService

    // Tab selection binding for navigation (will be passed from MainTabView)
    @Binding var selectedTab: Int

    @State private var showQuickMenu = false
    @State private var showHelpCarousel = false
    @State private var isRefreshing = false
    @State private var showScheduleSheet = false
    @State private var showLimitsSheet = false
    @State private var showFocusSession = false

    // Quick menu animation states (dynamic based on items count)
    @State private var menuItemsVisible: [Bool] = Array(repeating: false, count: 6)

    // Refresh trigger for DeviceActivityReport
    @State private var reportRefreshId = UUID()

    // Loading state for stats section
    @State private var isLoadingStats = true
    @State private var isLoadingQuickStats = true
    @State private var lastReportLoadTime: Date?
    @State private var hasLoadedReportOnce = false

    // Cache duration - only reload if 30+ minutes passed
    private let cacheMinutes: TimeInterval = 30 * 60

    private var isDark: Bool { colorScheme == .dark }

    // Blue accent color (matching RN)
    private let blueAccent = Color(hex: "3b82f6")
    private let blueDark = Color(hex: "2563eb")

    // Device activity filter for screen time report - request full week for average
    private var deviceActivityFilter: DeviceActivityFilter {
        let calendar = Calendar.current
        let today = Date()
        // Get last 7 days for week average calculation
        let weekAgo = calendar.date(byAdding: .day, value: -7, to: today) ?? today

        return DeviceActivityFilter(
            segment: .daily(
                during: DateInterval(
                    start: calendar.startOfDay(for: weekAgo),
                    end: today
                )
            )
        )
    }

    var body: some View {
        ThemedBackground {
            ZStack {
                ScrollView {
                    VStack(spacing: 0) {
                        // Header
                        headerSection

                        // Animated Orb
                        orbSection

                        // Health Progress Bar
                        healthProgressBar

                        // Quick Stats Row
                        quickStatsSection

                        // Earned Minutes Display
                        earnedMinutesSection

                        // App Usage Section (includes Spent/Earned/Balance stats)
                        appUsageSection
                    }
                    .padding(.bottom, 120)
                }
                .scrollIndicators(.hidden)

                // Quick menu backdrop
                if showQuickMenu {
                    Color.black.opacity(0.75)
                        .ignoresSafeArea()
                        .onTapGesture {
                            closeQuickMenu()
                        }
                        .transition(.opacity)
                }

                // Quick menu items
                if showQuickMenu {
                    quickMenuItems
                }

                // Quick Action FAB
                quickActionButton
            }
        }
        .sheet(isPresented: $showHelpCarousel) {
            HelpCarouselView()
        }
        .fullScreenCover(isPresented: $showFocusSession) {
            FocusModeView()
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

            // Sync daily goal usage (from Shield spending data)
            blockingService.syncDailyGoalFromScreenTime()

            // Sync app limits usage from DeviceActivityReport
            blockingService.syncUsageFromAppGroup()

            // Recalculate streak from completion dates
            statsService.calculateStreakFromCompletionDates()

            // Update health score based on earned/spent activity
            updateHealthScore()
        }
        .onChange(of: timeBank.availableMinutes) { _, _ in
            updateHealthScore()
        }
    }

    // MARK: - Header

    private var headerSection: some View {
        HStack {
            Text("LockIn")
                .font(.system(size: 32, weight: .bold))
                .foregroundStyle(isDark ? .white : Color(hex: "111827"))

            Spacer()

            Button {
                showHelpCarousel = true
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "questionmark.circle.fill")
                        .font(.system(size: 18, weight: .semibold))
                    Text(L10n.Home.help)
                        .font(.system(size: 14, weight: .semibold))
                }
                .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(isDark ? Color.white.opacity(0.05) : Color.white.opacity(0.7))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.04), lineWidth: 0.5)
                )
                .shadow(color: .black.opacity(isDark ? 0 : 0.06), radius: 8, y: 2)
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
                        .fill(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.05))

                    // Progress with gradient
                    RoundedRectangle(cornerRadius: 6)
                        .fill(healthGradient)
                        .frame(width: geometry.size.width * CGFloat(statsService.healthScore) / 100)
                        .shadow(color: healthGlowColor.opacity(0.8), radius: 12)

                    // Shine overlay
                    RoundedRectangle(cornerRadius: 6)
                        .fill(
                            LinearGradient(
                                colors: [.white.opacity(0.4), .white.opacity(0.1), .clear],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .frame(width: geometry.size.width * CGFloat(statsService.healthScore) / 100, height: 6)
                }
            }
            .frame(height: 12)

            Text("\(L10n.Home.healthScore) \u{2022} \(statsService.healthScore)")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(isDark ? Color(hex: "9ca3af") : Color(hex: "6b7280"))
                .tracking(0.5)
        }
        .padding(.horizontal, 40)
        .padding(.bottom, 16)
    }

    // MARK: - Earned Minutes Display

    // MARK: - Today's Progress Section (matches RN TodaysProgress.tsx)

    private var earnedMinutesSection: some View {
        TodaysProgressCard(
            isDark: isDark,
            accentColor: themeService.accentColor,
            todaySpent: timeBank.todaySpent,
            todayEarned: timeBank.todayEarned,
            availableBalance: timeBank.availableMinutes,
            weeklyData: getWeeklyDailyStats(),
            onEarnTapped: {
                selectedTab = 2 // Navigate to LockIn tab
            }
        )
        .padding(.horizontal, 20)
        .padding(.bottom, 24)
    }

    // Get weekly stats for chart
    private func getWeeklyDailyStats() -> [DayStats] {
        let calendar = Calendar.current
        let today = Date()
        let dayNames = ["S", "M", "T", "W", "T", "F", "S"]

        // Get start of current week (Sunday)
        let weekday = calendar.component(.weekday, from: today)
        let daysFromSunday = weekday - 1
        guard let startOfWeek = calendar.date(byAdding: .day, value: -daysFromSunday, to: calendar.startOfDay(for: today)) else {
            return []
        }

        var stats: [DayStats] = []
        let todayStart = calendar.startOfDay(for: today)

        for dayOffset in 0..<7 {
            guard let date = calendar.date(byAdding: .day, value: dayOffset, to: startOfWeek) else { continue }
            let dayStart = calendar.startOfDay(for: date)
            let dayEnd = calendar.date(byAdding: .day, value: 1, to: dayStart) ?? date

            // Filter transactions for this day
            let dayTransactions = timeBank.transactions.filter { $0.timestamp >= dayStart && $0.timestamp < dayEnd }

            let earned = dayTransactions.filter { $0.amount > 0 }.reduce(0.0) { $0 + $1.amount }
            let spent = dayTransactions.filter { $0.amount < 0 }.reduce(0.0) { $0 + abs($1.amount) }

            stats.append(DayStats(
                day: dayNames[dayOffset],
                earned: earned,
                spent: spent,
                isToday: dayStart == todayStart
            ))
        }

        return stats
    }

    private func formatMinutes(_ minutes: Double) -> String {
        if minutes < 1 {
            return "0m"
        } else if minutes < 60 {
            return "\(Int(minutes))m"
        } else {
            let hours = Int(minutes) / 60
            let mins = Int(minutes) % 60
            return mins > 0 ? "\(hours)h \(mins)m" : "\(hours)h"
        }
    }

    private var healthGradient: LinearGradient {
        let score = statsService.healthScore
        let colors: [Color]

        if score >= 80 {
            colors = [Color(hex: "10b981"), Color(hex: "34d399"), Color(hex: "6ee7b7"), Color(hex: "a7f3d0")]
        } else if score >= 60 {
            colors = [Color(hex: "22c55e"), Color(hex: "4ade80"), Color(hex: "86efac"), Color(hex: "bbf7d0")]
        } else if score >= 40 {
            colors = [Color(hex: "eab308"), Color(hex: "facc15"), Color(hex: "fde047"), Color(hex: "fef08a")]
        } else {
            colors = [Color(hex: "f97316"), Color(hex: "fb923c"), Color(hex: "fdba74"), Color(hex: "fed7aa")]
        }

        return LinearGradient(colors: colors, startPoint: .leading, endPoint: .trailing)
    }

    private var healthGlowColor: Color {
        let score = statsService.healthScore
        if score >= 80 { return Color(hex: "10b981") }
        if score >= 60 { return Color(hex: "22c55e") }
        if score >= 40 { return Color(hex: "eab308") }
        return Color(hex: "f97316")
    }

    // MARK: - Quick Stats

    private var quickStatsSection: some View {
        // Quick stats from DeviceActivityReport with skeleton loader
        ZStack {
            // Skeleton - visible while loading
            QuickStatsSkeletonRow()
                .opacity(isLoadingQuickStats ? 1 : 0)

            // Actual report - visible after loading
            DeviceActivityReport(
                .init("HomeQuickStats"),
                filter: deviceActivityFilter
            )
            .opacity(isLoadingQuickStats ? 0 : 1)
        }
        .frame(height: 80)
        .padding(.bottom, 24)
        .animation(.easeInOut(duration: 0.3), value: isLoadingQuickStats)
        .onAppear {
            // Hide skeleton after delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                withAnimation {
                    isLoadingQuickStats = false
                }
            }
        }
    }

    // MARK: - Daily Goal Section

    private var dailyGoalSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(L10n.Home.dailyGoal)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(isDark ? Color(hex: "9ca3af") : Color(hex: "6b7280"))
                    .textCase(.uppercase)
                    .tracking(0.5)

                Spacer()

                // Navigate to Profile to change goal
                Button {
                    selectedTab = 4 // Navigate to Profile tab
                } label: {
                    HStack(spacing: 4) {
                        Text(L10n.Home.change)
                            .font(.system(size: 13, weight: .semibold))
                        Image(systemName: "chevron.right")
                            .font(.system(size: 11, weight: .semibold))
                    }
                    .foregroundStyle(Color(hex: "10b981"))
                }
            }
            .padding(.horizontal, 20)

            // Daily Goal Progress from DeviceActivityReport (tracks blocked apps usage)
            ZStack {
                DeviceActivityReport(
                    .init("DailyGoalProgress"),
                    filter: dailyGoalFilter
                )
                .frame(height: 140)

                // Transparent overlay to allow parent ScrollView to receive gestures
                Color.white.opacity(0.001)
                    .contentShape(Rectangle())
                    .allowsHitTesting(true)
            }
            .padding(.horizontal, 16)
        }
        .padding(.bottom, 24)
    }

    // Filter for daily goal - just today's data
    private var dailyGoalFilter: DeviceActivityFilter {
        let calendar = Calendar.current
        let today = Date()
        return DeviceActivityFilter(
            segment: .daily(
                during: DateInterval(
                    start: calendar.startOfDay(for: today),
                    end: today
                )
            )
        )
    }

    // MARK: - Schedules Section (Legacy - kept for reference)

    private var schedulesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Upcoming")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(isDark ? Color(hex: "9ca3af") : Color(hex: "6b7280"))
                    .textCase(.uppercase)
                    .tracking(0.5)

                Spacer()

                if !blockingService.schedules.isEmpty {
                    Button {
                        selectedTab = 1 // Navigate to Blocking tab
                    } label: {
                        HStack(spacing: 4) {
                            Text("See All")
                                .font(.system(size: 13, weight: .semibold))
                            Image(systemName: "chevron.right")
                                .font(.system(size: 11, weight: .semibold))
                        }
                        .foregroundStyle(blueAccent)
                    }
                }
            }
            .padding(.horizontal, 20)

            if blockingService.schedules.isEmpty {
                // Create Schedule CTA
                Button {
                    selectedTab = 1 // Navigate to Blocking tab
                    showScheduleSheet = true
                } label: {
                    HStack(spacing: 12) {
                        RoundedRectangle(cornerRadius: 10)
                            .fill(blueAccent)
                            .frame(width: 40, height: 40)
                            .overlay {
                                Image(systemName: "plus")
                                    .font(.system(size: 20, weight: .medium))
                                    .foregroundStyle(.white)
                            }

                        VStack(alignment: .leading, spacing: 2) {
                            Text("Create a Schedule")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(blueAccent)
                            Text("Set times when apps are unblocked")
                                .font(.system(size: 12))
                                .foregroundStyle(.secondary)
                        }

                        Spacer()
                    }
                    .padding(16)
                    .background(
                        RoundedRectangle(cornerRadius: 14)
                            .fill(blueAccent.opacity(0.08))
                            .strokeBorder(blueAccent, style: StrokeStyle(lineWidth: 1.5, dash: [6]))
                    )
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 20)
            } else {
                // Show upcoming schedules (max 2)
                VStack(spacing: 8) {
                    ForEach(blockingService.schedules.prefix(2)) { schedule in
                        UpcomingScheduleCard(schedule: schedule)
                    }
                }
                .padding(.horizontal, 20)
            }
        }
        .padding(.bottom, 24)
    }

    // MARK: - App Usage Section (Native DeviceActivityReport - Top Apps only)

    private var appUsageSection: some View {
        // DeviceActivityReport shows top 5 app rows
        // ZStack with transparent overlay to allow parent ScrollView to receive gestures
        // Both skeleton and report are ALWAYS rendered, controlled by opacity
        ZStack {
            // Skeleton - visible while loading
            VStack {
                AppsOnlySkeletonLoader()
                Spacer(minLength: 0)
            }
            .opacity(isLoadingStats ? 1 : 0)

            // Report - visible after loading
            VStack {
                DeviceActivityReport(
                    .init("HomeCompact"),
                    filter: deviceActivityFilter
                )
                .id(reportRefreshId)

                Spacer(minLength: 0)
            }
            .opacity(isLoadingStats ? 0 : 1)

            // Transparent overlay to capture gestures and pass to parent ScrollView
            // This sits on top of the DeviceActivityReport (which runs in separate process)
            // Note: Color.clear doesn't capture touches - need tiny opacity to intercept gestures
            Color.white.opacity(0.001)
                .contentShape(Rectangle())
                .allowsHitTesting(true)
        }
        .frame(height: 420, alignment: .top)
        .padding(.horizontal, 16)
        .padding(.bottom, 12)
        .animation(.easeInOut(duration: 0.3), value: isLoadingStats)
    }

    // MARK: - Quick Menu Items (appears above the FAB)

    /// Dynamic menu items: favorites (or defaults) + Photo Task + Focus Mode
    private var quickMenuItemsList: [(id: String, title: String, subtitle: String, icon: String, gradient: [Color], action: () -> Void)] {
        var items: [(id: String, title: String, subtitle: String, icon: String, gradient: [Color], action: () -> Void)] = []

        // Focus Mode (always at top)
        items.append((
            id: "focus",
            title: L10n.Quick.focusMode,
            subtitle: L10n.Quick.pomodoroTimer,
            icon: "timer",
            gradient: [Color(hex: "f472b6"), Color(hex: "ec4899"), Color(hex: "db2777")],
            action: {
                closeQuickMenu()
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                    showFocusSession = true
                }
            }
        ))

        // Favorite exercises (or defaults if no favorites)
        let exercisesToShow = favoritesService.quickActionExercises
        for exercise in exercisesToShow.reversed() {
            let colors = exercise.gradientColors
            items.append((
                id: exercise.rawValue,
                title: exercise.displayName,
                subtitle: exercise.rewardDescription,
                icon: exercise.imageName ?? exercise.icon,
                gradient: [colors[0], colors[0].opacity(0.9), colors[1]],
                action: { [exercise] in
                    closeQuickMenu()
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                        selectedTab = 2 // Navigate to LockIn tab
                        // Post notification to open specific exercise
                        NotificationCenter.default.post(
                            name: .openExercise,
                            object: nil,
                            userInfo: ["exerciseType": exercise]
                        )
                    }
                }
            ))
        }

        // Photo Task (closest to button) - blue gradient
        items.append((
            id: "photo",
            title: L10n.Quick.photoTask,
            subtitle: L10n.Quick.verifyWithPhoto,
            icon: "camera.fill",
            gradient: [Color(hex: "60a5fa"), Color(hex: "3b82f6"), Color(hex: "2563eb")],
            action: {
                closeQuickMenu()
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                    selectedTab = 2 // Navigate to LockIn tab
                    NotificationCenter.default.post(
                        name: .openExercise,
                        object: nil,
                        userInfo: ["exerciseType": ExerciseType.photoVerification]
                    )
                }
            }
        ))

        return items
    }

    private var quickMenuItems: some View {
        VStack {
            Spacer()

            HStack {
                Spacer()

                // Menu items stack above the button, right-aligned with FAB
                VStack(alignment: .trailing, spacing: 12) {
                    ForEach(Array(quickMenuItemsList.enumerated()), id: \.element.id) { index, item in
                        if index < menuItemsVisible.count && menuItemsVisible[index] {
                            QuickMenuItem(
                                title: item.title,
                                subtitle: item.subtitle,
                                icon: item.icon,
                                gradient: item.gradient,
                                action: item.action
                            )
                            .transition(.asymmetric(
                                insertion: .move(edge: .bottom).combined(with: .opacity),
                                removal: .opacity
                            ))
                        }
                    }
                }
            }
            .padding(.trailing, 24)
            .padding(.bottom, 170) // Position above FAB (100 + 56 button + 14 gap)
        }
    }

    // MARK: - Quick Action Button

    private var quickActionButton: some View {
        VStack {
            Spacer()
            HStack {
                Spacer()
                Button {
                    toggleQuickMenu()
                } label: {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(
                            LinearGradient(
                                colors: showQuickMenu
                                    ? [Color.white.opacity(0.15), Color.white.opacity(0.15)]
                                    : [themeService.accentColor, themeService.accentColorDark],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 56, height: 56)
                        .overlay {
                            Image(systemName: showQuickMenu ? "xmark" : "bolt.fill")
                                .font(.system(size: 26, weight: .medium))
                                .foregroundStyle(.white)
                        }
                        .shadow(
                            color: showQuickMenu ? .clear : themeService.accentColor.opacity(0.5),
                            radius: 12,
                            y: 6
                        )
                }
                .padding(.trailing, 24)
                .padding(.bottom, 100) // Moved lower
            }
        }
    }

    // MARK: - Quick Menu Toggle

    private func toggleQuickMenu() {
        if showQuickMenu {
            closeQuickMenu()
        } else {
            openQuickMenu()
        }
    }

    private func openQuickMenu() {
        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
            showQuickMenu = true
        }

        // Staggered animation for menu items (bottom to top)
        let itemCount = quickMenuItemsList.count
        for i in (0..<itemCount).reversed() {
            let delay = Double(itemCount - 1 - i) * 0.05
            withAnimation(.spring(response: 0.4, dampingFraction: 0.7).delay(delay)) {
                if i < menuItemsVisible.count {
                    menuItemsVisible[i] = true
                }
            }
        }
    }

    private func closeQuickMenu() {
        // Close items first (top to bottom)
        let itemCount = quickMenuItemsList.count
        for i in 0..<itemCount {
            let delay = Double(i) * 0.04
            withAnimation(.easeIn(duration: 0.12).delay(delay)) {
                if i < menuItemsVisible.count {
                    menuItemsVisible[i] = false
                }
            }
        }
        // Then close the blur background after items are gone
        withAnimation(.easeIn(duration: 0.2).delay(0.3)) {
            showQuickMenu = false
        }
    }

    // MARK: - Health Score Update

    private func updateHealthScore() {
        _ = statsService.calculateHealthScore(
            earnedToday: timeBank.todayEarned,
            spentToday: timeBank.todaySpent,
            availableBalance: timeBank.availableMinutes,
            streak: statsService.currentStreak
        )
    }

    // MARK: - Refresh

    private func refreshData() async {
        isRefreshing = true
        await statsService.refresh()
        updateHealthScore()
        isRefreshing = false
    }
}

// MARK: - Quick Stat Card (Glassy style)

struct QuickStatCard: View {
    let title: String
    let value: String
    var icon: String? = nil
    var iconColor: Color? = nil
    var valueColor: Color? = nil
    var emoji: String? = nil
    var glowColor: Color? = nil

    @Environment(\.colorScheme) private var colorScheme
    private var isDark: Bool { colorScheme == .dark }

    private var glassyBorder: Color {
        isDark ? Color.white.opacity(0.1) : Color(hex: "e2e8f0")
    }

    var body: some View {
        VStack(spacing: 8) {
            Text(title)
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(isDark ? Color.white.opacity(0.5) : Color(hex: "9ca3af"))
                .tracking(0.5)
                .textCase(.uppercase)

            HStack(spacing: 6) {
                if let emoji = emoji {
                    Text(emoji)
                        .font(.system(size: 18))
                }
                if let icon = icon {
                    Image(systemName: icon)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(iconColor ?? .primary)
                }
                Text(value)
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(valueColor ?? (isDark ? .white : Color(hex: "111827")))
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(
            ZStack {
                // Solid background with subtle glow
                RoundedRectangle(cornerRadius: 16)
                    .fill(isDark ? Color.white.opacity(0.06) : Color.white.opacity(0.7))

                // Optional glow from bottom only
                if let glow = glowColor {
                    LinearGradient(
                        colors: [glow.opacity(0.12), Color.clear],
                        startPoint: .bottom,
                        endPoint: .top
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                }
            }
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.04), lineWidth: 0.5)
        )
    }
}

// MARK: - Quick Stats Skeleton Row

struct QuickStatsSkeletonRow: View {
    @Environment(\.colorScheme) private var colorScheme
    @State private var isAnimating = false

    private var isDark: Bool { colorScheme == .dark }

    private var shimmerGradient: LinearGradient {
        LinearGradient(
            colors: [
                isDark ? Color.white.opacity(0.05) : Color.black.opacity(0.05),
                isDark ? Color.white.opacity(0.12) : Color.black.opacity(0.12),
                isDark ? Color.white.opacity(0.05) : Color.black.opacity(0.05)
            ],
            startPoint: .leading,
            endPoint: .trailing
        )
    }

    var body: some View {
        HStack(spacing: 10) {
            // STREAK skeleton
            quickStatSkeleton(title: "STREAK", hasEmoji: true)

            // TODAY skeleton
            quickStatSkeleton(title: "TODAY", hasEmoji: false)

            // VS AVG skeleton
            quickStatSkeleton(title: "VS AVG", hasEmoji: false, hasIcon: true)
        }
        .padding(.horizontal, 20)
        .onAppear {
            withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) {
                isAnimating = true
            }
        }
    }

    private func quickStatSkeleton(title: String, hasEmoji: Bool, hasIcon: Bool = false) -> some View {
        VStack(spacing: 8) {
            // Title (actual text)
            Text(title)
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(isDark ? Color.white.opacity(0.5) : Color(hex: "9ca3af"))
                .tracking(0.5)

            // Value skeleton with optional emoji/icon
            HStack(spacing: 6) {
                if hasEmoji {
                    Text("🔥")
                        .font(.system(size: 18))
                        .opacity(0.5)
                }
                if hasIcon {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(shimmerGradient)
                        .frame(width: 16, height: 16)
                        .opacity(isAnimating ? 1 : 0.6)
                }
                // Skeleton pill for value
                RoundedRectangle(cornerRadius: 4)
                    .fill(shimmerGradient)
                    .frame(width: hasEmoji ? 24 : 56, height: 20)
                    .opacity(isAnimating ? 1 : 0.6)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(isDark ? Color.white.opacity(0.06) : Color.white.opacity(0.7))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.04), lineWidth: 0.5)
        )
    }
}

// MARK: - Quick Menu Item

struct QuickMenuItem: View {
    let title: String
    let subtitle: String
    let icon: String
    let gradient: [Color]
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 14) {
                // Text
                VStack(alignment: .trailing, spacing: 2) {
                    Text(title)
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(.white)
                        .shadow(color: .black.opacity(0.5), radius: 4, y: 1)

                    Text(subtitle)
                        .font(.system(size: 12))
                        .foregroundStyle(.white.opacity(0.7))
                        .shadow(color: .black.opacity(0.5), radius: 4, y: 1)
                }

                // Icon button - supports both asset images and system icons
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color.clear)
                    .frame(width: 56, height: 56)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(
                                LinearGradient(
                                    colors: gradient,
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 2
                            )
                    )
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(.ultraThinMaterial)
                    )
                    .overlay {
                        if let uiImage = UIImage(named: icon) {
                            // Asset image
                            Image(uiImage: uiImage)
                                .resizable()
                                .scaledToFill()
                                .frame(width: 56, height: 56)
                                .clipShape(RoundedRectangle(cornerRadius: 14))
                        } else {
                            // System icon fallback
                            Image(systemName: icon)
                                .font(.system(size: 26, weight: .medium))
                                .foregroundStyle(.white)
                        }
                    }
                    .shadow(color: gradient[1].opacity(0.5), radius: 12, y: 6)
            }
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Upcoming Schedule Card (Unblock Style)

struct UpcomingScheduleCard: View {
    let schedule: CodableSchedule

    @Environment(\.colorScheme) private var colorScheme

    private var isDark: Bool { colorScheme == .dark }
    private var isActive: Bool { schedule.isCurrentlyActive }

    private var greenColor: Color { Color(hex: "10b981") }
    private var grayColor: Color { Color(hex: "6b7280") }

    private var iconFillColor: Color {
        greenColor.opacity(0.15)
    }

    private var iconColor: Color {
        isActive ? greenColor : grayColor
    }

    private var borderColor: Color {
        if isActive {
            return greenColor.opacity(0.3)
        }
        return isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.05)
    }

    private var bgColor: Color {
        isDark ? Color.white.opacity(0.05) : .white
    }

    var body: some View {
        HStack(spacing: 12) {
            iconView
            contentView
            Spacer()
            if isActive {
                activeIndicator
            }
        }
        .padding(14)
        .background(RoundedRectangle(cornerRadius: 14).fill(bgColor))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(borderColor, lineWidth: isActive ? 2 : 1))
    }

    private var iconView: some View {
        RoundedRectangle(cornerRadius: 10)
            .fill(iconFillColor)
            .frame(width: 40, height: 40)
            .overlay {
                Image(systemName: isActive ? "lock.open.fill" : "lock.open")
                    .font(.system(size: 18))
                    .foregroundStyle(iconColor)
            }
    }

    private var contentView: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(schedule.name)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(isDark ? .white : Color(hex: "111827"))

            detailsRow
        }
    }

    private var detailsRow: some View {
        HStack(spacing: 6) {
            if isActive {
                Text("Unblocked")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(greenColor)
            } else {
                Text(timeRangeText)
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
            }

            Text("•")
                .foregroundStyle(.secondary.opacity(0.5))

            Text(daysText)
                .font(.system(size: 12))
                .foregroundStyle(.secondary)
        }
    }

    private var activeIndicator: some View {
        Circle()
            .fill(greenColor)
            .frame(width: 8, height: 8)
    }

    private var timeRangeText: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        let start = formatter.string(from: schedule.startTime)
        let end = formatter.string(from: schedule.endTime)
        return "\(start) - \(end)"
    }

    private var daysText: String {
        let days = Set(schedule.weekdays)
        if days.count == 7 {
            return "Every day"
        }

        let sortedDays = days.sorted()
        if sortedDays == [2, 3, 4, 5, 6] {
            return "Weekdays"
        }
        if sortedDays == [1, 7] {
            return "Weekends"
        }

        let dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        return sortedDays.map { dayNames[($0 - 1) % 7] }.joined(separator: ", ")
    }
}

// MARK: - Home App Usage Row

struct HomeAppUsageRow: View {
    let app: AppUsageInfo
    let rank: Int
    let maxDuration: Double
    let isBlocked: Bool

    @Environment(\.colorScheme) private var colorScheme
    private var isDark: Bool { colorScheme == .dark }

    private var progressColor: Color {
        switch rank {
        case 1: return Color(hex: "ef4444") // Red for #1
        case 2: return Color(hex: "f59e0b") // Amber for #2
        default: return Color(hex: "3b82f6") // Blue for rest
        }
    }

    private var iconColor: Color {
        let colors: [Color] = [
            Color(hex: "ef4444"), Color(hex: "f59e0b"), Color(hex: "3b82f6"),
            Color(hex: "a855f7"), Color(hex: "ec4899"), Color(hex: "10b981")
        ]
        let hash = abs(app.bundleId.hashValue)
        return colors[hash % colors.count]
    }

    var body: some View {
        HStack(spacing: 12) {
            // App icon placeholder with color
            RoundedRectangle(cornerRadius: 12)
                .fill(iconColor.opacity(0.15))
                .frame(width: 44, height: 44)
                .overlay {
                    Text(String(app.appName.prefix(1)).uppercased())
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(iconColor)
                }
                .overlay(alignment: .bottomTrailing) {
                    if isBlocked {
                        Circle()
                            .fill(Color(hex: "ef4444"))
                            .frame(width: 16, height: 16)
                            .overlay {
                                Image(systemName: "lock.fill")
                                    .font(.system(size: 8, weight: .bold))
                                    .foregroundStyle(.white)
                            }
                            .offset(x: 4, y: 4)
                    }
                }

            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(app.appName)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(isDark ? .white : Color(hex: "111827"))
                        .lineLimit(1)

                    Spacer()

                    Text(app.formattedDuration)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(progressColor)
                }

                // Progress bar
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 3)
                            .fill(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.05))

                        RoundedRectangle(cornerRadius: 3)
                            .fill(progressColor)
                            .frame(width: geometry.size.width * min(1.0, app.durationSeconds / maxDuration))
                    }
                }
                .frame(height: 6)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }
}

// MARK: - Help Carousel

struct HelpCarouselView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService
    @State private var currentPage = 0

    private var isDark: Bool { colorScheme == .dark }

    private var tips: [HelpTip] {
        [
            HelpTip(
                icon: "heart.fill",
                iconGradient: [Color(hex: "10b981"), Color(hex: "34d399")],
                title: L10n.Help.tip1Title,
                description: L10n.Help.tip1Desc,
                miniUI: .healthOrb
            ),
            HelpTip(
                icon: "flame.fill",
                iconGradient: [Color(hex: "f59e0b"), Color(hex: "fbbf24")],
                title: L10n.Help.tip2Title,
                description: L10n.Help.tip2Desc,
                miniUI: .statsCards
            ),
            HelpTip(
                icon: "figure.run",
                iconGradient: [Color(hex: "f59e0b"), Color(hex: "d97706")],
                title: L10n.Help.tip3Title,
                description: L10n.Help.tip3Desc,
                miniUI: .earnTime
            ),
            HelpTip(
                icon: "target",
                iconGradient: [Color(hex: "3b82f6"), Color(hex: "2563eb")],
                title: L10n.Help.tip4Title,
                description: L10n.Help.tip4Desc,
                miniUI: .goalRing
            ),
            HelpTip(
                icon: "lock.shield.fill",
                iconGradient: [Color(hex: "ef4444"), Color(hex: "dc2626")],
                title: L10n.Help.tip5Title,
                description: L10n.Help.tip5Desc,
                miniUI: .blockedApps
            ),
            HelpTip(
                icon: "chart.bar.fill",
                iconGradient: [Color(hex: "8b5cf6"), Color(hex: "6d28d9")],
                title: L10n.Help.tip6Title,
                description: L10n.Help.tip6Desc,
                miniUI: .weeklyChart
            )
        ]
    }

    var body: some View {
        NavigationStack {
            ZStack {
                // Pure black/white background based on theme
                (isDark ? Color.black : Color.white).ignoresSafeArea()

                // Subtle accent glow at top
                VStack {
                    LinearGradient(
                        colors: isDark
                            ? [themeService.accentColor.opacity(0.15), themeService.accentColor.opacity(0.05), Color.clear]
                            : [themeService.accentColor.opacity(0.08), themeService.accentColor.opacity(0.03), Color.clear],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                    .frame(height: 200)
                    Spacer()
                }
                .ignoresSafeArea()

                VStack(spacing: 0) {
                    // Progress bar at top
                    VStack(spacing: 8) {
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 2)
                                    .fill(isDark ? Color.white.opacity(0.1) : Color(hex: "e2e8f0"))

                                RoundedRectangle(cornerRadius: 2)
                                    .fill(
                                        LinearGradient(
                                            colors: [themeService.accentColor, themeService.accentColorDark],
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                                    .frame(width: geo.size.width * CGFloat(currentPage + 1) / CGFloat(tips.count))
                                    .animation(.spring(response: 0.3), value: currentPage)
                            }
                        }
                        .frame(height: 4)

                        Text("\(currentPage + 1) \(L10n.Common.of) \(tips.count)")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(isDark ? Color.white.opacity(0.5) : Color.black.opacity(0.5))
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 16)

                    // Flash cards
                    TabView(selection: $currentPage) {
                        ForEach(0..<tips.count, id: \.self) { index in
                            HelpFlashCard(tip: tips[index])
                                .tag(index)
                        }
                    }
                    .tabViewStyle(.page(indexDisplayMode: .never))

                    // Bottom action button
                    VStack(spacing: 16) {
                        Button {
                            if currentPage < tips.count - 1 {
                                withAnimation { currentPage += 1 }
                            } else {
                                dismiss()
                            }
                        } label: {
                            HStack(spacing: 6) {
                                Text(currentPage == tips.count - 1 ? L10n.Common.getStarted : L10n.Help.next)
                                    .font(.system(size: 17, weight: .bold))
                                if currentPage < tips.count - 1 {
                                    Image(systemName: "chevron.right")
                                        .font(.system(size: 14, weight: .bold))
                                }
                            }
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 18)
                            .background(
                                RoundedRectangle(cornerRadius: 16)
                                    .fill(
                                        LinearGradient(
                                            colors: [themeService.accentColor, themeService.accentColorDark],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    )
                            )
                            .shadow(color: themeService.accentColor.opacity(0.4), radius: 16, y: 8)
                        }

                        // Dots indicator
                        HStack(spacing: 8) {
                            ForEach(0..<tips.count, id: \.self) { index in
                                Capsule()
                                    .fill(index == currentPage
                                          ? themeService.accentColor
                                          : (isDark ? Color.white.opacity(0.2) : Color.black.opacity(0.15)))
                                    .frame(width: index == currentPage ? 24 : 8, height: 8)
                                    .animation(.spring(response: 0.3), value: currentPage)
                            }
                        }
                    }
                    .padding(.horizontal, 24)
                    .padding(.bottom, 40)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 28))
                            .foregroundStyle(isDark ? Color.white.opacity(0.3) : Color.black.opacity(0.2))
                    }
                }
            }
        }
    }
}

// MARK: - Help Tip Model

struct HelpTip {
    let icon: String
    let iconGradient: [Color]
    let title: String
    let description: String
    let miniUI: MiniUIType

    enum MiniUIType {
        case healthOrb
        case statsCards
        case earnTime
        case goalRing
        case blockedApps
        case weeklyChart
    }
}

// MARK: - Flash Card

struct HelpFlashCard: View {
    let tip: HelpTip
    @Environment(\.colorScheme) private var colorScheme
    @State private var isAnimating = false

    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        VStack(spacing: 0) {
            // Mini UI preview at top (takes more space)
            miniUIView
                .frame(height: 280)
                .padding(.top, 20)

            Spacer().frame(height: 32)

            // Title
            Text(tip.title)
                .font(.system(size: 28, weight: .bold))
                .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                .multilineTextAlignment(.center)
                .lineSpacing(4)

            Spacer().frame(height: 16)

            // Description
            Text(tip.description)
                .font(.system(size: 17))
                .foregroundStyle(isDark ? Color.white.opacity(0.7) : Color(hex: "0f172a").opacity(0.7))
                .multilineTextAlignment(.center)
                .lineSpacing(6)
                .padding(.horizontal, 20)

            Spacer()
        }
        .padding(.horizontal, 24)
        .onAppear {
            withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
                isAnimating = true
            }
        }
    }

    @ViewBuilder
    private var miniUIView: some View {
        switch tip.miniUI {
        case .healthOrb:
            MiniHealthOrbView(gradient: tip.iconGradient, isAnimating: isAnimating)
        case .statsCards:
            MiniStatsCardsView()
        case .earnTime:
            MiniEarnTimeView()
        case .goalRing:
            MiniGoalRingView(gradient: tip.iconGradient)
        case .blockedApps:
            MiniBlockedAppsView()
        case .weeklyChart:
            MiniWeeklyChartView(gradient: tip.iconGradient)
        }
    }
}

// MARK: - Mini UI Components

// Health Orb - like the app's main health indicator
struct MiniHealthOrbView: View {
    let gradient: [Color]
    let isAnimating: Bool
    @Environment(\.colorScheme) private var colorScheme
    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        ZStack {
            // Outer glow
            Circle()
                .fill(gradient[0].opacity(0.2))
                .frame(width: 180, height: 180)
                .blur(radius: 40)
                .scaleEffect(isAnimating ? 1.1 : 1.0)

            // Main orb
            Circle()
                .fill(
                    LinearGradient(
                        colors: gradient + [gradient[1].opacity(0.8)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 140, height: 140)
                .shadow(color: gradient[0].opacity(0.5), radius: 24, y: 12)

            // Inner highlight
            Circle()
                .fill(
                    LinearGradient(
                        colors: [Color.white.opacity(0.4), Color.clear],
                        startPoint: .topLeading,
                        endPoint: .center
                    )
                )
                .frame(width: 100, height: 100)
                .offset(x: -15, y: -15)

            // Heart icon
            Image(systemName: "heart.fill")
                .font(.system(size: 48, weight: .medium))
                .foregroundStyle(.white)
                .shadow(color: .black.opacity(0.2), radius: 4, y: 2)
        }
        .scaleEffect(isAnimating ? 1.02 : 1.0)
    }
}

// Stats Cards - like the quick stats row
struct MiniStatsCardsView: View {
    @Environment(\.colorScheme) private var colorScheme
    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        HStack(spacing: 12) {
            // Streak card
            MiniStatCard(
                icon: "flame.fill",
                iconColor: Color(hex: "f59e0b"),
                value: "7",
                label: "Streak"
            )

            // Today card (larger)
            VStack(spacing: 8) {
                HStack(spacing: 6) {
                    Image(systemName: "clock.fill")
                        .font(.system(size: 18))
                        .foregroundStyle(Color(hex: "3b82f6"))
                }

                Text("2h 15m")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))

                Text("Today")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(isDark ? Color.white.opacity(0.5) : Color.black.opacity(0.5))
            }
            .frame(width: 100, height: 100)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(isDark ? Color.white.opacity(0.08) : Color(hex: "3b82f6").opacity(0.1))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color(hex: "3b82f6").opacity(0.3), lineWidth: 1)
                    )
            )

            // vs Avg card
            MiniStatCard(
                icon: "arrow.down.right",
                iconColor: Color(hex: "10b981"),
                value: "-45m",
                label: "vs Avg"
            )
        }
    }
}

struct MiniStatCard: View {
    let icon: String
    let iconColor: Color
    let value: String
    let label: String
    @Environment(\.colorScheme) private var colorScheme
    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundStyle(iconColor)

            Text(value)
                .font(.system(size: 20, weight: .bold))
                .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))

            Text(label)
                .font(.system(size: 10, weight: .medium))
                .foregroundStyle(isDark ? Color.white.opacity(0.5) : Color.black.opacity(0.5))
        }
        .frame(width: 80, height: 90)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(isDark ? Color.white.opacity(0.08) : Color.white.opacity(0.7))
        )
    }
}

// Earn Time - exercise cards with real images
struct MiniEarnTimeView: View {
    @Environment(\.colorScheme) private var colorScheme
    private var isDark: Bool { colorScheme == .dark }

    private let exercises = [
        ("pushups", "Push-ups", "+5m"),
        ("squats", "Squats", "+5m"),
        ("plank", "Plank", "+3m")
    ]

    var body: some View {
        VStack(spacing: 12) {
            ForEach(exercises, id: \.0) { imageName, name, reward in
                HStack(spacing: 14) {
                    // Exercise image
                    Image(imageName)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(width: 56, height: 56)
                        .clipShape(RoundedRectangle(cornerRadius: 12))

                    // Name
                    Text(name)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))

                    Spacer()

                    // Reward badge
                    Text(reward)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(Color(hex: "10b981"))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(
                            Capsule()
                                .fill(Color(hex: "10b981").opacity(0.15))
                        )
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(isDark ? Color.white.opacity(0.05) : Color.white.opacity(0.7))
                        .shadow(color: .black.opacity(isDark ? 0 : 0.08), radius: 8, y: 4)
                )
            }
        }
        .padding(.horizontal, 20)
    }
}

// Goal Ring - daily progress
struct MiniGoalRingView: View {
    let gradient: [Color]
    @Environment(\.colorScheme) private var colorScheme
    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        VStack(spacing: 20) {
            // Large ring
            ZStack {
                // Background ring
                Circle()
                    .stroke(isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.05), lineWidth: 14)
                    .frame(width: 140, height: 140)

                // Progress ring
                Circle()
                    .trim(from: 0, to: 0.35)
                    .stroke(
                        LinearGradient(colors: gradient, startPoint: .topLeading, endPoint: .bottomTrailing),
                        style: StrokeStyle(lineWidth: 14, lineCap: .round)
                    )
                    .frame(width: 140, height: 140)
                    .rotationEffect(.degrees(-90))

                // Center content
                VStack(spacing: 2) {
                    Text("35%")
                        .font(.system(size: 32, weight: .bold))
                        .foregroundStyle(gradient[0])

                    Text("of goal")
                        .font(.system(size: 12))
                        .foregroundStyle(isDark ? Color.white.opacity(0.5) : Color.black.opacity(0.5))
                }
            }

            // Stats row
            HStack(spacing: 24) {
                VStack(spacing: 2) {
                    Text("42m")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(gradient[0])
                    Text("Used")
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                }

                Rectangle()
                    .fill(isDark ? Color.white.opacity(0.2) : Color.black.opacity(0.05))
                    .frame(width: 1, height: 30)

                VStack(spacing: 2) {
                    Text("2h")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                    Text("Goal")
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                }

                Rectangle()
                    .fill(isDark ? Color.white.opacity(0.2) : Color.black.opacity(0.05))
                    .frame(width: 1, height: 30)

                VStack(spacing: 2) {
                    Text("1h 18m")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                    Text("Left")
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                }
            }
        }
    }
}

// Blocked Apps - with real app icons
struct MiniBlockedAppsView: View {
    @Environment(\.colorScheme) private var colorScheme
    private var isDark: Bool { colorScheme == .dark }

    private let apps = [
        ("tiktok", "TikTok"),
        ("instagram", "Instagram"),
        ("youtube", "YouTube")
    ]

    var body: some View {
        VStack(spacing: 12) {
            ForEach(apps, id: \.0) { imageName, name in
                HStack(spacing: 14) {
                    // App icon with lock badge
                    ZStack {
                        Image(imageName)
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .frame(width: 48, height: 48)
                            .clipShape(RoundedRectangle(cornerRadius: 12))

                        // Lock badge
                        Image(systemName: "lock.fill")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(5)
                            .background(Circle().fill(Color(hex: "ef4444")))
                            .offset(x: 18, y: 18)
                    }

                    // Name
                    Text(name)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))

                    Spacer()

                    // Blocked badge
                    Text("Blocked")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(Color(hex: "ef4444"))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(
                            Capsule()
                                .fill(Color(hex: "ef4444").opacity(0.15))
                        )
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(isDark ? Color.white.opacity(0.05) : Color.white.opacity(0.7))
                        .shadow(color: .black.opacity(isDark ? 0 : 0.08), radius: 8, y: 4)
                )
            }
        }
        .padding(.horizontal, 20)
    }
}

// Weekly Chart
struct MiniWeeklyChartView: View {
    let gradient: [Color]
    @Environment(\.colorScheme) private var colorScheme
    private var isDark: Bool { colorScheme == .dark }

    private let days = ["S", "M", "T", "W", "T", "F", "S"]
    private let heights: [CGFloat] = [0.4, 0.7, 0.5, 0.9, 0.6, 0.3, 0.8]

    var body: some View {
        VStack(spacing: 16) {
            // Chart header
            HStack {
                Text("This Week")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))

                Spacer()

                Text("14h 32m")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(gradient[0])
            }
            .padding(.horizontal, 4)

            // Bar chart
            HStack(alignment: .bottom, spacing: 10) {
                ForEach(0..<7, id: \.self) { index in
                    VStack(spacing: 6) {
                        // Bar
                        RoundedRectangle(cornerRadius: 6)
                            .fill(
                                index == 3
                                    ? LinearGradient(colors: gradient, startPoint: .bottom, endPoint: .top)
                                    : LinearGradient(colors: [gradient[0].opacity(0.3)], startPoint: .bottom, endPoint: .top)
                            )
                            .frame(height: heights[index] * 100)

                        // Day label
                        Text(days[index])
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(
                                index == 3
                                    ? gradient[0]
                                    : (isDark ? Color.white.opacity(0.5) : Color.black.opacity(0.5))
                            )
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .frame(height: 130)
            .padding(.horizontal, 8)
            .padding(.vertical, 16)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(isDark ? Color.white.opacity(0.05) : Color.white.opacity(0.7))
                    .shadow(color: .black.opacity(isDark ? 0 : 0.08), radius: 12, y: 6)
            )
        }
        .padding(.horizontal, 20)
    }
}

// MARK: - Stats Skeleton Loader

struct StatsSkeletonLoader: View {
    @Environment(\.colorScheme) private var colorScheme
    @State private var isAnimating = false

    private var isDark: Bool { colorScheme == .dark }

    private var shimmerGradient: LinearGradient {
        LinearGradient(
            colors: [
                isDark ? Color.white.opacity(0.03) : Color(hex: "e2e8f0"),
                isDark ? Color.white.opacity(0.08) : Color.white.opacity(0.7),
                isDark ? Color.white.opacity(0.03) : Color(hex: "e2e8f0")
            ],
            startPoint: .leading,
            endPoint: .trailing
        )
    }

    private var skeletonBg: Color {
        isDark ? Color.white.opacity(0.05) : Color.white.opacity(0.7)
    }

    var body: some View {
        VStack(spacing: 16) {
            // Quick Stats Row (3 boxes)
            HStack(spacing: 10) {
                ForEach(0..<3, id: \.self) { _ in
                    skeletonStatBox
                }
            }

            // Apps Section Header
            HStack {
                skeletonPill(width: 28, height: 28)
                skeletonPill(width: 80, height: 16)
                Spacer()
                skeletonPill(width: 50, height: 14)
            }
            .padding(.top, 8)

            // App Rows (5 rows)
            VStack(spacing: 0) {
                ForEach(0..<5, id: \.self) { index in
                    skeletonAppRow
                    if index < 4 {
                        Rectangle()
                            .fill(isDark ? Color.white.opacity(0.06) : Color(hex: "e2e8f0"))
                            .frame(height: 1)
                            .padding(.leading, 74)
                    }
                }
            }
            .background(isDark ? Color.white.opacity(0.05) : Color.white.opacity(0.7))
            .cornerRadius(16)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(isDark ? Color.white.opacity(0.08) : Color(hex: "e2e8f0"), lineWidth: 0.5)
            )
        }
        .padding(.horizontal, 4)
        .padding(.vertical, 8)
        .onAppear {
            withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) {
                isAnimating = true
            }
        }
    }

    private var skeletonStatBox: some View {
        VStack(spacing: 8) {
            Circle()
                .fill(skeletonBg)
                .frame(width: 32, height: 32)
                .overlay(
                    Circle()
                        .fill(shimmerGradient)
                        .opacity(isAnimating ? 1 : 0.5)
                )

            skeletonPill(width: 50, height: 18)
            skeletonPill(width: 40, height: 10)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(isDark ? Color.white.opacity(0.05) : Color.white.opacity(0.7))
        .cornerRadius(14)
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(isDark ? Color.white.opacity(0.08) : Color(hex: "e2e8f0"), lineWidth: 0.5)
        )
    }

    private var skeletonAppRow: some View {
        HStack(spacing: 12) {
            // App icon placeholder
            RoundedRectangle(cornerRadius: 12)
                .fill(skeletonBg)
                .frame(width: 48, height: 48)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(shimmerGradient)
                        .opacity(isAnimating ? 1 : 0.5)
                )

            // App info
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    skeletonPill(width: 100, height: 14)
                    Spacer()
                    skeletonPill(width: 40, height: 14)
                }

                // Progress bar
                RoundedRectangle(cornerRadius: 3)
                    .fill(skeletonBg)
                    .frame(height: 6)
                    .overlay(
                        GeometryReader { geo in
                            RoundedRectangle(cornerRadius: 3)
                                .fill(shimmerGradient)
                                .frame(width: geo.size.width * 0.6)
                                .opacity(isAnimating ? 1 : 0.5)
                        }
                    )
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
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

// MARK: - Apps Only Skeleton Loader (without Quick Stats)

struct AppsOnlySkeletonLoader: View {
    @Environment(\.colorScheme) private var colorScheme
    @State private var isAnimating = false

    private var isDark: Bool { colorScheme == .dark }

    private var shimmerGradient: LinearGradient {
        LinearGradient(
            colors: [
                isDark ? Color.white.opacity(0.03) : Color(hex: "e2e8f0"),
                isDark ? Color.white.opacity(0.08) : Color.white.opacity(0.7),
                isDark ? Color.white.opacity(0.03) : Color(hex: "e2e8f0")
            ],
            startPoint: .leading,
            endPoint: .trailing
        )
    }

    private var skeletonBg: Color {
        isDark ? Color.white.opacity(0.05) : Color.white.opacity(0.7)
    }

    var body: some View {
        VStack(spacing: 16) {
            // Apps Section Header
            HStack {
                skeletonPill(width: 28, height: 28)
                skeletonPill(width: 80, height: 16)
                Spacer()
                skeletonPill(width: 50, height: 14)
            }

            // App Rows (5 rows)
            VStack(spacing: 0) {
                ForEach(0..<5, id: \.self) { index in
                    skeletonAppRow
                    if index < 4 {
                        Rectangle()
                            .fill(isDark ? Color.white.opacity(0.06) : Color(hex: "e2e8f0"))
                            .frame(height: 1)
                            .padding(.leading, 74)
                    }
                }
            }
            .background(isDark ? Color.white.opacity(0.05) : Color.white.opacity(0.7))
            .cornerRadius(16)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(isDark ? Color.white.opacity(0.08) : Color(hex: "e2e8f0"), lineWidth: 0.5)
            )
        }
        .padding(.horizontal, 4)
        .padding(.vertical, 8)
        .onAppear {
            withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) {
                isAnimating = true
            }
        }
    }

    private var skeletonAppRow: some View {
        HStack(spacing: 12) {
            // App icon placeholder
            RoundedRectangle(cornerRadius: 12)
                .fill(skeletonBg)
                .frame(width: 48, height: 48)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(shimmerGradient)
                        .opacity(isAnimating ? 1 : 0.5)
                )

            // App info
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    skeletonPill(width: 100, height: 14)
                    Spacer()
                    skeletonPill(width: 40, height: 14)
                }

                // Progress bar
                RoundedRectangle(cornerRadius: 3)
                    .fill(skeletonBg)
                    .frame(height: 6)
                    .overlay(
                        GeometryReader { geo in
                            RoundedRectangle(cornerRadius: 3)
                                .fill(shimmerGradient)
                                .frame(width: geo.size.width * 0.6)
                                .opacity(isAnimating ? 1 : 0.5)
                        }
                    )
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
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

// MARK: - Day Stats Model

struct DayStats: Identifiable {
    let id = UUID()
    let day: String
    let earned: Double
    let spent: Double
    let isToday: Bool
}

// MARK: - Today's Progress Card (matches RN TodaysProgress.tsx)

struct TodaysProgressCard: View {
    let isDark: Bool
    let accentColor: Color
    let todaySpent: Double
    let todayEarned: Double
    let availableBalance: Double
    let weeklyData: [DayStats]
    let onEarnTapped: () -> Void

    private var glassyBg: Color {
        isDark ? Color.white.opacity(0.06) : Color.white.opacity(0.7)
    }

    private var glassyBorder: Color {
        isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.06)
    }

    private var secondaryText: Color {
        isDark ? Color(hex: "9ca3af") : Color(hex: "6b7280")
    }

    var body: some View {
        // Main Card with Gradient Border Effect
        ZStack {
            // Gradient border - subtle
            LinearGradient(
                colors: [
                    accentColor.opacity(0.25),
                    Color(hex: "8b5cf6").opacity(0.25),
                    Color(hex: "10b981").opacity(0.25)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .clipShape(RoundedRectangle(cornerRadius: 24))

            // Inner card content
            VStack(spacing: 0) {
                // Simple transparent background
                ZStack {
                    RoundedRectangle(cornerRadius: 23)
                        .fill(Color.white.opacity(0.05))

                    // Content
                    VStack(spacing: 20) {
                        // Header
                        progressHeader

                        // Stats Row - 3 glassy cards
                        statsRow

                        // Weekly Chart
                        weeklyChart
                    }
                    .padding(20)
                }
            }
            .padding(1.5)
        }
    }

    // MARK: - Header

    private var progressHeader: some View {
        HStack {
            HStack(spacing: 10) {
                // Icon with gradient background
                ZStack {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(
                            LinearGradient(
                                colors: [accentColor, Color(hex: "8b5cf6")],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 36, height: 36)

                    Image(systemName: "target")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(.white)
                }

                Text(L10n.Progress.todaysProgress)
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(isDark ? .white : Color(hex: "111827"))
            }

            Spacer()

            // Earn button
            Button(action: onEarnTapped) {
                HStack(spacing: 4) {
                    Image(systemName: "arrow.up.right")
                        .font(.system(size: 14, weight: .semibold))
                    Text(L10n.Progress.earn)
                        .font(.system(size: 12, weight: .bold))
                }
                .foregroundStyle(accentColor)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(accentColor.opacity(isDark ? 0.2 : 0.15))
                .clipShape(Capsule())
            }
        }
    }

    // MARK: - Stats Row

    private var statsRow: some View {
        HStack(spacing: 10) {
            // Spent
            ProgressMiniCard(
                title: L10n.Progress.spent,
                value: formatMinutes(todaySpent),
                icon: "clock.fill",
                accentColor: accentColor,
                isDark: isDark
            )

            // Earned
            ProgressMiniCard(
                title: L10n.Progress.earned,
                value: formatMinutes(todayEarned),
                icon: "dumbbell.fill",
                accentColor: Color(hex: "10b981"),
                isDark: isDark
            )

            // Balance
            ProgressMiniCard(
                title: L10n.Progress.balance,
                value: formatMinutes(availableBalance),
                icon: "wallet.pass.fill",
                accentColor: Color(hex: "8b5cf6"),
                isDark: isDark
            )
        }
    }

    // MARK: - Weekly Chart

    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Container for chart
            ZStack {
                RoundedRectangle(cornerRadius: 16)
                    .fill(isDark ? Color.white.opacity(0.06) : Color.white.opacity(0.7))

                VStack(spacing: 0) {
                    // Title
                    HStack {
                        Text(L10n.Progress.thisWeek)
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(isDark ? .white : Color(hex: "111827"))
                        Spacer()
                    }
                    .padding(.bottom, 4)

                    // Legend
                    HStack(spacing: 20) {
                        Spacer()
                        HStack(spacing: 6) {
                            RoundedRectangle(cornerRadius: 3)
                                .fill(Color(hex: "10b981"))
                                .frame(width: 10, height: 10)
                            Text(L10n.Progress.earned)
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundStyle(secondaryText)
                        }
                        HStack(spacing: 6) {
                            RoundedRectangle(cornerRadius: 3)
                                .fill(accentColor)
                                .frame(width: 10, height: 10)
                            Text(L10n.Progress.spent)
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundStyle(secondaryText)
                        }
                        Spacer()
                    }
                    .padding(.bottom, 14)

                    // Bars
                    WeeklyDualBarChart(
                        data: weeklyData,
                        accentColor: accentColor,
                        isDark: isDark
                    )
                }
                .padding(14)
            }
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(glassyBorder, lineWidth: 1)
            )
        }
    }

    private func formatMinutes(_ minutes: Double) -> String {
        let totalMinutes = Int(minutes)
        if totalMinutes >= 60 {
            let hours = totalMinutes / 60
            let mins = totalMinutes % 60
            return mins > 0 ? "\(hours)h \(mins)m" : "\(hours)h"
        }
        return "\(totalMinutes)m"
    }
}

// MARK: - Progress Mini Card

struct ProgressMiniCard: View {
    let title: String
    let value: String
    let icon: String
    let accentColor: Color
    let isDark: Bool

    private var glassyBorder: Color {
        isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.06)
    }

    var body: some View {
        VStack(spacing: 6) {
            Text(title.uppercased())
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(isDark ? Color.white.opacity(0.5) : Color(hex: "9ca3af"))
                .tracking(0.5)

            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 14))
                    .foregroundStyle(accentColor)
                Text(value)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(accentColor)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(
            ZStack {
                RoundedRectangle(cornerRadius: 14)
                    .fill(isDark ? Color.white.opacity(0.06) : Color.white.opacity(0.7))

                // Glow from accent
                LinearGradient(
                    colors: [accentColor.opacity(0.12), Color.clear],
                    startPoint: .bottom,
                    endPoint: .top
                )
                .clipShape(RoundedRectangle(cornerRadius: 14))
            }
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.06), lineWidth: 0.5)
        )
    }
}

// MARK: - Weekly Dual Bar Chart

struct WeeklyDualBarChart: View {
    let data: [DayStats]
    let accentColor: Color
    let isDark: Bool

    private var maxValue: Double {
        max(data.map { max($0.earned, $0.spent) }.max() ?? 1, 1)
    }

    private let chartHeight: CGFloat = 70
    private let barMaxHeight: CGFloat = 54 // Leave room for labels
    private let barWidth: CGFloat = 10

    var body: some View {
        HStack(alignment: .bottom, spacing: 0) {
            ForEach(data) { item in
                VStack(spacing: 4) {
                    // Dual bars container
                    HStack(alignment: .bottom, spacing: 3) {
                        // Earned bar (green)
                        let earnedHeight = maxValue > 0 ? CGFloat(item.earned / maxValue) * barMaxHeight : 0
                        RoundedRectangle(cornerRadius: 5)
                            .fill(Color(hex: "10b981"))
                            .frame(width: barWidth, height: max(earnedHeight, 4))
                            .opacity(item.isToday ? 1 : 0.6)

                        // Spent bar (accent)
                        let spentHeight = maxValue > 0 ? CGFloat(item.spent / maxValue) * barMaxHeight : 0
                        RoundedRectangle(cornerRadius: 5)
                            .fill(accentColor)
                            .frame(width: barWidth, height: max(spentHeight, 4))
                            .opacity(item.isToday ? 1 : 0.6)
                    }
                    .frame(height: barMaxHeight, alignment: .bottom)

                    // Day label
                    Text(item.day)
                        .font(.system(size: 9, weight: item.isToday ? .bold : .medium))
                        .foregroundStyle(
                            item.isToday
                                ? (isDark ? .white : Color(hex: "111827"))
                                : (isDark ? Color(hex: "6b7280") : Color(hex: "9ca3af"))
                        )
                }
                .frame(maxWidth: .infinity)
            }
        }
        .frame(height: chartHeight)
    }
}

#Preview {
    HomeView_OLD(selectedTab: .constant(0))
        .environment(ThemeService())
        .environment(TimeBankService())
        .environment(StatsService())
        .environment(BlockingService())
}




//yes
