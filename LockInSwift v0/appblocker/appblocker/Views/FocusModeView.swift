import SwiftUI

struct FocusModeView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.scenePhase) private var scenePhase
    @Environment(BlockingService.self) private var blockingService
    @Environment(TimeBankService.self) private var timeBank

    // Timer state - persisted
    @State private var totalSeconds: Int = 30 * 60
    @State private var remainingSeconds: Int = 30 * 60
    @State private var isRunning = false
    @State private var isPaused = false
    @State private var timer: Timer?
    @State private var showCompletionView = false
    @State private var earnedMinutes: Double = 0

    // Settings
    @State private var selectedDuration: Int = 30 // minutes

    private var isDark: Bool { colorScheme == .dark }
    private let focusColor = Color(hex: "8b5cf6") // Purple

    // Duration options
    private let durationOptions = [15, 25, 30, 45, 60, 90]

    // UserDefaults keys
    private let defaults = UserDefaults(suiteName: "group.com.hrynchuk.appblocker")
    private let startTimeKey = "focus.session.startTime"
    private let totalDurationKey = "focus.session.totalDuration"
    private let isPausedKey = "focus.session.isPaused"
    private let pausedRemainingKey = "focus.session.pausedRemaining"

    var body: some View {
        NavigationStack {
            ZStack {
                // Background
                LinearGradient(
                    colors: isDark
                        ? [Color(hex: "0a0a14"), Color(hex: "0f0a1a")]
                        : [Color(hex: "f8fafc"), Color(hex: "f1f5f9")],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()

                VStack(spacing: 0) {
                    if showCompletionView {
                        completionView
                    } else if isRunning {
                        activeTimerView
                    } else {
                        setupView
                    }
                }
            }
            .navigationTitle(isRunning ? L10n.Focus.focusSession : L10n.Focus.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    if !isRunning {
                        Button(L10n.Focus.cancel) { dismiss() }
                    }
                }
            }
        }
        .onAppear {
            restoreSessionIfNeeded()
        }
        .onChange(of: scenePhase) { _, newPhase in
            handleScenePhaseChange(newPhase)
        }
        .onDisappear {
            // Don't invalidate timer or clear state - session continues in background
        }
    }

    // MARK: - Setup View

    private var setupView: some View {
        VStack(spacing: 32) {
            Spacer()

            // Icon
            ZStack {
                Circle()
                    .fill(focusColor.opacity(0.15))
                    .frame(width: 120, height: 120)

                Circle()
                    .fill(focusColor.opacity(0.1))
                    .frame(width: 100, height: 100)

                Image(systemName: "brain.head.profile")
                    .font(.system(size: 48))
                    .foregroundStyle(focusColor)
            }

            // Title
            VStack(spacing: 8) {
                Text(L10n.Focus.deepFocus)
                    .font(.system(size: 28, weight: .bold))
                    .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))

                Text(L10n.Focus.description)
                    .font(.system(size: 15))
                    .foregroundStyle(isDark ? Color.white.opacity(0.6) : Color(hex: "64748b"))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
            }

            Spacer()

            // Duration selector
            VStack(alignment: .leading, spacing: 16) {
                Text(L10n.Focus.sessionDuration)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(isDark ? Color.white.opacity(0.7) : Color(hex: "475569"))
                    .padding(.horizontal, 20)

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(durationOptions, id: \.self) { minutes in
                            DurationChip(
                                minutes: minutes,
                                isSelected: selectedDuration == minutes,
                                color: focusColor,
                                isDark: isDark
                            ) {
                                withAnimation(.spring(response: 0.3)) {
                                    selectedDuration = minutes
                                    totalSeconds = minutes * 60
                                    remainingSeconds = minutes * 60
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                }
            }

            // What will happen
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 12) {
                    Image(systemName: "shield.fill")
                        .font(.system(size: 16))
                        .foregroundStyle(focusColor)
                    Text(L10n.Focus.appsBlocked)
                        .font(.system(size: 14))
                        .foregroundStyle(isDark ? Color.white.opacity(0.7) : Color(hex: "475569"))
                }

                HStack(spacing: 12) {
                    Image(systemName: "clock.fill")
                        .font(.system(size: 16))
                        .foregroundStyle(focusColor)
                    Text(L10n.Focus.earnMinutes(Int(Double(selectedDuration) * 0.5)))
                        .font(.system(size: 14))
                        .foregroundStyle(isDark ? Color.white.opacity(0.7) : Color(hex: "475569"))
                }

                HStack(spacing: 12) {
                    Image(systemName: "bell.slash.fill")
                        .font(.system(size: 16))
                        .foregroundStyle(focusColor)
                    Text(L10n.Focus.noInterruptions)
                        .font(.system(size: 14))
                        .foregroundStyle(isDark ? Color.white.opacity(0.7) : Color(hex: "475569"))
                }
            }
            .padding(20)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(isDark ? Color.white.opacity(0.03) : .white)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(isDark ? Color.white.opacity(0.06) : Color.black.opacity(0.03), lineWidth: 0.5)
            )
            .padding(.horizontal, 20)

            Spacer()

            // Start button
            Button {
                startFocusSession()
            } label: {
                HStack(spacing: 12) {
                    Image(systemName: "play.fill")
                        .font(.system(size: 18))
                    Text(L10n.Focus.start)
                        .font(.system(size: 17, weight: .bold))
                }
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 18)
                .background(
                    LinearGradient(
                        colors: [focusColor, Color(hex: "6d28d9")],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .shadow(color: focusColor.opacity(0.3), radius: 12, y: 6)
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 40)
        }
    }

    // MARK: - Active Timer View

    private var activeTimerView: some View {
        VStack(spacing: 40) {
            Spacer()

            // Circular timer
            ZStack {
                // Background circle
                Circle()
                    .stroke(isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.03), lineWidth: 12)
                    .frame(width: 280, height: 280)

                // Progress circle
                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(
                        LinearGradient(
                            colors: [focusColor, Color(hex: "6d28d9")],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        style: StrokeStyle(lineWidth: 12, lineCap: .round)
                    )
                    .frame(width: 280, height: 280)
                    .rotationEffect(.degrees(-90))
                    .animation(.linear(duration: 1), value: progress)

                // Glow effect
                Circle()
                    .stroke(focusColor.opacity(0.3), lineWidth: 20)
                    .frame(width: 280, height: 280)
                    .blur(radius: 10)

                // Time display
                VStack(spacing: 8) {
                    Text(formattedTime)
                        .font(.system(size: 56, weight: .bold, design: .rounded))
                        .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                        .monospacedDigit()

                    Text(isPaused ? L10n.Focus.paused : L10n.Focus.remaining)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(isDark ? Color.white.opacity(0.5) : Color(hex: "64748b"))
                }
            }

            // Status
            VStack(spacing: 8) {
                HStack(spacing: 8) {
                    Circle()
                        .fill(isPaused ? Color(hex: "f59e0b") : Color(hex: "10b981"))
                        .frame(width: 8, height: 8)
                    Text(isPaused ? L10n.Focus.sessionPaused : L10n.Focus.focusActive)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                }

                Text(L10n.Focus.allBlocked)
                    .font(.system(size: 13))
                    .foregroundStyle(isDark ? Color.white.opacity(0.5) : Color(hex: "64748b"))
            }

            Spacer()

            // Control buttons
            HStack(spacing: 20) {
                // Cancel button
                Button {
                    endSession(completed: false)
                } label: {
                    VStack(spacing: 6) {
                        Image(systemName: "xmark")
                            .font(.system(size: 20, weight: .semibold))
                        Text(L10n.Focus.end)
                            .font(.system(size: 12, weight: .medium))
                    }
                    .foregroundStyle(Color(hex: "ef4444"))
                    .frame(width: 70, height: 70)
                    .background(
                        Circle()
                            .fill(Color(hex: "ef4444").opacity(0.15))
                    )
                }

                // Pause/Resume button
                Button {
                    togglePause()
                } label: {
                    VStack(spacing: 6) {
                        Image(systemName: isPaused ? "play.fill" : "pause.fill")
                            .font(.system(size: 24, weight: .semibold))
                        Text(isPaused ? L10n.Focus.resume : L10n.Focus.pause)
                            .font(.system(size: 12, weight: .medium))
                    }
                    .foregroundStyle(.white)
                    .frame(width: 90, height: 90)
                    .background(
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [focusColor, Color(hex: "6d28d9")],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                    )
                    .shadow(color: focusColor.opacity(0.4), radius: 12, y: 6)
                }

                // Add time button
                Button {
                    addTime()
                } label: {
                    VStack(spacing: 6) {
                        Image(systemName: "plus")
                            .font(.system(size: 20, weight: .semibold))
                        Text(L10n.Focus.addTime)
                            .font(.system(size: 12, weight: .medium))
                    }
                    .foregroundStyle(focusColor)
                    .frame(width: 70, height: 70)
                    .background(
                        Circle()
                            .fill(focusColor.opacity(0.15))
                    )
                }
            }
            .padding(.bottom, 60)
        }
    }

    // MARK: - Completion View

    private var completionView: some View {
        VStack(spacing: 32) {
            Spacer()

            // Checkmark animation
            ZStack {
                Circle()
                    .fill(Color(hex: "10b981").opacity(0.15))
                    .frame(width: 140, height: 140)

                Circle()
                    .fill(Color(hex: "10b981").opacity(0.1))
                    .frame(width: 120, height: 120)

                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 80))
                    .foregroundStyle(Color(hex: "10b981"))
            }

            VStack(spacing: 12) {
                Text(L10n.Focus.complete)
                    .font(.system(size: 32, weight: .bold))
                    .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))

                Text(L10n.Focus.completedSession(totalSeconds / 60))
                    .font(.system(size: 16))
                    .foregroundStyle(isDark ? Color.white.opacity(0.6) : Color(hex: "64748b"))
            }

            // Reward card
            VStack(spacing: 16) {
                HStack(spacing: 16) {
                    ZStack {
                        Circle()
                            .fill(Color(hex: "10b981").opacity(0.15))
                            .frame(width: 56, height: 56)
                        Image(systemName: "clock.badge.checkmark.fill")
                            .font(.system(size: 24))
                            .foregroundStyle(Color(hex: "10b981"))
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        Text(L10n.Focus.timeEarned)
                            .font(.system(size: 13))
                            .foregroundStyle(isDark ? Color.white.opacity(0.5) : Color(hex: "64748b"))
                        Text("+\(String(format: "%.0f", earnedMinutes)) \(L10n.LockIn.minutes)")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundStyle(Color(hex: "10b981"))
                    }

                    Spacer()
                }
            }
            .padding(20)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(isDark ? Color.white.opacity(0.03) : .white)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(Color(hex: "10b981").opacity(0.2), lineWidth: 1)
            )
            .padding(.horizontal, 20)

            Spacer()

            // Done button
            Button {
                dismiss()
            } label: {
                Text(L10n.Common.done)
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 18)
                    .background(
                        LinearGradient(
                            colors: [Color(hex: "10b981"), Color(hex: "059669")],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 16))
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 40)
        }
    }

    // MARK: - Computed Properties

    private var progress: Double {
        guard totalSeconds > 0 else { return 0 }
        return Double(remainingSeconds) / Double(totalSeconds)
    }

    private var formattedTime: String {
        let minutes = remainingSeconds / 60
        let seconds = remainingSeconds % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }

    // MARK: - Session Persistence

    private func saveSessionState() {
        guard let defaults = defaults else { return }

        if isRunning && !isPaused {
            // Save start time for active session
            let endTime = Date().addingTimeInterval(TimeInterval(remainingSeconds))
            defaults.set(endTime.timeIntervalSince1970, forKey: startTimeKey)
            defaults.set(totalSeconds, forKey: totalDurationKey)
            defaults.set(false, forKey: isPausedKey)
        } else if isPaused {
            // Save paused state
            defaults.set(remainingSeconds, forKey: pausedRemainingKey)
            defaults.set(totalSeconds, forKey: totalDurationKey)
            defaults.set(true, forKey: isPausedKey)
        }

        defaults.synchronize()
    }

    private func restoreSessionIfNeeded() {
        guard let defaults = defaults else { return }

        let isPausedState = defaults.bool(forKey: isPausedKey)
        let savedTotalDuration = defaults.integer(forKey: totalDurationKey)

        if savedTotalDuration > 0 {
            totalSeconds = savedTotalDuration

            if isPausedState {
                // Restore paused session
                let pausedRemaining = defaults.integer(forKey: pausedRemainingKey)
                if pausedRemaining > 0 {
                    remainingSeconds = pausedRemaining
                    isRunning = true
                    isPaused = true
                    // Ensure blocking is active
                    blockingService.startFocusMode()
                }
            } else {
                // Restore running session - calculate remaining time
                let endTimeStamp = defaults.double(forKey: startTimeKey)
                if endTimeStamp > 0 {
                    let endTime = Date(timeIntervalSince1970: endTimeStamp)
                    let remaining = Int(endTime.timeIntervalSinceNow)

                    if remaining > 0 {
                        // Session still active
                        remainingSeconds = remaining
                        isRunning = true
                        isPaused = false
                        // Ensure blocking is active
                        blockingService.startFocusMode()
                        startTimer()
                    } else {
                        // Session completed while away
                        remainingSeconds = 0
                        completeSession()
                    }
                }
            }
        }
    }

    private func clearSessionState() {
        guard let defaults = defaults else { return }
        defaults.removeObject(forKey: startTimeKey)
        defaults.removeObject(forKey: totalDurationKey)
        defaults.removeObject(forKey: isPausedKey)
        defaults.removeObject(forKey: pausedRemainingKey)
        defaults.synchronize()
    }

    private func handleScenePhaseChange(_ phase: ScenePhase) {
        switch phase {
        case .active:
            // App came to foreground - restore session
            if isRunning {
                restoreSessionIfNeeded()
            }
        case .inactive, .background:
            // App going to background - save state
            if isRunning {
                timer?.invalidate()
                saveSessionState()
            }
        @unknown default:
            break
        }
    }

    // MARK: - Timer Actions

    private func startFocusSession() {
        totalSeconds = selectedDuration * 60
        remainingSeconds = totalSeconds
        isRunning = true
        isPaused = false

        // Enable blocking for all apps
        blockingService.startFocusMode()

        // Save state
        saveSessionState()

        startTimer()
    }

    private func startTimer() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
            if remainingSeconds > 0 {
                remainingSeconds -= 1
            } else {
                completeSession()
            }
        }
    }

    private func togglePause() {
        isPaused.toggle()
        if isPaused {
            timer?.invalidate()
        } else {
            startTimer()
        }
        saveSessionState()
    }

    private func addTime() {
        remainingSeconds += 5 * 60 // Add 5 minutes
        totalSeconds += 5 * 60
        saveSessionState()
    }

    private func completeSession() {
        timer?.invalidate()
        isRunning = false

        // Calculate reward (0.5 minutes per minute focused)
        let focusedMinutes = Double(totalSeconds - remainingSeconds) / 60.0
        earnedMinutes = focusedMinutes * 0.5

        // Award time
        if earnedMinutes > 0 {
            timeBank.earn(minutes: earnedMinutes, source: .focusSession(minutes: Int(focusedMinutes)), note: "Focus session completed")
        }

        // End focus mode blocking
        blockingService.endFocusMode()

        // Clear saved state
        clearSessionState()

        showCompletionView = true
    }

    private func endSession(completed: Bool) {
        timer?.invalidate()

        if completed {
            completeSession()
        } else {
            // Partial reward for time already spent
            let focusedSeconds = totalSeconds - remainingSeconds
            if focusedSeconds >= 60 { // At least 1 minute
                let focusedMinutes = Double(focusedSeconds) / 60.0
                earnedMinutes = focusedMinutes * 0.25 // 25% reward for incomplete
                timeBank.earn(minutes: earnedMinutes, source: .focusSession(minutes: Int(focusedMinutes)), note: "Partial focus session")
            }

            blockingService.endFocusMode()
            clearSessionState()
            dismiss()
        }
    }
}

// MARK: - Duration Chip

private struct DurationChip: View {
    let minutes: Int
    let isSelected: Bool
    let color: Color
    let isDark: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text("\(minutes)m")
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(isSelected ? .white : (isDark ? Color.white.opacity(0.7) : Color(hex: "475569")))
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(
                            isSelected
                                ? LinearGradient(
                                    colors: [color, Color(hex: "6d28d9")],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                  )
                                : LinearGradient(
                                    colors: [isDark ? Color.white.opacity(0.06) : Color.black.opacity(0.03)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                  )
                        )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(isSelected ? color.opacity(0.3) : .clear, lineWidth: 1)
                )
                .shadow(color: isSelected ? color.opacity(0.3) : .clear, radius: 8, y: 4)
        }
    }
}

#Preview {
    FocusModeView()
        .environment(BlockingService())
        .environment(TimeBankService())
}
