import Foundation

// MARK: - Task Parse Result

struct TaskParseResult: Codable {
    let title: String
    let description: String?
    let scheduledTime: String? // ISO 8601 format
    let duration: Int? // minutes
    let verificationType: String? // "photo", "exercise", "check"

    enum CodingKeys: String, CodingKey {
        case title
        case description
        case scheduledTime = "scheduled_time"
        case duration
        case verificationType = "verification_type"
    }
}

// MARK: - Task Parser Service

/// Service for parsing natural language into structured task data using OpenAI
final class TaskParserService {
    private let baseURL = "https://api.openai.com/v1/chat/completions"
    private let model = "gpt-3.5-turbo"

    // Get API key from UserDefaults (set by OpenAIService)
    private var apiKey: String {
        UserDefaults.standard.string(forKey: "openai_api_key") ?? ""
    }

    var isConfigured: Bool {
        !apiKey.isEmpty
    }

    // MARK: - Parse Task from Text

    /// Parse natural language text into a structured task
    func parseTaskFromText(_ text: String) async throws -> TaskParseResult {
        guard isConfigured else {
            throw TaskParserError.notConfigured
        }

        let currentDateTime = ISO8601DateFormatter().string(from: Date())
        let calendar = Calendar.current
        let hour = calendar.component(.hour, from: Date())

        let prompt = """
        Parse this user input into a task. Extract the following fields:
        - title: A short, clear task name (max 5 words)
        - description: Optional additional details (null if none)
        - scheduled_time: ISO 8601 datetime if mentioned. Current time is \(currentDateTime). If only time is given (like "at 3pm"), assume today. If time seems in the past today, assume tomorrow.
        - duration: Estimated duration in minutes (default to 30 if not mentioned)
        - verification_type: One of "photo", "exercise", or "check" based on the task nature:
          - "exercise" for physical activities like pushups, squats, plank, running
          - "photo" for tasks that need visual proof (cleaning, organizing, cooking)
          - "check" for simple tasks that just need marking complete

        User said: "\(text)"

        Respond ONLY with valid JSON in this exact format, no other text:
        {"title": "string", "description": "string or null", "scheduled_time": "ISO8601 string or null", "duration": number, "verification_type": "photo|exercise|check"}
        """

        // Build request
        guard let url = URL(string: baseURL) else {
            throw TaskParserError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "model": model,
            "messages": [
                ["role": "system", "content": "You are a task parser. You extract structured task data from natural language. Respond only with valid JSON, no markdown, no explanation."],
                ["role": "user", "content": prompt]
            ],
            "temperature": 0.3,
            "max_tokens": 200
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        // Make request
        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw TaskParserError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw TaskParserError.apiError(statusCode: httpResponse.statusCode)
        }

        // Parse response
        let openAIResponse = try JSONDecoder().decode(OpenAIResponse.self, from: data)

        guard let content = openAIResponse.choices.first?.message.content else {
            throw TaskParserError.noContent
        }

        // Clean up the content (remove markdown code blocks if present)
        let cleanedContent = content
            .replacingOccurrences(of: "```json", with: "")
            .replacingOccurrences(of: "```", with: "")
            .trimmingCharacters(in: .whitespacesAndNewlines)

        guard let jsonData = cleanedContent.data(using: .utf8) else {
            throw TaskParserError.invalidJSON
        }

        let result = try JSONDecoder().decode(TaskParseResult.self, from: jsonData)
        return result
    }
}

// MARK: - OpenAI Response Types

private struct OpenAIResponse: Codable {
    let choices: [Choice]

    struct Choice: Codable {
        let message: Message

        struct Message: Codable {
            let content: String
        }
    }
}

// MARK: - Errors

enum TaskParserError: LocalizedError {
    case notConfigured
    case invalidURL
    case invalidResponse
    case apiError(statusCode: Int)
    case noContent
    case invalidJSON

    var errorDescription: String? {
        switch self {
        case .notConfigured:
            return "Task parser is not configured. API key missing."
        case .invalidURL:
            return "Invalid API URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .apiError(let statusCode):
            return "API error with status code: \(statusCode)"
        case .noContent:
            return "No content in response"
        case .invalidJSON:
            return "Could not parse response as JSON"
        }
    }
}
