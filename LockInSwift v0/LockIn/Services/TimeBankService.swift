import Foundation
import SwiftData
import Observation

@Observable
final class TimeBankService {
    private let userDefaults = UserDefaults.standard
    private let availableMinutesKey = "timeBank.availableMinutes"

    var availableMinutes: Int {
        didSet {
            userDefaults.set(availableMinutes, forKey: availableMinutesKey)
        }
    }

    var transactions: [TimeTransaction] = []

    init() {
        self.availableMinutes = userDefaults.integer(forKey: availableMinutesKey)
    }

    // MARK: - Earning Time

    /// Earn minutes from completing a task
    func earn(minutes: Int, source: TimeSource, note: String? = nil) {
        guard minutes > 0 else { return }

        availableMinutes += minutes

        let transaction = TimeTransaction(amount: minutes, source: source, note: note)
        transactions.insert(transaction, at: 0)

        NotificationCenter.default.post(name: .timeBankUpdated, object: nil)
    }

    /// Earn time from completing an exercise
    func earnFromExercise(_ task: ExerciseTask) {
        let source: TimeSource
        switch task.type {
        case .pushups:
            source = .pushups(reps: task.target)
        case .squats:
            source = .squats(reps: task.target)
        case .plank:
            source = .plank(seconds: task.target)
        case .photoVerification:
            source = .photoTask(taskId: task.id.uuidString)
        case .custom:
            source = .customExercise(name: task.displayTitle, value: task.target)
        }

        earn(minutes: task.reward, source: source)
    }

    // MARK: - Spending Time

    /// Attempt to spend minutes to unlock an app
    /// Returns true if successful, false if insufficient balance
    func spend(minutes: Int, forApp appId: String) -> Bool {
        guard minutes > 0 else { return false }
        guard availableMinutes >= minutes else { return false }

        availableMinutes -= minutes

        let transaction = TimeTransaction(
            amount: -minutes,
            source: .appUsage(appId: appId),
            note: "Unlocked app for \(minutes) minutes"
        )
        transactions.insert(transaction, at: 0)

        NotificationCenter.default.post(name: .timeBankUpdated, object: nil)
        return true
    }

    /// Check if user can afford a time spend
    func canAfford(minutes: Int) -> Bool {
        return availableMinutes >= minutes
    }

    // MARK: - Balance Info

    var hasPositiveBalance: Bool {
        availableMinutes > 0
    }

    var formattedBalance: String {
        if availableMinutes < 60 {
            return "\(availableMinutes)m"
        } else {
            let hours = availableMinutes / 60
            let mins = availableMinutes % 60
            return mins > 0 ? "\(hours)h \(mins)m" : "\(hours)h"
        }
    }

    // MARK: - History

    var todayEarned: Int {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        return transactions
            .filter { $0.timestamp >= startOfDay && $0.amount > 0 }
            .reduce(0) { $0 + $1.amount }
    }

    var todaySpent: Int {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        return transactions
            .filter { $0.timestamp >= startOfDay && $0.amount < 0 }
            .reduce(0) { $0 + abs($1.amount) }
    }

    var weeklyEarned: Int {
        let calendar = Calendar.current
        let weekAgo = calendar.date(byAdding: .day, value: -7, to: Date()) ?? Date()
        return transactions
            .filter { $0.timestamp >= weekAgo && $0.amount > 0 }
            .reduce(0) { $0 + $1.amount }
    }

    // MARK: - Reset

    func reset() {
        availableMinutes = 0
        transactions.removeAll()
    }
}

// MARK: - Notifications

extension Notification.Name {
    static let timeBankUpdated = Notification.Name("timeBankUpdated")
}
