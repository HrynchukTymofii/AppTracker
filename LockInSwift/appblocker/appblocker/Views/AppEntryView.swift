import SwiftUI

/// Main entry view that coordinates the complete onboarding flow:
/// 1. SellingOnboardingView (15-step selling flow) - includes permissions
/// 2. AuthLandingView (social login options)
/// 3. LoginView (email/password form)
/// 4. Main App (TabView)
struct AppEntryView: View {
    @Environment(AuthService.self) private var authService
    @Environment(BlockingService.self) private var blockingService
    @Environment(ThemeService.self) private var themeService

    @AppStorage("hasCompletedSellingOnboarding") private var hasCompletedSellingOnboarding = false

    @State private var showLogin = false
    @State private var isNewUser = true

    var body: some View {
        ZStack {
            if !hasCompletedSellingOnboarding {
                // Step 1: Selling onboarding (15 steps)
                SellingOnboardingView(isCompleted: $hasCompletedSellingOnboarding)
                    .transition(.opacity)
            } else if !authService.isAuthenticated {
                // Step 2 & 3: Auth flow
                authFlow
                    .transition(.opacity)
            } else {
                // Step 4: Main app
                MainTabView()
                    .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.3), value: authService.isAuthenticated)
        .animation(.easeInOut(duration: 0.3), value: hasCompletedSellingOnboarding)
    }

    @ViewBuilder
    private var authFlow: some View {
        if showLogin {
            LoginView(isPresented: $showLogin, isNewUser: $isNewUser)
                .transition(.move(edge: .trailing).combined(with: .opacity))
        } else {
            AuthLandingView(showLogin: $showLogin, isNewUser: $isNewUser)
                .transition(.opacity)
        }
    }
}

// MARK: - Alternative: Simple Onboarding Coordinator

/// A simpler coordinator that just uses the original OnboardingView
/// if you want to keep the existing flow
struct SimpleOnboardingCoordinator: View {
    @Environment(AuthService.self) private var authService
    @Environment(BlockingService.self) private var blockingService
    @Environment(ThemeService.self) private var themeService

    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding = false

    var body: some View {
        if !hasCompletedOnboarding {
            OnboardingView(hasCompletedOnboarding: $hasCompletedOnboarding)
        } else if !authService.isAuthenticated {
            AuthLandingView(
                showLogin: .constant(false),
                isNewUser: .constant(true)
            )
        } else {
            MainTabView()
        }
    }
}

#Preview("Full Flow") {
    AppEntryView()
        .environment(AuthService())
        .environment(BlockingService())
        .environment(ThemeService())
}

#Preview("Simple Flow") {
    SimpleOnboardingCoordinator()
        .environment(AuthService())
        .environment(BlockingService())
        .environment(ThemeService())
}
