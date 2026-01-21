import SwiftUI
import SwiftData
import GoogleSignIn
import UserNotifications
import UIKit

@main
struct LockInApp: App {
    // Services
    @State private var authService = AuthService()
    @State private var timeBankService = TimeBankService()
    @State private var blockingService = BlockingService()
    @State private var statsService = StatsService()
    @State private var themeService = ThemeService()
    @State private var purchaseService = PurchaseService()
    @State private var achievementService = AchievementService()
    @State private var localizationService = LocalizationService()
    @State private var exerciseFavoritesService = ExerciseFavoritesService()

    // Deep link navigation
    @State private var deepLinkTab: Int?
    @State private var showCoach: Bool = false

    init() {
        // Set up notification delegate for routing
        UNUserNotificationCenter.current().delegate = NotificationService.shared
    }

    var body: some Scene {
        WindowGroup {
            ThemeObserverWrapper(themeService: themeService) {
                AppEntryView()
            }
                .onReceive(NotificationCenter.default.publisher(for: .navigateToTab)) { notification in
                    if let tab = notification.userInfo?["tab"] as? Int {
                        print("📱 App received navigation request to tab: \(tab)")
                        deepLinkTab = tab
                    }
                }
                .onAppear {
                    // Check for pending navigation from notification (cold start)
                    checkPendingNavigation()
                }
                .onReceive(NotificationCenter.default.publisher(for: UIApplication.didBecomeActiveNotification)) { _ in
                    // Check for pending navigation when app becomes active (background -> foreground)
                    checkPendingNavigation()
                    // Also check for expired unlock window
                    blockingService.checkAndReapplyBlocking()
                }
                .onReceive(NotificationCenter.default.publisher(for: .forceReblock)) { _ in
                    // Force re-block when notification is received
                    print("LockInApp: Received forceReblock - calling blockingService.forceReblock()")
                    blockingService.forceReblock()
                }
                .environment(authService)
                .environment(timeBankService)
                .environment(blockingService)
                .environment(statsService)
                .environment(themeService)
                .environment(purchaseService)
                .environment(achievementService)
                .environment(localizationService)
                .environment(exerciseFavoritesService)
                .environment(\.deepLinkTab, $deepLinkTab)
                .environment(\.showCoach, $showCoach)
                .preferredColorScheme(themeService.colorScheme)
                .tint(themeService.accentColor)
                .onOpenURL { url in
                    handleDeepLink(url)
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

    private func checkPendingNavigation() {
        if let pendingTab = NotificationService.shared.consumePendingNavigation() {
            print("📱 App handling pending navigation to tab: \(pendingTab)")
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                deepLinkTab = pendingTab
            }
        }
    }

    private func handleDeepLink(_ url: URL) {
        // Handle Google Sign-In callback
        if authService.handleGoogleURL(url) {
            return
        }

        // Handle app deep links (support both "lockin" and "appblocker" schemes)
        guard url.scheme == "lockin" || url.scheme == "appblocker" else { return }

        switch url.host {
        case "earn":
            // Navigate to LockIn tab (tab 2)
            deepLinkTab = 2
        case "coach":
            // Open the Coach/AI chat (for earning bonus time from shield)
            showCoach = true
        case "blocking":
            // Navigate to Blocking tab (tab 1)
            deepLinkTab = 1
        case "stats":
            // Navigate to Stats tab (tab 3)
            deepLinkTab = 3
        case "profile":
            // Navigate to Profile tab (tab 4)
            deepLinkTab = 4
        case "home":
            // Navigate to Home tab (tab 0)
            deepLinkTab = 0
        case "reblock":
            // Force re-block apps (from Time's Up notification)
            print("LockInApp: Received reblock deep link - forcing re-block")
            NotificationCenter.default.post(name: .forceReblock, object: nil)
            deepLinkTab = 2 // Navigate to LockIn tab
        default:
            break
        }
    }
}

// MARK: - Environment Keys for Deep Linking

private struct DeepLinkTabKey: EnvironmentKey {
    static let defaultValue: Binding<Int?> = .constant(nil)
}

private struct ShowCoachKey: EnvironmentKey {
    static let defaultValue: Binding<Bool> = .constant(false)
}

extension EnvironmentValues {
    var deepLinkTab: Binding<Int?> {
        get { self[DeepLinkTabKey.self] }
        set { self[DeepLinkTabKey.self] = newValue }
    }

    var showCoach: Binding<Bool> {
        get { self[ShowCoachKey.self] }
        set { self[ShowCoachKey.self] = newValue }
    }
}

// MARK: - Theme Observer Wrapper

/// Wrapper view that observes system color scheme changes and updates ThemeService
/// This is needed because shield extensions can't detect system appearance directly
private struct ThemeObserverWrapper<Content: View>: View {
    let themeService: ThemeService
    @ViewBuilder let content: () -> Content
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        content()
            .onChange(of: colorScheme) { _, newValue in
                // Update resolved dark mode whenever system appearance changes
                themeService.updateResolvedDarkMode(systemIsDark: newValue == .dark)
            }
            .onAppear {
                // Update on first appear
                themeService.updateResolvedDarkMode(systemIsDark: colorScheme == .dark)
            }
    }
}
