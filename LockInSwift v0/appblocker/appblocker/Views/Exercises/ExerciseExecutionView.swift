import SwiftUI
import AVFoundation

/// Main container that routes to specific exercise views based on type
struct ExerciseExecutionView: View {
    let exerciseType: ExerciseType
    let target: Int
    let reward: Int
    let onComplete: (ExerciseTask) -> Void

    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService
    @Environment(TimeBankService.self) private var timeBank

    @State private var cameraService = CameraService()
    @State private var exerciseDetection = ExerciseDetectionService()
    @State private var showPermissionDenied = false

    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        Group {
            if !cameraService.hasPermission {
                permissionRequiredView
            } else {
                exerciseContent
            }
        }
        .onAppear {
            // Check permission status and request if needed
            let status = AVCaptureDevice.authorizationStatus(for: .video)
            if status == .notDetermined {
                // Request permission - this will show the system dialog
                AVCaptureDevice.requestAccess(for: .video) { granted in
                    DispatchQueue.main.async {
                        if granted {
                            cameraService.checkPermission()
                        } else {
                            showPermissionDenied = true
                        }
                    }
                }
            } else if status == .denied || status == .restricted {
                // Already denied - show settings alert immediately
                showPermissionDenied = true
            } else {
                cameraService.checkPermission()
            }
        }
        .alert(L10n.Exercise.cameraRequired, isPresented: $showPermissionDenied) {
            Button(L10n.Exercise.openSettings) {
                if let url = URL(string: UIApplication.openSettingsURLString) {
                    UIApplication.shared.open(url)
                }
            }
            Button(L10n.Common.cancel, role: .cancel) {
                dismiss()
            }
        } message: {
            Text(L10n.Exercise.cameraPermissionMessage)
        }
        .onChange(of: cameraService.hasPermission) { _, newValue in
            if !newValue && cameraService.error != nil {
                showPermissionDenied = true
            }
        }
    }

    @ViewBuilder
    private var exerciseContent: some View {
        switch exerciseType {
        case .pushups:
            PushupExerciseView(
                cameraService: cameraService,
                exerciseDetection: exerciseDetection,
                onComplete: { count in handleCompleteWithCount(count, rewardPerUnit: 0.5) }
            )
        case .squats:
            SquatExerciseView(
                cameraService: cameraService,
                exerciseDetection: exerciseDetection,
                onComplete: { count in handleCompleteWithCount(count, rewardPerUnit: 0.3) }
            )
        case .plank:
            PlankExerciseView(
                cameraService: cameraService,
                exerciseDetection: exerciseDetection,
                onComplete: { seconds in handleCompleteWithCount(seconds, rewardPerUnit: 0.1) }
            )
        case .photoVerification:
            PhotoTaskView(
                cameraService: cameraService,
                onComplete: handleCompleteWithDynamicReward
            )
        // Rep-based exercises
        case .jumpingJacks, .lunges, .crunches, .shoulderPress, .legRaises, .highKnees, .pullUps:
            GenericRepExerciseView(
                exerciseType: exerciseType,
                cameraService: cameraService,
                exerciseDetection: exerciseDetection,
                onComplete: { count in
                    handleCompleteWithCount(count, rewardPerUnit: exerciseType.rewardConfig.baseRate)
                }
            )
        // Hold-based exercises
        case .wallSit, .sidePlank:
            GenericHoldExerciseView(
                exerciseType: exerciseType,
                cameraService: cameraService,
                exerciseDetection: exerciseDetection,
                onComplete: { seconds in
                    handleCompleteWithCount(seconds, rewardPerUnit: exerciseType.rewardConfig.baseRate)
                }
            )
        case .custom:
            PhotoTaskView(
                cameraService: cameraService,
                onComplete: handleCompleteWithDynamicReward
            )
        }
    }

    private var permissionRequiredView: some View {
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
                Spacer()

                Image(systemName: "camera.fill")
                    .font(.system(size: 60))
                    .foregroundStyle(themeService.accentColor)

                Text(L10n.Exercise.cameraRequired)
                    .font(.system(size: 24, weight: .bold))
                    .foregroundStyle(isDark ? .white : .black)

                Text(L10n.Exercise.cameraPermissionMessage)
                    .font(.system(size: 16))
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)

                Button {
                    requestCameraPermission()
                } label: {
                    Text(permissionButtonText)
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

    private var permissionButtonText: String {
        let status = AVCaptureDevice.authorizationStatus(for: .video)
        if status == .denied || status == .restricted {
            return L10n.Exercise.openSettings
        }
        return L10n.Exercise.enableCamera
    }

    private func requestCameraPermission() {
        let status = AVCaptureDevice.authorizationStatus(for: .video)
        if status == .denied || status == .restricted {
            // Open Settings
            if let url = URL(string: UIApplication.openSettingsURLString) {
                UIApplication.shared.open(url)
            }
        } else if status == .notDetermined {
            // Request permission
            AVCaptureDevice.requestAccess(for: .video) { granted in
                DispatchQueue.main.async {
                    if granted {
                        cameraService.checkPermission()
                    } else {
                        showPermissionDenied = true
                    }
                }
            }
        } else {
            cameraService.checkPermission()
        }
    }

    private func handleComplete() {
        cameraService.stop()

        let task = ExerciseTask(type: exerciseType)
        task.target = target
        task.reward = reward
        task.status = .completed
        task.progress = target

        onComplete(task)
        dismiss()
    }

    private func handleCompleteWithCount(_ count: Int, rewardPerUnit: Double) {
        cameraService.stop()

        let calculatedReward = Double(count) * rewardPerUnit
        let task = ExerciseTask(type: exerciseType)
        task.target = count
        task.reward = Int(calculatedReward) // Round down for safety
        task.actualReward = calculatedReward // Keep precise value
        task.status = .completed
        task.progress = count

        onComplete(task)
        dismiss()
    }

    /// Handle completion for photo tasks with GPT-determined reward (5, 10, or 15 mins)
    private func handleCompleteWithDynamicReward(_ dynamicReward: Int) {
        cameraService.stop()

        let task = ExerciseTask(type: exerciseType)
        task.target = 1  // Photo task is binary (done or not)
        task.reward = dynamicReward
        task.actualReward = Double(dynamicReward)
        task.status = .completed
        task.progress = 1

        onComplete(task)
        dismiss()
    }
}

#Preview {
    ExerciseExecutionView(
        exerciseType: .pushups,
        target: 20,
        reward: 5
    ) { _ in }
    .environment(ThemeService())
    .environment(TimeBankService())
}
