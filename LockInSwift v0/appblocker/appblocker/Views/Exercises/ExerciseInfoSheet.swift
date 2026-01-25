import SwiftUI

/// Info sheet showing exercise instructions and rewards
struct ExerciseInfoSheet: View {
    let exerciseType: ExerciseType
    let onDismiss: () -> Void

    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService

    private var isDark: Bool { colorScheme == .dark }

    private let greenColor = Color(hex: "10b981")
    private let amberColor = Color(hex: "f59e0b")

    var body: some View {
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

            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    VStack(spacing: 12) {
                        if let imageName = exerciseType.imageName, let uiImage = UIImage(named: imageName) {
                            Image(uiImage: uiImage)
                                .resizable()
                                .scaledToFit()
                                .frame(width: 80, height: 80)
                                .clipShape(RoundedRectangle(cornerRadius: 16))
                        } else {
                            Text(exerciseType.emoji)
                                .font(.system(size: 60))
                        }

                        Text(exerciseType.displayName)
                            .font(.system(size: 24, weight: .bold))
                            .foregroundStyle(isDark ? .white : Color(hex: "111827"))

                        Text(exerciseType.localizedDescription)
                            .font(.system(size: 14))
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, 8)

                    // Video placeholder
                    ZStack {
                        RoundedRectangle(cornerRadius: 16)
                            .fill(
                                LinearGradient(
                                    colors: exerciseType.gradientColors.map { $0.opacity(0.2) },
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(height: 160)

                        VStack(spacing: 12) {
                            ZStack {
                                Circle()
                                    .fill(.white.opacity(0.2))
                                    .frame(width: 60, height: 60)

                                Image(systemName: "play.fill")
                                    .font(.system(size: 24))
                                    .foregroundStyle(.white)
                            }

                            Text(L10n.Exercise.watchDemo)
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(isDark ? .white.opacity(0.7) : Color(hex: "374151"))

                            Text(L10n.Exercise.comingSoon)
                                .font(.system(size: 11))
                                .foregroundStyle(.secondary)
                        }
                    }

                    // Instructions
                    VStack(alignment: .leading, spacing: 12) {
                        Text(L10n.Exercise.howToDoIt)
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(.secondary)
                            .textCase(.uppercase)
                            .tracking(1)

                        ForEach(Array(exerciseType.instructions.enumerated()), id: \.offset) { index, instruction in
                            HStack(alignment: .top, spacing: 12) {
                                ZStack {
                                    Circle()
                                        .fill(greenColor)
                                        .frame(width: 24, height: 24)

                                    Text("\(index + 1)")
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundStyle(.white)
                                }

                                Text(instruction)
                                    .font(.system(size: 14))
                                    .foregroundStyle(isDark ? Color(hex: "d1d5db") : Color(hex: "374151"))
                                    .lineSpacing(4)
                            }
                        }
                    }

                    // Rewards
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 6) {
                            Image(systemName: "flame.fill")
                                .font(.system(size: 14))
                                .foregroundStyle(amberColor)

                            Text(L10n.Exercise.rewards)
                                .font(.system(size: 13, weight: .bold))
                                .foregroundStyle(amberColor)
                        }

                        Text(exerciseType.rewardDescription)
                            .font(.system(size: 12))
                            .foregroundStyle(.secondary)
                            .lineSpacing(4)
                    }
                    .padding(14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(amberColor.opacity(isDark ? 0.1 : 0.08))
                    )

                    // Got it button
                    Button(action: onDismiss) {
                        Text(L10n.Exercise.gotIt)
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(greenColor)
                            )
                    }
                }
                .padding(20)
            }
        }
    }
}

// MARK: - ExerciseType Extensions

extension ExerciseType {
    var localizedDescription: String {
        switch self {
        case .pushups: return L10n.Exercise.Desc.pushups
        case .squats: return L10n.Exercise.Desc.squats
        case .plank: return L10n.Exercise.Desc.plank
        case .jumpingJacks: return L10n.Exercise.Desc.jumpingJacks
        case .lunges: return L10n.Exercise.Desc.lunges
        case .crunches: return L10n.Exercise.Desc.crunches
        case .shoulderPress: return L10n.Exercise.Desc.shoulderPress
        case .legRaises: return L10n.Exercise.Desc.legRaises
        case .highKnees: return L10n.Exercise.Desc.highKnees
        case .pullUps: return L10n.Exercise.Desc.pullUps
        case .wallSit: return L10n.Exercise.Desc.wallSit
        case .sidePlank: return L10n.Exercise.Desc.sidePlank
        case .photoVerification: return L10n.Exercise.Desc.photoVerification
        case .custom: return L10n.Exercise.Desc.custom
        }
    }

    var instructions: [String] {
        switch self {
        case .pushups:
            return L10n.Exercise.Inst.pushups
        case .squats:
            return L10n.Exercise.Inst.squats
        case .plank:
            return L10n.Exercise.Inst.plank
        case .jumpingJacks:
            return L10n.Exercise.Inst.jumpingJacks
        case .lunges:
            return L10n.Exercise.Inst.lunges
        case .crunches:
            return L10n.Exercise.Inst.crunches
        case .shoulderPress:
            return L10n.Exercise.Inst.shoulderPress
        case .legRaises:
            return L10n.Exercise.Inst.legRaises
        case .highKnees:
            return L10n.Exercise.Inst.highKnees
        case .pullUps:
            return L10n.Exercise.Inst.pullUps
        case .wallSit:
            return L10n.Exercise.Inst.wallSit
        case .sidePlank:
            return L10n.Exercise.Inst.sidePlank
        case .photoVerification, .custom:
            return L10n.Exercise.Inst.photo
        }
    }
}

#Preview {
    ExerciseInfoSheet(exerciseType: .pushups) {}
}
