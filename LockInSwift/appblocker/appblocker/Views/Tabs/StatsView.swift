import SwiftUI
import DeviceActivity

// MARK: - StatsView (Matching HTML Design Exactly)

struct StatsView: View {
    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService

    // Colors from HTML
    private let primary = Color(hex: "#0d7ff2")
    private let primaryDeep = Color(hex: "#072b4d")
    private let backgroundDark = Color(hex: "#000000")
    private let greenAccent = Color(hex: "#0bda5b")

    // Sample data
    private let streakDays = 28
    private let focusTime = "45h 12m"
    private let focusChange = "+5.2h"
    private let efficiencyPercent = 92
    private let peakFlow = "10:00 AM"

    // Weekly bar heights (percentage)
    private let weeklyBars: [(day: String, height: CGFloat, isHighlighted: Bool)] = [
        ("M", 0.40, false),
        ("T", 0.60, false),
        ("W", 0.95, true),
        ("T", 0.45, false),
        ("F", 0.70, false),
        ("S", 0.30, false),
        ("S", 0.20, false)
    ]

    // Daily flux data (12 bars)
    private let dailyFlux: [CGFloat] = [0.30, 0.45, 0.60, 0.75, 1.0, 0.90, 0.65, 0.50, 0.40, 0.30, 0.25, 0.20]

    // Mini chart for focus time card
    private let focusMiniChart: [CGFloat] = [0.40, 0.60, 0.90, 0.50, 0.70]

    // Heatmap data (2 rows x 14 columns)
    private let heatmapData: [[CGFloat]] = [
        [0.2, 0.4, 0.2, 0.2, 0.1, 0.6, 0.3, 0.1, 0.2, 1.0, 0.4, 0.1, 0.1, 0.1],
        [0.3, 0.1, 0.1, 0.5, 1.0, 0.4, 0.1, 0.1, 0.1, 0.2, 0.1, 0.3, 0.1, 0.2]
    ]

    // Milestones
    private let milestones: [(icon: String, title: String, isActive: Bool, isLocked: Bool)] = [
        ("medal.fill", "7-Day Warrior", false, false),
        ("brain.head.profile", "Deep Focus", true, false),
        ("calendar", "30 Day Club", false, true)
    ]

    // App usage data
    private let appUsage: [(name: String, category: String, icon: String, time: String, percent: CGFloat)] = [
        ("VS Code", "DEVELOPMENT", "chevron.left.forwardslash.chevron.right", "18h 45m", 0.70),
        ("Notion", "ORGANIZATION", "tablecells", "12h 20m", 0.55),
        ("Terminal", "SYSTEM", "terminal", "6h 15m", 0.30)
    ]

    var body: some View {
        ZStack {
            // Mesh background
            meshBackground
                .ignoresSafeArea()

            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    // Header
                    headerSection
                        .padding(.horizontal, 24)
                        .padding(.top, 16)

                    // Hero streak section
                    heroStreakSection
                        .padding(.top, 16)

                    // Encouragement banner
                    encouragementBanner
                        .padding(.horizontal, 16)
                        .padding(.top, 16)

                    // Stats cards (Focus Time + Efficiency)
                    VStack(spacing: 16) {
                        focusTimeCard
                        efficiencyCard
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 24)

                    // Activity section with chart and heatmap
                    activitySection
                        .padding(.horizontal, 16)
                        .padding(.top, 16)

                    // Milestones
                    milestonesSection
                        .padding(.horizontal, 16)
                        .padding(.top, 24)

                    // App Usage
                    appUsageSection
                        .padding(.horizontal, 16)
                        .padding(.top, 16)

                    // View Full History button
                    viewHistoryButton
                        .padding(.horizontal, 16)
                        .padding(.top, 24)
                        .padding(.bottom, 120)
                }
            }
        }
    }

    // MARK: - Mesh Background

    private var meshBackground: some View {
        ZStack {
            backgroundDark

            // Radial gradient at top
            RadialGradient(
                colors: [primaryDeep, Color.clear],
                center: .top,
                startRadius: 0,
                endRadius: 400
            )
        }
    }

    // MARK: - Header

    private var headerSection: some View {
        HStack {
            Text("Stats")
                .font(.system(size: 20, weight: .bold))
                .foregroundStyle(.white)
                .tracking(-0.5)

            Spacer()

            Button {
                // Share action
            } label: {
                Circle()
                    .fill(Color.white.opacity(0.05))
                    .frame(width: 40, height: 40)
                    .overlay(
                        Circle()
                            .stroke(Color.white.opacity(0.1), lineWidth: 1)
                    )
                    .overlay(
                        Image(systemName: "square.and.arrow.up")
                            .font(.system(size: 16))
                            .foregroundStyle(.white)
                    )
            }
        }
    }

    // MARK: - Hero Streak Section

    private var heroStreakSection: some View {
        VStack(spacing: 16) {
            // Fire icon in glass circle
            ZStack {
                // Glow
                Circle()
                    .fill(primary.opacity(0.2))
                    .frame(width: 120, height: 120)
                    .blur(radius: 30)

                // Glass circle
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [Color.white.opacity(0.04), Color.white.opacity(0.02)],
                            center: .center,
                            startRadius: 0,
                            endRadius: 48
                        )
                    )
                    .frame(width: 96, height: 96)
                    .clipShape(Circle())
                    .overlay(
                        Circle()
                            .stroke(primary.opacity(0.3), lineWidth: 1)
                    )
                    .overlay(
                        Image(systemName: "flame.fill")
                            .font(.system(size: 48))
                            .foregroundStyle(primary)
                            .shadow(color: primary.opacity(0.6), radius: 15)
                    )
            }

            // Streak text
            Text("\(streakDays) Day Streak")
                .font(.system(size: 42, weight: .heavy))
                .foregroundStyle(.white)
                .tracking(-1)

            Text("MASTER LEVEL")
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(Color(hex: "#90adcb"))
                .tracking(3)
        }
        .padding(.vertical, 16)
    }

    // MARK: - Encouragement Banner

    private var encouragementBanner: some View {
        HStack {
            Text("Keep it up! You're in the top 1% of focusers this week. ")
                .font(.system(size: 14))
                .foregroundStyle(.white.opacity(0.95))
            +
            Text("New record!")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(primary)
        }
        .multilineTextAlignment(.center)
        .padding(16)
        .frame(maxWidth: .infinity)
        .background(liquidGlassBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(primary.opacity(0.2), lineWidth: 1)
        )
    }

    // MARK: - Focus Time Card

    private var focusTimeCard: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Header row
            HStack {
                HStack(spacing: 8) {
                    Image(systemName: "timer")
                        .font(.system(size: 16))
                        .foregroundStyle(primaryDeep)

                    Text("FOCUS TIME")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.white.opacity(0.4))
                        .tracking(1)
                }

                Spacer()

                // +12% badge
                HStack(spacing: 4) {
                    Image(systemName: "arrow.up.right")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(greenAccent)

                    Text("+12%")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(greenAccent)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(greenAccent.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 6))
            }

            // Main content
            HStack(alignment: .bottom) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(focusTime)
                        .font(.system(size: 36, weight: .heavy))
                        .foregroundStyle(.white)
                        .tracking(-1)

                    Text("\(focusChange) vs last week")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(greenAccent)
                        .tracking(0.5)
                }

                Spacer()

                // Mini bar chart
                HStack(alignment: .bottom, spacing: 3) {
                    ForEach(focusMiniChart.indices, id: \.self) { index in
                        let isLast = index == 2
                        RoundedRectangle(cornerRadius: 2)
                            .fill(isLast ? primary : primaryDeep.opacity(0.5))
                            .frame(width: 6, height: 48 * focusMiniChart[index])
                            .shadow(color: isLast ? primary.opacity(0.6) : .clear, radius: 6)
                    }
                }
                .frame(height: 48)
            }

            // Progress section
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("CURRENT PHASE")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(.white.opacity(0.4))
                        .tracking(2)

                    Spacer()

                    Text("TARGET: 50H")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(primary)
                        .tracking(1)
                }

                // Progress bar
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 5)
                            .fill(Color.white.opacity(0.05))
                            .frame(height: 10)

                        ZStack(alignment: .trailing) {
                            RoundedRectangle(cornerRadius: 5)
                                .fill(primary)
                                .frame(width: geo.size.width * 0.85, height: 10)
                                .shadow(color: primary.opacity(0.6), radius: 8)

                            // Gradient overlay
                            RoundedRectangle(cornerRadius: 5)
                                .fill(
                                    LinearGradient(
                                        colors: [.clear, .white.opacity(0.2)],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .frame(width: geo.size.width * 0.85, height: 10)
                        }
                    }
                }
                .frame(height: 10)
            }
            .padding(.top, 16)
        }
        .padding(24)
        .background(liquidGlassBackground)
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }

    // MARK: - Efficiency Card

    private var efficiencyCard: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Header row
            HStack {
                HStack(spacing: 8) {
                    Image(systemName: "bolt.fill")
                        .font(.system(size: 16))
                        .foregroundStyle(primaryDeep)

                    Text("EFFICIENCY")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.white.opacity(0.4))
                        .tracking(1)
                }

                Spacer()

                Text("OPTIMAL")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(primary)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(primary.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 6))
            }

            // Main content
            HStack(alignment: .center) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("High")
                        .font(.system(size: 36, weight: .heavy))
                        .foregroundStyle(.white)
                        .tracking(-1)

                    HStack(spacing: 4) {
                        Text("Peak flow:")
                            .font(.system(size: 12))
                            .foregroundStyle(.white.opacity(0.5))

                        Text(peakFlow)
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(primary)
                    }
                }

                Spacer()

                // Circular progress
                ZStack {
                    Circle()
                        .stroke(Color.white.opacity(0.05), lineWidth: 10)
                        .frame(width: 96, height: 96)

                    Circle()
                        .trim(from: 0, to: CGFloat(efficiencyPercent) / 100)
                        .stroke(
                            primary,
                            style: StrokeStyle(lineWidth: 10, lineCap: .round)
                        )
                        .frame(width: 96, height: 96)
                        .rotationEffect(.degrees(-90))
                        .shadow(color: primary.opacity(0.6), radius: 8)

                    Text("\(efficiencyPercent)%")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.white)
                        .shadow(color: .white.opacity(0.1), radius: 10)
                }
            }

            // Daily Flux chart
            VStack(alignment: .leading, spacing: 8) {
                Text("DAILY FLUX")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(.white.opacity(0.4))
                    .tracking(2)

                HStack(alignment: .bottom, spacing: 4) {
                    ForEach(dailyFlux.indices, id: \.self) { index in
                        let isHighlighted = index == 4 || index == 5
                        RoundedRectangle(cornerRadius: 2)
                            .fill(isHighlighted ? primary : primaryDeep.opacity(0.4))
                            .frame(height: 32 * dailyFlux[index])
                            .frame(maxWidth: .infinity)
                            .shadow(color: isHighlighted ? primary.opacity(0.6) : .clear, radius: 4)
                    }
                }
                .frame(height: 32)
            }
            .padding(.top, 8)
        }
        .padding(24)
        .background(liquidGlassBackground)
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }

    // MARK: - Activity Section

    private var activitySection: some View {
        VStack(alignment: .leading, spacing: 32) {
            // Header
            HStack {
                Text("Activity")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(.white)

                Spacer()

                Text("WEEKLY REPORT")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(primary)
                    .tracking(1)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(primary.opacity(0.2))
                    .clipShape(Capsule())
            }

            // Bar chart
            HStack(alignment: .bottom, spacing: 12) {
                ForEach(weeklyBars.indices, id: \.self) { index in
                    let bar = weeklyBars[index]
                    VStack(spacing: 12) {
                        RoundedRectangle(cornerRadius: 6)
                            .fill(
                                LinearGradient(
                                    colors: bar.isHighlighted
                                        ? [primary, primaryDeep]
                                        : [primaryDeep.opacity(0.4), primaryDeep.opacity(0.2)],
                                    startPoint: .top,
                                    endPoint: .bottom
                                )
                            )
                            .frame(height: 160 * bar.height)
                            .frame(maxWidth: .infinity)
                            .overlay(
                                bar.isHighlighted ?
                                RoundedRectangle(cornerRadius: 6)
                                    .stroke(primary.opacity(0.5), lineWidth: 2)
                                    .shadow(color: primary.opacity(0.6), radius: 8)
                                : nil
                            )

                        Text(bar.day)
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(bar.isHighlighted ? primary : .white.opacity(0.4))
                    }
                }
            }
            .frame(height: 180)
            .padding(.horizontal, 8)

            // Heatmap section
            VStack(alignment: .leading, spacing: 16) {
                Divider()
                    .background(Color.white.opacity(0.1))

                Text("FREQUENCY HEATMAP")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(.white.opacity(0.4))
                    .tracking(2)
                    .padding(.top, 8)

                // Heatmap grid (14 columns x 2 rows)
                VStack(spacing: 4) {
                    ForEach(0..<2, id: \.self) { row in
                        HStack(spacing: 4) {
                            ForEach(0..<14, id: \.self) { col in
                                let value = heatmapData[row][col]
                                let isGlowing = value >= 0.9
                                RoundedRectangle(cornerRadius: 2)
                                    .fill(heatmapColor(for: value))
                                    .aspectRatio(1, contentMode: .fit)
                                    .shadow(color: isGlowing ? primary.opacity(0.6) : .clear, radius: 4)
                            }
                        }
                    }
                }
            }
        }
        .padding(24)
        .background(liquidGlassBackground)
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(Color.white.opacity(0.05), lineWidth: 1)
        )
    }

    private func heatmapColor(for value: CGFloat) -> Color {
        if value >= 0.9 {
            return primary
        } else if value >= 0.5 {
            return primary.opacity(0.6)
        } else if value >= 0.3 {
            return primary.opacity(0.3)
        } else if value >= 0.2 {
            return primaryDeep.opacity(0.4)
        } else {
            return primaryDeep.opacity(0.2)
        }
    }

    // MARK: - Milestones Section

    private var milestonesSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Milestones")
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(.white)
                .padding(.horizontal, 4)

            HStack(spacing: 12) {
                ForEach(milestones.indices, id: \.self) { index in
                    let milestone = milestones[index]
                    milestoneItem(
                        icon: milestone.icon,
                        title: milestone.title,
                        isActive: milestone.isActive,
                        isLocked: milestone.isLocked
                    )
                }
            }
        }
    }

    private func milestoneItem(icon: String, title: String, isActive: Bool, isLocked: Bool) -> some View {
        VStack(spacing: 8) {
            ZStack {
                Circle()
                    .fill(
                        isActive
                            ? primary
                            : (isLocked ? Color.white.opacity(0.1) : primaryDeep.opacity(0.4))
                    )
                    .frame(width: 40, height: 40)
                    .shadow(color: isActive ? primary.opacity(0.6) : .clear, radius: 8)

                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundStyle(
                        isActive
                            ? .white
                            : (isLocked ? .white.opacity(0.4) : primary)
                    )
                    .symbolVariant(isActive || !isLocked ? .fill : .none)
            }

            Text(title)
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(
                    isActive
                        ? primary
                        : (isLocked ? .white.opacity(0.4) : .white.opacity(0.8))
                )
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .aspectRatio(1, contentMode: .fit)
        .padding(8)
        .background(liquidGlassBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(
                    isActive ? primary.opacity(0.2) : Color.white.opacity(0.05),
                    lineWidth: 1
                )
        )
        .opacity(isLocked ? 0.4 : 1)
    }

    // MARK: - App Usage Section

    private var appUsageSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("App Usage")
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(.white)
                .padding(.horizontal, 4)

            VStack(spacing: 12) {
                ForEach(appUsage.indices, id: \.self) { index in
                    let app = appUsage[index]
                    appUsageRow(
                        name: app.name,
                        category: app.category,
                        icon: app.icon,
                        time: app.time,
                        percent: app.percent
                    )
                }
            }
        }
    }

    private func appUsageRow(name: String, category: String, icon: String, time: String, percent: CGFloat) -> some View {
        HStack(spacing: 16) {
            // App icon
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(primaryDeep.opacity(0.3))
                    .frame(width: 48, height: 48)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.white.opacity(0.1), lineWidth: 1)
                    )

                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundStyle(primary)
            }

            // Name and category
            VStack(alignment: .leading, spacing: 2) {
                Text(name)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(.white)

                Text(category)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(.white.opacity(0.4))
                    .tracking(1)
            }

            Spacer()

            // Time and progress
            VStack(alignment: .trailing, spacing: 8) {
                Text(time)
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(.white)

                // Progress bar
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color.white.opacity(0.1))
                        .frame(width: 80, height: 4)

                    RoundedRectangle(cornerRadius: 2)
                        .fill(primary)
                        .frame(width: 80 * percent, height: 4)
                        .shadow(color: primary.opacity(0.6), radius: 4)
                }
            }
        }
        .padding(16)
        .background(liquidGlassBackground)
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(Color.white.opacity(0.05), lineWidth: 1)
        )
    }

    // MARK: - View History Button

    private var viewHistoryButton: some View {
        Button {
            // View history action
        } label: {
            Text("View Full History")
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(primary)
                .clipShape(RoundedRectangle(cornerRadius: 20))
                .shadow(color: primary.opacity(0.3), radius: 20, y: 8)
                .shadow(color: primary.opacity(0.6), radius: 10)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Color.white.opacity(0.2), lineWidth: 1)
                )
        }
    }

    // MARK: - Helper Views

    private var liquidGlassBackground: some View {
        Color.white.opacity(0.03)
    }
}

#Preview {
    StatsView()
        .environment(ThemeService())
}
