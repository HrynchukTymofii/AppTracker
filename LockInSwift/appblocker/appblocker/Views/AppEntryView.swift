import SwiftUI
import RevenueCat

/// Main entry view that coordinates the complete onboarding flow:
/// 1. SellingOnboardingView (15-step selling flow) - includes permissions
/// 2. AuthLandingView (social login options)
/// 3. LoginView (email/password form)
/// 4. Main App (TabView)
struct AppEntryView: View {
    @Environment(AuthService.self) private var authService
    @Environment(BlockingService.self) private var blockingService
    @Environment(ThemeService.self) private var themeService
    @Environment(PurchaseService.self) private var purchaseService

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
        .onChange(of: authService.isAuthenticated) { oldValue, newValue in
            Task {
                if newValue {
                    // User logged in - fetch RevenueCat userId from server and link
                    await syncRevenueCatUser()
                } else if oldValue {
                    // User logged out - reset RevenueCat to anonymous
                    await purchaseService.logout()
                    print("✅ RevenueCat: Logged out")
                }
            }
        }
        .task {
            // On app launch, if user is already logged in, sync with RevenueCat
            if authService.isAuthenticated {
                await syncRevenueCatUser()
            }
        }
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

    /// Fetch RevenueCat userId from server and sync with RevenueCat
    private func syncRevenueCatUser() async {
        // Fetch the RevenueCat userId from our backend
        guard let rcUserId = await authService.fetchRevenueCatUserId() else {
            print("⚠️ RevenueCat: Could not fetch userId from server")
            return
        }

        // Check if already logged in with this userId
        do {
            let customerInfo = try await Purchases.shared.customerInfo()
            if customerInfo.originalAppUserId == rcUserId {
                print("✅ RevenueCat: Already logged in with correct userId: \(rcUserId)")
                return
            }
        } catch {
            print("⚠️ RevenueCat: Could not get customer info: \(error)")
        }

        // Login with the server's userId
        await purchaseService.login(userId: rcUserId)
        print("✅ RevenueCat: Logged in with server userId: \(rcUserId)")
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
        .environment(PurchaseService())
}

#Preview("Simple Flow") {
    SimpleOnboardingCoordinator()
        .environment(AuthService())
        .environment(BlockingService())
        .environment(ThemeService())
}
