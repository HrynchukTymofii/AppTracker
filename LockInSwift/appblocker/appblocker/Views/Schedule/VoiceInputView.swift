import SwiftUI
import Network

// MARK: - Network Monitor

/// Simple network connectivity monitor
class NetworkMonitor: ObservableObject {
    static let shared = NetworkMonitor()

    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "NetworkMonitor")

    @Published var isConnected = true

    init() {
        monitor.pathUpdateHandler = { [weak self] path in
            DispatchQueue.main.async {
                self?.isConnected = path.status == .satisfied
            }
        }
        monitor.start(queue: queue)
    }

    deinit {
        monitor.cancel()
    }
}

// MARK: - Voice Input View

struct VoiceInputView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(ThemeService.self) private var theme
    @Environment(TaskParserService.self) private var taskParserService
    @Environment(\.colorScheme) private var colorScheme

    @State private var speechRecognizer = SpeechRecognizer()
    @StateObject private var networkMonitor = NetworkMonitor.shared

    @State private var isParsing = false
    @State private var errorMessage: String?
    @State private var showError = false
    @State private var isAuthorized = false

    // Same parameters as EnhancedTextInputView
    let selectedDate: Date
    let existingTasks: [ScheduledTask]
    var onTaskCreated: (TaskParsingResponse) -> Void

    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        NavigationStack {
            ZStack {
                // Background
                theme.backgroundColor(for: colorScheme).ignoresSafeArea()

                VStack(spacing: 32) {
                    Spacer()

                    // Transcript display
                    transcriptDisplay

                    Spacer()

                    // Mic button
                    micButton

                    // Status text
                    Text(statusText)
                        .font(.system(size: 14))
                        .foregroundStyle(theme.textMuted(for: colorScheme))

                    // Offline indicator
                    if !networkMonitor.isConnected {
                        offlineIndicator
                    }

                    // Authorization message
                    if !isAuthorized && !speechRecognizer.isRecording {
                        authorizationMessage
                    }

                    Spacer()
                }
                .padding(DesignTokens.paddingPage)
            }
            .navigationTitle("schedule.voice_input_title".localized)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button {
                        speechRecognizer.stopRecording()
                        dismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.title2)
                            .foregroundStyle(theme.textSecondary(for: colorScheme))
                    }
                }
            }
            .alert("Error", isPresented: $showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "An error occurred")
            }
            .task {
                // Request authorization on appear
                isAuthorized = await speechRecognizer.requestAuthorization()
            }
        }
    }

    // MARK: - Transcript Display

    private var transcriptDisplay: some View {
        Group {
            if speechRecognizer.transcript.isEmpty && !speechRecognizer.isRecording {
                VStack(spacing: 12) {
                    Image(systemName: "waveform")
                        .font(.system(size: 48))
                        .foregroundStyle(theme.textMuted(for: colorScheme))

                    Text("schedule.voice_input_hint".localized)
                        .font(.system(size: 16))
                        .foregroundStyle(theme.textSecondary(for: colorScheme))
                        .multilineTextAlignment(.center)
                }
            } else {
                Text(speechRecognizer.transcript.isEmpty ? "..." : speechRecognizer.transcript)
                    .font(.system(size: 20, weight: .medium))
                    .foregroundStyle(theme.textPrimary(for: colorScheme))
                    .multilineTextAlignment(.center)
                    .padding(24)
                    .frame(maxWidth: .infinity)
                    .liquidGlass()
                    .animation(.easeInOut, value: speechRecognizer.transcript)
            }
        }
        .frame(minHeight: 150)
    }

    // MARK: - Mic Button

    private var micButton: some View {
        Button(action: toggleRecording) {
            ZStack {
                // Outer glow when recording
                if speechRecognizer.isRecording {
                    Circle()
                        .fill(Color.red.opacity(0.2))
                        .frame(width: 100, height: 100)
                        .blur(radius: 10)
                }

                // Main button
                Circle()
                    .fill(speechRecognizer.isRecording ? Color.red : theme.accentColor)
                    .frame(width: 80, height: 80)
                    .shadow(
                        color: (speechRecognizer.isRecording ? Color.red : theme.accentColor).opacity(isDark ? 0.5 : 0.3),
                        radius: 15,
                        y: 4
                    )

                // Icon
                Image(systemName: speechRecognizer.isRecording ? "stop.fill" : "mic.fill")
                    .font(.system(size: 32))
                    .foregroundStyle(.white)
            }
        }
        .disabled(isParsing || !isAuthorized || !networkMonitor.isConnected)
        .opacity((isParsing || !isAuthorized || !networkMonitor.isConnected) ? 0.5 : 1.0)
        .scaleEffect(speechRecognizer.isRecording ? 1.1 : 1.0)
        .animation(.spring(response: 0.3, dampingFraction: 0.6), value: speechRecognizer.isRecording)
    }

    // MARK: - Status Text

    private var statusText: String {
        if isParsing { return "schedule.processing".localized }
        if speechRecognizer.isRecording { return "schedule.listening".localized }
        if !networkMonitor.isConnected { return "schedule.offline_message".localized }
        if !isAuthorized { return "Microphone access required" }
        return "schedule.tap_to_speak".localized
    }

    // MARK: - Offline Indicator

    private var offlineIndicator: some View {
        HStack(spacing: 8) {
            Image(systemName: "wifi.slash")
                .font(.system(size: 14))
            Text("schedule.offline_message".localized)
                .font(.system(size: 14))
        }
        .foregroundStyle(.orange)
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .liquidGlass(cornerRadius: 12)
    }

    // MARK: - Authorization Message

    private var authorizationMessage: some View {
        VStack(spacing: 8) {
            Text("Speech recognition requires permission")
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(theme.textSecondary(for: colorScheme))

            Button("Open Settings") {
                if let url = URL(string: UIApplication.openSettingsURLString) {
                    UIApplication.shared.open(url)
                }
            }
            .font(.system(size: 14, weight: .semibold))
            .foregroundStyle(theme.accentColor)
        }
        .padding()
        .liquidGlass(cornerRadius: 12)
    }

    // MARK: - Actions

    private func toggleRecording() {
        if speechRecognizer.isRecording {
            speechRecognizer.stopRecording()

            // Parse the transcript if we have one
            if !speechRecognizer.transcript.isEmpty {
                parseTranscript()
            }
        } else {
            do {
                try speechRecognizer.startRecording()
            } catch {
                errorMessage = "Could not start recording: \(error.localizedDescription)"
                showError = true
            }
        }
    }

    private func parseTranscript() {
        guard !speechRecognizer.transcript.isEmpty else { return }
        guard networkMonitor.isConnected else {
            errorMessage = "No internet connection"
            showError = true
            return
        }

        isParsing = true

        Task {
            do {
                guard taskParserService.isConfigured else {
                    // If OpenAI is not configured, create a simple fallback response
                    let simpleResult = TaskParseResult(
                        title: speechRecognizer.transcript.prefix(50).description,
                        description: speechRecognizer.transcript.count > 50 ? speechRecognizer.transcript : nil,
                        scheduledTime: nil,
                        endTime: nil,
                        duration: 30,
                        verificationType: VerificationType.check,
                        verificationConfig: nil,
                        exerciseConfig: nil,
                        voiceConfig: nil,
                        stepCountConfig: nil,
                        hasConflict: false,
                        conflictDetails: nil
                    )

                    let response = TaskParsingResponse(
                        tasks: [simpleResult],
                        hasConflicts: false,
                        conflictDetails: nil,
                        suggestedResolutions: nil,
                        requiresUserInput: false,
                        promptForUser: nil
                    )

                    await MainActor.run {
                        isParsing = false
                        onTaskCreated(response)
                        dismiss()
                    }
                    return
                }

                // Use same parsing as text input - with schedule context
                let taskSummaries = existingTasks.map { TaskSummary(from: $0) }

                #if DEBUG
                let dateFormatter = DateFormatter()
                dateFormatter.dateFormat = "yyyy-MM-dd"
                print("[VoiceInput] Parsing transcript:")
                print("  - selectedDate: \(dateFormatter.string(from: selectedDate))")
                print("  - existingTasks count: \(taskSummaries.count)")
                print("  - transcript: \(speechRecognizer.transcript)")
                #endif

                let response = try await taskParserService.parseTaskWithContext(
                    speechRecognizer.transcript,
                    forDate: selectedDate,
                    existingTasks: taskSummaries
                )

                #if DEBUG
                print("[VoiceInput] AI returned \(response.tasks.count) tasks")
                #endif

                await MainActor.run {
                    isParsing = false
                    onTaskCreated(response)
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isParsing = false
                    errorMessage = error.localizedDescription
                    showError = true
                }
            }
        }
    }
}

// MARK: - Preview

#Preview {
    VoiceInputView(
        selectedDate: Date(),
        existingTasks: []
    ) { response in
        print("Tasks created: \(response.tasks.count)")
    }
    .environment(ThemeService())
    .environment(TaskParserService())
}
