import Foundation
import SwiftData

@Model
final class AIConversation {
    @Attribute(.unique) var id: UUID

    // MARK: - Properties
    var purposeRaw: String            // ConversationPurpose raw value
    var statusRaw: String             // ConversationStatus raw value
    var createdAt: Date
    var resolvedAt: Date?

    // MARK: - Related Entities
    var relatedTaskId: UUID?
    var relatedDate: Date?            // For schedule context

    // MARK: - Computed Properties

    var purpose: ConversationPurpose {
        get { ConversationPurpose(rawValue: purposeRaw) ?? .taskParsing }
        set { purposeRaw = newValue.rawValue }
    }

    var status: ConversationStatus {
        get { ConversationStatus(rawValue: statusRaw) ?? .active }
        set { statusRaw = newValue.rawValue }
    }

    var isActive: Bool {
        status == .active
    }

    // MARK: - Initializer

    init(
        id: UUID = UUID(),
        purpose: ConversationPurpose,
        relatedTaskId: UUID? = nil,
        relatedDate: Date? = nil
    ) {
        self.id = id
        self.purposeRaw = purpose.rawValue
        self.statusRaw = ConversationStatus.active.rawValue
        self.relatedTaskId = relatedTaskId
        self.relatedDate = relatedDate
        self.createdAt = Date()
    }

    // MARK: - Methods

    func markResolved() {
        status = .resolved
        resolvedAt = Date()
    }

    func markCancelled() {
        status = .cancelled
        resolvedAt = Date()
    }
}

// MARK: - Conversation Purpose

enum ConversationPurpose: String, Codable, CaseIterable {
    case taskParsing = "task_parsing"
    case conflictResolution = "conflict_resolution"
    case verification = "verification"
    case taskClarification = "task_clarification"

    var displayName: String {
        switch self {
        case .taskParsing: return "Task Parsing"
        case .conflictResolution: return "Conflict Resolution"
        case .verification: return "Verification"
        case .taskClarification: return "Task Clarification"
        }
    }
}

// MARK: - Conversation Status

enum ConversationStatus: String, Codable, CaseIterable {
    case active = "active"
    case resolved = "resolved"
    case cancelled = "cancelled"

    var displayName: String {
        switch self {
        case .active: return "Active"
        case .resolved: return "Resolved"
        case .cancelled: return "Cancelled"
        }
    }
}

// MARK: - AI Message Model

@Model
final class AIMessage {
    @Attribute(.unique) var id: UUID

    // MARK: - Properties
    var conversationId: UUID
    var roleRaw: String               // MessageRole raw value
    var content: String
    var timestamp: Date
    var order: Int                    // Message order in conversation

    // MARK: - Images
    var hasImages: Bool
    var imageReferences: [String]?    // Paths or identifiers

    // MARK: - Parsed Result (if assistant response contains structured data)
    var parsedResultData: Data?       // JSON encoded TaskParseResult[]

    // MARK: - Computed Properties

    var role: MessageRole {
        get { MessageRole(rawValue: roleRaw) ?? .user }
        set { roleRaw = newValue.rawValue }
    }

    var parsedResults: [TaskParseResult]? {
        get {
            guard let data = parsedResultData else { return nil }
            return try? JSONDecoder().decode([TaskParseResult].self, from: data)
        }
        set {
            parsedResultData = try? JSONEncoder().encode(newValue)
        }
    }

    // MARK: - Initializer

    init(
        id: UUID = UUID(),
        conversationId: UUID,
        role: MessageRole,
        content: String,
        order: Int,
        hasImages: Bool = false,
        imageReferences: [String]? = nil
    ) {
        self.id = id
        self.conversationId = conversationId
        self.roleRaw = role.rawValue
        self.content = content
        self.order = order
        self.hasImages = hasImages
        self.imageReferences = imageReferences
        self.timestamp = Date()
    }
}

// MARK: - Message Role

enum MessageRole: String, Codable, CaseIterable {
    case user = "user"
    case assistant = "assistant"
    case system = "system"
}
