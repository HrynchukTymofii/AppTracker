import SwiftUI
import AVFoundation

/// Generic exercise view for hold-based exercises (wall sit, side plank)
struct GenericHoldExerciseView: View {
    let exerciseType: ExerciseType
    let cameraService: CameraService
    let exerciseDetection: ExerciseDetectionService
    let onComplete: (Int) -> Void // Returns seconds held

    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService

    @State private var isStarted = false
    @State private var showCompletionCelebration = false
    @State private var frameHandler: ExerciseFrameHandler?
    @State private var showInfoSheet = false

    private var rewardPerSecond: Double {
        exerciseType.rewardConfig.baseRate
    }

    private var currentReward: Double {
        exerciseDetection.plankDuration * rewardPerSecond
    }

    private var formattedReward: String {
        String(format: "%.1f", currentReward)
    }

    private var formattedDuration: String {
        let seconds = Int(exerciseDetection.plankDuration)
        return "\(seconds)"
    }

    // Colors
    private let greenColor = Color(red: 0.063, green: 0.725, blue: 0.506)
    private let redColor = Color(red: 0.937, green: 0.267, blue: 0.267)
    private let orangeColor = Color(red: 0.961, green: 0.620, blue: 0.043)

    var body: some View {
        ZStack {
            if !cameraService.hasPermission {
                permissionRequiredView
            } else {
                GeometryReader { geometry in
                    ZStack {
                        CameraPreviewView(session: cameraService.session)
                            .clipShape(RoundedRectangle(cornerRadius: 20))

                        if isStarted {
                            SkeletonOverlayView(
                                joints: exerciseDetection.detectedJoints,
                                isValid: exerciseDetection.isInCorrectForm
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 20))
                        }

                        VStack {
                            RoundedRectangle(cornerRadius: 2)
                                .fill(exerciseDetection.isInCorrectForm ? greenColor : redColor)
                                .frame(height: 4)
                            Spacer()
                        }
                        .clipShape(RoundedRectangle(cornerRadius: 20))

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
                                        Text(exerciseType.displayName)
                                            .font(.system(size: 17, weight: .bold))
                                            .foregroundStyle(.white)

                                        Text(exerciseType.localizedDescription)
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
                                centerTimer
                                Spacer()
                            }
                        }
                        .padding(20)
                    }
                }
                .padding(.horizontal, 0)

                VStack {
                    Spacer()
                    actionButton
                        .padding(.horizontal, 20)
                        .padding(.bottom, 30)
                }

                if showCompletionCelebration {
                    celebrationOverlay
                }
            }
        }
        .background(Color.black)
        .onAppear {
            let handler = ExerciseFrameHandler(detection: exerciseDetection, type: exerciseType)
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
            ExerciseInfoSheet(exerciseType: exerciseType) {
                showInfoSheet = false
            }
            .presentationDetents([.medium, .large])
            .presentationDragIndicator(.visible)
        }
    }

    private var instructionsCard: some View {
        VStack(spacing: 16) {
            if let imageName = exerciseType.imageName, let uiImage = UIImage(named: imageName) {
                Image(uiImage: uiImage)
                    .resizable()
                    .scaledToFit()
                    .frame(width: 75, height: 75)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            } else {
                Text(exerciseType.emoji)
                    .font(.system(size: 50))
            }

            Text(exerciseType.displayName)
                .font(.system(size: 28, weight: .bold))
                .foregroundStyle(.white)

            Text(exerciseType.rewardDescription)
                .font(.system(size: 16))
                .foregroundStyle(.white.opacity(0.8))
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            HStack(spacing: 16) {
                VStack(spacing: 4) {
                    Text("\(String(format: "%.2f", rewardPerSecond))")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundStyle(greenColor)
                    Text(L10n.Exercise.minPerSec)
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

    private var centerTimer: some View {
        VStack(spacing: 8) {
            Text(formattedDuration)
                .font(.system(size: 56, weight: .heavy))
                .foregroundStyle(.white)
                .contentTransition(.numericText())
                .animation(.spring(response: 0.3), value: Int(exerciseDetection.plankDuration))

            Text(exerciseType.unit)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(.white.opacity(0.9))
                .tracking(1)

            Text(exerciseDetection.isInCorrectForm ? L10n.Exercise.holdIt : L10n.Exercise.getInPosition)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(.white)
                .padding(.top, 4)
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
        } else {
            return greenColor
        }
    }

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
                    if isStarted && exerciseDetection.plankDuration > 0 {
                        RoundedRectangle(cornerRadius: 16).fill(greenColor)
                    } else {
                        RoundedRectangle(cornerRadius: 16).fill(themeService.primaryGradient)
                    }
                }
        }
    }

    private var buttonText: String {
        if !isStarted {
            return L10n.Exercise.startExercise(exerciseType.displayName)
        } else if exerciseDetection.plankDuration > 0 {
            return L10n.Exercise.finishWithReward(formattedReward)
        } else {
            return L10n.Exercise.getInPosition
        }
    }

    private var permissionRequiredView: some View {
        VStack(spacing: 24) {
            Spacer()
            Image(systemName: "camera.fill")
                .font(.system(size: 60))
                .foregroundStyle(.white.opacity(0.5))
            Text(L10n.Exercise.cameraRequired)
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(.white)
            Text(L10n.Exercise.cameraPermissionMessage)
                .font(.system(size: 16))
                .foregroundStyle(.white.opacity(0.7))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            Button {
                if AVCaptureDevice.authorizationStatus(for: .video) == .denied {
                    if let url = URL(string: UIApplication.openSettingsURLString) {
                        UIApplication.shared.open(url)
                    }
                } else {
                    cameraService.ensurePermission()
                }
            } label: {
                Text(L10n.Exercise.enableCamera)
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

                Text("\(formattedDuration) \(exerciseType.unit)")
                    .font(.system(size: 18))
                    .foregroundStyle(.white.opacity(0.8))

                Text("+\(formattedReward) \(L10n.LockIn.minutes) \(L10n.LockIn.earned)")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundStyle(themeService.accentColor)
            }
        }
        .transition(.opacity)
    }

    private func startExercise() {
        withAnimation {
            isStarted = true
        }
        exerciseDetection.startDetection(type: exerciseType, target: 999)
    }

    private func finishExercise() {
        guard exerciseDetection.plankDuration > 0 else { return }

        withAnimation {
            showCompletionCelebration = true
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            onComplete(Int(exerciseDetection.plankDuration))
        }
    }
}
