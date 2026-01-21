import SwiftUI
import AuthenticationServices

/// Auth landing screen - matches RN auth.tsx exactly
/// Shows orb, Google/Apple/Email options, Get Started, I already have account
struct AuthLandingView: View {
    @Binding var showLogin: Bool
    @Binding var isNewUser: Bool

    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService
    @Environment(AuthService.self) private var authService

    @State private var googleLoading = false
    @State private var appleLoading = false
    @State private var showError = false
    @State private var errorMessage = ""

    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        ThemedBackground(intensity: .strong) {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    Spacer()
                        .frame(height: 30)

                    // Logo Section with Animated Orb
                    logoSection
                        .padding(.bottom, 48)

                    // Auth Options
                    authOptionsSection
                        .padding(.horizontal, 24)
                        .padding(.bottom, 32)

                    // Get Started Button
                    getStartedButton
                        .padding(.horizontal, 24)
                        .padding(.bottom, 12)

                    // I already have an account
                    alreadyHaveAccountButton
                        .padding(.horizontal, 24)
                        .padding(.bottom, 40)

                    // Footer Links
                    footerLinks
                        .padding(.bottom, 32)

                    Spacer()
                }
                .frame(minHeight: UIScreen.main.bounds.height)
            }
        }
        .alert(L10n.Common.error, isPresented: $showError) {
            Button(L10n.Paywall.ok) { showError = false }
        } message: {
            Text(errorMessage)
        }
    }

    // MARK: - Logo Section

    private var logoSection: some View {
        VStack(spacing: 32) {
            AnimatedOrbView(size: 120, level: 3)

            VStack(spacing: 10) {
                Text(L10n.Auth.welcomeTo)
                    .font(.system(size: 32, weight: .heavy))
                    .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                    .tracking(-0.5)

                Text(L10n.Auth.takeControl)
                    .font(.system(size: 15))
                    .foregroundStyle(isDark ? .white.opacity(0.5) : Color(hex: "64748b"))
            }
        }
    }

    // MARK: - Auth Options

    private var authOptionsSection: some View {
        VStack(spacing: 12) {
            // Google
            AuthOptionButton(
                iconImage: Image("GoogleLogo"),
                title: L10n.Auth.continueGoogle,
                isLoading: googleLoading,
                isDark: isDark
            ) {
                handleGoogleAuth()
            }

            // Apple - using SignInWithAppleButton
            SignInWithAppleButton(.continue) { request in
                request.requestedScopes = [.fullName, .email]
            } onCompletion: { result in
                handleAppleAuth(result: result)
            }
            .signInWithAppleButtonStyle(isDark ? .white : .black)
            .frame(height: 56)
            .clipShape(RoundedRectangle(cornerRadius: 18))

            // Email
            AuthOptionButton(
                systemIcon: "envelope.fill",
                title: L10n.Auth.continueEmail,
                isLoading: false,
                isDark: isDark
            ) {
                isNewUser = true
                showLogin = true
            }
        }
    }

    // MARK: - Get Started Button

    private var getStartedButton: some View {
        Button {
            isNewUser = true
            showLogin = true
        } label: {
            Text(L10n.Auth.getStarted)
                .font(.system(size: 17, weight: .bold))
                .foregroundStyle(.white)
                .tracking(0.3)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 18)
                .background(
                    LinearGradient(
                        colors: [Color(hex: "3b82f6"), Color(hex: "1d4ed8")],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .clipShape(RoundedRectangle(cornerRadius: 18))
                .shadow(color: Color(hex: "3b82f6").opacity(0.3), radius: 20, y: 8)
        }
    }

    // MARK: - Already Have Account Button

    private var alreadyHaveAccountButton: some View {
        Button {
            isNewUser = false
            showLogin = true
        } label: {
            Text(L10n.Auth.alreadyHaveAccount)
                .font(.system(size: 17, weight: .bold))
                .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                .tracking(0.3)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 18)
                .background(
                    RoundedRectangle(cornerRadius: 18)
                        .fill(isDark ? Color.white.opacity(0.05) : .white)
                        .overlay(
                            RoundedRectangle(cornerRadius: 18)
                                .stroke(
                                    isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.08),
                                    lineWidth: 0.5
                                )
                        )
                        .shadow(color: .black.opacity(isDark ? 0 : 0.04), radius: 12, y: 4)
                )
        }
    }

    // MARK: - Footer Links

    private var footerLinks: some View {
        HStack(spacing: 12) {
            Button {
                if let url = URL(string: "https://www.fibipals.com/creator/apps/lockIn/privacy-policy") {
                    UIApplication.shared.open(url)
                }
            } label: {
                Text(L10n.Auth.privacyPolicy)
                    .font(.system(size: 13))
                    .foregroundStyle(isDark ? .white.opacity(0.4) : Color(hex: "94a3b8"))
            }

            Text("•")
                .foregroundStyle(isDark ? .white.opacity(0.2) : Color(hex: "cbd5e1"))

            Button {
                if let url = URL(string: "https://www.fibipals.com/creator/apps/lockIn/terms-of-service") {
                    UIApplication.shared.open(url)
                }
            } label: {
                Text(L10n.Auth.termsOfService)
                    .font(.system(size: 13))
                    .foregroundStyle(isDark ? .white.opacity(0.4) : Color(hex: "94a3b8"))
            }
        }
    }

    // MARK: - Auth Handlers

    private func handleGoogleAuth() {
        guard !googleLoading else { return }
        googleLoading = true

        Task {
            let success = await authService.startGoogleSignIn()
            await MainActor.run {
                googleLoading = false
                if !success, let error = authService.error {
                    errorMessage = error
                    showError = true
                }
            }
        }
    }

    private func handleAppleAuth(result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let authorization):
            appleLoading = true
            Task {
                let success = await authService.signInWithApple(authorization: authorization)
                await MainActor.run {
                    appleLoading = false
                    if !success, let error = authService.error {
                        errorMessage = error
                        showError = true
                    }
                }
            }
        case .failure(let error):
            if (error as NSError).code != ASAuthorizationError.canceled.rawValue {
                errorMessage = "Apple Sign-In failed: \(error.localizedDescription)"
                showError = true
            }
        }
    }
}

// MARK: - Auth Option Button

struct AuthOptionButton: View {
    var iconImage: Image?
    var systemIcon: String?
    let title: String
    let isLoading: Bool
    let isDark: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: isDark ? .white : Color(hex: "0f172a")))
                        .frame(width: 24, height: 24)
                } else if let iconImage = iconImage {
                    iconImage
                        .resizable()
                        .scaledToFit()
                        .frame(width: 24, height: 24)
                } else if let systemIcon = systemIcon {
                    Image(systemName: systemIcon)
                        .font(.system(size: 24))
                        .foregroundStyle(isDark ? .white : Color(hex: "64748b"))
                        .frame(width: 24, height: 24)
                }

                Text(title)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(isDark ? .white.opacity(0.3) : Color(hex: "cbd5e1"))
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 18)
            .background(
                RoundedRectangle(cornerRadius: 18)
                    .fill(isDark ? Color.white.opacity(0.03) : .white)
                    .overlay(
                        RoundedRectangle(cornerRadius: 18)
                            .stroke(
                                isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.06),
                                lineWidth: 0.5
                            )
                    )
                    .shadow(color: .black.opacity(isDark ? 0 : 0.04), radius: 12, y: 4)
            )
        }
        .disabled(isLoading)
    }
}

#Preview {
    AuthLandingView(showLogin: .constant(false), isNewUser: .constant(true))
        .environment(ThemeService())
        .environment(AuthService())
}
