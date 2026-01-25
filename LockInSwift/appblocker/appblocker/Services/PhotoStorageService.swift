import Foundation
import UIKit

/// Service for managing task verification photos with compression and automatic cleanup
@Observable
final class PhotoStorageService {

    // MARK: - Configuration

    struct Config {
        static let maxWidth: CGFloat = 800        // Compress to max 800px wide
        static let compressionQuality: CGFloat = 0.5  // 50% JPEG quality
        static let retentionDays: Int = 14        // Auto-delete after 2 weeks
        static let maxSizeKB: Int = 200           // Target ~200KB per image
        static let photosDirectoryName = "TaskPhotos"
    }

    // MARK: - Properties

    private let fileManager = FileManager.default
    private var photosDirectory: URL {
        let documentsPath = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
        return documentsPath.appendingPathComponent(Config.photosDirectoryName)
    }

    // MARK: - Initialization

    init() {
        createPhotosDirectoryIfNeeded()
        cleanupOldPhotos()
    }

    // MARK: - Public Methods

    /// Save a photo with compression, returns the file path
    func savePhoto(_ image: UIImage, for taskId: UUID, type: PhotoType) async throws -> String {
        // Compress the image
        let compressedData = try compressImage(image)

        // Generate filename
        let filename = "\(taskId.uuidString)_\(type.rawValue)_\(Int(Date().timeIntervalSince1970)).jpg"
        let filePath = photosDirectory.appendingPathComponent(filename)

        // Save to disk
        try compressedData.write(to: filePath)

        return filePath.path
    }

    /// Load a photo from path
    func loadPhoto(from path: String) -> UIImage? {
        guard let data = try? Data(contentsOf: URL(fileURLWithPath: path)) else {
            return nil
        }
        return UIImage(data: data)
    }

    /// Delete a photo
    func deletePhoto(at path: String) throws {
        let url = URL(fileURLWithPath: path)
        if fileManager.fileExists(atPath: path) {
            try fileManager.removeItem(at: url)
        }
    }

    /// Delete all photos for a task
    func deletePhotos(for taskId: UUID) throws {
        let prefix = taskId.uuidString
        let contents = try fileManager.contentsOfDirectory(at: photosDirectory, includingPropertiesForKeys: nil)

        for file in contents where file.lastPathComponent.hasPrefix(prefix) {
            try fileManager.removeItem(at: file)
        }
    }

    /// Get all photo paths for a task
    func getPhotoPaths(for taskId: UUID) -> [String] {
        let prefix = taskId.uuidString

        guard let contents = try? fileManager.contentsOfDirectory(at: photosDirectory, includingPropertiesForKeys: nil) else {
            return []
        }

        return contents
            .filter { $0.lastPathComponent.hasPrefix(prefix) }
            .map { $0.path }
    }

    /// Clean up photos older than retention period
    func cleanupOldPhotos() {
        let cutoffDate = Calendar.current.date(byAdding: .day, value: -Config.retentionDays, to: Date()) ?? Date()

        guard let contents = try? fileManager.contentsOfDirectory(
            at: photosDirectory,
            includingPropertiesForKeys: [.creationDateKey]
        ) else {
            return
        }

        for file in contents {
            guard let attributes = try? fileManager.attributesOfItem(atPath: file.path),
                  let creationDate = attributes[.creationDate] as? Date else {
                continue
            }

            if creationDate < cutoffDate {
                try? fileManager.removeItem(at: file)
            }
        }
    }

    /// Get storage statistics
    func getStorageStats() -> StorageStats {
        guard let contents = try? fileManager.contentsOfDirectory(
            at: photosDirectory,
            includingPropertiesForKeys: [.fileSizeKey]
        ) else {
            return StorageStats(photoCount: 0, totalSizeKB: 0)
        }

        var totalSize: Int64 = 0
        for file in contents {
            if let attributes = try? fileManager.attributesOfItem(atPath: file.path),
               let size = attributes[.size] as? Int64 {
                totalSize += size
            }
        }

        return StorageStats(
            photoCount: contents.count,
            totalSizeKB: Int(totalSize / 1024)
        )
    }

    // MARK: - Private Methods

    private func createPhotosDirectoryIfNeeded() {
        if !fileManager.fileExists(atPath: photosDirectory.path) {
            try? fileManager.createDirectory(at: photosDirectory, withIntermediateDirectories: true)
        }
    }

    private func compressImage(_ image: UIImage) throws -> Data {
        // First, resize if needed
        let resizedImage = resizeImageIfNeeded(image)

        // Start with configured compression quality
        var quality = Config.compressionQuality

        // Try to get under target size
        guard var data = resizedImage.jpegData(compressionQuality: quality) else {
            throw PhotoStorageError.compressionFailed
        }

        let targetBytes = Config.maxSizeKB * 1024

        // Iteratively reduce quality if needed
        while data.count > targetBytes && quality > 0.1 {
            quality -= 0.1
            guard let newData = resizedImage.jpegData(compressionQuality: quality) else {
                break
            }
            data = newData
        }

        return data
    }

    private func resizeImageIfNeeded(_ image: UIImage) -> UIImage {
        let maxWidth = Config.maxWidth

        guard image.size.width > maxWidth else {
            return image
        }

        let scale = maxWidth / image.size.width
        let newHeight = image.size.height * scale
        let newSize = CGSize(width: maxWidth, height: newHeight)

        let renderer = UIGraphicsImageRenderer(size: newSize)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: newSize))
        }
    }
}

// MARK: - Supporting Types

extension PhotoStorageService {

    enum PhotoType: String {
        case before = "before"
        case after = "after"
        case proof = "proof"
    }

    enum PhotoStorageError: Error, LocalizedError {
        case compressionFailed
        case saveFailed
        case photoNotFound

        var errorDescription: String? {
            switch self {
            case .compressionFailed:
                return "Failed to compress image"
            case .saveFailed:
                return "Failed to save photo"
            case .photoNotFound:
                return "Photo not found"
            }
        }
    }

    struct StorageStats {
        let photoCount: Int
        let totalSizeKB: Int

        var formattedSize: String {
            if totalSizeKB >= 1024 {
                let mb = Double(totalSizeKB) / 1024.0
                return String(format: "%.1f MB", mb)
            }
            return "\(totalSizeKB) KB"
        }
    }
}
