import Foundation

// MARK: - Task Parser Service

/// Service for parsing natural language into structured task data using OpenAI
@Observable
final class TaskParserService {
    private let baseURL = "https://api.openai.com/v1/chat/completions"
    private let model = "gpt-4o"

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

    // MARK: - Parse Task with Schedule Context

    /// Parse natural language text into structured tasks with schedule awareness
    func parseTaskWithContext(
        _ text: String,
        forDate date: Date,
        existingTasks: [TaskSummary]
    ) async throws -> TaskParsingResponse {
        guard isConfigured else {
            throw TaskParserError.notConfigured
        }

        let context = ScheduleContext(date: date, existingTasks: existingTasks)
        let systemPrompt = buildSystemPrompt(context: context)
        let userPrompt = "User said: \"\(text)\""

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
                ["role": "system", "content": systemPrompt],
                ["role": "user", "content": userPrompt]
            ],
            "temperature": 0.3,
            "max_tokens": 1500,
            "response_format": ["type": "json_object"]
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        // Make request
        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw TaskParserError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            #if DEBUG
            if let errorBody = String(data: data, encoding: .utf8) {
                print("[TaskParser] API Error \(httpResponse.statusCode): \(errorBody)")
            }
            #endif
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

        #if DEBUG
        print("[TaskParser] Raw AI response: \(cleanedContent)")
        #endif

        guard let jsonData = cleanedContent.data(using: .utf8) else {
            throw TaskParserError.invalidJSON
        }

        let result = try JSONDecoder().decode(TaskParsingResponse.self, from: jsonData)

        #if DEBUG
        print("[TaskParser] Parsed \(result.tasks.count) tasks:")
        for (index, task) in result.tasks.enumerated() {
            print("  [\(index)] \(task.title) at \(task.scheduledTime ?? "no time")")
        }
        #endif

        return result
    }

    // MARK: - Parse Task (Simple - Legacy Support)

    /// Parse natural language text into a structured task (simple, without schedule context)
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
        - scheduledTime: ISO 8601 datetime if mentioned. Current time is \(currentDateTime). If only time is given (like "at 3pm"), assume today. If time seems in the past today, assume tomorrow.
        - endTime: Calculate from duration or estimate (ISO 8601)
        - duration: Estimated duration in minutes (default to 30 if not mentioned)
        - verificationType: One of these based on the task nature:
          - "exercise" for physical activities like pushups, squats, plank, running
          - "photo_after" for tasks needing visual proof (cooking, writing)
          - "photo_before_after" for cleaning, organizing, homework progress
          - "voice" for language learning, speaking, or translation tasks
          - "step_count" for walking, jogging, or hiking tasks
          - "check" for simple tasks that just need marking complete

        User said: "\(text)"

        Respond ONLY with valid JSON in this exact format:
        {
          "title": "string",
          "description": "string or null",
          "scheduledTime": "ISO8601 string or null",
          "endTime": "ISO8601 string or null",
          "duration": number,
          "verificationType": "photo_after|photo_before_after|exercise|voice|step_count|check",
          "verificationConfig": null,
          "exerciseConfig": null,
          "voiceConfig": null,
          "stepCountConfig": null,
          "hasConflict": false,
          "conflictDetails": null
        }
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
            "max_tokens": 500,
            "response_format": ["type": "json_object"]
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        // Make request
        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw TaskParserError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            #if DEBUG
            if let errorBody = String(data: data, encoding: .utf8) {
                print("[TaskParser] API Error \(httpResponse.statusCode): \(errorBody)")
            }
            #endif
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

    // MARK: - Resolve Conflict

    /// Continue conversation to resolve a scheduling conflict
    func resolveConflict(
        conversationHistory: [(role: String, content: String)],
        userChoice: String,
        context: ScheduleContext
    ) async throws -> TaskParsingResponse {
        guard isConfigured else {
            throw TaskParserError.notConfigured
        }

        // Build messages with conversation history
        var messages: [[String: Any]] = [
            ["role": "system", "content": buildConflictResolutionPrompt(context: context)]
        ]

        for msg in conversationHistory {
            messages.append([
                "role": msg.role,
                "content": msg.content
            ])
        }

        messages.append([
            "role": "user",
            "content": "User chose: \(userChoice). Please adjust the task(s) accordingly and return the updated schedule."
        ])

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
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": 1500,
            "response_format": ["type": "json_object"]
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        // Make request
        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw TaskParserError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            #if DEBUG
            if let errorBody = String(data: data, encoding: .utf8) {
                print("[TaskParser] API Error \(httpResponse.statusCode): \(errorBody)")
            }
            #endif
            throw TaskParserError.apiError(statusCode: httpResponse.statusCode)
        }

        // Parse response
        let openAIResponse = try JSONDecoder().decode(OpenAIResponse.self, from: data)

        guard let content = openAIResponse.choices.first?.message.content else {
            throw TaskParserError.noContent
        }

        let cleanedContent = content
            .replacingOccurrences(of: "```json", with: "")
            .replacingOccurrences(of: "```", with: "")
            .trimmingCharacters(in: .whitespacesAndNewlines)

        guard let jsonData = cleanedContent.data(using: .utf8) else {
            throw TaskParserError.invalidJSON
        }

        return try JSONDecoder().decode(TaskParsingResponse.self, from: jsonData)
    }

    // MARK: - System Prompt Builder

    private func buildSystemPrompt(context: ScheduleContext) -> String {
        let now = Date()
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd HH:mm"
        dateFormatter.timeZone = TimeZone.current

        // Format for ISO dates
        let isoDateFormatter = DateFormatter()
        isoDateFormatter.dateFormat = "yyyy-MM-dd"
        isoDateFormatter.timeZone = TimeZone.current

        // Use SELECTED date as default (what user is viewing), not today
        let selectedDateISO = isoDateFormatter.string(from: context.date)
        let todayISO = isoDateFormatter.string(from: now)

        // Simplify existing tasks to reduce token count - just time and title
        let existingTasksSimple = context.existingTasks.prefix(10).map { task in
            "\(task.startTime.prefix(16)): \(task.title)"
        }.joined(separator: "\n")

        return """
        Respond with valid JSON only. Parse user input into tasks.

        TODAY: \(todayISO). SELECTED DATE: \(selectedDateISO). Timezone: \(context.userTimezone).

        EXISTING TASKS ON \(selectedDateISO):
        \(existingTasksSimple.isEmpty ? "none" : existingTasksSimple)

        RULES:
        - Multiple tasks = multiple objects in "tasks" array
        - No date specified = use SELECTED DATE (\(selectedDateISO))
        - Time format: \(selectedDateISO)T09:00:00 (NO "Z" suffix!)
        - If task overlaps existing task or has same title+time = hasConflict:true

        Task fields: title, description, scheduledTime, endTime, duration (mins), verificationType (photo_after|photo_before_after|exercise|voice|step_count|check), verificationConfig, exerciseConfig, voiceConfig, stepCountConfig, hasConflict, conflictDetails

        For exercise: exerciseConfig {exerciseType, targetReps or targetDuration}
        For step_count: stepCountConfig {targetSteps}

        Response: {"tasks":[...],"hasConflicts":bool,"conflictDetails":null,"suggestedResolutions":null,"requiresUserInput":false,"promptForUser":null}
        """
    }

    private func buildConflictResolutionPrompt(context: ScheduleContext) -> String {
        let existingTasksJson: String
        if let data = try? JSONEncoder().encode(context.existingTasks),
           let json = String(data: data, encoding: .utf8) {
            existingTasksJson = json
        } else {
            existingTasksJson = "[]"
        }

        return """
        You are resolving a scheduling conflict. The user has chosen how to handle it.

        CURRENT SCHEDULE:
        \(existingTasksJson)

        Based on the user's choice, adjust the task(s) accordingly and return the final schedule.

        Return a JSON object with the same structure:
        {
          "tasks": [...],
          "hasConflicts": false,
          "conflictDetails": null,
          "suggestedResolutions": null,
          "requiresUserInput": false,
          "promptForUser": null
        }

        Make sure the adjusted tasks no longer conflict with existing schedule.
        """
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
