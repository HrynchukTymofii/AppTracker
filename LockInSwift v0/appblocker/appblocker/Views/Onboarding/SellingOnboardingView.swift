import SwiftUI
import FamilyControls

/// 17-step selling onboarding - matches RN selling-onboarding.tsx exactly
/// Premium glassy design with purple-cyan gradients + Apple Liquid styling
///
/// Flow:
/// 1. Welcome
/// 2. Age Selection
/// 3. Daily Hours
/// 4. News Intro
/// 5. Bad News
/// 6. Good News
/// 7. First Step
/// 8. Commitment (press and hold)
/// 9. Screen Time Permission
/// 10. Overlay/Shield Ready
/// 11. Accessibility/Earn Time Intro
/// 12. Usage Data
/// 13. Projection
/// 14. Comparison/Paywall
/// 15. Notifications
/// 16. Daily Goal
/// 17. App Selection
struct SellingOnboardingView: View {
    @Binding var isCompleted: Bool

    @Environment(\.colorScheme) private var colorScheme
    @Environment(BlockingService.self) private var blockingService

    @State private var currentStep = 1
    @State private var userAge = 25
    @State private var dailyHours: Double = 4
    @State private var dailyGoalMinutes: Int = 120  // Default 2 hours

    private var isDark: Bool { colorScheme == .dark }
    private let totalSteps = 15  // Full flow with commitment and paywall (UsageData and OverlayView commented out)
    private var progress: Double { Double(currentStep) / Double(totalSteps) }

    private var themeColors: ThemeColors {
        ThemeColors(isDark: isDark)
    }

    var body: some View {
        ZStack {
            // Background with gradient overlays - matching RN
            Color(themeColors.background)
                .ignoresSafeArea()

            // Purple gradient from top-left
            LinearGradient(
                colors: isDark
                    ? [Color(hex: "8B5CF6").opacity(0.15), Color(hex: "8B5CF6").opacity(0.06), .clear]
                    : [Color(hex: "8B5CF6").opacity(0.12), Color(hex: "8B5CF6").opacity(0.05), .white],
                startPoint: .topLeading,
                endPoint: UnitPoint(x: 1, y: 0.5)
            )
            .ignoresSafeArea()

            // Cyan gradient from bottom-right
            LinearGradient(
                colors: isDark
                    ? [Color(hex: "06B6D4").opacity(0.10), .clear]
                    : [Color(hex: "06B6D4").opacity(0.07), .clear],
                startPoint: .bottomTrailing,
                endPoint: UnitPoint(x: 0.2, y: 0.5)
            )
            .ignoresSafeArea()

            // Top purple accent
            LinearGradient(
                colors: isDark
                    ? [Color(hex: "8B5CF6").opacity(0.08), .clear]
                    : [Color(hex: "8B5CF6").opacity(0.06), .clear],
                startPoint: UnitPoint(x: 0.5, y: 0),
                endPoint: UnitPoint(x: 0.5, y: 0.3)
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                // Progress Bar
                progressBar
                    .padding(.horizontal, 24)
                    .padding(.top, 16)
                    .padding(.bottom, 16)

                // Step Content
                stepContent
            }
        }
    }

    // MARK: - Progress Bar

    private var progressBar: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(themeColors.progressBg)
                    .frame(height: 8)

                RoundedRectangle(cornerRadius: 4)
                    .fill(
                        LinearGradient(
                            colors: [GradientPalette.purple, GradientPalette.cyan],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: geo.size.width * progress, height: 8)
                    .animation(.spring(response: 0.4), value: currentStep)
            }
        }
        .frame(height: 8)
    }

    // MARK: - Step Content

    @ViewBuilder
    private var stepContent: some View {
        switch currentStep {
        case 1:
            Step1WelcomeView(onContinue: nextStep, themeColors: themeColors)
        case 2:
            Step2AgeView(onSelect: { age in
                userAge = age
                nextStep()
            }, themeColors: themeColors)
        case 3:
            Step3HoursView(onSelect: { hours in
                dailyHours = hours
                nextStep()
            }, themeColors: themeColors)
        case 4:
            Step4NewsIntroView(onContinue: nextStep, themeColors: themeColors)
        case 5:
            Step5BadNewsView(dailyHours: dailyHours, onContinue: nextStep, themeColors: themeColors)
        case 6:
            Step6GoodNewsView(dailyHours: dailyHours, onContinue: nextStep, themeColors: themeColors)
        case 7:
            Step7FirstStepView(onContinue: nextStep, themeColors: themeColors)
        case 8:
            // Commitment step - press and hold for 3 seconds
            StepCommitmentView(onComplete: nextStep, themeColors: themeColors)
        case 9:
            Step8ScreenTimeView(onGranted: nextStep, themeColors: themeColors)
        // TODO: Restore Step9OverlayView (Enable App Blocking) when app limits work properly
        // case 10:
        //     Step9OverlayView(onContinue: nextStep, themeColors: themeColors)
        case 10:
            Step10AccessibilityView(onContinue: nextStep, themeColors: themeColors)
        // case 11:
        //     Step11UsageDataView(dailyHours: dailyHours, onContinue: nextStep, themeColors: themeColors)
        case 11:
            Step12ProjectionView(dailyHours: dailyHours, onContinue: nextStep, themeColors: themeColors)
        case 12:
            // Comparison & Paywall step
            Step13ComparisonView(dailyHours: dailyHours, onContinue: nextStep, themeColors: themeColors)
        case 13:
            Step14NotificationsView(onContinue: nextStep, themeColors: themeColors)
        case 14:
            // Daily Goal Selection Step
            StepGoalSelectionView(
                selectedMinutes: $dailyGoalMinutes,
                onContinue: {
                    blockingService.setDailyGoalTarget(minutes: dailyGoalMinutes)
                    nextStep()
                },
                themeColors: themeColors
            )
        case 15:
            Step15AppSelectionView(
                onConfirm: { finishOnboarding() },
                themeColors: themeColors
            )
        default:
            EmptyView()
        }
    }

    private func nextStep() {
        withAnimation(.spring(response: 0.4)) {
            if currentStep < totalSteps {
                currentStep += 1
            }
        }
    }

    private func finishOnboarding() {
        UserDefaults.standard.set(true, forKey: "hasCompletedSellingOnboarding")
        blockingService.applyBlocking()
        isCompleted = true
    }
}

// MARK: - Theme Colors
// Matches RN designSystem.ts exactly

struct ThemeColors {
    let isDark: Bool

    // Base
    var background: Color {
        isDark ? Color.black : Color.white
    }

    var surface: Color {
        isDark ? Color(hex: "0a0a0a") : Color(hex: "f8fafc")
    }

    // Text
    var textPrimary: Color {
        isDark ? .white : Color(hex: "0f172a")
    }

    var textSecondary: Color {
        isDark ? .white.opacity(0.7) : Color(hex: "0f172a").opacity(0.7)
    }

    var textTertiary: Color {
        isDark ? .white.opacity(0.4) : Color(hex: "0f172a").opacity(0.4)
    }

    // Progress bar
    var progressBg: Color {
        isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.08)
    }

    // Glass effects - matching RN exactly
    var glassLight: Color {
        isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.04)
    }

    var glassMedium: Color {
        isDark ? Color.white.opacity(0.12) : Color.black.opacity(0.06)
    }

    var glassHeavy: Color {
        isDark ? Color.white.opacity(0.18) : Color.black.opacity(0.10)
    }

    var glassBorder: Color {
        isDark ? Color.white.opacity(0.15) : Color.black.opacity(0.08)
    }

    // Card
    var cardBg: Color {
        isDark ? Color.white.opacity(0.03) : Color.white
    }

    var cardBorder: Color {
        isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.06)
    }

    // Glass card specific (for RN BlurView equivalent)
    var glassCardBorder: Color {
        isDark ? Color.white.opacity(0.1) : Color.white.opacity(0.6)
    }

    // Button borders
    var buttonBorder: Color {
        isDark ? Color.white.opacity(0.15) : Color.white.opacity(0.8)
    }
}

// MARK: - Gradient Palette
// Matches RN GRADIENT_PALETTE exactly

struct GradientPalette {
    static let purple = Color(hex: "8B5CF6")
    static let blue = Color(hex: "3B82F6")
    static let cyan = Color(hex: "06B6D4")
    static let pink = Color(hex: "EC4899")
    static let orange = Color(hex: "F97316")
    static let success = Color(hex: "10B981")
    static let error = Color(hex: "EF4444")
    static let warning = Color(hex: "F59E0B")
}

// MARK: - Gradient Colors

struct GradientColors {
    static let primary: [Color] = [Color(hex: "8B5CF6"), Color(hex: "06B6D4")]
    static let accent: [Color] = [Color(hex: "8B5CF6"), Color(hex: "3B82F6"), Color(hex: "06B6D4")]
    static let success: [Color] = [Color(hex: "10B981"), Color(hex: "06B6D4")]
    static let error: [Color] = [Color(hex: "EF4444"), Color(hex: "F97316")]
}

// MARK: - Step 1: Welcome

struct Step1WelcomeView: View {
    let onContinue: () -> Void
    let themeColors: ThemeColors

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 0) {
                Spacer()
                    .frame(height: 60)

                AnimatedOrbView(size: 160, level: 5)
                    .padding(.bottom, 40)

                Text(L10n.Onboarding.hello)
                    .font(.system(size: 40, weight: .heavy))
                    .foregroundStyle(themeColors.textPrimary)
                    .tracking(-1)
                    .padding(.bottom, 16)

                // "Welcome to LockIn" with purple highlight
                HStack(spacing: 6) {
                    Text(L10n.Onboarding.welcomeTo)
                        .foregroundStyle(themeColors.textSecondary)
                    Text("LockIn")
                        .foregroundStyle(GradientPalette.purple)
                }
                .font(.system(size: 24, weight: .semibold))
                .padding(.bottom, 16)

                // Glass card with gradient variant for the text
                VStack(spacing: 4) {
                    Text(L10n.Onboarding.readyToHelp)
                        .foregroundStyle(themeColors.textSecondary)
                    Text(L10n.Onboarding.takingControl)
                        .foregroundStyle(themeColors.textPrimary)
                        .fontWeight(.bold)
                }
                .font(.system(size: 17))
                .multilineTextAlignment(.center)
                .lineSpacing(4)
                .padding(24)
                .frame(maxWidth: .infinity)
                .background(
                    ZStack {
                        RoundedRectangle(cornerRadius: 20)
                            .fill(.ultraThinMaterial)
                        RoundedRectangle(cornerRadius: 20)
                            .fill(
                                LinearGradient(
                                    colors: themeColors.isDark
                                        ? [GradientPalette.purple.opacity(0.1), GradientPalette.cyan.opacity(0.05), .clear]
                                        : [GradientPalette.purple.opacity(0.08), GradientPalette.cyan.opacity(0.03), .clear],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                    }
                )
                .clipShape(RoundedRectangle(cornerRadius: 20))
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(themeColors.glassCardBorder, lineWidth: 1)
                )
                .padding(.horizontal, 24)
                .padding(.bottom, 48)

                GradientButtonView(title: L10n.Onboarding.letsStart, onTap: onContinue)
                    .padding(.horizontal, 24)

                Spacer()
            }
            .frame(minHeight: UIScreen.main.bounds.height - 100)
        }
    }
}

// MARK: - Step 2: Age Selection

struct Step2AgeView: View {
    let onSelect: (Int) -> Void
    let themeColors: ThemeColors

    private var ageRanges: [(age: Int, label: String)] {
        [
            (age: 16, label: L10n.Onboarding.ageUnder18),
            (age: 21, label: L10n.Onboarding.age18_24),
            (age: 27, label: L10n.Onboarding.age25_30),
            (age: 35, label: L10n.Onboarding.age31_40),
            (age: 45, label: L10n.Onboarding.age41_50),
            (age: 55, label: L10n.Onboarding.age51Plus)
        ]
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 0) {
                Spacer()
                    .frame(height: 40)

                Text(L10n.Onboarding.howOld)
                    .font(.system(size: 32, weight: .heavy))
                    .foregroundStyle(themeColors.textPrimary)
                    .tracking(-0.5)
                    .padding(.bottom, 12)

                Text(L10n.Onboarding.personalizeExp)
                    .font(.system(size: 16))
                    .foregroundStyle(themeColors.textSecondary)
                    .padding(.bottom, 36)

                VStack(spacing: 10) {
                    ForEach(ageRanges, id: \.age) { item in
                        GlassCardButton(
                            title: item.label,
                            onTap: { onSelect(item.age) },
                            themeColors: themeColors
                        )
                    }
                }
                .padding(.horizontal, 24)

                Spacer()
            }
            .frame(minHeight: UIScreen.main.bounds.height - 100)
        }
    }
}

// MARK: - Step 3: Daily Hours

struct Step3HoursView: View {
    let onSelect: (Double) -> Void
    let themeColors: ThemeColors

    private var options: [(hours: Double, label: String)] {
        [
            (hours: 1.5, label: L10n.Onboarding.hours1_2),
            (hours: 3.0, label: L10n.Onboarding.hours2_4),
            (hours: 5.0, label: L10n.Onboarding.hours4_6),
            (hours: 7.0, label: L10n.Onboarding.hours6_8),
            (hours: 9.0, label: L10n.Onboarding.hours8Plus)
        ]
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 0) {
                Spacer()
                    .frame(height: 40)

                Text(L10n.Onboarding.dailyScreenTime)
                    .font(.system(size: 32, weight: .heavy))
                    .foregroundStyle(themeColors.textPrimary)
                    .tracking(-0.5)
                    .padding(.bottom, 12)

                Text(L10n.Onboarding.beHonest)
                    .font(.system(size: 16))
                    .foregroundStyle(themeColors.textSecondary)
                    .padding(.bottom, 36)

                VStack(spacing: 10) {
                    ForEach(options, id: \.hours) { item in
                        GlassCardButton(
                            title: item.label,
                            onTap: { onSelect(item.hours) },
                            themeColors: themeColors
                        )
                    }
                }
                .padding(.horizontal, 24)

                Spacer()
            }
            .frame(minHeight: UIScreen.main.bounds.height - 100)
        }
    }
}

// MARK: - Step 4: News Intro

struct Step4NewsIntroView: View {
    let onContinue: () -> Void
    let themeColors: ThemeColors

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 0) {
                Spacer()

                Text(L10n.Onboarding.badNewsGoodNews)
                    .font(.system(size: 36, weight: .heavy))
                    .foregroundStyle(themeColors.textPrimary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                    .tracking(-1)
                    .padding(.bottom, 24)

                Text(L10n.Onboarding.showSomething)
                    .font(.system(size: 17))
                    .foregroundStyle(themeColors.textSecondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(6)
                    .padding(.horizontal, 24)
                    .padding(.bottom, 56)

                GradientButtonView(title: L10n.Onboarding.showMe, onTap: onContinue)
                    .padding(.horizontal, 24)

                Spacer()
            }
            .frame(minHeight: UIScreen.main.bounds.height - 100)
        }
    }
}

// MARK: - Step 5: Bad News

struct Step5BadNewsView: View {
    let dailyHours: Double
    let onContinue: () -> Void
    let themeColors: ThemeColors

    @State private var animateDays = false
    @State private var animateYears = false

    private var daysPerYear: Int {
        Int((dailyHours * 365) / 24)
    }

    private var yearsPerLife: Int {
        Int((dailyHours * 365 * 50) / (24 * 365))
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 0) {
                Spacer()
                    .frame(height: 40)

                // Badge with glassy red gradient
                ZStack {
                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: [
                                    Color(red: 1.0, green: 0.3, blue: 0.3),    // Bright red
                                    Color(red: 0.85, green: 0.15, blue: 0.15)  // Deep red
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )

                    // Top shine
                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: [Color.white.opacity(0.25), .clear],
                                startPoint: .top,
                                endPoint: .center
                            )
                        )

                    Text(L10n.Onboarding.theBadNews)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(.white)
                        .tracking(1.5)
                        .textCase(.uppercase)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 10)
                }
                .fixedSize()
                .shadow(color: Color(red: 1.0, green: 0.25, blue: 0.25).opacity(0.5), radius: 12, x: 0, y: 4)
                .padding(.bottom, 32)

                Text(String(format: L10n.Onboarding.atHoursPerDay, Int(dailyHours)))
                    .font(.system(size: 18))
                    .foregroundStyle(themeColors.textSecondary)
                    .padding(.bottom, 8)

                // Animated days counter - glassy red gradient
                AnimatedCounterView(
                    value: daysPerYear,
                    suffix: " " + L10n.Onboarding.days,
                    gradientColors: [
                        Color(red: 1.0, green: 0.35, blue: 0.35),  // Bright red
                        Color(red: 0.95, green: 0.25, blue: 0.25), // Red
                        Color(red: 0.85, green: 0.15, blue: 0.15)  // Deep red
                    ],
                    glowColor: Color(red: 1.0, green: 0.25, blue: 0.25),
                    fontSize: 64,
                    animate: animateDays
                )
                .onAppear {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                        animateDays = true
                    }
                }

                Text(L10n.Onboarding.lookingAtPhone)
                    .font(.system(size: 17))
                    .foregroundStyle(themeColors.textSecondary)
                    .padding(.bottom, 32)

                Text(L10n.Onboarding.thatsApprox)
                    .font(.system(size: 16))
                    .foregroundStyle(themeColors.textTertiary)
                    .padding(.bottom, 4)

                // Animated years counter - glassy red gradient
                AnimatedCounterView(
                    value: yearsPerLife,
                    suffix: " " + L10n.Onboarding.years,
                    gradientColors: [
                        Color(red: 1.0, green: 0.35, blue: 0.35),  // Bright red
                        Color(red: 0.95, green: 0.25, blue: 0.25), // Red
                        Color(red: 0.85, green: 0.15, blue: 0.15)  // Deep red
                    ],
                    glowColor: Color(red: 1.0, green: 0.25, blue: 0.25),
                    fontSize: 80,
                    animate: animateYears
                )
                .onAppear {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                        animateYears = true
                    }
                }

                Text(L10n.Onboarding.ofYourLife)
                    .font(.system(size: 18, weight: .medium))
                    .foregroundStyle(themeColors.textSecondary)
                    .padding(.bottom, 40)

                // Quote card with glass effect - inline styling matching Screen 1
                Text(L10n.Onboarding.youReadRight)
                    .font(.system(size: 15))
                    .foregroundStyle(themeColors.textSecondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                    .padding(24)
                    .background(
                        ZStack {
                            RoundedRectangle(cornerRadius: 20)
                                .fill(.ultraThinMaterial)

                            RoundedRectangle(cornerRadius: 20)
                                .fill(
                                    LinearGradient(
                                        colors: themeColors.isDark
                                            ? [GradientPalette.purple.opacity(0.1), GradientPalette.cyan.opacity(0.05), .clear]
                                            : [GradientPalette.purple.opacity(0.08), GradientPalette.cyan.opacity(0.03), .clear],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )

                            // Top shine
                            RoundedRectangle(cornerRadius: 20)
                                .fill(
                                    LinearGradient(
                                        colors: [Color.white.opacity(0.1), .clear],
                                        startPoint: .top,
                                        endPoint: .center
                                    )
                                )

                            // Border glow
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(
                                    LinearGradient(
                                        colors: [
                                            GradientPalette.purple.opacity(0.3),
                                            GradientPalette.cyan.opacity(0.2),
                                            .clear
                                        ],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    ),
                                    lineWidth: 1
                                )
                        }
                    )
                    .shadow(color: GradientPalette.purple.opacity(0.15), radius: 20, x: 0, y: 10)
                    .padding(.horizontal, 24)
                    .padding(.bottom, 40)

                // Button - shown immediately
                GradientButtonView(
                    title: L10n.Onboarding.whatsGoodNews,
                    colors: GradientColors.primary,
                    onTap: onContinue
                )
                .padding(.horizontal, 24)

                Spacer()
            }
            .frame(minHeight: UIScreen.main.bounds.height - 100)
        }
    }
}

// MARK: - Animated Counter View
/// Animates a number counting up from 0 to the target value with glassy gradient effect

struct AnimatedCounterView: View {
    let value: Int
    var prefix: String = ""
    var suffix: String = ""
    let gradientColors: [Color]
    var glowColor: Color
    var fontSize: CGFloat = 64
    var animate: Bool = true

    @State private var displayValue: Int = 1

    // Convenience initializer for single color (backward compatibility)
    init(value: Int, prefix: String = "", suffix: String = "", color: Color, fontSize: CGFloat = 64, animate: Bool = true) {
        self.value = value
        self.prefix = prefix
        self.suffix = suffix
        // Create glassy gradient from single color
        self.gradientColors = [color.opacity(0.9), color, color.opacity(0.8)]
        self.glowColor = color
        self.fontSize = fontSize
        self.animate = animate
    }

    // Full gradient initializer
    init(value: Int, prefix: String = "", suffix: String = "", gradientColors: [Color], glowColor: Color, fontSize: CGFloat = 64, animate: Bool = true) {
        self.value = value
        self.prefix = prefix
        self.suffix = suffix
        self.gradientColors = gradientColors
        self.glowColor = glowColor
        self.fontSize = fontSize
        self.animate = animate
    }

    var body: some View {
        ZStack {
            // Glow layer
            Text("\(prefix)\(displayValue)\(suffix)")
                .font(.system(size: fontSize, weight: .heavy))
                .foregroundStyle(glowColor.opacity(0.5))
                .blur(radius: 20)

            // Main gradient text
            Text("\(prefix)\(displayValue)\(suffix)")
                .font(.system(size: fontSize, weight: .heavy))
                .foregroundStyle(
                    LinearGradient(
                        colors: gradientColors,
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .shadow(color: glowColor.opacity(0.3), radius: 8, x: 0, y: 4)
        }
        .tracking(-2)
        .onChange(of: animate) { _, shouldAnimate in
            if shouldAnimate {
                animateCounter()
            }
        }
        .onAppear {
            if animate {
                animateCounter()
            }
        }
    }

    private func animateCounter() {
        let duration: Double = 1.2 // Faster animation
        let steps = min(value, 60)
        let stepDuration = duration / Double(steps)

        for i in 0...steps {
            DispatchQueue.main.asyncAfter(deadline: .now() + stepDuration * Double(i)) {
                let progress = Double(i) / Double(steps)
                // Ease out curve
                let easedProgress = 1 - pow(1 - progress, 3)
                // Start from 1, not 0
                displayValue = max(1, Int(Double(value) * easedProgress))
            }
        }
    }
}

// MARK: - Step 6: Good News

struct Step6GoodNewsView: View {
    let dailyHours: Double
    let onContinue: () -> Void
    let themeColors: ThemeColors

    @State private var animateYears = false

    private var savedYears: Int {
        Int((dailyHours * 0.6 * 365 * 50) / (24 * 365))
    }

    // Rich emerald green colors
    private let greenGradient: [Color] = [
        Color(red: 0.2, green: 0.85, blue: 0.45),   // Bright emerald
        Color(red: 0.15, green: 0.75, blue: 0.4),   // Rich green
        Color(red: 0.1, green: 0.65, blue: 0.35)    // Deep green
    ]
    private let greenGlow = Color(red: 0.18, green: 0.8, blue: 0.42)

    var body: some View {
        VStack(spacing: 0) {
            Spacer()

            // Badge with shine effect - rich green gradient
            ZStack {
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: greenGradient,
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )

                // Top shine
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [Color.white.opacity(0.25), .clear],
                            startPoint: .top,
                            endPoint: .center
                        )
                    )

                Text(L10n.Onboarding.theGoodNews)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(.white)
                    .tracking(1.5)
                    .textCase(.uppercase)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 10)
            }
            .fixedSize()
            .shadow(color: greenGlow.opacity(0.5), radius: 12, x: 0, y: 4)
            .padding(.bottom, 32)

            Text(L10n.Onboarding.canHelpGetBack)
                .font(.system(size: 22, weight: .medium))
                .foregroundStyle(themeColors.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.bottom, 0)

            // Animated years counter with + prefix - rich green gradient
            AnimatedCounterView(
                value: savedYears,
                prefix: "+",
                suffix: " " + L10n.Onboarding.years,
                gradientColors: greenGradient,
                glowColor: greenGlow,
                fontSize: 80,
                animate: animateYears
            )
            .onAppear {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                    animateYears = true
                }
            }

            Text(L10n.Onboarding.ofYourLife)
                .font(.system(size: 18))
                .foregroundStyle(themeColors.textSecondary)
                .padding(.bottom, 32)

            Text(L10n.Onboarding.turnIntoThings)
                .font(.system(size: 17))
                .foregroundStyle(themeColors.textSecondary)
                .multilineTextAlignment(.center)
                .lineSpacing(6)
                .padding(.horizontal, 24)
                .padding(.bottom, 48)

            // Button with rich green gradient
            GradientButtonView(
                title: L10n.Onboarding.letsGetStarted,
                colors: [
                    Color(red: 0.2, green: 0.85, blue: 0.45),
                    Color(red: 0.1, green: 0.65, blue: 0.35)
                ],
                onTap: onContinue
            )
            .padding(.horizontal, 24)

            Spacer()
        }
    }
}

// MARK: - Step 7: First Step

struct Step7FirstStepView: View {
    let onContinue: () -> Void
    let themeColors: ThemeColors

    private var features: [String] {
        [
            L10n.Onboarding.seeRealUsage,
            L10n.Onboarding.getRecommendations,
            L10n.Onboarding.trackProgress
        ]
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 0) {
                Spacer()
                    .frame(height: 40)

                AnimatedOrbView(size: 120, level: 5)
                    .padding(.bottom, 36)

                Text(L10n.Onboarding.firstStep)
                    .font(.system(size: 32, weight: .heavy))
                    .foregroundStyle(themeColors.textPrimary)
                    .tracking(-0.5)
                    .padding(.bottom, 16)

                Group {
                    Text(L10n.Onboarding.connectScreenTime + " ")
                        .foregroundStyle(themeColors.textSecondary)
                    + Text(L10n.Onboarding.personalizedReport)
                        .foregroundStyle(themeColors.textPrimary)
                        .fontWeight(.semibold)
                }
                .font(.system(size: 17))
                .multilineTextAlignment(.center)
                .lineSpacing(4)
                .padding(.horizontal, 24)
                .padding(.bottom, 40)

                VStack(spacing: 14) {
                    ForEach(features, id: \.self) { feature in
                        HStack(spacing: 14) {
                            Circle()
                                .fill(Color(hex: "10B981"))
                                .frame(width: 6, height: 6)

                            Text(feature)
                                .font(.system(size: 16, weight: .medium))
                                .foregroundStyle(themeColors.textPrimary)

                            Spacer()
                        }
                    }
                }
                .padding(.horizontal, 32)
                .padding(.bottom, 40)

                GradientButtonView(
                    title: L10n.Common.continue,
                    colors: [Color(hex: "10B981"), Color(hex: "059669")],
                    onTap: onContinue
                )
                .padding(.horizontal, 24)

                Spacer()
            }
        }
    }
}

// MARK: - Step 8: Commitment (Press and Hold)

struct StepCommitmentView: View {
    let onComplete: () -> Void
    let themeColors: ThemeColors

    @State private var isHolding = false
    @State private var progress: Double = 0
    @State private var completed = false
    @State private var pageScale: CGFloat = 1.0
    @State private var orbScale: CGFloat = 1.0
    @State private var orbGlow: CGFloat = 0.0
    @State private var textScale: CGFloat = 1.0
    @State private var shakeOffset: CGFloat = 0

    private let holdDuration: Double = 3.0 // 3 seconds
    private let emojis = ["🎯", "💪", "🔥", "⚡", "🚀", "✨", "🏆", "💎", "🌟", "🎉", "💫", "🌈"]

    var body: some View {
        ZStack {
            // Flying emojis layer
            ForEach(0..<emojis.count, id: \.self) { index in
                FlyingEmojiView(
                    emoji: emojis[index],
                    index: index,
                    isActive: isHolding || completed
                )
            }

            VStack(spacing: 0) {
                Spacer()

                // Title
                Text(completed ? L10n.Onboarding.committed : L10n.Onboarding.commitmentTitle)
                    .font(.system(size: 36, weight: .heavy))
                    .foregroundStyle(themeColors.textPrimary)
                    .tracking(-1)
                    .multilineTextAlignment(.center)
                    .scaleEffect(textScale)
                    .padding(.bottom, 12)

                Text(completed
                     ? L10n.Onboarding.takenFirstStep
                     : L10n.Onboarding.pressAndHold)
                    .font(.system(size: 17))
                    .foregroundStyle(themeColors.textSecondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                    .padding(.horizontal, 24)
                    .padding(.bottom, 48)

                // Main interactive orb area
                ZStack {
                    // Glow effects
                    Circle()
                        .fill(Color(hex: "8B5CF6").opacity(0.3))
                        .frame(width: 250, height: 250)
                        .opacity(orbGlow)
                        .scaleEffect(orbScale)

                    Circle()
                        .fill(Color(hex: "06B6D4").opacity(0.2))
                        .frame(width: 300, height: 300)
                        .opacity(orbGlow)
                        .scaleEffect(orbScale * 1.2)

                    // Animated Orb
                    AnimatedOrbView(size: completed ? 200 : 180, level: completed ? 5 : isHolding ? 4 : 3)
                        .scaleEffect(orbScale)

                    // Progress percentage
                    if isHolding && !completed {
                        Text("\(Int(progress * 100))%")
                            .font(.system(size: 48, weight: .heavy))
                            .foregroundStyle(Color(hex: "8B5CF6"))
                            .offset(y: 130)
                    }
                }
                .contentShape(Rectangle())
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { _ in
                            if !completed && !isHolding {
                                startHolding()
                            }
                        }
                        .onEnded { _ in
                            if !completed {
                                stopHolding()
                            }
                        }
                )

                Spacer()
                    .frame(height: 60)

                // Status text
                Text(completed
                     ? L10n.Onboarding.letsSetUp
                     : isHolding
                     ? L10n.Onboarding.keepHolding
                     : L10n.Onboarding.holdTheOrb)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(completed ? Color(hex: "10B981") : isHolding ? Color(hex: "8B5CF6") : themeColors.textTertiary)
                    .scaleEffect(textScale)

                // Celebration emojis at completion
                if completed {
                    HStack(spacing: 20) {
                        ForEach(["🎊", "🥳", "🎉", "✨", "💪"], id: \.self) { emoji in
                            Text(emoji)
                                .font(.system(size: 32))
                        }
                    }
                    .padding(.top, 24)
                    .transition(.scale.combined(with: .opacity))
                }

                Spacer()
            }
        }
        .scaleEffect(pageScale)
        .offset(x: shakeOffset)
    }

    private func startHolding() {
        isHolding = true
        progress = 0

        // Initial haptic feedback
        let impactMed = UIImpactFeedbackGenerator(style: .medium)
        impactMed.impactOccurred()

        // Animate while holding
        withAnimation(.easeOut(duration: holdDuration)) {
            pageScale = 1.05
            orbGlow = 1.0
        }

        // Pulsing orb animation
        withAnimation(.easeInOut(duration: 0.4).repeatForever(autoreverses: true)) {
            orbScale = 1.3
        }

        // Pulsing text animation
        withAnimation(.easeInOut(duration: 0.3).repeatForever(autoreverses: true)) {
            textScale = 1.1
        }

        // Shake animation
        withAnimation(.linear(duration: 0.05).repeatForever(autoreverses: true)) {
            shakeOffset = 3
        }

        // Progress timer with periodic haptic feedback
        var lastHapticProgress: Double = 0
        Timer.scheduledTimer(withTimeInterval: 0.03, repeats: true) { timer in
            if !isHolding {
                timer.invalidate()
                return
            }

            progress += 0.03 / holdDuration

            // Haptic feedback every 25% progress
            if progress >= lastHapticProgress + 0.25 {
                lastHapticProgress = progress
                let impactLight = UIImpactFeedbackGenerator(style: .light)
                impactLight.impactOccurred()
            }

            if progress >= 1.0 {
                timer.invalidate()
                completeCommitment()
            }
        }
    }

    private func stopHolding() {
        isHolding = false
        progress = 0

        withAnimation(.spring(response: 0.3)) {
            pageScale = 1.0
            orbScale = 1.0
            orbGlow = 0.0
            textScale = 1.0
            shakeOffset = 0
        }
    }

    private func completeCommitment() {
        isHolding = false
        completed = true

        // Success haptic feedback
        let notification = UINotificationFeedbackGenerator()
        notification.notificationOccurred(.success)

        // Big burst effect
        withAnimation(.spring(response: 0.2)) {
            pageScale = 1.15
            orbScale = 2.0
        }

        withAnimation(.spring(response: 0.4, dampingFraction: 0.5).delay(0.2)) {
            pageScale = 1.0
            orbScale = 1.2
        }

        withAnimation(.spring(response: 0.3)) {
            shakeOffset = 0
        }

        // Auto-advance after celebration
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            onComplete()
        }
    }
}

// Flying emoji component for commitment step
struct FlyingEmojiView: View {
    let emoji: String
    let index: Int
    let isActive: Bool

    @State private var offset: CGSize = .zero
    @State private var opacity: Double = 0
    @State private var scale: Double = 0
    @State private var rotation: Double = 0

    private var startPosition: CGSize {
        let positions: [CGSize] = [
            CGSize(width: -200, height: -300),
            CGSize(width: 200, height: -300),
            CGSize(width: -200, height: 300),
            CGSize(width: 200, height: 300),
            CGSize(width: 0, height: -400),
            CGSize(width: -300, height: 0),
            CGSize(width: 300, height: 0),
            CGSize(width: 0, height: 400),
            CGSize(width: -250, height: -200),
            CGSize(width: 250, height: -200),
            CGSize(width: -250, height: 200),
            CGSize(width: 250, height: 200)
        ]
        return positions[index % positions.count]
    }

    var body: some View {
        Text(emoji)
            .font(.system(size: 36))
            .opacity(opacity)
            .scaleEffect(scale)
            .rotationEffect(.degrees(rotation))
            .offset(offset)
            .onChange(of: isActive) { _, active in
                if active {
                    animate()
                } else {
                    reset()
                }
            }
    }

    private func animate() {
        offset = startPosition

        let delay = Double(index) * 0.2
        let duration = 0.8

        DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
            withAnimation(.easeOut(duration: duration)) {
                offset = .zero
                rotation = 360
            }

            withAnimation(.easeOut(duration: duration * 0.3)) {
                opacity = 1
                scale = 1.5
            }

            withAnimation(.easeIn(duration: duration * 0.3).delay(duration * 0.6)) {
                scale = 1
            }

            withAnimation(.easeIn(duration: duration * 0.2).delay(duration * 0.8)) {
                opacity = 0
            }
        }
    }

    private func reset() {
        withAnimation(.easeOut(duration: 0.2)) {
            opacity = 0
            scale = 0
            rotation = 0
            offset = startPosition
        }
    }
}

// MARK: - Step 8: Screen Time Permission

struct Step8ScreenTimeView: View {
    let onGranted: () -> Void
    let themeColors: ThemeColors

    @Environment(BlockingService.self) private var blockingService

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 0) {
                Spacer()
                    .frame(height: 20)

                Text(L10n.Onboarding.enableScreenTime)
                    .font(.system(size: 28, weight: .heavy))
                    .foregroundStyle(themeColors.textPrimary)
                    .multilineTextAlignment(.center)
                    .tracking(-0.5)
                    .padding(.bottom, 12)

                // Security badge
                HStack(spacing: 12) {
                    Image(systemName: "shield.fill")
                        .font(.system(size: 20))
                        .foregroundStyle(Color(hex: "10B981"))

                    Text(L10n.Onboarding.secureOnPhone)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(Color(hex: "10B981"))
                }
                .padding(16)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color(hex: "10B981").opacity(0.1))
                )
                .padding(.horizontal, 24)
                .padding(.bottom, 24)

                if blockingService.isAuthorized {
                    // Permission granted state
                    VStack(spacing: 12) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 36))
                            .foregroundStyle(Color(hex: "10B981"))

                        Text(L10n.Onboarding.permissionGranted)
                            .font(.system(size: 18, weight: .bold))
                            .foregroundStyle(Color(hex: "10B981"))
                    }
                    .padding(24)
                    .frame(maxWidth: .infinity)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color(hex: "10B981").opacity(0.1))
                    )
                    .padding(.horizontal, 24)
                    .padding(.bottom, 24)

                    GradientButtonView(
                        title: L10n.Common.continue,
                        colors: [Color(hex: "10B981"), Color(hex: "059669")],
                        onTap: onGranted
                    )
                    .padding(.horizontal, 24)
                } else {
                    // Instructions
                    VStack(alignment: .leading, spacing: 16) {
                        Text(L10n.Onboarding.whatHappensNext)
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(themeColors.textPrimary)

                        instructionRow(number: 1, text: L10n.Onboarding.tapContinue)
                        instructionRow(number: 2, text: L10n.Onboarding.selectApps)
                        instructionRow(number: 3, text: L10n.Onboarding.tapDone)
                    }
                    .padding(20)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(themeColors.cardBg)
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(themeColors.cardBorder, lineWidth: 0.5)
                            )
                    )
                    .padding(.horizontal, 24)
                    .padding(.bottom, 24)

                    GradientButtonView(
                        title: L10n.Common.continue,
                        colors: [Color(hex: "10B981"), Color(hex: "059669")],
                        onTap: {
                            Task {
                                await blockingService.requestAuthorization()
                                if blockingService.isAuthorized {
                                    onGranted()
                                }
                            }
                        }
                    )
                    .padding(.horizontal, 24)
                }

                Spacer()
            }
        }
    }

    private func instructionRow(number: Int, text: String) -> some View {
        HStack(spacing: 14) {
            Text("\(number)")
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(.white)
                .frame(width: 28, height: 28)
                .background(
                    LinearGradient(
                        colors: [Color(hex: "10B981"), Color(hex: "06B6D4")],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .clipShape(Circle())

            Text(text)
                .font(.system(size: 15))
                .foregroundStyle(themeColors.textSecondary)
        }
    }
}

// MARK: - Step 9: Overlay Permission (iOS: Shield Ready)

struct Step9OverlayView: View {
    let onContinue: () -> Void
    let themeColors: ThemeColors

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 0) {
                Spacer()

                Image(systemName: "checkmark.shield.fill")
                    .font(.system(size: 60))
                    .foregroundStyle(Color(hex: "10B981"))
                    .padding(.bottom, 24)

                Text(L10n.Onboarding.enableAppBlocking)
                    .font(.system(size: 28, weight: .heavy))
                    .foregroundStyle(themeColors.textPrimary)
                    .padding(.bottom, 12)

                // Success card
                VStack(spacing: 12) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 36))
                        .foregroundStyle(Color(hex: "10B981"))

                    Text(L10n.Onboarding.readyToBlock)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(Color(hex: "10B981"))

                    Text(L10n.Onboarding.shieldWhenOpen)
                        .font(.system(size: 14))
                        .foregroundStyle(themeColors.textSecondary)
                        .multilineTextAlignment(.center)
                }
                .padding(24)
                .frame(maxWidth: .infinity)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color(hex: "10B981").opacity(0.1))
                )
                .padding(.horizontal, 24)
                .padding(.bottom, 48)

                GradientButtonView(
                    title: L10n.Common.continue,
                    colors: [Color(hex: "10B981"), Color(hex: "059669")],
                    onTap: onContinue
                )
                .padding(.horizontal, 24)

                Spacer()
            }
            .frame(minHeight: UIScreen.main.bounds.height - 100)
        }
    }
}

// MARK: - Step 10: Accessibility (iOS: Earn Time Intro)

struct Step10AccessibilityView: View {
    let onContinue: () -> Void
    let themeColors: ThemeColors

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 0) {
                Spacer()

                Image(systemName: "figure.run")
                    .font(.system(size: 60))
                    .foregroundStyle(Color(hex: "8B5CF6"))
                    .padding(.bottom, 24)

                Text(L10n.Onboarding.stayActiveEarn)
                    .font(.system(size: 28, weight: .heavy))
                    .foregroundStyle(themeColors.textPrimary)
                    .padding(.bottom, 12)

                Text(L10n.Onboarding.completeExercisesEarn)
                    .font(.system(size: 17))
                    .foregroundStyle(themeColors.textSecondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                    .padding(.horizontal, 24)
                    .padding(.bottom, 48)

                GradientButtonView(title: L10n.Common.continue, onTap: onContinue)
                    .padding(.horizontal, 24)

                Spacer()
            }
            .frame(minHeight: UIScreen.main.bounds.height - 100)
        }
    }
}

// MARK: - Step 11: Usage Data

struct Step11UsageDataView: View {
    let dailyHours: Double
    let onContinue: () -> Void
    let themeColors: ThemeColors

    private var totalWeeklyHours: Double { dailyHours * 7 }
    private var yearsOnTrack: Int { Int((dailyHours * 365 * 50) / (24 * 365)) }

    private var weeklyData: [(day: String, hours: Double)] {
        let daySymbols = Calendar.current.shortStandaloneWeekdaySymbols
        return [
            (daySymbols[0], dailyHours * 0.9),  // Sunday
            (daySymbols[1], dailyHours * 1.0),  // Monday
            (daySymbols[2], dailyHours * 0.85), // Tuesday
            (daySymbols[3], dailyHours * 1.1),  // Wednesday
            (daySymbols[4], dailyHours * 1.15), // Thursday
            (daySymbols[5], dailyHours * 1.2),  // Friday
            (daySymbols[6], dailyHours * 1.0)   // Saturday
        ]
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 0) {
                // Header with Orb
                AnimatedOrbView(size: 80, level: 1)
                    .padding(.top, 20)
                    .padding(.bottom, 24)

                Text(L10n.Onboarding.heresReality)
                    .font(.system(size: 28, weight: .heavy))
                    .foregroundStyle(themeColors.textPrimary)
                    .tracking(-0.5)
                    .padding(.bottom, 8)

                Text(L10n.Onboarding.basedOnUsage)
                    .font(.system(size: 15))
                    .foregroundStyle(themeColors.textSecondary)
                    .padding(.bottom, 24)

                // Today's Usage - Big Number
                VStack(spacing: 8) {
                    HStack(spacing: 8) {
                        Image(systemName: "clock.fill")
                            .font(.system(size: 18))
                            .foregroundStyle(Color(hex: "EF4444"))

                        Text(L10n.Onboarding.todaysScreenTime)
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(Color(hex: "EF4444"))
                    }

                    Text("\(Int(dailyHours))h \(Int((dailyHours - Double(Int(dailyHours))) * 60))m")
                        .font(.system(size: 48, weight: .heavy))
                        .foregroundStyle(Color(hex: "EF4444"))
                }
                .padding(24)
                .frame(maxWidth: .infinity)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Color(hex: "EF4444").opacity(themeColors.isDark ? 0.1 : 0.08))
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(Color(hex: "EF4444").opacity(0.2), lineWidth: 1)
                        )
                )
                .padding(.horizontal, 24)
                .padding(.bottom, 20)

                // Weekly Chart
                Text(L10n.Onboarding.thisWeek)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(themeColors.textSecondary)
                    .tracking(0.5)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 24)
                    .padding(.bottom, 12)

                weeklyChart
                    .padding(.horizontal, 24)
                    .padding(.bottom, 20)

                // Stats Cards
                HStack(spacing: 12) {
                    statsCard(value: "\(Int(totalWeeklyHours))h", label: L10n.Onboarding.thisWeek, color: Color(hex: "EF4444"))
                    statsCard(value: "\(yearsOnTrack)y", label: L10n.Onboarding.lifeOnPhone, color: Color(hex: "EF4444"))
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 24)

                // Warning Message
                HStack(spacing: 10) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 20))
                        .foregroundStyle(Color(hex: "F59E0B"))

                    Text(String(format: L10n.Onboarding.atThisRate, yearsOnTrack))
                        .foregroundStyle(themeColors.isDark ? .white.opacity(0.8) : Color(hex: "78350f"))
                }
                .font(.system(size: 14))
                .padding(14)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color(hex: "F59E0B").opacity(themeColors.isDark ? 0.1 : 0.08))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color(hex: "F59E0B").opacity(0.2), lineWidth: 0.5)
                        )
                )
                .padding(.horizontal, 24)
                .padding(.bottom, 28)

                GradientButtonView(
                    title: L10n.Onboarding.letsFixThis,
                    colors: [Color(hex: "10B981"), Color(hex: "06B6D4")],
                    onTap: onContinue
                )
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
            }
        }
    }

    private var weeklyChart: some View {
        let maxHours = weeklyData.map(\.hours).max() ?? 1

        return VStack(spacing: 0) {
            HStack(alignment: .bottom, spacing: 8) {
                ForEach(weeklyData, id: \.day) { item in
                    VStack(spacing: 4) {
                        Text(String(format: "%.1fh", item.hours))
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundStyle(themeColors.textSecondary)

                        RoundedRectangle(cornerRadius: 6)
                            .fill(
                                LinearGradient(
                                    colors: [Color(hex: "8B5CF6"), Color(hex: "3B82F6"), Color(hex: "F97316"), Color(hex: "06B6D4")],
                                    startPoint: .bottom,
                                    endPoint: .top
                                )
                            )
                            .frame(width: 32, height: max(CGFloat(item.hours / maxHours) * 100, 8))

                        Text(item.day)
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(themeColors.textTertiary)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .frame(height: 140)
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(themeColors.cardBg)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(themeColors.cardBorder, lineWidth: 0.5)
                )
        )
    }

    private func statsCard(value: String, label: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.system(size: 28, weight: .heavy))
                .foregroundStyle(color)

            Text(label)
                .font(.system(size: 12))
                .foregroundStyle(themeColors.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(color.opacity(themeColors.isDark ? 0.1 : 0.08))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(color.opacity(0.2), lineWidth: 0.5)
                )
        )
    }
}

// MARK: - Step 12: Projection

struct Step12ProjectionView: View {
    let dailyHours: Double
    let onContinue: () -> Void
    let themeColors: ThemeColors

    private var savedHoursWeekly: Int { Int(dailyHours * 0.5 * 7) }

    var body: some View {
        VStack(spacing: 0) {
            // Header - title with line break
            Text(L10n.Onboarding.projectionTitle)
                .font(.system(size: 32, weight: .heavy))
                .foregroundStyle(themeColors.textPrimary)
                .tracking(-1)
                .multilineTextAlignment(.center)
                .padding(.top, 20)
                .padding(.bottom, 12)
                .padding(.horizontal, 24)

            // Subtitle - bigger text
            Text(String(format: L10n.Onboarding.projectionSubtitle, savedHoursWeekly))
                .font(.system(size: 19))
                .foregroundStyle(themeColors.textSecondary)
                .padding(.bottom, 32)

            // Diverging Curves Chart - taller
            DivergingCurvesChartView(themeColors: themeColors)
                .frame(height: 320)
                .padding(.horizontal, 24)

            // White Glass Button - directly under chart
            WhiteGlassButtonView(title: L10n.Common.continue, onTap: onContinue)
                .padding(.horizontal, 24)
                .padding(.top, 40)

            Spacer()
        }
    }
}

// MARK: - Diverging Curves Chart View
/// Shows two diverging lines: "With LockIn" (going up/white) and "Without LockIn" (going down/red)

struct DivergingCurvesChartView: View {
    let themeColors: ThemeColors

    @State private var animationProgress: CGFloat = 0

    // Rich red colors for the "Without LockIn" path
    private let redGradient = [
        Color(red: 1.0, green: 0.35, blue: 0.35),
        Color(red: 0.85, green: 0.15, blue: 0.15)
    ]
    private let redColor = Color(red: 0.95, green: 0.25, blue: 0.25)

    var body: some View {
        GeometryReader { geo in
            let width = geo.size.width
            let height = geo.size.height
            let chartHeight = height - 30 // Leave space for time markers
            let startY = chartHeight * 0.5
            let withLockInEndY = chartHeight * 0.08
            let withoutEndY = chartHeight * 0.92

            ZStack(alignment: .top) {
                VStack(spacing: 0) {
                    // Chart area
                    ZStack {
                        // Grid lines (dashed)
                        ForEach([0.15, 0.40, 0.65, 0.90], id: \.self) { ratio in
                            DashedLine()
                                .stroke(
                                    themeColors.isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.06),
                                    style: StrokeStyle(lineWidth: 1, dash: [5, 5])
                                )
                                .frame(height: 1)
                                .offset(y: chartHeight * ratio - chartHeight / 2)
                        }

                        // Red gradient fill under the "Without" curve
                        Path { path in
                            let points = generateCurvePoints(
                                width: width,
                                startY: startY,
                                endY: withoutEndY,
                                amplitude: 30,
                                segments: 50,
                                inverted: false
                            )
                            if let first = points.first {
                                path.move(to: CGPoint(x: first.x, y: chartHeight))
                                path.addLine(to: first)
                                for point in points.dropFirst() {
                                    path.addLine(to: point)
                                }
                                if let last = points.last {
                                    path.addLine(to: CGPoint(x: last.x, y: chartHeight))
                                }
                                path.closeSubpath()
                            }
                        }
                        .fill(
                            LinearGradient(
                                colors: [redColor.opacity(0.3), redColor.opacity(0.05)],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .opacity(Double(animationProgress))

                        // "Without LockIn" curve (red, going down)
                        Path { path in
                            let points = generateCurvePoints(
                                width: width,
                                startY: startY,
                                endY: withoutEndY,
                                amplitude: 30,
                                segments: 50,
                                inverted: false
                            )
                            if let first = points.first {
                                path.move(to: first)
                                for point in points.dropFirst() {
                                    path.addLine(to: point)
                                }
                            }
                        }
                        .trim(from: 0, to: animationProgress)
                        .stroke(
                            LinearGradient(colors: redGradient, startPoint: .leading, endPoint: .trailing),
                            style: StrokeStyle(lineWidth: 3, lineCap: .round)
                        )

                        // "With LockIn" curve (white, going up)
                        Path { path in
                            let points = generateCurvePoints(
                                width: width,
                                startY: startY,
                                endY: withLockInEndY,
                                amplitude: 30,
                                segments: 50,
                                inverted: true
                            )
                            if let first = points.first {
                                path.move(to: first)
                                for point in points.dropFirst() {
                                    path.addLine(to: point)
                                }
                            }
                        }
                        .trim(from: 0, to: animationProgress)
                        .stroke(
                            themeColors.isDark ? Color.white : themeColors.textPrimary,
                            style: StrokeStyle(lineWidth: 3, lineCap: .round)
                        )

                        // End labels with dots to the right of text
                        if animationProgress > 0.9 {
                            // "With LockIn" label with dot - positioned above line end
                            HStack(spacing: 6) {
                                Text(L10n.Onboarding.withLockIn)
                                    .font(.system(size: 11, weight: .semibold))
                                    .foregroundStyle(themeColors.isDark ? .white : themeColors.textPrimary)
                                Circle()
                                    .fill(themeColors.isDark ? Color.white : themeColors.textPrimary)
                                    .frame(width: 10, height: 10)
                            }
                            .position(x: width - 50, y: withLockInEndY - 16)
                            .transition(.opacity)

                            // "Without LockIn" label with dot - positioned below line end
                            HStack(spacing: 6) {
                                Text(L10n.Onboarding.withoutLockIn)
                                    .font(.system(size: 11, weight: .semibold))
                                    .foregroundStyle(redColor)
                                Circle()
                                    .fill(redColor)
                                    .frame(width: 10, height: 10)
                            }
                            .position(x: width - 55, y: withoutEndY + 16)
                            .transition(.opacity)
                        }
                    }
                    .frame(height: chartHeight)

                    // Time markers at bottom - Day 1 and Day 14
                    HStack {
                        Text(L10n.Onboarding.dayOne)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(themeColors.textTertiary)
                        Spacer()
                        Text(L10n.Onboarding.dayFourteen)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(themeColors.textTertiary)
                    }
                    .padding(.horizontal, 4)
                    .padding(.top, 8)
                    .frame(height: 30)
                }
            }
        }
        .onAppear {
            withAnimation(.easeOut(duration: 2.0)) {
                animationProgress = 1.0
            }
        }
    }

    private func generateCurvePoints(
        width: CGFloat,
        startY: CGFloat,
        endY: CGFloat,
        amplitude: CGFloat,
        segments: Int,
        inverted: Bool
    ) -> [CGPoint] {
        var points: [CGPoint] = []
        for i in 0...segments {
            let t = CGFloat(i) / CGFloat(segments)
            let x = t * (width - 20)

            // Amplitude modifier
            let ampMod: CGFloat
            if inverted {
                ampMod = t < 0.5 ? 0.3 + t * 0.4 : 0.5 + (t - 0.5) * 1
            } else {
                ampMod = 1.0
            }

            // Wave calculation
            let wave: CGFloat
            if inverted {
                wave = -sin(t * .pi * 2.5) * amplitude * ampMod * (1 - t * 0.5)
            } else {
                wave = sin(t * .pi * 2.5) * amplitude * (1 - t * 0.6)
            }

            // Trend (exponential ease)
            let trend = startY + (endY - startY) * pow(t, 0.9)

            points.append(CGPoint(x: x, y: trend + wave))
        }
        return points
    }
}

// MARK: - Dashed Line Shape

struct DashedLine: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: 0, y: rect.midY))
        path.addLine(to: CGPoint(x: rect.width, y: rect.midY))
        return path
    }
}

// MARK: - App Icon View
/// Loads the app icon from the bundle

struct AppIconView: View {
    var body: some View {
        if let iconName = Bundle.main.object(forInfoDictionaryKey: "CFBundleIcons") as? [String: Any],
           let primaryIcon = iconName["CFBundlePrimaryIcon"] as? [String: Any],
           let iconFiles = primaryIcon["CFBundleIconFiles"] as? [String],
           let lastIcon = iconFiles.last,
           let uiImage = UIImage(named: lastIcon) {
            Image(uiImage: uiImage)
                .resizable()
                .aspectRatio(contentMode: .fill)
        } else {
            // Fallback: styled placeholder that looks like app icon
            ZStack {
                LinearGradient(
                    colors: [
                        Color(red: 0.55, green: 0.36, blue: 0.96),
                        Color(red: 0.4, green: 0.25, blue: 0.85)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )

                Image(systemName: "lock.fill")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundStyle(.white)
            }
        }
    }
}

// MARK: - Step 13: Features & Comparison

struct Step13ComparisonView: View {
    let dailyHours: Double
    let onContinue: () -> Void
    let themeColors: ThemeColors

    @Environment(PurchaseService.self) private var purchaseService

    private var savedHoursWeekly: Int { Int(dailyHours * 0.5 * 7) }

    @State private var currentReview = 0
    @State private var showPaywall = false

    private var reviews: [(name: String, text: String)] {
        [
            (name: L10n.Onboarding.review1Author, text: L10n.Onboarding.review1Text),
            (name: L10n.Onboarding.review2Author, text: L10n.Onboarding.review2Text),
            (name: L10n.Onboarding.review3Author, text: L10n.Onboarding.review3Text),
            (name: L10n.Onboarding.review4Author, text: L10n.Onboarding.review4Text)
        ]
    }

    private var features: [(icon: String, title: String, description: String, color: Color)] {
        [
            (icon: "brain.head.profile", title: L10n.Onboarding.smartCoach, description: "Verifies task completion through chat", color: Color(hex: "8B5CF6")),
            (icon: "checkmark.circle.fill", title: L10n.Onboarding.taskVerification, description: "Prove you completed your goals", color: Color(hex: "10B981")),
            (icon: "target", title: L10n.Onboarding.focusSessions, description: "Block distractions while you work", color: Color(hex: "06B6D4")),
            (icon: "sparkles", title: L10n.Onboarding.dailyGoals, description: "Build better habits consistently", color: Color(hex: "F59E0B"))
        ]
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 0) {
                // Header
                AnimatedOrbView(size: 70, level: 3)
                    .padding(.top, 20)
                    .padding(.bottom, 20)

                Text(L10n.Onboarding.unlockPotential)
                    .font(.system(size: 28, weight: .heavy))
                    .foregroundStyle(themeColors.textPrimary)
                    .tracking(-0.5)
                    .padding(.bottom, 8)

                HStack(spacing: 0) {
                    Text(String(format: L10n.Onboarding.hoursBack, savedHoursWeekly))
                        .foregroundStyle(themeColors.textSecondary)
                }
                .font(.system(size: 15))
                .padding(.bottom, 24)

                // Features Grid
                VStack(spacing: 10) {
                    ForEach(features, id: \.title) { feature in
                        featureRow(icon: feature.icon, title: feature.title, description: feature.description, color: feature.color)
                    }
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 24)

                // Social Proof
                socialProofSection
                    .padding(.horizontal, 24)
                    .padding(.bottom, 24)

                // CTA Button - Shows Paywall
                GradientButtonView(title: L10n.Onboarding.startFreeTrial, subtitle: L10n.Onboarding.daysFree, onTap: {
                    showPaywall = true
                })
                    .padding(.horizontal, 24)
                    .padding(.bottom, 12)

                // DEV ACCESS - Comment out for production
//                 Button(action: onContinue) {
//                     Text(L10n.Onboarding.maybeLater)
//                         .font(.system(size: 14))
//                         .foregroundStyle(themeColors.textTertiary)
//                 }
//                 .padding(.bottom, 40)
            }
        }
        .onAppear {
            startReviewCycle()
        }
        .fullScreenCover(isPresented: $showPaywall) {
            PaywallView(onPurchaseComplete: {
                showPaywall = false
                onContinue()
            })
        }
    }

    private func featureRow(icon: String, title: String, description: String, color: Color) -> some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(themeColors.isDark ? Color.white.opacity(0.06) : Color.black.opacity(0.03))
                    .frame(width: 44, height: 44)

                Image(systemName: icon)
                    .font(.system(size: 22))
                    .foregroundStyle(color)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(themeColors.textPrimary)

                Text(description)
                    .font(.system(size: 13))
                    .foregroundStyle(themeColors.textSecondary)
            }

            Spacer()
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(themeColors.cardBg)
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(themeColors.cardBorder, lineWidth: 0.5)
                )
        )
    }

    private var socialProofSection: some View {
        VStack(spacing: 20) {
            // Stats Row
            HStack {
                VStack(spacing: 2) {
                    Text("92%")
                        .font(.system(size: 22, weight: .heavy))
                        .foregroundStyle(Color(hex: "10B981"))
                    Text(L10n.Onboarding.completeTasks)
                        .font(.system(size: 11))
                        .foregroundStyle(themeColors.textSecondary)
                }
                .frame(maxWidth: .infinity)

                Rectangle()
                    .fill(themeColors.cardBorder)
                    .frame(width: 1, height: 40)

                VStack(spacing: 2) {
                    HStack(spacing: 4) {
                        Text("4.8")
                            .font(.system(size: 22, weight: .heavy))
                            .foregroundStyle(themeColors.textPrimary)
                        Image(systemName: "star.fill")
                            .font(.system(size: 16))
                            .foregroundStyle(Color(hex: "FBBF24"))
                    }
                    Text(L10n.Onboarding.appRating)
                        .font(.system(size: 11))
                        .foregroundStyle(themeColors.textSecondary)
                }
                .frame(maxWidth: .infinity)

                Rectangle()
                    .fill(themeColors.cardBorder)
                    .frame(width: 1, height: 40)

                VStack(spacing: 2) {
                    Text("3x")
                        .font(.system(size: 22, weight: .heavy))
                        .foregroundStyle(themeColors.textPrimary)
                    Text(L10n.Onboarding.moreProductive)
                        .font(.system(size: 11))
                        .foregroundStyle(themeColors.textSecondary)
                }
                .frame(maxWidth: .infinity)
            }
            .padding(.bottom, 16)

            Divider()
                .background(themeColors.cardBorder)

            // Review
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 2) {
                    ForEach(0..<5, id: \.self) { _ in
                        Image(systemName: "star.fill")
                            .font(.system(size: 16))
                            .foregroundStyle(Color(hex: "FBBF24"))
                    }
                }

                Text("\"\(reviews[currentReview].text)\"")
                    .font(.system(size: 15))
                    .foregroundStyle(themeColors.textPrimary)
                    .italic()
                    .lineSpacing(4)

                HStack {
                    Text(reviews[currentReview].name)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(themeColors.textPrimary)

                    Spacer()

                    HStack(spacing: 6) {
                        ForEach(0..<reviews.count, id: \.self) { index in
                            Circle()
                                .fill(index == currentReview ? themeColors.textPrimary : themeColors.glassMedium)
                                .frame(width: 6, height: 6)
                        }
                    }
                }
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(themeColors.cardBg)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(themeColors.cardBorder, lineWidth: 0.5)
                )
        )
    }

    private func startReviewCycle() {
        Timer.scheduledTimer(withTimeInterval: 4.0, repeats: true) { _ in
            withAnimation {
                currentReview = (currentReview + 1) % reviews.count
            }
        }
    }
}

// MARK: - Step 14: Notifications

struct Step14NotificationsView: View {
    let onContinue: () -> Void
    let themeColors: ThemeColors

    @State private var hasPermission = false

    var body: some View {
        // Center content vertically
        VStack(spacing: 0) {
            Spacer()

            // Notification Preview - centered
            notificationPreview
                .padding(.horizontal, 24)
                .padding(.bottom, 32)

            Text(L10n.Onboarding.allowNotifications)
                .font(.system(size: 28, weight: .heavy))
                .foregroundStyle(themeColors.textPrimary)
                .tracking(-0.5)
                .multilineTextAlignment(.center)
                .padding(.bottom, 12)

            Text(L10n.Onboarding.remindOverscrolling)
                .font(.system(size: 16))
                .foregroundStyle(themeColors.textSecondary)
                .multilineTextAlignment(.center)
                .lineSpacing(4)
                .padding(.horizontal, 24)
                .padding(.bottom, 40)

            if hasPermission {
                GlassCardView(themeColors: themeColors) {
                    VStack(spacing: 12) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 36))
                            .foregroundStyle(GradientPalette.success)

                        Text(L10n.Onboarding.notificationsEnabled)
                            .font(.system(size: 18, weight: .bold))
                            .foregroundStyle(GradientPalette.success)
                    }
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 24)

                GradientButtonView(
                    title: L10n.Common.continue,
                    colors: GradientColors.success,
                    onTap: onContinue
                )
                .padding(.horizontal, 24)
            } else {
                GradientButtonView(title: L10n.Common.continue, onTap: {
                    requestNotificationPermission()
                })
                .padding(.horizontal, 24)
                .padding(.bottom, 12)

                Button(action: onContinue) {
                    Text(L10n.Onboarding.maybeLater)
                        .font(.system(size: 14))
                        .foregroundStyle(themeColors.textTertiary)
                }
            }

            Spacer()
        }
    }

    private var notificationPreview: some View {
        HStack(spacing: 14) {
            // LockIn App Icon - load from bundle
            AppIconView()
                .frame(width: 48, height: 48)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.white.opacity(0.2), lineWidth: 0.5)
                )

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("LockIn")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(themeColors.textPrimary)

                    Spacer()

                    Text(L10n.Onboarding.now)
                        .font(.system(size: 12))
                        .foregroundStyle(themeColors.textTertiary)
                }

                Text(L10n.Onboarding.scrollingFor + " " + L10n.Onboarding.timeForBreak)
                    .font(.system(size: 14))
                    .foregroundStyle(themeColors.textSecondary)
                    .lineSpacing(4)
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(themeColors.isDark ? Color.white.opacity(0.08) : .white)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(themeColors.cardBorder, lineWidth: 1)
                )
                .shadow(color: .black.opacity(0.1), radius: 12, y: 4)
        )
    }

    private func requestNotificationPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
            DispatchQueue.main.async {
                hasPermission = granted
                if granted {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        onContinue()
                    }
                }
            }
        }
    }
}

// MARK: - Step 15: App Selection

struct Step15AppSelectionView: View {
    let onConfirm: () -> Void
    let themeColors: ThemeColors

    @Environment(BlockingService.self) private var blockingService

    var body: some View {
        VStack(spacing: 0) {
            Text(L10n.Onboarding.whatToBlock)
                .font(.system(size: 28, weight: .heavy))
                .foregroundStyle(themeColors.textPrimary)
                .tracking(-0.5)
                .padding(.top, 20)
                .padding(.bottom, 8)

            Text(L10n.Onboarding.changeThisLater)
                .font(.system(size: 15))
                .foregroundStyle(themeColors.textSecondary)
                .padding(.bottom, 16)

            if blockingService.totalBlockedCount > 0 {
                HStack(spacing: 16) {
                    Label("\(blockingService.blockedAppsCount) " + L10n.Onboarding.apps, systemImage: "app.fill")
                    Label("\(blockingService.blockedCategoriesCount) " + L10n.Onboarding.categories, systemImage: "folder.fill")
                }
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(GradientPalette.purple)
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .background(GradientPalette.purple.opacity(0.1))
                .clipShape(Capsule())
                .padding(.bottom, 16)
            }

            // Family Activity Picker - clipped with rounded corners
            FamilyActivityPicker(selection: Binding(
                get: { blockingService.selectedApps },
                set: { blockingService.selectedApps = $0 }
            ))

            Spacer()
                .frame(height: 16)

            GradientButtonView(
                title: L10n.Onboarding.startBlocking,
                subtitle: "\(blockingService.totalBlockedCount) " + L10n.Onboarding.itemsSelected,
                onTap: onConfirm
            )
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
        }
    }
}

// MARK: - Reusable Components

/// Gradient Button - Apple Liquid Glass style matching RN GradientButton
/// Features: blur base, color tint, glass overlay, top shine, bottom shadow, external glow
struct GradientButtonView: View {
    let title: String
    var subtitle: String? = nil
    var colors: [Color] = [Color(hex: "8B5CF6"), Color(hex: "06B6D4")]
    let onTap: () -> Void
    var disabled: Bool = false

    @Environment(\.colorScheme) private var colorScheme
    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        Button(action: onTap) {
            ZStack {
                // Base blur layer (Apple Liquid)
                RoundedRectangle(cornerRadius: 20)
                    .fill(.ultraThinMaterial)

                // Subtle color tint from accent
                RoundedRectangle(cornerRadius: 20)
                    .fill(
                        LinearGradient(
                            colors: isDark
                                ? [colors[0].opacity(0.15), colors[0].opacity(0.08)]
                                : [colors[0].opacity(0.12), colors[0].opacity(0.06)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )

                // Glass base - more opaque for depth
                RoundedRectangle(cornerRadius: 20)
                    .fill(
                        LinearGradient(
                            colors: isDark
                                ? [Color(red: 0.16, green: 0.16, blue: 0.2).opacity(0.95),
                                   Color(red: 0.12, green: 0.12, blue: 0.16).opacity(0.9)]
                                : [Color.white.opacity(0.98),
                                   Color(red: 0.96, green: 0.96, blue: 0.98).opacity(0.95)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )

                // Top shine for 3D effect
                VStack {
                    RoundedRectangle(cornerRadius: 20)
                        .fill(
                            LinearGradient(
                                colors: isDark
                                    ? [Color.white.opacity(0.2), .clear]
                                    : [Color.white.opacity(0.9), .clear],
                                startPoint: .top,
                                endPoint: .center
                            )
                        )
                        .frame(height: 30)
                    Spacer()
                }
                .clipShape(RoundedRectangle(cornerRadius: 20))

                // Bottom shadow for depth
                VStack {
                    Spacer()
                    RoundedRectangle(cornerRadius: 20)
                        .fill(
                            LinearGradient(
                                colors: [.clear, isDark ? Color.black.opacity(0.15) : Color.black.opacity(0.05)],
                                startPoint: .center,
                                endPoint: .bottom
                            )
                        )
                        .frame(height: 30)
                }
                .clipShape(RoundedRectangle(cornerRadius: 20))

                // Content
                VStack(spacing: 4) {
                    Text(title)
                        .font(.system(size: 17, weight: .bold))
                        .foregroundStyle(isDark ? .white : Color(hex: "1a1a2e"))
                        .tracking(0.3)

                    if let subtitle = subtitle {
                        Text(subtitle)
                            .font(.system(size: 13))
                            .foregroundStyle(isDark ? Color.white.opacity(0.7) : Color.black.opacity(0.5))
                    }
                }
                .padding(.vertical, 18)
            }
            .frame(maxWidth: .infinity)
            .frame(height: subtitle != nil ? 72 : 56)
            .clipShape(RoundedRectangle(cornerRadius: 20))
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(
                        isDark ? Color.white.opacity(0.15) : Color.white.opacity(0.8),
                        lineWidth: 1
                    )
            )
            .shadow(color: colors[0].opacity(0.3), radius: 16, y: 8)
            .opacity(disabled ? 0.5 : 1)
        }
        .disabled(disabled)
    }
}

/// White Glass Button - Apple Liquid Glass style matching RN WhiteGlassButton
/// Inverted colors: white in dark mode, dark in light mode
struct WhiteGlassButtonView: View {
    let title: String
    let onTap: () -> Void
    var disabled: Bool = false

    @Environment(\.colorScheme) private var colorScheme
    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        Button(action: onTap) {
            ZStack {
                // Base blur layer (Apple Liquid)
                RoundedRectangle(cornerRadius: 20)
                    .fill(.ultraThinMaterial)

                // Glass base - inverted colors
                RoundedRectangle(cornerRadius: 20)
                    .fill(
                        LinearGradient(
                            colors: isDark
                                ? [Color.white.opacity(0.98), Color(red: 0.94, green: 0.94, blue: 0.96).opacity(0.95)]
                                : [Color(red: 0.08, green: 0.08, blue: 0.12).opacity(0.98), Color(red: 0.12, green: 0.12, blue: 0.16).opacity(0.95)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )

                // Top shine for 3D effect
                VStack {
                    RoundedRectangle(cornerRadius: 20)
                        .fill(
                            LinearGradient(
                                colors: isDark
                                    ? [Color.white.opacity(0.5), .clear]
                                    : [Color.white.opacity(0.15), .clear],
                                startPoint: .top,
                                endPoint: .center
                            )
                        )
                        .frame(height: 30)
                    Spacer()
                }
                .clipShape(RoundedRectangle(cornerRadius: 20))

                // Bottom shadow for depth
                VStack {
                    Spacer()
                    RoundedRectangle(cornerRadius: 20)
                        .fill(
                            LinearGradient(
                                colors: [.clear, isDark ? Color.black.opacity(0.08) : Color.black.opacity(0.2)],
                                startPoint: .center,
                                endPoint: .bottom
                            )
                        )
                        .frame(height: 30)
                }
                .clipShape(RoundedRectangle(cornerRadius: 20))

                // Content
                HStack {
                    Text(title)
                        .font(.system(size: 17, weight: .bold))
                        .foregroundStyle(isDark ? Color(hex: "1a1a2e") : .white)
                        .tracking(0.3)

                    Text(">")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(isDark ? Color(hex: "1a1a2e") : .white)
                }
                .padding(.vertical, 18)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .clipShape(RoundedRectangle(cornerRadius: 20))
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(
                        isDark ? Color.white.opacity(0.3) : Color.black.opacity(0.1),
                        lineWidth: 1
                    )
            )
            .shadow(
                color: isDark ? Color.white.opacity(0.3) : Color.black.opacity(0.15),
                radius: 16,
                y: 8
            )
            .opacity(disabled ? 0.5 : 1)
        }
        .disabled(disabled)
    }
}

// MARK: - Goal Selection Step (NEW)

struct StepGoalSelectionView: View {
    @Binding var selectedMinutes: Int
    let onContinue: () -> Void
    let themeColors: ThemeColors

    // Slider range: 15 min to 480 min (8 hours)
    private let minMinutes: Double = 15
    private let maxMinutes: Double = 180 // 3 hours max

    private var sliderValue: Double {
        get { Double(selectedMinutes) }
        nonmutating set { }
    }

    private var selectedTimeString: String {
        if selectedMinutes < 60 {
            return "\(selectedMinutes) min"
        }
        let hours = selectedMinutes / 60
        let mins = selectedMinutes % 60
        if mins == 0 {
            return "\(hours)h"
        }
        return "\(hours)h \(mins)m"
    }

    private var goalDescription: String {
        if selectedMinutes <= 15 { return "Minimal usage" }
        if selectedMinutes <= 30 { return "Light usage" }
        if selectedMinutes <= 60 { return "Moderate usage" }
        if selectedMinutes <= 120 { return "Balanced approach" }
        return "Flexible usage"
    }

    var body: some View {
        VStack(spacing: 0) {
            Spacer()

            // Icon
            Image(systemName: "target")
                .font(.system(size: 56))
                .foregroundStyle(GradientPalette.success)
                .padding(.bottom, 24)

            Text(L10n.Onboarding.setDailyGoal)
                .font(.system(size: 32, weight: .heavy))
                .foregroundStyle(themeColors.textPrimary)
                .tracking(-0.5)
                .padding(.bottom, 12)

            Text(L10n.Onboarding.howMuchAllow)
                .font(.system(size: 16))
                .foregroundStyle(themeColors.textSecondary)
                .multilineTextAlignment(.center)
                .lineSpacing(4)
                .padding(.horizontal, 24)
                .padding(.bottom, 40)

            // Big Time Display Card
            VStack(spacing: 8) {
                Text(selectedTimeString)
                    .font(.system(size: 64, weight: .heavy))
                    .foregroundStyle(GradientPalette.success)
                    .tracking(-2)

                Text(goalDescription)
                    .font(.system(size: 14))
                    .foregroundStyle(themeColors.textSecondary)
            }
            .padding(.vertical, 32)
            .frame(maxWidth: .infinity)
            .background(
                RoundedRectangle(cornerRadius: 24)
                    .fill(GradientPalette.success.opacity(themeColors.isDark ? 0.1 : 0.08))
                    .overlay(
                        RoundedRectangle(cornerRadius: 24)
                            .stroke(GradientPalette.success.opacity(0.2), lineWidth: 1)
                    )
            )
            .padding(.horizontal, 24)
            .padding(.bottom, 32)

            // Custom Slider
            GoalSliderView(
                value: Binding(
                    get: { Double(selectedMinutes) },
                    set: { selectedMinutes = Int($0) }
                ),
                range: minMinutes...maxMinutes,
                step: 15,
                themeColors: themeColors
            )
            .padding(.horizontal, 32)
            .padding(.bottom, 16)

            // Slider labels
            HStack {
                Text("15m")
                    .font(.system(size: 12))
                    .foregroundStyle(themeColors.textTertiary)
                Spacer()
                Text("3h")
                    .font(.system(size: 12))
                    .foregroundStyle(themeColors.textTertiary)
            }
            .padding(.horizontal, 32)
            .padding(.bottom, 40)

            // Hint text
            Text(L10n.Onboarding.changeInSettings)
                .font(.system(size: 14))
                .foregroundStyle(themeColors.textTertiary)
                .padding(.bottom, 24)

            GradientButtonView(
                title: L10n.Onboarding.setMyGoal,
                colors: GradientColors.success,
                onTap: onContinue
            )
            .padding(.horizontal, 24)

            Spacer()
        }
    }
}

// MARK: - Goal Slider View

struct GoalSliderView: View {
    @Binding var value: Double
    let range: ClosedRange<Double>
    var step: Double = 15
    let themeColors: ThemeColors

    @State private var isDragging = false

    private var progress: Double {
        (value - range.lowerBound) / (range.upperBound - range.lowerBound)
    }

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                // Track background
                RoundedRectangle(cornerRadius: 4)
                    .fill(themeColors.isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.08))
                    .frame(height: 8)

                // Filled track with gradient
                RoundedRectangle(cornerRadius: 4)
                    .fill(
                        LinearGradient(
                            colors: GradientColors.success,
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: geo.size.width * progress, height: 8)

                // Thumb
                Circle()
                    .fill(.white)
                    .frame(width: 28, height: 28)
                    .shadow(color: GradientPalette.success.opacity(0.3), radius: 8, y: 4)
                    .overlay(
                        Circle()
                            .fill(GradientPalette.success)
                            .frame(width: 12, height: 12)
                    )
                    .scaleEffect(isDragging ? 1.15 : 1)
                    .offset(x: (geo.size.width - 28) * progress)
                    .gesture(
                        DragGesture(minimumDistance: 0)
                            .onChanged { gesture in
                                isDragging = true
                                let newProgress = min(max(0, gesture.location.x / geo.size.width), 1)
                                let rawValue = range.lowerBound + (range.upperBound - range.lowerBound) * newProgress
                                // Snap to step
                                let steppedValue = round(rawValue / step) * step
                                value = min(max(steppedValue, range.lowerBound), range.upperBound)
                            }
                            .onEnded { _ in
                                withAnimation(.spring(response: 0.3)) {
                                    isDragging = false
                                }
                            }
                    )
            }
        }
        .frame(height: 28)
    }
}

struct GoalPillButton: View {
    let label: String
    let isSelected: Bool
    let themeColors: ThemeColors
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            Text(label)
                .font(.system(size: 16, weight: isSelected ? .bold : .semibold))
                .foregroundStyle(isSelected ? .white : themeColors.textSecondary)
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .background(
                    Capsule()
                        .fill(
                            isSelected
                                ? LinearGradient(
                                    colors: GradientColors.success,
                                    startPoint: .leading,
                                    endPoint: .trailing
                                  )
                                : LinearGradient(
                                    colors: [themeColors.glassMedium, themeColors.glassMedium],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                  )
                        )
                )
                .overlay(
                    Capsule()
                        .stroke(
                            isSelected
                                ? Color.clear
                                : themeColors.glassBorder,
                            lineWidth: 1
                        )
                )
                .shadow(
                    color: isSelected ? Color(hex: "10B981").opacity(0.3) : .clear,
                    radius: 8,
                    y: 4
                )
        }
    }
}

/// Glass Card Button - Apple Liquid Glass style matching RN GlassCard
/// Features: blur base, gradient overlay, top shine effect
struct GlassCardButton: View {
    let title: String
    let onTap: () -> Void
    let themeColors: ThemeColors

    var body: some View {
        Button(action: onTap) {
            HStack {
                Text(title)
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(themeColors.textPrimary)

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(themeColors.textTertiary)
            }
            .padding(20)
            .background(
                ZStack {
                    // Base blur layer (Apple Liquid)
                    RoundedRectangle(cornerRadius: 20)
                        .fill(.ultraThinMaterial)

                    // Glass gradient overlay
                    RoundedRectangle(cornerRadius: 20)
                        .fill(
                            LinearGradient(
                                colors: themeColors.isDark
                                    ? [Color.white.opacity(0.06), Color.white.opacity(0.02)]
                                    : [Color.white.opacity(0.9), Color.white.opacity(0.7)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )

                    // Top shine for 3D depth
                    VStack {
                        RoundedRectangle(cornerRadius: 20)
                            .fill(
                                LinearGradient(
                                    colors: themeColors.isDark
                                        ? [Color.white.opacity(0.06), .clear]
                                        : [Color.white.opacity(0.4), .clear],
                                    startPoint: .top,
                                    endPoint: .center
                                )
                            )
                            .frame(height: 35)
                        Spacer()
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 20))
                }
            )
            .clipShape(RoundedRectangle(cornerRadius: 20))
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(
                        themeColors.isDark ? Color.white.opacity(0.1) : Color.white.opacity(0.6),
                        lineWidth: 1
                    )
            )
        }
    }
}

// MARK: - Glass Card View (Reusable)
/// Apple Liquid Glass container matching RN GlassCard component
/// Variants: default, light, heavy, gradient

struct GlassCardView<Content: View>: View {
    let content: Content
    let themeColors: ThemeColors
    var variant: GlassVariant = .default
    var noPadding: Bool = false
    var gradientBorder: Bool = false

    enum GlassVariant {
        case `default`, light, heavy, gradient
    }

    init(
        themeColors: ThemeColors,
        variant: GlassVariant = .default,
        noPadding: Bool = false,
        gradientBorder: Bool = false,
        @ViewBuilder content: () -> Content
    ) {
        self.themeColors = themeColors
        self.variant = variant
        self.noPadding = noPadding
        self.gradientBorder = gradientBorder
        self.content = content()
    }

    private var bgOpacity: Double {
        switch variant {
        case .default: return themeColors.isDark ? 0.08 : 0.06
        case .light: return themeColors.isDark ? 0.05 : 0.04
        case .heavy: return themeColors.isDark ? 0.12 : 0.10
        case .gradient: return themeColors.isDark ? 0.08 : 0.05
        }
    }

    var body: some View {
        let cardContent = ZStack {
            // Base blur (Apple Liquid)
            RoundedRectangle(cornerRadius: gradientBorder ? 18 : 20)
                .fill(.ultraThinMaterial)

            // Glass gradient overlay
            RoundedRectangle(cornerRadius: gradientBorder ? 18 : 20)
                .fill(
                    LinearGradient(
                        colors: themeColors.isDark
                            ? [Color.white.opacity(0.06), Color.white.opacity(0.02)]
                            : [Color.white.opacity(0.9), Color.white.opacity(0.7)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )

            // Top shine
            VStack {
                RoundedRectangle(cornerRadius: gradientBorder ? 18 : 20)
                    .fill(
                        LinearGradient(
                            colors: themeColors.isDark
                                ? [Color.white.opacity(0.06), .clear]
                                : [Color.white.opacity(0.4), .clear],
                            startPoint: .top,
                            endPoint: .center
                        )
                    )
                    .frame(height: 40)
                Spacer()
            }
            .clipShape(RoundedRectangle(cornerRadius: gradientBorder ? 18 : 20))

            // Gradient variant overlay
            if variant == .gradient {
                RoundedRectangle(cornerRadius: gradientBorder ? 18 : 20)
                    .fill(
                        LinearGradient(
                            colors: themeColors.isDark
                                ? [Color(hex: "8B5CF6").opacity(0.1), Color(hex: "06B6D4").opacity(0.05), .clear]
                                : [Color(hex: "8B5CF6").opacity(0.08), Color(hex: "06B6D4").opacity(0.03), .clear],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            }

            // Content
            content
                .padding(noPadding ? 0 : 20)
        }
        .clipShape(RoundedRectangle(cornerRadius: gradientBorder ? 18 : 20))
        .overlay(
            RoundedRectangle(cornerRadius: gradientBorder ? 18 : 20)
                .stroke(
                    themeColors.isDark ? Color.white.opacity(0.1) : Color.white.opacity(0.6),
                    lineWidth: gradientBorder ? 0 : 1
                )
        )

        if gradientBorder {
            LinearGradient(
                colors: [Color(hex: "8B5CF6").opacity(0.5), Color(hex: "06B6D4").opacity(0.5)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .mask(
                RoundedRectangle(cornerRadius: 20)
                    .strokeBorder(lineWidth: 1)
            )
            .background(cardContent)
        } else {
            cardContent
        }
    }
}

#Preview {
    SellingOnboardingView(isCompleted: .constant(false))
        .environment(BlockingService())
}
