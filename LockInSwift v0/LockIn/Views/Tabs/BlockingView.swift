import SwiftUI
import FamilyControls

struct BlockingView: View {
    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService
    @Environment(BlockingService.self) private var blockingService
    @Environment(TimeBankService.self) private var timeBank

    @State private var showAppPicker = false
    @State private var showScheduleSheet = false
    @State private var showLimitsSheet = false
    @State private var isBlockingEnabled = true

    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Authorization Banner
                    if !blockingService.isAuthorized {
                        authorizationBanner
                    }

                    // Blocked Apps Section
                    blockedAppsSection

                    // Quick Block Toggle
                    blockingToggleCard

                    // Schedules Section
                    schedulesSection

                    // Daily Limits Section
                    limitsSection
                }
                .padding(.vertical, 16)
                .padding(.bottom, 100)
            }
            .background(Color.appBackground)
            .navigationTitle("Blocking")
            .sheet(isPresented: $showAppPicker) {
                AppPickerView()
            }
            .sheet(isPresented: $showScheduleSheet) {
                ScheduleEditorView()
            }
            .sheet(isPresented: $showLimitsSheet) {
                LimitsEditorView()
            }
        }
    }

    // MARK: - Authorization Banner

    private var authorizationBanner: some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 32))
                .foregroundStyle(.orange)

            Text("Screen Time Access Required")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(isDark ? .white : .black)

            Text("Grant access to block apps and track screen time")
                .font(.system(size: 14))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            Button {
                Task {
                    await blockingService.requestAuthorization()
                }
            } label: {
                Text("Grant Access")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(themeService.primaryGradient)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(isDark ? Color.white.opacity(0.05) : .white)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(Color.orange.opacity(0.5), lineWidth: 1)
        )
        .padding(.horizontal, 20)
    }

    // MARK: - Blocked Apps Section

    private var blockedAppsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("BLOCKED APPS")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.secondary)
                    .tracking(0.5)

                Spacer()

                Text("\(blockingService.totalBlockedCount) selected")
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
                        Text("Select Apps to Block")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(isDark ? .white : .black)

                        HStack(spacing: 8) {
                            Label("\(blockingService.blockedAppsCount) Apps", systemImage: "app.fill")
                            Label("\(blockingService.blockedCategoriesCount) Categories", systemImage: "folder.fill")
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
                    RoundedRectangle(cornerRadius: 16)
                        .fill(isDark ? Color.white.opacity(0.05) : .white)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.05), lineWidth: 1)
                )
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 20)
        }
    }

    // MARK: - Blocking Toggle

    private var blockingToggleCard: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Blocking Active")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(isDark ? .white : .black)

                Text("All selected apps are currently blocked")
                    .font(.system(size: 13))
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Toggle("", isOn: $isBlockingEnabled)
                .toggleStyle(SwitchToggleStyle(tint: themeService.accentColor))
                .labelsHidden()
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(isBlockingEnabled
                      ? themeService.accentColor.opacity(0.1)
                      : (isDark ? Color.white.opacity(0.05) : Color(white: 0.97)))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(isBlockingEnabled
                        ? themeService.accentColor.opacity(0.3)
                        : (isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.05)), lineWidth: 1)
        )
        .padding(.horizontal, 20)
        .onChange(of: isBlockingEnabled) { _, newValue in
            if newValue {
                blockingService.applyBlocking()
            } else {
                blockingService.clearBlocking()
            }
        }
    }

    // MARK: - Schedules Section

    private var schedulesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("UNBLOCK SCHEDULES")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.secondary)
                    .tracking(0.5)

                Spacer()
            }
            .padding(.horizontal, 20)

            // Add Schedule Button
            Button {
                showScheduleSheet = true
            } label: {
                HStack(spacing: 12) {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(Color.blue)
                        .frame(width: 40, height: 40)
                        .overlay {
                            Image(systemName: "calendar.badge.plus")
                                .font(.system(size: 18))
                                .foregroundStyle(.white)
                        }

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Create Unblock Schedule")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(Color.blue)
                        Text("Allow app access during specific times")
                            .font(.system(size: 12))
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    Image(systemName: "plus")
                        .font(.system(size: 16))
                        .foregroundStyle(Color.blue)
                }
                .padding(14)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(Color.blue.opacity(0.08))
                        .strokeBorder(Color.blue, style: StrokeStyle(lineWidth: 1.5, dash: [6]))
                )
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 20)
        }
    }

    // MARK: - Limits Section

    private var limitsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("DAILY LIMITS")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.secondary)
                    .tracking(0.5)

                Spacer()
            }
            .padding(.horizontal, 20)

            // Add Limit Button
            Button {
                showLimitsSheet = true
            } label: {
                HStack(spacing: 12) {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(Color.purple)
                        .frame(width: 40, height: 40)
                        .overlay {
                            Image(systemName: "timer")
                                .font(.system(size: 18))
                                .foregroundStyle(.white)
                        }

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Set App Limits")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(Color.purple)
                        Text("Limit how much earned time can be spent")
                            .font(.system(size: 12))
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    Image(systemName: "plus")
                        .font(.system(size: 16))
                        .foregroundStyle(Color.purple)
                }
                .padding(14)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(Color.purple.opacity(0.08))
                        .strokeBorder(Color.purple, style: StrokeStyle(lineWidth: 1.5, dash: [6]))
                )
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 20)
        }
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

                    Text("Select Apps to Block")
                        .font(.system(size: 22, weight: .bold))

                    Text("Choose apps and categories you want to block. You can change this anytime.")
                        .font(.system(size: 14))
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                }
                .padding(.top, 20)

                // Selection count
                if blockingService.totalBlockedCount > 0 {
                    HStack(spacing: 16) {
                        Label("\(blockingService.blockedAppsCount) Apps", systemImage: "app.fill")
                        Label("\(blockingService.blockedCategoriesCount) Categories", systemImage: "folder.fill")
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
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        blockingService.applyBlocking()
                        dismiss()
                    }
                    .fontWeight(.bold)
                }
            }
        }
    }
}

// MARK: - Schedule Editor (Placeholder)

struct ScheduleEditorView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack {
                Text("Schedule Editor")
                    .font(.title)
                Text("Coming soon...")
                    .foregroundStyle(.secondary)
            }
            .navigationTitle("New Schedule")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Limits Editor (Placeholder)

struct LimitsEditorView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack {
                Text("Limits Editor")
                    .font(.title)
                Text("Coming soon...")
                    .foregroundStyle(.secondary)
            }
            .navigationTitle("Set Limits")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { dismiss() }
                }
            }
        }
    }
}

#Preview {
    BlockingView()
        .environment(ThemeService())
        .environment(BlockingService())
        .environment(TimeBankService())
}
