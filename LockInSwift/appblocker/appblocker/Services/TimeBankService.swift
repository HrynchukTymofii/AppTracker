import Foundation
import SwiftData
import Observation
import UIKit

// MARK: - Codable Transaction for Persistence

/// Codable version of TimeTransaction for UserDefaults persistence
private struct StoredTransaction: Codable {
    let id: UUID
    let amount: Double
    let source: TimeSource
    let timestamp: Date
    let note: String?

    init(from transaction: TimeTransaction) {
        self.id = transaction.id
        self.amount = transaction.amount
        self.source = transaction.source
        self.timestamp = transaction.timestamp
        self.note = transaction.note
    }

    func toTimeTransaction() -> TimeTransaction {
        TimeTransaction(id: id, amount: amount, source: source, note: note, timestamp: timestamp)
    }
}

@Observable
final class TimeBankService {
    private let userDefaults = UserDefaults.standard
    private let sharedDefaults = UserDefaults(suiteName: "group.com.hrynchuk.appblocker")
    private let availableMinutesKey = "timeBank.availableMinutes"
    private let dailyResetDateKey = "timeBank.dailyResetDate"
    private let transactionsKey = "timeBank.transactions"
    private let taskCompletionDatesKey = "timeBank.taskCompletionDates"
    private let lastKnownBalanceKey = "timeBank.lastKnownBalance"

    /// Available earned time in minutes (supports decimals)
    /// Uses app group as single source of truth
    private var _availableMinutes: Double = 0

    var availableMinutes: Double {
        get { _availableMinutes }
        set {
            let oldValue = _availableMinutes
            _availableMinutes = newValue

            // Always write to local defaults
            userDefaults.set(newValue, forKey: availableMinutesKey)

            // Only write to app group if we're increasing (earning time)
            // or if this is coming from refreshFromAppGroup (syncing down)
            if let sharedDefaults = sharedDefaults {
                let sharedBalance = sharedDefaults.double(forKey: availableMinutesKey)

                // Write to app group if:
                // 1. We're earning (new value > shared) - push earnings up
                // 2. We're syncing from Shield (new value == shared) - just confirm
                // 3. New value is lower AND old value was higher than shared - we're syncing a spend
                if newValue >= sharedBalance || newValue < oldValue {
                    sharedDefaults.set(newValue, forKey: availableMinutesKey)
                    sharedDefaults.synchronize()
                }
            }
        }
    }

    /// Date of last daily reset (00:00)
    var dailyResetDate: Date {
        didSet {
            userDefaults.set(dailyResetDate.timeIntervalSince1970, forKey: dailyResetDateKey)
            sharedDefaults?.set(dailyResetDate.timeIntervalSince1970, forKey: dailyResetDateKey)
            sharedDefaults?.synchronize()
        }
    }

    var transactions: [TimeTransaction] = [] {
        didSet {
            saveTransactions()
        }
    }

    init() {
        // Read from APP GROUP as the source of truth (Shield writes here)
        let sharedBalance = sharedDefaults?.double(forKey: availableMinutesKey) ?? 0
        let localBalance = userDefaults.double(forKey: availableMinutesKey)

        // Use the shared value as source of truth
        // Only fall back to local if shared is 0 and local has value (first launch)
        if sharedBalance > 0 || localBalance == 0 {
            self._availableMinutes = sharedBalance
        } else {
            self._availableMinutes = localBalance
            // First launch - sync local to shared
            sharedDefaults?.set(localBalance, forKey: availableMinutesKey)
            sharedDefaults?.synchronize()
        }

        // Load daily reset date (prefer shared)
        let sharedTimestamp = sharedDefaults?.double(forKey: dailyResetDateKey) ?? 0
        let localTimestamp = userDefaults.double(forKey: dailyResetDateKey)
        let storedTimestamp = sharedTimestamp > 0 ? sharedTimestamp : localTimestamp

        if storedTimestamp > 0 {
            self.dailyResetDate = Date(timeIntervalSince1970: storedTimestamp)
        } else {
            self.dailyResetDate = Date.distantPast
        }

        // Load saved transactions
        loadTransactions()

        // Check for daily reset on init
        checkDailyReset()

        // Check if Shield spent time and record transaction
        checkForShieldSpending()

        // Sync current balance to both stores
        syncToAppGroup()

        // Clear any stale sessions from old tracking approach (no longer used)
        clearOrphanedSessions()

        // Listen for app becoming active to refresh from Shield
        NotificationCenter.default.addObserver(
            forName: UIApplication.didBecomeActiveNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.refreshFromAppGroup()
        }
    }

    /// Refresh balance from app group (called when app becomes active)
    func refreshFromAppGroup() {
        guard let sharedDefaults = sharedDefaults else { return }

        // Get the authoritative balance from app group
        let sharedBalance = sharedDefaults.double(forKey: availableMinutesKey)

        // Check if Shield spent time since we last checked
        let totalSpentViaShield = sharedDefaults.double(forKey: "timeBank.totalSpentViaShield")
        let lastSyncedSpent = sharedDefaults.double(forKey: "timeBank.lastSyncedSpent")

        let newSpending = totalSpentViaShield - lastSyncedSpent

        if newSpending > 0.01 {
            // Record the spending transaction
            let transaction = TimeTransaction(
                amount: -newSpending,
                source: .appUsage(appId: "shield_unlock"),
                note: "Used \(String(format: "%.0f", newSpending)) minutes via Shield"
            )
            transactions.insert(transaction, at: 0)

            // Update last synced spent
            sharedDefaults.set(totalSpentViaShield, forKey: "timeBank.lastSyncedSpent")

            print("📱 Synced Shield spending: -\(newSpending) minutes")
        }

        // Always update to the shared balance (source of truth)
        if abs(sharedBalance - _availableMinutes) > 0.01 {
            // Update backing field directly to avoid triggering write back
            _availableMinutes = sharedBalance
            userDefaults.set(sharedBalance, forKey: availableMinutesKey)
            print("📱 Synced balance from app group: \(sharedBalance)")
        }

        sharedDefaults.synchronize()

        // Post notification so UI updates
        NotificationCenter.default.post(name: .timeBankUpdated, object: nil)
    }

    /// Check if Shield spent time since last app launch
    private func checkForShieldSpending() {
        refreshFromAppGroup()
    }

    // MARK: - Transaction Persistence

    private func saveTransactions() {
        let storedTransactions = transactions.map { StoredTransaction(from: $0) }
        do {
            let data = try JSONEncoder().encode(storedTransactions)
            userDefaults.set(data, forKey: transactionsKey)
        } catch {
            print("Failed to save transactions: \(error)")
        }
    }

    private func loadTransactions() {
        guard let data = userDefaults.data(forKey: transactionsKey) else { return }
        do {
            let storedTransactions = try JSONDecoder().decode([StoredTransaction].self, from: data)
            // Don't trigger didSet while loading
            self.transactions = storedTransactions.map { $0.toTimeTransaction() }
        } catch {
            print("Failed to load transactions: \(error)")
        }
    }

    /// Sync balance to app group for Shield extension
    /// Sync to app group - but never overwrite a lower balance (Shield may have spent)
    private func syncToAppGroup() {
        guard let sharedDefaults = sharedDefaults else { return }

        let sharedBalance = sharedDefaults.double(forKey: availableMinutesKey)

        // Only write if our balance is higher (we earned time)
        // Never overwrite if Shield has deducted time (lower balance)
        if availableMinutes > sharedBalance {
            sharedDefaults.set(availableMinutes, forKey: availableMinutesKey)
            sharedDefaults.synchronize()
            print("📱 Synced higher balance to app group: \(availableMinutes)")
        }

        // Also sync today's earned/spent for DeviceActivityReport extension
        syncTodayStatsToAppGroup()
    }

    /// Sync today's earned and spent values to app group for DeviceActivityReport extension
    func syncTodayStatsToAppGroup() {
        guard let sharedDefaults = sharedDefaults else { return }

        sharedDefaults.set(todayEarned, forKey: "timeBank.todayEarned")
        sharedDefaults.set(todaySpent, forKey: "timeBank.todaySpent")
        sharedDefaults.synchronize()
    }

    // MARK: - Daily Reset

    /// Check if we need to reset balance (daily at 00:00)
    /// Resets to min(0, balance/2) - positive becomes 0, negative becomes half
    func checkDailyReset() {
        let calendar = Calendar.current
        let now = Date()

        // Get today's midnight (00:00)
        let todayMidnight = calendar.startOfDay(for: now)

        // If our stored reset date is before today's midnight, reset
        if dailyResetDate < todayMidnight {
            // Calculate new balance: min(0, currentBalance / 2)
            // - If positive, reset to 0
            // - If negative, keep half the negative (becomes less negative)
            let newBalance = min(0, availableMinutes / 2)
            availableMinutes = newBalance
            dailyResetDate = todayMidnight

            // Clear transactions for new day
            transactions = []  // Will trigger didSet and save

            NotificationCenter.default.post(name: .timeBankDailyReset, object: nil)
        }
    }

    // MARK: - Earning Time

    /// Earn minutes from completing a task (supports decimals)
    func earn(minutes: Double, source: TimeSource, note: String? = nil) {
        guard minutes > 0 else { return }

        availableMinutes += minutes

        let transaction = TimeTransaction(amount: minutes, source: source, note: note)
        transactions.insert(transaction, at: 0)

        // Record task completion date for streak tracking
        recordTaskCompletion()

        // Sync today's stats for DeviceActivityReport
        syncTodayStatsToAppGroup()

        NotificationCenter.default.post(name: .timeBankUpdated, object: nil)
    }

    /// Check if today already has a task completion (for showing streak only on first task)
    func hasCompletedTaskToday() -> Bool {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let todayString = formatter.string(from: Date())
        let completionDates = sharedDefaults?.stringArray(forKey: taskCompletionDatesKey) ?? []
        return completionDates.contains(todayString)
    }

    /// Record today as a task completion date (for streak)
    private func recordTaskCompletion() {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let todayString = formatter.string(from: Date())

        // Load existing dates
        var completionDates = sharedDefaults?.stringArray(forKey: taskCompletionDatesKey) ?? []

        // Add today if not already present
        if !completionDates.contains(todayString) {
            completionDates.append(todayString)

            // Keep only last 60 days
            if completionDates.count > 60 {
                completionDates = Array(completionDates.suffix(60))
            }

            sharedDefaults?.set(completionDates, forKey: taskCompletionDatesKey)
            sharedDefaults?.synchronize()
        }
    }

    /// Earn time from completing an exercise using per-rep calculation
    func earnFromExercise(_ task: ExerciseTask) {
        // Use actualReward if set (from per-rep calculation), otherwise calculate
        let actualCount = task.progress > 0 ? task.progress : task.target
        let earnedMinutes: Double

        if task.actualReward > 0 {
            // Use the precise reward from exercise view
            earnedMinutes = task.actualReward
        } else {
            // Fallback to calculating reward
            earnedMinutes = task.type.calculateReward(count: actualCount)
        }

        guard earnedMinutes > 0 else {
            // Didn't meet minimum
            NotificationCenter.default.post(
                name: .exerciseMinimumNotMet,
                object: ["type": task.type, "count": actualCount, "minimum": task.type.rewardConfig.minimum]
            )
            return
        }

        let source: TimeSource
        switch task.type {
        case .pushups:
            source = .pushups(reps: actualCount)
        case .squats:
            source = .squats(reps: actualCount)
        case .plank:
            source = .plank(seconds: actualCount)
        case .photoVerification:
            source = .photoTask(taskId: task.id.uuidString)
        case .custom:
            source = .customExercise(name: task.displayTitle, value: actualCount)
        case .jumpingJacks, .lunges, .crunches, .shoulderPress, .legRaises, .highKnees, .pullUps, .wallSit, .sidePlank:
            // All new exercise types use customExercise source
            source = .customExercise(name: task.type.displayName, value: actualCount)
        }

        earn(minutes: earnedMinutes, source: source, note: "\(actualCount) \(task.type.unit)")
    }

    /// Earn time with a specific amount (for direct rewards like photo tasks)
    func earnDirect(minutes: Double, type: ExerciseType, note: String? = nil) {
        let source: TimeSource
        switch type {
        case .photoVerification:
            source = .photoTask(taskId: UUID().uuidString)
        default:
            source = .customExercise(name: type.displayName, value: Int(minutes))
        }
        earn(minutes: minutes, source: source, note: note)
    }

    // MARK: - Spending Time

    /// Attempt to spend minutes to unlock an app
    /// Returns true if successful, false if insufficient balance
    func spend(minutes: Double, forApp appId: String) -> Bool {
        guard minutes > 0 else { return false }
        guard availableMinutes >= minutes else { return false }

        availableMinutes -= minutes

        let transaction = TimeTransaction(
            amount: -minutes,
            source: .appUsage(appId: appId),
            note: "Unlocked app for \(String(format: "%.1f", minutes)) minutes"
        )
        transactions.insert(transaction, at: 0)

        // Sync today's stats for DeviceActivityReport
        syncTodayStatsToAppGroup()

        NotificationCenter.default.post(name: .timeBankUpdated, object: nil)
        return true
    }

    /// Check if user can afford a time spend
    func canAfford(minutes: Double) -> Bool {
        return availableMinutes >= minutes
    }

    // MARK: - Balance Info

    var hasPositiveBalance: Bool {
        availableMinutes > 0
    }

    /// Formatted balance string (e.g., "12.5m" or "1h 30m")
    var formattedBalance: String {
        if availableMinutes < 60 {
            if availableMinutes == floor(availableMinutes) {
                return "\(Int(availableMinutes))m"
            } else {
                return String(format: "%.1fm", availableMinutes)
            }
        } else {
            let hours = Int(availableMinutes) / 60
            let mins = Int(availableMinutes) % 60
            return mins > 0 ? "\(hours)h \(mins)m" : "\(hours)h"
        }
    }

    /// Decimal balance for display
    var balanceDecimal: String {
        String(format: "%.1f", availableMinutes)
    }

    // MARK: - History

    var todayEarned: Double {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        return transactions
            .filter { $0.timestamp >= startOfDay && $0.amount > 0 }
            .reduce(0) { $0 + $1.amount }
    }

    var todaySpent: Double {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        return transactions
            .filter { $0.timestamp >= startOfDay && $0.amount < 0 }
            .reduce(0) { $0 + abs($1.amount) }
    }

    var weeklyEarned: Double {
        let calendar = Calendar.current
        let weekAgo = calendar.date(byAdding: .day, value: -7, to: Date()) ?? Date()
        return transactions
            .filter { $0.timestamp >= weekAgo && $0.amount > 0 }
            .reduce(0) { $0 + $1.amount }
    }

    var weeklySpent: Double {
        let calendar = Calendar.current
        let weekAgo = calendar.date(byAdding: .day, value: -7, to: Date()) ?? Date()
        return transactions
            .filter { $0.timestamp >= weekAgo && $0.amount < 0 }
            .reduce(0) { $0 + abs($1.amount) }
    }

    /// Hours until next daily reset (midnight)
    var hoursUntilReset: Int {
        let calendar = Calendar.current
        let now = Date()
        guard let tomorrow = calendar.date(byAdding: .day, value: 1, to: calendar.startOfDay(for: now)) else {
            return 24
        }
        let seconds = tomorrow.timeIntervalSince(now)
        return max(0, Int(seconds / 3600))
    }

    // MARK: - Reset

    func reset() {
        availableMinutes = 0
        transactions = []  // Will trigger didSet and save
        userDefaults.removeObject(forKey: transactionsKey)
    }

    /// Clear any orphaned/stuck sessions without deducting time
    /// Call this if user reports unexpected time deductions
    func clearOrphanedSessions() {
        sharedDefaults?.removeObject(forKey: "blocking.activeSession")
        sharedDefaults?.set(false, forKey: "isUsingEarnedTime")
        sharedDefaults?.synchronize()
        print("🧹 Cleared any orphaned sessions")
    }

    /// Check if there's an active session (for debugging)
    var hasActiveSession: Bool {
        guard let defaults = sharedDefaults,
              let sessionData = defaults.data(forKey: "blocking.activeSession"),
              let session = try? JSONSerialization.jsonObject(with: sessionData) as? [String: Any],
              session["isUsingEarnedTime"] as? Bool == true else {
            return false
        }
        return true
    }
}

// MARK: - Notifications

extension Notification.Name {
    static let timeBankUpdated = Notification.Name("timeBankUpdated")
    static let timeBankDailyReset = Notification.Name("timeBankDailyReset")
    static let exerciseMinimumNotMet = Notification.Name("exerciseMinimumNotMet")
    static let openExercise = Notification.Name("openExercise")
}
