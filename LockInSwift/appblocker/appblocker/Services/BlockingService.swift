import Foundation
import SwiftData
import Observation
import FamilyControls
import ManagedSettings
import DeviceActivity
import UIKit

/// Tracks an active usage session for per-minute time deduction
struct UsageSession: Codable {
    let appName: String
    let startTime: Date
    var isUsingEarnedTime: Bool
}

/// Codable schedule for persistence in app group (mirrors UnblockSchedule @Model)
struct CodableSchedule: Codable, Identifiable {
    let id: UUID
    var name: String
    var appIds: [String]
    var appTokens: [Data]
    var startTime: Date
    var endTime: Date
    var weekdays: [Int]
    var isActive: Bool
    var createdAt: Date

    init(
        id: UUID = UUID(),
        name: String,
        appIds: [String] = [],
        appTokens: [Data] = [],
        startTime: Date,
        endTime: Date,
        weekdays: [Int],
        isActive: Bool = true
    ) {
        self.id = id
        self.name = name
        self.appIds = appIds
        self.appTokens = appTokens
        self.startTime = startTime
        self.endTime = endTime
        self.weekdays = weekdays
        self.isActive = isActive
        self.createdAt = Date()
    }

    /// Convert from SwiftData model
    init(from model: UnblockSchedule) {
        self.id = model.id
        self.name = model.name
        self.appIds = model.appIds
        self.appTokens = model.appTokens
        self.startTime = model.startTime
        self.endTime = model.endTime
        self.weekdays = model.weekdays
        self.isActive = model.isActive
        self.createdAt = model.createdAt
    }

    var isCurrentlyActive: Bool {
        guard isActive else { return false }

        let now = Date()
        let calendar = Calendar.current
        let currentWeekday = calendar.component(.weekday, from: now)

        guard weekdays.contains(currentWeekday) else { return false }

        let currentTime = calendar.dateComponents([.hour, .minute], from: now)
        let startComponents = calendar.dateComponents([.hour, .minute], from: startTime)
        let endComponents = calendar.dateComponents([.hour, .minute], from: endTime)

        guard let currentMinutes = currentTime.hour.map({ $0 * 60 + (currentTime.minute ?? 0) }),
              let startMinutes = startComponents.hour.map({ $0 * 60 + (startComponents.minute ?? 0) }),
              let endMinutes = endComponents.hour.map({ $0 * 60 + (endComponents.minute ?? 0) }) else {
            return false
        }

        return currentMinutes >= startMinutes && currentMinutes < endMinutes
    }
}

@Observable
final class BlockingService {
    private let appGroupId = "group.com.hrynchuk.appblocker"
    private let appLimitsKey = "blocking.appLimits"
    private let schedulesKey = "blocking.schedules"
    private let defaultLimitKey = "blocking.defaultLimit"
    private let unlockWindowKey = "blocking.unlockWindow"
    private let activeSessionKey = "blocking.activeSession"
    private let dailyGoalKey = "blocking.dailyGoal"

    // Authorization
    var isAuthorized: Bool = false
    var authorizationError: String?

    // Daily screen time goal (total across all apps)
    var dailyGoal: DailyGoal = .defaultGoal {
        didSet {
            saveDailyGoal()
            syncDailyGoalReachedToAppGroup()
        }
    }

    // Selected apps from FamilyActivityPicker
    var selectedApps: FamilyActivitySelection = FamilyActivitySelection() {
        didSet {
            saveSelectionToContainer()
            // Auto-apply blocking when selection changes
            if !selectedApps.applicationTokens.isEmpty || !selectedApps.categoryTokens.isEmpty {
                applyBlocking()
            }
        }
    }

    // Per-app daily limits
    var appLimits: [UUID: AppLimit] = [:] {
        didSet {
            saveAppLimitsToContainer()
        }
    }

    // Default limit for new apps (connected to Profile)
    var defaultLimitMinutes: Int = 30 {
        didSet {
            saveDefaultLimit()
        }
    }

    // Unlock window duration - how long user gets access when using earned time
    // This is a fixed window: user pays X minutes upfront, gets X minutes of access
    var unlockWindowMinutes: Int = 5 {
        didSet {
            saveUnlockWindow()
        }
    }

    // Preset options for unlock window (in minutes)
    static let unlockWindowOptions = [2, 5, 10, 15, 20, 30]

    // Unblock schedules (using Codable version for persistence)
    var schedules: [CodableSchedule] = []

    // Temp unblock state
    var tempUnblockEndTime: Date?
    private var tempUnblockTimer: Timer?

    // Active usage session (for per-minute tracking)
    var activeSession: UsageSession?

    // Timer for deducting earned time every minute
    private var usageTimer: Timer?

    // Timer for checking unlock window expiry
    private var unlockWindowCheckTimer: Timer?

    // Timer for syncing usage from DeviceActivityReport
    private var usageSyncTimer: Timer?

    // Managed Settings
    private let store = ManagedSettingsStore()

    init() {
        loadSelectionFromContainer()
        loadAppLimitsFromContainer()
        loadDefaultLimit()
        loadUnlockWindow()
        loadSchedules()
        loadDailyGoal()
        checkAuthorization()
        checkDailyReset()
        loadActiveSessionFromExtension()

        // Apply blocking on startup if apps are selected (unless in active earned time session)
        if !selectedApps.applicationTokens.isEmpty || !selectedApps.categoryTokens.isEmpty {
            checkAndReapplyBlocking()
        }

        // Restore monitoring for all app limits
        restoreAppLimitMonitoring()

        // Clean up any stale unlock window monitoring that may have failed to trigger
        cleanupStaleUnlockWindow()

        // Start periodic check for unlock window expiry (every 5 seconds)
        startUnlockWindowExpiryCheck()

        // Start periodic sync of usage from DeviceActivityReport (every 30 seconds)
        startUsageSyncTimer()

        // Initial sync on startup
        print("📊 BlockingService: Running initial sync and limit check")
        syncUsageFromAppGroup()
        checkAndEnforceLimits()

        // Listen for app becoming active to check session status and sync data
        NotificationCenter.default.addObserver(
            forName: UIApplication.didBecomeActiveNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            print("📊 BlockingService: App became active - syncing data and checking limits")
            self?.checkAndReapplyBlocking()
            self?.syncDailyGoalFromScreenTime()
            self?.syncUsageFromAppGroup()  // Sync app limits usage
            self?.checkAndEnforceLimits()  // Check and enforce any exceeded limits
            self?.checkAuthorization()  // Re-check auth status
        }

        // Listen for force reblock notification (from Time's Up notification)
        NotificationCenter.default.addObserver(
            forName: .forceReblock,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            print("BlockingService: Received forceReblock notification")
            self?.forceReblock()
        }
    }

    /// Start periodic check for unlock window expiry (every 2 seconds for responsiveness)
    private func startUnlockWindowExpiryCheck() {
        unlockWindowCheckTimer?.invalidate()
        unlockWindowCheckTimer = Timer.scheduledTimer(withTimeInterval: 2, repeats: true) { [weak self] _ in
            self?.checkAndReapplyBlocking()
        }
        // Also run timer on common run loop modes to work during scrolling etc.
        RunLoop.current.add(unlockWindowCheckTimer!, forMode: .common)
    }

    /// Start periodic sync of usage from DeviceActivityReport (every 30 seconds)
    private func startUsageSyncTimer() {
        usageSyncTimer?.invalidate()
        usageSyncTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            print("⏱️ BlockingService: Timer fired - syncing usage and checking limits")
            self?.syncUsageFromAppGroup()
            self?.checkAndEnforceLimits()
        }
        // Also run timer on common run loop modes
        RunLoop.current.add(usageSyncTimer!, forMode: .common)
        print("📊 BlockingService: Started usage sync timer (30s interval)")
    }

    /// Clean up any stale unlock window monitoring that may have failed to trigger
    private func cleanupStaleUnlockWindow() {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return }

        let isUnlocked = defaults.bool(forKey: "blocking.isUnlocked")
        let unlockExpiryTimestamp = defaults.double(forKey: "blocking.unlockExpiryTime")

        // If there's an unlock window that has already expired, clean it up
        if isUnlocked && unlockExpiryTimestamp > 0 {
            let expiryDate = Date(timeIntervalSince1970: unlockExpiryTimestamp)

            if Date() >= expiryDate {
                // Window has expired - stop any monitoring and apply blocking
                let center = DeviceActivityCenter()
                center.stopMonitoring([DeviceActivityName("unlockWindow")])

                // Clear the state
                defaults.set(false, forKey: "blocking.isUnlocked")
                defaults.removeObject(forKey: "blocking.unlockExpiryTime")
                defaults.synchronize()

                print("BlockingService: Cleaned up stale unlock window")
            }
        }
    }

    /// Force re-block apps (called from notification handler)
    func forceReblock() {
        guard let defaults = UserDefaults(suiteName: appGroupId) else {
            print("BlockingService: forceReblock - FAILED to access app group")
            return
        }

        print("BlockingService: forceReblock - Starting force re-block")

        // Stop any unlock window monitoring
        let center = DeviceActivityCenter()
        center.stopMonitoring([DeviceActivityName("unlockWindow")])

        // Set "session just expired" flag to prevent immediate re-unlock
        // This tells Shield to show "Session Expired" instead of "Ready to Unlock"
        defaults.set(Date().timeIntervalSince1970, forKey: "blocking.sessionExpiredAt")

        // Clear unlock state
        defaults.set(false, forKey: "blocking.isUnlocked")
        defaults.removeObject(forKey: "blocking.unlockExpiryTime")
        defaults.set(false, forKey: "isUsingEarnedTime")
        defaults.removeObject(forKey: activeSessionKey)
        defaults.synchronize()

        print("BlockingService: forceReblock - Cleared unlock state, set sessionExpiredAt flag, applying shields...")

        // Re-apply blocking
        applyBlocking()

        print("BlockingService: forceReblock - COMPLETED, apps should now be blocked")
    }

    /// Check if we should re-apply blocking (unlock window expired or no earned time)
    func checkAndReapplyBlocking() {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return }

        // Check if there's an active unlock window
        let isUnlocked = defaults.bool(forKey: "blocking.isUnlocked")
        let unlockExpiryTimestamp = defaults.double(forKey: "blocking.unlockExpiryTime")

        if isUnlocked && unlockExpiryTimestamp > 0 {
            let expiryDate = Date(timeIntervalSince1970: unlockExpiryTimestamp)

            if Date() >= expiryDate {
                // Unlock window has expired - re-apply blocking
                print("BlockingService: Unlock window expired, re-applying blocking")

                // Set "session just expired" flag to prevent immediate re-unlock
                defaults.set(Date().timeIntervalSince1970, forKey: "blocking.sessionExpiredAt")

                defaults.set(false, forKey: "blocking.isUnlocked")
                defaults.removeObject(forKey: "blocking.unlockExpiryTime")
                defaults.synchronize()

                applyBlocking()
                return
            } else {
                // Still in unlock window
                let remainingSeconds = Int(expiryDate.timeIntervalSinceNow)
                print("BlockingService: In unlock window, \(remainingSeconds)s remaining")
                return
            }
        }

        // Legacy check for old session-based approach
        let isUsingFromExtension = defaults.bool(forKey: "isUsingEarnedTime")
        let earnedTime = defaults.double(forKey: "timeBank.availableMinutes")

        // If no earned time left or no active session, re-apply blocking
        if !isUsingFromExtension || earnedTime <= 0 {
            // Clear the session flag
            defaults.set(false, forKey: "isUsingEarnedTime")
            defaults.removeObject(forKey: activeSessionKey)
            defaults.synchronize()

            applyBlocking()
            print("BlockingService: Re-applied blocking (earned time: \(earnedTime), session active: \(isUsingFromExtension))")
        } else {
            print("BlockingService: Active earned time session, not blocking (balance: \(earnedTime))")
        }
    }

    /// Get remaining unlock window time in seconds (0 if not in unlock window)
    var unlockWindowRemainingSeconds: Int {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return 0 }

        let isUnlocked = defaults.bool(forKey: "blocking.isUnlocked")
        let unlockExpiryTimestamp = defaults.double(forKey: "blocking.unlockExpiryTime")

        guard isUnlocked && unlockExpiryTimestamp > 0 else { return 0 }

        let expiryDate = Date(timeIntervalSince1970: unlockExpiryTimestamp)
        return max(0, Int(expiryDate.timeIntervalSinceNow))
    }

    /// Check if currently in an unlock window
    var isInUnlockWindow: Bool {
        unlockWindowRemainingSeconds > 0
    }

    /// Load active session that may have been started by ShieldAction extension
    private func loadActiveSessionFromExtension() {
        guard let defaults = UserDefaults(suiteName: appGroupId),
              let data = defaults.data(forKey: activeSessionKey) else { return }

        do {
            if let sessionDict = try JSONSerialization.jsonObject(with: data) as? [String: Any],
               let appName = sessionDict["appName"] as? String,
               let startTimestamp = sessionDict["startTime"] as? TimeInterval,
               let isUsingEarnedTime = sessionDict["isUsingEarnedTime"] as? Bool {

                activeSession = UsageSession(
                    appName: appName,
                    startTime: Date(timeIntervalSince1970: startTimestamp),
                    isUsingEarnedTime: isUsingEarnedTime
                )
                print("BlockingService: Loaded active session from extension for \(appName)")
            }
        } catch {
            print("BlockingService: Failed to load session from extension - \(error)")
        }
    }

    // MARK: - Daily Reset Check

    func checkDailyReset() {
        let today = Calendar.current.startOfDay(for: Date())
        var updated = false

        // Reset per-app limits
        for (id, var limit) in appLimits {
            if limit.lastResetDate < today {
                limit.usedTodayMinutes = 0
                limit.isLimitEnforced = false  // Reset enforcement flag for new day
                limit.lastResetDate = today
                appLimits[id] = limit
                updated = true
            }
        }

        if updated {
            saveAppLimitsToContainer()
        }

        // Reset daily goal
        dailyGoal.checkDailyReset()
    }

    // MARK: - Authorization

    func checkAuthorization() {
        let status = AuthorizationCenter.shared.authorizationStatus
        isAuthorized = status == .approved
        print("BlockingService: Authorization status = \(status.rawValue), isAuthorized = \(isAuthorized)")

        // Also sync daily goal usage when checking auth (good time to refresh)
        syncDailyGoalFromScreenTime()
    }

    @MainActor
    func requestAuthorization() async {
        print("BlockingService: Requesting authorization...")

        // First check if already authorized
        let currentStatus = AuthorizationCenter.shared.authorizationStatus
        if currentStatus == .approved {
            isAuthorized = true
            print("BlockingService: Already authorized!")
            return
        }

        do {
            try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
            let status = AuthorizationCenter.shared.authorizationStatus
            isAuthorized = status == .approved
            authorizationError = nil
            print("BlockingService: Authorization granted! Status = \(status.rawValue)")
        } catch {
            // Check status again - sometimes authorization works but throws an error
            let finalStatus = AuthorizationCenter.shared.authorizationStatus
            if finalStatus == .approved {
                isAuthorized = true
                authorizationError = nil
                print("BlockingService: Authorization actually succeeded despite error")
            } else {
                isAuthorized = false
                authorizationError = error.localizedDescription
                print("BlockingService: Authorization failed - \(error)")
            }
        }
    }

    // MARK: - Daily Goal Usage Sync

    /// Sync daily goal usage from time spent via Shield unlocks
    /// Note: Screen Time API doesn't allow saving data from DeviceActivityReport,
    /// so we track usage based on time spent through Shield unlocks instead.
    func syncDailyGoalFromScreenTime() {
        guard let defaults = UserDefaults(suiteName: appGroupId) else {
            print("BlockingService: Failed to access app group for sync")
            return
        }

        // Force refresh from disk (important for cross-process sync)
        CFPreferencesAppSynchronize(appGroupId as CFString)

        // Check if we need to reset (new day)
        let lastResetTimestamp = defaults.double(forKey: "dailyGoal.lastResetTimestamp")
        let lastResetDate = Date(timeIntervalSince1970: lastResetTimestamp)
        let needsReset = lastResetTimestamp == 0 || !Calendar.current.isDateInToday(lastResetDate)

        if needsReset {
            // Reset for new day
            defaults.set(0.0, forKey: "dailyGoal.todaySpentViaShield")
            defaults.set(Date().timeIntervalSince1970, forKey: "dailyGoal.lastResetTimestamp")
            defaults.synchronize()
            dailyGoal.usedTodayMinutes = 0
            print("BlockingService: Daily goal reset for new day")
            return
        }

        // Get today's spending (stored separately from total)
        let todaySpent = defaults.double(forKey: "dailyGoal.todaySpentViaShield")

        // Update daily goal usage if changed
        if abs(dailyGoal.usedTodayMinutes - todaySpent) > 0.1 {
            print("BlockingService: Updated daily goal usage: \(String(format: "%.1f", dailyGoal.usedTodayMinutes)) -> \(String(format: "%.1f", todaySpent)) minutes")
            dailyGoal.usedTodayMinutes = todaySpent
        }
    }

    /// Record time spent via Shield unlock for Daily Goal tracking
    /// Note: This is also done by ShieldActionExtension, but can be called from main app if needed
    func recordShieldSpending(minutes: Double) {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return }

        // Check if we need to reset for new day
        let lastResetTimestamp = defaults.double(forKey: "dailyGoal.lastResetTimestamp")
        let lastResetDate = Date(timeIntervalSince1970: lastResetTimestamp)
        let needsReset = lastResetTimestamp == 0 || !Calendar.current.isDateInToday(lastResetDate)

        if needsReset {
            defaults.set(0.0, forKey: "dailyGoal.todaySpentViaShield")
            defaults.set(Date().timeIntervalSince1970, forKey: "dailyGoal.lastResetTimestamp")
        }

        // Add to today's spending
        let currentTodaySpent = defaults.double(forKey: "dailyGoal.todaySpentViaShield")
        let newTodaySpent = currentTodaySpent + minutes
        defaults.set(newTodaySpent, forKey: "dailyGoal.todaySpentViaShield")
        defaults.synchronize()

        // Update local state
        dailyGoal.usedTodayMinutes = newTodaySpent
        print("BlockingService: Recorded \(minutes)m shield spending, today total: \(String(format: "%.1f", newTodaySpent))m")
    }

    // MARK: - Blocking

    /// Apply shields to all selected apps (block them)
    func applyBlocking() {
        // If selectedApps is empty, try to reload from container
        if selectedApps.applicationTokens.isEmpty && selectedApps.categoryTokens.isEmpty {
            print("BlockingService: selectedApps is empty, attempting to reload from container...")
            loadSelectionFromContainer()
        }

        guard !selectedApps.applicationTokens.isEmpty || !selectedApps.categoryTokens.isEmpty else {
            print("BlockingService: No apps selected to block (even after reload)")
            return
        }

        store.shield.applications = selectedApps.applicationTokens
        store.shield.applicationCategories = .specific(selectedApps.categoryTokens)
        store.shield.webDomainCategories = .specific(selectedApps.categoryTokens)

        print("BlockingService: ✅ Applied shields to \(selectedApps.applicationTokens.count) apps and \(selectedApps.categoryTokens.count) categories")
    }

    /// Remove all shields (unblock all apps)
    func clearBlocking() {
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        store.shield.webDomainCategories = nil

        print("BlockingService: Cleared all shields")
    }

    // MARK: - Focus Mode

    /// Track if focus mode is active
    var isFocusModeActive: Bool = false

    /// Start focus mode - block all selected apps with strict enforcement
    func startFocusMode() {
        isFocusModeActive = true

        // Apply shields to all selected apps
        store.shield.applications = selectedApps.applicationTokens
        store.shield.applicationCategories = .specific(selectedApps.categoryTokens)
        store.shield.webDomainCategories = .specific(selectedApps.categoryTokens)

        // Save focus mode state to app group
        let defaults = UserDefaults(suiteName: appGroupId)
        defaults?.set(true, forKey: "blocking.focusModeActive")
        defaults?.synchronize()

        print("BlockingService: Focus mode started - all apps blocked")
    }

    /// End focus mode - restore normal blocking behavior
    func endFocusMode() {
        isFocusModeActive = false

        // Clear focus mode state
        let defaults = UserDefaults(suiteName: appGroupId)
        defaults?.set(false, forKey: "blocking.focusModeActive")
        defaults?.synchronize()

        // Re-apply normal blocking (or clear if no apps selected)
        if !selectedApps.applicationTokens.isEmpty || !selectedApps.categoryTokens.isEmpty {
            applyBlocking()
        } else {
            clearBlocking()
        }

        print("BlockingService: Focus mode ended - normal blocking restored")
    }

    // MARK: - Access Decision Logic

    /// Check if an app can be accessed based on:
    /// 1. Daily goal (total screen time limit - iron rule, route to coach)
    /// 2. Per-app daily limit (iron rule - cannot exceed)
    /// 3. Earned time (deducts from balance)
    func canAccessApp(_ appTokenData: Data, timeBank: TimeBankService) -> AccessResult {
        // 1. Check daily goal first (iron rule - route to coach)
        if dailyGoal.isGoalReached {
            syncDailyGoalReachedToAppGroup()
            return .blocked(reason: .dailyGoalReached)
        }

        // Find limit for this app
        let limit = appLimits.values.first { $0.appTokenData == appTokenData }

        // 2. Check per-app daily limit (iron rule)
        if let limit = limit, limit.isLimitReached {
            syncLimitReachedToAppGroup(true)
            return .blocked(reason: .dailyLimitReached)
        }

        // 3. Check if in temp unblock
        if let endTime = tempUnblockEndTime, Date() < endTime {
            syncLimitReachedToAppGroup(false)
            return .allowed(consumesEarnedTime: false)
        }

        // 4. Check earned time
        if timeBank.availableMinutes > 0 {
            syncLimitReachedToAppGroup(false)
            return .allowed(consumesEarnedTime: true)
        }

        syncLimitReachedToAppGroup(false)
        return .blocked(reason: .noTimeAvailable)
    }

    /// Sync limit reached status to app group for Shield extension
    private func syncLimitReachedToAppGroup(_ reached: Bool) {
        let defaults = UserDefaults(suiteName: appGroupId)
        defaults?.set(reached, forKey: "blocking.limitReached")
        defaults?.synchronize()
    }

    /// Update limit reached flag based on current state (call when limits change)
    func updateLimitReachedFlag() {
        let anyLimitReached = appLimits.values.contains { $0.isLimitReached }
        syncLimitReachedToAppGroup(anyLimitReached)
    }

    /// Legacy method for backward compatibility
    func isAppAccessible(_ appId: String, schedules: [UnblockSchedule], timeBank: TimeBankService) -> Bool {
        // Check if in temp unblock
        if let endTime = tempUnblockEndTime, Date() < endTime {
            return true
        }

        // Check if in any unblock schedule
        for schedule in schedules where schedule.isCurrentlyActive {
            if schedule.appIds.contains(appId) {
                return true
            }
        }

        // Check earned time
        if timeBank.availableMinutes > 0 {
            return true
        }

        return false
    }

    // MARK: - App Limits Management

    /// Create or update a limit for an app
    func setLimit(for appTokenData: Data, appName: String, dailyLimitMinutes: Int) {
        // Find existing or create new
        var limitId: UUID
        if let existingId = appLimits.values.first(where: { $0.appTokenData == appTokenData })?.id {
            var limit = appLimits[existingId]!
            limit.dailyLimitMinutes = dailyLimitMinutes
            appLimits[existingId] = limit
            limitId = existingId
        } else {
            let newLimit = AppLimit(
                appTokenData: appTokenData,
                appName: appName,
                dailyLimitMinutes: dailyLimitMinutes
            )
            appLimits[newLimit.id] = newLimit
            limitId = newLimit.id
        }

        // Set up Screen Time monitoring for this app limit
        setupAppLimitMonitoring(limitId: limitId, appTokenData: appTokenData, minutes: dailyLimitMinutes)
    }

    /// Remove limit for an app
    func removeLimit(for appTokenData: Data) {
        if let id = appLimits.values.first(where: { $0.appTokenData == appTokenData })?.id {
            // Stop monitoring for this limit
            stopAppLimitMonitoring(limitId: id)
            appLimits.removeValue(forKey: id)
        }
    }

    /// Set up DeviceActivity monitoring for an app limit
    private func setupAppLimitMonitoring(limitId: UUID, appTokenData: Data, minutes: Int) {
        guard let token = try? PropertyListDecoder().decode(ApplicationToken.self, from: appTokenData) else {
            print("BlockingService: Failed to decode app token for limit monitoring")
            return
        }

        let center = DeviceActivityCenter()
        let activityName = DeviceActivityName("appLimit_\(limitId.uuidString)")

        // Create a schedule that covers the whole day
        let schedule = DeviceActivitySchedule(
            intervalStart: DateComponents(hour: 0, minute: 0),
            intervalEnd: DateComponents(hour: 23, minute: 59),
            repeats: true
        )

        // Create threshold event for this app
        let thresholdMinutes = DateComponents(minute: minutes)
        let event = DeviceActivityEvent(
            applications: [token],
            threshold: thresholdMinutes
        )

        do {
            try center.startMonitoring(
                activityName,
                during: schedule,
                events: [DeviceActivityEvent.Name("limit_\(limitId.uuidString)"): event]
            )
            print("BlockingService: Started monitoring app limit for \(minutes) minutes")
        } catch {
            print("BlockingService: Failed to start app limit monitoring - \(error)")
        }
    }

    /// Stop monitoring for an app limit
    private func stopAppLimitMonitoring(limitId: UUID) {
        let center = DeviceActivityCenter()
        let activityName = DeviceActivityName("appLimit_\(limitId.uuidString)")
        center.stopMonitoring([activityName])
        print("BlockingService: Stopped monitoring app limit \(limitId)")
    }

    /// Restore monitoring for all existing app limits (called on app startup)
    private func restoreAppLimitMonitoring() {
        for (id, limit) in appLimits {
            setupAppLimitMonitoring(limitId: id, appTokenData: limit.appTokenData, minutes: limit.dailyLimitMinutes)
        }
        if !appLimits.isEmpty {
            print("BlockingService: Restored monitoring for \(appLimits.count) app limits")
        }
    }

    /// Get limit for an app (or create default)
    func getLimit(for appTokenData: Data, appName: String) -> AppLimit {
        if let existing = appLimits.values.first(where: { $0.appTokenData == appTokenData }) {
            return existing
        }

        // Create default limit
        let newLimit = AppLimit(
            appTokenData: appTokenData,
            appName: appName,
            dailyLimitMinutes: AppLimit.defaultLimit
        )
        appLimits[newLimit.id] = newLimit
        return newLimit
    }

    /// Record usage for an app
    func recordUsage(for appTokenData: Data, appName: String, minutes: Double, timeBank: TimeBankService, consumeEarnedTime: Bool) {
        // Update daily limit usage
        if let id = appLimits.values.first(where: { $0.appTokenData == appTokenData })?.id {
            var limit = appLimits[id]!
            limit.addUsage(minutes: minutes)
            appLimits[id] = limit
        } else {
            // Create new limit entry with usage
            var newLimit = AppLimit(
                appTokenData: appTokenData,
                appName: appName
            )
            newLimit.addUsage(minutes: minutes)
            appLimits[newLimit.id] = newLimit
        }

        // Deduct from earned time if needed
        if consumeEarnedTime {
            _ = timeBank.spend(minutes: minutes, forApp: appName)
        }
    }

    /// Get all limits sorted by name
    var sortedAppLimits: [AppLimit] {
        Array(appLimits.values).sorted { $0.appName < $1.appName }
    }

    /// Update app limit usage and name from DeviceActivityReport data
    func updateLimitUsage(for appTokenData: Data, usedMinutes: Double, appName: String? = nil) {
        if let id = appLimits.values.first(where: { $0.appTokenData == appTokenData })?.id {
            var limit = appLimits[id]!
            limit.checkDailyReset() // Reset if new day
            limit.usedTodayMinutes = usedMinutes // Set to actual usage (not increment)

            // Update app name if provided and currently generic
            if let name = appName, !name.isEmpty, limit.appName == "App" {
                limit.appName = name
            }

            appLimits[id] = limit
        }
    }

    /// Sync usage data from App Group (DeviceActivityReport saves usage by app name)
    func syncUsageFromAppGroup() {
        guard let defaults = UserDefaults(suiteName: "group.com.hrynchuk.appblocker") else { return }

        // Force refresh from disk
        CFPreferencesAppSynchronize("group.com.hrynchuk.appblocker" as CFString)

        // DEBUG: Print current app limits in memory
        print("📱 BlockingService: Current appLimits in memory: \(appLimits.count)")
        for (id, limit) in appLimits {
            print("   - \(limit.appName): \(limit.usedTodayMinutes)/\(limit.dailyLimitMinutes) min (id: \(id))")
        }

        // DEBUG: Check if limits are saved in app group
        if let savedData = defaults.data(forKey: appLimitsKey) {
            print("✅ BlockingService: App limits data EXISTS in app group (\(savedData.count) bytes)")
            if let decoded = try? JSONDecoder().decode([AppLimit].self, from: savedData) {
                print("   Decoded \(decoded.count) limits: \(decoded.map { $0.appName })")
            } else {
                print("   ❌ Failed to decode saved limits")
            }
        } else {
            print("❌ BlockingService: NO app limits data in app group!")
        }

        // DEBUG: Print report extension debug info
        printReportDebugInfo(defaults: defaults)

        guard !appLimits.isEmpty else {
            print("⚠️ BlockingService: appLimits is empty, skipping sync")
            return
        }

        // Read usage by app name: { "Instagram": 45.5, "TikTok": 30.0, ... }
        guard let data = defaults.data(forKey: "appUsage.byName"),
              let usageByName = try? JSONDecoder().decode([String: Double].self, from: data) else {
            print("⚠️ BlockingService: No appUsage.byName data found")
            return
        }

        print("📊 BlockingService: Found usage data for \(usageByName.count) apps: \(usageByName)")

        var updated = false

        // Match limits by app name
        for (id, var limit) in appLimits {
            limit.checkDailyReset()

            // Try exact match first
            if let usage = usageByName[limit.appName] {
                if limit.appName == "App" {
                    // Find actual name from usage data
                    for (name, mins) in usageByName {
                        if abs(mins - usage) < 0.01 {
                            limit.appName = name
                            break
                        }
                    }
                }
                if abs(limit.usedTodayMinutes - usage) > 0.1 {
                    limit.usedTodayMinutes = usage
                    updated = true
                }
                appLimits[id] = limit
                continue
            }

            // Try partial name match (case-insensitive)
            let limitNameLower = limit.appName.lowercased()
            for (appName, usage) in usageByName {
                let appNameLower = appName.lowercased()
                if appNameLower == limitNameLower ||
                   appNameLower.contains(limitNameLower) ||
                   limitNameLower.contains(appNameLower) {
                    // Update name if placeholder
                    if limit.appName == "App" {
                        limit.appName = appName
                    }
                    if abs(limit.usedTodayMinutes - usage) > 0.1 {
                        limit.usedTodayMinutes = usage
                        updated = true
                    }
                    appLimits[id] = limit
                    break
                }
            }
        }

        if updated {
            enforceExceededLimits()
        }
    }

    /// Print debug info from DeviceActivityReport extension
    private func printReportDebugInfo(defaults: UserDefaults) {
        let status = defaults.string(forKey: "debug.dailyGoalReportStatus") ?? "unknown"
        let lastRun = defaults.double(forKey: "debug.dailyGoalReportLastRun")
        let limitNames = defaults.array(forKey: "debug.appLimitNames") as? [String] ?? []
        let limitNamesCount = defaults.integer(forKey: "debug.appLimitNamesCount")
        let matchedApps = defaults.array(forKey: "debug.limitedAppsMatched") as? [String] ?? []
        let matchedCount = defaults.integer(forKey: "debug.limitedAppsCount")

        let lastRunDate = lastRun > 0 ? Date(timeIntervalSince1970: lastRun) : nil
        let timeAgo = lastRunDate.map { Int(Date().timeIntervalSince($0)) } ?? -1

        print("🔍 === REPORT DEBUG INFO ===")
        print("   Status: \(status)")
        print("   Last run: \(timeAgo)s ago")
        print("   App limit names (\(limitNamesCount)): \(limitNames)")
        print("   Matched limited apps (\(matchedCount)): \(matchedApps)")
        print("🔍 =========================")
    }

    /// Enforce blocking for apps that have exceeded their daily limits
    private func enforceExceededLimits() {
        var appsToShield: Set<ApplicationToken> = store.shield.applications ?? Set()
        var anyExceeded = false

        for limit in appLimits.values where limit.isLimitReached {
            if let token = limit.applicationToken {
                appsToShield.insert(token)
                anyExceeded = true
            }
        }

        if anyExceeded {
            store.shield.applications = appsToShield
            syncLimitReachedToAppGroup(true)
        }
    }

    /// Check all app limits and enforce shielding for any that have been exceeded
    /// This is the polling-based fallback that doesn't rely on eventDidReachThreshold
    func checkAndEnforceLimits() {
        var anyEnforced = false

        for (id, limit) in appLimits {
            var updatedLimit = limit
            updatedLimit.checkDailyReset()

            // Check if limit exceeded but not yet enforced
            if updatedLimit.usedTodayMinutes >= Double(updatedLimit.dailyLimitMinutes) && !updatedLimit.isLimitEnforced {
                print("🚫 BlockingService: Limit exceeded for \(updatedLimit.appName) (\(String(format: "%.1f", updatedLimit.usedTodayMinutes))/\(updatedLimit.dailyLimitMinutes) min) - enforcing shield")

                // Shield this specific app
                shieldAppForLimit(updatedLimit)

                // Mark as enforced so we don't re-process
                updatedLimit.isLimitEnforced = true
                anyEnforced = true
            }

            appLimits[id] = updatedLimit
        }

        if anyEnforced {
            syncLimitReachedToAppGroup(true)
            saveAppLimitsToContainer()
        }
    }

    /// Shield a specific app when its limit is exceeded
    private func shieldAppForLimit(_ limit: AppLimit) {
        guard let token = limit.applicationToken else {
            print("BlockingService: Failed to decode token for \(limit.appName)")
            return
        }

        var currentApps = store.shield.applications ?? Set()
        currentApps.insert(token)
        store.shield.applications = currentApps

        print("🛡️ BlockingService: Shielded \(limit.appName) - limit reached")
    }

    // MARK: - Temp Unblock

    func startTempUnblock(minutes: Int) {
        clearBlocking()
        tempUnblockEndTime = Date().addingTimeInterval(TimeInterval(minutes * 60))

        tempUnblockTimer?.invalidate()
        tempUnblockTimer = Timer.scheduledTimer(withTimeInterval: TimeInterval(minutes * 60), repeats: false) { [weak self] _ in
            self?.endTempUnblock()
        }

        print("BlockingService: Started temp unblock for \(minutes) minutes")
    }

    func endTempUnblock() {
        tempUnblockTimer?.invalidate()
        tempUnblockTimer = nil
        tempUnblockEndTime = nil
        applyBlocking()

        print("BlockingService: Ended temp unblock")
    }

    var isTempUnblocked: Bool {
        guard let endTime = tempUnblockEndTime else { return false }
        return Date() < endTime
    }

    var tempUnblockRemainingSeconds: Int {
        guard let endTime = tempUnblockEndTime else { return 0 }
        return max(0, Int(endTime.timeIntervalSinceNow))
    }

    // MARK: - Scheduled Blocking

    func createSchedule(name: String, startHour: Int, startMinute: Int, endHour: Int, endMinute: Int, repeats: Bool = true) {
        let center = DeviceActivityCenter()

        let schedule = DeviceActivitySchedule(
            intervalStart: DateComponents(hour: startHour, minute: startMinute),
            intervalEnd: DateComponents(hour: endHour, minute: endMinute),
            repeats: repeats
        )

        do {
            try center.startMonitoring(DeviceActivityName(name), during: schedule)
            print("BlockingService: Created schedule '\(name)'")
        } catch {
            print("BlockingService: Failed to create schedule - \(error)")
        }
    }

    func stopSchedule(name: String) {
        let center = DeviceActivityCenter()
        center.stopMonitoring([DeviceActivityName(name)])
        print("BlockingService: Stopped schedule '\(name)'")
    }

    func getActiveScheduleNames() -> [String] {
        let center = DeviceActivityCenter()
        return center.activities.map { $0.rawValue }
    }

    // MARK: - Persistence

    private func saveSelectionToContainer() {
        guard let defaults = UserDefaults(suiteName: appGroupId) else {
            print("BlockingService: Failed to access App Group for saving")
            return
        }

        do {
            let encoder = PropertyListEncoder()
            let data = try encoder.encode(selectedApps)
            defaults.set(data, forKey: "selectedApps")
            defaults.set(Date(), forKey: "selectionUpdated")
            defaults.synchronize()
            print("BlockingService: Saved selection - \(selectedApps.applicationTokens.count) apps, \(selectedApps.categoryTokens.count) categories")
        } catch {
            print("BlockingService: Failed to save selection - \(error)")
        }
    }

    private func loadSelectionFromContainer() {
        guard let defaults = UserDefaults(suiteName: appGroupId),
              let data = defaults.data(forKey: "selectedApps") else {
            print("BlockingService: No saved selection found")
            return
        }

        do {
            let decoder = PropertyListDecoder()
            selectedApps = try decoder.decode(FamilyActivitySelection.self, from: data)
            print("BlockingService: Loaded selection - \(selectedApps.applicationTokens.count) apps, \(selectedApps.categoryTokens.count) categories")
        } catch {
            print("BlockingService: Failed to load selection - \(error)")
        }
    }

    // MARK: - App Limits Persistence

    private func saveAppLimitsToContainer() {
        guard let defaults = UserDefaults(suiteName: appGroupId) else {
            print("BlockingService: Failed to access App Group for saving limits")
            return
        }

        do {
            let limitsArray = Array(appLimits.values)
            let data = try JSONEncoder().encode(limitsArray)
            defaults.set(data, forKey: appLimitsKey)
            defaults.synchronize()
            print("BlockingService: Saved \(appLimits.count) app limits")
        } catch {
            print("BlockingService: Failed to save app limits - \(error)")
        }
    }

    private func loadAppLimitsFromContainer() {
        guard let defaults = UserDefaults(suiteName: appGroupId),
              let data = defaults.data(forKey: appLimitsKey) else {
            print("BlockingService: No saved app limits found")
            return
        }

        do {
            let limitsArray = try JSONDecoder().decode([AppLimit].self, from: data)
            appLimits = Dictionary(uniqueKeysWithValues: limitsArray.map { ($0.id, $0) })
            print("BlockingService: Loaded \(appLimits.count) app limits")
        } catch {
            print("BlockingService: Failed to load app limits - \(error)")
        }
    }

    // MARK: - Focus Session (Temporary Block)

    private var focusSessionEndTime: Date?
    private var focusSessionTimer: Timer?

    /// Start a focus session - blocks all selected apps for a duration
    func startFocusSession(durationMinutes: Int) {
        // Ensure blocking is applied
        applyBlocking()

        focusSessionEndTime = Date().addingTimeInterval(TimeInterval(durationMinutes * 60))

        // Set up timer to end session
        focusSessionTimer?.invalidate()
        focusSessionTimer = Timer.scheduledTimer(withTimeInterval: TimeInterval(durationMinutes * 60), repeats: false) { [weak self] _ in
            self?.endFocusSession()
        }

        print("BlockingService: Started focus session for \(durationMinutes) minutes")
    }

    func endFocusSession() {
        focusSessionTimer?.invalidate()
        focusSessionTimer = nil
        focusSessionEndTime = nil
        print("BlockingService: Focus session ended")
    }

    var isFocusSessionActive: Bool {
        guard let endTime = focusSessionEndTime else { return false }
        return Date() < endTime
    }

    var focusSessionRemainingMinutes: Int {
        guard let endTime = focusSessionEndTime else { return 0 }
        return max(0, Int(endTime.timeIntervalSinceNow / 60))
    }

    // MARK: - App Blocked Check

    /// Check if an app is blocked by bundle ID (used for UI indicators)
    /// Since we don't have direct bundle ID mapping, this checks if blocking is active
    func isAppBlocked(bundleId: String) -> Bool {
        // If no apps are selected, nothing is blocked
        guard !selectedApps.applicationTokens.isEmpty || !selectedApps.categoryTokens.isEmpty else {
            return false
        }

        // If temp unblocked, nothing is blocked
        if isTempUnblocked {
            return false
        }

        // If using earned time, nothing is blocked
        if isUsingEarnedTime {
            return false
        }

        // Otherwise, we assume selected apps are blocked
        // In a real implementation, you would map bundle IDs to tokens
        return true
    }

    // MARK: - Stats

    var blockedAppsCount: Int {
        selectedApps.applicationTokens.count
    }

    var blockedCategoriesCount: Int {
        selectedApps.categoryTokens.count
    }

    var totalBlockedCount: Int {
        blockedAppsCount + blockedCategoriesCount
    }

    /// Total usage today across all apps
    var totalUsageToday: Double {
        appLimits.values.reduce(0) { $0 + $1.usedTodayMinutes }
    }

    /// Apps that have reached their limit
    var appsAtLimit: [AppLimit] {
        appLimits.values.filter { $0.isLimitReached }
    }

    // MARK: - Default Limit Persistence

    private func saveDefaultLimit() {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return }
        defaults.set(defaultLimitMinutes, forKey: defaultLimitKey)
        defaults.synchronize()
        print("BlockingService: Saved default limit = \(defaultLimitMinutes) minutes")
    }

    private func loadDefaultLimit() {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return }
        let saved = defaults.integer(forKey: defaultLimitKey)
        if saved > 0 {
            defaultLimitMinutes = saved
        }
        print("BlockingService: Loaded default limit = \(defaultLimitMinutes) minutes")
    }

    private func saveUnlockWindow() {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return }
        defaults.set(unlockWindowMinutes, forKey: unlockWindowKey)
        defaults.synchronize()
        print("BlockingService: Saved unlock window = \(unlockWindowMinutes) minutes")
    }

    private func loadUnlockWindow() {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return }
        let saved = defaults.integer(forKey: unlockWindowKey)
        if saved > 0 {
            unlockWindowMinutes = saved
        }
        print("BlockingService: Loaded unlock window = \(unlockWindowMinutes) minutes")
    }

    // MARK: - Earned Time Usage Sessions

    /// Start using earned time to access blocked apps
    /// This clears shields and starts tracking usage
    func startUsingEarnedTime(appName: String, timeBank: TimeBankService) -> Bool {
        guard timeBank.availableMinutes > 0 else {
            print("BlockingService: Cannot start - no earned time available")
            return false
        }

        // Clear shields to allow access
        clearBlocking()

        // Start tracking session
        activeSession = UsageSession(
            appName: appName,
            startTime: Date(),
            isUsingEarnedTime: true
        )

        // Save to app group for extension access
        saveActiveSession()

        // Start timer to deduct time every minute
        usageTimer?.invalidate()
        usageTimer = Timer.scheduledTimer(withTimeInterval: 60, repeats: true) { [weak self] _ in
            self?.deductOneMinute(timeBank: timeBank)
        }

        print("BlockingService: Started using earned time for \(appName)")
        return true
    }

    /// Stop using earned time - re-applies blocking
    func stopUsingEarnedTime(timeBank: TimeBankService) {
        guard let session = activeSession else { return }

        usageTimer?.invalidate()
        usageTimer = nil

        // Calculate final usage
        let usedMinutes = Date().timeIntervalSince(session.startTime) / 60.0

        // Record usage and deduct from time bank
        if session.isUsingEarnedTime {
            _ = timeBank.spend(minutes: usedMinutes, forApp: session.appName)
        }

        activeSession = nil
        clearActiveSession()

        // Re-apply blocking
        applyBlocking()

        print("BlockingService: Stopped using earned time, used \(String(format: "%.1f", usedMinutes)) minutes")
    }

    private func deductOneMinute(timeBank: TimeBankService) {
        guard let session = activeSession, session.isUsingEarnedTime else { return }

        // Deduct 1 minute
        let success = timeBank.spend(minutes: 1.0, forApp: session.appName)

        if !success || timeBank.availableMinutes <= 0 {
            // No more time - stop session and re-apply blocking
            print("BlockingService: Earned time depleted, re-applying blocks")
            stopUsingEarnedTime(timeBank: timeBank)
        }
    }

    private func saveActiveSession() {
        guard let defaults = UserDefaults(suiteName: appGroupId),
              let session = activeSession else { return }

        do {
            let data = try JSONEncoder().encode(session)
            defaults.set(data, forKey: activeSessionKey)
            defaults.synchronize()
        } catch {
            print("BlockingService: Failed to save active session - \(error)")
        }
    }

    private func clearActiveSession() {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return }
        defaults.removeObject(forKey: activeSessionKey)
        defaults.synchronize()
    }

    /// Check if there's an active usage session (for extension to read)
    var isUsingEarnedTime: Bool {
        activeSession?.isUsingEarnedTime ?? false
    }

    /// Duration of current session in minutes
    var currentSessionMinutes: Double {
        guard let session = activeSession else { return 0 }
        return Date().timeIntervalSince(session.startTime) / 60.0
    }

    // MARK: - Schedule Management

    /// Add a new unblock schedule
    func addSchedule(_ schedule: CodableSchedule) {
        schedules.append(schedule)
        saveSchedules()

        // Start monitoring with DeviceActivity
        // Use "unblock_" prefix so DeviceActivityMonitor recognizes it as an unblock schedule
        let center = DeviceActivityCenter()
        let startComponents = Calendar.current.dateComponents([.hour, .minute], from: schedule.startTime)
        let endComponents = Calendar.current.dateComponents([.hour, .minute], from: schedule.endTime)

        let deviceSchedule = DeviceActivitySchedule(
            intervalStart: startComponents,
            intervalEnd: endComponents,
            repeats: true
        )

        // Activity name with "unblock_" prefix for DeviceActivityMonitor to recognize
        let activityName = "unblock_\(schedule.id.uuidString)"

        do {
            try center.startMonitoring(DeviceActivityName(activityName), during: deviceSchedule)
            print("BlockingService: Added schedule '\(schedule.name)' with activity: \(activityName)")
        } catch {
            print("BlockingService: Failed to start monitoring schedule - \(error)")
        }
    }

    /// Add schedule from SwiftData model
    func addSchedule(_ model: UnblockSchedule) {
        addSchedule(CodableSchedule(from: model))
    }

    /// Remove an unblock schedule
    func removeSchedule(_ scheduleId: UUID) {
        schedules.removeAll { $0.id == scheduleId }
        saveSchedules()

        let center = DeviceActivityCenter()
        // Use the same "unblock_" prefix as when adding
        let activityName = "unblock_\(scheduleId.uuidString)"
        center.stopMonitoring([DeviceActivityName(activityName)])
        print("BlockingService: Removed schedule \(scheduleId)")
    }

    /// Update an existing schedule
    func updateSchedule(_ schedule: CodableSchedule) {
        if let index = schedules.firstIndex(where: { $0.id == schedule.id }) {
            schedules[index] = schedule
            saveSchedules()
        }
    }

    /// Check if any schedule is currently active for the given app token
    func isScheduleActiveForApp(_ appTokenData: Data) -> Bool {
        for schedule in schedules where schedule.isCurrentlyActive {
            if schedule.appTokens.contains(appTokenData) {
                return true
            }
        }
        return false
    }

    /// Check if any schedule is currently active (any app)
    var isAnyScheduleActive: Bool {
        schedules.contains { $0.isCurrentlyActive }
    }

    private func saveSchedules() {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return }

        do {
            let data = try JSONEncoder().encode(schedules)
            defaults.set(data, forKey: schedulesKey)
            defaults.synchronize()
            print("BlockingService: Saved \(schedules.count) schedules")
        } catch {
            print("BlockingService: Failed to save schedules - \(error)")
        }
    }

    func loadSchedules() {
        guard let defaults = UserDefaults(suiteName: appGroupId),
              let data = defaults.data(forKey: schedulesKey) else {
            print("BlockingService: No saved schedules found")
            return
        }

        do {
            schedules = try JSONDecoder().decode([CodableSchedule].self, from: data)
            print("BlockingService: Loaded \(schedules.count) schedules")
        } catch {
            print("BlockingService: Failed to load schedules - \(error)")
        }
    }

    // MARK: - Daily Goal Persistence

    private func saveDailyGoal() {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return }

        do {
            let data = try JSONEncoder().encode(dailyGoal)
            defaults.set(data, forKey: dailyGoalKey)
            defaults.synchronize()
            print("BlockingService: Saved daily goal (\(dailyGoal.targetMinutes) min target)")
        } catch {
            print("BlockingService: Failed to save daily goal - \(error)")
        }
    }

    private func loadDailyGoal() {
        guard let defaults = UserDefaults(suiteName: appGroupId),
              let data = defaults.data(forKey: dailyGoalKey) else {
            print("BlockingService: No saved daily goal found, using default")
            return
        }

        do {
            dailyGoal = try JSONDecoder().decode(DailyGoal.self, from: data)
            dailyGoal.checkDailyReset()
            print("BlockingService: Loaded daily goal (\(dailyGoal.targetMinutes) min target, \(String(format: "%.1f", dailyGoal.usedTodayMinutes)) min used)")
        } catch {
            print("BlockingService: Failed to load daily goal - \(error)")
        }
    }

    /// Sync daily goal reached status to app group for Shield extension
    private func syncDailyGoalReachedToAppGroup() {
        let defaults = UserDefaults(suiteName: appGroupId)
        defaults?.set(dailyGoal.isGoalReached, forKey: "blocking.dailyGoalReached")
        defaults?.synchronize()
    }

    /// Update daily goal target (called from Profile/Onboarding)
    func setDailyGoalTarget(minutes: Int) {
        dailyGoal.targetMinutes = minutes
        print("BlockingService: Set daily goal to \(minutes) minutes")
    }

    /// Update daily goal usage (called to sync with StatsService)
    func updateDailyGoalUsage(minutes: Double) {
        dailyGoal.usedTodayMinutes = minutes
    }
}
