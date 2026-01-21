import SwiftUI
import FamilyControls

struct OnboardingView: View {
    @Binding var hasCompletedOnboarding: Bool

    @Environment(ThemeService.self) private var themeService
    @Environment(BlockingService.self) private var blockingService

    @State private var currentStep = 0

    private let totalSteps = 5

    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: [
                    themeService.accentColor.opacity(0.1),
                    Color.appBackground
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                // Progress Indicator
                progressIndicator
                    .padding(.top, 20)

                // Content
                TabView(selection: $currentStep) {
                    WelcomeStep()
                        .tag(0)

                    HowItWorksStep()
                        .tag(1)

                    AppSelectionStep()
                        .tag(2)

                    EarnTimeStep()
                        .tag(3)

                    PermissionsStep()
                        .tag(4)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .animation(.easeInOut, value: currentStep)

                // Navigation Buttons
                navigationButtons
                    .padding(.horizontal, 20)
                    .padding(.bottom, 40)
            }
        }
    }

    // MARK: - Progress Indicator

    private var progressIndicator: some View {
        HStack(spacing: 8) {
            ForEach(0..<totalSteps, id: \.self) { index in
                Capsule()
                    .fill(index <= currentStep ? themeService.accentColor : Color.secondary.opacity(0.3))
                    .frame(width: index == currentStep ? 24 : 8, height: 8)
                    .animation(.spring(response: 0.3), value: currentStep)
            }
        }
    }

    // MARK: - Navigation Buttons

    private var navigationButtons: some View {
        HStack(spacing: 16) {
            // Back Button
            if currentStep > 0 {
                Button {
                    withAnimation {
                        currentStep -= 1
                    }
                } label: {
                    Image(systemName: "arrow.left")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(themeService.accentColor)
                        .frame(width: 56, height: 56)
                        .background(themeService.accentColor.opacity(0.1))
                        .clipShape(Circle())
                }
            }

            Spacer()

            // Next/Finish Button
            Button {
                if currentStep < totalSteps - 1 {
                    withAnimation {
                        currentStep += 1
                    }
                } else {
                    finishOnboarding()
                }
            } label: {
                HStack(spacing: 8) {
                    Text(currentStep == totalSteps - 1 ? "Get Started" : "Next")
                        .font(.system(size: 17, weight: .semibold))
                    if currentStep < totalSteps - 1 {
                        Image(systemName: "arrow.right")
                            .font(.system(size: 16, weight: .semibold))
                    }
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 32)
                .padding(.vertical, 18)
                .background(themeService.primaryGradient)
                .clipShape(Capsule())
                .shadow(color: themeService.accentColor.opacity(0.3), radius: 10, y: 5)
            }
        }
    }

    private func finishOnboarding() {
        // Apply blocking to selected apps
        blockingService.applyBlocking()

        // Mark onboarding as complete
        UserDefaults.standard.set(true, forKey: "hasCompletedOnboarding")
        hasCompletedOnboarding = true
    }
}

// MARK: - Step 1: Welcome

struct WelcomeStep: View {
    @Environment(ThemeService.self) private var themeService

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            // Icon
            ZStack {
                Circle()
                    .fill(themeService.accentColor.opacity(0.2))
                    .frame(width: 140, height: 140)

                Circle()
                    .fill(themeService.primaryGradient)
                    .frame(width: 100, height: 100)

                Image(systemName: "hand.raised.fill")
                    .font(.system(size: 50))
                    .foregroundStyle(.white)
            }

            VStack(spacing: 16) {
                Text("Take Control of\nYour Screen Time")
                    .font(.system(size: 32, weight: .bold))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.primary)

                Text("Block distracting apps, earn screen time through healthy activities, and build better digital habits.")
                    .font(.system(size: 17))
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 20)
            }

            Spacer()
            Spacer()
        }
        .padding(.horizontal, 20)
    }
}

// MARK: - Step 2: How It Works

struct HowItWorksStep: View {
    @Environment(ThemeService.self) private var themeService

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            Text("How It Works")
                .font(.system(size: 28, weight: .bold))

            VStack(spacing: 24) {
                HowItWorksItem(
                    number: 1,
                    icon: "hand.raised.fill",
                    title: "Block Apps",
                    description: "Select apps to block permanently"
                )

                HowItWorksItem(
                    number: 2,
                    icon: "figure.run",
                    title: "Earn Time",
                    description: "Complete exercises to earn screen time"
                )

                HowItWorksItem(
                    number: 3,
                    icon: "clock.fill",
                    title: "Spend Wisely",
                    description: "Use your earned time on blocked apps"
                )

                HowItWorksItem(
                    number: 4,
                    icon: "calendar",
                    title: "Schedule Freedom",
                    description: "Set unblock windows for specific times"
                )
            }
            .padding(.horizontal, 20)

            Spacer()
        }
    }
}

struct HowItWorksItem: View {
    let number: Int
    let icon: String
    let title: String
    let description: String

    @Environment(ThemeService.self) private var themeService

    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(themeService.accentColor.opacity(0.15))
                    .frame(width: 52, height: 52)

                Image(systemName: icon)
                    .font(.system(size: 22))
                    .foregroundStyle(themeService.accentColor)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(.primary)

                Text(description)
                    .font(.system(size: 14))
                    .foregroundStyle(.secondary)
            }

            Spacer()
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.appSecondaryBackground)
        )
    }
}

// MARK: - Step 3: App Selection

struct AppSelectionStep: View {
    @Environment(ThemeService.self) private var themeService
    @Environment(BlockingService.self) private var blockingService

    var body: some View {
        VStack(spacing: 24) {
            Spacer()
                .frame(height: 40)

            // Header
            VStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(themeService.primaryGradient)
                        .frame(width: 72, height: 72)

                    Image(systemName: "apps.iphone")
                        .font(.system(size: 32))
                        .foregroundStyle(.white)
                }

                Text("Select Apps to Block")
                    .font(.system(size: 26, weight: .bold))

                Text("These apps will be blocked by default. You'll need to earn time or use scheduled windows to access them.")
                    .font(.system(size: 15))
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 20)
            }

            // Selection count
            if blockingService.totalBlockedCount > 0 {
                HStack(spacing: 16) {
                    Label("\(blockingService.blockedAppsCount) Apps", systemImage: "app.fill")
                    Label("\(blockingService.blockedCategoriesCount) Categories", systemImage: "folder.fill")
                }
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(themeService.accentColor)
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .background(themeService.accentColor.opacity(0.1))
                .clipShape(Capsule())
            }

            // Family Activity Picker
            FamilyActivityPicker(selection: Binding(
                get: { blockingService.selectedApps },
                set: { blockingService.selectedApps = $0 }
            ))
            .frame(maxHeight: 400)
            .background(Color.appSecondaryBackground)
            .clipShape(RoundedRectangle(cornerRadius: 20))
            .padding(.horizontal, 16)

            Spacer()
        }
    }
}

// MARK: - Step 4: Earn Time Explanation

struct EarnTimeStep: View {
    @Environment(ThemeService.self) private var themeService

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            // Icon
            ZStack {
                Circle()
                    .fill(themeService.accentColor.opacity(0.2))
                    .frame(width: 120, height: 120)

                Image(systemName: "figure.strengthtraining.traditional")
                    .font(.system(size: 50))
                    .foregroundStyle(themeService.accentColor)
            }

            VStack(spacing: 16) {
                Text("Earn Screen Time")
                    .font(.system(size: 28, weight: .bold))

                Text("Complete exercises to earn minutes you can spend on blocked apps")
                    .font(.system(size: 17))
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 20)
            }

            // Exercise Examples
            VStack(spacing: 12) {
                ExerciseExampleRow(icon: "figure.strengthtraining.traditional", name: "20 Pushups", reward: "+5 min")
                ExerciseExampleRow(icon: "figure.core.training", name: "60s Plank", reward: "+10 min")
                ExerciseExampleRow(icon: "figure.squats", name: "30 Squats", reward: "+7 min")
                ExerciseExampleRow(icon: "camera.fill", name: "Photo Task", reward: "+15 min")
            }
            .padding(.horizontal, 20)

            Spacer()
        }
    }
}

struct ExerciseExampleRow: View {
    let icon: String
    let name: String
    let reward: String

    @Environment(ThemeService.self) private var themeService

    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundStyle(themeService.accentColor)
                .frame(width: 40)

            Text(name)
                .font(.system(size: 16, weight: .medium))

            Spacer()

            Text(reward)
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(themeService.accentColor)
        }
        .padding(14)
        .background(Color.appSecondaryBackground)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Step 5: Permissions

struct PermissionsStep: View {
    @Environment(ThemeService.self) private var themeService
    @Environment(BlockingService.self) private var blockingService

    @State private var hasScreenTimePermission = false
    @State private var hasCameraPermission = false

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            // Icon
            ZStack {
                Circle()
                    .fill(themeService.accentColor.opacity(0.2))
                    .frame(width: 100, height: 100)

                Image(systemName: "checkmark.shield.fill")
                    .font(.system(size: 45))
                    .foregroundStyle(themeService.accentColor)
            }

            VStack(spacing: 16) {
                Text("Almost Ready!")
                    .font(.system(size: 28, weight: .bold))

                Text("Grant permissions to enable app blocking and exercise verification")
                    .font(.system(size: 17))
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 20)
            }

            // Permissions
            VStack(spacing: 12) {
                PermissionRow(
                    icon: "hourglass",
                    title: "Screen Time",
                    description: "Required to block apps",
                    isGranted: blockingService.isAuthorized
                ) {
                    Task {
                        await blockingService.requestAuthorization()
                    }
                }

                PermissionRow(
                    icon: "camera.fill",
                    title: "Camera",
                    description: "For exercise verification",
                    isGranted: hasCameraPermission
                ) {
                    // Request camera permission
                    // AVCaptureDevice.requestAccess(for: .video) { granted in }
                }
            }
            .padding(.horizontal, 20)

            Spacer()
        }
    }
}

struct PermissionRow: View {
    let icon: String
    let title: String
    let description: String
    let isGranted: Bool
    let action: () -> Void

    @Environment(ThemeService.self) private var themeService

    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 22))
                .foregroundStyle(isGranted ? .green : themeService.accentColor)
                .frame(width: 44, height: 44)
                .background(
                    Circle()
                        .fill(isGranted ? Color.green.opacity(0.15) : themeService.accentColor.opacity(0.15))
                )

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 16, weight: .semibold))

                Text(description)
                    .font(.system(size: 13))
                    .foregroundStyle(.secondary)
            }

            Spacer()

            if isGranted {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 24))
                    .foregroundStyle(.green)
            } else {
                Button("Grant", action: action)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(themeService.accentColor)
                    .clipShape(Capsule())
            }
        }
        .padding(16)
        .background(Color.appSecondaryBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

#Preview {
    OnboardingView(hasCompletedOnboarding: .constant(false))
        .environment(ThemeService())
        .environment(BlockingService())
}
