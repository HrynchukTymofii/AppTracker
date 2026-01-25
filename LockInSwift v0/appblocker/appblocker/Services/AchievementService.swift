import Foundation
import Observation

// MARK: - Achievement Definition

struct AchievementDef: Identifiable {
    let id: String
    let icon: String
    let category: AchievementCategory
    let target: Int
    let color: String // Hex color for badge

    var name: String {
        "achievement.\(id).name".localized
    }

    var description: String {
        "achievement.\(id).desc".localized
    }

    var colorSecondary: String {
        // Darker shade for gradient
        switch category {
        case .streak: return "d97706"   // Orange dark
        case .tasks: return "059669"    // Green dark
        case .timeEarned: return "2563eb" // Blue dark
        case .health: return "7c3aed"   // Purple dark
        case .balance: return "0891b2"  // Cyan dark
        case .special: return "db2777"  // Pink dark
        }
    }
}

enum AchievementCategory: String, CaseIterable {
    case streak
    case tasks
    case timeEarned
    case health
    case balance
    case special

    var displayName: String {
        switch self {
        case .streak: return "achievements.category.streak".localized
        case .tasks: return "achievements.category.tasks".localized
        case .timeEarned: return "achievements.category.time_earned".localized
        case .health: return "achievements.category.health".localized
        case .balance: return "achievements.category.balance".localized
        case .special: return "achievements.category.special".localized
        }
    }

    var icon: String {
        switch self {
        case .streak: return "flame.fill"
        case .tasks: return "checkmark.circle.fill"
        case .timeEarned: return "clock.fill"
        case .health: return "heart.fill"
        case .balance: return "banknote.fill"
        case .special: return "star.fill"
        }
    }

    var color: String {
        switch self {
        case .streak: return "f59e0b"
        case .tasks: return "10b981"
        case .timeEarned: return "3b82f6"
        case .health: return "8b5cf6"
        case .balance: return "06b6d4"
        case .special: return "ec4899"
        }
    }
}

// MARK: - Achievement Progress

struct AchievementProgress: Codable {
    var unlockedAt: Date?
    var currentProgress: Int

    var isUnlocked: Bool { unlockedAt != nil }
}

// MARK: - Achievement Service

@Observable
final class AchievementService {
    private let userDefaults = UserDefaults.standard
    private let progressKey = "achievements.progress"

    // All 24 achievements
    static let allAchievements: [AchievementDef] = [
        // STREAK (6)
        AchievementDef(id: "streak_1", icon: "flame", category: .streak, target: 1, color: "f59e0b"),
        AchievementDef(id: "streak_3", icon: "flame.fill", category: .streak, target: 3, color: "f59e0b"),
        AchievementDef(id: "streak_7", icon: "flame.circle.fill", category: .streak, target: 7, color: "f59e0b"),
        AchievementDef(id: "streak_14", icon: "flame.circle", category: .streak, target: 14, color: "f59e0b"),
        AchievementDef(id: "streak_30", icon: "sparkles", category: .streak, target: 30, color: "f59e0b"),
        AchievementDef(id: "streak_60", icon: "crown.fill", category: .streak, target: 60, color: "f59e0b"),

        // TASKS (6)
        AchievementDef(id: "tasks_1", icon: "figure.walk", category: .tasks, target: 1, color: "10b981"),
        AchievementDef(id: "tasks_5", icon: "figure.run", category: .tasks, target: 5, color: "10b981"),
        AchievementDef(id: "tasks_10", icon: "figure.strengthtraining.traditional", category: .tasks, target: 10, color: "10b981"),
        AchievementDef(id: "tasks_25", icon: "bolt.fill", category: .tasks, target: 25, color: "10b981"),
        AchievementDef(id: "tasks_50", icon: "gearshape.2.fill", category: .tasks, target: 50, color: "10b981"),
        AchievementDef(id: "tasks_100", icon: "trophy.fill", category: .tasks, target: 100, color: "10b981"),

        // TIME EARNED (6)
        AchievementDef(id: "time_5", icon: "clock", category: .timeEarned, target: 5, color: "3b82f6"),
        AchievementDef(id: "time_30", icon: "clock.fill", category: .timeEarned, target: 30, color: "3b82f6"),
        AchievementDef(id: "time_60", icon: "clock.badge.checkmark.fill", category: .timeEarned, target: 60, color: "3b82f6"),
        AchievementDef(id: "time_180", icon: "hourglass", category: .timeEarned, target: 180, color: "3b82f6"),
        AchievementDef(id: "time_600", icon: "hourglass.circle.fill", category: .timeEarned, target: 600, color: "3b82f6"),
        AchievementDef(id: "time_1800", icon: "timer.circle.fill", category: .timeEarned, target: 1800, color: "3b82f6"),

        // HEALTH (4)
        AchievementDef(id: "health_60", icon: "heart", category: .health, target: 60, color: "8b5cf6"),
        AchievementDef(id: "health_70", icon: "heart.fill", category: .health, target: 70, color: "8b5cf6"),
        AchievementDef(id: "health_80", icon: "heart.circle.fill", category: .health, target: 80, color: "8b5cf6"),
        AchievementDef(id: "health_90", icon: "bolt.heart.fill", category: .health, target: 90, color: "8b5cf6"),

        // BALANCE (2)
        AchievementDef(id: "balance_30", icon: "banknote", category: .balance, target: 30, color: "06b6d4"),
        AchievementDef(id: "balance_120", icon: "banknote.fill", category: .balance, target: 120, color: "06b6d4"),
    ]

    // Progress storage
    var progress: [String: AchievementProgress] = [:]

    // Computed properties
    var unlockedCount: Int {
        progress.values.filter { $0.isUnlocked }.count
    }

    var totalCount: Int {
        Self.allAchievements.count
    }

    init() {
        loadProgress()
    }

    // MARK: - Persistence

    private func loadProgress() {
        guard let data = userDefaults.data(forKey: progressKey),
              let decoded = try? JSONDecoder().decode([String: AchievementProgress].self, from: data) else {
            return
        }
        progress = decoded
    }

    private func saveProgress() {
        guard let data = try? JSONEncoder().encode(progress) else { return }
        userDefaults.set(data, forKey: progressKey)
    }

    // MARK: - Progress Updates

    /// Update all achievements based on current stats
    func updateAchievements(streak: Int, tasksCompleted: Int, totalTimeEarned: Double, healthScore: Int, currentBalance: Double) {
        var newUnlocks: [AchievementDef] = []

        for achievement in Self.allAchievements {
            var currentProgress = progress[achievement.id] ?? AchievementProgress(unlockedAt: nil, currentProgress: 0)

            // Calculate progress based on category
            let progressValue: Int
            switch achievement.category {
            case .streak:
                progressValue = streak
            case .tasks:
                progressValue = tasksCompleted
            case .timeEarned:
                progressValue = Int(totalTimeEarned)
            case .health:
                progressValue = healthScore
            case .balance:
                progressValue = Int(currentBalance)
            case .special:
                progressValue = 0 // Special achievements have custom logic
            }

            // Update progress
            currentProgress.currentProgress = progressValue

            // Check for unlock
            if !currentProgress.isUnlocked && progressValue >= achievement.target {
                currentProgress.unlockedAt = Date()
                newUnlocks.append(achievement)
            }

            progress[achievement.id] = currentProgress
        }

        saveProgress()

        // Post notification for new unlocks
        if !newUnlocks.isEmpty {
            NotificationCenter.default.post(
                name: .achievementsUnlocked,
                object: newUnlocks
            )
        }
    }

    /// Get progress for a specific achievement
    func getProgress(for achievementId: String) -> AchievementProgress {
        progress[achievementId] ?? AchievementProgress(unlockedAt: nil, currentProgress: 0)
    }

    /// Check if achievement is unlocked
    func isUnlocked(_ achievementId: String) -> Bool {
        progress[achievementId]?.isUnlocked ?? false
    }

    /// Get progress percentage for an achievement
    func progressPercentage(for achievement: AchievementDef) -> Double {
        let current = progress[achievement.id]?.currentProgress ?? 0
        return min(Double(current) / Double(achievement.target), 1.0)
    }

    /// Get achievements by category
    func achievements(for category: AchievementCategory) -> [AchievementDef] {
        Self.allAchievements.filter { $0.category == category }
    }

    /// Get recently unlocked achievements (last 7 days)
    func recentlyUnlocked() -> [AchievementDef] {
        let weekAgo = Calendar.current.date(byAdding: .day, value: -7, to: Date()) ?? Date()
        return Self.allAchievements.filter { achievement in
            if let unlocked = progress[achievement.id]?.unlockedAt {
                return unlocked >= weekAgo
            }
            return false
        }
    }

    /// Reset all achievements (clears progress)
    func resetAllAchievements() {
        progress = [:]
        userDefaults.removeObject(forKey: progressKey)
        print("AchievementService: All achievements reset")
    }
}

// MARK: - Notifications

extension Notification.Name {
    static let achievementsUnlocked = Notification.Name("achievementsUnlocked")
}
