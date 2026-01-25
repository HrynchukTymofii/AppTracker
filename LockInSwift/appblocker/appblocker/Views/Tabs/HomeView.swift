import SwiftUI
import SwiftData
import DeviceActivity

// MARK: - New Liquid Glass HomeView

struct HomeView: View {
    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService
    @Environment(TimeBankService.self) private var timeBank
    @Environment(StatsService.self) private var statsService
    @Environment(BlockingService.self) private var blockingService
    @Environment(ScheduleService.self) private var scheduleService
    @Environment(\.modelContext) private var modelContext

    @Binding var selectedTab: Int

    // Query all tasks - we'll filter for today in computed property
    @Query private var allTasks: [ScheduledTask]

    @State private var showSettings = false
    @State private var currentTaskTimeRemaining: TimeInterval = 0
    @State private var timer: Timer?

    private var isDark: Bool { colorScheme == .dark }

    // HTML Colors
    private let backgroundDark = Color(hex: "#050505")
    private var primary: Color { themeService.accentColor }
    private let glassDark = Color(red: 24/255, green: 38/255, blue: 52/255).opacity(0.4)
    private let zinc400 = Color(hex: "#a1a1aa")
    private let zinc500 = Color(hex: "#71717a")
    private let zinc800 = Color(hex: "#27272a")

    // MARK: - Real Task Data

    private var todaysTasks: [ScheduledTask] {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        guard let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay) else {
            return []
        }
        return allTasks.filter { task in
            task.scheduledDate >= startOfDay && task.scheduledDate < endOfDay
        }.sorted { $0.startTime < $1.startTime }
    }

    private var completedTasks: Int {
        todaysTasks.filter { $0.status == .completed }.count
    }

    private var totalTasks: Int {
        todaysTasks.count
    }

    private var progressPercentage: Int {
        guard totalTasks > 0 else { return 0 }
        return Int((Double(completedTasks) / Double(totalTasks)) * 100)
    }

    /// Current task is either in-progress or the next upcoming task
    private var currentTask: ScheduledTask? {
        let now = Date()

        // First check for in-progress tasks
        if let inProgress = todaysTasks.first(where: { $0.status == .inProgress }) {
            return inProgress
        }

        // Then check for a task that should be active now (started but not ended)
        if let activeNow = todaysTasks.first(where: { task in
            task.startTime <= now && task.endTime >= now && task.status == .pending
        }) {
            return activeNow
        }

        // Finally get the next upcoming pending task
        return todaysTasks.first(where: { task in
            task.status == .pending && task.endTime > now
        })
    }

    private var motivationalText: String {
        let percentage = progressPercentage
        if totalTasks == 0 {
            return "No tasks scheduled for today"
        } else if percentage == 0 {
            return "Ready to start your day!"
        } else if percentage < 25 {
            return "Great start! Keep the momentum going!"
        } else if percentage < 50 {
            return "Almost halfway to your goal today!"
        } else if percentage < 75 {
            return "Over halfway there! You're crushing it!"
        } else if percentage < 100 {
            return "Almost done! Finish strong!"
        } else {
            return "All tasks completed! Amazing work!"
        }
    }

    var body: some View {
        ZStack {
            // Background - exact HTML color
            backgroundDark
                .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 0) {
                    // Header
                    headerSection

                    // Daily Progress Card
                    dailyProgressCard
                        .padding(.horizontal, 24)
                        .padding(.top, 16)

                    // Current Task Card
                    currentTaskCard
                        .padding(.horizontal, 24)
                        .padding(.top, 24)

                    // Blocked Applications Section
                    blockedAppsSection
                        .padding(.top, 32)

                    // Community Section
                    communitySection
                        .padding(.horizontal, 24)
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
            scheduleService.setModelContext(modelContext)
            updateTimeRemaining()
            startTimer()
        }
        .onDisappear {
            timer?.invalidate()
        }
        .onChange(of: currentTask?.id) { _, _ in
            updateTimeRemaining()
        }
    }

    private func updateTimeRemaining() {
        guard let task = currentTask else {
            currentTaskTimeRemaining = 0
            return
        }
        let remaining = task.endTime.timeIntervalSince(Date())
        currentTaskTimeRemaining = max(0, remaining)
    }

    // MARK: - Header Section

    private var headerSection: some View {
        HStack {
            // Left: Calendar icon + Date
            HStack(spacing: 12) {
                // Calendar icon in accent circle
                ZStack {
                    Circle()
                        .fill(primary.opacity(0.1))
                        .frame(width: 40, height: 40)
                        .overlay(
                            Circle()
                                .stroke(primary.opacity(0.2), lineWidth: 1)
                        )

                    Image(systemName: "calendar")
                        .font(.system(size: 18))
                        .foregroundStyle(primary)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(currentDayOfWeek.uppercased())
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(primary)
                        .tracking(2)

                    Text(currentDateFormatted)
                        .font(.system(size: 20, weight: .bold))
                        .foregroundStyle(.white)
                        .tracking(-0.5)
                }
            }

            Spacer()

            // Right: Status + Settings
            HStack(spacing: 8) {
                // Status indicator
                VStack(alignment: .trailing, spacing: 2) {
                    Text("STATUS")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(zinc500)
                        .tracking(-0.5)

                    HStack(spacing: 6) {
                        Circle()
                            .fill(primary)
                            .frame(width: 8, height: 8)
                            .shadow(color: primary.opacity(0.6), radius: 6)

                        Text("Focused")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(Color(hex: "#d4d4d8"))
                    }
                }

                // Settings button
                Button {
                    showSettings = true
                } label: {
                    ZStack {
                        Circle()
                            .fill(Color.white.opacity(0.05))
                            .frame(width: 40, height: 40)
                            .background(.ultraThinMaterial)
                            .clipShape(Circle())

                        Circle()
                            .stroke(Color.white.opacity(0.08), lineWidth: 1)
                            .frame(width: 40, height: 40)

                        Image(systemName: "gearshape")
                            .font(.system(size: 18))
                            .foregroundStyle(.white)
                    }
                }
            }
        }
        .padding(.horizontal, 24)
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
                        .foregroundStyle(zinc400)
                        .tracking(1)

                    Text("\(completedTasks)/\(totalTasks) tasks")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundStyle(.white)
                }

                Spacer()

                Text("\(progressPercentage)% done")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(primary)
            }

            // Progress bar
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(zinc800.opacity(0.5))
                        .frame(height: 12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 6)
                                .stroke(Color.white.opacity(0.05), lineWidth: 1)
                        )

                    RoundedRectangle(cornerRadius: 6)
                        .fill(primary)
                        .frame(width: geometry.size.width * CGFloat(progressPercentage) / 100, height: 12)
                        .shadow(color: primary.opacity(0.6), radius: 10)
                }
            }
            .frame(height: 12)

            // Motivational text
            HStack(spacing: 8) {
                Image(systemName: progressPercentage >= 100 ? "star.fill" : "sparkles")
                    .font(.system(size: 14))
                    .foregroundStyle(primary)

                Text(motivationalText)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(zinc400)
            }
            .padding(.top, 4)
        }
        .padding(20)
        .background(liquidGlassBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }

    // Liquid glass background - more transparent
    private var liquidGlassBackground: some View {
        Color.white.opacity(0.03)
    }

    // MARK: - Current Task Card

    @ViewBuilder
    private var currentTaskCard: some View {
        if let task = currentTask {
            activeTaskCard(task: task)
        } else {
            noTaskCard
        }
    }

    private func activeTaskCard(task: ScheduledTask) -> some View {
        VStack(spacing: 0) {
            // Header image with wave pattern
            ZStack(alignment: .bottomLeading) {
                // Dark wave background
                Rectangle()
                    .fill(
                        LinearGradient(
                            colors: [
                                Color(hex: "#1a365d"),
                                Color(hex: "#0d2137"),
                                backgroundDark
                            ],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .frame(height: 140)

                // Gradient overlay
                LinearGradient(
                    colors: [.clear, backgroundDark.opacity(0.9)],
                    startPoint: .top,
                    endPoint: .bottom
                )

                // Task type badge
                HStack(spacing: 6) {
                    Image(systemName: task.verificationType.icon)
                        .font(.system(size: 10, weight: .bold))
                    Text(task.verificationType.displayName.uppercased())
                        .font(.system(size: 10, weight: .bold))
                        .tracking(1)
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(primary)
                .clipShape(RoundedRectangle(cornerRadius: 4))
                .padding(16)
            }

            // Content
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text(task.title)
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(.white)
                        .tracking(-0.5)
                        .lineLimit(2)

                    if let description = task.taskDescription {
                        Text(description)
                            .font(.system(size: 15))
                            .foregroundStyle(zinc400)
                            .lineSpacing(3)
                            .lineLimit(2)
                    }

                    // Time range
                    Text(task.formattedTimeRange)
                        .font(.system(size: 13))
                        .foregroundStyle(zinc500)
                }

                HStack {
                    // Timer display
                    HStack(spacing: 12) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 12)
                                .fill(zinc800.opacity(0.5))
                                .frame(width: 40, height: 40)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(Color.white.opacity(0.1), lineWidth: 1)
                                )

                            Image(systemName: currentTaskTimeRemaining > 0 ? "timer" : "exclamationmark.triangle")
                                .font(.system(size: 18))
                                .foregroundStyle(currentTaskTimeRemaining > 0 ? zinc400 : .orange)
                        }

                        VStack(alignment: .leading, spacing: 2) {
                            Text(currentTaskTimeRemaining > 0 ? "REMAINING" : "OVERDUE")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(currentTaskTimeRemaining > 0 ? zinc500 : .orange)
                                .tracking(2)

                            Text(formatTime(abs(currentTaskTimeRemaining)))
                                .font(.system(size: 18, weight: .bold))
                                .foregroundStyle(currentTaskTimeRemaining > 0 ? .white : .orange)
                        }
                    }

                    Spacer()

                    // Complete button
                    Button {
                        completeCurrentTask()
                    } label: {
                        Text("Complete")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 24)
                            .frame(height: 48)
                            .background(primary)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .shadow(color: primary.opacity(0.6), radius: 10)
                    }
                }
            }
            .padding(20)
        }
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white.opacity(0.02))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
    }

    private var noTaskCard: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(primary.opacity(0.15))
                    .frame(width: 64, height: 64)

                Image(systemName: totalTasks == completedTasks && totalTasks > 0 ? "checkmark.circle.fill" : "calendar.badge.plus")
                    .font(.system(size: 28))
                    .foregroundStyle(primary)
            }

            VStack(spacing: 4) {
                Text(totalTasks == completedTasks && totalTasks > 0 ? "All Done!" : "No Current Task")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(.white)

                Text(totalTasks == completedTasks && totalTasks > 0
                     ? "You've completed all your tasks for today"
                     : "Add tasks in the Schedule tab")
                    .font(.system(size: 14))
                    .foregroundStyle(zinc400)
            }

            if totalTasks == 0 {
                Button {
                    selectedTab = 2 // Go to Schedule tab
                } label: {
                    Text("Add Task")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(primary)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 10)
                        .background(primary.opacity(0.15))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding(32)
        .background(liquidGlassBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }

    private func completeCurrentTask() {
        guard let task = currentTask else { return }

        // For simple check tasks, mark as completed directly
        if task.verificationType == .check {
            task.status = .completed
            task.completedAt = Date()
            task.verificationStatus = .verified
            try? modelContext.save()
        } else {
            // For other verification types, go to schedule tab to complete verification
            selectedTab = 2
        }
    }

    // MARK: - Blocked Apps Section

    private var blockedAppsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header
            HStack {
                Text("BLOCKED APPLICATIONS")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(.white.opacity(0.8))
                    .tracking(2)

                Spacer()

                Button {
                    // Edit list action
                } label: {
                    Text("EDIT LIST")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(primary)
                }
            }
            .padding(.horizontal, 24)

            // Apps horizontal scroll
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    // Blocked apps
                    blockedAppIcon(icon: "camera.fill", name: "Instagram", isBlocked: true)
                    blockedAppIcon(icon: "play.rectangle.fill", name: "TikTok", isBlocked: true)
                    blockedAppIcon(icon: "message.fill", name: "Twitter", isBlocked: true)
                    blockedAppIcon(icon: "gamecontroller.fill", name: "Arcade", isBlocked: true)
                    unlockedAppIcon()
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 16)
            }
        }
    }

    private func blockedAppIcon(icon: String, name: String, isBlocked: Bool) -> some View {
        VStack(spacing: 8) {
            ZStack {
                RoundedRectangle(cornerRadius: 16)
                    .fill(zinc800.opacity(0.5))
                    .frame(width: 56, height: 56)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.white.opacity(0.08), lineWidth: 1)
                    )

                Image(systemName: icon)
                    .font(.system(size: 26))
                    .foregroundStyle(.white)
            }

            Text(name)
                .font(.system(size: 10, weight: .medium))
                .foregroundStyle(zinc500)
        }
        .opacity(0.4)
    }

    private func unlockedAppIcon() -> some View {
        VStack(spacing: 8) {
            ZStack {
                RoundedRectangle(cornerRadius: 16)
                    .fill(primary.opacity(0.15))
                    .frame(width: 56, height: 56)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(primary.opacity(0.3), lineWidth: 1)
                    )
                    .shadow(color: primary.opacity(0.5), radius: 10)

                Image(systemName: "lock.open.fill")
                    .font(.system(size: 26))
                    .foregroundStyle(primary)
            }

            Text("Unlocked")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(primary)
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
                                colors: [primary, Color(hex: "#072b4d")],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 40, height: 40)
                        .overlay(
                            Circle()
                                .stroke(backgroundDark, lineWidth: 2)
                        )
                }

                // +12 indicator
                Circle()
                    .fill(zinc800)
                    .frame(width: 40, height: 40)
                    .overlay(
                        Text("+12")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(zinc400)
                    )
                    .overlay(
                        Circle()
                            .stroke(backgroundDark, lineWidth: 2)
                    )
            }

            Spacer()

            // Text
            VStack(alignment: .trailing, spacing: 2) {
                Text("In Deep Focus")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(.white)

                Text("Community Active")
                    .font(.system(size: 10))
                    .foregroundStyle(zinc500)
            }
        }
        .padding(16)
        .background(liquidGlassBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
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

    // MARK: - Helper Methods

    private func formatTime(_ seconds: TimeInterval) -> String {
        let totalSeconds = Int(abs(seconds))
        let hours = totalSeconds / 3600
        let minutes = (totalSeconds % 3600) / 60
        let secs = totalSeconds % 60

        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, secs)
        } else {
            return String(format: "%d:%02d", minutes, secs)
        }
    }

    private func startTimer() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
            updateTimeRemaining()
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
        .environment(ScheduleService(openAIService: OpenAIService(), photoStorageService: PhotoStorageService()))
        .modelContainer(for: [ScheduledTask.self])
        .preferredColorScheme(.dark)
}
