import SwiftUI
import FamilyControls
import DeviceActivity
import ManagedSettings

struct BlockingView: View {
    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService
    @Environment(BlockingService.self) private var blockingService
    @Environment(TimeBankService.self) private var timeBank

    @State private var showAppPicker = false
    @State private var showLimitsSheet = false
    @State private var showShareSheet = false
    @State private var isRequestingPermission = false
    @State private var isReportLoaded = false

    private var isDark: Bool { colorScheme == .dark }
    private let blueColor = Color(hex: "3b82f6")
    private let greenColor = Color(hex: "10b981")
    private let purpleColor = Color(hex: "8b5cf6")

    var body: some View {
        ThemedBackground {
            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    headerSection

                    // Authorization Banner
                    if !blockingService.isAuthorized {
                        authorizationBanner
                    }

                    // Daily Goal Progress Card (prominent, shareable)
                    goalProgressCard

                    // TODO: Restore appLimitsSection when app limits work properly
                    // App Limits Section (redesigned cards)
                    // appLimitsSection
                }
                .padding(.vertical, 16)
                .padding(.bottom, 120)
            }
        }
        .sheet(isPresented: $showAppPicker) {
            AppPickerView()
        }
        .sheet(isPresented: $showLimitsSheet) {
            LimitsEditorView()
        }
        .sheet(isPresented: $showShareSheet) {
            GoalShareSheet(dailyGoal: blockingService.dailyGoal)
        }
        .onAppear {
            // Sync daily goal usage from screen time data
            blockingService.syncDailyGoalFromScreenTime()
            // Sync app limits usage from DeviceActivityReport
            blockingService.syncUsageFromAppGroup()
            // Re-check authorization status
            blockingService.checkAuthorization()
        }
    }

    // MARK: - Header

    private var headerSection: some View {
        HStack {
            Text(L10n.Goals.title)
                .font(.system(size: 32, weight: .bold))
                .foregroundStyle(isDark ? .white : Color(red: 17/255, green: 24/255, blue: 39/255))

            Spacer()
        }
        .padding(.horizontal, 20)
        .padding(.top, 16)
        .padding(.bottom, 8)
    }

    // MARK: - Goal Progress Card

    // Filter for goal progress - last 7 days of data for the weekly chart
    private var dailyGoalFilter: DeviceActivityFilter {
        let calendar = Calendar.current
        let today = Date()
        let weekAgo = calendar.date(byAdding: .day, value: -6, to: calendar.startOfDay(for: today))!
        return DeviceActivityFilter(
            segment: .daily(
                during: DateInterval(
                    start: weekAgo,
                    end: today
                )
            )
        )
    }

    private var goalProgressCard: some View {
        VStack(spacing: 0) {
            // Card Header with Share Button
            HStack {
                Text(L10n.Goals.todayUsage)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.secondary)
                    .tracking(0.5)

                Spacer()

                // Share Button - disabled until stats sync properly
                // Button {
                //     showShareSheet = true
                // } label: {
                //     Image(systemName: "square.and.arrow.up")
                //         .font(.system(size: 18, weight: .medium))
                //         .foregroundStyle(themeService.accentColor)
                //         .padding(10)
                //         .background(
                //             Circle()
                //                 .fill(themeService.accentColor.opacity(0.1))
                //         )
                // }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)

            // TODO: Restore original height (220) when app limits work properly
            // DeviceActivityReport for blocked apps usage (full-page design with big progress ring)
            ZStack {
                DeviceActivityReport(
                    .init("GoalsPageProgress"),
                    filter: dailyGoalFilter
                )
                .frame(height: 520)
                .opacity(isReportLoaded ? 1 : 0)
                .onAppear {
                    // Delay to allow report to load
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
                        withAnimation(.easeIn(duration: 0.3)) {
                            isReportLoaded = true
                        }
                    }
                }

                // Loading indicator
                if !isReportLoaded {
                    VStack(spacing: 12) {
                        ProgressView()
                            .scaleEffect(1.2)
                            .tint(themeService.accentColor)

                        Text(L10n.Goals.loading)
                            .font(.system(size: 13))
                            .foregroundStyle(.secondary)
                    }
                    .frame(height: 520)
                }

                // Transparent overlay to allow parent ScrollView to receive gestures
                Color.white.opacity(0.001)
                    .contentShape(Rectangle())
                    .allowsHitTesting(true)
            }
        }
        .background(
            ZStack {
                // Glassy background
                if isDark {
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Color.white.opacity(0.03))
                } else {
                    RoundedRectangle(cornerRadius: 20)
                        .fill(.ultraThinMaterial)
                }

                // Very subtle top shine
                VStack {
                    LinearGradient(
                        colors: isDark
                            ? [Color.white.opacity(0.04), Color.clear]
                            : [Color.white.opacity(0.3), Color.clear],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                    .frame(height: 35)
                    Spacer()
                }
                .clipShape(RoundedRectangle(cornerRadius: 20))

                // Subtle bottom glow from accent color
                VStack {
                    Spacer()
                    LinearGradient(
                        colors: [themeService.accentColor.opacity(isDark ? 0.08 : 0.12), Color.clear],
                        startPoint: .bottom,
                        endPoint: .top
                    )
                    .frame(height: 45)
                }
                .clipShape(RoundedRectangle(cornerRadius: 20))
            }
        )
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .padding(.horizontal, 20)
    }

    // MARK: - Authorization Banner

    private var authBannerIcon: some View {
        ZStack {
            Circle()
                .fill(Color.orange.opacity(0.15))
                .frame(width: 64, height: 64)

            Image(systemName: "hand.raised.fill")
                .font(.system(size: 28, weight: .medium))
                .foregroundStyle(.orange)
        }
    }

    private var authBannerText: some View {
        let textColor: Color = isDark ? .white : Color(hex: "111827")
        return VStack(spacing: 6) {
            Text(L10n.Goals.screenTimeRequired)
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(textColor)

            Text(L10n.Goals.screenTimeDescription)
                .font(.system(size: 14))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
    }

    private var authBannerButton: some View {
        let buttonGradient = LinearGradient(
            colors: [.orange, Color(hex: "ea580c")],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        return Button {
            isRequestingPermission = true
            Task {
                await blockingService.requestAuthorization()
                await MainActor.run {
                    isRequestingPermission = false
                }
            }
        } label: {
            HStack(spacing: 10) {
                if isRequestingPermission {
                    ProgressView()
                        .tint(.white)
                } else {
                    Image(systemName: "checkmark.shield.fill")
                        .font(.system(size: 16, weight: .semibold))
                }

                Text(isRequestingPermission ? L10n.Goals.requesting : L10n.Goals.grantAccess)
                    .font(.system(size: 16, weight: .semibold))
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(buttonGradient)
            )
            .shadow(color: .orange.opacity(0.3), radius: 8, y: 4)
        }
        .disabled(isRequestingPermission)
    }

    private var authorizationBanner: some View {
        let shadowOpacity: Double = isDark ? 0 : 0.05
        return VStack(spacing: 16) {
            authBannerIcon
            authBannerText
            authBannerButton
        }
        .padding(24)
        .background(
            Group {
                if isDark {
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Color.white.opacity(0.05))
                } else {
                    RoundedRectangle(cornerRadius: 20)
                        .fill(.ultraThinMaterial)
                }
            }
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(Color.orange.opacity(0.3), lineWidth: 1)
        )
        .shadow(color: .black.opacity(shadowOpacity), radius: 12, y: 4)
        .padding(.horizontal, 20)
    }

    // MARK: - Blocked Apps Section

    private var blockedAppsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(L10n.Goals.blockedApps)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.secondary)
                    .tracking(0.5)

                Spacer()

                Text("\(blockingService.totalBlockedCount) " + L10n.Goals.selected)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(themeService.accentColor)
            }
            .padding(.horizontal, 20)

            // App Picker Card
            Button {
                showAppPicker = true
            } label: {
                HStack(spacing: 16) {
                    // Icon
                    RoundedRectangle(cornerRadius: 14)
                        .fill(themeService.primaryGradient)
                        .frame(width: 52, height: 52)
                        .overlay {
                            Image(systemName: "hand.raised.fill")
                                .font(.system(size: 24, weight: .medium))
                                .foregroundStyle(.white)
                        }

                    VStack(alignment: .leading, spacing: 4) {
                        Text(L10n.Goals.selectAppsToBlock)
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(isDark ? .white : .black)

                        HStack(spacing: 8) {
                            Label("\(blockingService.blockedAppsCount) " + L10n.Profile.apps, systemImage: "app.fill")
                            Label("\(blockingService.blockedCategoriesCount) " + L10n.Profile.categories, systemImage: "folder.fill")
                        }
                        .font(.system(size: 12))
                        .foregroundStyle(.secondary)
                    }

                    Spacer()

                    Image(systemName: "chevron.right")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(.secondary)
                }
                .padding(16)
                .background(
                    Group {
                        if isDark {
                            RoundedRectangle(cornerRadius: 16)
                                .fill(Color.white.opacity(0.05))
                        } else {
                            RoundedRectangle(cornerRadius: 16)
                                .fill(.ultraThinMaterial)
                        }
                    }
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.06), lineWidth: 0.5)
                )
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 20)
        }
    }

    // MARK: - App Limits Section (Redesigned Cards)

    private var appLimitsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack {
                Text(L10n.Goals.appLimits)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.secondary)
                    .tracking(0.5)

                Spacer()

                if !blockingService.sortedAppLimits.isEmpty {
                    Text("\(blockingService.sortedAppLimits.count) " + L10n.Goals.apps)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(purpleColor)
                }
            }
            .padding(.horizontal, 20)

            // App Limit Cards
            if blockingService.sortedAppLimits.isEmpty {
                // Empty state card
                VStack(spacing: 16) {
                    ZStack {
                        Circle()
                            .fill(purpleColor.opacity(0.1))
                            .frame(width: 64, height: 64)

                        Image(systemName: "timer")
                            .font(.system(size: 28, weight: .medium))
                            .foregroundStyle(purpleColor)
                    }

                    VStack(spacing: 6) {
                        Text(L10n.Goals.noLimitsSet)
                            .font(.system(size: 17, weight: .semibold))
                            .foregroundStyle(isDark ? .white : Color(hex: "111827"))

                        Text(L10n.Goals.setDailyLimits)
                            .font(.system(size: 14))
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }

                    Button {
                        showLimitsSheet = true
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "plus.circle.fill")
                                .font(.system(size: 16))
                            Text(L10n.Goals.addAppLimit)
                                .font(.system(size: 15, weight: .semibold))
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 12)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(
                                    LinearGradient(
                                        colors: [purpleColor, Color(hex: "7c3aed")],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                        )
                        .shadow(color: purpleColor.opacity(0.4), radius: 8, y: 4)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 32)
                .padding(.horizontal, 24)
                .background(
                    ZStack {
                        // Glassy background
                        if isDark {
                            RoundedRectangle(cornerRadius: 20)
                                .fill(Color.white.opacity(0.03))
                        } else {
                            RoundedRectangle(cornerRadius: 20)
                                .fill(.ultraThinMaterial)
                        }

                        // Very subtle top shine
                        VStack {
                            LinearGradient(
                                colors: isDark
                                    ? [Color.white.opacity(0.04), Color.clear]
                                    : [Color.white.opacity(0.3), Color.clear],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                            .frame(height: 35)
                            Spacer()
                        }
                        .clipShape(RoundedRectangle(cornerRadius: 20))

                        // Subtle bottom glow from purple
                        VStack {
                            Spacer()
                            LinearGradient(
                                colors: [purpleColor.opacity(isDark ? 0.08 : 0.12), Color.clear],
                                startPoint: .bottom,
                                endPoint: .top
                            )
                            .frame(height: 45)
                        }
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                    }
                )
                .clipShape(RoundedRectangle(cornerRadius: 20))
                .padding(.horizontal, 20)
            } else {
                // App Limit Cards
                VStack(spacing: 12) {
                    ForEach(blockingService.sortedAppLimits) { limit in
                        AppLimitCardView(limit: limit)
                    }

                    // Add more button
                    Button {
                        showLimitsSheet = true
                    } label: {
                        HStack(spacing: 10) {
                            Image(systemName: "plus.circle.fill")
                                .font(.system(size: 18))

                            Text(L10n.Goals.addAnotherLimit)
                                .font(.system(size: 15, weight: .medium))

                            Spacer()
                        }
                        .foregroundStyle(purpleColor)
                        .padding(16)
                        .background(
                            RoundedRectangle(cornerRadius: 16)
                                .fill(purpleColor.opacity(0.08))
                                .strokeBorder(purpleColor.opacity(0.3), style: StrokeStyle(lineWidth: 1.5, dash: [8]))
                        )
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, 20)
            }
        }
    }
}

// MARK: - App Limit Card View (matches RN design)

struct AppLimitCardView: View {
    let limit: AppLimit
    @Environment(\.colorScheme) private var colorScheme
    @Environment(BlockingService.self) private var blockingService

    @State private var showEditSheet = false
    @State private var editedLimit: Int = 30

    private var isDark: Bool { colorScheme == .dark }
    private let blueColor = Color(hex: "3b82f6")
    private let orangeColor = Color(hex: "f59e0b")
    private let redColor = Color(hex: "ef4444")

    private var fillColor: Color {
        if limit.isLimitReached { return redColor }
        if limit.usagePercentage >= 0.75 { return orangeColor }
        return blueColor
    }

    private var fillGradient: [Color] {
        if limit.isLimitReached { return [redColor.opacity(0.6), redColor.opacity(0.3)] }
        if limit.usagePercentage >= 0.75 { return [orangeColor.opacity(0.6), orangeColor.opacity(0.3)] }
        return [blueColor.opacity(0.6), blueColor.opacity(0.3)]
    }

    var body: some View {
        Button {
            // Short press to edit
            editedLimit = limit.dailyLimitMinutes
            showEditSheet = true
        } label: {
            cardContent
        }
        .buttonStyle(.plain)
        .background(cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(cardBorder)
        .sheet(isPresented: $showEditSheet) {
            EditLimitSheet(
                appName: limit.appName,
                currentLimit: limit.dailyLimitMinutes,
                editedLimit: $editedLimit
            ) {
                blockingService.setLimit(
                    for: limit.appTokenData,
                    appName: limit.appName,
                    dailyLimitMinutes: editedLimit
                )
            }
            .presentationDetents([.height(300)])
        }
        .contextMenu {
            // Long press context menu to delete
            Button(role: .destructive) {
                blockingService.removeLimit(for: limit.appTokenData)
            } label: {
                Label(L10n.Goals.removeLimit, systemImage: "trash")
            }
        }
    }

    private var cardContent: some View {
        HStack(spacing: 12) {
            // Left: App Icon with lock overlay when exceeded
            appIconView

            // Middle: App name and usage info
            appInfoView

            Spacer()

            // Right: Square progress indicator with time
            progressSquareView
        }
        .padding(14)
    }

    private var appIconView: some View {
        ZStack {
            // App icon
            if let token = limit.applicationToken {
                Label(token)
                    .labelStyle(.iconOnly)
                    .scaleEffect(1.6)
                    .frame(width: 44, height: 44)
                    .opacity(limit.isLimitReached ? 0.4 : 1.0)
            } else {
                RoundedRectangle(cornerRadius: 12)
                    .fill(isDark ? Color(hex: "374151") : Color(hex: "e5e7eb"))
                    .frame(width: 44, height: 44)
                    .overlay {
                        Image(systemName: "app.fill")
                            .font(.system(size: 22))
                            .foregroundStyle(isDark ? .white.opacity(0.6) : .gray)
                    }
                    .opacity(limit.isLimitReached ? 0.4 : 1.0)
            }

            // Lock overlay when limit reached
            if limit.isLimitReached {
                RoundedRectangle(cornerRadius: 12)
                    .fill(redColor.opacity(0.85))
                    .frame(width: 44, height: 44)
                    .overlay {
                        Image(systemName: "lock.fill")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundStyle(.white)
                    }
            }
        }
    }

    private var appInfoView: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(limit.appName)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(isDark ? .white : Color(hex: "111827"))
                .lineLimit(1)

            if limit.isLimitReached {
                Text(L10n.Goals.limitReached)
                    .font(.system(size: 12))
                    .foregroundStyle(redColor)
            } else {
                Text("\(formatMinutes(limit.usedTodayMinutes)) / \(formatMinutes(Double(limit.dailyLimitMinutes)))")
                    .font(.system(size: 12))
                    .foregroundStyle(isDark ? Color(hex: "9ca3af") : Color(hex: "6b7280"))
            }
        }
    }

    private var progressSquareView: some View {
        ZStack {
            // Background square
            if isDark {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.white.opacity(0.08))
                    .frame(width: 52, height: 52)
            } else {
                RoundedRectangle(cornerRadius: 12)
                    .fill(.ultraThinMaterial)
                    .frame(width: 52, height: 52)
            }

            // Fill from bottom to top
            GeometryReader { geo in
                VStack {
                    Spacer()
                    RoundedRectangle(cornerRadius: 8)
                        .fill(
                            LinearGradient(
                                colors: fillGradient,
                                startPoint: .bottom,
                                endPoint: .top
                            )
                        )
                        .frame(height: geo.size.height * min(1.0, limit.usagePercentage))
                }
            }
            .frame(width: 52, height: 52)
            .clipShape(RoundedRectangle(cornerRadius: 12))

            // Time text
            Text(formatMinutes(Double(limit.dailyLimitMinutes)))
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(limit.isLimitReached ? redColor : (isDark ? .white : Color(hex: "111827")))
        }
        .frame(width: 52, height: 52)
    }

    private var cardBackground: some View {
        ZStack {
            // Subtle base background
            if isDark {
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color.white.opacity(0.03))
            } else {
                RoundedRectangle(cornerRadius: 16)
                    .fill(.ultraThinMaterial)
            }

            // Very subtle top shine
            VStack {
                LinearGradient(
                    colors: isDark
                        ? [Color.white.opacity(0.04), Color.clear]
                        : [Color.white.opacity(0.3), Color.clear],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(height: 25)
                Spacer()
            }
            .clipShape(RoundedRectangle(cornerRadius: 16))

            // Subtle bottom glow from status color
            VStack {
                Spacer()
                LinearGradient(
                    colors: limit.isLimitReached
                        ? [redColor.opacity(0.12), Color.clear]
                        : [blueColor.opacity(0.08), Color.clear],
                    startPoint: .bottom,
                    endPoint: .top
                )
                .frame(height: 35)
            }
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
    }

    private var cardBorder: some View {
        // Only show border when limit is reached (red warning)
        RoundedRectangle(cornerRadius: 16)
            .stroke(
                limit.isLimitReached
                    ? redColor.opacity(0.4)
                    : Color.clear,
                lineWidth: limit.isLimitReached ? 2 : 0
            )
    }

    private func formatMinutes(_ minutes: Double) -> String {
        let mins = Int(minutes)
        if mins >= 60 {
            let h = mins / 60
            let m = mins % 60
            return m > 0 ? "\(h)h \(m)m" : "\(h)h"
        }
        return "\(mins)m"
    }
}

// MARK: - App Picker View

struct AppPickerView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(BlockingService.self) private var blockingService

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                // Header
                VStack(spacing: 12) {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(
                            LinearGradient(
                                colors: [Color.healthExcellent, Color.healthExcellent.opacity(0.7)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 56, height: 56)
                        .overlay {
                            Image(systemName: "hand.raised.fill")
                                .font(.system(size: 26, weight: .semibold))
                                .foregroundStyle(.white)
                        }

                    Text(L10n.Goals.selectAppsToBlock)
                        .font(.system(size: 22, weight: .bold))

                    Text(L10n.Goals.chooseApps)
                        .font(.system(size: 14))
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                }
                .padding(.top, 20)

                // Selection count
                if blockingService.totalBlockedCount > 0 {
                    HStack(spacing: 16) {
                        Label("\(blockingService.blockedAppsCount) " + L10n.Profile.apps, systemImage: "app.fill")
                        Label("\(blockingService.blockedCategoriesCount) " + L10n.Profile.categories, systemImage: "folder.fill")
                    }
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Color.healthExcellent)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(Color.healthExcellent.opacity(0.1))
                    .clipShape(Capsule())
                }

                // Family Activity Picker
                FamilyActivityPicker(selection: Binding(
                    get: { blockingService.selectedApps },
                    set: { blockingService.selectedApps = $0 }
                ))
                .background(Color.appSecondaryBackground)
                .clipShape(RoundedRectangle(cornerRadius: 20))
                .padding(.horizontal, 16)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(L10n.Common.cancel) {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(L10n.Common.done) {
                        blockingService.applyBlocking()
                        dismiss()
                    }
                    .fontWeight(.bold)
                }
            }
        }
    }
}

// MARK: - Limits Editor

struct LimitsEditorView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @Environment(BlockingService.self) private var blockingService

    @State private var showAppPicker = false
    @State private var appSelection = FamilyActivitySelection()

    private var isDark: Bool { colorScheme == .dark }
    private let purpleColor = Color(hex: "8b5cf6")

    var body: some View {
        NavigationStack {
            ZStack {
                // Pure white/black background based on theme
                (isDark ? Color.black : Color.white).ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 24) {
                        headerSection
                        addLimitButton
                        limitsListSection
                        infoSection
                    }
                    .padding(.bottom, 100)
                }
            }
            .navigationTitle(L10n.Goals.setLimits)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(L10n.Common.done) { dismiss() }
                        .fontWeight(.bold)
                }
            }
            .familyActivityPicker(isPresented: $showAppPicker, selection: $appSelection)
            .onChange(of: appSelection) { _, newSelection in
                handleAppSelection(newSelection)
            }
        }
    }

    // MARK: - Header Section

    private var headerSection: some View {
        VStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 16)
                .fill(LinearGradient(colors: [purpleColor, Color(hex: "7c3aed")], startPoint: .topLeading, endPoint: .bottomTrailing))
                .frame(width: 56, height: 56)
                .overlay {
                    Image(systemName: "timer")
                        .font(.system(size: 26, weight: .semibold))
                        .foregroundStyle(.white)
                }

            Text(L10n.Goals.dailyAppLimits)
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(isDark ? .white : .black)

            Text(L10n.Goals.dailyAppLimitsDesc)
                .font(.system(size: 14))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
        }
        .padding(.top, 20)
    }

    // MARK: - Add Limit Button

    private var addLimitButton: some View {
        Button {
            showAppPicker = true
        } label: {
            HStack(spacing: 12) {
                RoundedRectangle(cornerRadius: 10)
                    .fill(purpleColor)
                    .frame(width: 40, height: 40)
                    .overlay {
                        Image(systemName: "plus")
                            .font(.system(size: 20, weight: .medium))
                            .foregroundStyle(.white)
                    }

                VStack(alignment: .leading, spacing: 2) {
                    Text(L10n.Goals.addAppLimit)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(purpleColor)
                    Text(L10n.Goals.selectAppsToSetLimits)
                        .font(.system(size: 12))
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.system(size: 14))
                    .foregroundStyle(.secondary)
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(purpleColor.opacity(0.08))
                    .strokeBorder(purpleColor, style: StrokeStyle(lineWidth: 1.5, dash: [6]))
            )
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 20)
    }

    // MARK: - Limits List Section

    private var limitsListSection: some View {
        Group {
            if !blockingService.sortedAppLimits.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    Text(L10n.Goals.appLimits)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(.secondary)
                        .tracking(0.5)

                    VStack(spacing: 10) {
                        ForEach(blockingService.sortedAppLimits) { limit in
                            LimitEditorRow(limit: limit)
                        }
                    }
                }
                .padding(.horizontal, 20)
            } else {
                emptyStateView
            }
        }
    }

    private var emptyStateView: some View {
        VStack(spacing: 12) {
            Image(systemName: "timer")
                .font(.system(size: 40))
                .foregroundStyle(.secondary)

            Text(L10n.Goals.noAppLimitsSet)
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(.secondary)

            Text(L10n.Goals.tapToSetLimits)
                .font(.system(size: 14))
                .foregroundStyle(.secondary.opacity(0.7))
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(isDark ? Color(white: 0.12) : Color(white: 0.97))
                .stroke(isDark ? Color.white.opacity(0.1) : Color(hex: "e2e8f0"), lineWidth: 1)
        )
        .padding(.horizontal, 20)
    }

    // MARK: - Info Section

    private var infoSection: some View {
        HStack(spacing: 12) {
            Image(systemName: "info.circle.fill")
                .font(.system(size: 20))
                .foregroundStyle(Color.blue)

            Text(L10n.Goals.limitsResetInfo)
                .font(.system(size: 13))
                .foregroundStyle(.secondary)
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(Color.blue.opacity(0.08))
        )
        .padding(.horizontal, 20)
    }

    // MARK: - Helpers

    private func handleAppSelection(_ selection: FamilyActivitySelection) {
        for token in selection.applicationTokens {
            if let tokenData = try? PropertyListEncoder().encode(token) {
                blockingService.setLimit(
                    for: tokenData,
                    appName: "App",
                    dailyLimitMinutes: blockingService.defaultLimitMinutes
                )
            }
        }
        appSelection = FamilyActivitySelection()
    }
}

// MARK: - Limit Editor Row (Simple version for editor)

struct LimitEditorRow: View {
    let limit: AppLimit
    @Environment(\.colorScheme) private var colorScheme
    @Environment(BlockingService.self) private var blockingService

    @State private var showEditSheet = false
    @State private var editedLimit: Int = 30

    private var isDark: Bool { colorScheme == .dark }
    private let purpleColor = Color(hex: "8b5cf6")
    private let redColor = Color(hex: "ef4444")

    var body: some View {
        rowContent
            .padding(14)
            .background(rowBackground)
            .overlay(rowBorder)
            .sheet(isPresented: $showEditSheet) {
                EditLimitSheet(
                    appName: limit.appName,
                    currentLimit: limit.dailyLimitMinutes,
                    editedLimit: $editedLimit
                ) {
                    blockingService.setLimit(
                        for: limit.appTokenData,
                        appName: limit.appName,
                        dailyLimitMinutes: editedLimit
                    )
                }
                .presentationDetents([.height(300)])
            }
    }

    private var rowContent: some View {
        HStack(spacing: 12) {
            iconView
            infoView
            Spacer()
            editButtonView
            deleteButtonView
        }
    }

    private var iconView: some View {
        ZStack {
            Circle()
                .fill(limit.isLimitReached ? redColor.opacity(0.15) : purpleColor.opacity(0.15))
                .frame(width: 40, height: 40)

            // Show actual app icon if available, otherwise show generic icon
            if let token = limit.applicationToken {
                Label(token)
                    .labelStyle(.iconOnly)
                    .scaleEffect(1.2)
            } else {
                Image(systemName: "app.fill")
                    .font(.system(size: 16))
                    .foregroundStyle(limit.isLimitReached ? redColor : purpleColor)
            }
        }
    }

    private var infoView: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(limit.appName)
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(isDark ? .white : .black)
            Text(L10n.Goals.minDailyLimit(limit.dailyLimitMinutes))
                .font(.system(size: 12))
                .foregroundStyle(.secondary)
        }
    }

    private var editButtonView: some View {
        Button {
            editedLimit = limit.dailyLimitMinutes
            showEditSheet = true
        } label: {
            Text(L10n.Common.edit)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(purpleColor)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Capsule().fill(purpleColor.opacity(0.1)))
        }
    }

    private var deleteButtonView: some View {
        Button {
            blockingService.removeLimit(for: limit.appTokenData)
        } label: {
            Image(systemName: "trash")
                .font(.system(size: 14))
                .foregroundStyle(redColor)
                .padding(8)
                .background(Circle().fill(redColor.opacity(0.1)))
        }
    }

    private var rowBackground: some View {
        RoundedRectangle(cornerRadius: 14)
            .fill(isDark ? Color(white: 0.12) : .white)
    }

    private var rowBorder: some View {
        RoundedRectangle(cornerRadius: 14)
            .stroke(isDark ? Color.white.opacity(0.1) : Color(hex: "e2e8f0"), lineWidth: 1)
    }
}

// MARK: - Edit Limit Sheet

struct EditLimitSheet: View {
    let appName: String
    let currentLimit: Int
    @Binding var editedLimit: Int
    let onSave: () -> Void

    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme

    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                VStack(spacing: 8) {
                    Text(L10n.Goals.dailyLimitFor)
                        .font(.system(size: 15))
                        .foregroundStyle(.secondary)

                    Text(appName)
                        .font(.system(size: 20, weight: .bold))
                        .foregroundStyle(isDark ? .white : .black)
                }
                .padding(.top, 20)

                // Slider
                VStack(spacing: 8) {
                    Text(L10n.Goals.minutesCount(editedLimit))
                        .font(.system(size: 32, weight: .bold))
                        .foregroundStyle(Color.purple)

                    Slider(
                        value: Binding(
                            get: { Double(editedLimit) },
                            set: { editedLimit = Int($0) }
                        ),
                        in: Double(AppLimit.minLimit)...Double(AppLimit.maxLimit),
                        step: 5
                    )
                    .tint(Color.purple)
                    .padding(.horizontal, 20)

                    HStack {
                        Text("\(AppLimit.minLimit) min")
                        Spacer()
                        Text("\(AppLimit.maxLimit / 60)h")
                    }
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 20)
                }

                Spacer()
            }
            .background(isDark ? Color.black : Color.white)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(L10n.Common.cancel) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(L10n.Common.save) {
                        onSave()
                        dismiss()
                    }
                    .fontWeight(.bold)
                }
            }
        }
    }
}

// MARK: - Goal Share Sheet

struct GoalShareSheet: View {
    let dailyGoal: DailyGoal
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme

    @State private var renderedImage: UIImage?

    private var isDark: Bool { colorScheme == .dark }
    private let greenColor = Color(hex: "10b981")
    private let blueColor = Color(hex: "3b82f6")

    private var progressColor: Color {
        let pct = dailyGoal.progressPercentage
        if pct >= 0.9 { return Color(hex: "ef4444") }
        if pct >= 0.7 { return Color(hex: "f59e0b") }
        return greenColor
    }

    private var progressColors: [Color] {
        let pct = dailyGoal.progressPercentage
        if pct >= 0.9 { return [Color(hex: "ef4444"), Color(hex: "dc2626")] }
        if pct >= 0.7 { return [Color(hex: "f59e0b"), Color(hex: "d97706")] }
        return [greenColor, Color(hex: "059669")]
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBackground.ignoresSafeArea()

                VStack(spacing: 24) {
                    // Preview of shareable card (matches current theme)
                    ShareableGoalCard(
                        dailyGoal: dailyGoal,
                        progressColor: progressColor,
                        progressColors: progressColors,
                        blueColor: blueColor,
                        isDark: isDark
                    )
                    .padding(.horizontal, 20)

                    // Share Button
                    Button {
                        shareProgress()
                    } label: {
                        HStack(spacing: 12) {
                            Image(systemName: "square.and.arrow.up")
                                .font(.system(size: 18, weight: .semibold))

                            Text(L10n.Goals.shareProgress)
                                .font(.system(size: 17, weight: .semibold))
                        }
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(
                            RoundedRectangle(cornerRadius: 14)
                                .fill(
                                    LinearGradient(
                                        colors: [blueColor, Color(hex: "2563eb")],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                        )
                        .shadow(color: blueColor.opacity(0.4), radius: 12, y: 6)
                    }
                    .padding(.horizontal, 20)

                    Spacer()
                }
                .padding(.top, 20)
            }
            .navigationTitle(L10n.Goals.shareProgress)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(L10n.Common.cancel) { dismiss() }
                }
            }
        }
    }

    // MARK: - Share Progress

    @MainActor
    private func shareProgress() {
        // Create the card view for rendering (always use dark style for sharing - looks better)
        let cardView = ShareableGoalCard(
            dailyGoal: dailyGoal,
            progressColor: progressColor,
            progressColors: progressColors,
            blueColor: blueColor,
            isDark: true  // Always dark for shared image - looks premium
        )
        .frame(width: 340)
        .padding(20)
        .background(Color.black)

        // Render to image
        let renderer = ImageRenderer(content: cardView)
        renderer.scale = 3.0

        guard let image = renderer.uiImage else { return }

        // Present share sheet
        let text = "Tracking my screen time with LockIn! 📱"
        let activityItems: [Any] = [image, text]

        let activityVC = UIActivityViewController(
            activityItems: activityItems,
            applicationActivities: nil
        )

        // Find the correct presenting view controller
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first {
            // Get the topmost presented view controller
            var topController = window.rootViewController
            while let presented = topController?.presentedViewController {
                topController = presented
            }

            // For iPad
            if let popover = activityVC.popoverPresentationController {
                popover.sourceView = window
                popover.sourceRect = CGRect(x: window.bounds.midX, y: window.bounds.midY, width: 0, height: 0)
                popover.permittedArrowDirections = []
            }

            topController?.present(activityVC, animated: true)
        }
    }
}

// MARK: - Shareable Goal Card (Static for rendering)

struct ShareableGoalCard: View {
    let dailyGoal: DailyGoal
    let progressColor: Color
    let progressColors: [Color]
    let blueColor: Color
    let isDark: Bool

    private var textColor: Color {
        isDark ? .white : Color(hex: "111827")
    }

    private var secondaryTextColor: Color {
        isDark ? Color(hex: "9ca3af") : Color(hex: "6b7280")
    }

    private var cardBackground: Color {
        isDark ? Color(hex: "1a1a2e") : .white
    }

    private var dividerColor: Color {
        isDark ? Color.white.opacity(0.2) : Color.gray.opacity(0.3)
    }

    private func formattedDate() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d, yyyy"
        return formatter.string(from: Date())
    }

    private func motivationalText() -> String {
        let pct = dailyGoal.progressPercentage
        if pct >= 1.0 {
            return "Goal reached! Taking a mindful break. 🧘"
        } else if pct >= 0.75 {
            return "Almost there! Staying focused. 💪"
        } else if pct >= 0.5 {
            return "Halfway through my screen time goal!"
        } else {
            return "Making progress on my daily goal! 🎯"
        }
    }

    var body: some View {
        VStack(spacing: 20) {
            // App branding
            HStack {
                Image(systemName: "scope")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(blueColor)

                Text("LockIn")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(textColor)

                Spacer()

                Text(formattedDate())
                    .font(.system(size: 13))
                    .foregroundStyle(secondaryTextColor)
            }

            // Progress Ring
            ZStack {
                Circle()
                    .stroke(isDark ? Color.white.opacity(0.15) : Color.gray.opacity(0.2), lineWidth: 14)
                    .frame(width: 140, height: 140)

                Circle()
                    .trim(from: 0, to: dailyGoal.progressPercentage)
                    .stroke(
                        LinearGradient(colors: progressColors, startPoint: .topLeading, endPoint: .bottomTrailing),
                        style: StrokeStyle(lineWidth: 14, lineCap: .round)
                    )
                    .frame(width: 140, height: 140)
                    .rotationEffect(.degrees(-90))

                VStack(spacing: 4) {
                    Text("\(Int(dailyGoal.progressPercentage * 100))%")
                        .font(.system(size: 36, weight: .bold))
                        .foregroundStyle(progressColor)

                    Text(L10n.Goals.ofGoal)
                        .font(.system(size: 14))
                        .foregroundStyle(secondaryTextColor)
                }
            }

            // Stats
            HStack(spacing: 20) {
                VStack(spacing: 4) {
                    Text(dailyGoal.formattedUsed)
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(progressColor)
                    Text(L10n.Goals.used)
                        .font(.system(size: 13))
                        .foregroundStyle(secondaryTextColor)
                }

                Rectangle()
                    .fill(dividerColor)
                    .frame(width: 1, height: 44)

                VStack(spacing: 4) {
                    Text(dailyGoal.formattedTarget)
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(textColor)
                    Text(L10n.Goals.goal)
                        .font(.system(size: 13))
                        .foregroundStyle(secondaryTextColor)
                }

                Rectangle()
                    .fill(dividerColor)
                    .frame(width: 1, height: 44)

                VStack(spacing: 4) {
                    Text(dailyGoal.formattedRemaining)
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(textColor)
                    Text(L10n.Goals.left)
                        .font(.system(size: 13))
                        .foregroundStyle(secondaryTextColor)
                }
            }

            // Motivational text
            Text(motivationalText())
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(secondaryTextColor)
                .multilineTextAlignment(.center)
        }
        .padding(24)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(cardBackground)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 24)
                .stroke(isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.06), lineWidth: 1)
        )
        .shadow(color: .black.opacity(isDark ? 0.4 : 0.15), radius: 20, y: 10)
    }
}

#Preview {
    BlockingView()
        .environment(ThemeService())
        .environment(BlockingService())
        .environment(TimeBankService())
}
