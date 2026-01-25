import SwiftUI

/// Activity History view showing completed tasks grouped by day
struct ActivityHistoryView: View {
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.dismiss) private var dismiss
    @Environment(TimeBankService.self) private var timeBank
    @Environment(ThemeService.self) private var themeService

    private var isDark: Bool { colorScheme == .dark }

    // Group transactions by day
    private var groupedTransactions: [(date: Date, transactions: [TimeTransaction])] {
        let calendar = Calendar.current

        // Only show earning transactions (completed tasks)
        let earnedTransactions = timeBank.transactions.filter { $0.amount > 0 }

        // Group by day
        let grouped = Dictionary(grouping: earnedTransactions) { transaction in
            calendar.startOfDay(for: transaction.timestamp)
        }

        // Sort by date (newest first)
        return grouped.sorted { $0.key > $1.key }.map { (date: $0.key, transactions: $0.value) }
    }

    var body: some View {
        NavigationStack {
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
                    if groupedTransactions.isEmpty {
                        emptyState
                    } else {
                        LazyVStack(spacing: 24) {
                            ForEach(groupedTransactions, id: \.date) { group in
                                daySection(date: group.date, transactions: group.transactions)
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.vertical, 16)
                    }
                }
            }
            .navigationTitle(L10n.History.title)
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 24))
                            .foregroundStyle(isDark ? Color.white.opacity(0.3) : Color.black.opacity(0.2))
                    }
                }
            }
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Spacer()

            Image(systemName: "calendar.badge.clock")
                .font(.system(size: 60))
                .foregroundStyle(themeService.accentColor.opacity(0.5))

            Text(L10n.History.empty)
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(isDark ? .white : Color(hex: "111827"))

            Text(L10n.History.emptySubtitle)
                .font(.system(size: 15))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)

            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Day Section

    private func daySection(date: Date, transactions: [TimeTransaction]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            // Day header
            HStack {
                Text(formatDateHeader(date))
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(isDark ? Color.white.opacity(0.6) : Color(hex: "6b7280"))
                    .textCase(.uppercase)
                    .tracking(0.5)

                Spacer()

                // Total for day
                let dayTotal = transactions.reduce(0) { $0 + $1.amount }
                Text("+\(String(format: "%.1f", dayTotal)) min")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(Color(hex: "10b981"))
            }

            // Transactions
            VStack(spacing: 0) {
                ForEach(Array(transactions.enumerated()), id: \.element.id) { index, transaction in
                    transactionRow(transaction)

                    if index < transactions.count - 1 {
                        Divider()
                            .background(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.05))
                    }
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
        }
    }

    // Green color for earned transactions
    private let greenColor = Color(hex: "10b981")

    // MARK: - Transaction Row

    private func transactionRow(_ transaction: TimeTransaction) -> some View {
        HStack(spacing: 14) {
            // Icon (green for all earned transactions)
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(greenColor.opacity(0.15))
                    .frame(width: 44, height: 44)

                Image(systemName: transaction.source.icon)
                    .font(.system(size: 20))
                    .foregroundStyle(greenColor)
            }

            // Info
            VStack(alignment: .leading, spacing: 3) {
                Text(transaction.source.displayName)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(isDark ? .white : Color(hex: "111827"))

                HStack(spacing: 6) {
                    Text(formatTime(transaction.timestamp))
                        .font(.system(size: 12))
                        .foregroundStyle(.secondary)

                    if let note = transaction.note, !note.isEmpty {
                        Text("•")
                            .foregroundStyle(.secondary.opacity(0.5))
                        Text(note)
                            .font(.system(size: 12))
                            .foregroundStyle(.secondary)
                    }
                }
            }

            Spacer()

            // Amount
            Text("+\(String(format: "%.1f", transaction.amount))m")
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(Color(hex: "10b981"))
        }
        .padding(14)
    }

    // MARK: - Helpers

    private func formatDateHeader(_ date: Date) -> String {
        let calendar = Calendar.current

        if calendar.isDateInToday(date) {
            return L10n.History.today
        } else if calendar.isDateInYesterday(date) {
            return L10n.History.yesterday
        } else {
            let formatter = DateFormatter()
            formatter.dateFormat = "EEEE, MMM d"
            return formatter.string(from: date)
        }
    }

    private func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        return formatter.string(from: date)
    }
}

#Preview {
    ActivityHistoryView()
        .environment(TimeBankService())
        .environment(ThemeService())
}
