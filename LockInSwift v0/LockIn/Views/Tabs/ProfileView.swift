import SwiftUI

struct ProfileView: View {
    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService
    @Environment(AuthService.self) private var authService
    @Environment(StatsService.self) private var statsService

    @State private var showSettings = false
    @State private var showAchievements = false
    @State private var showEditProfile = false

    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Profile Header
                    profileHeader

                    // Stats Cards
                    statsCards

                    // Achievements Preview
                    achievementsSection

                    // Settings List
                    settingsList

                    // Sign Out
                    signOutButton
                }
                .padding(.vertical, 16)
                .padding(.bottom, 100)
            }
            .background(Color.appBackground)
            .navigationTitle("Profile")
            .sheet(isPresented: $showSettings) {
                SettingsView()
            }
            .sheet(isPresented: $showAchievements) {
                AchievementsView()
            }
            .sheet(isPresented: $showEditProfile) {
                EditProfileView()
            }
        }
    }

    // MARK: - Profile Header

    private var profileHeader: some View {
        VStack(spacing: 16) {
            // Avatar
            ZStack {
                Circle()
                    .fill(themeService.primaryGradient)
                    .frame(width: 100, height: 100)

                if let user = authService.currentUser,
                   let initial = user.displayName?.first ?? user.email.first {
                    Text(String(initial).uppercased())
                        .font(.system(size: 40, weight: .bold))
                        .foregroundStyle(.white)
                } else {
                    Image(systemName: "person.fill")
                        .font(.system(size: 40))
                        .foregroundStyle(.white)
                }
            }

            // Name & Email
            VStack(spacing: 4) {
                Text(authService.currentUser?.displayName ?? "User")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(isDark ? .white : .black)

                Text(authService.currentUser?.email ?? "")
                    .font(.system(size: 14))
                    .foregroundStyle(.secondary)
            }

            // Pro Badge
            if authService.currentUser?.isPro == true {
                HStack(spacing: 6) {
                    Image(systemName: "crown.fill")
                        .font(.system(size: 12))
                    Text("PRO")
                        .font(.system(size: 12, weight: .bold))
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(
                    LinearGradient(
                        colors: [.orange, .yellow],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .clipShape(Capsule())
            }

            // Edit Button
            Button {
                showEditProfile = true
            } label: {
                Text("Edit Profile")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(themeService.accentColor)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 8)
                    .background(themeService.accentColor.opacity(0.1))
                    .clipShape(Capsule())
            }
        }
        .padding(24)
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(isDark ? Color.white.opacity(0.05) : .white)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 24)
                .stroke(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.05), lineWidth: 1)
        )
        .padding(.horizontal, 20)
    }

    // MARK: - Stats Cards

    private var statsCards: some View {
        HStack(spacing: 12) {
            ProfileStatCard(
                icon: "flame.fill",
                value: "\(statsService.currentStreak)",
                label: "Day Streak",
                color: .orange
            )

            ProfileStatCard(
                icon: "star.fill",
                value: "\(statsService.longestStreak)",
                label: "Best Streak",
                color: .yellow
            )

            ProfileStatCard(
                icon: "clock.fill",
                value: "\(Int(statsService.totalScreenTimeToday / 3600))h",
                label: "Today",
                color: themeService.accentColor
            )
        }
        .padding(.horizontal, 20)
    }

    // MARK: - Achievements Section

    private var achievementsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("ACHIEVEMENTS")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.secondary)
                    .tracking(0.5)

                Spacer()

                Button {
                    showAchievements = true
                } label: {
                    Text("See All")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(themeService.accentColor)
                }
            }
            .padding(.horizontal, 20)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(0..<5) { index in
                        AchievementBadge(
                            icon: ["flame.fill", "star.fill", "bolt.fill", "heart.fill", "trophy.fill"][index],
                            isUnlocked: index < 3
                        )
                    }
                }
                .padding(.horizontal, 20)
            }
        }
    }

    // MARK: - Settings List

    private var settingsList: some View {
        VStack(spacing: 0) {
            SettingsRow(icon: "gearshape.fill", title: "Settings", color: .gray) {
                showSettings = true
            }

            SettingsRow(icon: "bell.fill", title: "Notifications", color: .red) {
                // Navigate to notifications
            }

            SettingsRow(icon: "paintbrush.fill", title: "Appearance", color: .purple) {
                showSettings = true
            }

            SettingsRow(icon: "questionmark.circle.fill", title: "Help & Support", color: .blue) {
                // Navigate to help
            }

            SettingsRow(icon: "info.circle.fill", title: "About", color: .gray, showDivider: false) {
                // Show about
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

    // MARK: - Sign Out Button

    private var signOutButton: some View {
        Button {
            authService.signOut()
        } label: {
            HStack {
                Image(systemName: "rectangle.portrait.and.arrow.right")
                Text("Sign Out")
            }
            .font(.system(size: 16, weight: .medium))
            .foregroundStyle(.red)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(Color.red.opacity(0.1))
            )
        }
        .padding(.horizontal, 20)
    }
}

// MARK: - Profile Stat Card

struct ProfileStatCard: View {
    let icon: String
    let value: String
    let label: String
    let color: Color

    @Environment(\.colorScheme) private var colorScheme
    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundStyle(color)

            Text(value)
                .font(.system(size: 22, weight: .bold, design: .rounded))
                .foregroundStyle(isDark ? .white : .black)

            Text(label)
                .font(.system(size: 11))
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

// MARK: - Achievement Badge

struct AchievementBadge: View {
    let icon: String
    let isUnlocked: Bool

    @Environment(ThemeService.self) private var themeService

    var body: some View {
        ZStack {
            Circle()
                .fill(isUnlocked ? themeService.accentColor : Color.secondary.opacity(0.2))
                .frame(width: 56, height: 56)

            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundStyle(isUnlocked ? .white : .secondary)
        }
        .opacity(isUnlocked ? 1 : 0.5)
    }
}

// MARK: - Settings Row

struct SettingsRow: View {
    let icon: String
    let title: String
    let color: Color
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
                        .foregroundStyle(color)
                        .frame(width: 28)

                    Text(title)
                        .font(.system(size: 16))
                        .foregroundStyle(isDark ? .white : .black)

                    Spacer()

                    Image(systemName: "chevron.right")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)

                if showDivider {
                    Divider()
                        .padding(.leading, 58)
                }
            }
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Settings View (Placeholder)

struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                Section("Appearance") {
                    Text("Theme")
                    Text("Accent Color")
                }
                Section("Notifications") {
                    Text("Push Notifications")
                    Text("Reminders")
                }
                Section("Privacy") {
                    Text("Data & Privacy")
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Achievements View (Placeholder)

struct AchievementsView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack {
                Text("Achievements")
                    .font(.title)
                Text("Coming soon...")
                    .foregroundStyle(.secondary)
            }
            .navigationTitle("Achievements")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Edit Profile View (Placeholder)

struct EditProfileView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack {
                Text("Edit Profile")
                    .font(.title)
                Text("Coming soon...")
                    .foregroundStyle(.secondary)
            }
            .navigationTitle("Edit Profile")
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
    ProfileView()
        .environment(ThemeService())
        .environment(AuthService())
        .environment(StatsService())
}
