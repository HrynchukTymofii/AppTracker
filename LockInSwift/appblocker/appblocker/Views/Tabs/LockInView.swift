import SwiftUI

struct LockInView: View {
    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService
    @Environment(TimeBankService.self) private var timeBank
    @Environment(BlockingService.self) private var blockingService
    @Environment(ExerciseFavoritesService.self) private var favoritesService
    @Environment(StatsService.self) private var statsService

    @State private var showTaskSheet = false
    @State private var selectedTaskType: ExerciseType?
    @State private var pulseAnimation = false
    @State private var hasOngoingTask = false
    @State private var ongoingTaskName = ""
    @State private var lastTapType: ExerciseType?
    @State private var lastTapTime: Date?
    @Namespace private var scrollNamespace

    // Celebration state
    @State private var showCelebration = false
    @State private var celebrationStreak = 0
    @State private var celebrationEarned: Double = 0
    @State private var celebrationExerciseType: ExerciseType = .pushups

    // History view state
    @State private var showActivityHistory = false

    private var isDark: Bool { colorScheme == .dark }

    // Colors matching RN app
    private let greenColor = Color(red: 0.063, green: 0.725, blue: 0.506) // #10b981
    private let redColor = Color(red: 0.937, green: 0.267, blue: 0.267) // #ef4444
    private let purpleColor = Color(red: 0.545, green: 0.361, blue: 0.965) // #8b5cf6

    var body: some View {
        ThemedBackground {
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(spacing: 0) {
                        // Hero Section
                        heroSection
                            .padding(.bottom, 20)

                        divider

                        // Earn Time Section
                        earnTimeSection(scrollProxy: proxy)
                            .padding(.vertical, 20)

                        divider

                        // Exercise Cards
                        exerciseCardsSection
                            .padding(.vertical, 20)
                            .id("earnSection")

                        divider

                        // Transaction History
                        transactionHistorySection
                            .padding(.vertical, 20)
                    }
                    .padding(.bottom, 120)
                }
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 2).repeatForever(autoreverses: true)) {
                pulseAnimation = true
            }
            checkForOngoingTask()
        }
        .onChange(of: showTaskSheet) { _, isShowing in
            // Refresh ongoing task status when sheet is dismissed
            if !isShowing {
                checkForOngoingTask()
            }
        }
        .sheet(isPresented: $showTaskSheet) {
            if let taskType = selectedTaskType {
                ExerciseExecutionView(
                    exerciseType: taskType,
                    target: taskType.defaultTarget,
                    reward: taskType.defaultReward
                ) { completedTask in
                    // Check if this is the first task of the day BEFORE recording completion
                    let isFirstTaskOfDay = !timeBank.hasCompletedTaskToday()

                    // Earn time (this also records the completion date)
                    timeBank.earnFromExercise(completedTask)

                    // Update streak
                    statsService.calculateStreakFromCompletionDates()

                    // Only show streak celebration for first task of the day
                    if isFirstTaskOfDay {
                        celebrationExerciseType = completedTask.type
                        celebrationEarned = completedTask.actualReward > 0 ? completedTask.actualReward : Double(completedTask.reward)
                        celebrationStreak = statsService.currentStreak

                        // Slight delay to let sheet dismiss first
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                            showCelebration = true
                        }
                    }
                }
            }
        }
        .fullScreenCover(isPresented: $showCelebration) {
            StreakCelebrationView(
                streakCount: celebrationStreak,
                earnedMinutes: celebrationEarned,
                exerciseType: celebrationExerciseType
            ) {
                showCelebration = false
            }
        }
        .sheet(isPresented: $showActivityHistory) {
            ActivityHistoryView()
        }
        .onReceive(NotificationCenter.default.publisher(for: .openExercise)) { notification in
            if let exerciseType = notification.userInfo?["exerciseType"] as? ExerciseType {
                selectedTaskType = exerciseType
                showTaskSheet = true
            }
        }
    }

    // MARK: - Divider

    private var divider: some View {
        Rectangle()
            .fill(isDark ? Color.white.opacity(0.06) : Color(hex: "e2e8f0"))
            .frame(height: 1)
            .padding(.horizontal, 20)
    }

    // MARK: - Hero Section

    private var heroSection: some View {
        VStack(spacing: 16) {
            // Animated icon with rings
            ZStack {
                // Outer ring (pulsing)
                Circle()
                    .stroke(themeService.accentColor.opacity(0.1), lineWidth: 2)
                    .frame(width: 100, height: 100)
                    .scaleEffect(pulseAnimation ? 1.1 : 1.0)
                    .opacity(pulseAnimation ? 0.5 : 1.0)

                // Middle ring (pulsing with delay)
                Circle()
                    .stroke(themeService.accentColor.opacity(0.2), lineWidth: 2)
                    .frame(width: 80, height: 80)
                    .scaleEffect(pulseAnimation ? 1.05 : 1.0)

                // Inner circle with icon (rotating subtly)
                Circle()
                    .fill(themeService.accentColor.opacity(0.15))
                    .frame(width: 60, height: 60)
                    .overlay {
                        Image(systemName: "scope")
                            .font(.system(size: 28, weight: .medium))
                            .foregroundStyle(themeService.accentColor)
                            .rotationEffect(.degrees(pulseAnimation ? 10 : -10))
                    }
            }
            .padding(.top, 20)

            VStack(spacing: 8) {
                Text(L10n.LockIn.title)
                    .font(.system(size: 28, weight: .bold))
                    .foregroundStyle(isDark ? .white : Color(hex: "111827"))

                Text(L10n.LockIn.subtitle)
                    .font(.system(size: 15))
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, 20)
    }

    // MARK: - Earn Time Section (WalletBalanceCard Style)

    private let blueAccent = Color(hex: "3b82f6")

    private func earnTimeSection(scrollProxy: ScrollViewProxy) -> some View {
        VStack(spacing: 16) {
            // Wallet Balance Card (RN Style with subtle gradient)
            HStack(spacing: 14) {
                // Blue gradient icon with clock
                RoundedRectangle(cornerRadius: 14)
                    .fill(LinearGradient(
                        colors: [Color(hex: "3b82f6"), Color(hex: "2563eb")],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ))
                    .frame(width: 48, height: 48)
                    .overlay {
                        Image(systemName: "clock.fill")
                            .font(.system(size: 24))
                            .foregroundStyle(.white)
                    }

                // Content
                VStack(alignment: .leading, spacing: 2) {
                    Text(L10n.LockIn.balance)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(isDark ? Color(hex: "9ca3af") : Color(hex: "6b7280"))

                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(String(format: "%.1f", timeBank.availableMinutes))
                            .font(.system(size: 24, weight: .heavy))
                            .foregroundStyle(blueAccent)

                        Text(L10n.LockIn.minutes)
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(isDark ? Color(hex: "6b7280") : Color(hex: "9ca3af"))
                    }
                }

                Spacer()

                // Earn button
                Button {
                    withAnimation(.easeInOut(duration: 0.4)) {
                        scrollProxy.scrollTo("earnSection", anchor: .top)
                    }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "dumbbell.fill")
                            .font(.system(size: 14))
                        Text(L10n.LockIn.earn)
                            .font(.system(size: 13, weight: .semibold))
                        Image(systemName: "chevron.right")
                            .font(.system(size: 12, weight: .medium))
                    }
                    .foregroundStyle(greenColor)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(
                        RoundedRectangle(cornerRadius: 10)
                            .fill(greenColor.opacity(0.15))
                    )
                }
            }
            .padding(16)
            .background(
                ZStack {
                    // Glassy background
                    if isDark {
                        RoundedRectangle(cornerRadius: 20)
                            .fill(Color.white.opacity(0.03))
                    } else {
                        RoundedRectangle(cornerRadius: 20)
                            .fill(.ultraThinMaterial)
                    }

                    // Top shine (subtle)
                    VStack {
                        LinearGradient(
                            colors: isDark
                                ? [Color.white.opacity(0.04), Color.clear]
                                : [Color.white.opacity(0.3), Color.clear],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                        .frame(height: 35)
                        Spacer()
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 20))
                }
            )

            // Detailed Stats Card with subtle gradient
            VStack(spacing: 12) {
                // Today's Stats
                HStack(spacing: 12) {
                    Text(L10n.LockIn.today)
                        .font(.system(size: 14))
                        .foregroundStyle(.secondary)

                    Text("+\(String(format: "%.1f", timeBank.todayEarned))")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(greenColor)

                    Text(L10n.LockIn.earned)
                        .font(.system(size: 14))
                        .foregroundStyle(.secondary)

                    Text("/")
                        .foregroundStyle(.secondary.opacity(0.5))

                    Text("-\(String(format: "%.1f", timeBank.todaySpent))")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(redColor)

                    Text(L10n.LockIn.spent)
                        .font(.system(size: 14))
                        .foregroundStyle(.secondary)

                    Spacer()
                }

                // Weekly Stats
                HStack(spacing: 8) {
                    Image(systemName: "chart.line.uptrend.xyaxis")
                        .font(.system(size: 12))
                        .foregroundStyle(greenColor)

                    Text(L10n.LockIn.week)
                        .font(.system(size: 13))
                        .foregroundStyle(.secondary)

                    Text("+\(Int(timeBank.weeklyEarned))m")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(greenColor)

                    Text("/")
                        .foregroundStyle(.secondary.opacity(0.5))

                    Text("-\(Int(timeBank.weeklySpent))m")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(redColor)

                    Spacer()

                    // Reset notice
                    HStack(spacing: 4) {
                        Image(systemName: "clock.arrow.circlepath")
                            .font(.system(size: 11))
                        Text(L10n.LockIn.resetsInHours(timeBank.hoursUntilReset))
                            .font(.system(size: 11))
                    }
                    .foregroundStyle(.secondary)
                }
            }
            .padding(16)
            .background(
                ZStack {
                    if isDark {
                        RoundedRectangle(cornerRadius: 14)
                            .fill(Color.white.opacity(0.02))
                    } else {
                        RoundedRectangle(cornerRadius: 14)
                            .fill(.ultraThinMaterial)
                    }

                    // Top shine (subtle)
                    VStack {
                        LinearGradient(
                            colors: isDark
                                ? [Color.white.opacity(0.03), Color.clear]
                                : [Color.white.opacity(0.3), Color.clear],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                        .frame(height: 25)
                        Spacer()
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                }
            )
        }
        .padding(.horizontal, 20)
    }

    // MARK: - Ongoing Task Check

    private func checkForOngoingTask() {
        if let savedTaskId = UserDefaults.standard.string(forKey: "photoTask.currentTaskId"),
           !savedTaskId.isEmpty {
            // Check if the before photo file actually exists
            let savedURL = FileManager.default.temporaryDirectory.appendingPathComponent("photo_task_before_\(savedTaskId).jpg")
            if FileManager.default.fileExists(atPath: savedURL.path) {
                hasOngoingTask = true
                ongoingTaskName = UserDefaults.standard.string(forKey: "photoTask.taskName") ?? "Photo Task"
                return
            }
        }
        hasOngoingTask = false
        ongoingTaskName = ""
    }

    // MARK: - Ongoing Task Banner

    private let orangeColor = Color(red: 0.961, green: 0.620, blue: 0.043) // #f59e0b

    private var ongoingTaskBanner: some View {
        Button {
            selectedTaskType = .photoVerification
            showTaskSheet = true
        } label: {
            HStack(spacing: 14) {
                // Pulsing indicator
                ZStack {
                    Circle()
                        .fill(orangeColor.opacity(0.2))
                        .frame(width: 44, height: 44)

                    Circle()
                        .fill(orangeColor.opacity(0.3))
                        .frame(width: 32, height: 32)
                        .scaleEffect(pulseAnimation ? 1.1 : 1.0)

                    Image(systemName: "clock.badge.exclamationmark.fill")
                        .font(.system(size: 20))
                        .foregroundStyle(orangeColor)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(L10n.LockIn.taskInProgress)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(isDark ? .white : Color(hex: "111827"))

                    Text(ongoingTaskName)
                        .font(.system(size: 13))
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }

                Spacer()

                HStack(spacing: 4) {
                    Text(L10n.LockIn.continue)
                        .font(.system(size: 14, weight: .semibold))
                    Image(systemName: "arrow.right")
                        .font(.system(size: 12, weight: .semibold))
                }
                .foregroundStyle(orangeColor)
            }
            .padding(14)
            .background(
                ZStack {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(orangeColor.opacity(isDark ? 0.08 : 0.06))

                    // Bottom glow
                    VStack {
                        Spacer()
                        LinearGradient(
                            colors: [orangeColor.opacity(0.1), Color.clear],
                            startPoint: .bottom,
                            endPoint: .top
                        )
                        .frame(height: 40)
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                }
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Exercise Cards Section

    /// All favoritable exercises
    private var allExercises: [ExerciseType] {
        ExerciseType.allCases.filter { $0.isFavoritable }
    }

    /// Exercises split into favorites and others
    private var favoriteExercises: [ExerciseType] {
        allExercises.filter { favoritesService.isFavorite($0) }
    }

    private var otherExercises: [ExerciseType] {
        allExercises.filter { !favoritesService.isFavorite($0) }
    }

    private func handleExerciseTap(_ type: ExerciseType) {
        let now = Date()
        let doubleTapWindow: TimeInterval = 0.3

        // Check for double tap
        if let lastType = lastTapType,
           let lastTime = lastTapTime,
           lastType == type,
           now.timeIntervalSince(lastTime) < doubleTapWindow {
            // Double tap detected - toggle favorite
            favoritesService.toggleFavorite(type)
            lastTapType = nil
            lastTapTime = nil
            return
        }

        // Single tap - record it and start exercise after delay
        lastTapType = type
        lastTapTime = now

        DispatchQueue.main.asyncAfter(deadline: .now() + doubleTapWindow) { [self] in
            // Only start if this was a single tap (no double tap detected)
            if lastTapType == type,
               let tapTime = lastTapTime,
               Date().timeIntervalSince(tapTime) >= doubleTapWindow - 0.02 {
                selectedTaskType = type
                showTaskSheet = true
                lastTapType = nil
                lastTapTime = nil
            }
        }
    }

    private var exerciseCardsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(L10n.LockIn.earnTime)
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(.secondary)
                .tracking(0.5)
                .padding(.horizontal, 20)

            // Ongoing task banner
            if hasOngoingTask {
                ongoingTaskBanner
                    .padding(.horizontal, 20)
                    .padding(.bottom, 4)
            }

            VStack(spacing: 8) {
                // Photo Task (always at top, no favorites)
                ExerciseCard(
                    type: .photoVerification,
                    gradientColors: ExerciseType.photoVerification.gradientColors,
                    isFavorite: false,
                    onTap: {
                        selectedTaskType = .photoVerification
                        showTaskSheet = true
                    }
                )

                // Favorites Section
                if !favoriteExercises.isEmpty {
                    HStack(spacing: 6) {
                        Image(systemName: "star.fill")
                            .font(.system(size: 12))
                            .foregroundStyle(Color(hex: "fbbf24"))

                        Text(L10n.LockIn.favorites)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(isDark ? .white : Color(hex: "111827"))

                        Text(L10n.LockIn.doubleTapRemove)
                            .font(.system(size: 11))
                            .foregroundStyle(.secondary)

                        Spacer()
                    }
                    .padding(.top, 8)

                    ForEach(favoriteExercises, id: \.rawValue) { type in
                        ExerciseCard(
                            type: type,
                            gradientColors: type.gradientColors,
                            isFavorite: true,
                            onTap: { handleExerciseTap(type) }
                        )
                    }
                }

                // Other Exercises Section
                HStack(spacing: 6) {
                    Image(systemName: "dumbbell.fill")
                        .font(.system(size: 12))
                        .foregroundStyle(greenColor)

                    Text(L10n.LockIn.allExercises)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(isDark ? .white : Color(hex: "111827"))

                    Text(L10n.LockIn.doubleTapAdd)
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)

                    Spacer()
                }
                .padding(.top, favoriteExercises.isEmpty ? 0 : 8)

                ForEach(otherExercises, id: \.rawValue) { type in
                    ExerciseCard(
                        type: type,
                        gradientColors: type.gradientColors,
                        isFavorite: false,
                        onTap: { handleExerciseTap(type) }
                    )
                }
            }
            .padding(.horizontal, 20)
        }
    }

    // MARK: - Transaction History Section

    private var transactionHistorySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(L10n.LockIn.recentActivity)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.secondary)
                    .tracking(0.5)

                Spacer()

                if !timeBank.transactions.isEmpty {
                    Button {
                        showActivityHistory = true
                    } label: {
                        Text(L10n.Home.seeAll)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(themeService.accentColor)
                    }
                }
            }
            .padding(.horizontal, 20)

            if timeBank.transactions.isEmpty {
                emptyHistoryView
            } else {
                VStack(spacing: 0) {
                    ForEach(timeBank.transactions.prefix(5)) { transaction in
                        TransactionRow(transaction: transaction)

                        if transaction.id != timeBank.transactions.prefix(5).last?.id {
                            Rectangle()
                                .fill(isDark ? Color.white.opacity(0.06) : Color(hex: "e2e8f0"))
                                .frame(height: 1)
                                .padding(.horizontal, 14)
                        }
                    }
                }
                .background(
                    ZStack {
                        if isDark {
                            RoundedRectangle(cornerRadius: 16)
                                .fill(Color.white.opacity(0.03))
                        } else {
                            RoundedRectangle(cornerRadius: 16)
                                .fill(.ultraThinMaterial)
                        }

                        // Top shine (subtle)
                        VStack {
                            LinearGradient(
                                colors: isDark
                                    ? [Color.white.opacity(0.04), Color.clear]
                                    : [Color.white.opacity(0.3), Color.clear],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                            .frame(height: 35)
                            Spacer()
                        }
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                    }
                )
                .padding(.horizontal, 20)
            }
        }
    }

    private var emptyHistoryView: some View {
        VStack(spacing: 12) {
            Image(systemName: "clock.arrow.circlepath")
                .font(.system(size: 40))
                .foregroundStyle(.secondary)

            Text(L10n.LockIn.noActivity)
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(.secondary)

            Text(L10n.LockIn.completeExercises)
                .font(.system(size: 14))
                .foregroundStyle(.secondary.opacity(0.7))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
        .background(
            ZStack {
                if isDark {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color.white.opacity(0.03))
                } else {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(.ultraThinMaterial)
                }

                // Top shine (subtle)
                VStack {
                    LinearGradient(
                        colors: isDark
                            ? [Color.white.opacity(0.04), Color.clear]
                            : [Color.white.opacity(0.3), Color.clear],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                    .frame(height: 35)
                    Spacer()
                }
                .clipShape(RoundedRectangle(cornerRadius: 16))
            }
        )
        .padding(.horizontal, 20)
    }
}

// MARK: - Exercise Card (RN Style)

struct ExerciseCard: View {
    let type: ExerciseType
    let gradientColors: [Color]
    var isFavorite: Bool = false
    let onTap: () -> Void

    @Environment(\.colorScheme) private var colorScheme
    private var isDark: Bool { colorScheme == .dark }

    private let favoriteColor = Color(hex: "fbbf24") // Amber
    private let defaultColor = Color(hex: "10b981")  // Green

    private let blueGradient = [Color(hex: "3b82f6"), Color(hex: "2563eb")]

    // Accent color for this card (amber for favorites, green for regular)
    private var accentColor: Color {
        isFavorite ? favoriteColor : defaultColor
    }

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 14) {
                // Icon with colorful border
                Group {
                    if isDark {
                        RoundedRectangle(cornerRadius: 14)
                            .fill(Color.white.opacity(0.03))
                    } else {
                        RoundedRectangle(cornerRadius: 14)
                            .fill(.ultraThinMaterial)
                    }
                }
                .frame(width: 48, height: 48)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(
                                LinearGradient(colors: gradientColors, startPoint: .topLeading, endPoint: .bottomTrailing),
                                lineWidth: 2
                            )
                    )
                    .overlay {
                        if let imageName = type.imageName, let uiImage = UIImage(named: imageName) {
                            // Exercise with custom image
                            Image(uiImage: uiImage)
                                .resizable()
                                .scaledToFill()
                                .frame(width: 48, height: 48)
                                .clipShape(RoundedRectangle(cornerRadius: 14))
                        } else if type == .photoVerification {
                            // Photo task - blue glassy camera icon
                            ZStack {
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(
                                        LinearGradient(
                                            colors: [
                                                Color(hex: "3b82f6").opacity(0.2),
                                                Color(hex: "2563eb").opacity(0.3)
                                            ],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    )
                                    .frame(width: 44, height: 44)

                                Image(systemName: "camera.fill")
                                    .font(.system(size: 22, weight: .medium))
                                    .foregroundStyle(
                                        LinearGradient(
                                            colors: blueGradient,
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    )
                            }
                        } else {
                            Text(type.emoji)
                                .font(.system(size: 24))
                        }
                    }

                VStack(alignment: .leading, spacing: 2) {
                    Text(type.displayName)
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                        .tracking(-0.3)

                    Text(type.rewardDescription)
                        .font(.system(size: 13))
                        .foregroundStyle(isDark ? Color.white.opacity(0.5) : Color(hex: "94a3b8"))
                }

                Spacer()

                // Favorite star indicator
                if isFavorite {
                    Image(systemName: "star.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(favoriteColor)
                }

                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(accentColor)
            }
            .padding(16)
            .background(
                ZStack {
                    // Glassy background
                    if isDark {
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.white.opacity(0.03))
                    } else {
                        RoundedRectangle(cornerRadius: 16)
                            .fill(.ultraThinMaterial)
                    }

                    // Top shine gradient (very subtle)
                    VStack {
                        LinearGradient(
                            colors: isDark
                                ? [Color.white.opacity(0.04), Color.clear]
                                : [Color.white.opacity(0.3), Color.clear],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                        .frame(height: 35)
                        Spacer()
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 16))

                    // Bottom glow from accent color (subtle)
                    VStack {
                        Spacer()
                        LinearGradient(
                            colors: [accentColor.opacity(isDark ? 0.08 : 0.12), Color.clear],
                            startPoint: .bottom,
                            endPoint: .top
                        )
                        .frame(height: 45)
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                }
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Transaction Row

struct TransactionRow: View {
    let transaction: TimeTransaction

    @Environment(\.colorScheme) private var colorScheme
    private var isDark: Bool { colorScheme == .dark }

    private let greenColor = Color(red: 0.063, green: 0.725, blue: 0.506)
    private let redColor = Color(red: 0.937, green: 0.267, blue: 0.267)

    var body: some View {
        HStack(spacing: 12) {
            // Icon
            Circle()
                .fill(transaction.isEarned ? greenColor.opacity(0.15) : redColor.opacity(0.15))
                .frame(width: 40, height: 40)
                .overlay {
                    Image(systemName: transaction.source.icon)
                        .font(.system(size: 16))
                        .foregroundStyle(transaction.isEarned ? greenColor : redColor)
                }

            VStack(alignment: .leading, spacing: 2) {
                Text(transaction.source.displayName)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(isDark ? .white : .black)

                if let note = transaction.note {
                    Text(note)
                        .font(.system(size: 12))
                        .foregroundStyle(.secondary)
                } else {
                    Text(formatDate(transaction.timestamp))
                        .font(.system(size: 12))
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            Text("\(transaction.formattedAmount)m")
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(transaction.isEarned ? greenColor : redColor)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

#Preview {
    LockInView()
        .environment(ThemeService())
        .environment(TimeBankService())
        .environment(BlockingService())
}
