import SwiftUI

struct DetoxView: View {
    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService
    @Environment(BlockingService.self) private var blockingService

    @State private var isDetoxActive = false
    @State private var detoxDuration: Int = 30 // minutes
    @State private var remainingSeconds: Int = 0
    @State private var timer: Timer?

    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBackground.ignoresSafeArea()

                VStack(spacing: 32) {
                    Spacer()

                    // Timer Circle
                    timerCircle

                    // Status Text
                    VStack(spacing: 8) {
                        Text(isDetoxActive ? "Stay focused!" : "Digital Detox")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundStyle(isDark ? .white : .black)

                        Text(isDetoxActive ? "All distracting apps are blocked" : "Take a break from your phone")
                            .font(.system(size: 16))
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    // Duration Picker (when not active)
                    if !isDetoxActive {
                        durationPicker
                    }

                    // Start/Stop Button
                    actionButton

                    Spacer()
                        .frame(height: 60)
                }
                .padding(.horizontal, 20)
            }
            .navigationTitle("Detox")
        }
    }

    // MARK: - Timer Circle

    private var timerCircle: some View {
        ZStack {
            // Background circle
            Circle()
                .stroke(Color.secondary.opacity(0.2), lineWidth: 12)
                .frame(width: 260, height: 260)

            // Progress circle
            Circle()
                .trim(from: 0, to: progress)
                .stroke(
                    isDetoxActive ? themeService.accentColor : Color.secondary.opacity(0.3),
                    style: StrokeStyle(lineWidth: 12, lineCap: .round)
                )
                .frame(width: 260, height: 260)
                .rotationEffect(.degrees(-90))
                .animation(.linear(duration: 1), value: progress)

            // Inner content
            VStack(spacing: 8) {
                if isDetoxActive {
                    Text(formatTime(remainingSeconds))
                        .font(.system(size: 56, weight: .bold, design: .rounded))
                        .foregroundStyle(themeService.accentColor)
                        .monospacedDigit()

                    Text("remaining")
                        .font(.system(size: 14))
                        .foregroundStyle(.secondary)
                } else {
                    Image(systemName: "leaf.fill")
                        .font(.system(size: 60))
                        .foregroundStyle(themeService.accentColor)

                    Text("\(detoxDuration) min")
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundStyle(isDark ? .white : .black)
                }
            }
        }
    }

    private var progress: CGFloat {
        guard isDetoxActive else { return 0 }
        let total = detoxDuration * 60
        return CGFloat(remainingSeconds) / CGFloat(total)
    }

    // MARK: - Duration Picker

    private var durationPicker: some View {
        VStack(spacing: 12) {
            Text("DURATION")
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(.secondary)
                .tracking(0.5)

            HStack(spacing: 12) {
                DurationButton(minutes: 15, selected: detoxDuration == 15) {
                    detoxDuration = 15
                }
                DurationButton(minutes: 30, selected: detoxDuration == 30) {
                    detoxDuration = 30
                }
                DurationButton(minutes: 60, selected: detoxDuration == 60) {
                    detoxDuration = 60
                }
                DurationButton(minutes: 120, selected: detoxDuration == 120) {
                    detoxDuration = 120
                }
            }
        }
    }

    // MARK: - Action Button

    private var actionButton: some View {
        Button {
            if isDetoxActive {
                stopDetox()
            } else {
                startDetox()
            }
        } label: {
            HStack(spacing: 8) {
                Image(systemName: isDetoxActive ? "stop.fill" : "play.fill")
                    .font(.system(size: 18))
                Text(isDetoxActive ? "End Detox" : "Start Detox")
                    .font(.system(size: 17, weight: .semibold))
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 18)
            .background(
                isDetoxActive
                    ? AnyShapeStyle(Color.red)
                    : AnyShapeStyle(themeService.primaryGradient)
            )
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .shadow(color: (isDetoxActive ? Color.red : themeService.accentColor).opacity(0.3), radius: 10, y: 5)
        }
    }

    // MARK: - Timer Functions

    private func startDetox() {
        isDetoxActive = true
        remainingSeconds = detoxDuration * 60

        // Block all apps
        blockingService.applyBlocking()

        // Start timer
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
            if remainingSeconds > 0 {
                remainingSeconds -= 1
            } else {
                stopDetox()
            }
        }
    }

    private func stopDetox() {
        isDetoxActive = false
        timer?.invalidate()
        timer = nil
        remainingSeconds = 0

        // Note: Don't automatically unblock - user still needs to earn time
    }

    private func formatTime(_ seconds: Int) -> String {
        let mins = seconds / 60
        let secs = seconds % 60
        return String(format: "%02d:%02d", mins, secs)
    }
}

// MARK: - Duration Button

struct DurationButton: View {
    let minutes: Int
    let selected: Bool
    let action: () -> Void

    @Environment(ThemeService.self) private var themeService

    var body: some View {
        Button(action: action) {
            Text(formatDuration)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(selected ? .white : themeService.accentColor)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(
                    selected
                        ? AnyShapeStyle(themeService.primaryGradient)
                        : AnyShapeStyle(themeService.accentColor.opacity(0.1))
                )
                .clipShape(Capsule())
        }
    }

    private var formatDuration: String {
        if minutes < 60 {
            return "\(minutes)m"
        } else {
            return "\(minutes / 60)h"
        }
    }
}

#Preview {
    DetoxView()
        .environment(ThemeService())
        .environment(BlockingService())
}
