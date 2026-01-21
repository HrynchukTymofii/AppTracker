import SwiftUI
import SwiftData

@main
struct LockInApp: App {
    // Services
    @State private var authService = AuthService()
    @State private var timeBankService = TimeBankService()
    @State private var blockingService = BlockingService()
    @State private var statsService = StatsService()
    @State private var themeService = ThemeService()

    // App state
    @State private var hasCompletedOnboarding = UserDefaults.standard.bool(forKey: "hasCompletedOnboarding")
    @State private var isAuthenticated = false

    var body: some Scene {
        WindowGroup {
            Group {
                if !hasCompletedOnboarding {
                    OnboardingView(hasCompletedOnboarding: $hasCompletedOnboarding)
                } else if !isAuthenticated && !authService.isLoggedIn {
                    LoginView()
                } else {
                    MainTabView()
                }
            }
            .environment(authService)
            .environment(timeBankService)
            .environment(blockingService)
            .environment(statsService)
            .environment(themeService)
            .preferredColorScheme(themeService.colorScheme)
            .tint(themeService.accentColor)
            .onAppear {
                isAuthenticated = authService.isLoggedIn
            }
        }
        .modelContainer(for: [
            BlockedApp.self,
            UnblockSchedule.self,
            TimeTransaction.self,
            ExerciseTask.self,
            UsageRecord.self,
            Achievement.self
        ])
    }
}
