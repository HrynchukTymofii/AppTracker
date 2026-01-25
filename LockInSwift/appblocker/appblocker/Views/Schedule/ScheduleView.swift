import SwiftUI
import SwiftData

// MARK: - Schedule View

struct ScheduleView: View {
    @Environment(ThemeService.self) private var theme
    @Environment(ScheduleService.self) private var scheduleService
    @Environment(TaskParserService.self) private var taskParserService
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.modelContext) private var modelContext

    @State private var selectedDate = Date()
    @State private var showVoiceInput = false
    @State private var showTextInput = false
    @State private var showConflictResolution = false
    @State private var pendingParsingResponse: TaskParsingResponse?
    @State private var isLoading = false
    @State private var errorMessage: String?

    // Edit and delete
    @State private var taskToEdit: ScheduledTask?
    @State private var taskToDelete: ScheduledTask?
    @State private var showDeleteConfirmation = false

    // Verification sheets
    @State private var taskToVerify: ScheduledTask?
    @State private var showPhotoVerification = false
    @State private var showExerciseVerification = false
    @State private var cameraService = CameraService()

    // Query for tasks on selected date
    @Query private var allTasks: [ScheduledTask]

    private var tasksForSelectedDate: [ScheduledTask] {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: selectedDate)
        guard let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay) else {
            return []
        }

        return allTasks.filter { task in
            task.scheduledDate >= startOfDay && task.scheduledDate < endOfDay
        }.sorted { $0.startTime < $1.startTime }
    }

    private var isDark: Bool { colorScheme == .dark }

    // Colors matching HomeView
    private let backgroundDark = Color(hex: "#050505")
    private let zinc400 = Color(hex: "#a1a1aa")
    private let zinc500 = Color(hex: "#71717a")
    private let zinc800 = Color(hex: "#27272a")

    var body: some View {
        ZStack {
            // Background - matching HomeView
            backgroundDark.ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                scheduleHeader

                // Week selector
                WeekDaySelector(selectedDate: $selectedDate)
                    .padding(.top, 16)

                // Timeline
                ScrollView {
                    if isLoading {
                        loadingView
                    } else {
                        timelineView
                            .padding(.top, 24)
                    }
                }
            }

            // Floating buttons
            VStack {
                Spacer()
                floatingActionButtons
                    .padding(.bottom, 100) // Above nav bar
            }

            // Error toast
            if let error = errorMessage {
                VStack {
                    Spacer()
                    errorToast(error)
                        .padding(.bottom, 180)
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
                .animation(.spring(), value: errorMessage)
            }
        }
        .sheet(isPresented: $showVoiceInput) {
            VoiceInputView(
                selectedDate: selectedDate,
                existingTasks: tasksForSelectedDate
            ) { response in
                handleParsingResponse(response)
            }
        }
        .sheet(isPresented: $showTextInput) {
            EnhancedTextInputView(
                selectedDate: selectedDate,
                existingTasks: tasksForSelectedDate
            ) { response in
                handleParsingResponse(response)
            }
        }
        .sheet(isPresented: $showConflictResolution) {
            if let response = pendingParsingResponse,
               let conflictDetails = response.conflictDetails,
               let resolutions = response.suggestedResolutions {
                ConflictResolutionView(
                    conflictDetails: conflictDetails,
                    suggestedResolutions: resolutions
                ) { selectedResolution in
                    resolveConflict(with: selectedResolution)
                }
            }
        }
        .sheet(item: $taskToEdit) { task in
            TaskEditView(task: task) {
                taskToEdit = nil
            }
            .presentationDetents([.large])
            .presentationDragIndicator(.visible)
        }
        .fullScreenCover(isPresented: $showPhotoVerification) {
            if let task = taskToVerify {
                PhotoTaskView(cameraService: cameraService) { reward in
                    completeTask(task)
                    showPhotoVerification = false
                    taskToVerify = nil
                }
            }
        }
        .fullScreenCover(isPresented: $showExerciseVerification) {
            if let task = taskToVerify,
               let exerciseType = mapExerciseType(task.exerciseType) {
                ExerciseExecutionView(
                    exerciseType: exerciseType,
                    target: task.targetReps ?? 10,
                    reward: 10
                ) { _ in
                    completeTask(task)
                    showExerciseVerification = false
                    taskToVerify = nil
                }
            }
        }
        .alert("Delete Task", isPresented: $showDeleteConfirmation, presenting: taskToDelete) { task in
            Button("Cancel", role: .cancel) {
                taskToDelete = nil
            }
            Button("Delete", role: .destructive) {
                deleteTask(task)
            }
        } message: { task in
            Text("Are you sure you want to delete \"\(task.title)\"?")
        }
        .onAppear {
            scheduleService.setModelContext(modelContext)
        }
    }

    // MARK: - Header

    private var scheduleHeader: some View {
        HStack {
            Text("schedule.title".localized)
                .font(.system(size: DesignTokens.fontSize2xl, weight: .bold))
                .foregroundStyle(.white)

            Spacer()

            Button {
                // More options
            } label: {
                ZStack {
                    Circle()
                        .fill(Color.white.opacity(0.03))
                        .frame(width: 40, height: 40)

                    Circle()
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
                        .frame(width: 40, height: 40)

                    Image(systemName: "ellipsis")
                        .font(.system(size: 18))
                        .foregroundStyle(.white)
                }
            }
        }
        .padding(.horizontal, DesignTokens.paddingPage)
        .padding(.top, 16)
    }

    // MARK: - Loading View

    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .tint(theme.accentColor)

            Text("Processing...")
                .font(.system(size: 14))
                .foregroundStyle(zinc500)
        }
        .frame(maxWidth: .infinity)
        .padding(40)
    }

    // MARK: - Timeline View

    private var timelineView: some View {
        VStack(spacing: 0) {
            ForEach(tasksForSelectedDate) { task in
                ScheduledTaskRow(
                    task: task,
                    isCurrentTask: isCurrentTask(task),
                    onVerificationTap: {
                        handleVerificationTap(for: task)
                    },
                    onCardTap: {
                        taskToEdit = task
                    },
                    onCardLongPress: {
                        taskToDelete = task
                        showDeleteConfirmation = true
                    }
                )
            }

            if tasksForSelectedDate.isEmpty {
                emptyStateView
            }

            // Bottom spacer for navbar and floating buttons
            Spacer()
                .frame(height: 120)
        }
        .padding(.horizontal, DesignTokens.paddingPage)
    }

    private func handleVerificationTap(for task: ScheduledTask) {
        switch task.verificationType {
        case .check:
            // Simple check - mark complete immediately
            task.status = .completed
            task.completedAt = Date()
            task.verificationStatus = .verified
            try? modelContext.save()

        case .photoAfter, .photoBeforeAfter:
            // Open photo verification
            taskToVerify = task
            showPhotoVerification = true

        case .exercise:
            // Open exercise verification
            taskToVerify = task
            showExerciseVerification = true

        case .voice:
            // TODO: Add voice verification view
            // For now, mark as complete
            task.status = .completed
            task.completedAt = Date()
            task.verificationStatus = .verified
            try? modelContext.save()

        case .stepCount:
            // TODO: Add step count verification view
            // For now, mark as complete
            task.status = .completed
            task.completedAt = Date()
            task.verificationStatus = .verified
            try? modelContext.save()
        }
    }

    private func completeTask(_ task: ScheduledTask) {
        task.status = .completed
        task.completedAt = Date()
        task.verificationStatus = .verified
        try? modelContext.save()
    }

    private func mapExerciseType(_ exerciseVerificationType: ExerciseVerificationType?) -> ExerciseType? {
        guard let type = exerciseVerificationType else { return nil }
        switch type {
        case .pushups: return .pushups
        case .squats: return .squats
        case .plank: return .plank
        case .jumpingJacks: return .jumpingJacks
        case .lunges: return .lunges
        case .crunches: return .crunches
        case .shoulderPress: return .shoulderPress
        case .legRaises: return .legRaises
        case .highKnees: return .highKnees
        case .wallSit: return .wallSit
        case .sidePlank: return .sidePlank
        default : return nil
        }
    }

    private func isCurrentTask(_ task: ScheduledTask) -> Bool {
        let now = Date()
        return task.startTime <= now && task.endTime >= now
    }

    // MARK: - Empty State

    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Image(systemName: "calendar.badge.plus")
                .font(.system(size: 48))
                .foregroundStyle(zinc500)

            Text("schedule.no_tasks".localized)
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(zinc400)

            Text("schedule.add_task_hint".localized)
                .font(.system(size: 14))
                .foregroundStyle(zinc500)
                .multilineTextAlignment(.center)
        }
        .padding(40)
        .frame(maxWidth: .infinity)
        .background(Color.white.opacity(0.03))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
        .padding(.top, 40)
    }

    // MARK: - Error Toast

    private func errorToast(_ message: String) -> some View {
        HStack {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(.orange)

            Text(message)
                .font(.system(size: 14))
                .foregroundStyle(.white)

            Spacer()

            Button {
                withAnimation {
                    errorMessage = nil
                }
            } label: {
                Image(systemName: "xmark")
                    .foregroundStyle(zinc400)
            }
        }
        .padding()
        .background(zinc800)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
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
                    )
                    .overlay(
                        Circle()
                            .stroke(theme.accentColor.opacity(0.3), lineWidth: 1)
                    )
                    .shadow(color: theme.accentColor.opacity(0.5), radius: 10)
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
                            .fill(zinc800.opacity(0.5))
                    )
                    .overlay(
                        Circle()
                            .stroke(Color.white.opacity(0.08), lineWidth: 1)
                    )
            }
        }
    }

    // MARK: - Helper Methods

    private func handleParsingResponse(_ response: TaskParsingResponse) {
        #if DEBUG
        print("[ScheduleView] handleParsingResponse called with \(response.tasks.count) tasks, hasConflicts: \(response.hasConflicts)")
        for (i, t) in response.tasks.enumerated() {
            print("  Task \(i): \(t.title) at \(t.scheduledTime ?? "nil")")
        }
        #endif

        if response.hasConflicts {
            pendingParsingResponse = response
            showConflictResolution = true
        } else {
            // Create all tasks - handle each individually so one failure doesn't stop the others
            Task {
                var createdCount = 0
                var failedCount = 0
                var lastError: Error?

                for taskResult in response.tasks {
                    do {
                        let created = try scheduleService.createTask(from: taskResult, forDate: selectedDate)
                        createdCount += 1
                        #if DEBUG
                        print("[ScheduleView] Created task: \(created.title) at \(created.startTime)")
                        #endif
                    } catch {
                        failedCount += 1
                        lastError = error
                        print("[ScheduleView] Failed to create task '\(taskResult.title)': \(error.localizedDescription)")
                    }
                }

                #if DEBUG
                print("[ScheduleView] Task creation complete: \(createdCount) created, \(failedCount) failed")
                #endif

                // Show error only if all tasks failed
                if createdCount == 0 && failedCount > 0 {
                    await MainActor.run {
                        errorMessage = lastError?.localizedDescription ?? "Failed to create tasks"
                    }
                } else if failedCount > 0 {
                    // Some tasks were created, some failed
                    await MainActor.run {
                        errorMessage = "Created \(createdCount) task(s), \(failedCount) failed"
                    }
                }
            }
        }
    }

    private func resolveConflict(with resolution: String) {
        guard let response = pendingParsingResponse else { return }

        isLoading = true

        Task {
            do {
                let existingTasks = tasksForSelectedDate.map { TaskSummary(from: $0) }
                let context = ScheduleContext(date: selectedDate, existingTasks: existingTasks)

                // Build conversation history from original response
                let history: [(role: String, content: String)] = [
                    ("assistant", "I found conflicts: \(response.conflictDetails ?? "Unknown")")
                ]

                let resolvedResponse = try await taskParserService.resolveConflict(
                    conversationHistory: history,
                    userChoice: resolution,
                    context: context
                )

                // Create resolved tasks - handle each individually
                var createdCount = 0
                var failedCount = 0

                for taskResult in resolvedResponse.tasks {
                    do {
                        _ = try scheduleService.createTask(from: taskResult, forDate: selectedDate)
                        createdCount += 1
                    } catch {
                        failedCount += 1
                        print("[ScheduleView] Failed to create resolved task '\(taskResult.title)': \(error.localizedDescription)")
                    }
                }

                await MainActor.run {
                    isLoading = false
                    pendingParsingResponse = nil

                    if createdCount == 0 && failedCount > 0 {
                        errorMessage = "Failed to create resolved tasks"
                    } else if failedCount > 0 {
                        errorMessage = "Created \(createdCount) task(s), \(failedCount) failed"
                    }
                }
            } catch {
                await MainActor.run {
                    isLoading = false
                    errorMessage = error.localizedDescription
                }
            }
        }
    }

    private func deleteTask(_ task: ScheduledTask) {
        Task {
            do {
                try scheduleService.deleteTask(task.id)
                taskToDelete = nil
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                }
            }
        }
    }
}

// MARK: - Scheduled Task Row

struct ScheduledTaskRow: View {
    @Environment(ThemeService.self) private var theme
    @Environment(\.colorScheme) private var colorScheme

    let task: ScheduledTask
    let isCurrentTask: Bool
    var onVerificationTap: (() -> Void)?
    var onCardTap: (() -> Void)?
    var onCardLongPress: (() -> Void)?

    private var isDark: Bool { colorScheme == .dark }

    // Colors matching HomeView
    private let zinc400 = Color(hex: "#a1a1aa")
    private let zinc500 = Color(hex: "#71717a")

    private var timeFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        return formatter
    }

    private var isCompleted: Bool {
        task.status == .completed
    }

    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            // Time column
            VStack(alignment: .trailing, spacing: 4) {
                Text(timeFormatter.string(from: task.startTime))
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(isCurrentTask ? theme.accentColor : zinc500)

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
                    .fill(isCompleted ? .green : (isCurrentTask ? theme.accentColor : theme.accentColor.opacity(0.4)))
                    .frame(width: 12, height: 12)
                    .shadow(color: isCurrentTask ? theme.accentColor.opacity(0.5) : .clear, radius: 8)

                Rectangle()
                    .fill(theme.accentColor.opacity(0.2))
                    .frame(width: 2)
            }
            .frame(width: 20)

            // Task card
            ZStack(alignment: .topTrailing) {
                // Card content - tappable for edit
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text(task.title)
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(isCompleted ? zinc400 : .white)
                            .strikethrough(isCompleted, color: zinc500)

                        Spacer()
                            .frame(width: 44) // Space for verification button
                    }

                    if let description = task.taskDescription {
                        Text(description)
                            .font(.system(size: 14))
                            .foregroundStyle(zinc400)
                            .lineLimit(2)
                    }

                    HStack(spacing: 12) {
                        // Time range
                        HStack(spacing: 4) {
                            Image(systemName: "clock")
                                .font(.system(size: 12))

                            Text("\(timeFormatter.string(from: task.startTime)) - \(timeFormatter.string(from: task.endTime))")
                                .font(.system(size: 12))
                        }
                        .foregroundStyle(zinc500)

                        // Status indicator
                        if task.status != ScheduledTaskStatus.pending {
                            HStack(spacing: 4) {
                                Image(systemName: task.status.icon)
                                    .font(.system(size: 10))

                                Text(task.status.displayName)
                                    .font(.system(size: 10, weight: .medium))
                            }
                            .foregroundStyle(statusColor)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(statusColor.opacity(0.15))
                            .clipShape(Capsule())
                        }
                    }

                    // Verification hint
                    if task.verificationType != VerificationType.check && !isCompleted {
                        HStack(spacing: 4) {
                            Image(systemName: task.verificationType.icon)
                                .font(.system(size: 10))

                            Text("Tap icon to verify")
                                .font(.system(size: 10))
                        }
                        .foregroundStyle(theme.accentColor.opacity(0.7))
                    }
                }
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .contentShape(Rectangle())
                .onTapGesture {
                    onCardTap?()
                }
                .onLongPressGesture {
                    onCardLongPress?()
                }

                // Verification button - overlaid on top right
                Button {
                    onVerificationTap?()
                } label: {
                    ZStack {
                        Circle()
                            .fill(isCompleted ? Color.green.opacity(0.2) : theme.accentColor.opacity(0.15))
                            .frame(width: 40, height: 40)

                        Image(systemName: isCompleted ? "checkmark" : task.verificationType.icon)
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(isCompleted ? .green : theme.accentColor)
                    }
                }
                .buttonStyle(.plain)
                .disabled(isCompleted)
                .padding(12)
            }
            .background(Color.white.opacity(isCompleted ? 0.04 : 0.08))
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                HStack {
                    Rectangle()
                        .fill(isCompleted ? .green : (isCurrentTask ? theme.accentColor : theme.accentColor.opacity(0.6)))
                        .frame(width: 3)

                    Spacer()
                }
                .clipShape(RoundedRectangle(cornerRadius: 16))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.white.opacity(0.15), lineWidth: 1)
            )
        }
        .padding(.bottom, 24)
        .opacity(isCompleted ? 0.7 : 1.0)
    }

    private var statusColor: Color {
        switch task.status {
        case ScheduledTaskStatus.pending: return .orange
        case ScheduledTaskStatus.inProgress: return .blue
        case ScheduledTaskStatus.completed: return .green
        case ScheduledTaskStatus.skipped: return .gray
        case ScheduledTaskStatus.failed: return .red
        }
    }
}

// MARK: - Enhanced Text Input View

struct EnhancedTextInputView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(ThemeService.self) private var theme
    @Environment(TaskParserService.self) private var taskParserService
    @Environment(\.colorScheme) private var colorScheme

    let selectedDate: Date
    let existingTasks: [ScheduledTask]
    var onTaskCreated: (TaskParsingResponse) -> Void

    @State private var taskText = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @FocusState private var isTextFieldFocused: Bool

    // Colors matching HomeView
    private let backgroundDark = Color(hex: "#050505")
    private let zinc400 = Color(hex: "#a1a1aa")
    private let zinc500 = Color(hex: "#71717a")

    var body: some View {
        NavigationStack {
            ZStack {
                backgroundDark.ignoresSafeArea()

                VStack(spacing: 24) {
                    // Date indicator
                    HStack {
                        Image(systemName: "calendar")
                            .foregroundStyle(theme.accentColor)

                        Text(selectedDate, format: .dateTime.weekday(.wide).month().day())
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(zinc400)

                        Spacer()
                    }

                    // Text input
                    TextField("Describe your task...", text: $taskText, axis: .vertical)
                        .font(.system(size: 18))
                        .foregroundStyle(.white)
                        .padding(20)
                        .background(Color.white.opacity(0.03))
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(Color.white.opacity(0.08), lineWidth: 1)
                        )
                        .lineLimit(3...6)
                        .focused($isTextFieldFocused)

                    // Tips
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Examples:")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(zinc500)

                        Group {
                            Text("• \"Clean my room at 3pm\" → Before/After photos")
                            Text("• \"Do 20 pushups at 7am\" → Exercise tracking")
                            Text("• \"Walk 5000 steps\" → Step counter")
                            Text("• \"Practice Spanish for 15 minutes\" → Voice check")
                        }
                        .font(.system(size: 12))
                        .foregroundStyle(zinc500)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)

                    if let error = errorMessage {
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundStyle(.orange)

                            Text(error)
                                .font(.system(size: 14))
                                .foregroundStyle(.orange)
                        }
                        .padding()
                        .background(Color.orange.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    // Create button
                    Button {
                        createTask()
                    } label: {
                        HStack {
                            if isLoading {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Text("Create Task")
                            }
                        }
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(theme.accentColor)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .shadow(color: theme.accentColor.opacity(0.4), radius: 15, y: 4)
                    }
                    .disabled(taskText.isEmpty || isLoading)
                    .opacity(taskText.isEmpty || isLoading ? 0.5 : 1.0)

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
            .onAppear {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                    isTextFieldFocused = true
                }
            }
        }
    }

    private func createTask() {
        guard !taskText.isEmpty else { return }

        isLoading = true
        errorMessage = nil

        Task {
            do {
                let taskSummaries = existingTasks.map { TaskSummary(from: $0) }

                #if DEBUG
                let dateFormatter = DateFormatter()
                dateFormatter.dateFormat = "yyyy-MM-dd"
                print("[EnhancedTextInput] Creating task:")
                print("  - selectedDate: \(dateFormatter.string(from: selectedDate))")
                print("  - existingTasks count: \(taskSummaries.count)")
                for task in taskSummaries {
                    print("    - \(task.title): \(task.startTime)")
                }
                print("  - userInput: \(taskText)")
                #endif

                let response = try await taskParserService.parseTaskWithContext(
                    taskText,
                    forDate: selectedDate,
                    existingTasks: taskSummaries
                )

                #if DEBUG
                print("[EnhancedTextInput] AI returned \(response.tasks.count) tasks:")
                for task in response.tasks {
                    print("  - \(task.title): scheduledTime=\(task.scheduledTime ?? "nil")")
                }
                #endif

                await MainActor.run {
                    isLoading = false
                    onTaskCreated(response)
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isLoading = false
                    errorMessage = error.localizedDescription
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
        .environment(ScheduleService(openAIService: OpenAIService(), photoStorageService: PhotoStorageService()))
        .environment(TaskParserService())
        .modelContainer(for: [ScheduledTask.self])
}
