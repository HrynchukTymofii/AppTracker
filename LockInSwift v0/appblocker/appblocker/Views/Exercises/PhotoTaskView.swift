import SwiftUI
import AVFoundation

/// Photo task view with AI verification chat
struct PhotoTaskView: View {
    let cameraService: CameraService
    let onComplete: (Int) -> Void  // Now passes the earned reward amount

    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.dismiss) private var dismiss
    @Environment(ThemeService.self) private var themeService

    @State private var openAI = OpenAIService()
    @State private var step: TaskStep = .selectTask
    @State private var selectedTask: PresetTask?
    @State private var customTaskName = ""
    @State private var beforeImage: UIImage?
    @State private var afterImage: UIImage?
    @State private var messages: [ChatMessage] = []
    @State private var inputText = ""
    @State private var isLoading = false
    @State private var showForceComplete = false
    @State private var userMessageCount = 0
    @State private var taskId = UUID()  // Unique ID for persisting photos
    @State private var earnedReward: Int = 10  // GPT-determined reward (5, 10, or 15)

    private var isDark: Bool { colorScheme == .dark }

    // File URL for persisting before photo
    private var beforeImageURL: URL {
        FileManager.default.temporaryDirectory.appendingPathComponent("photo_task_before_\(taskId.uuidString).jpg")
    }

    enum TaskStep {
        case selectTask
        case takeBeforePhoto
        case doingTask
        case takeAfterPhoto
        case verifying
    }

    var body: some View {
        ZStack {
            // Background only for non-camera views
            if step == .selectTask || step == .doingTask || step == .verifying {
                // Pure black/white background
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
            }

            VStack(spacing: 0) {
                switch step {
                case .selectTask:
                    taskSelectionView
                case .takeBeforePhoto:
                    cameraView(isAfter: false)
                case .doingTask:
                    doingTaskView
                case .takeAfterPhoto:
                    cameraView(isAfter: true)
                case .verifying:
                    verificationChatView
                }
            }
        }
        .onAppear {
            // Use back camera for photo tasks
            cameraService.setPosition(.back)
            cameraService.ensurePermission()
            cameraService.start()

            // Try to restore saved before image (in case app was closed)
            loadSavedBeforeImage()
        }
        .onDisappear {
            cameraService.stop()
            // Clean up saved image if task is complete
            if step == .verifying {
                cleanupSavedImage()
            }
        }
    }

    // MARK: - Image Persistence

    private func saveBeforeImage(_ image: UIImage) {
        if let data = image.jpegData(compressionQuality: 0.8) {
            try? data.write(to: beforeImageURL)
            // Also save the task info
            UserDefaults.standard.set(taskId.uuidString, forKey: "photoTask.currentTaskId")
            UserDefaults.standard.set(selectedTask?.rawValue ?? customTaskName, forKey: "photoTask.taskName")
            UserDefaults.standard.set(selectedTask != nil, forKey: "photoTask.isPreset")
        }
    }

    private func loadSavedBeforeImage() {
        // Check if there's a saved task in progress
        guard let savedTaskId = UserDefaults.standard.string(forKey: "photoTask.currentTaskId"),
              let uuid = UUID(uuidString: savedTaskId) else { return }

        let savedURL = FileManager.default.temporaryDirectory.appendingPathComponent("photo_task_before_\(savedTaskId).jpg")

        if let imageData = try? Data(contentsOf: savedURL),
           let image = UIImage(data: imageData) {
            // Restore the state
            self.taskId = uuid
            self.beforeImage = image

            // Restore task info
            let taskName = UserDefaults.standard.string(forKey: "photoTask.taskName") ?? ""
            let isPreset = UserDefaults.standard.bool(forKey: "photoTask.isPreset")

            if isPreset {
                self.selectedTask = PresetTask(rawValue: taskName)
            } else {
                self.customTaskName = taskName
            }

            // Jump to "doing task" step since we have the before photo
            self.step = .doingTask
        }
    }

    private func cleanupSavedImage() {
        try? FileManager.default.removeItem(at: beforeImageURL)
        UserDefaults.standard.removeObject(forKey: "photoTask.currentTaskId")
        UserDefaults.standard.removeObject(forKey: "photoTask.taskName")
        UserDefaults.standard.removeObject(forKey: "photoTask.isPreset")
    }

    // MARK: - Task Selection

    private var taskSelectionView: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: "camera.viewfinder")
                        .font(.system(size: 50))
                        .foregroundStyle(themeService.accentColor)

                    Text(L10n.Exercise.photoTask)
                        .font(.system(size: 28, weight: .bold))
                        .foregroundStyle(isDark ? .white : .black)

                    Text(L10n.Exercise.photoTaskDesc)
                        .font(.system(size: 16))
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
                .padding(.top, 20)

                // Custom task input (moved to top)
                VStack(alignment: .leading, spacing: 12) {
                    Text(L10n.Exercise.describeTask)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(.secondary)
                        .tracking(0.5)
                        .padding(.horizontal, 20)

                    HStack {
                        TextField(L10n.Exercise.taskPlaceholder, text: $customTaskName)
                            .textFieldStyle(.plain)
                            .padding()
                            .background(
                                RoundedRectangle(cornerRadius: 14)
                                    .fill(isDark ? Color.white.opacity(0.05) : .white)
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 14)
                                    .stroke(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.05), lineWidth: 1)
                            )

                        Button {
                            if !customTaskName.isEmpty {
                                selectedTask = nil
                                // Custom tasks skip before photo (just need proof of completion)
                                step = .doingTask
                            }
                        } label: {
                            Image(systemName: "arrow.right.circle.fill")
                                .font(.system(size: 32))
                                .foregroundStyle(themeService.accentColor)
                        }
                        .disabled(customTaskName.isEmpty)
                        .opacity(customTaskName.isEmpty ? 0.5 : 1.0)
                    }
                    .padding(.horizontal, 20)
                }

                // Preset tasks (quick options below)
                VStack(alignment: .leading, spacing: 12) {
                    Text(L10n.Exercise.orChoosePreset)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(.secondary)
                        .tracking(0.5)
                        .padding(.horizontal, 20)

                    VStack(spacing: 8) {
                        ForEach(PresetTask.allCases) { task in
                            presetTaskRow(task)
                        }
                    }
                    .padding(.horizontal, 20)
                }
            }
            .padding(.bottom, 40)
        }
    }

    private func presetTaskRow(_ task: PresetTask) -> some View {
        Button {
            selectedTask = task
            // Skip before photo for tasks that don't need it
            step = task.needsBeforePhoto ? .takeBeforePhoto : .doingTask
        } label: {
            HStack(spacing: 16) {
                Text(task.emoji)
                    .font(.system(size: 28))

                Text(task.name)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(isDark ? .white : .black)

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(.secondary)
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(isDark ? Color.white.opacity(0.05) : .white)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.05), lineWidth: 1)
            )
        }
    }

    // MARK: - Camera View

    private func cameraView(isAfter: Bool) -> some View {
        ZStack {
            if !cameraService.hasPermission {
                // Permission not granted - show request UI
                cameraPermissionView(isAfter: isAfter)
            } else {
                // Actual camera preview
                CameraPreviewView(session: cameraService.session)
                    .ignoresSafeArea()

                // Overlay with controls
                cameraOverlay(isAfter: isAfter)
            }
        }
    }

    private func cameraPermissionView(isAfter: Bool) -> some View {
        ZStack {
            // Pure black/white background
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

            VStack(spacing: 24) {
                // Top bar (for back navigation)
                HStack {
                    Button {
                        step = isAfter ? .doingTask : .selectTask
                    } label: {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 20, weight: .medium))
                            .foregroundStyle(isDark ? .white : .black)
                            .padding(12)
                            .background(Circle().fill(isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.05)))
                    }
                    Spacer()
                }
                .padding(.horizontal, 20)
                .padding(.top, 10)

                Spacer()

                Image(systemName: "camera.fill")
                    .font(.system(size: 60))
                    .foregroundStyle(themeService.accentColor)

                Text(L10n.Exercise.cameraRequired)
                    .font(.system(size: 24, weight: .bold))
                    .foregroundStyle(isDark ? .white : .black)

                Text(L10n.Exercise.cameraPhotoTaskMessage)
                    .font(.system(size: 16))
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)

                Button {
                    let status = AVCaptureDevice.authorizationStatus(for: .video)
                    if status == .denied || status == .restricted {
                        if let url = URL(string: UIApplication.openSettingsURLString) {
                            UIApplication.shared.open(url)
                        }
                    } else {
                        cameraService.ensurePermission()
                    }
                } label: {
                    Text(AVCaptureDevice.authorizationStatus(for: .video) == .denied ? L10n.Exercise.openSettings : L10n.Exercise.enableCamera)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(themeService.primaryGradient)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                }
                .padding(.horizontal, 40)

                Spacer()
            }
        }
    }

    private func cameraOverlay(isAfter: Bool) -> some View {
        VStack {
                // Top bar
                HStack {
                    Button {
                        step = isAfter ? .doingTask : .selectTask
                    } label: {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 20, weight: .medium))
                            .foregroundStyle(.white)
                            .padding(12)
                            .background(Circle().fill(.ultraThinMaterial))
                    }

                    Spacer()

                    Text(isAfter ? L10n.Exercise.afterPhoto : L10n.Exercise.beforePhoto)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(.white)

                    Spacer()

                    // Placeholder for alignment
                    Color.clear.frame(width: 44, height: 44)
                }
                .padding(.horizontal, 20)
                .padding(.top, 10)

                Spacer()

                // Instructions
                VStack(spacing: 12) {
                    Text(isAfter ? L10n.Exercise.showCompleted : L10n.Exercise.takeStartingPhoto)
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(.white)
                        .multilineTextAlignment(.center)

                    Text(taskDescription)
                        .font(.system(size: 14))
                        .foregroundStyle(.white.opacity(0.7))
                }
                .padding(.horizontal, 40)
                .padding(.bottom, 20)

                // Capture button
                Button {
                    Task {
                        if let image = await cameraService.capturePhoto() {
                            if isAfter {
                                afterImage = image
                                step = .verifying
                                await startVerification()
                            } else {
                                beforeImage = image
                                saveBeforeImage(image)  // Persist to disk
                                step = .doingTask
                            }
                        }
                    }
                } label: {
                    ZStack {
                        Circle()
                            .stroke(.white, lineWidth: 4)
                            .frame(width: 72, height: 72)

                        Circle()
                            .fill(.white)
                            .frame(width: 60, height: 60)
                    }
                }
                .padding(.bottom, 40)
        }
    }

    // MARK: - Doing Task View

    /// Whether the current task needs a before photo
    private var currentTaskNeedsBeforePhoto: Bool {
        if let preset = selectedTask {
            return preset.needsBeforePhoto
        }
        // For custom tasks, default to false (no before photo)
        // Could enhance with GPT decision in the future
        return false
    }

    private var doingTaskView: some View {
        VStack(spacing: 24) {
            Spacer()

            // Before photo preview (only if taken)
            if let before = beforeImage {
                Image(uiImage: before)
                    .resizable()
                    .scaledToFill()
                    .frame(width: 150, height: 150)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .overlay(
                        VStack {
                            Spacer()
                            Text(L10n.Exercise.before)
                                .font(.system(size: 12, weight: .medium))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 4)
                                .background(Capsule().fill(.black.opacity(0.6)))
                                .padding(8)
                        }
                    )
            } else {
                // Show task icon if no before photo
                Text(selectedTask?.emoji ?? "📷")
                    .font(.system(size: 80))
            }

            VStack(spacing: 12) {
                Text(L10n.Exercise.goCompleteTask)
                    .font(.system(size: 24, weight: .bold))
                    .foregroundStyle(isDark ? .white : .black)

                Text(taskDescription)
                    .font(.system(size: 16))
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.horizontal, 40)

            Spacer()

            // Take after photo button
            Button {
                step = .takeAfterPhoto
            } label: {
                HStack {
                    Image(systemName: "camera.fill")
                    Text(beforeImage != nil ? L10n.Exercise.doneAfterPhoto : L10n.Exercise.doneVerifyTask)
                }
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 18)
                .background(themeService.primaryGradient)
                .clipShape(RoundedRectangle(cornerRadius: 16))
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 40)
        }
    }

    // MARK: - Verification Chat View

    private var verificationChatView: some View {
        VStack(spacing: 0) {
            // Photos header
            photosHeader
                .padding(.horizontal, 20)
                .padding(.vertical, 12)

            Divider()

            // Chat messages
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(messages) { message in
                            chatBubble(message)
                                .id(message.id)
                        }

                        if isLoading {
                            HStack {
                                TypingIndicator()
                                Spacer()
                            }
                            .padding(.horizontal, 20)
                        }
                    }
                    .padding(.vertical, 16)
                }
                .onChange(of: messages.count) { _, _ in
                    if let last = messages.last {
                        withAnimation {
                            proxy.scrollTo(last.id, anchor: .bottom)
                        }
                    }
                }
            }

            Divider()

            // Input area
            chatInputArea
        }
    }

    private var photosHeader: some View {
        HStack(spacing: 16) {
            if let before = beforeImage {
                Image(uiImage: before)
                    .resizable()
                    .scaledToFill()
                    .frame(width: 60, height: 60)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .overlay(
                        Text(L10n.Exercise.before)
                            .font(.system(size: 8, weight: .medium))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 4)
                            .padding(.vertical, 2)
                            .background(Capsule().fill(.black.opacity(0.6)))
                            .padding(4),
                        alignment: .bottom
                    )

                Image(systemName: "arrow.right")
                    .foregroundStyle(.secondary)
            }

            if let after = afterImage {
                Image(uiImage: after)
                    .resizable()
                    .scaledToFill()
                    .frame(width: 60, height: 60)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .overlay(
                        Text(beforeImage != nil ? L10n.Exercise.after : L10n.Exercise.proof)
                            .font(.system(size: 8, weight: .medium))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 4)
                            .padding(.vertical, 2)
                            .background(Capsule().fill(.black.opacity(0.6)))
                            .padding(4),
                        alignment: .bottom
                    )
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text(taskDescription)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(isDark ? .white : .black)
                    .lineLimit(2)

                Text("+\(earnedReward) min")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(themeService.accentColor)
            }
        }
    }

    private func chatBubble(_ message: ChatMessage) -> some View {
        HStack {
            if message.isFromUser {
                Spacer(minLength: 60)
            }

            VStack(alignment: message.isFromUser ? .trailing : .leading, spacing: 4) {
                Text(message.content)
                    .font(.system(size: 16))
                    .foregroundStyle(message.isFromUser ? .white : (isDark ? .white : .black))
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(
                        RoundedRectangle(cornerRadius: 18)
                            .fill(message.isFromUser ? themeService.accentColor : (isDark ? Color.white.opacity(0.1) : Color(white: 0.95)))
                    )

                if message.isSuccess {
                    HStack(spacing: 4) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                        Text(L10n.Exercise.taskVerified)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(.green)
                    }
                }
            }

            if !message.isFromUser {
                Spacer(minLength: 60)
            }
        }
        .padding(.horizontal, 20)
    }

    private var chatInputArea: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                TextField(L10n.Exercise.typeMessage, text: $inputText)
                    .textFieldStyle(.plain)
                    .padding(12)
                    .background(
                        RoundedRectangle(cornerRadius: 20)
                            .fill(isDark ? Color.white.opacity(0.05) : Color(white: 0.95))
                    )

                Button {
                    sendMessage()
                } label: {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.system(size: 32))
                        .foregroundStyle(inputText.isEmpty ? .secondary : themeService.accentColor)
                }
                .disabled(inputText.isEmpty || isLoading)
            }

            // Force complete button (appears after 3 user messages)
            if showForceComplete {
                Button {
                    cleanupSavedImage()  // Clear immediately before completion
                    onComplete(earnedReward)
                } label: {
                    Text(L10n.Exercise.completeAnyway(earnedReward))
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(themeService.accentColor)
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
    }

    // MARK: - Helpers

    private var taskDescription: String {
        selectedTask?.name ?? customTaskName
    }

    private func startVerification() async {
        guard let after = afterImage else { return }

        isLoading = true

        // Add initial coach message based on whether we have a before photo
        let initialMessage = beforeImage != nil
            ? "Let me take a look at your photos..."
            : "Let me check your completed task..."

        messages.append(ChatMessage(
            content: initialMessage,
            isFromUser: false
        ))

        do {
            let result = try await openAI.verifyTask(
                beforeImage: beforeImage,  // Can be nil for tasks without before photo
                afterImage: after,
                taskDescription: taskDescription
            )

            isLoading = false

            // Update reward based on GPT's assessment of task difficulty
            earnedReward = result.recommendedReward

            // Add verification result message
            messages.append(ChatMessage(
                content: result.humanMessage,
                isFromUser: false,
                isSuccess: result.isCompleted && result.confidence >= 70
            ))

            // Auto-complete if high confidence
            if result.isCompleted && result.confidence >= 70 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                    cleanupSavedImage()  // Clear immediately before completion
                    onComplete(earnedReward)
                }
            }
        } catch {
            isLoading = false
            messages.append(ChatMessage(
                content: "Hmm, I'm having trouble analyzing your task. Can you tell me what you did?",
                isFromUser: false
            ))
        }
    }

    private func sendMessage() {
        let text = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }

        inputText = ""
        userMessageCount += 1

        messages.append(ChatMessage(content: text, isFromUser: true))

        // After 2 user messages, show force complete and limit further messages
        if userMessageCount >= 2 {
            showForceComplete = true
            // Reduce reward to half after 2 attempts if not already verified
            earnedReward = max(5, earnedReward / 2)
        }

        Task {
            isLoading = true

            do {
                let response = try await openAI.generateChatResponse(
                    userMessage: text,
                    taskDescription: taskDescription,
                    conversationHistory: messages.map {
                        OpenAIService.ChatMessage(
                            role: $0.isFromUser ? .user : .coach,
                            content: $0.content,
                            image: nil
                        )
                    },
                    beforeImage: beforeImage,
                    afterImage: afterImage
                )

                isLoading = false

                // Final message after 2 attempts
                if userMessageCount >= 2 {
                    let finalMessage = response + "\n\nThis is my final assessment. You can complete the task now."
                    messages.append(ChatMessage(content: finalMessage, isFromUser: false))
                } else {
                    messages.append(ChatMessage(content: response, isFromUser: false))
                }
            } catch {
                isLoading = false
                messages.append(ChatMessage(
                    content: "Sorry, I couldn't process that. You can complete the task now.",
                    isFromUser: false
                ))
                showForceComplete = true
            }
        }
    }
}

// MARK: - Supporting Types

struct ChatMessage: Identifiable {
    let id = UUID()
    let content: String
    let isFromUser: Bool
    var isSuccess: Bool = false
}

enum PresetTask: String, CaseIterable, Identifiable {
    case cleanRoom
    case homework
    case workout
    case cook
    case read
    case write

    var id: String { rawValue }

    var name: String {
        switch self {
        case .cleanRoom: return L10n.Preset.cleanRoom
        case .homework: return L10n.Preset.homework
        case .workout: return L10n.Preset.workout
        case .cook: return L10n.Preset.cook
        case .read: return L10n.Preset.read
        case .write: return L10n.Preset.write
        }
    }

    var emoji: String {
        switch self {
        case .cleanRoom: return "🏠"
        case .homework: return "📚"
        case .workout: return "💪"
        case .cook: return "🍳"
        case .read: return "📖"
        case .write: return "✏️"
        }
    }

    /// Whether this task makes sense with before/after photo verification
    /// Visual tasks (room cleaning, homework, reading) benefit from before/after
    /// Action tasks (workout, write) just need an after photo or description
    var needsBeforePhoto: Bool {
        switch self {
        case .cleanRoom, .homework, .read: return true   // Visual change (book progress)
        case .workout, .cook, .write: return false  // Just show result/describe
        }
    }
}

// MARK: - Typing Indicator

struct TypingIndicator: View {
    @State private var phase = 0

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3) { index in
                Circle()
                    .fill(Color.secondary)
                    .frame(width: 8, height: 8)
                    .opacity(phase == index ? 1 : 0.4)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 18)
                .fill(Color.secondary.opacity(0.1))
        )
        .onAppear {
            Timer.scheduledTimer(withTimeInterval: 0.3, repeats: true) { _ in
                phase = (phase + 1) % 3
            }
        }
    }
}

#Preview {
    PhotoTaskView(
        cameraService: CameraService()
    ) { _ in }
    .environment(ThemeService())
}
