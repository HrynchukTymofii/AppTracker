import SwiftUI

// MARK: - Schedule Task Model

struct ScheduleTask: Identifiable {
    let id = UUID()
    var title: String
    var description: String?
    var startTime: Date
    var endTime: Date
    var isCompleted: Bool = false
    var accentColorOverride: Color? = nil
    var collaborators: [String] = []
}

// MARK: - Schedule View

struct ScheduleView: View {
    @Environment(ThemeService.self) private var theme
    @Environment(\.colorScheme) private var colorScheme

    @State private var selectedDate = Date()
    @State private var showVoiceInput = false
    @State private var showTextInput = false
    @State private var tasks: [ScheduleTask] = []

    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        ZStack {
            // Background
            theme.backgroundColor(for: colorScheme).ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                scheduleHeader

                // Week selector
                WeekDaySelector(selectedDate: $selectedDate)
                    .padding(.top, 16)

                // Timeline
                ScrollView {
                    timelineView
                        .padding(.top, 24)
                }
            }

            // Floating buttons
            VStack {
                Spacer()
                floatingActionButtons
                    .padding(.bottom, 100) // Above nav bar
            }
        }
        .sheet(isPresented: $showVoiceInput) {
            VoiceInputView { result in
                // Handle task creation from voice
                createTaskFromParseResult(result)
            }
        }
        .sheet(isPresented: $showTextInput) {
            TextInputView { text in
                // Handle task creation from text
                // TODO: Parse text and create task
            }
        }
        .onAppear {
            loadSampleTasks()
        }
    }

    // MARK: - Header

    private var scheduleHeader: some View {
        HStack {
            Text("schedule.title".localized)
                .font(.system(size: DesignTokens.fontSize2xl, weight: .bold))
                .foregroundStyle(theme.textPrimary(for: colorScheme))

            Spacer()

            Button {
                // More options
            } label: {
                Image(systemName: "ellipsis")
                    .font(.system(size: 20, weight: .medium))
                    .foregroundStyle(theme.textSecondary(for: colorScheme))
                    .frame(width: 40, height: 40)
                    .liquidGlass(cornerRadius: 20)
            }
        }
        .padding(.horizontal, DesignTokens.paddingPage)
        .padding(.top, 16)
    }

    // MARK: - Timeline View

    private var timelineView: some View {
        VStack(spacing: 0) {
            ForEach(sortedTasks) { task in
                TimelineTaskRow(task: task, isCurrentTask: isCurrentTask(task))
            }

            if tasks.isEmpty {
                emptyStateView
            }
        }
        .padding(.horizontal, DesignTokens.paddingPage)
    }

    private var sortedTasks: [ScheduleTask] {
        tasks.sorted { $0.startTime < $1.startTime }
    }

    private func isCurrentTask(_ task: ScheduleTask) -> Bool {
        let now = Date()
        return task.startTime <= now && task.endTime >= now
    }

    // MARK: - Empty State

    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Image(systemName: "calendar.badge.plus")
                .font(.system(size: 48))
                .foregroundStyle(theme.textMuted(for: colorScheme))

            Text("schedule.no_tasks".localized)
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(theme.textSecondary(for: colorScheme))

            Text("schedule.add_task_hint".localized)
                .font(.system(size: 14))
                .foregroundStyle(theme.textMuted(for: colorScheme))
                .multilineTextAlignment(.center)
        }
        .padding(40)
        .frame(maxWidth: .infinity)
        .liquidGlass()
        .padding(.top, 40)
    }

    // MARK: - Floating Action Buttons

    private var floatingActionButtons: some View {
        HStack(spacing: 16) {
            // Mic button
            Button {
                showVoiceInput = true
            } label: {
                Image(systemName: "mic.fill")
                    .font(.system(size: 24))
                    .foregroundStyle(.white)
                    .frame(width: 56, height: 56)
                    .background(
                        Circle()
                            .fill(theme.accentColor.opacity(0.15))
                            .background(.ultraThinMaterial)
                            .clipShape(Circle())
                    )
                    .overlay(
                        Circle()
                            .stroke(theme.accentColor.opacity(0.4), lineWidth: 1)
                    )
                    .shadow(color: theme.accentColor.opacity(isDark ? 0.4 : 0.25), radius: 20)
            }

            // Keyboard button
            Button {
                showTextInput = true
            } label: {
                Image(systemName: "keyboard")
                    .font(.system(size: 24))
                    .foregroundStyle(.white)
                    .frame(width: 56, height: 56)
                    .background(
                        Circle()
                            .fill(theme.accentColor.opacity(0.15))
                            .background(.ultraThinMaterial)
                            .clipShape(Circle())
                    )
                    .overlay(
                        Circle()
                            .stroke(theme.accentColor.opacity(0.4), lineWidth: 1)
                    )
                    .shadow(color: theme.accentColor.opacity(isDark ? 0.4 : 0.25), radius: 20)
            }
        }
    }

    // MARK: - Helper Methods

    private func loadSampleTasks() {
        let calendar = Calendar.current
        let now = Date()

        // Sample tasks for demo
        tasks = [
            ScheduleTask(
                title: "Morning Exercise",
                description: "Complete 20 pushups",
                startTime: calendar.date(bySettingHour: 7, minute: 0, second: 0, of: now)!,
                endTime: calendar.date(bySettingHour: 7, minute: 30, second: 0, of: now)!,
                isCompleted: true
            ),
            ScheduleTask(
                title: "Deep Work Session",
                description: "Focus on coding project",
                startTime: calendar.date(bySettingHour: 9, minute: 0, second: 0, of: now)!,
                endTime: calendar.date(bySettingHour: 11, minute: 0, second: 0, of: now)!
            ),
            ScheduleTask(
                title: "Team Standup",
                description: "Daily sync meeting",
                startTime: calendar.date(bySettingHour: 11, minute: 30, second: 0, of: now)!,
                endTime: calendar.date(bySettingHour: 12, minute: 0, second: 0, of: now)!,
                collaborators: ["Alex", "Jordan", "Sam"]
            ),
            ScheduleTask(
                title: "Lunch Break",
                startTime: calendar.date(bySettingHour: 12, minute: 0, second: 0, of: now)!,
                endTime: calendar.date(bySettingHour: 13, minute: 0, second: 0, of: now)!
            ),
            ScheduleTask(
                title: "Plank Challenge",
                description: "Hold for 60 seconds",
                startTime: calendar.date(bySettingHour: 15, minute: 0, second: 0, of: now)!,
                endTime: calendar.date(bySettingHour: 15, minute: 15, second: 0, of: now)!
            )
        ]
    }

    private func createTaskFromParseResult(_ result: TaskParseResult) {
        let calendar = Calendar.current
        let now = Date()

        var startTime = now
        var endTime = now.addingTimeInterval(30 * 60) // Default 30 minutes

        if let scheduledTimeString = result.scheduledTime,
           let parsedDate = ISO8601DateFormatter().date(from: scheduledTimeString) {
            startTime = parsedDate
        }

        if let duration = result.duration {
            endTime = startTime.addingTimeInterval(Double(duration) * 60)
        }

        let task = ScheduleTask(
            title: result.title,
            description: result.description,
            startTime: startTime,
            endTime: endTime
        )

        tasks.append(task)
    }
}

// MARK: - Timeline Task Row

struct TimelineTaskRow: View {
    @Environment(ThemeService.self) private var theme
    @Environment(\.colorScheme) private var colorScheme

    let task: ScheduleTask
    let isCurrentTask: Bool

    private var isDark: Bool { colorScheme == .dark }

    private var timeFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        return formatter
    }

    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            // Time column
            VStack(alignment: .trailing, spacing: 4) {
                Text(timeFormatter.string(from: task.startTime))
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(isCurrentTask ? theme.accentColor : theme.textMuted(for: colorScheme))

                if isCurrentTask {
                    Text("NOW")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(theme.accentColor)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(theme.accentColor.opacity(0.2))
                        .clipShape(Capsule())
                }
            }
            .frame(width: 60, alignment: .trailing)

            // Timeline indicator
            VStack(spacing: 0) {
                Circle()
                    .fill(isCurrentTask ? theme.accentColor : theme.accentColor.opacity(0.4))
                    .frame(width: 12, height: 12)
                    .shadow(color: isCurrentTask ? theme.accentColor.opacity(0.5) : .clear, radius: 8)

                Rectangle()
                    .fill(theme.accentColor.opacity(0.2))
                    .frame(width: 2)
            }
            .frame(width: 20)

            // Task card
            VStack(alignment: .leading, spacing: 8) {
                Text(task.title)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(theme.textPrimary(for: colorScheme))

                if let description = task.description {
                    Text(description)
                        .font(.system(size: 14))
                        .foregroundStyle(theme.textSecondary(for: colorScheme))
                }

                HStack(spacing: 8) {
                    Image(systemName: "clock")
                        .font(.system(size: 12))

                    Text("\(timeFormatter.string(from: task.startTime)) - \(timeFormatter.string(from: task.endTime))")
                        .font(.system(size: 12))
                }
                .foregroundStyle(theme.textMuted(for: colorScheme))

                // Collaborators
                if !task.collaborators.isEmpty {
                    HStack(spacing: -8) {
                        ForEach(task.collaborators.prefix(3), id: \.self) { name in
                            Circle()
                                .fill(theme.accentColor.opacity(0.3))
                                .frame(width: 24, height: 24)
                                .overlay(
                                    Text(String(name.prefix(1)))
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundStyle(.white)
                                )
                                .overlay(
                                    Circle()
                                        .stroke(theme.backgroundColor(for: colorScheme), lineWidth: 2)
                                )
                        }

                        if task.collaborators.count > 3 {
                            Text("+\(task.collaborators.count - 3)")
                                .font(.system(size: 10, weight: .medium))
                                .foregroundStyle(theme.textMuted(for: colorScheme))
                                .padding(.leading, 12)
                        }
                    }
                }
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(isDark ? Color.white.opacity(0.03) : Color.white.opacity(0.6))
                    .background(.ultraThinMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
            )
            .overlay(
                HStack {
                    Rectangle()
                        .fill(isCurrentTask ? theme.accentColor : theme.accentColor.opacity(0.4))
                        .frame(width: 2)

                    Spacer()
                }
                .clipShape(RoundedRectangle(cornerRadius: 16))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(isDark ? Color.white.opacity(0.08) : Color.white.opacity(0.4), lineWidth: 1)
            )
            .opacity(task.isCompleted ? 0.6 : 1.0)
        }
        .padding(.bottom, 24)
    }
}

// MARK: - Text Input View (Simple placeholder)

struct TextInputView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(ThemeService.self) private var theme
    @Environment(\.colorScheme) private var colorScheme

    @State private var taskText = ""
    var onTaskCreated: (String) -> Void

    var body: some View {
        NavigationStack {
            ZStack {
                theme.backgroundColor(for: colorScheme).ignoresSafeArea()

                VStack(spacing: 24) {
                    TextField("Describe your task...", text: $taskText, axis: .vertical)
                        .font(.system(size: 18))
                        .foregroundStyle(theme.textPrimary(for: colorScheme))
                        .padding(20)
                        .liquidGlass()
                        .lineLimit(3...6)

                    Button {
                        if !taskText.isEmpty {
                            onTaskCreated(taskText)
                            dismiss()
                        }
                    } label: {
                        Text("Create Task")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(theme.accentColor)
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                            .shadow(color: theme.accentColor.opacity(0.4), radius: 15, y: 4)
                    }
                    .disabled(taskText.isEmpty)
                    .opacity(taskText.isEmpty ? 0.5 : 1.0)

                    Spacer()
                }
                .padding(DesignTokens.paddingPage)
            }
            .navigationTitle("Add Task")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Localization Extension

extension String {
    // Fallback for schedule-specific strings if not in localization file
    var localizedSchedule: String {
        NSLocalizedString(self, comment: "")
    }
}

// MARK: - Preview

#Preview {
    ScheduleView()
        .environment(ThemeService())
}
