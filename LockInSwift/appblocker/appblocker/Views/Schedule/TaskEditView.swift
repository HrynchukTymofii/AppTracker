import SwiftUI

struct TaskEditView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(ThemeService.self) private var theme
    @Environment(ScheduleService.self) private var scheduleService
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.modelContext) private var modelContext

    @Bindable var task: ScheduledTask
    var onDismiss: () -> Void

    @State private var title: String = ""
    @State private var taskDescription: String = ""
    @State private var startTime: Date = Date()
    @State private var endTime: Date = Date()
    @State private var selectedVerificationType: VerificationType = .check
    @State private var targetReps: String = ""
    @State private var targetSteps: String = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    private var isDark: Bool { colorScheme == .dark }

    // MARK: - Computed Colors

    private var fieldBackground: Color {
        isDark ? Color.white.opacity(0.05) : Color.black.opacity(0.03)
    }

    private var fieldBorder: Color {
        isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.06)
    }

    // MARK: - Body

    var body: some View {
        NavigationStack {
            ZStack {
                theme.backgroundColor(for: colorScheme).ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 24) {
                        titleSection
                        descriptionSection
                        timeSection
                        verificationTypeSection

                        if selectedVerificationType == .exercise {
                            targetRepsSection
                        }

                        if selectedVerificationType == .stepCount {
                            targetStepsSection
                        }

                        errorSection
                        saveButton
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 24)
                }
                .scrollIndicators(.hidden)
            }
            .navigationTitle("Edit Task")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        onDismiss()
                        dismiss()
                    }
                    .foregroundStyle(theme.textSecondary(for: colorScheme))
                }
            }
            .onAppear {
                loadTaskData()
            }
        }
        .presentationBackground(.ultraThinMaterial)
        .presentationCornerRadius(24)
    }

    // MARK: - Title Section

    private var titleSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Title")
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(theme.textSecondary(for: colorScheme))

            TextField("Task title", text: $title)
                .font(.system(size: 16))
                .foregroundStyle(theme.textPrimary(for: colorScheme))
                .padding(16)
                .background(RoundedRectangle(cornerRadius: 12).fill(fieldBackground))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(fieldBorder, lineWidth: 1))
        }
    }

    // MARK: - Description Section

    private var descriptionSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Description (optional)")
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(theme.textSecondary(for: colorScheme))

            TextField("Add details...", text: $taskDescription, axis: .vertical)
                .font(.system(size: 16))
                .foregroundStyle(theme.textPrimary(for: colorScheme))
                .padding(16)
                .background(RoundedRectangle(cornerRadius: 12).fill(fieldBackground))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(fieldBorder, lineWidth: 1))
                .lineLimit(2...4)
        }
    }

    // MARK: - Time Section

    private var timeSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Time")
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(theme.textSecondary(for: colorScheme))

            VStack(spacing: 12) {
                // Start time row
                HStack {
                    Text("Start")
                        .font(.system(size: 14))
                        .foregroundStyle(theme.textMuted(for: colorScheme))
                    Spacer()
                    DatePicker("", selection: $startTime, displayedComponents: [.date, .hourAndMinute])
                        .labelsHidden()
                        .datePickerStyle(.compact)
                        .tint(theme.accentColor)
                }

                Divider()
                    .background(fieldBorder)

                // End time row
                HStack {
                    Text("End")
                        .font(.system(size: 14))
                        .foregroundStyle(theme.textMuted(for: colorScheme))
                    Spacer()
                    DatePicker("", selection: $endTime, displayedComponents: [.date, .hourAndMinute])
                        .labelsHidden()
                        .datePickerStyle(.compact)
                        .tint(theme.accentColor)
                }
            }
            .padding(16)
            .background(RoundedRectangle(cornerRadius: 12).fill(fieldBackground))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(fieldBorder, lineWidth: 1))
        }
    }

    // MARK: - Verification Type Section

    private var verificationTypeSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Verification Type")
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(theme.textSecondary(for: colorScheme))

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                ForEach(VerificationType.allCases, id: \.self) { type in
                    verificationTypeButton(for: type)
                }
            }
        }
    }

    private func verificationTypeButton(for type: VerificationType) -> some View {
        let isSelected = selectedVerificationType == type
        let bgColor = isSelected ? theme.accentColor.opacity(0.2) : fieldBackground
        let borderColor = isSelected ? theme.accentColor : fieldBorder
        let textColor = isSelected ? theme.accentColor : theme.textPrimary(for: colorScheme)

        return Button {
            selectedVerificationType = type
        } label: {
            HStack(spacing: 8) {
                Image(systemName: type.icon)
                    .font(.system(size: 16))
                Text(type.displayName)
                    .font(.system(size: 14))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(RoundedRectangle(cornerRadius: 10).fill(bgColor))
            .foregroundStyle(textColor)
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(borderColor, lineWidth: 1))
        }
    }

    // MARK: - Target Reps Section

    private var targetRepsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Target Reps")
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(theme.textSecondary(for: colorScheme))

            TextField("e.g., 20", text: $targetReps)
                .font(.system(size: 16))
                .foregroundStyle(theme.textPrimary(for: colorScheme))
                .keyboardType(.numberPad)
                .padding(16)
                .background(RoundedRectangle(cornerRadius: 12).fill(fieldBackground))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(fieldBorder, lineWidth: 1))
        }
    }

    // MARK: - Target Steps Section

    private var targetStepsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Target Steps")
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(theme.textSecondary(for: colorScheme))

            TextField("e.g., 5000", text: $targetSteps)
                .font(.system(size: 16))
                .foregroundStyle(theme.textPrimary(for: colorScheme))
                .keyboardType(.numberPad)
                .padding(16)
                .background(RoundedRectangle(cornerRadius: 12).fill(fieldBackground))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(fieldBorder, lineWidth: 1))
        }
    }

    // MARK: - Error Section

    @ViewBuilder
    private var errorSection: some View {
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
    }

    // MARK: - Save Button

    private var saveButton: some View {
        Button {
            saveTask()
        } label: {
            HStack {
                if isSaving {
                    ProgressView()
                        .tint(.white)
                } else {
                    Text("Save Changes")
                }
            }
            .font(.system(size: 16, weight: .semibold))
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(theme.accentColor)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .shadow(color: theme.accentColor.opacity(isDark ? 0.5 : 0.3), radius: 15, y: 4)
        }
        .disabled(title.isEmpty || isSaving)
        .opacity(title.isEmpty || isSaving ? 0.5 : 1.0)
    }

    private func loadTaskData() {
        title = task.title
        taskDescription = task.taskDescription ?? ""
        startTime = task.startTime
        endTime = task.endTime
        selectedVerificationType = task.verificationType
        targetReps = task.targetReps.map { String($0) } ?? ""
        targetSteps = task.targetSteps.map { String($0) } ?? ""
    }

    private func saveTask() {
        guard !title.isEmpty else { return }

        isSaving = true
        errorMessage = nil

        // Update task properties
        task.title = title
        task.taskDescription = taskDescription.isEmpty ? nil : taskDescription
        task.startTime = startTime
        task.endTime = endTime
        task.scheduledDate = Calendar.current.startOfDay(for: startTime)
        task.duration = Int(endTime.timeIntervalSince(startTime) / 60)
        task.verificationType = selectedVerificationType
        task.updatedAt = Date()

        // Update type-specific fields
        if selectedVerificationType == .exercise {
            task.targetReps = Int(targetReps)
        } else {
            task.targetReps = nil
        }

        if selectedVerificationType == .stepCount {
            task.targetSteps = Int(targetSteps)
        } else {
            task.targetSteps = nil
        }

        do {
            try modelContext.save()
            isSaving = false
            onDismiss()
            dismiss()
        } catch {
            isSaving = false
            errorMessage = error.localizedDescription
        }
    }
}

#Preview {
    TaskEditView(
        task: ScheduledTask(
            title: "Test Task",
            scheduledDate: Date(),
            startTime: Date(),
            endTime: Date().addingTimeInterval(3600),
            duration: 60
        ),
        onDismiss: {}
    )
    .environment(ThemeService())
    .environment(ScheduleService(openAIService: OpenAIService(), photoStorageService: PhotoStorageService()))
}
