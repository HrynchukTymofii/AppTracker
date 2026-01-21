import SwiftUI

struct MainTabView: View {
    @Environment(ThemeService.self) private var themeService
    @Environment(TimeBankService.self) private var timeBank
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }
                .tag(0)

            StatsView()
                .tabItem {
                    Label("Stats", systemImage: "chart.bar.fill")
                }
                .tag(1)

            BlockingView()
                .tabItem {
                    Label("Blocking", systemImage: "hand.raised.fill")
                }
                .tag(2)

            LockInView()
                .tabItem {
                    Label("LockIn", systemImage: "target")
                }
                .tag(3)

            DetoxView()
                .tabItem {
                    Label("Detox", systemImage: "leaf.fill")
                }
                .tag(4)

            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.fill")
                }
                .tag(5)
        }
    }
}

#Preview {
    MainTabView()
        .environment(ThemeService())
        .environment(TimeBankService())
        .environment(BlockingService())
        .environment(StatsService())
        .environment(AuthService())
}
