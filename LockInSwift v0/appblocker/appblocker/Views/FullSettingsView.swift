import SwiftUI
import FamilyControls

struct FullSettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService
    @Environment(AuthService.self) private var authService
    @Environment(BlockingService.self) private var blockingService
    @Environment(LocalizationService.self) private var localizationService

    @State private var showLanguageSelector = false
    @State private var showDeleteAccountAlert = false
    @State private var deleteConfirmText = ""
    @State private var newPassword = ""
    @State private var isDeleting = false

    // TODO: Notifications toggle state (uncomment when ready)
    // @State private var notificationsEnabled = true

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
                    VStack(spacing: 28) {
                        // Title
                        Text(L10n.Settings.title)
                            .font(.system(size: 32, weight: .bold))
                            .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                            .tracking(-0.5)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.top, 8)

                        // Accent Color Section
                        accentColorSection

                        // Appearance Section
                        appearanceSection

                        // Language Section
                        languageSection

                        // TODO: Notifications Section (uncomment when ready)
                        // notificationsSection

                        // Password Section
                        passwordSection

                        // Save Button
                        saveButton

                        // Danger Zone
                        dangerZoneSection
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 40)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        dismiss()
                    } label: {
                        RoundedRectangle(cornerRadius: 14)
                            .fill(isDark ? Color.white.opacity(0.05) : .white)
                            .frame(width: 44, height: 44)
                            .overlay(
                                RoundedRectangle(cornerRadius: 14)
                                    .stroke(isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.06), lineWidth: 0.5)
                            )
                            .overlay {
                                Image(systemName: "arrow.left")
                                    .font(.system(size: 18, weight: .medium))
                                    .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                            }
                    }
                }
            }
        }
        .sheet(isPresented: $showLanguageSelector) {
            LanguageSelectorView(localizationService: localizationService)
        }
        .alert(L10n.Settings.deleteAccount, isPresented: $showDeleteAccountAlert) {
            TextField(L10n.Settings.deleteAccountConfirm, text: $deleteConfirmText)
            Button(L10n.Common.cancel, role: .cancel) {
                deleteConfirmText = ""
            }
            Button(L10n.Settings.typeDelete, role: .destructive) {
                if deleteConfirmText == "Delete" {
                    deleteAccount()
                }
            }
        } message: {
            Text(L10n.Settings.deleteAccountWarning)
        }
    }

    // MARK: - Accent Color Section

    private var accentColorSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                SettingsSectionIcon(
                    icon: "paintpalette.fill",
                    gradient: [themeService.accentColor, themeService.accentColorDark]
                )

                Text(L10n.Settings.accentColor)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                    .tracking(-0.3)
            }

            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 12), count: 4), spacing: 12) {
                ForEach(AccentColorOption.allCases, id: \.self) { option in
                    let isSelected = themeService.accentColorOption == option

                    Button {
                        themeService.accentColorOption = option
                    } label: {
                        VStack(spacing: 8) {
                            ZStack {
                                LinearGradient(
                                    colors: [option.color, option.darkVariant],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )

                                if isSelected {
                                    Image(systemName: "checkmark")
                                        .font(.system(size: 18, weight: .bold))
                                        .foregroundStyle(.white)
                                }
                            }
                            .frame(width: 48, height: 48)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(isSelected ? (isDark ? .white : Color(hex: "0f172a")) : .clear, lineWidth: 3)
                            )
                            .shadow(color: option.color.opacity(isSelected ? 0.4 : 0.2), radius: isSelected ? 12 : 6, y: isSelected ? 6 : 2)

                            Text(option.displayName)
                                .font(.system(size: 11, weight: isSelected ? .bold : .medium))
                                .foregroundStyle(isSelected ? option.color : (isDark ? Color.white.opacity(0.6) : Color(hex: "64748b")))
                        }
                    }
                }
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(isDark ? Color.white.opacity(0.03) : .white)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(isDark ? Color.white.opacity(0.06) : Color.black.opacity(0.03), lineWidth: 0.5)
            )
            .shadow(color: .black.opacity(isDark ? 0 : 0.03), radius: 12, y: 4)
        }
    }

    // MARK: - Appearance Section

    private var appearanceSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                SettingsSectionIcon(
                    icon: isDark ? "moon.fill" : "sun.max.fill",
                    background: isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.05)
                )

                Text(L10n.Settings.appearance)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                    .tracking(-0.3)
            }

            VStack(spacing: 4) {
                ForEach(ThemeMode.allCases, id: \.self) { mode in
                    let isSelected = themeService.themeMode == mode
                    let icon = mode == .system ? "iphone" : (mode == .light ? "sun.max.fill" : "moon.fill")

                    Button {
                        themeService.themeMode = mode
                    } label: {
                        HStack(spacing: 14) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(isSelected
                                        ? themeService.accentColor.opacity(0.2)
                                        : (isDark ? Color.white.opacity(0.05) : Color.black.opacity(0.03)))
                                    .frame(width: 40, height: 40)

                                Image(systemName: icon)
                                    .font(.system(size: 18))
                                    .foregroundStyle(isSelected ? themeService.accentColor : (isDark ? Color.white.opacity(0.5) : Color(hex: "94a3b8")))
                            }

                            Text(mode.displayName)
                                .font(.system(size: 16, weight: isSelected ? .bold : .medium))
                                .foregroundStyle(isSelected ? themeService.accentColor : (isDark ? .white : Color(hex: "0f172a")))

                            Spacer()

                            if isSelected {
                                ZStack {
                                    LinearGradient(
                                        colors: [themeService.accentColor, themeService.accentColorDark],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )

                                    Image(systemName: "checkmark")
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundStyle(.white)
                                }
                                .frame(width: 24, height: 24)
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                            }
                        }
                        .padding(.vertical, 14)
                        .padding(.horizontal, 16)
                        .background(
                            RoundedRectangle(cornerRadius: 14)
                                .fill(isSelected ? themeService.accentColor.opacity(isDark ? 0.15 : 0.1) : .clear)
                        )
                    }
                }
            }
            .padding(6)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(isDark ? Color.white.opacity(0.03) : .white)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(isDark ? Color.white.opacity(0.06) : Color.black.opacity(0.03), lineWidth: 0.5)
            )
            .shadow(color: .black.opacity(isDark ? 0 : 0.03), radius: 12, y: 4)
        }
    }

    // MARK: - Language Section

    private var languageSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                SettingsSectionIcon(
                    icon: "globe",
                    background: isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.05)
                )

                Text(L10n.Settings.language)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                    .tracking(-0.3)
            }

            Button {
                showLanguageSelector = true
            } label: {
                HStack(spacing: 14) {
                    Text(localizationService.currentLanguage.flag)
                        .font(.system(size: 32))

                    VStack(alignment: .leading, spacing: 4) {
                        Text(L10n.Settings.currentLanguage)
                            .font(.system(size: 13))
                            .foregroundStyle(isDark ? Color.white.opacity(0.5) : Color(hex: "94a3b8"))

                        Text(localizationService.currentLanguage.nativeName)
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                    }

                    Spacer()

                    ZStack {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(isDark ? Color.white.opacity(0.05) : Color.black.opacity(0.03))
                            .frame(width: 36, height: 36)

                        Image(systemName: "globe")
                            .font(.system(size: 16))
                            .foregroundStyle(isDark ? Color.white.opacity(0.4) : Color(hex: "94a3b8"))
                    }
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
    }

    // MARK: - Notifications Section (TODO: Uncomment when ready)
    /*
    private var notificationsSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                SettingsSectionIcon(
                    icon: "bell.fill",
                    gradient: [Color(hex: "f59e0b"), Color(hex: "d97706")]
                )

                Text("Notifications")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                    .tracking(-0.3)
            }

            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Push Notifications")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))

                    Text("Get reminders and unlock alerts")
                        .font(.system(size: 13))
                        .foregroundStyle(isDark ? Color.white.opacity(0.5) : Color(hex: "94a3b8"))
                }

                Spacer()

                Toggle("", isOn: $notificationsEnabled)
                    .labelsHidden()
                    .tint(themeService.accentColor)
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
    */

    // MARK: - Password Section

    private var passwordSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                SettingsSectionIcon(
                    icon: "key.fill",
                    background: isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.05)
                )

                Text(L10n.Settings.changePassword)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                    .tracking(-0.3)
            }

            SecureField(L10n.Settings.enterNewPassword, text: $newPassword)
                .padding(18)
                .background(
                    RoundedRectangle(cornerRadius: 18)
                        .fill(isDark ? Color.white.opacity(0.03) : .white)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 18)
                        .stroke(isDark ? Color.white.opacity(0.06) : Color.black.opacity(0.03), lineWidth: 0.5)
                )
        }
    }

    // MARK: - Save Button

    private var saveButton: some View {
        Button {
            saveSettings()
        } label: {
            Text(L10n.Settings.saveChanges)
                .font(.system(size: 17, weight: .bold))
                .tracking(0.3)
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 18)
                .background(
                    LinearGradient(
                        colors: [themeService.accentColor, themeService.accentColorDark],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .clipShape(RoundedRectangle(cornerRadius: 18))
                .shadow(color: themeService.accentColor.opacity(0.3), radius: 20, y: 8)
        }
    }

    // MARK: - Danger Zone Section

    private var dangerZoneSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(L10n.Settings.dangerZone)
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(Color(hex: "ef4444"))
                .tracking(0.5)

            // Delete Account Button
            Button {
                showDeleteAccountAlert = true
            } label: {
                Text(L10n.Settings.deleteAccount)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(Color(hex: "ef4444"))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
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
        }
        .padding(.top, 12)
    }

    // MARK: - Actions

    private func saveSettings() {
        // Save password if changed
        if !newPassword.isEmpty {
            // Call API to update password
        }
        dismiss()
    }

    private func deleteAccount() {
        isDeleting = true
        // Call API to delete account
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            isDeleting = false
            authService.signOut()
            dismiss()
        }
    }
}

// MARK: - Settings Section Icon

struct SettingsSectionIcon: View {
    let icon: String
    var gradient: [Color]? = nil
    var background: Color? = nil

    @Environment(\.colorScheme) private var colorScheme
    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        ZStack {
            if let gradient = gradient {
                LinearGradient(colors: gradient, startPoint: .topLeading, endPoint: .bottomTrailing)
            } else if let background = background {
                background
            }

            Image(systemName: icon)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(gradient != nil ? .white : (isDark ? .white : Color(hex: "0f172a")))
        }
        .frame(width: 32, height: 32)
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .padding(.trailing, 10)
    }
}

// MARK: - Language Selector View

struct LanguageSelectorView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    var localizationService: LocalizationService

    @State private var showRestartAlert = false

    private var isDark: Bool { colorScheme == .dark }
    private let blueAccent = Color(hex: "3b82f6")

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Current Language
                VStack(alignment: .leading, spacing: 4) {
                    Text(L10n.Settings.currentLanguage.uppercased())
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(isDark ? Color.white.opacity(0.5) : Color(hex: "6b7280"))
                        .tracking(0.5)

                    Text(localizationService.currentLanguage.nativeName)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(isDark ? .white : Color(hex: "111827"))
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(16)
                .background(isDark ? Color(hex: "374151") : Color.black.opacity(0.03))
                .padding(.horizontal, 20)
                .padding(.top, 16)
                .padding(.bottom, 16)

                // Language List
                ScrollView {
                    VStack(spacing: 8) {
                        ForEach(LocalizationService.availableLanguages) { language in
                            let isSelected = language.code == localizationService.currentLanguageCode

                            Button {
                                if !isSelected {
                                    localizationService.changeLanguage(to: language.code)
                                    showRestartAlert = true
                                }
                            } label: {
                                HStack(spacing: 12) {
                                    Text(language.flag)
                                        .font(.system(size: 28))

                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(language.nativeName)
                                            .font(.system(size: 16, weight: isSelected ? .semibold : .regular))
                                            .foregroundStyle(isDark ? .white : Color(hex: "111827"))

                                        Text(language.name)
                                            .font(.system(size: 13))
                                            .foregroundStyle(isDark ? Color.white.opacity(0.5) : Color(hex: "6b7280"))
                                    }

                                    Spacer()

                                    if isSelected {
                                        Image(systemName: "checkmark")
                                            .font(.system(size: 16, weight: .bold))
                                            .foregroundStyle(blueAccent)
                                    }
                                }
                                .padding(16)
                                .background(
                                    RoundedRectangle(cornerRadius: 12)
                                        .fill(isSelected
                                            ? (isDark ? blueAccent.opacity(0.2) : blueAccent.opacity(0.1))
                                            : .clear)
                                )
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 20)
                }
            }
            .background(isDark ? Color(hex: "1f2937") : .white)
            .navigationTitle(L10n.Settings.selectLanguage)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundStyle(isDark ? .white : Color(hex: "111827"))
                    }
                }
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
        .alert(L10n.Settings.restartRequired, isPresented: $showRestartAlert) {
            Button(L10n.Common.done) {
                dismiss()
            }
        } message: {
            Text(L10n.Settings.restartMessage)
        }
    }
}

// MARK: - Screen Time Stat Card

struct ScreenTimeStatCard: View {
    let icon: String
    let value: String
    let label: String
    let color: Color
    let isDark: Bool

    var body: some View {
        VStack(spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(color)

                Text(value)
                    .font(.system(size: 22, weight: .bold, design: .rounded))
                    .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
            }

            Text(label.uppercased())
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(isDark ? Color.white.opacity(0.4) : Color(hex: "94a3b8"))
                .tracking(0.5)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(color.opacity(isDark ? 0.15 : 0.1))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(color.opacity(0.2), lineWidth: 0.5)
        )
    }
}

// MARK: - Custom App Row (for cached data)

struct CustomAppRow: View {
    let app: CachedAppUsage
    let maxDuration: TimeInterval
    let index: Int
    let isLast: Bool
    let isDark: Bool

    private var progress: CGFloat {
        CGFloat(app.duration / maxDuration)
    }

    private var barColor: Color {
        let colors: [Color] = [
            Color(red: 239/255, green: 68/255, blue: 68/255),   // Red
            Color(red: 245/255, green: 158/255, blue: 11/255),  // Orange
            Color(red: 59/255, green: 130/255, blue: 246/255),  // Blue
            Color(red: 168/255, green: 85/255, blue: 247/255),  // Purple
            Color(red: 236/255, green: 72/255, blue: 153/255),  // Pink
        ]
        return colors[index % colors.count]
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 10) {
                // App Icon placeholder with color
                ZStack {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(app.iconColor.opacity(0.15))
                        .frame(width: 36, height: 36)

                    Text(String(app.appName.prefix(1)).uppercased())
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(app.iconColor)
                }

                // App Name + Progress
                VStack(alignment: .leading, spacing: 4) {
                    Text(app.appName)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                        .lineLimit(1)

                    GeometryReader { geometry in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 2)
                                .fill(isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.06))
                                .frame(height: 4)

                            RoundedRectangle(cornerRadius: 2)
                                .fill(barColor)
                                .frame(width: geometry.size.width * progress, height: 4)
                        }
                    }
                    .frame(height: 4)
                }

                // Duration
                Text(app.formattedDuration)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(isDark ? Color.white.opacity(0.5) : Color(hex: "64748b"))
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)

            if !isLast {
                Rectangle()
                    .fill(isDark ? Color.white.opacity(0.06) : Color.black.opacity(0.03))
                    .frame(height: 0.5)
                    .padding(.leading, 58)
            }
        }
    }
}

#Preview {
    FullSettingsView()
        .environment(ThemeService())
        .environment(AuthService())
        .environment(BlockingService())
}
