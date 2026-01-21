import SwiftUI
import AVFoundation

/// Pushup exercise view - counts per rep and gives rewards progressively
struct PushupExerciseView: View {
    let cameraService: CameraService
    let exerciseDetection: ExerciseDetectionService
    let onComplete: (Int) -> Void // Returns actual rep count

    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService

    @State private var isStarted = false
    @State private var showCompletionCelebration = false
    @State private var frameHandler: ExerciseFrameHandler?
    @State private var showInfoSheet = false

    // Reward rate: 0.5 min per rep
    private let rewardPerRep: Double = 0.5

    private var currentReward: Double {
        Double(exerciseDetection.currentCount) * rewardPerRep
    }

    private var formattedReward: String {
        String(format: "%.1f", currentReward)
    }

    // Colors matching RN app
    private let greenColor = Color(red: 0.063, green: 0.725, blue: 0.506) // #10b981
    private let redColor = Color(red: 0.937, green: 0.267, blue: 0.267) // #ef4444
    private let orangeColor = Color(red: 0.961, green: 0.620, blue: 0.043) // #f59e0b

    var body: some View {
        ZStack {
            if !cameraService.hasPermission {
                // Permission required view
                permissionRequiredView
            } else {
                // Camera container with rounded corners
                GeometryReader { geometry in
                    ZStack {
                        // Camera preview
                        CameraPreviewView(session: cameraService.session)
                            .clipShape(RoundedRectangle(cornerRadius: 20))

                    // Skeleton overlay - only show when exercise started
                    if isStarted {
                        SkeletonOverlayView(
                            joints: exerciseDetection.detectedJoints,
                            isValid: exerciseDetection.isInCorrectForm
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                    }

                    // Form indicator bar at top
                    VStack {
                        RoundedRectangle(cornerRadius: 2)
                            .fill(exerciseDetection.isInCorrectForm ? greenColor : redColor)
                            .frame(height: 4)
                        Spacer()
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 20))

                    // Overlay content
                    VStack {
                        // Top bar with header and controls
                        HStack {
                            // Left: Barbell icon + Title + Description
                            HStack(spacing: 12) {
                                // Barbell icon with green glassy bg
                                ZStack {
                                    RoundedRectangle(cornerRadius: 12)
                                        .fill(.ultraThinMaterial)
                                        .frame(width: 44, height: 44)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 12)
                                                .fill(greenColor.opacity(0.15))
                                        )

                                    Image(systemName: "dumbbell.fill")
                                        .font(.system(size: 18, weight: .semibold))
                                        .foregroundStyle(greenColor)
                                }

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(L10n.Exercise.pushups)
                                        .font(.system(size: 17, weight: .bold))
                                        .foregroundStyle(.white)

                                    Text(ExerciseType.pushups.localizedDescription)
                                        .font(.system(size: 12))
                                        .foregroundStyle(.white.opacity(0.6))
                                        .lineLimit(1)
                                }
                            }

                            Spacer()

                            // Right: Reward + Info button
                            HStack(spacing: 10) {
                                if isStarted {
                                    HStack(spacing: 4) {
                                        Image(systemName: "clock.fill")
                                            .font(.system(size: 14))
                                        Text("+\(formattedReward) min")
                                            .font(.system(size: 16, weight: .bold))
                                    }
                                    .foregroundStyle(greenColor)
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 10)
                                    .background(.ultraThinMaterial)
                                    .clipShape(RoundedRectangle(cornerRadius: 16))
                                }

                                // Info button with border only (hidden when started)
                                if !isStarted {
                                    Button {
                                        showInfoSheet = true
                                    } label: {
                                        ZStack {
                                            Circle()
                                                .stroke(greenColor, lineWidth: 2)
                                                .frame(width: 38, height: 38)

                                            Image(systemName: "info")
                                                .font(.system(size: 16, weight: .semibold))
                                                .foregroundStyle(greenColor)
                                        }
                                    }
                                }
                            }
                        }
                        .padding(.top, 16)

                        Spacer()

                        if !isStarted {
                            instructionsCard
                                .padding(.bottom, 100)
                        } else {
                            // Center counter
                            centerCounter
                            Spacer()
                        }
                    }
                    .padding(20)
                }
            }
            .padding(.horizontal, 0)

            // Bottom button (outside camera area)
            VStack {
                Spacer()
                actionButton
                    .padding(.horizontal, 20)
                    .padding(.bottom, 30)
            }

            // Celebration overlay
            if showCompletionCelebration {
                celebrationOverlay
            }
            }
        }
        .background(Color.black)
        .onAppear {
            let handler = ExerciseFrameHandler(detection: exerciseDetection, type: .pushups)
            frameHandler = handler
            cameraService.frameDelegate = handler
            cameraService.ensurePermission()
            cameraService.start()
        }
        .onDisappear {
            cameraService.stop()
            exerciseDetection.reset()
        }
        .sheet(isPresented: $showInfoSheet) {
            ExerciseInfoSheet(exerciseType: .pushups) {
                showInfoSheet = false
            }
            .presentationDetents([.medium, .large])
            .presentationDragIndicator(.visible)
        }
    }

    // MARK: - Instructions Card

    private var instructionsCard: some View {
        VStack(spacing: 16) {
            if let uiImage = UIImage(named: "pushups") {
                Image(uiImage: uiImage)
                    .resizable()
                    .scaledToFit()
                    .frame(width: 75, height: 75)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            } else {
                Text("💪")
                    .font(.system(size: 50))
            }

            Text(L10n.Exercise.doPushups)
                .font(.system(size: 28, weight: .bold))
                .foregroundStyle(.white)

            Text(L10n.Exercise.pushupInstructions)
                .font(.system(size: 16))
                .foregroundStyle(.white.opacity(0.8))
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            // Rate info
            HStack(spacing: 16) {
                VStack(spacing: 4) {
                    Text("\(String(format: "%.1f", rewardPerRep))")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundStyle(greenColor)
                    Text(L10n.Exercise.minPerRep)
                        .font(.system(size: 12))
                        .foregroundStyle(.white.opacity(0.7))
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .background(greenColor.opacity(0.2))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .padding(24)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 24))
    }

    // MARK: - Center Counter

    private var centerCounter: some View {
        VStack(spacing: 8) {
            Text("\(exerciseDetection.currentCount)")
                .font(.system(size: 56, weight: .heavy))
                .foregroundStyle(.white)
                .contentTransition(.numericText())
                .animation(.spring(response: 0.3), value: exerciseDetection.currentCount)

            Text(L10n.Exercise.pushupsLabel)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(.white.opacity(0.9))
                .tracking(1)

            if exerciseDetection.isInCorrectForm {
                Text(phaseText)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white)
                    .padding(.top, 4)
            }
        }
        .padding(.horizontal, 32)
        .padding(.vertical, 16)
        .background(containerColor.opacity(0.6))
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(containerColor, lineWidth: 2)
        )
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }

    private var containerColor: Color {
        if !exerciseDetection.isInCorrectForm {
            return redColor
        } else if exerciseDetection.currentPhase == .down {
            return orangeColor
        } else {
            return greenColor
        }
    }

    private var phaseText: String {
        switch exerciseDetection.currentPhase {
        case .down: return "⬇️ \(L10n.Exercise.down)"
        case .up: return "⬆️ \(L10n.Exercise.up)"
        case .unknown: return "..."
        }
    }

    // MARK: - Action Button

    private var actionButton: some View {
        Button {
            if !isStarted {
                startExercise()
            } else {
                finishExercise()
            }
        } label: {
            Text(buttonText)
                .font(.system(size: 17, weight: .bold))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 18)
                .background {
                    if isStarted && exerciseDetection.currentCount > 0 {
                        RoundedRectangle(cornerRadius: 16).fill(greenColor)
                    } else {
                        RoundedRectangle(cornerRadius: 16).fill(themeService.primaryGradient)
                    }
                }
        }
    }

    private var buttonText: String {
        if !isStarted {
            return L10n.Exercise.startPushups
        } else if exerciseDetection.currentCount > 0 {
            return L10n.Exercise.finishWithReward(formattedReward)
        } else {
            return L10n.Exercise.doSomePushups
        }
    }

    // MARK: - Permission Required View

    private var permissionRequiredView: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "camera.fill")
                .font(.system(size: 60))
                .foregroundStyle(.white.opacity(0.5))

            Text(L10n.Exercise.cameraRequired)
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(.white)

            Text(L10n.Exercise.cameraTrackingPushups())
                .font(.system(size: 16))
                .foregroundStyle(.white.opacity(0.7))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)

            Button {
                if AVCaptureDevice.authorizationStatus(for: .video) == .denied {
                    // Open settings if denied
                    if let url = URL(string: UIApplication.openSettingsURLString) {
                        UIApplication.shared.open(url)
                    }
                } else {
                    cameraService.ensurePermission()
                }
            } label: {
                Text(AVCaptureDevice.authorizationStatus(for: .video) == .denied ? L10n.Exercise.openSettings : L10n.Exercise.enableCamera)
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(themeService.primaryGradient)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            .padding(.horizontal, 40)

            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.black)
    }

    // MARK: - Celebration Overlay

    private var celebrationOverlay: some View {
        ZStack {
            Color.black.opacity(0.7)
                .ignoresSafeArea()

            VStack(spacing: 24) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 80))
                    .foregroundStyle(greenColor)

                Text(L10n.Exercise.greatJob)
                    .font(.system(size: 32, weight: .bold))
                    .foregroundStyle(.white)

                Text(L10n.Exercise.didPushups(exerciseDetection.currentCount))
                    .font(.system(size: 18))
                    .foregroundStyle(.white.opacity(0.8))

                Text("+\(formattedReward) \(L10n.LockIn.minutes) \(L10n.LockIn.earned)")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundStyle(themeService.accentColor)
            }
        }
        .transition(.opacity)
    }

    // MARK: - Helpers

    private func startExercise() {
        withAnimation {
            isStarted = true
        }
        exerciseDetection.startDetection(type: .pushups, target: 999) // No real target, just count
    }

    private func finishExercise() {
        guard exerciseDetection.currentCount > 0 else { return }

        withAnimation {
            showCompletionCelebration = true
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            onComplete(exerciseDetection.currentCount)
        }
    }
}

// MARK: - Frame Handler

class ExerciseFrameHandler: CameraFrameDelegate {
    let detection: ExerciseDetectionService
    let type: ExerciseType

    init(detection: ExerciseDetectionService, type: ExerciseType) {
        self.detection = detection
        self.type = type
    }

    func cameraService(_ service: CameraService, didOutput sampleBuffer: CMSampleBuffer) {
        detection.processFrame(sampleBuffer, for: type)
    }
}
