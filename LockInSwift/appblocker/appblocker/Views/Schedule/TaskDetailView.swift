import SwiftUI
import SwiftData

struct TaskDetailView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(ScheduleService.self) private var scheduleService
    @Environment(ThemeService.self) private var themeService

    let task: ScheduledTask

    @State private var showingVerification = false
    @State private var showingDeleteConfirmation = false
    @State private var isDeleting = false

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                headerSection

                // Status Card
                statusCard

                // Time Details
                timeDetailsCard

                // Verification Info
                verificationCard

                // Actions
                actionsSection
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Task Details")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button(role: .destructive) {
                        showingDeleteConfirmation = true
                    } label: {
                        Label("Delete Task", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .sheet(isPresented: $showingVerification) {
            TaskVerificationView(task: task)
        }
        .confirmationDialog(
            "Delete Task",
            isPresented: $showingDeleteConfirmation,
            titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive) {
                deleteTask()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Are you sure you want to delete this task? This action cannot be undone.")
        }
    }

    // MARK: - Header Section

    private var headerSection: some View {
        VStack(spacing: 12) {
            // Icon
            ZStack {
                Circle()
                    .fill(themeService.accentColor.opacity(0.15))
                    .frame(width: 80, height: 80)

                Image(systemName: task.verificationType.icon)
                    .font(.system(size: 32))
                    .foregroundStyle(themeService.accentColor)
            }

            // Title
            Text(task.title)
                .font(.title2)
                .fontWeight(.bold)
                .multilineTextAlignment(.center)

            // Description
            if let description = task.taskDescription {
                Text(description)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
        .padding(.top)
    }

    // MARK: - Status Card

    private var statusCard: some View {
        VStack(spacing: 16) {
            HStack {
                Image(systemName: task.status.icon)
                    .foregroundStyle(statusColor)
                Text(task.status.displayName)
                    .fontWeight(.semibold)
                Spacer()
            }

            if task.verificationStatus != VerificationStatus.notStarted {
                Divider()

                HStack {
                    Text("Verification")
                        .foregroundStyle(.secondary)
                    Spacer()
                    HStack(spacing: 4) {
                        Circle()
                            .fill(verificationStatusColor)
                            .frame(width: 8, height: 8)
                        Text(task.verificationStatus.displayName)
                    }
                }
            }

            if let completedAt = task.completedAt {
                Divider()

                HStack {
                    Text("Completed")
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text(completedAt, style: .relative)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Time Details Card

    private var timeDetailsCard: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Schedule")
                    .font(.headline)
                Spacer()
            }

            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Start")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(task.startTime, format: .dateTime.hour().minute())
                        .font(.title3)
                        .fontWeight(.semibold)
                }

                Spacer()

                Image(systemName: "arrow.right")
                    .foregroundStyle(.secondary)

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text("End")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(task.endTime, format: .dateTime.hour().minute())
                        .font(.title3)
                        .fontWeight(.semibold)
                }
            }

            Divider()

            HStack {
                Label("\(task.duration) min", systemImage: "clock")
                    .foregroundStyle(.secondary)
                Spacer()
                if task.isRecurring {
                    Label("Recurring", systemImage: "repeat")
                        .foregroundStyle(themeService.accentColor)
                }
            }
            .font(.subheadline)
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Verification Card

    private var verificationCard: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Verification")
                    .font(.headline)
                Spacer()
                Text(task.verificationType.displayName)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            HStack {
                Image(systemName: task.verificationType.icon)
                    .font(.title2)
                    .foregroundStyle(themeService.accentColor)
                    .frame(width: 44)

                Text(task.verificationType.description)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                Spacer()
            }

            // Type-specific details
            verificationDetails
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    @ViewBuilder
    private var verificationDetails: some View {
        switch task.verificationType {
        case VerificationType.exercise:
            if let exerciseType = task.exerciseType {
                Divider()
                HStack {
                    Text(exerciseType.displayName)
                        .fontWeight(.medium)
                    Spacer()
                    if exerciseType.isHoldExercise, let duration = task.targetDuration {
                        Text("\(duration) seconds")
                            .foregroundStyle(.secondary)
                    } else if let reps = task.targetReps {
                        Text("\(reps) reps")
                            .foregroundStyle(.secondary)
                    }
                }

                if let actualReps = task.actualReps, task.targetReps != nil {
                    ProgressView(value: Double(actualReps), total: Double(task.targetReps!))
                        .tint(themeService.accentColor)
                }

                if let actualDuration = task.actualDuration, task.targetDuration != nil {
                    ProgressView(value: Double(actualDuration), total: Double(task.targetDuration!))
                        .tint(themeService.accentColor)
                }
            }

        case VerificationType.stepCount:
            if let targetSteps = task.targetSteps {
                Divider()
                HStack {
                    Text("Target Steps")
                        .fontWeight(.medium)
                    Spacer()
                    Text("\(targetSteps)")
                        .foregroundStyle(.secondary)
                }

                if let actualSteps = task.actualSteps {
                    ProgressView(value: Double(actualSteps), total: Double(targetSteps))
                        .tint(themeService.accentColor)

                    HStack {
                        Text("\(actualSteps) / \(targetSteps)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Spacer()
                    }
                }
            }

        case VerificationType.voice:
            if let prompt = task.voicePrompt {
                Divider()
                VStack(alignment: .leading, spacing: 8) {
                    Text("Prompt")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(prompt)
                        .font(.body)
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color(.tertiarySystemGroupedBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }
            }

        case VerificationType.photoAfter, VerificationType.photoBeforeAfter:
            if task.beforeImagePath != nil || task.afterImagePath != nil {
                Divider()
                HStack(spacing: 12) {
                    if task.verificationType == VerificationType.photoBeforeAfter {
                        photoThumbnail(path: task.beforeImagePath, label: "Before")
                    }
                    photoThumbnail(path: task.afterImagePath, label: "After")
                }
            }

        case VerificationType.check:
            EmptyView()
        }
    }

    @ViewBuilder
    private func photoThumbnail(path: String?, label: String) -> some View {
        VStack(spacing: 4) {
            if let path = path,
               let image = PhotoStorageService().loadPhoto(from: path) {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: 80, height: 80)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            } else {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color(.tertiarySystemGroupedBackground))
                    .frame(width: 80, height: 80)
                    .overlay {
                        Image(systemName: "photo")
                            .foregroundStyle(.secondary)
                    }
            }
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Actions Section

    private var actionsSection: some View {
        VStack(spacing: 12) {
            if task.status == ScheduledTaskStatus.pending || task.status == ScheduledTaskStatus.inProgress {
                Button {
                    showingVerification = true
                } label: {
                    HStack {
                        Image(systemName: "play.fill")
                        Text(task.status == ScheduledTaskStatus.inProgress ? "Continue Verification" : "Start Verification")
                    }
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(themeService.accentColor)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                if task.verificationType == VerificationType.check {
                    Button {
                        markAsComplete()
                    } label: {
                        HStack {
                            Image(systemName: "checkmark")
                            Text("Mark as Complete")
                        }
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(.secondarySystemGroupedBackground))
                        .foregroundStyle(themeService.accentColor)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }

                Button {
                    skipTask()
                } label: {
                    HStack {
                        Image(systemName: "forward.fill")
                        Text("Skip Task")
                    }
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                }
                .padding(.top, 8)
            }
        }
    }

    // MARK: - Helper Properties

    private var statusColor: Color {
        switch task.status {
        case ScheduledTaskStatus.pending: return .orange
        case ScheduledTaskStatus.inProgress: return .blue
        case ScheduledTaskStatus.completed: return .green
        case ScheduledTaskStatus.skipped: return .gray
        case ScheduledTaskStatus.failed: return .red
        }
    }

    private var verificationStatusColor: Color {
        switch task.verificationStatus {
        case VerificationStatus.notStarted: return .gray
        case VerificationStatus.inProgress: return .blue
        case VerificationStatus.verified: return .green
        case VerificationStatus.failed: return .red
        }
    }

    // MARK: - Actions

    private func markAsComplete() {
        Task {
            do {
                try await scheduleService.updateTaskStatus(task.id, status: ScheduledTaskStatus.completed)
                dismiss()
            } catch {
                print("Error marking task as complete: \(error)")
            }
        }
    }

    private func skipTask() {
        Task {
            do {
                try await scheduleService.updateTaskStatus(task.id, status: ScheduledTaskStatus.skipped)
                dismiss()
            } catch {
                print("Error skipping task: \(error)")
            }
        }
    }

    private func deleteTask() {
        isDeleting = true
        Task {
            do {
                try await scheduleService.deleteTask(task.id)
                dismiss()
            } catch {
                print("Error deleting task: \(error)")
                isDeleting = false
            }
        }
    }
}

// MARK: - Task Verification View (Placeholder)

struct TaskVerificationView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(ScheduleService.self) private var scheduleService
    @Environment(ThemeService.self) private var themeService

    let task: ScheduledTask

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()

                Image(systemName: task.verificationType.icon)
                    .font(.system(size: 64))
                    .foregroundStyle(themeService.accentColor)

                Text("Verification for \(task.title)")
                    .font(.title2)
                    .fontWeight(.bold)

                Text(task.verificationType.description)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)

                Spacer()

                // This will be replaced with actual verification UI
                // based on verification type (camera, exercise tracking, etc.)
                Text("Verification UI will be implemented here")
                    .foregroundStyle(.secondary)

                Spacer()
            }
            .padding()
            .navigationTitle("Verify Task")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    let task = ScheduledTask(
        title: "Morning Workout",
        taskDescription: "Do 20 pushups to start the day",
        scheduledDate: Date(),
        startTime: Date(),
        endTime: Date().addingTimeInterval(1800),
        duration: 30,
        verificationType: .exercise
    )
    task.exerciseType = .pushups
    task.targetReps = 20

    return NavigationStack {
        TaskDetailView(task: task)
    }
    .environment(ScheduleService(openAIService: OpenAIService(), photoStorageService: PhotoStorageService()))
    .environment(ThemeService())
}
