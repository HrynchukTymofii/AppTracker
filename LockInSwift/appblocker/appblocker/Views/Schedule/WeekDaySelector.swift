import SwiftUI

// MARK: - Week Day Selector

struct WeekDaySelector: View {
    @Environment(ThemeService.self) private var theme
    @Environment(\.colorScheme) private var colorScheme

    @Binding var selectedDate: Date

    private var isDark: Bool { colorScheme == .dark }

    // Get the week containing the selected date
    private var weekDays: [Date] {
        let calendar = Calendar.current
        let startOfWeek = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: selectedDate))!

        return (0..<7).compactMap { dayOffset in
            calendar.date(byAdding: .day, value: dayOffset, to: startOfWeek)
        }
    }

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(weekDays, id: \.self) { date in
                    DayPill(
                        date: date,
                        isSelected: Calendar.current.isDate(date, inSameDayAs: selectedDate),
                        isToday: Calendar.current.isDateInToday(date)
                    ) {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            selectedDate = date
                        }
                    }
                }
            }
            .padding(.horizontal, DesignTokens.paddingPage)
        }
    }
}

// MARK: - Day Pill

struct DayPill: View {
    @Environment(ThemeService.self) private var theme
    @Environment(\.colorScheme) private var colorScheme

    let date: Date
    let isSelected: Bool
    let isToday: Bool
    let action: () -> Void

    private var isDark: Bool { colorScheme == .dark }

    private var dayAbbreviation: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE"
        return formatter.string(from: date).uppercased()
    }

    private var dayNumber: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "d"
        return formatter.string(from: date)
    }

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Text(dayAbbreviation)
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(
                        isSelected
                            ? theme.accentColor
                            : theme.textMuted(for: colorScheme)
                    )
                    .tracking(0.5)

                Text(dayNumber)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(
                        isSelected
                            ? theme.textPrimary(for: colorScheme)
                            : theme.textSecondary(for: colorScheme)
                    )

                // Today indicator
                if isToday {
                    Circle()
                        .fill(theme.accentColor)
                        .frame(width: 4, height: 4)
                } else {
                    Circle()
                        .fill(.clear)
                        .frame(width: 4, height: 4)
                }
            }
            .frame(width: 56, height: 80)
            .background(
                Group {
                    if isSelected {
                        RoundedRectangle(cornerRadius: 16)
                            .fill(theme.accentColor.opacity(0.15))
                            .background(.ultraThinMaterial)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(theme.accentColor.opacity(0.4), lineWidth: 1)
                            )
                            .shadow(color: theme.accentColor.opacity(isDark ? 0.4 : 0.25), radius: 12)
                    } else {
                        RoundedRectangle(cornerRadius: 16)
                            .fill(isDark ? Color.white.opacity(0.03) : Color.white.opacity(0.6))
                            .background(.ultraThinMaterial)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(isDark ? Color.white.opacity(0.08) : Color.white.opacity(0.4), lineWidth: 1)
                            )
                    }
                }
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Preview

#Preview {
    ZStack {
        Color(hex: "#050505").ignoresSafeArea()

        VStack {
            WeekDaySelector(selectedDate: .constant(Date()))
            Spacer()
        }
        .padding(.top, 100)
    }
    .environment(ThemeService())
    .preferredColorScheme(.dark)
}

#Preview("Light Mode") {
    ZStack {
        Color(hex: "#FAF9F6").ignoresSafeArea()

        VStack {
            WeekDaySelector(selectedDate: .constant(Date()))
            Spacer()
        }
        .padding(.top, 100)
    }
    .environment(ThemeService())
    .preferredColorScheme(.light)
}
