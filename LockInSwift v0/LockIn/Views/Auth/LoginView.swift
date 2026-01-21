import SwiftUI
import AuthenticationServices

struct LoginView: View {
    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService
    @Environment(AuthService.self) private var authService

    @State private var showEmailAuth = false

    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        ZStack {
            // Background
            LinearGradient(
                colors: [
                    themeService.accentColor.opacity(0.15),
                    Color.appBackground
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 32) {
                Spacer()

                // Logo and Title
                VStack(spacing: 20) {
                    ZStack {
                        Circle()
                            .fill(themeService.primaryGradient)
                            .frame(width: 100, height: 100)

                        Image(systemName: "hand.raised.fill")
                            .font(.system(size: 45))
                            .foregroundStyle(.white)
                    }
                    .shadow(color: themeService.accentColor.opacity(0.3), radius: 20)

                    VStack(spacing: 8) {
                        Text("LockIn")
                            .font(.system(size: 36, weight: .bold))
                            .foregroundStyle(isDark ? .white : .black)

                        Text("Take control of your screen time")
                            .font(.system(size: 16))
                            .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                // Auth Buttons
                VStack(spacing: 16) {
                    // Sign in with Apple
                    SignInWithAppleButton(.signIn) { request in
                        request.requestedScopes = [.email, .fullName]
                    } onCompletion: { result in
                        switch result {
                        case .success(let authorization):
                            Task {
                                await authService.signInWithApple(authorization: authorization)
                            }
                        case .failure(let error):
                            print("Apple Sign In failed: \(error)")
                        }
                    }
                    .signInWithAppleButtonStyle(isDark ? .white : .black)
                    .frame(height: 56)
                    .clipShape(RoundedRectangle(cornerRadius: 14))

                    // Sign in with Google (placeholder)
                    Button {
                        Task {
                            await authService.signInWithGoogle()
                        }
                    } label: {
                        HStack(spacing: 12) {
                            Image(systemName: "g.circle.fill")
                                .font(.system(size: 22))
                            Text("Continue with Google")
                                .font(.system(size: 17, weight: .medium))
                        }
                        .foregroundStyle(isDark ? .white : .black)
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(
                            RoundedRectangle(cornerRadius: 14)
                                .stroke(Color.secondary.opacity(0.3), lineWidth: 1)
                                .background(
                                    RoundedRectangle(cornerRadius: 14)
                                        .fill(isDark ? Color.white.opacity(0.05) : .white)
                                )
                        )
                    }

                    // Divider
                    HStack {
                        Rectangle()
                            .fill(Color.secondary.opacity(0.3))
                            .frame(height: 1)
                        Text("or")
                            .font(.system(size: 14))
                            .foregroundStyle(.secondary)
                            .padding(.horizontal, 16)
                        Rectangle()
                            .fill(Color.secondary.opacity(0.3))
                            .frame(height: 1)
                    }
                    .padding(.vertical, 8)

                    // Email Sign In
                    Button {
                        showEmailAuth = true
                    } label: {
                        HStack(spacing: 12) {
                            Image(systemName: "envelope.fill")
                                .font(.system(size: 20))
                            Text("Continue with Email")
                                .font(.system(size: 17, weight: .medium))
                        }
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(themeService.primaryGradient)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                    }
                }
                .padding(.horizontal, 20)

                // Terms
                Text("By continuing, you agree to our Terms of Service and Privacy Policy")
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
                    .padding(.bottom, 20)
            }
        }
        .sheet(isPresented: $showEmailAuth) {
            EmailAuthView()
        }
    }
}

// MARK: - Email Auth View

struct EmailAuthView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @Environment(ThemeService.self) private var themeService
    @Environment(AuthService.self) private var authService

    @State private var isSignUp = false
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var isLoading = false
    @State private var errorMessage: String?

    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Toggle Sign In / Sign Up
                    Picker("", selection: $isSignUp) {
                        Text("Sign In").tag(false)
                        Text("Sign Up").tag(true)
                    }
                    .pickerStyle(.segmented)
                    .padding(.top, 20)

                    // Form Fields
                    VStack(spacing: 16) {
                        // Email
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Email")
                                .font(.system(size: 14, weight: .medium))
                                .foregroundStyle(.secondary)

                            TextField("your@email.com", text: $email)
                                .textContentType(.emailAddress)
                                .keyboardType(.emailAddress)
                                .autocapitalization(.none)
                                .padding(16)
                                .background(Color.appSecondaryBackground)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                        }

                        // Password
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Password")
                                .font(.system(size: 14, weight: .medium))
                                .foregroundStyle(.secondary)

                            SecureField("Enter password", text: $password)
                                .textContentType(isSignUp ? .newPassword : .password)
                                .padding(16)
                                .background(Color.appSecondaryBackground)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                        }

                        // Confirm Password (Sign Up only)
                        if isSignUp {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Confirm Password")
                                    .font(.system(size: 14, weight: .medium))
                                    .foregroundStyle(.secondary)

                                SecureField("Confirm password", text: $confirmPassword)
                                    .textContentType(.newPassword)
                                    .padding(16)
                                    .background(Color.appSecondaryBackground)
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                        }
                    }

                    // Error Message
                    if let error = errorMessage {
                        Text(error)
                            .font(.system(size: 14))
                            .foregroundStyle(.red)
                            .multilineTextAlignment(.center)
                    }

                    // Submit Button
                    Button {
                        Task {
                            await submitForm()
                        }
                    } label: {
                        HStack {
                            if isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            } else {
                                Text(isSignUp ? "Create Account" : "Sign In")
                                    .font(.system(size: 17, weight: .semibold))
                            }
                        }
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(themeService.primaryGradient)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                    }
                    .disabled(isLoading || !isFormValid)
                    .opacity(isFormValid ? 1 : 0.5)

                    // Forgot Password
                    if !isSignUp {
                        Button {
                            // Handle forgot password
                        } label: {
                            Text("Forgot Password?")
                                .font(.system(size: 15, weight: .medium))
                                .foregroundStyle(themeService.accentColor)
                        }
                    }
                }
                .padding(.horizontal, 20)
            }
            .navigationTitle(isSignUp ? "Create Account" : "Sign In")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }

    private var isFormValid: Bool {
        let emailValid = email.contains("@") && email.contains(".")
        let passwordValid = password.count >= 6

        if isSignUp {
            return emailValid && passwordValid && password == confirmPassword
        }
        return emailValid && passwordValid
    }

    private func submitForm() async {
        isLoading = true
        errorMessage = nil

        let success: Bool
        if isSignUp {
            success = await authService.signUp(email: email, password: password)
        } else {
            success = await authService.signIn(email: email, password: password)
        }

        isLoading = false

        if success {
            dismiss()
        } else {
            errorMessage = authService.error ?? "An error occurred"
        }
    }
}

#Preview {
    LoginView()
        .environment(ThemeService())
        .environment(AuthService())
}
