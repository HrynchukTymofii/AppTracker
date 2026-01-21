import SwiftUI

struct LockInView: View {
    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService
    @Environment(TimeBankService.self) private var timeBank

    @State private var tasks: [ExerciseTask] = []
    @State private var showTaskSheet = false
    @State private var selectedTaskType: ExerciseType?
    @State private var activeTask: ExerciseTask?

    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Time Bank Header
                    timeBankHeader

                    // Available Tasks
                    availableTasksSection

                    // Active/In-Progress Task
                    if let task = activeTask {
                        activeTaskCard(task)
                    }

                    // Task History
                    taskHistorySection
                }
                .padding(.vertical, 16)
                .padding(.bottom, 100)
            }
            .background(Color.appBackground)
            .navigationTitle("LockIn")
            .sheet(isPresented: $showTaskSheet) {
                if let taskType = selectedTaskType {
                    TaskExecutionView(taskType: taskType) { completedTask in
                        timeBank.earnFromExercise(completedTask)
                        activeTask = nil
                    }
                }
            }
        }
    }

    // MARK: - Time Bank Header

    private var timeBankHeader: some View {
        VStack(spacing: 16) {
            // Balance Display
            VStack(spacing: 8) {
                Text("TIME BANK")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.secondary)
                    .tracking(1)

                Text(timeBank.formattedBalance)
                    .font(.system(size: 48, weight: .bold, design: .rounded))
                    .foregroundStyle(themeService.accentColor)

                Text("available to spend")
                    .font(.system(size: 14))
                    .foregroundStyle(.secondary)
            }

            // Progress Bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(Color.secondary.opacity(0.1))

                    RoundedRectangle(cornerRadius: 8)
                        .fill(themeService.primaryGradient)
                        .frame(width: min(geo.size.width * CGFloat(timeBank.availableMinutes) / 120, geo.size.width))
                }
            }
            .frame(height: 12)
            .padding(.horizontal, 40)

            // Today's Stats
            HStack(spacing: 24) {
                VStack(spacing: 4) {
                    Text("+\(timeBank.todayEarned)m")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.green)
                    Text("earned")
                        .font(.system(size: 12))
                        .foregroundStyle(.secondary)
                }

                Rectangle()
                    .fill(Color.secondary.opacity(0.3))
                    .frame(width: 1, height: 30)

                VStack(spacing: 4) {
                    Text("-\(timeBank.todaySpent)m")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.red)
                    Text("spent")
                        .font(.system(size: 12))
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(24)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(isDark ? Color.white.opacity(0.05) : .white)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 24)
                .stroke(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.05), lineWidth: 1)
        )
        .padding(.horizontal, 20)
    }

    // MARK: - Available Tasks

    private var availableTasksSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("EARN TIME")
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(.secondary)
                .tracking(0.5)
                .padding(.horizontal, 20)

            VStack(spacing: 12) {
                // Pushups Task
                TaskCard(
                    type: .pushups,
                    target: 20,
                    reward: 5,
                    onStart: {
                        selectedTaskType = .pushups
                        showTaskSheet = true
                    }
                )

                // Plank Task
                TaskCard(
                    type: .plank,
                    target: 60,
                    reward: 10,
                    onStart: {
                        selectedTaskType = .plank
                        showTaskSheet = true
                    }
                )

                // Squats Task
                TaskCard(
                    type: .squats,
                    target: 30,
                    reward: 7,
                    onStart: {
                        selectedTaskType = .squats
                        showTaskSheet = true
                    }
                )

                // Photo Task
                TaskCard(
                    type: .photoVerification,
                    target: 1,
                    reward: 15,
                    description: "Complete a photo verification task",
                    onStart: {
                        selectedTaskType = .photoVerification
                        showTaskSheet = true
                    }
                )
            }
            .padding(.horizontal, 20)
        }
    }

    // MARK: - Active Task Card

    private func activeTaskCard(_ task: ExerciseTask) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("IN PROGRESS")
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(.orange)
                .tracking(0.5)
                .padding(.horizontal, 20)

            HStack(spacing: 16) {
                // Icon
                RoundedRectangle(cornerRadius: 14)
                    .fill(Color.orange.opacity(0.2))
                    .frame(width: 52, height: 52)
                    .overlay {
                        Image(systemName: task.type.icon)
                            .font(.system(size: 24))
                            .foregroundStyle(.orange)
                    }

                VStack(alignment: .leading, spacing: 4) {
                    Text(task.displayTitle)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(isDark ? .white : .black)

                    ProgressView(value: task.progressPercentage)
                        .tint(.orange)
                }

                Text("+\(task.reward)m")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(.orange)
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color.orange.opacity(0.1))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.orange.opacity(0.3), lineWidth: 1)
            )
            .padding(.horizontal, 20)
        }
    }

    // MARK: - Task History

    private var taskHistorySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("RECENT ACTIVITY")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.secondary)
                    .tracking(0.5)

                Spacer()

                Button("See All") {
                    // Navigate to full history
                }
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(themeService.accentColor)
            }
            .padding(.horizontal, 20)

            if timeBank.transactions.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "clock.arrow.circlepath")
                        .font(.system(size: 40))
                        .foregroundStyle(.secondary)

                    Text("No activity yet")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(.secondary)

                    Text("Complete tasks to earn time")
                        .font(.system(size: 14))
                        .foregroundStyle(.secondary.opacity(0.7))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 40)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(isDark ? Color.white.opacity(0.05) : Color(white: 0.97))
                )
                .padding(.horizontal, 20)
            } else {
                VStack(spacing: 0) {
                    ForEach(timeBank.transactions.prefix(5)) { transaction in
                        TransactionRow(transaction: transaction)
                    }
                }
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(isDark ? Color.white.opacity(0.05) : .white)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.05), lineWidth: 1)
                )
                .padding(.horizontal, 20)
            }
        }
    }
}

// MARK: - Task Card

struct TaskCard: View {
    let type: ExerciseType
    let target: Int
    let reward: Int
    var description: String?
    let onStart: () -> Void

    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService

    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        HStack(spacing: 16) {
            // Icon
            RoundedRectangle(cornerRadius: 14)
                .fill(themeService.accentColor.opacity(0.15))
                .frame(width: 52, height: 52)
                .overlay {
                    Image(systemName: type.icon)
                        .font(.system(size: 24))
                        .foregroundStyle(themeService.accentColor)
                }

            VStack(alignment: .leading, spacing: 4) {
                Text(taskTitle)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(isDark ? .white : .black)

                if let desc = description {
                    Text(desc)
                        .font(.system(size: 13))
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 8) {
                Text("+\(reward) min")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(themeService.accentColor)

                Button {
                    onStart()
                } label: {
                    Text("Start")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(themeService.primaryGradient)
                        .clipShape(Capsule())
                }
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(isDark ? Color.white.opacity(0.05) : .white)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.05), lineWidth: 1)
        )
    }

    private var taskTitle: String {
        switch type {
        case .pushups, .squats:
            return "\(target) \(type.displayName)"
        case .plank:
            return "\(target)s \(type.displayName)"
        case .photoVerification:
            return "Photo Task"
        case .custom:
            return type.displayName
        }
    }
}

// MARK: - Transaction Row

struct TransactionRow: View {
    let transaction: TimeTransaction

    @Environment(\.colorScheme) private var colorScheme
    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        HStack(spacing: 12) {
            // Icon
            Circle()
                .fill(transaction.isEarned ? Color.green.opacity(0.15) : Color.red.opacity(0.15))
                .frame(width: 40, height: 40)
                .overlay {
                    Image(systemName: transaction.source.icon)
                        .font(.system(size: 16))
                        .foregroundStyle(transaction.isEarned ? .green : .red)
                }

            VStack(alignment: .leading, spacing: 2) {
                Text(transaction.source.displayName)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(isDark ? .white : .black)

                Text(formatDate(transaction.timestamp))
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Text("\(transaction.isEarned ? "+" : "")\(transaction.amount)m")
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(transaction.isEarned ? .green : .red)
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

// MARK: - Task Execution View (Placeholder)

struct TaskExecutionView: View {
    let taskType: ExerciseType
    let onComplete: (ExerciseTask) -> Void

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()

                Image(systemName: taskType.icon)
                    .font(.system(size: 80))
                    .foregroundStyle(.secondary)

                Text("Exercise Detection")
                    .font(.title)

                Text("Camera-based exercise verification coming soon...")
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)

                Spacer()

                // Simulate completion
                Button {
                    let task = ExerciseTask(type: taskType)
                    task.status = .completed
                    onComplete(task)
                    dismiss()
                } label: {
                    Text("Complete Task (Demo)")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Color.green)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
            .navigationTitle(taskType.displayName)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    LockInView()
        .environment(ThemeService())
        .environment(TimeBankService())
}
