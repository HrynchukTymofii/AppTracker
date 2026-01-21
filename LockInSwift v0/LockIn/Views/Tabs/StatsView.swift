import SwiftUI
import Charts

struct StatsView: View {
    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService
    @Environment(StatsService.self) private var statsService

    @State private var selectedWeekOffset = 0
    @State private var selectedDay: DailyUsage?

    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Week Navigation
                    weekNavigator

                    // Weekly Chart
                    weeklyChartCard

                    // Stats Summary
                    statsSummaryCards

                    // Calendar Heatmap
                    calendarHeatmapSection

                    // App Breakdown
                    appBreakdownSection
                }
                .padding(.vertical, 16)
                .padding(.bottom, 100)
            }
            .background(Color.appBackground)
            .navigationTitle("Stats")
            .refreshable {
                await statsService.refresh()
            }
        }
    }

    // MARK: - Week Navigator

    private var weekNavigator: some View {
        HStack {
            Button {
                withAnimation {
                    selectedWeekOffset -= 1
                }
            } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(themeService.accentColor)
                    .frame(width: 44, height: 44)
                    .background(themeService.accentColor.opacity(0.1))
                    .clipShape(Circle())
            }

            Spacer()

            Text(weekDateRange)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(isDark ? .white : .black)

            Spacer()

            Button {
                withAnimation {
                    if selectedWeekOffset < 0 {
                        selectedWeekOffset += 1
                    }
                }
            } label: {
                Image(systemName: "chevron.right")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(selectedWeekOffset < 0 ? themeService.accentColor : .secondary)
                    .frame(width: 44, height: 44)
                    .background(selectedWeekOffset < 0 ? themeService.accentColor.opacity(0.1) : Color.secondary.opacity(0.1))
                    .clipShape(Circle())
            }
            .disabled(selectedWeekOffset >= 0)
        }
        .padding(.horizontal, 20)
    }

    private var weekDateRange: String {
        let calendar = Calendar.current
        let today = Date()
        guard let weekStart = calendar.date(byAdding: .day, value: selectedWeekOffset * 7, to: today),
              let weekEnd = calendar.date(byAdding: .day, value: 6, to: weekStart) else {
            return "This Week"
        }

        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"

        return "\(formatter.string(from: weekStart)) - \(formatter.string(from: weekEnd))"
    }

    // MARK: - Weekly Chart

    private var weeklyChartCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Daily Screen Time")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(isDark ? .white : .black)

                Spacer()

                Text("Avg: \(formatHours(averageHours))h")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(.secondary)
            }

            Chart(statsService.weeklyUsage) { day in
                BarMark(
                    x: .value("Day", day.formattedDate),
                    y: .value("Hours", day.hours)
                )
                .foregroundStyle(
                    day.hours > averageHours
                        ? Color.healthPoor.gradient
                        : themeService.accentColor.gradient
                )
                .cornerRadius(6)
            }
            .frame(height: 180)
            .chartYAxis {
                AxisMarks(position: .leading) { value in
                    AxisGridLine(stroke: StrokeStyle(lineWidth: 0.5, dash: [4]))
                        .foregroundStyle(Color.secondary.opacity(0.3))
                    AxisValueLabel {
                        if let hours = value.as(Double.self) {
                            Text("\(Int(hours))h")
                                .font(.system(size: 10))
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .chartXAxis {
                AxisMarks { value in
                    AxisValueLabel {
                        if let day = value.as(String.self) {
                            Text(day)
                                .font(.system(size: 11, weight: .medium))
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(isDark ? Color.white.opacity(0.05) : .white)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.05), lineWidth: 1)
        )
        .padding(.horizontal, 20)
    }

    private var averageHours: Double {
        let daysWithData = statsService.weeklyUsage.filter { $0.hours > 0 }
        guard !daysWithData.isEmpty else { return 0 }
        return daysWithData.reduce(0) { $0 + $1.hours } / Double(daysWithData.count)
    }

    private func formatHours(_ hours: Double) -> String {
        String(format: "%.1f", hours)
    }

    // MARK: - Stats Summary

    private var statsSummaryCards: some View {
        HStack(spacing: 12) {
            SummaryStatCard(
                title: "This Week",
                value: "\(formatHours(totalWeekHours))h",
                subtitle: "total",
                color: themeService.accentColor
            )

            SummaryStatCard(
                title: "Daily Avg",
                value: "\(formatHours(averageHours))h",
                subtitle: "per day",
                color: .blue
            )

            SummaryStatCard(
                title: "Streak",
                value: "\(statsService.currentStreak)",
                subtitle: "days",
                color: .orange
            )
        }
        .padding(.horizontal, 20)
    }

    private var totalWeekHours: Double {
        statsService.weeklyUsage.reduce(0) { $0 + $1.hours }
    }

    // MARK: - Calendar Heatmap

    private var calendarHeatmapSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("ACTIVITY HEATMAP")
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(.secondary)
                .tracking(0.5)
                .padding(.horizontal, 20)

            CalendarHeatmapView()
                .padding(.horizontal, 20)
        }
    }

    // MARK: - App Breakdown

    private var appBreakdownSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("TOP APPS")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.secondary)
                    .tracking(0.5)

                Spacer()

                Button("See All") {
                    // Navigate to full list
                }
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(themeService.accentColor)
            }
            .padding(.horizontal, 20)

            VStack(spacing: 0) {
                ForEach(0..<5) { index in
                    AppUsageRow(
                        appName: "App \(index + 1)",
                        usage: Double(120 - index * 20),
                        percentage: Double(100 - index * 15) / 100,
                        isLast: index == 4
                    )
                }
            }
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(isDark ? Color.white.opacity(0.05) : .white)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.05), lineWidth: 1)
            )
            .padding(.horizontal, 20)
        }
    }
}

// MARK: - Summary Stat Card

struct SummaryStatCard: View {
    let title: String
    let value: String
    let subtitle: String
    let color: Color

    @Environment(\.colorScheme) private var colorScheme
    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        VStack(spacing: 8) {
            Text(title)
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(.secondary)
                .textCase(.uppercase)

            Text(value)
                .font(.system(size: 24, weight: .bold, design: .rounded))
                .foregroundStyle(color)

            Text(subtitle)
                .font(.system(size: 12))
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(isDark ? Color.white.opacity(0.05) : .white)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.05), lineWidth: 1)
        )
    }
}

// MARK: - Calendar Heatmap

struct CalendarHeatmapView: View {
    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService

    private let columns = Array(repeating: GridItem(.flexible(), spacing: 4), count: 7)
    private let days = 28

    var body: some View {
        LazyVGrid(columns: columns, spacing: 4) {
            ForEach(0..<days, id: \.self) { day in
                let intensity = Double.random(in: 0...1)
                RoundedRectangle(cornerRadius: 4)
                    .fill(themeService.accentColor.opacity(0.1 + intensity * 0.8))
                    .aspectRatio(1, contentMode: .fit)
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(colorScheme == .dark ? Color.white.opacity(0.05) : .white)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(colorScheme == .dark ? Color.white.opacity(0.08) : Color.black.opacity(0.05), lineWidth: 1)
        )
    }
}

// MARK: - App Usage Row

struct AppUsageRow: View {
    let appName: String
    let usage: Double // minutes
    let percentage: Double
    let isLast: Bool

    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService

    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                // App Icon Placeholder
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color.secondary.opacity(0.2))
                    .frame(width: 40, height: 40)
                    .overlay {
                        Image(systemName: "app.fill")
                            .foregroundStyle(.secondary)
                    }

                VStack(alignment: .leading, spacing: 4) {
                    Text(appName)
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(isDark ? .white : .black)

                    // Progress bar
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 2)
                                .fill(Color.secondary.opacity(0.1))

                            RoundedRectangle(cornerRadius: 2)
                                .fill(themeService.accentColor)
                                .frame(width: geo.size.width * percentage)
                        }
                    }
                    .frame(height: 4)
                }

                Text(formatUsage(usage))
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)

            if !isLast {
                Divider()
                    .padding(.leading, 66)
            }
        }
    }

    private func formatUsage(_ minutes: Double) -> String {
        if minutes < 60 {
            return "\(Int(minutes))m"
        } else {
            let hours = Int(minutes) / 60
            let mins = Int(minutes) % 60
            return mins > 0 ? "\(hours)h \(mins)m" : "\(hours)h"
        }
    }
}

#Preview {
    StatsView()
        .environment(ThemeService())
        .environment(StatsService())
}
