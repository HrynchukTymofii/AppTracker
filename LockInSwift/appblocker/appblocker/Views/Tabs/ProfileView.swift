import SwiftUI
import StoreKit
import FamilyControls

struct ProfileView: View {
    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService
    @Environment(AuthService.self) private var authService
    @Environment(StatsService.self) private var statsService
    @Environment(BlockingService.self) private var blockingService
    @Environment(TimeBankService.self) private var timeBank
    @Environment(AchievementService.self) private var achievementService

    // Bindable wrapper for FamilyActivityPicker
    private var bindableBlockingService: Bindable<BlockingService> {
        Bindable(blockingService)
    }

    @State private var showSettings = false
    @State private var showAchievements = false
    @State private var showContactSheet = false
    @State private var showBlockedItemsModal = false
    @State private var showFamilyPicker = false
    @State private var showRateSheet = false
    @State private var showActivityHistory = false

    // Stats
    @State private var currentStreak = 0
    @State private var tasksCompleted = 0

    private var isDark: Bool { colorScheme == .dark }
    private let blueAccent = Color(hex: "3b82f6")

    var body: some View {
        ThemedBackground {
            ScrollView {
                VStack(spacing: 0) {
                    // Header
                    headerSection

                    // Profile Card
                    profileCard

                    // Content
                    VStack(spacing: 28) {
                        // Achievements Section
                        achievementsSection

                        // Blocked Items Section
                        blockedItemsSection

                        // Unlock Window Section (moved to top)
                        unlockWindowSection

                        // Daily Screen Time Goal Section
                        dailyGoalSection

                        // TODO: Restore defaultAppLimitSection when app limits work properly
                        // Default App Limit Section
                        // defaultAppLimitSection

                        // Quick Actions Section
                        quickActionsSection

                        // Logout Button
                        logoutButton
                    }
                    .padding(.horizontal, 20)
                }
                .padding(.bottom, 120)
            }
        }
        .sheet(isPresented: $showSettings) {
            FullSettingsView()
        }
        .sheet(isPresented: $showAchievements) {
            AchievementsDetailView()
        }
        .sheet(isPresented: $showContactSheet) {
            ContactUsView()
        }
        .sheet(isPresented: $showRateSheet) {
            RateUsView()
        }
        .sheet(isPresented: $showActivityHistory) {
            ActivityHistoryView()
        }
        .onAppear {
            loadStats()
        }
    }

    // MARK: - Header

    private var headerSection: some View {
        HStack {
            Text(L10n.Tab.profile)
                .font(.system(size: 32, weight: .bold))
                .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                .tracking(-0.5)

            Spacer()

            Button {
                showSettings = true
            } label: {
                RoundedRectangle(cornerRadius: 16)
                    .fill(isDark ? Color.white.opacity(0.05) : .white)
                    .frame(width: 48, height: 48)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.06), lineWidth: 0.5)
                    )
                    .overlay {
                        Image(systemName: "gearshape.fill")
                            .font(.system(size: 22, weight: .medium))
                            .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                    }
                    .shadow(color: .black.opacity(isDark ? 0 : 0.04), radius: 8, y: 2)
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 16)
        .padding(.bottom, 8)
    }

    // MARK: - Profile Card

    private var profileCard: some View {
        VStack(spacing: 16) {
            // Name - elegant styling
            Text(authService.currentUser?.displayName ?? "User")
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundStyle(
                    LinearGradient(
                        colors: isDark
                            ? [.white, Color.white.opacity(0.85)]
                            : [Color(hex: "0f172a"), Color(hex: "334155")],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .tracking(-0.3)

            // Email
            Text(authService.currentUser?.email ?? "")
                .font(.system(size: 14))
                .foregroundStyle(isDark ? Color.white.opacity(0.5) : Color(hex: "64748b"))

            // Stats Row
            HStack(spacing: 24) {
                // Streak
                ProfileStatBadge(
                    icon: "flame.fill",
                    value: "\(currentStreak)",
                    label: L10n.Stats.streak,
                    color: Color(hex: "f97316"),
                    bgColor: Color(hex: "fb923c")
                )

                // Divider
                Rectangle()
                    .fill(isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.03))
                    .frame(width: 1, height: 40)

                // Tasks Completed
                ProfileStatBadge(
                    icon: "trophy.fill",
                    value: "\(tasksCompleted)",
                    label: L10n.Stats.tasks,
                    color: Color(hex: "10b981"),
                    bgColor: Color(hex: "10b981")
                )
            }
            .padding(.top, 4)

            // Pro Badge
            if authService.currentUser?.isPro == true {
                HStack(spacing: 6) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 12))
                    Text(L10n.Profile.pro)
                        .font(.system(size: 12, weight: .bold))
                        .tracking(0.5)
                }
                .foregroundStyle(Color(hex: "fbbf24"))
                .padding(.horizontal, 14)
                .padding(.vertical, 6)
                .background(
                    Capsule()
                        .fill(Color(hex: "fbbf24").opacity(0.12))
                        .overlay(
                            Capsule()
                                .stroke(Color(hex: "fbbf24").opacity(0.25), lineWidth: 0.5)
                        )
                )
            }
        }
        .padding(.vertical, 20)
        .padding(.horizontal, 16)
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(isDark ? Color.white.opacity(0.03) : .white)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.05), lineWidth: 0.5)
        )
        .shadow(color: .black.opacity(isDark ? 0 : 0.04), radius: 12, y: 4)
        .padding(.horizontal, 20)
        .padding(.top, 8)
        .padding(.bottom, 20)
    }

    // MARK: - Achievements Section

    private var achievementsSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            // Header
            Button {
                showAchievements = true
            } label: {
                HStack {
                    SectionIcon(icon: "trophy.fill", colors: [Color(hex: "f59e0b"), Color(hex: "d97706")])

                    Text(L10n.Profile.achievements)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                        .tracking(-0.3)

                    Spacer()

                    HStack(spacing: 6) {
                        Text("\(achievementService.unlockedCount)/\(achievementService.totalCount)")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(Color(hex: "f59e0b"))
                        Image(systemName: "chevron.right")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(isDark ? Color.white.opacity(0.4) : Color(hex: "94a3b8"))
                    }
                }
            }

            // Achievement Badges - Show first 3 achievements with neon pentagon style
            let previewAchievements = Array(AchievementService.allAchievements.prefix(3))
            HStack(spacing: 0) {
                ForEach(previewAchievements, id: \.id) { achievement in
                    AchievementBadge(
                        achievement: achievement,
                        progress: achievementService.getProgress(for: achievement.id),
                        isDark: isDark
                    )
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(isDark ? Color.white.opacity(0.02) : .white)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(isDark ? Color.white.opacity(0.06) : Color.black.opacity(0.03), lineWidth: 0.5)
            )
            .shadow(color: .black.opacity(isDark ? 0 : 0.04), radius: 8, y: 2)
        }
    }

    // MARK: - Blocked Items Section

    private var blockedItemsSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                SectionIcon(icon: "shield.fill", colors: [blueAccent, Color(hex: "1d4ed8")])

                Text(L10n.Profile.blockedItems)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                    .tracking(-0.3)

                Spacer()
            }

            Button {
                showFamilyPicker = true
            } label: {
                HStack(spacing: 16) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 16)
                            .fill(isDark ? blueAccent.opacity(0.12) : blueAccent.opacity(0.08))
                            .frame(width: 52, height: 52)

                        Image(systemName: "checkmark.shield.fill")
                            .font(.system(size: 24))
                            .foregroundStyle(blueAccent)
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        Text(L10n.Profile.blockedItems)
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))

                        HStack(spacing: 16) {
                            HStack(spacing: 5) {
                                Image(systemName: "app.badge.fill")
                                    .font(.system(size: 14))
                                    .foregroundStyle(isDark ? Color.white.opacity(0.4) : Color(hex: "94a3b8"))
                                Text("\(blockingService.blockedAppsCount) \(L10n.Profile.apps)")
                                    .font(.system(size: 14, weight: .medium))
                                    .foregroundStyle(isDark ? Color.white.opacity(0.5) : Color(hex: "64748b"))
                            }

                            HStack(spacing: 5) {
                                Image(systemName: "square.grid.2x2.fill")
                                    .font(.system(size: 14))
                                    .foregroundStyle(isDark ? Color.white.opacity(0.4) : Color(hex: "94a3b8"))
                                Text("\(blockingService.blockedCategoriesCount) \(L10n.Profile.categories)")
                                    .font(.system(size: 14, weight: .medium))
                                    .foregroundStyle(isDark ? Color.white.opacity(0.5) : Color(hex: "64748b"))
                            }
                        }
                    }

                    Spacer()

                    Image(systemName: "chevron.right")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(isDark ? Color.white.opacity(0.3) : Color(hex: "cbd5e1"))
                }
                .padding(18)
                .background(
                    RoundedRectangle(cornerRadius: 18)
                        .fill(isDark ? Color.white.opacity(0.03) : .white)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 18)
                        .stroke(isDark ? Color.white.opacity(0.06) : Color.black.opacity(0.03), lineWidth: 0.5)
                )
                .shadow(color: .black.opacity(isDark ? 0 : 0.03), radius: 12, y: 4)
            }

            Text(L10n.Profile.blockedItemsDesc)
                .font(.system(size: 12))
                .foregroundStyle(isDark ? Color.white.opacity(0.3) : Color(hex: "94a3b8"))
                .padding(.horizontal, 4)
        }
        .familyActivityPicker(
            isPresented: $showFamilyPicker,
            selection: bindableBlockingService.selectedApps
        )
    }

    // MARK: - Default App Limit Section

    // MARK: - Daily Goal Section

    private var dailyGoalSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                SectionIcon(icon: "target", colors: [Color(hex: "10b981"), Color(hex: "059669")])

                Text(L10n.Profile.dailyGoal)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                    .tracking(-0.3)

                Spacer()
            }

            VStack(alignment: .leading, spacing: 18) {
                Text(L10n.Profile.dailyGoalDesc)
                    .font(.system(size: 14))
                    .foregroundStyle(isDark ? Color.white.opacity(0.5) : Color(hex: "64748b"))

                dailyGoalSlider
            }
            .padding(18)
            .background(
                RoundedRectangle(cornerRadius: 18)
                    .fill(isDark ? Color.white.opacity(0.03) : .white)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18)
                    .stroke(isDark ? Color.white.opacity(0.06) : Color.black.opacity(0.03), lineWidth: 0.5)
            )
            .shadow(color: .black.opacity(isDark ? 0 : 0.03), radius: 12, y: 4)
        }
    }

    private var dailyGoalSlider: some View {
        VStack(spacing: 16) {
            // Current value display with hours + min format
            HStack {
                Text(formatDailyGoal(blockingService.dailyGoal.targetMinutes))
                    .font(.system(size: 32, weight: .bold))
                    .foregroundStyle(Color(hex: "10b981"))
            }

            // Slider
            HStack(spacing: 12) {
                Text("30m")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(isDark ? Color(hex: "6b7280") : Color(hex: "9ca3af"))

                Slider(
                    value: Binding(
                        get: { Double(blockingService.dailyGoal.targetMinutes) },
                        set: { blockingService.setDailyGoalTarget(minutes: Int($0)) }
                    ),
                    in: 30...240,
                    step: 15
                )
                .tint(Color(hex: "10b981"))

                Text("4h")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(isDark ? Color(hex: "6b7280") : Color(hex: "9ca3af"))
            }
        }
    }

    private func formatDailyGoal(_ minutes: Int) -> String {
        if minutes >= 60 {
            let h = minutes / 60
            let m = minutes % 60
            return m > 0 ? "\(h)h \(m)m" : "\(h)h"
        }
        return "\(minutes)m"
    }

    private var defaultAppLimitSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                SectionIcon(icon: "timer", colors: [Color(hex: "f59e0b"), Color(hex: "d97706")])

                Text(L10n.Profile.defaultAppLimit)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                    .tracking(-0.3)

                Spacer()
            }

            VStack(alignment: .leading, spacing: 18) {
                Text(L10n.Profile.defaultAppLimitDesc)
                    .font(.system(size: 14))
                    .foregroundStyle(isDark ? Color.white.opacity(0.5) : Color(hex: "64748b"))

                timeLimitSlider
            }
            .padding(18)
            .background(
                RoundedRectangle(cornerRadius: 18)
                    .fill(isDark ? Color.white.opacity(0.03) : .white)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18)
                    .stroke(isDark ? Color.white.opacity(0.06) : Color.black.opacity(0.03), lineWidth: 0.5)
            )
            .shadow(color: .black.opacity(isDark ? 0 : 0.03), radius: 12, y: 4)
        }
    }

    private var timeLimitSlider: some View {
        VStack(spacing: 16) {
            // Current value display
            HStack {
                Text("\(blockingService.defaultLimitMinutes)")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundStyle(Color(hex: "f59e0b"))
                Text(L10n.Profile.min)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(isDark ? Color(hex: "6b7280") : Color(hex: "9ca3af"))
            }

            // Slider
            HStack(spacing: 12) {
                Text("5")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(isDark ? Color(hex: "6b7280") : Color(hex: "9ca3af"))

                Slider(
                    value: Binding(
                        get: { Double(blockingService.defaultLimitMinutes) },
                        set: { blockingService.defaultLimitMinutes = Int($0) }
                    ),
                    in: 5...120,
                    step: 5
                )
                .tint(Color(hex: "f59e0b"))

                Text("2h")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(isDark ? Color(hex: "6b7280") : Color(hex: "9ca3af"))
            }
        }
    }

    // MARK: - Unlock Window Section

    private var unlockWindowSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                SectionIcon(icon: "lock.open.fill", colors: [Color(hex: "8b5cf6"), Color(hex: "6d28d9")])

                Text(L10n.Profile.unlockWindow)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                    .tracking(-0.3)

                Spacer()
            }

            VStack(alignment: .leading, spacing: 18) {
                Text(L10n.Profile.unlockWindowDesc)
                    .font(.system(size: 14))
                    .foregroundStyle(isDark ? Color.white.opacity(0.5) : Color(hex: "64748b"))

                unlockWindowSlider
            }
            .padding(18)
            .background(
                RoundedRectangle(cornerRadius: 18)
                    .fill(isDark ? Color.white.opacity(0.03) : .white)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18)
                    .stroke(isDark ? Color.white.opacity(0.06) : Color.black.opacity(0.03), lineWidth: 0.5)
            )
            .shadow(color: .black.opacity(isDark ? 0 : 0.03), radius: 12, y: 4)
        }
    }

    private var unlockWindowSlider: some View {
        VStack(spacing: 16) {
            // Current value display
            HStack {
                Text("\(blockingService.unlockWindowMinutes)")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundStyle(Color(hex: "8b5cf6"))
                Text(L10n.Profile.min)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(isDark ? Color(hex: "6b7280") : Color(hex: "9ca3af"))
            }

            // Slider
            HStack(spacing: 12) {
                Text("1")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(isDark ? Color(hex: "6b7280") : Color(hex: "9ca3af"))

                Slider(
                    value: Binding(
                        get: { Double(blockingService.unlockWindowMinutes) },
                        set: { blockingService.unlockWindowMinutes = Int($0) }
                    ),
                    in: 1...30,
                    step: 1
                )
                .tint(Color(hex: "8b5cf6"))

                Text("30")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(isDark ? Color(hex: "6b7280") : Color(hex: "9ca3af"))
            }
        }
    }

    // MARK: - Quick Actions Section

    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                SectionIcon(icon: "bolt.fill", colors: [Color(hex: "8b5cf6"), Color(hex: "6d28d9")])

                Text(L10n.Profile.appSettings)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                    .tracking(-0.3)

                Spacer()
            }

            VStack(spacing: 0) {
                // Activity History
                ProfileActionRow(
                    icon: "calendar.badge.clock",
                    title: L10n.History.title,
                    showDivider: true
                ) {
                    showActivityHistory = true
                }

                // Contact Us
                ProfileActionRow(
                    icon: "envelope.fill",
                    title: L10n.Profile.contactUs,
                    showDivider: true
                ) {
                    showContactSheet = true
                }

                // Rate Us
                ProfileActionRow(
                    icon: "hand.thumbsup.fill",
                    title: L10n.Profile.rateUs,
                    showDivider: false
                ) {
                    showRateSheet = true
                }
            }
            .background(
                RoundedRectangle(cornerRadius: 18)
                    .fill(isDark ? Color.white.opacity(0.03) : .white)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18)
                    .stroke(isDark ? Color.white.opacity(0.06) : Color.black.opacity(0.03), lineWidth: 0.5)
            )
            .shadow(color: .black.opacity(isDark ? 0 : 0.03), radius: 12, y: 4)
        }
    }

    // MARK: - Logout Button

    private var logoutButton: some View {
        Button {
            authService.signOut()
        } label: {
            HStack(spacing: 10) {
                Image(systemName: "rectangle.portrait.and.arrow.right")
                    .font(.system(size: 18, weight: .semibold))
                Text(L10n.Profile.logout)
                    .font(.system(size: 16, weight: .bold))
            }
            .foregroundStyle(Color(hex: "ef4444"))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 18)
            .background(
                RoundedRectangle(cornerRadius: 18)
                    .fill(
                        LinearGradient(
                            colors: isDark
                                ? [Color(hex: "ef4444").opacity(0.12), Color(hex: "ef4444").opacity(0.06)]
                                : [Color(hex: "ef4444").opacity(0.08), Color(hex: "ef4444").opacity(0.04)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18)
                    .stroke(Color(hex: "ef4444").opacity(0.3), lineWidth: 0.5)
            )
        }
        .padding(.top, 12)
    }

    // MARK: - Helpers

    private func loadStats() {
        // Recalculate streak from completion dates
        statsService.calculateStreakFromCompletionDates()

        // Streak from StatsService (days where earned time > 0)
        currentStreak = statsService.currentStreak

        // Count completed tasks from TimeBankService transactions (earned transactions only)
        tasksCompleted = timeBank.transactions.filter { $0.amount > 0 }.count

        // Update achievements with current stats
        let totalTimeEarned = timeBank.transactions
            .filter { $0.amount > 0 }
            .reduce(0) { $0 + $1.amount }

        achievementService.updateAchievements(
            streak: currentStreak,
            tasksCompleted: tasksCompleted,
            totalTimeEarned: totalTimeEarned,
            healthScore: statsService.healthScore,
            currentBalance: timeBank.availableMinutes
        )
    }

    private func requestAppReview() {
        if let scene = UIApplication.shared.connectedScenes.first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene {
            SKStoreReviewController.requestReview(in: scene)
        }
    }
}

// MARK: - Profile Stat Badge

struct ProfileStatBadge: View {
    let icon: String
    let value: String
    let label: String
    let color: Color
    let bgColor: Color

    @Environment(\.colorScheme) private var colorScheme
    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        VStack(spacing: 4) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundStyle(color)
                Text(value)
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(color)
            }
            .padding(.bottom, 4)

            Text(label.uppercased())
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(isDark ? Color.white.opacity(0.4) : Color(hex: "94a3b8"))
                .tracking(0.5)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(isDark ? bgColor.opacity(0.1) : bgColor.opacity(0.08))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(isDark ? bgColor.opacity(0.2) : bgColor.opacity(0.15), lineWidth: 0.5)
                )
        )
    }
}

// MARK: - Section Icon

struct SectionIcon: View {
    let icon: String
    let colors: [Color]

    var body: some View {
        ZStack {
            LinearGradient(colors: colors, startPoint: .topLeading, endPoint: .bottomTrailing)
            Image(systemName: icon)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(.white)
        }
        .frame(width: 32, height: 32)
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .padding(.trailing, 10)
    }
}

// MARK: - Profile Action Row

struct ProfileActionRow: View {
    let icon: String
    let title: String
    var showDivider: Bool = true
    let action: () -> Void

    @Environment(\.colorScheme) private var colorScheme
    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        Button(action: action) {
            VStack(spacing: 0) {
                HStack(spacing: 14) {
                    Image(systemName: icon)
                        .font(.system(size: 18))
                        .foregroundStyle(isDark ? Color.white.opacity(0.6) : Color(hex: "64748b"))
                        .frame(width: 24)

                    Text(title)
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))

                    Spacer()

                    Image(systemName: "chevron.right")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(isDark ? Color.white.opacity(0.3) : Color(hex: "cbd5e1"))
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 16)

                if showDivider {
                    Divider()
                        .padding(.leading, 56)
                }
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Achievements Detail View

struct AchievementsDetailView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService
    @Environment(AchievementService.self) private var achievementService
    @Environment(StatsService.self) private var statsService
    @Environment(TimeBankService.self) private var timeBank

    @State private var selectedCategory: AchievementCategory? = nil

    private var isDark: Bool { colorScheme == .dark }
    private let blueAccent = Color(hex: "3b82f6")

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
                    VStack(spacing: 24) {
                        // Stats Header
                        achievementStatsHeader

                        // Category Filter
                        categoryPicker

                        // Achievements Grid
                        achievementsGrid
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 40)
                }
            }
            .navigationTitle(L10n.Achievements.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(L10n.Common.done) { dismiss() }
                }
            }
            .onAppear {
                updateAchievements()
            }
        }
    }

    // MARK: - Stats Header

    private var achievementStatsHeader: some View {
        VStack(spacing: 16) {
            // Trophy icon with glow
            ZStack {
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [Color(hex: "f59e0b").opacity(0.3), Color(hex: "f59e0b").opacity(0.05)],
                            center: .center,
                            startRadius: 20,
                            endRadius: 60
                        )
                    )
                    .frame(width: 100, height: 100)

                Image(systemName: "trophy.fill")
                    .font(.system(size: 44))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [Color(hex: "f59e0b"), Color(hex: "d97706")],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            }

            // Progress text
            VStack(spacing: 6) {
                Text("\(achievementService.unlockedCount) of \(achievementService.totalCount)")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))

                Text(L10n.Achievements.unlocked)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(isDark ? Color.white.opacity(0.5) : Color(hex: "64748b"))
            }

            // Progress bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(isDark ? Color.white.opacity(0.1) : Color(hex: "e2e8f0"))
                        .frame(height: 8)

                    RoundedRectangle(cornerRadius: 6)
                        .fill(
                            LinearGradient(
                                colors: [Color(hex: "f59e0b"), Color(hex: "d97706")],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: geo.size.width * progressPercentage, height: 8)
                }
            }
            .frame(height: 8)
            .padding(.horizontal, 40)
        }
        .padding(.vertical, 24)
        .padding(.horizontal, 20)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(isDark ? Color.white.opacity(0.03) : .white)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 24)
                .stroke(isDark ? Color.white.opacity(0.06) : Color.black.opacity(0.03), lineWidth: 0.5)
        )
        .shadow(color: .black.opacity(isDark ? 0 : 0.04), radius: 16, y: 4)
    }

    private var progressPercentage: Double {
        guard achievementService.totalCount > 0 else { return 0 }
        return Double(achievementService.unlockedCount) / Double(achievementService.totalCount)
    }

    // MARK: - Category Picker

    private var categoryPicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                // All category
                CategoryChip(
                    title: L10n.Achievements.categoryAll,
                    icon: "square.grid.2x2.fill",
                    color: blueAccent,
                    isSelected: selectedCategory == nil
                ) {
                    withAnimation(.spring(response: 0.3)) {
                        selectedCategory = nil
                    }
                }

                ForEach(AchievementCategory.allCases, id: \.self) { category in
                    CategoryChip(
                        title: category.rawValue,
                        icon: category.icon,
                        color: Color(hex: category.color),
                        isSelected: selectedCategory == category
                    ) {
                        withAnimation(.spring(response: 0.3)) {
                            selectedCategory = category
                        }
                    }
                }
            }
            .padding(.horizontal, 4)
        }
    }

    // MARK: - Achievements Grid

    private var achievementsGrid: some View {
        let achievements = filteredAchievements
        let columns = [
            GridItem(.flexible(), spacing: 8),
            GridItem(.flexible(), spacing: 8),
            GridItem(.flexible(), spacing: 8)
        ]

        return LazyVGrid(columns: columns, spacing: 16) {
            ForEach(achievements, id: \.id) { achievement in
                AchievementBadge(
                    achievement: achievement,
                    progress: achievementService.getProgress(for: achievement.id),
                    isDark: isDark
                )
            }
        }
    }

    private var filteredAchievements: [AchievementDef] {
        if let category = selectedCategory {
            return AchievementService.allAchievements.filter { $0.category == category }
        }
        return AchievementService.allAchievements
    }

    // MARK: - Update Achievements

    private func updateAchievements() {
        // Calculate total time earned from transactions
        let totalTimeEarned = timeBank.transactions
            .filter { $0.amount > 0 }
            .reduce(0) { $0 + $1.amount }

        let tasksCompleted = timeBank.transactions.filter { $0.amount > 0 }.count

        achievementService.updateAchievements(
            streak: statsService.currentStreak,
            tasksCompleted: tasksCompleted,
            totalTimeEarned: totalTimeEarned,
            healthScore: statsService.healthScore,
            currentBalance: timeBank.availableMinutes
        )
    }
}

// MARK: - Category Chip

private struct CategoryChip: View {
    let title: String
    let icon: String
    let color: Color
    let isSelected: Bool
    let action: () -> Void

    @Environment(\.colorScheme) private var colorScheme
    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 12, weight: .semibold))
                Text(title)
                    .font(.system(size: 13, weight: .semibold))
            }
            .foregroundStyle(isSelected ? .white : (isDark ? Color.white.opacity(0.7) : Color(hex: "475569")))
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? color : (isDark ? Color.white.opacity(0.06) : Color.black.opacity(0.03)))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? color.opacity(0.3) : .clear, lineWidth: 1)
            )
        }
    }
}

// MARK: - Pentagon Shape

private struct Pentagon: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let center = CGPoint(x: rect.midX, y: rect.midY)
        let radius = min(rect.width, rect.height) / 2
        let angleOffset = -CGFloat.pi / 2 // Start from top

        for i in 0..<5 {
            let angle = angleOffset + CGFloat(i) * 2 * .pi / 5
            let point = CGPoint(
                x: center.x + radius * cos(angle),
                y: center.y + radius * sin(angle)
            )
            if i == 0 {
                path.move(to: point)
            } else {
                path.addLine(to: point)
            }
        }
        path.closeSubpath()
        return path
    }
}

// MARK: - Achievement Badge (Neon Pentagon Style)

private struct AchievementBadge: View {
    let achievement: AchievementDef
    let progress: AchievementProgress
    let isDark: Bool

    private var isUnlocked: Bool { progress.isUnlocked }
    private var color1: Color { Color(hex: achievement.color) }
    private var color2: Color { Color(hex: achievement.colorSecondary) }

    // Locked state colors - different for light/dark mode
    private var lockedBgColor1: Color {
        isDark ? Color.white.opacity(0.05) : Color.black.opacity(0.03)
    }
    private var lockedBgColor2: Color {
        isDark ? Color.white.opacity(0.02) : Color.black.opacity(0.02)
    }
    private var lockedBorderColor1: Color {
        isDark ? Color.white.opacity(0.15) : Color.black.opacity(0.12)
    }
    private var lockedBorderColor2: Color {
        isDark ? Color.white.opacity(0.05) : Color.black.opacity(0.06)
    }
    private var lockedIconColor1: Color {
        isDark ? Color.white.opacity(0.2) : Color.black.opacity(0.2)
    }
    private var lockedIconColor2: Color {
        isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.1)
    }
    private var lockedTextColor1: Color {
        isDark ? Color.white.opacity(0.4) : Color.black.opacity(0.35)
    }
    private var lockedTextColor2: Color {
        isDark ? Color.white.opacity(0.3) : Color.black.opacity(0.25)
    }

    // Tier badge based on target difficulty
    private var tierIcon: String {
        if achievement.target >= 30 { return "crown.fill" }
        if achievement.target >= 10 { return "diamond.fill" }
        return "star.fill"
    }

    var body: some View {
        VStack(spacing: 3) {
            // Pentagon badge
            ZStack {
                // Outer glow (only when unlocked)
                if isUnlocked {
                    Pentagon()
                        .fill(color1.opacity(0.3))
                        .blur(radius: 10)
                        .frame(width: 70, height: 70)
                }

                // Pentagon background with gradient
                Pentagon()
                    .fill(
                        isUnlocked
                            ? LinearGradient(
                                colors: [color1.opacity(0.25), color2.opacity(0.15)],
                                startPoint: .top,
                                endPoint: .bottom
                              )
                            : LinearGradient(
                                colors: [lockedBgColor1, lockedBgColor2],
                                startPoint: .top,
                                endPoint: .bottom
                              )
                    )
                    .frame(width: 60, height: 60)

                // Neon border
                Pentagon()
                    .stroke(
                        isUnlocked
                            ? LinearGradient(
                                colors: [color1, color2, color1.opacity(0.6)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                              )
                            : LinearGradient(
                                colors: [lockedBorderColor1, lockedBorderColor2],
                                startPoint: .top,
                                endPoint: .bottom
                              ),
                        lineWidth: isUnlocked ? 2 : 1
                    )
                    .frame(width: 60, height: 60)

                // Icon
                Image(systemName: achievement.icon)
                    .font(.system(size: 22, weight: .medium))
                    .foregroundStyle(
                        isUnlocked
                            ? LinearGradient(
                                colors: [color1, color2],
                                startPoint: .top,
                                endPoint: .bottom
                              )
                            : LinearGradient(
                                colors: [lockedIconColor1, lockedIconColor2],
                                startPoint: .top,
                                endPoint: .bottom
                              )
                    )

                // Tier badge (top right)
                if isUnlocked {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [color1, color2],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 16, height: 16)
                        .overlay(
                            Image(systemName: tierIcon)
                                .font(.system(size: 8, weight: .bold))
                                .foregroundStyle(.white)
                        )
                        .offset(x: 22, y: -22)
                }
            }
            .frame(width: 70, height: 70)

            // Achievement name below pentagon
            Text(achievement.name)
                .font(.system(size: 10, weight: .bold))
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .foregroundStyle(
                    isUnlocked
                        ? LinearGradient(
                            colors: [color1, color2],
                            startPoint: .leading,
                            endPoint: .trailing
                          )
                        : LinearGradient(
                            colors: [lockedTextColor1, lockedTextColor2],
                            startPoint: .leading,
                            endPoint: .trailing
                          )
                )
                .frame(height: 26)
        }
        .frame(maxWidth: .infinity)
        .opacity(isUnlocked ? 1 : 0.5)
    }
}

// MARK: - Contact Us View

struct ContactUsView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService
    @State private var message = ""
    private var isDark: Bool { colorScheme == .dark }
    private let supportEmail = "lockin@fibipals.com"

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
                    VStack(spacing: 24) {
                        // Icon and Header
                        VStack(spacing: 12) {
                            ZStack {
                                Circle()
                                    .fill(themeService.accentColor.opacity(0.15))
                                    .frame(width: 80, height: 80)

                                Image(systemName: "envelope.fill")
                                    .font(.system(size: 32))
                                    .foregroundStyle(themeService.accentColor)
                            }

                        Text(L10n.Contact.getInTouch)
                            .font(.system(size: 24, weight: .bold))
                            .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))

                        Text(L10n.Contact.loveToHear)
                            .font(.system(size: 15))
                            .foregroundStyle(isDark ? Color.white.opacity(0.6) : Color(hex: "64748b"))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 20)
                    }
                    .padding(.top, 20)

                    // Message Text Area
                    VStack(alignment: .leading, spacing: 8) {
                        Text(L10n.Contact.yourMessage)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(isDark ? Color.white.opacity(0.7) : Color(hex: "475569"))

                        ZStack(alignment: .topLeading) {
                            TextEditor(text: $message)
                                .scrollContentBackground(.hidden)
                                .frame(height: 150)

                            if message.isEmpty {
                                Text(L10n.Contact.placeholder)
                                    .font(.system(size: 15))
                                    .foregroundStyle(isDark ? Color.white.opacity(0.3) : Color(hex: "94a3b8"))
                                    .padding(.top, 8)
                                    .padding(.leading, 4)
                                    .allowsHitTesting(false)
                            }
                        }
                        .padding(12)
                        .background(
                            RoundedRectangle(cornerRadius: 14)
                                .fill(isDark ? Color.white.opacity(0.05) : Color(hex: "f8fafc"))
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 14)
                                .stroke(isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.06), lineWidth: 0.5)
                        )
                    }

                    // Send Button
                    Button {
                        openEmailClient()
                    } label: {
                        HStack(spacing: 10) {
                            Image(systemName: "paperplane.fill")
                                .font(.system(size: 16))
                            Text(L10n.Contact.sendMessage)
                                .font(.system(size: 16, weight: .semibold))
                        }
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(
                            LinearGradient(
                                colors: [Color(hex: "3b82f6"), Color(hex: "2563eb")],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                    }

                    // Direct Email Option
                    VStack(spacing: 8) {
                        Text(L10n.Contact.emailDirectly)
                            .font(.system(size: 13))
                            .foregroundStyle(isDark ? Color.white.opacity(0.5) : Color(hex: "94a3b8"))

                        Button {
                            if let url = URL(string: "mailto:\(supportEmail)") {
                                UIApplication.shared.open(url)
                            }
                        } label: {
                            Text(supportEmail)
                                .font(.system(size: 15, weight: .medium))
                                .foregroundStyle(Color(hex: "3b82f6"))
                        }
                    }
                    .padding(.top, 8)

                        Spacer(minLength: 40)
                    }
                    .padding(.horizontal, 20)
                }
            }
            .navigationTitle(L10n.Contact.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(L10n.Common.cancel) { dismiss() }
                }
            }
        }
    }

    private func openEmailClient() {
        let subject = "LockIn App Feedback"
        let encodedSubject = subject.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        let encodedBody = message.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""

        if let url = URL(string: "mailto:\(supportEmail)?subject=\(encodedSubject)&body=\(encodedBody)") {
            UIApplication.shared.open(url)
        }
        dismiss()
    }
}

// MARK: - Rate Us View

struct RateUsView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService

    @State private var selectedRating: Int = 0
    @State private var showFeedback = false
    @State private var feedbackText = ""

    private var isDark: Bool { colorScheme == .dark }
    private let starColor = Color(hex: "f59e0b")

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
                    VStack(spacing: 24) {
                        headerSection
                        starRatingSection
                        if showFeedback {
                            feedbackSection
                        }
                        if selectedRating > 0 {
                            submitButton
                        }
                        Spacer(minLength: 40)
                    }
                }
            }
            .navigationTitle(L10n.Rate.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(L10n.Common.cancel) { dismiss() }
                }
            }
            .onChange(of: selectedRating) { _, newRating in
                withAnimation {
                    showFeedback = newRating > 0 && newRating < 4
                }
            }
        }
    }

    // MARK: - Header Section

    private var headerSection: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(starColor.opacity(0.15))
                    .frame(width: 80, height: 80)

                Image(systemName: "star.fill")
                    .font(.system(size: 36))
                    .foregroundStyle(starColor)
            }

            Text(L10n.Rate.enjoying)
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))

            Text(L10n.Rate.loveToHear)
                .font(.system(size: 15))
                .foregroundStyle(isDark ? Color.white.opacity(0.6) : Color(hex: "64748b"))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 20)
        }
        .padding(.top, 20)
    }

    // MARK: - Star Rating Section

    private var starRatingSection: some View {
        VStack(spacing: 12) {
            Text(L10n.Rate.tapToRate)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(isDark ? Color.white.opacity(0.5) : Color(hex: "94a3b8"))

            HStack(spacing: 12) {
                ForEach(1...5, id: \.self) { star in
                    starButton(for: star)
                }
            }
            .padding(.vertical, 8)

            if selectedRating > 0 {
                Text(ratingLabel)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(starColor)
            }
        }
        .padding(.vertical, 16)
    }

    private func starButton(for star: Int) -> some View {
        Button {
            withAnimation(.spring(response: 0.3)) {
                selectedRating = star
            }
        } label: {
            Image(systemName: star <= selectedRating ? "star.fill" : "star")
                .font(.system(size: 40))
                .foregroundStyle(star <= selectedRating ? starColor : (isDark ? Color.white.opacity(0.3) : Color(hex: "cbd5e1")))
                .scaleEffect(star <= selectedRating ? 1.1 : 1.0)
        }
    }

    // MARK: - Feedback Section

    private var feedbackSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(L10n.Rate.howImprove)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))

            ZStack(alignment: .topLeading) {
                TextEditor(text: $feedbackText)
                    .scrollContentBackground(.hidden)
                    .frame(height: 120)

                if feedbackText.isEmpty {
                    Text(L10n.Rate.whatBetter)
                        .font(.system(size: 15))
                        .foregroundStyle(isDark ? Color.white.opacity(0.3) : Color(hex: "94a3b8"))
                        .padding(.top, 8)
                        .padding(.leading, 4)
                        .allowsHitTesting(false)
                }
            }
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(isDark ? Color.white.opacity(0.05) : Color(hex: "f8fafc"))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.06), lineWidth: 0.5)
            )
        }
        .padding(.horizontal, 20)
    }

    // MARK: - Submit Button

    private var submitButton: some View {
        Button {
            handleSubmit()
        } label: {
            submitButtonLabel
        }
        .padding(.horizontal, 20)
    }

    private var submitButtonLabel: some View {
        HStack(spacing: 10) {
            Image(systemName: selectedRating >= 4 ? "arrow.up.right" : "paperplane.fill")
                .font(.system(size: 16))
            Text(selectedRating >= 4 ? L10n.Rate.rateAppStore : L10n.Rate.sendFeedback)
                .font(.system(size: 16, weight: .semibold))
        }
        .foregroundStyle(.white)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(submitButtonGradient)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private var submitButtonGradient: LinearGradient {
        LinearGradient(
            colors: selectedRating >= 4
                ? [Color(hex: "3b82f6"), Color(hex: "2563eb")]
                : [starColor, Color(hex: "d97706")],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    private var ratingLabel: String {
        switch selectedRating {
        case 1: return L10n.Rate.canDoBetter
        case 2: return L10n.Rate.needsImprovement
        case 3: return L10n.Rate.itsOkay
        case 4: return L10n.Rate.reallyGood
        case 5: return L10n.Rate.loveIt
        default: return ""
        }
    }

    private func handleSubmit() {
        if selectedRating >= 4 {
            // Open App Store review
            if let scene = UIApplication.shared.connectedScenes.first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene {
                SKStoreReviewController.requestReview(in: scene)
            }
            dismiss()
        } else {
            // Send feedback via email
            let subject = "LockIn App Feedback (\(selectedRating)/5 stars)"
            let body = feedbackText.isEmpty ? "Rating: \(selectedRating)/5" : "Rating: \(selectedRating)/5\n\n\(feedbackText)"
            let encodedSubject = subject.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
            let encodedBody = body.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""

            if let url = URL(string: "mailto:lockin@fibipals.com?subject=\(encodedSubject)&body=\(encodedBody)") {
                UIApplication.shared.open(url)
            }
            dismiss()
        }
    }
}

// MARK: - Time Limit Button

struct TimeLimitButton: View {
    let minutes: Int
    let isSelected: Bool
    let isDark: Bool
    let action: () -> Void

    private var displayText: String {
        minutes >= 60 ? "\(minutes / 60)h" : "\(minutes)m"
    }

    private var textColor: Color {
        if isSelected {
            return .white
        }
        return isDark ? .white : Color(hex: "0f172a")
    }

    private var backgroundGradient: LinearGradient {
        if isSelected {
            return LinearGradient(
                colors: [Color(hex: "f59e0b"), Color(hex: "d97706")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        } else {
            let bgColor = isDark ? Color.white.opacity(0.05) : Color(hex: "f8fafc")
            return LinearGradient(colors: [bgColor, bgColor], startPoint: .topLeading, endPoint: .bottomTrailing)
        }
    }

    private var strokeColor: Color {
        if isSelected {
            return .clear
        }
        return isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.06)
    }

    var body: some View {
        Button(action: action) {
            Text(displayText)
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(textColor)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(backgroundGradient)
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(strokeColor, lineWidth: 0.5)
                )
        }
    }
}

// MARK: - Daily Goal Button

struct DailyGoalButton: View {
    let minutes: Int
    let isSelected: Bool
    let isDark: Bool
    let action: () -> Void

    private var displayText: String {
        let hours = minutes / 60
        return "\(hours)h"
    }

    private var textColor: Color {
        if isSelected {
            return .white
        }
        return isDark ? .white : Color(hex: "0f172a")
    }

    private var backgroundGradient: LinearGradient {
        if isSelected {
            return LinearGradient(
                colors: [Color(hex: "10b981"), Color(hex: "059669")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        } else {
            let bgColor = isDark ? Color.white.opacity(0.05) : Color(hex: "f8fafc")
            return LinearGradient(colors: [bgColor, bgColor], startPoint: .topLeading, endPoint: .bottomTrailing)
        }
    }

    private var strokeColor: Color {
        if isSelected {
            return .clear
        }
        return isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.06)
    }

    var body: some View {
        Button(action: action) {
            Text(displayText)
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(textColor)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(backgroundGradient)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(strokeColor, lineWidth: 0.5)
                )
                .shadow(
                    color: isSelected ? Color(hex: "10b981").opacity(0.3) : .clear,
                    radius: 6,
                    y: 3
                )
        }
    }
}

// MARK: - Unlock Window Button

struct UnlockWindowButton: View {
    let minutes: Int
    let isSelected: Bool
    let isDark: Bool
    let action: () -> Void

    private var displayText: String {
        "\(minutes)m"
    }

    private var textColor: Color {
        if isSelected {
            return .white
        }
        return isDark ? .white : Color(hex: "0f172a")
    }

    private var backgroundGradient: LinearGradient {
        if isSelected {
            return LinearGradient(
                colors: [Color(hex: "8b5cf6"), Color(hex: "6d28d9")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        } else {
            let bgColor = isDark ? Color.white.opacity(0.05) : Color(hex: "f8fafc")
            return LinearGradient(colors: [bgColor, bgColor], startPoint: .topLeading, endPoint: .bottomTrailing)
        }
    }

    private var strokeColor: Color {
        if isSelected {
            return .clear
        }
        return isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.06)
    }

    var body: some View {
        Button(action: action) {
            Text(displayText)
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(textColor)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(backgroundGradient)
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(strokeColor, lineWidth: 0.5)
                )
                .shadow(
                    color: isSelected ? Color(hex: "8b5cf6").opacity(0.3) : .clear,
                    radius: 6,
                    y: 3
                )
        }
    }
}

#Preview {
    ProfileView()
        .environment(ThemeService())
        .environment(AuthService())
        .environment(StatsService())
        .environment(BlockingService())
        .environment(TimeBankService())
        .environment(AchievementService())
}
