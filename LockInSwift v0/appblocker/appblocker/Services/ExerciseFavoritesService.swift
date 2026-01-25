import Foundation
import SwiftUI

/// Service for managing exercise favorites
/// - Maximum of 4 favorites allowed
/// - Double tap to add/remove favorites
/// - Persisted to UserDefaults
@Observable
final class ExerciseFavoritesService {
    private let favoritesKey = "exercise_favorites"
    private let maxFavorites = 4

    /// Current list of favorite exercise types
    private(set) var favorites: [ExerciseType] = []

    init() {
        loadFavorites()
    }

    // MARK: - Public API

    /// Toggle favorite status for an exercise type
    /// - Returns: Tuple with updated favorites and whether it was added (true) or removed (false), nil if at max and tried to add
    @discardableResult
    func toggleFavorite(_ type: ExerciseType) -> (favorites: [ExerciseType], added: Bool?) {
        guard type.isFavoritable else {
            return (favorites, nil)
        }

        if let index = favorites.firstIndex(of: type) {
            // Remove from favorites
            favorites.remove(at: index)
            saveFavorites()
            return (favorites, false)
        } else if favorites.count < maxFavorites {
            // Add to favorites
            favorites.append(type)
            saveFavorites()
            return (favorites, true)
        }

        // Max favorites reached, can't add
        return (favorites, nil)
    }

    /// Check if an exercise type is a favorite
    func isFavorite(_ type: ExerciseType) -> Bool {
        favorites.contains(type)
    }

    /// Check if we can add more favorites
    var canAddMore: Bool {
        favorites.count < maxFavorites
    }

    /// Number of remaining favorite slots
    var remainingSlots: Int {
        maxFavorites - favorites.count
    }

    /// Get exercises to show in quick actions (favorites or defaults)
    var quickActionExercises: [ExerciseType] {
        if favorites.isEmpty {
            // Default exercises if no favorites set
            return [.pushups, .squats, .plank]
        }
        return favorites
    }

    // MARK: - Private

    private func loadFavorites() {
        guard let data = UserDefaults.standard.data(forKey: favoritesKey),
              let rawValues = try? JSONDecoder().decode([String].self, from: data) else {
            favorites = []
            return
        }

        favorites = rawValues.compactMap { ExerciseType(rawValue: $0) }
    }

    private func saveFavorites() {
        let rawValues = favorites.map { $0.rawValue }
        if let data = try? JSONEncoder().encode(rawValues) {
            UserDefaults.standard.set(data, forKey: favoritesKey)
        }
    }
}
