import Foundation
import SwiftData
import HealthKit

/// Main service for managing scheduled tasks, AI parsing, conflict resolution, and verification
@Observable
final class ScheduleService {

    // MARK: - Properties

    private var modelContext: ModelContext?
    private let openAIService: OpenAIService
    private let photoStorageService: PhotoStorageService

    // HealthKit for step counting
    private let healthStore = HKHealthStore()
    private var stepCountQuery: HKObserverQuery?

    // Active verification sessions
    var activeSession: VerificationSession?

    // MARK: - Initialization

    init(openAIService: OpenAIService, photoStorageService: PhotoStorageService) {
        self.openAIService = openAIService
        self.photoStorageService = photoStorageService
    }

    func setModelContext(_ context: ModelContext) {
        self.modelContext = context
    }

    // MARK: - Task CRUD Operations

    /// Create a new task from a parse result
    @MainActor
    func createTask(from parseResult: TaskParseResult, forDate date: Date, conversationId: UUID? = nil) throws -> ScheduledTask {
        guard let context = modelContext else {
            throw ScheduleServiceError.noModelContext
        }

        var startTime = parseResult.scheduledDate(fallback: date)
        var endTime = parseResult.endDate(fallback: date)

        // FAILSAFE: Validate and adjust past dates/times
        let now = Date()
        let calendar = Calendar.current

        // Check if the date is in the past (before today)
        let startOfToday = calendar.startOfDay(for: now)
        let startOfTaskDay = calendar.startOfDay(for: startTime)

        if startOfTaskDay < startOfToday {
            // Task is scheduled for a past day - reject it
            throw ScheduleServiceError.pastDateNotAllowed
        }

        // Check if the time has already passed today
        if calendar.isDateInToday(startTime) && startTime < now {
            // Time has passed - auto-adjust to tomorrow at the same time
            if let adjustedStart = calendar.date(byAdding: .day, value: 1, to: startTime),
               let adjustedEnd = calendar.date(byAdding: .day, value: 1, to: endTime) {
                startTime = adjustedStart
                endTime = adjustedEnd
                #if DEBUG
                print("[ScheduleService] Time already passed - adjusted to tomorrow")
                #endif
            }
        }

        let duration = parseResult.duration ?? Int(endTime.timeIntervalSince(startTime) / 60)

        #if DEBUG
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd HH:mm"
        print("[ScheduleService] createTask:")
        print("  - parseResult.scheduledTime: \(parseResult.scheduledTime ?? "nil")")
        print("  - fallback date: \(df.string(from: date))")
        print("  - resulting startTime: \(df.string(from: startTime))")
        print("  - resulting scheduledDate: \(df.string(from: Calendar.current.startOfDay(for: startTime)))")
        #endif

        // Check for duplicate task (same title at same time)
        let titleToCheck = parseResult.title.lowercased()
        let timeWindow: TimeInterval = 60 // 1 minute tolerance
        let windowStart = startTime.addingTimeInterval(-timeWindow)
        let windowEnd = startTime.addingTimeInterval(timeWindow)

        let duplicatePredicate = #Predicate<ScheduledTask> { task in
            task.startTime >= windowStart && task.startTime <= windowEnd
        }
        let duplicateDescriptor = FetchDescriptor<ScheduledTask>(predicate: duplicatePredicate)

        if let existingTasks = try? context.fetch(duplicateDescriptor) {
            let isDuplicate = existingTasks.contains { $0.title.lowercased() == titleToCheck }
            if isDuplicate {
                #if DEBUG
                print("[ScheduleService] Duplicate task detected: \(parseResult.title) at \(startTime)")
                #endif
                throw ScheduleServiceError.duplicateTask
            }
        }

        let task = ScheduledTask(
            title: parseResult.title,
            taskDescription: parseResult.description,
            scheduledDate: Calendar.current.startOfDay(for: startTime),
            startTime: startTime,
            endTime: endTime,
            duration: duration,
            verificationType: parseResult.verificationType
        )

        // Set verification config
        task.verificationConfig = parseResult.verificationConfig

        // Set exercise config if applicable
        if let exerciseConfig = parseResult.exerciseConfig {
            task.exerciseType = exerciseConfig.exerciseVerificationType
            task.targetReps = exerciseConfig.targetReps
            task.targetDuration = exerciseConfig.targetDuration
        }

        // Set voice config if applicable
        if let voiceConfig = parseResult.voiceConfig {
            task.voicePrompt = voiceConfig.prompt
        }

        // Set step count config if applicable
        if let stepCountConfig = parseResult.stepCountConfig {
            task.targetSteps = stepCountConfig.targetSteps
        }

        task.parsingConversationId = conversationId

        context.insert(task)
        try context.save()

        return task
    }

    /// Get all tasks for a specific date
    func getTasksForDate(_ date: Date) -> [ScheduledTask] {
        guard let context = modelContext else { return [] }

        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        guard let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay) else {
            return []
        }

        let predicate = #Predicate<ScheduledTask> { task in
            task.scheduledDate >= startOfDay && task.scheduledDate < endOfDay
        }

        let descriptor = FetchDescriptor<ScheduledTask>(
            predicate: predicate,
            sortBy: [SortDescriptor(\.startTime)]
        )

        return (try? context.fetch(descriptor)) ?? []
    }

    /// Get tasks for a date range
    func getTasksForDateRange(from startDate: Date, to endDate: Date) -> [ScheduledTask] {
        guard let context = modelContext else { return [] }

        let predicate = #Predicate<ScheduledTask> { task in
            task.scheduledDate >= startDate && task.scheduledDate <= endDate
        }

        let descriptor = FetchDescriptor<ScheduledTask>(
            predicate: predicate,
            sortBy: [SortDescriptor(\.startTime)]
        )

        return (try? context.fetch(descriptor)) ?? []
    }

    /// Update task status
    @MainActor
    func updateTaskStatus(_ taskId: UUID, status: ScheduledTaskStatus) throws {
        guard let context = modelContext else {
            throw ScheduleServiceError.noModelContext
        }

        let predicate = #Predicate<ScheduledTask> { task in
            task.id == taskId
        }

        let descriptor = FetchDescriptor<ScheduledTask>(predicate: predicate)

        guard let task = try context.fetch(descriptor).first else {
            throw ScheduleServiceError.taskNotFound
        }

        task.status = status
        task.updatedAt = Date()

        if status == ScheduledTaskStatus.completed {
            task.completedAt = Date()
        }

        try context.save()
    }

    /// Delete a task
    @MainActor
    func deleteTask(_ taskId: UUID) throws {
        guard let context = modelContext else {
            throw ScheduleServiceError.noModelContext
        }

        let predicate = #Predicate<ScheduledTask> { task in
            task.id == taskId
        }

        let descriptor = FetchDescriptor<ScheduledTask>(predicate: predicate)

        guard let task = try context.fetch(descriptor).first else {
            throw ScheduleServiceError.taskNotFound
        }

        // Clean up photos
        try? photoStorageService.deletePhotos(for: taskId)

        context.delete(task)
        try context.save()
    }

    // MARK: - AI Parsing

    /// Parse user input and return structured tasks
    func parseUserInput(_ input: String, forDate date: Date) async throws -> TaskParsingResponse {
        // Get existing tasks for context
        let existingTasks = getTasksForDate(date)
        let context = ScheduleContext(
            date: date,
            existingTasks: existingTasks.map { TaskSummary(from: $0) }
        )

        // Create conversation
        let conversation = try await createConversation(purpose: .taskParsing, relatedDate: date)

        // Add user message
        try await addMessage(to: conversation.id, role: .user, content: input)

        // Build system prompt with schedule context
        let systemPrompt = buildParsingSystemPrompt(context: context)

        // Call OpenAI
        let response = try await openAIService.parseTaskWithContext(
            userInput: input,
            systemPrompt: systemPrompt
        )

        // Parse the response
        guard let data = response.data(using: .utf8),
              let parsingResponse = try? JSONDecoder().decode(TaskParsingResponse.self, from: data) else {
            throw ScheduleServiceError.parsingFailed
        }

        // Store assistant response
        try await addMessage(to: conversation.id, role: .assistant, content: response)

        // Check for conflicts
        if parsingResponse.hasConflicts {
            return parsingResponse
        }

        // Mark conversation as resolved if no conflicts
        try await resolveConversation(conversation.id)

        return parsingResponse
    }

    /// Resolve a conflict with user's choice
    func resolveConflict(conversationId: UUID, userChoice: String, forDate date: Date) async throws -> TaskParsingResponse {
        guard let context = modelContext else {
            throw ScheduleServiceError.noModelContext
        }

        // Get conversation messages
        let messages = getMessages(for: conversationId)

        // Add user's choice
        try await addMessage(to: conversationId, role: .user, content: userChoice)

        // Get existing tasks for context
        let existingTasks = getTasksForDate(date)
        let scheduleContext = ScheduleContext(
            date: date,
            existingTasks: existingTasks.map { TaskSummary(from: $0) }
        )

        // Build prompt with conversation history
        let prompt = buildConflictResolutionPrompt(
            messages: messages,
            userChoice: userChoice,
            context: scheduleContext
        )

        // Call OpenAI
        let response = try await openAIService.parseTaskWithContext(
            userInput: userChoice,
            systemPrompt: prompt
        )

        // Parse the response
        guard let data = response.data(using: .utf8),
              let parsingResponse = try? JSONDecoder().decode(TaskParsingResponse.self, from: data) else {
            throw ScheduleServiceError.parsingFailed
        }

        // Store assistant response
        try await addMessage(to: conversationId, role: .assistant, content: response)

        // Mark conversation as resolved
        try await resolveConversation(conversationId)

        return parsingResponse
    }

    // MARK: - Recurrence

    /// Create a new recurrence pattern
    @MainActor
    func createRecurrencePattern(_ pattern: RecurrencePattern) throws {
        guard let context = modelContext else {
            throw ScheduleServiceError.noModelContext
        }

        context.insert(pattern)
        try context.save()
    }

    /// Generate recurring task instances until a date
    @MainActor
    func generateRecurringTasks(for patternId: UUID, until endDate: Date) throws -> [ScheduledTask] {
        guard let context = modelContext else {
            throw ScheduleServiceError.noModelContext
        }

        let predicate = #Predicate<RecurrencePattern> { pattern in
            pattern.id == patternId
        }

        let descriptor = FetchDescriptor<RecurrencePattern>(predicate: predicate)

        guard let pattern = try context.fetch(descriptor).first,
              let template = pattern.taskTemplate else {
            throw ScheduleServiceError.patternNotFound
        }

        var createdTasks: [ScheduledTask] = []
        let occurrences = pattern.generateOccurrences(from: Date(), until: endDate)

        for occurrenceDate in occurrences {
            let startTime = template.timeOfDay.date(on: occurrenceDate)
            guard let endTime = Calendar.current.date(byAdding: .minute, value: template.duration, to: startTime) else {
                continue
            }

            let task = ScheduledTask(
                title: template.title,
                taskDescription: template.taskDescription,
                scheduledDate: Calendar.current.startOfDay(for: occurrenceDate),
                startTime: startTime,
                endTime: endTime,
                duration: template.duration,
                verificationType: template.verificationType,
                isRecurring: true
            )

            task.recurrencePatternId = patternId

            // Apply configs
            if let exerciseConfig = template.exerciseConfig {
                task.exerciseType = exerciseConfig.exerciseVerificationType
                task.targetReps = exerciseConfig.targetReps
                task.targetDuration = exerciseConfig.targetDuration
            }

            if let voiceConfig = template.voiceConfig {
                task.voicePrompt = voiceConfig.prompt
            }

            if let stepCountConfig = template.stepCountConfig {
                task.targetSteps = stepCountConfig.targetSteps
            }

            context.insert(task)
            createdTasks.append(task)

            pattern.occurrenceCount += 1
        }

        try context.save()

        return createdTasks
    }

    // MARK: - Verification

    /// Start a verification session for a task
    @MainActor
    func startVerification(for taskId: UUID) throws -> VerificationSession {
        guard let context = modelContext else {
            throw ScheduleServiceError.noModelContext
        }

        let predicate = #Predicate<ScheduledTask> { task in
            task.id == taskId
        }

        let descriptor = FetchDescriptor<ScheduledTask>(predicate: predicate)

        guard let task = try context.fetch(descriptor).first else {
            throw ScheduleServiceError.taskNotFound
        }

        let session = createVerificationSession(for: task)
        activeSession = session

        // Update task status
        task.status = ScheduledTaskStatus.inProgress
        task.verificationStatus = VerificationStatus.inProgress
        task.updatedAt = Date()

        // If step count, request HealthKit authorization
        if task.verificationType == VerificationType.stepCount {
            Task {
                await requestStepCountAuthorization()
            }
        }

        try context.save()

        return session
    }

    /// Submit verification data
    @MainActor
    func submitVerification(taskId: UUID, submission: VerificationSubmission) async throws -> VerificationResult {
        guard let context = modelContext else {
            throw ScheduleServiceError.noModelContext
        }

        let predicate = #Predicate<ScheduledTask> { task in
            task.id == taskId
        }

        let descriptor = FetchDescriptor<ScheduledTask>(predicate: predicate)

        guard let task = try context.fetch(descriptor).first else {
            throw ScheduleServiceError.taskNotFound
        }

        // Process based on verification type
        let result: VerificationResult

        switch task.verificationType {
        case VerificationType.photoAfter, VerificationType.photoBeforeAfter:
            result = try await verifyPhoto(task: task, submission: submission)

        case VerificationType.exercise:
            result = verifyExercise(task: task, submission: submission)

        case VerificationType.voice:
            result = try await verifyVoice(task: task, submission: submission)

        case VerificationType.stepCount:
            result = await verifyStepCount(task: task, submission: submission)

        case VerificationType.check:
            result = VerificationResult(
                success: true,
                confidence: 1.0,
                feedback: "Task marked as complete",
                timestamp: Date()
            )
        }

        // Update task with result
        task.verificationResult = result
        task.verificationStatus = result.success ? VerificationStatus.verified : VerificationStatus.failed
        task.status = result.success ? ScheduledTaskStatus.completed : ScheduledTaskStatus.failed

        if result.success {
            task.completedAt = Date()
        }

        task.updatedAt = Date()

        // Create verification attempt record
        let attempt = VerificationAttempt(
            taskId: taskId,
            attemptNumber: getAttemptCount(for: taskId) + 1,
            verificationType: task.verificationType,
            isSuccessful: result.success,
            confidence: result.confidence,
            feedback: result.feedback
        )
        context.insert(attempt)

        try context.save()

        // Clear active session
        activeSession = nil

        return result
    }

    // MARK: - Conversation Management

    @MainActor
    private func createConversation(purpose: ConversationPurpose, relatedTaskId: UUID? = nil, relatedDate: Date? = nil) async throws -> AIConversation {
        guard let context = modelContext else {
            throw ScheduleServiceError.noModelContext
        }

        let conversation = AIConversation(
            purpose: purpose,
            relatedTaskId: relatedTaskId,
            relatedDate: relatedDate
        )

        context.insert(conversation)
        try context.save()

        return conversation
    }

    @MainActor
    func addMessage(to conversationId: UUID, role: MessageRole, content: String) async throws {
        guard let context = modelContext else {
            throw ScheduleServiceError.noModelContext
        }

        let order = getMessages(for: conversationId).count

        let message = AIMessage(
            conversationId: conversationId,
            role: role,
            content: content,
            order: order
        )

        context.insert(message)
        try context.save()
    }

    func getMessages(for conversationId: UUID) -> [AIMessage] {
        guard let context = modelContext else { return [] }

        let predicate = #Predicate<AIMessage> { message in
            message.conversationId == conversationId
        }

        let descriptor = FetchDescriptor<AIMessage>(
            predicate: predicate,
            sortBy: [SortDescriptor(\.order)]
        )

        return (try? context.fetch(descriptor)) ?? []
    }

    @MainActor
    private func resolveConversation(_ conversationId: UUID) async throws {
        guard let context = modelContext else {
            throw ScheduleServiceError.noModelContext
        }

        let predicate = #Predicate<AIConversation> { conversation in
            conversation.id == conversationId
        }

        let descriptor = FetchDescriptor<AIConversation>(predicate: predicate)

        guard let conversation = try context.fetch(descriptor).first else {
            return
        }

        conversation.markResolved()
        try context.save()
    }

    // MARK: - Private Helpers

    private func buildParsingSystemPrompt(context: ScheduleContext) -> String {
        let formatter = ISO8601DateFormatter()
        let dateFormatter = DateFormatter()
        dateFormatter.dateStyle = .full

        let existingTasksJson = (try? JSONEncoder().encode(context.existingTasks))
            .flatMap { String(data: $0, encoding: .utf8) } ?? "[]"

        return """
        You are a task scheduling assistant. Parse the user's natural language input into structured tasks.

        CURRENT DATE: \(dateFormatter.string(from: context.date))
        TIMEZONE: \(context.userTimezone)

        CURRENT SCHEDULE:
        \(existingTasksJson)

        For each task mentioned, determine:
        1. title: Short, clear name (max 5 words)
        2. description: Additional details (optional)
        3. scheduledTime: ISO 8601 datetime. If only time given, use today's date. If time has passed today, use tomorrow.
        4. endTime: Calculate from duration or estimate
        5. duration: In minutes (default 30 if not specified)
        6. verificationType: One of:
           - "photo_after": Task needs proof photo after completion (cooking, writing, general proof)
           - "photo_before_after": Task needs comparison photos (cleaning, organizing, homework progress)
           - "exercise": Physical activity with ML tracking (pushups, squats, pullups, plank, etc.)
           - "voice": Language learning or speaking task (translations, pronunciation)
           - "step_count": Walking/running task requiring steps (walking, jogging, hiking)
           - "check": Simple manual completion
        7. verificationConfig/exerciseConfig/voiceConfig/stepCountConfig: Based on type
        8. hasConflict: true if overlaps with existing tasks
        9. conflictDetails: Describe the overlap if any

        For EXERCISE tasks, specify exerciseConfig with:
        - exerciseType: pushups, squats, pullups, plank, jumping_jacks, lunges, crunches, shoulder_press, leg_raises, high_knees, wall_sit, side_plank
        - targetReps or targetDuration (seconds for holds)

        For VOICE tasks, specify voiceConfig with:
        - prompt: What user should say or translate
        - language: Target language if applicable

        For STEP_COUNT tasks, specify stepCountConfig with:
        - targetSteps: Number of steps required

        Return a JSON object with this structure:
        {
          "tasks": [...TaskParseResult],
          "hasConflicts": boolean,
          "conflictDetails": string or null,
          "suggestedResolutions": [string] or null (if conflicts),
          "requiresUserInput": boolean,
          "promptForUser": string or null
        }
        """
    }

    private func buildConflictResolutionPrompt(messages: [AIMessage], userChoice: String, context: ScheduleContext) -> String {
        let history = messages.map { "\($0.role.rawValue): \($0.content)" }.joined(separator: "\n")

        return """
        You are resolving a scheduling conflict.

        CONVERSATION HISTORY:
        \(history)

        USER'S CHOICE: \(userChoice)

        Based on the user's choice, adjust the task(s) accordingly and return the updated JSON response with the same structure:
        {
          "tasks": [...TaskParseResult],
          "hasConflicts": false,
          "conflictDetails": null,
          "suggestedResolutions": null,
          "requiresUserInput": false,
          "promptForUser": null
        }
        """
    }

    private func createVerificationSession(for task: ScheduledTask) -> VerificationSession {
        var session = VerificationSession(
            id: UUID(),
            taskId: task.id,
            verificationType: task.verificationType,
            startedAt: Date(),
            status: VerificationSessionStatus.ready
        )

        switch task.verificationType {
        case VerificationType.photoAfter:
            session.photoState = PhotoVerificationState(
                needsBeforePhoto: false,
                beforePhotoTaken: true,
                afterPhotoTaken: false
            )

        case VerificationType.photoBeforeAfter:
            session.photoState = PhotoVerificationState(
                needsBeforePhoto: true,
                beforePhotoTaken: false,
                afterPhotoTaken: false
            )

        case VerificationType.exercise:
            session.exerciseState = ExerciseVerificationState(
                exerciseType: task.exerciseTypeRaw ?? "pushups",
                targetReps: task.targetReps,
                targetDuration: task.targetDuration,
                currentReps: 0,
                currentDuration: 0,
                isTracking: false
            )

        case VerificationType.voice:
            session.voiceState = VoiceVerificationState(
                prompt: task.voicePrompt ?? "",
                isRecording: false
            )

        case VerificationType.stepCount:
            session.stepCountState = StepCountVerificationState(
                targetSteps: task.targetSteps ?? 1000,
                currentSteps: 0,
                isTracking: false
            )

        case VerificationType.check:
            break
        }

        return session
    }

    private func getAttemptCount(for taskId: UUID) -> Int {
        guard let context = modelContext else { return 0 }

        let predicate = #Predicate<VerificationAttempt> { attempt in
            attempt.taskId == taskId
        }

        let descriptor = FetchDescriptor<VerificationAttempt>(predicate: predicate)

        return (try? context.fetchCount(descriptor)) ?? 0
    }

    // MARK: - Photo Verification

    private func verifyPhoto(task: ScheduledTask, submission: VerificationSubmission) async throws -> VerificationResult {
        // For now, return a simple success - AI verification would be integrated here
        var result = VerificationResult(
            success: true,
            confidence: 0.85,
            feedback: "Photo verified successfully",
            timestamp: Date()
        )

        // Store photo paths
        if let afterPath = submission.afterPhotoPath {
            task.afterImagePath = afterPath
        }

        if let beforePath = submission.beforePhotoPath {
            task.beforeImagePath = beforePath
        }

        // TODO: Integrate with OpenAI Vision for actual photo analysis
        result.photoAnalysis = PhotoAnalysisResult(
            isTaskCompleted: true,
            completionConfidence: 0.85,
            analysis: "Photo verification received",
            beforeAfterComparison: task.verificationType == .photoBeforeAfter ? "Comparison available" : nil,
            suggestionsForImprovement: nil
        )

        return result
    }

    // MARK: - Exercise Verification

    private func verifyExercise(task: ScheduledTask, submission: VerificationSubmission) -> VerificationResult {
        guard let exerciseData = submission.exerciseData else {
            return VerificationResult(
                success: false,
                confidence: 0,
                feedback: "No exercise data provided",
                timestamp: Date()
            )
        }

        let targetReps = task.targetReps ?? 0
        let targetDuration = task.targetDuration ?? 0
        let actualReps = exerciseData.repsCompleted ?? 0
        let actualDuration = exerciseData.durationCompleted ?? 0

        task.actualReps = actualReps
        task.actualDuration = actualDuration
        task.formScore = exerciseData.formScore

        let isHoldExercise = task.exerciseType?.isHoldExercise ?? false
        let success: Bool
        let confidence: Double

        if isHoldExercise {
            success = actualDuration >= targetDuration
            confidence = min(1.0, Double(actualDuration) / Double(max(1, targetDuration)))
        } else {
            success = actualReps >= targetReps
            confidence = min(1.0, Double(actualReps) / Double(max(1, targetReps)))
        }

        var result = VerificationResult(
            success: success,
            confidence: confidence,
            feedback: success ? "Great job completing the exercise!" : "Keep trying, you're getting there!",
            timestamp: Date()
        )

        result.exerciseResult = ExerciseVerificationResult(
            exerciseType: exerciseData.exerciseType,
            targetReps: targetReps > 0 ? targetReps : nil,
            actualReps: actualReps > 0 ? actualReps : nil,
            targetDuration: targetDuration > 0 ? targetDuration : nil,
            actualDuration: actualDuration > 0 ? actualDuration : nil,
            formScore: exerciseData.formScore,
            formFeedback: nil,
            isCompleted: success
        )

        return result
    }

    // MARK: - Voice Verification

    private func verifyVoice(task: ScheduledTask, submission: VerificationSubmission) async throws -> VerificationResult {
        guard let voiceData = submission.voiceData,
              let transcription = voiceData.transcription else {
            return VerificationResult(
                success: false,
                confidence: 0,
                feedback: "No voice data provided",
                timestamp: Date()
            )
        }

        // TODO: Integrate with OpenAI for actual voice/translation evaluation
        var result = VerificationResult(
            success: true,
            confidence: 0.8,
            feedback: "Voice verification received",
            timestamp: Date()
        )

        result.voiceResult = VoiceVerificationResult(
            transcription: transcription,
            isCorrect: true,
            pronunciationScore: 0.8,
            languageAccuracyScore: 0.8,
            feedback: "Good attempt!",
            expectedResponse: task.voicePrompt
        )

        return result
    }

    // MARK: - Step Count Verification

    private func verifyStepCount(task: ScheduledTask, submission: VerificationSubmission) async -> VerificationResult {
        guard let stepData = submission.stepCountData else {
            return VerificationResult(
                success: false,
                confidence: 0,
                feedback: "No step count data provided",
                timestamp: Date()
            )
        }

        let targetSteps = task.targetSteps ?? 0
        let actualSteps = stepData.stepsCompleted

        task.actualSteps = actualSteps
        task.stepCountStartTime = stepData.startTime
        task.stepCountEndTime = stepData.endTime

        let success = actualSteps >= targetSteps
        let confidence = min(1.0, Double(actualSteps) / Double(max(1, targetSteps)))

        var result = VerificationResult(
            success: success,
            confidence: confidence,
            feedback: success ? "Great job reaching your step goal!" : "Keep walking, you're \(targetSteps - actualSteps) steps away!",
            timestamp: Date()
        )

        result.stepCountResult = StepCountVerificationResult(
            targetSteps: targetSteps,
            actualSteps: actualSteps,
            isCompleted: success,
            distance: stepData.distance,
            averagePace: nil,
            feedback: result.feedback
        )

        return result
    }

    // MARK: - HealthKit Integration

    private func requestStepCountAuthorization() async {
        guard HKHealthStore.isHealthDataAvailable() else { return }

        let stepType = HKQuantityType(.stepCount)
        let typesToRead: Set<HKSampleType> = [stepType]

        do {
            try await healthStore.requestAuthorization(toShare: [], read: typesToRead)
        } catch {
            print("HealthKit authorization failed: \(error)")
        }
    }

    /// Get step count from HealthKit for a time range
    func getStepCount(from startDate: Date, to endDate: Date) async throws -> Int {
        guard HKHealthStore.isHealthDataAvailable() else {
            throw ScheduleServiceError.healthKitNotAvailable
        }

        let stepType = HKQuantityType(.stepCount)
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: stepType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { _, statistics, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }

                let steps = statistics?.sumQuantity()?.doubleValue(for: .count()) ?? 0
                continuation.resume(returning: Int(steps))
            }

            healthStore.execute(query)
        }
    }

    /// Start observing step count changes
    func startStepCountObserver(handler: @escaping (Int) -> Void) {
        guard HKHealthStore.isHealthDataAvailable() else { return }

        let stepType = HKQuantityType(.stepCount)

        stepCountQuery = HKObserverQuery(sampleType: stepType, predicate: nil) { [weak self] _, completionHandler, error in
            guard error == nil else {
                completionHandler()
                return
            }

            Task {
                let today = Calendar.current.startOfDay(for: Date())
                if let steps = try? await self?.getStepCount(from: today, to: Date()) {
                    await MainActor.run {
                        handler(steps)
                    }
                }
                completionHandler()
            }
        }

        if let query = stepCountQuery {
            healthStore.execute(query)
        }
    }

    /// Stop observing step count
    func stopStepCountObserver() {
        if let query = stepCountQuery {
            healthStore.stop(query)
            stepCountQuery = nil
        }
    }
}

// MARK: - Errors

enum ScheduleServiceError: Error, LocalizedError {
    case noModelContext
    case taskNotFound
    case patternNotFound
    case parsingFailed
    case healthKitNotAvailable
    case verificationFailed
    case duplicateTask
    case pastDateNotAllowed

    var errorDescription: String? {
        switch self {
        case .noModelContext:
            return "Database context not available"
        case .taskNotFound:
            return "Task not found"
        case .patternNotFound:
            return "Recurrence pattern not found"
        case .parsingFailed:
            return "Failed to parse task input"
        case .healthKitNotAvailable:
            return "HealthKit is not available on this device"
        case .verificationFailed:
            return "Verification failed"
        case .duplicateTask:
            return "A task with the same name already exists at this time"
        case .pastDateNotAllowed:
            return "Cannot schedule tasks for past dates"
        }
    }
}
