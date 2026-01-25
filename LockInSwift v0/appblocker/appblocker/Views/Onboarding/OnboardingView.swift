import SwiftUI
import FamilyControls

struct OnboardingView: View {
    @Binding var hasCompletedOnboarding: Bool

    @Environment(ThemeService.self) private var themeService
    @Environment(BlockingService.self) private var blockingService

    @State private var currentStep = 0

    private let totalSteps = 6

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

                    UnlockWindowStep()
                        .tag(4)

                    PermissionsStep()
                        .tag(5)
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
                    Text(currentStep == totalSteps - 1 ? L10n.Common.getStarted : L10n.Common.next)
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
                Text(L10n.Onboarding.slide1Title)
                    .font(.system(size: 32, weight: .bold))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.primary)

                Text(L10n.Onboarding.slide1Description)
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

            Text(L10n.Onboarding.howItWorks)
                .font(.system(size: 28, weight: .bold))

            VStack(spacing: 24) {
                HowItWorksItem(
                    number: 1,
                    icon: "hand.raised.fill",
                    title: L10n.Onboarding.blockApps,
                    description: L10n.Onboarding.blockAppsDesc
                )

                HowItWorksItem(
                    number: 2,
                    icon: "figure.run",
                    title: L10n.Onboarding.earnTime,
                    description: L10n.Onboarding.earnTimeDesc
                )

                HowItWorksItem(
                    number: 3,
                    icon: "clock.fill",
                    title: L10n.Onboarding.spendWisely,
                    description: L10n.Onboarding.spendWiselyDesc
                )

                HowItWorksItem(
                    number: 4,
                    icon: "calendar",
                    title: L10n.Onboarding.scheduleFreedom,
                    description: L10n.Onboarding.scheduleFreedomDesc
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

                Text(L10n.Onboarding.selectAppsToBlock)
                    .font(.system(size: 26, weight: .bold))

                Text(L10n.Onboarding.appsBlockedByDefault)
                    .font(.system(size: 15))
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 20)
            }

            // Selection count
            if blockingService.totalBlockedCount > 0 {
                HStack(spacing: 16) {
                    Label("\(blockingService.blockedAppsCount) \(L10n.Onboarding.apps)", systemImage: "app.fill")
                    Label("\(blockingService.blockedCategoriesCount) \(L10n.Onboarding.categories)", systemImage: "folder.fill")
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
                Text(L10n.Onboarding.earnScreenTime)
                    .font(.system(size: 28, weight: .bold))

                Text(L10n.Onboarding.earnScreenTimeDesc)
                    .font(.system(size: 17))
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 20)
            }

            // Exercise Examples
            VStack(spacing: 12) {
                ExerciseExampleRow(icon: "figure.strengthtraining.traditional", name: "20 Pushups", reward: "+5 min")
                ExerciseExampleRow(icon: "figure.core.training", name: "60s Plank", reward: "+10 min")
                ExerciseExampleRow(icon: "figure.strengthtraining.traditional", name: "30 Squats", reward: "+7 min")
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

// MARK: - Step 5: Unlock Window

struct UnlockWindowStep: View {
    @Environment(ThemeService.self) private var themeService
    @Environment(BlockingService.self) private var blockingService

    var body: some View {
        VStack(spacing: 28) {
            Spacer()
                .frame(height: 20)

            // Header
            VStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [Color(hex: "8b5cf6"), Color(hex: "6d28d9")],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 90, height: 90)

                    Image(systemName: "lock.open.fill")
                        .font(.system(size: 40))
                        .foregroundStyle(.white)
                }

                Text(L10n.Onboarding.unlockWindowTitle)
                    .font(.system(size: 28, weight: .bold))

                Text(L10n.Onboarding.unlockWindowDesc)
                    .font(.system(size: 16))
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)
            }

            // Explanation card
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 10) {
                    Image(systemName: "info.circle.fill")
                        .foregroundStyle(Color(hex: "8b5cf6"))
                    Text(L10n.Onboarding.howItWorksExplain)
                        .font(.system(size: 15, weight: .semibold))
                }

                Text(L10n.Onboarding.howItWorksDetail)
                    .font(.system(size: 14))
                    .foregroundStyle(.secondary)
                    .lineSpacing(3)
            }
            .padding(16)
            .background(Color(hex: "8b5cf6").opacity(0.1))
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .padding(.horizontal, 20)

            // Window selector grid
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                ForEach(BlockingService.unlockWindowOptions, id: \.self) { minutes in
                    UnlockWindowOption(
                        minutes: minutes,
                        isSelected: blockingService.unlockWindowMinutes == minutes
                    ) {
                        blockingService.unlockWindowMinutes = minutes
                    }
                }
            }
            .padding(.horizontal, 20)

            // Selected indicator
            HStack(spacing: 6) {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(Color(hex: "8b5cf6"))
                Text("\(blockingService.unlockWindowMinutes) \(L10n.Onboarding.minutesSelected)")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(.secondary)
            }
            .padding(.top, 8)

            Spacer()
        }
    }
}

struct UnlockWindowOption: View {
    let minutes: Int
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Text("\(minutes)")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundStyle(isSelected ? .white : .primary)

                Text(L10n.Onboarding.min)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(isSelected ? .white.opacity(0.9) : .secondary)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 80)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(isSelected
                        ? LinearGradient(
                            colors: [Color(hex: "8b5cf6"), Color(hex: "6d28d9")],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                          )
                        : LinearGradient(
                            colors: [Color.appSecondaryBackground, Color.appSecondaryBackground],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                          )
                    )
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(isSelected ? Color.clear : Color.secondary.opacity(0.2), lineWidth: 1)
            )
            .shadow(color: isSelected ? Color(hex: "8b5cf6").opacity(0.3) : .clear, radius: 8, y: 4)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Step 6: Permissions

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
                Text(L10n.Onboarding.almostReady)
                    .font(.system(size: 28, weight: .bold))

                Text(L10n.Onboarding.grantPermissions)
                    .font(.system(size: 17))
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 20)
            }

            // Permissions
            VStack(spacing: 12) {
                PermissionRow(
                    icon: "hourglass",
                    title: L10n.Onboarding.screenTime,
                    description: L10n.Onboarding.requiredToBlock,
                    isGranted: blockingService.isAuthorized
                ) {
                    Task {
                        await blockingService.requestAuthorization()
                    }
                }

                PermissionRow(
                    icon: "camera.fill",
                    title: L10n.Onboarding.camera,
                    description: L10n.Onboarding.forExerciseVerification,
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
                Button(L10n.Onboarding.grant, action: action)
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
