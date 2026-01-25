import SwiftUI

/// Beautiful glass card showing daily screen time goal progress
struct DailyGoalCard: View {
    let dailyGoal: DailyGoal
    @Environment(\.colorScheme) private var colorScheme

    private var isDark: Bool { colorScheme == .dark }

    // Progress color based on usage percentage
    private var progressColor: Color {
        let pct = dailyGoal.progressPercentage
        if pct >= 0.9 { return Color(hex: "ef4444") }      // Red - danger
        if pct >= 0.7 { return Color(hex: "f59e0b") }      // Orange - warning
        return Color(hex: "10b981")                         // Green - good
    }

    private var progressGradient: [Color] {
        let pct = dailyGoal.progressPercentage
        if pct >= 0.9 { return [Color(hex: "ef4444"), Color(hex: "dc2626")] }
        if pct >= 0.7 { return [Color(hex: "f59e0b"), Color(hex: "d97706")] }
        return [Color(hex: "10b981"), Color(hex: "059669")]
    }

    var body: some View {
        HStack(spacing: 20) {
            // Circular Progress Ring
            circularProgress
                .frame(width: 80, height: 80)

            // Text Content
            VStack(alignment: .leading, spacing: 6) {
                Text(L10n.Home.todaysGoal)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(isDark ? Color(hex: "9ca3af") : Color(hex: "6b7280"))
                    .textCase(.uppercase)
                    .tracking(0.5)

                // Target display
                Text(dailyGoal.formattedTarget)
                    .font(.system(size: 24, weight: .bold))
                    .foregroundStyle(isDark ? .white : Color(hex: "111827"))

                // Progress bar
                progressBar

                // Used time
                HStack(spacing: 4) {
                    Text(dailyGoal.formattedUsed)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(progressColor)

                    Text(L10n.Home.used)
                        .font(.system(size: 13))
                        .foregroundStyle(isDark ? Color(hex: "6b7280") : Color(hex: "9ca3af"))

                    Spacer()

                    Text(dailyGoal.formattedRemaining)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(isDark ? Color(hex: "9ca3af") : Color(hex: "6b7280"))
                }
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(isDark ? Color.white.opacity(0.05) : .white)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.04), lineWidth: 1)
        )
        .shadow(color: .black.opacity(isDark ? 0 : 0.04), radius: 12, y: 4)
    }

    // MARK: - Circular Progress

    private var circularProgress: some View {
        ZStack {
            // Background ring
            Circle()
                .stroke(
                    isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.06),
                    lineWidth: 8
                )

            // Progress ring
            Circle()
                .trim(from: 0, to: dailyGoal.progressPercentage)
                .stroke(
                    LinearGradient(
                        colors: progressGradient,
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    style: StrokeStyle(lineWidth: 8, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .shadow(color: progressColor.opacity(0.4), radius: 4)

            // Center text
            VStack(spacing: 0) {
                if dailyGoal.isGoalReached {
                    Image(systemName: "flag.checkered")
                        .font(.system(size: 20, weight: .medium))
                        .foregroundStyle(progressColor)
                } else {
                    Text(formatRemainingShort(dailyGoal.remainingMinutes))
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(progressColor)

                    Text(L10n.Home.left)
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(isDark ? Color(hex: "6b7280") : Color(hex: "9ca3af"))
                }
            }
        }
    }

    // MARK: - Progress Bar

    private var progressBar: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                // Background
                RoundedRectangle(cornerRadius: 4)
                    .fill(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.06))

                // Progress
                RoundedRectangle(cornerRadius: 4)
                    .fill(
                        LinearGradient(
                            colors: progressGradient,
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: geometry.size.width * dailyGoal.progressPercentage)
                    .shadow(color: progressColor.opacity(0.5), radius: 4)
            }
        }
        .frame(height: 6)
    }

    // MARK: - Helpers

    private func formatRemainingShort(_ minutes: Double) -> String {
        let mins = Int(minutes)
        if mins >= 60 {
            let h = mins / 60
            let m = mins % 60
            return m > 0 ? "\(h)h\(m)" : "\(h)h"
        }
        return "\(mins)m"
    }
}

// MARK: - Preview

#Preview {
    VStack(spacing: 20) {
        // Low usage
        DailyGoalCard(dailyGoal: DailyGoal(
            targetMinutes: 120,
            usedTodayMinutes: 30,
            lastResetDate: Date()
        ))

        // Medium usage
        DailyGoalCard(dailyGoal: DailyGoal(
            targetMinutes: 120,
            usedTodayMinutes: 90,
            lastResetDate: Date()
        ))

        // High usage
        DailyGoalCard(dailyGoal: DailyGoal(
            targetMinutes: 120,
            usedTodayMinutes: 115,
            lastResetDate: Date()
        ))

        // Goal reached
        DailyGoalCard(dailyGoal: DailyGoal(
            targetMinutes: 120,
            usedTodayMinutes: 125,
            lastResetDate: Date()
        ))
    }
    .padding()
    .background(Color.black)
}
