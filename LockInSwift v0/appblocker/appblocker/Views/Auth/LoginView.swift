import SwiftUI
import AuthenticationServices

/// Email/password login/register screen - matches RN login.tsx exactly
struct LoginView: View {
    @Binding var isPresented: Bool
    @Binding var isNewUser: Bool

    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService
    @Environment(AuthService.self) private var authService
    @FocusState private var focusedField: Field?

    @State private var email = ""
    @State private var password = ""
    @State private var showPassword = false
    @State private var agreeToTerms = false
    @State private var isLoading = false
    @State private var googleLoading = false
    @State private var appleLoading = false
    @State private var errorMessage: String?

    private var isDark: Bool { colorScheme == .dark }

    enum Field: Hashable {
        case email, password
    }

    var body: some View {
        ThemedBackground(intensity: .strong) {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    // Header with back button
                    headerSection
                        .padding(.top, 12)
                        .padding(.horizontal, 20)
                        .padding(.bottom, 32)

                    // Form
                    formSection
                        .padding(.horizontal, 20)
                }
            }
        }
        .scrollDismissesKeyboard(.interactively)
    }

    // MARK: - Header Section

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Back button
            Button {
                isPresented = false
            } label: {
                Image(systemName: "arrow.left")
                    .font(.system(size: 22, weight: .regular))
                    .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                    .frame(width: 44, height: 44)
                    .background(
                        RoundedRectangle(cornerRadius: 14)
                            .fill(isDark ? Color.white.opacity(0.05) : .white)
                            .overlay(
                                RoundedRectangle(cornerRadius: 14)
                                    .stroke(
                                        isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.06),
                                        lineWidth: 0.5
                                    )
                            )
                            .shadow(color: .black.opacity(isDark ? 0 : 0.04), radius: 8, y: 2)
                    )
            }
            .padding(.bottom, 28)

            // Title
            Text(isNewUser ? L10n.Auth.createAccount : L10n.Auth.welcomeBack)
                .font(.system(size: 32, weight: .heavy))
                .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                .tracking(-0.5)
                .padding(.bottom, 10)

            // Subtitle
            Text(isNewUser ? L10n.Auth.startTakingControl : L10n.Auth.goalsWaiting)
                .font(.system(size: 15))
                .foregroundStyle(isDark ? .white.opacity(0.5) : Color(hex: "64748b"))
                .lineSpacing(4)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Form Section

    private var formSection: some View {
        VStack(spacing: 0) {
            // Email Input
            inputField(
                label: L10n.Auth.email,
                icon: "envelope.fill",
                placeholder: "your@email.com",
                text: $email,
                isSecure: false,
                field: .email
            )
            .padding(.bottom, 16)

            // Password Input
            passwordField
                .padding(.bottom, 20)

            // Terms checkbox (register only)
            if isNewUser {
                termsCheckbox
                    .padding(.bottom, 24)
            }

            // Error message
            if let error = errorMessage {
                Text(error)
                    .font(.system(size: 14))
                    .foregroundStyle(.red)
                    .padding(.bottom, 16)
            }

            // Submit Button
            submitButton
                .padding(.bottom, 24)

            // Divider
            divider
                .padding(.bottom, 24)

            // Social Login Buttons
            socialLoginButtons
                .padding(.bottom, 32)

            // Toggle mode
            toggleModeSection
                .padding(.bottom, 32)
        }
    }

    // MARK: - Input Field

    private func inputField(
        label: String,
        icon: String,
        placeholder: String,
        text: Binding<String>,
        isSecure: Bool,
        field: Field
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(isDark ? .white.opacity(0.7) : Color(hex: "374151"))

            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundStyle(isDark ? .white.opacity(0.4) : Color(hex: "94a3b8"))
                    .frame(width: 20)

                if isSecure {
                    SecureField(placeholder, text: text)
                        .font(.system(size: 16))
                        .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                        .focused($focusedField, equals: field)
                } else {
                    TextField(placeholder, text: text)
                        .font(.system(size: 16))
                        .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .keyboardType(.emailAddress)
                        .focused($focusedField, equals: field)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(isDark ? Color.white.opacity(0.03) : .white)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(
                                isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.08),
                                lineWidth: 0.5
                            )
                    )
                    .shadow(color: .black.opacity(isDark ? 0 : 0.03), radius: 8, y: 2)
            )
        }
    }

    // MARK: - Password Field

    private var passwordField: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(L10n.Auth.password)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(isDark ? .white.opacity(0.7) : Color(hex: "374151"))

            HStack(spacing: 12) {
                Image(systemName: "lock.fill")
                    .font(.system(size: 20))
                    .foregroundStyle(isDark ? .white.opacity(0.4) : Color(hex: "94a3b8"))
                    .frame(width: 20)

                if showPassword {
                    TextField(L10n.Auth.enterPassword, text: $password)
                        .font(.system(size: 16))
                        .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                        .focused($focusedField, equals: .password)
                } else {
                    SecureField(L10n.Auth.enterPassword, text: $password)
                        .font(.system(size: 16))
                        .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                        .focused($focusedField, equals: .password)
                }

                Button {
                    showPassword.toggle()
                } label: {
                    Image(systemName: showPassword ? "eye.slash.fill" : "eye.fill")
                        .font(.system(size: 20))
                        .foregroundStyle(isDark ? .white.opacity(0.4) : Color(hex: "94a3b8"))
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(isDark ? Color.white.opacity(0.03) : .white)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(
                                isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.08),
                                lineWidth: 0.5
                            )
                    )
                    .shadow(color: .black.opacity(isDark ? 0 : 0.03), radius: 8, y: 2)
            )
        }
    }

    // MARK: - Terms Checkbox

    private var termsCheckbox: some View {
        Button {
            agreeToTerms.toggle()
        } label: {
            HStack(alignment: .top, spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 7)
                        .fill(agreeToTerms
                            ? LinearGradient(
                                colors: [Color(hex: "3b82f6"), Color(hex: "1d4ed8")],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                            : LinearGradient(
                                colors: [Color.clear, Color.clear],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 7)
                                .stroke(
                                    agreeToTerms ? Color.clear : (isDark ? Color.white.opacity(0.2) : Color(hex: "cbd5e1")),
                                    lineWidth: 1.5
                                )
                        )

                    if agreeToTerms {
                        Image(systemName: "checkmark")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(.white)
                    }
                }
                .frame(width: 22, height: 22)

                Group {
                    Text(L10n.Auth.agreeToTerms)
                        .foregroundStyle(isDark ? .white.opacity(0.6) : Color(hex: "64748b"))
                    + Text(L10n.Auth.termsConditions)
                        .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                        .fontWeight(.semibold)
                }
                .font(.system(size: 14))
                .lineSpacing(4)
                .multilineTextAlignment(.leading)
            }
        }
        .buttonStyle(.plain)
    }

    // MARK: - Submit Button

    private var submitButton: some View {
        Button {
            handleSubmit()
        } label: {
            ZStack {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                } else {
                    Text(isNewUser ? L10n.Auth.createAccount : L10n.Auth.signIn)
                        .font(.system(size: 17, weight: .bold))
                        .foregroundStyle(.white)
                        .tracking(0.3)
                }
            }
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
        .disabled(isLoading || !isFormValid)
        .opacity(isFormValid ? 1 : 0.6)
    }

    // MARK: - Divider

    private var divider: some View {
        HStack(spacing: 16) {
            Rectangle()
                .fill(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.06))
                .frame(height: 1)

            Text(L10n.Auth.orContinueWith)
                .font(.system(size: 13))
                .foregroundStyle(isDark ? .white.opacity(0.4) : Color(hex: "94a3b8"))

            Rectangle()
                .fill(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.06))
                .frame(height: 1)
        }
    }

    // MARK: - Social Login Buttons

    private var socialLoginButtons: some View {
        HStack(spacing: 16) {
            // Google
            Button {
                handleGoogleAuth()
            } label: {
                ZStack {
                    if googleLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: isDark ? .white : Color(hex: "0f172a")))
                    } else {
                        Image("GoogleLogo")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 24, height: 24)
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 56)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(isDark ? Color.white.opacity(0.03) : .white)
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(
                                    isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.08),
                                    lineWidth: 0.5
                                )
                        )
                        .shadow(color: .black.opacity(isDark ? 0 : 0.03), radius: 8, y: 2)
                )
            }
            .disabled(googleLoading)

            // Apple
            SignInWithAppleButton(.signIn) { request in
                print("🍎 Apple button tapped - configuring request")
                request.requestedScopes = [.email, .fullName]
            } onCompletion: { result in
                print("🍎 Apple onCompletion called")
                handleAppleAuth(result: result)
            }
            .signInWithAppleButtonStyle(isDark ? .white : .black)
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .cornerRadius(16)
        }
    }

    // MARK: - Toggle Mode Section

    private var toggleModeSection: some View {
        HStack(spacing: 4) {
            Text(isNewUser ? L10n.Auth.haveAccount : L10n.Auth.noAccount)
                .font(.system(size: 15))
                .foregroundStyle(isDark ? .white.opacity(0.5) : Color(hex: "64748b"))

            Button {
                withAnimation {
                    isNewUser.toggle()
                }
            } label: {
                Text(isNewUser ? L10n.Auth.signIn : L10n.Auth.signUp)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(Color(hex: "3b82f6"))
            }
        }
    }

    // MARK: - Validation

    private var isFormValid: Bool {
        let emailValid = email.contains("@") && email.contains(".")
        let passwordValid = password.count >= 4

        if isNewUser {
            return emailValid && passwordValid && agreeToTerms
        }
        return emailValid && passwordValid
    }

    // MARK: - Handlers

    private func handleSubmit() {
        guard !isLoading else { return }
        isLoading = true
        errorMessage = nil

        Task {
            let success: Bool
            if isNewUser {
                // Use email username as name for registration
                let name = email.components(separatedBy: "@").first ?? "User"
                success = await authService.signUp(name: name, email: email, password: password)
            } else {
                success = await authService.signIn(email: email, password: password)
            }

            await MainActor.run {
                isLoading = false
                if success {
                    isPresented = false
                } else {
                    errorMessage = authService.error ?? "An error occurred"
                }
            }
        }
    }

    private func handleGoogleAuth() {
        guard !googleLoading else { return }
        googleLoading = true

        Task {
            let success = await authService.startGoogleSignIn()
            await MainActor.run {
                googleLoading = false
                if success {
                    isPresented = false
                } else if let error = authService.error {
                    errorMessage = error
                }
            }
        }
    }

    private func handleAppleAuth(result: Result<ASAuthorization, Error>) {
        print("🍎 handleAppleAuth called")
        switch result {
        case .success(let authorization):
            print("🍎 Apple auth SUCCESS - got authorization")
            appleLoading = true
            Task {
                let success = await authService.signInWithApple(authorization: authorization)
                print("🍎 authService.signInWithApple returned: \(success)")
                await MainActor.run {
                    appleLoading = false
                    if success {
                        print("🍎 Success! Dismissing view")
                        isPresented = false
                    } else if let error = authService.error {
                        print("🍎 Error from authService: \(error)")
                        errorMessage = error
                    }
                }
            }
        case .failure(let error):
            print("🍎 Apple auth FAILURE: \(error)")
            if (error as NSError).code != ASAuthorizationError.canceled.rawValue {
                errorMessage = "Apple Sign-In failed: \(error.localizedDescription)"
            }
        }
    }
}

#Preview {
    LoginView(isPresented: .constant(true), isNewUser: .constant(true))
        .environment(ThemeService())
        .environment(AuthService())
}
