

import Foundation
import UIKit
import Observation

/// OpenAI API service for photo task verification
@Observable
final class OpenAIService {
    // MARK: - Configuration

    private let baseURL = "https://api.openai.com/v1/chat/completions"
    private let model = "gpt-4o"
    private let configURL = "https://www.fibipals.com/api/apps/appBlocker/config"

    // Get API key with priority: stored > Info.plist > environment
    private var apiKey: String {
        // First check if we have a key from backend (stored in UserDefaults)
        if let storedKey = UserDefaults.standard.string(forKey: "openai_api_key"), !storedKey.isEmpty {
            return storedKey
        }
        // Then check Info.plist (set via .xcconfig or build settings)
        if let plistKey = Bundle.main.object(forInfoDictionaryKey: "OPENAI_API_KEY") as? String, !plistKey.isEmpty {
            return plistKey
        }
        // Finally check environment variable
        if let envKey = ProcessInfo.processInfo.environment["OPENAI_API_KEY"], !envKey.isEmpty {
            return envKey
        }
        return ""
    }

    var isConfigured: Bool {
        !apiKey.isEmpty
    }

    // MARK: - Fetch Key from Backend

    /// Fetch OpenAI API key from backend (call after login)
    func fetchAPIKeyFromBackend(authToken: String) async {
        guard let url = URL(string: configURL) else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")

        do {
            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                print("[OpenAI] Failed to fetch config from backend, using fallback key")
                return
            }

            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let openAIKey = json["openaiApiKey"] as? String, !openAIKey.isEmpty {
                UserDefaults.standard.set(openAIKey, forKey: "openai_api_key")
                print("[OpenAI] Successfully fetched API key from backend")
            }
        } catch {
            print("[OpenAI] Error fetching config: \(error.localizedDescription)")
        }
    }

    // MARK: - Result Types

    struct TaskVerificationResult {
        let isCompleted: Bool
        let confidence: Int  // 0-100 (internal use only)
        let humanMessage: String  // Natural, friendly message
        let detectedChanges: [String]
        let recommendedReward: Int  // 5, 10, or 15 minutes based on task difficulty
    }

    struct ChatMessage: Identifiable {
        let id = UUID()
        let role: Role
        let content: String
        let image: UIImage?
        let timestamp = Date()

        enum Role {
            case user
            case coach
            case system
        }
    }

    // MARK: - Task Verification

    /// Verify a photo task by comparing before and after images (or just after image)
    func verifyTask(
        beforeImage: UIImage?,  // Optional - some tasks don't need before photo
        afterImage: UIImage,
        taskDescription: String
    ) async throws -> TaskVerificationResult {
        guard isConfigured else {
            throw OpenAIError.notConfigured
        }

        let afterBase64 = imageToBase64(afterImage)

        // Build message content based on whether we have a before image
        var contentItems: [[String: Any]] = []

        if let before = beforeImage {
            // Before/after comparison mode
            let beforeBase64 = imageToBase64(before)
            contentItems = [
                [
                    "type": "text",
                    "text": "Task: \"\(taskDescription)\"\n\nHere's my before photo (first) and after photo (second). Did I complete the task?"
                ],
                [
                    "type": "image_url",
                    "image_url": [
                        "url": "data:image/jpeg;base64,\(beforeBase64)",
                        "detail": "high"
                    ]
                ],
                [
                    "type": "image_url",
                    "image_url": [
                        "url": "data:image/jpeg;base64,\(afterBase64)",
                        "detail": "high"
                    ]
                ]
            ]
        } else {
            // Single photo mode (just proof of completion)
            contentItems = [
                [
                    "type": "text",
                    "text": "Task: \"\(taskDescription)\"\n\nHere's a photo showing I completed my task. Does it look like the task was done?"
                ],
                [
                    "type": "image_url",
                    "image_url": [
                        "url": "data:image/jpeg;base64,\(afterBase64)",
                        "detail": "high"
                    ]
                ]
            ]
        }

        let systemPrompt = beforeImage != nil ? """
            You are a friendly task verification coach. Your job is to compare two photos (before and after) and determine if the user completed their task.

            CRITICAL: Be warm, encouraging, and human. Never mention technical terms like "confidence", "percentage", "verification score", or "analysis complete".

            Also decide a reward based on task difficulty:
            - Easy tasks (quick cleanup, simple organizing): 5 minutes
            - Medium tasks (cleaning room, homework, reading): 10 minutes
            - Hard tasks (major cleaning, cooking full meal, extensive work): 15 minutes

            Respond with JSON only:
            {
              "isCompleted": boolean,
              "confidence": number (0-100, internal use only),
              "humanMessage": "A natural, friendly message like a supportive friend would say",
              "detectedChanges": ["list of changes you noticed"],
              "recommendedReward": number (5, 10, or 15 based on effort/difficulty)
            }

            Examples of good humanMessage responses:
            - If completed: "Nice work! I can see you really cleaned up that desk. Looking sharp!"
            - If completed: "Awesome job! The room looks so much better now!"
            - If not clear: "Hmm, I'm having trouble seeing the changes. Can you take another photo from a different angle?"
            - If not completed: "Looks pretty similar to before... did you get a chance to finish?"

            Be encouraging but honest. Never be robotic or technical.
            """ : """
            You are a friendly task verification coach. The user is showing you a photo as proof they completed a task. Look at the photo and determine if it shows evidence of the task being done.

            CRITICAL: Be warm, encouraging, and human. Since there's no "before" photo, be more lenient - if the photo shows anything relevant to the task, give them credit. For tasks like "workout", "cook a meal", etc., accept selfies at gym, photos of food, etc.

            Also decide a reward based on task difficulty:
            - Easy tasks (quick photo, minimal effort shown): 5 minutes
            - Medium tasks (workout selfie, cooking, writing): 10 minutes
            - Hard tasks (intense workout, complex meal, lots of pages written): 15 minutes

            Respond with JSON only:
            {
              "isCompleted": boolean,
              "confidence": number (0-100, internal use only),
              "humanMessage": "A natural, friendly message like a supportive friend would say",
              "detectedChanges": ["list of what you see in the photo"],
              "recommendedReward": number (5, 10, or 15 based on effort/difficulty)
            }

            Examples of good humanMessage responses:
            - If completed: "Looking good! I can see you got that workout done!"
            - If completed: "Yum, that meal looks great! Nice cooking!"
            - If not clear: "I can't quite see what you did. Can you show me a better angle?"

            Be encouraging and give benefit of the doubt. Never be robotic or technical.
            """

        let messages: [[String: Any]] = [
            [
                "role": "system",
                "content": systemPrompt
            ],
            [
                "role": "user",
                "content": contentItems
            ]
        ]

        let response = try await makeRequest(messages: messages, temperature: 0.7, maxTokens: 500)

        // Parse JSON response
        guard let jsonData = extractJSON(from: response).data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any] else {
            throw OpenAIError.invalidResponse
        }

        return TaskVerificationResult(
            isCompleted: json["isCompleted"] as? Bool ?? false,
            confidence: json["confidence"] as? Int ?? 0,
            humanMessage: json["humanMessage"] as? String ?? "I couldn't analyze the photo properly. Want to try again?",
            detectedChanges: json["detectedChanges"] as? [String] ?? [],
            recommendedReward: json["recommendedReward"] as? Int ?? 10  // Default to 10 mins
        )
    }

    // MARK: - Chat Response

    /// Generate a natural coach response in conversation
    func generateChatResponse(
        userMessage: String,
        taskDescription: String,
        conversationHistory: [ChatMessage],
        beforeImage: UIImage?,
        afterImage: UIImage?
    ) async throws -> String {
        guard isConfigured else {
            throw OpenAIError.notConfigured
        }

        // Build conversation context
        var historyText = ""
        for msg in conversationHistory.suffix(6) {  // Last 6 messages
            let role = msg.role == .user ? "User" : "Coach"
            historyText += "\(role): \(msg.content)\n"
        }

        let systemPrompt = """
        You are a friendly, supportive task verification coach having a chat with someone about their task.

        Task they're working on: "\(taskDescription)"

        BE NATURAL AND HUMAN:
        - Talk like a supportive friend, not a robot
        - Keep responses short (1-2 sentences)
        - Never mention "confidence", "verification", "analysis", or technical terms
        - Be encouraging but also honest
        - If they're frustrated, be understanding
        - If they say they're done, ask for an after photo if you haven't seen one

        Previous conversation:
        \(historyText)

        Respond naturally to their message. Just return your response text, no JSON.
        """

        var content: [[String: Any]] = [
            ["type": "text", "text": "User says: \"\(userMessage)\""]
        ]

        // Add images if available
        if let before = beforeImage {
            content.append([
                "type": "image_url",
                "image_url": [
                    "url": "data:image/jpeg;base64,\(imageToBase64(before))",
                    "detail": "low"
                ]
            ])
        }
        if let after = afterImage {
            content.append([
                "type": "image_url",
                "image_url": [
                    "url": "data:image/jpeg;base64,\(imageToBase64(after))",
                    "detail": "low"
                ]
            ])
        }

        let messages: [[String: Any]] = [
            ["role": "system", "content": systemPrompt],
            ["role": "user", "content": content]
        ]

        return try await makeRequest(messages: messages, temperature: 0.8, maxTokens: 150)
    }

    // MARK: - API Request

    private func makeRequest(messages: [[String: Any]], temperature: Double, maxTokens: Int) async throws -> String {
        guard let url = URL(string: baseURL) else {
            throw OpenAIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")

        let body: [String: Any] = [
            "model": model,
            "messages": messages,
            "max_tokens": maxTokens,
            "temperature": temperature
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw OpenAIError.networkError
        }

        if httpResponse.statusCode != 200 {
            if let errorJson = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let error = errorJson["error"] as? [String: Any],
               let message = error["message"] as? String {
                throw OpenAIError.apiError(message)
            }
            throw OpenAIError.apiError("Status code: \(httpResponse.statusCode)")
        }

        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let choices = json["choices"] as? [[String: Any]],
              let first = choices.first,
              let message = first["message"] as? [String: Any],
              let content = message["content"] as? String else {
            throw OpenAIError.invalidResponse
        }

        return content
    }

    // MARK: - Helpers

    private func imageToBase64(_ image: UIImage) -> String {
        // Resize image to reduce API costs
        let maxSize: CGFloat = 1024
        let resized = resizeImage(image, maxDimension: maxSize)

        guard let data = resized.jpegData(compressionQuality: 0.8) else {
            return ""
        }
        return data.base64EncodedString()
    }

    private func resizeImage(_ image: UIImage, maxDimension: CGFloat) -> UIImage {
        let size = image.size
        let ratio = min(maxDimension / size.width, maxDimension / size.height)

        if ratio >= 1 {
            return image
        }

        let newSize = CGSize(width: size.width * ratio, height: size.height * ratio)
        let renderer = UIGraphicsImageRenderer(size: newSize)

        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: newSize))
        }
    }

    private func extractJSON(from text: String) -> String {
        // Find JSON object in response
        if let start = text.firstIndex(of: "{"),
           let end = text.lastIndex(of: "}") {
            return String(text[start...end])
        }
        return "{}"
    }

    // MARK: - Configuration

    func setAPIKey(_ key: String) {
        UserDefaults.standard.set(key, forKey: "openai_api_key")
    }
}

// MARK: - Errors

enum OpenAIError: LocalizedError {
    case notConfigured
    case invalidURL
    case networkError
    case invalidResponse
    case apiError(String)

    var errorDescription: String? {
        switch self {
        case .notConfigured:
            return "OpenAI API key not configured"
        case .invalidURL:
            return "Invalid API URL"
        case .networkError:
            return "Network error occurred"
        case .invalidResponse:
            return "Invalid response from API"
        case .apiError(let message):
            return "API Error: \(message)"
        }
    }
}
