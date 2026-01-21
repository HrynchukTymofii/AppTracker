import SwiftUI

/// AI Coach chat view - helps users build better habits when they hit their limits
struct CoachChatView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @Environment(TimeBankService.self) private var timeBank

    @State private var messageText = ""
    @State private var messages: [CoachMessage] = []
    @State private var isLoading = false
    @State private var showBonusEarned = false
    @State private var bonusMinutesEarned: Double = 0

    private var isDark: Bool { colorScheme == .dark }
    private let blueColor = Color(hex: "3b82f6")
    private let greenColor = Color(hex: "10b981")

    // App Group for persistence
    private let appGroupId = "group.com.hrynchuk.appblocker"
    private let coachBonusKey = "coach.bonusEarnedToday"
    private let coachBonusDateKey = "coach.bonusDate"

    /// Check if user can still earn bonus today (limit: 1 per day)
    private var canEarnBonusToday: Bool {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return true }
        let earnedToday = defaults.bool(forKey: coachBonusKey)
        let lastBonusDate = defaults.object(forKey: coachBonusDateKey) as? Date ?? .distantPast

        // Check if it's a new day
        let calendar = Calendar.current
        if !calendar.isDateInToday(lastBonusDate) {
            return true
        }
        return !earnedToday
    }

    /// User messages count (excluding coach messages)
    private var userMessageCount: Int {
        messages.filter { $0.role == .user }.count
    }

    /// Show earn button after meaningful conversation (3+ user messages)
    private var shouldShowEarnButton: Bool {
        userMessageCount >= 3 && canEarnBonusToday && !showBonusEarned
    }

    var body: some View {
        NavigationStack {
            ZStack {
                // Background
                (isDark ? Color(hex: "0f172a") : Color(hex: "f8fafc"))
                    .ignoresSafeArea()

                VStack(spacing: 0) {
                    // Messages
                    ScrollViewReader { proxy in
                        ScrollView {
                            LazyVStack(spacing: 16) {
                                // Welcome message
                                if messages.isEmpty {
                                    welcomeCard
                                }

                                ForEach(messages) { message in
                                    MessageBubble(message: message, isDark: isDark)
                                        .id(message.id)
                                }

                                // Earn Bonus Time Button (appears after meaningful conversation)
                                if shouldShowEarnButton {
                                    earnBonusButton
                                        .id("earnButton")
                                        .transition(.opacity.combined(with: .scale))
                                }

                                // Bonus earned confirmation
                                if showBonusEarned {
                                    bonusEarnedCard
                                        .id("bonusEarned")
                                        .transition(.opacity.combined(with: .scale))
                                }

                                if isLoading {
                                    HStack {
                                        CoachTypingIndicator()
                                        Spacer()
                                    }
                                    .padding(.horizontal, 20)
                                }
                            }
                            .padding(.vertical, 20)
                        }
                        .onChange(of: messages.count) { _, _ in
                            if let lastMessage = messages.last {
                                withAnimation {
                                    proxy.scrollTo(lastMessage.id, anchor: .bottom)
                                }
                            }
                        }
                    }

                    // Input bar
                    inputBar
                }
            }
            .navigationTitle(L10n.Coach.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(L10n.Common.done) { dismiss() }
                }
            }
        }
        .onAppear {
            // Add initial coach message
            if messages.isEmpty {
                let greeting = canEarnBonusToday
                    ? L10n.Coach.greetingCanEarn
                    : L10n.Coach.greetingCantEarn
                addCoachMessage(greeting)
            }
        }
    }

    // MARK: - Welcome Card

    private var welcomeCard: some View {
        VStack(spacing: 16) {
            // Icon
            RoundedRectangle(cornerRadius: 20)
                .fill(LinearGradient(
                    colors: [blueColor, Color(hex: "2563eb")],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ))
                .frame(width: 72, height: 72)
                .overlay {
                    Image(systemName: "brain.head.profile")
                        .font(.system(size: 32))
                        .foregroundStyle(.white)
                }

            Text(L10n.Coach.yourAiCoach)
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))

            Text(L10n.Coach.description)
                .font(.system(size: 15))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)

            // Quick prompts
            VStack(spacing: 8) {
                quickPromptButton(L10n.Coach.prompt1)
                quickPromptButton(L10n.Coach.prompt2)
                quickPromptButton(L10n.Coach.prompt3)
            }
            .padding(.top, 8)
        }
        .padding(.vertical, 20)
    }

    private func quickPromptButton(_ text: String) -> some View {
        Button {
            sendMessage(text)
        } label: {
            Text(text)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(blueColor)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(blueColor.opacity(0.1))
                )
        }
    }

    // MARK: - Earn Bonus Button

    private var earnBonusButton: some View {
        VStack(spacing: 12) {
            Text(L10n.Coach.readyToEarn)
                .font(.system(size: 14))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            Button {
                earnBonusTime()
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "gift.fill")
                        .font(.system(size: 18))

                    Text(L10n.Coach.earnMinutes)
                        .font(.system(size: 16, weight: .semibold))
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 24)
                .padding(.vertical, 14)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(
                            LinearGradient(
                                colors: [greenColor, Color(hex: "059669")],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                )
                .shadow(color: greenColor.opacity(0.4), radius: 8, y: 4)
            }
        }
        .padding(.vertical, 20)
        .padding(.horizontal, 40)
    }

    // MARK: - Bonus Earned Card

    private var bonusEarnedCard: some View {
        VStack(spacing: 16) {
            // Checkmark circle
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [greenColor, Color(hex: "059669")],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 64, height: 64)
                    .shadow(color: greenColor.opacity(0.4), radius: 8)

                Image(systemName: "checkmark")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundStyle(.white)
            }

            Text(L10n.Coach.minutesEarned(Int(bonusMinutesEarned)))
                .font(.system(size: 20, weight: .bold))
                .foregroundStyle(greenColor)

            Text(L10n.Coach.thanksReflecting)
                .font(.system(size: 14))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.vertical, 24)
        .padding(.horizontal, 32)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(isDark ? Color.white.opacity(0.06) : .white)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(greenColor.opacity(0.3), lineWidth: 1)
        )
        .padding(.horizontal, 20)
    }

    // MARK: - Earn Bonus Time Method

    private func earnBonusTime() {
        let bonusAmount: Double = 5.0  // 5 minutes bonus

        // Award the bonus
        timeBank.earn(minutes: bonusAmount, source: .bonus(reason: "Coach Conversation"), note: "Earned from coach chat")

        // Mark as earned today
        if let defaults = UserDefaults(suiteName: appGroupId) {
            defaults.set(true, forKey: coachBonusKey)
            defaults.set(Date(), forKey: coachBonusDateKey)
            defaults.synchronize()
        }

        // Show confirmation
        bonusMinutesEarned = bonusAmount
        withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
            showBonusEarned = true
        }

        // Add coach acknowledgment message
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            addCoachMessage(L10n.Coach.bonusAcknowledgment)
        }
    }

    // MARK: - Input Bar

    private var inputBar: some View {
        HStack(spacing: 12) {
            TextField(L10n.Coach.typeMessage, text: $messageText, axis: .vertical)
                .textFieldStyle(.plain)
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(
                    RoundedRectangle(cornerRadius: 24)
                        .fill(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.05))
                )
                .lineLimit(1...5)

            Button {
                sendMessage(messageText)
            } label: {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.system(size: 36))
                    .foregroundStyle(messageText.isEmpty ? .secondary : blueColor)
            }
            .disabled(messageText.isEmpty || isLoading)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(
            Rectangle()
                .fill(isDark ? Color(hex: "0f172a") : .white)
                .shadow(color: .black.opacity(0.05), radius: 10, y: -5)
        )
    }

    // MARK: - Message Handling

    private func sendMessage(_ text: String) {
        guard !text.isEmpty else { return }

        let userMessage = CoachMessage(role: .user, content: text)
        messages.append(userMessage)
        messageText = ""
        isLoading = true

        // Simulate AI response (replace with actual ChatGPT API call)
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            isLoading = false
            let response = generateCoachResponse(to: text)
            addCoachMessage(response)
        }
    }

    private func addCoachMessage(_ content: String) {
        let message = CoachMessage(role: .assistant, content: content)
        messages.append(message)
    }

    private func generateCoachResponse(to input: String) -> String {
        let input = input.lowercased()

        if input.contains("limit") || input.contains("blocked") {
            return L10n.Coach.responseLimit
        } else if input.contains("stressed") || input.contains("anxious") {
            return L10n.Coach.responseStress
        } else if input.contains("focused") || input.contains("productive") {
            return L10n.Coach.responseFocus
        } else if input.contains("bored") {
            return L10n.Coach.responseBored
        } else {
            return L10n.Coach.responseDefault
        }
    }
}

// MARK: - Supporting Types

struct CoachMessage: Identifiable {
    let id = UUID()
    let role: MessageRole
    let content: String
    let timestamp = Date()

    enum MessageRole {
        case user
        case assistant
    }
}

struct MessageBubble: View {
    let message: CoachMessage
    let isDark: Bool

    private let blueColor = Color(hex: "3b82f6")

    var body: some View {
        HStack {
            if message.role == .user {
                Spacer(minLength: 60)
            }

            VStack(alignment: message.role == .user ? .trailing : .leading, spacing: 4) {
                Text(message.content)
                    .font(.system(size: 15))
                    .foregroundStyle(message.role == .user ? .white : (isDark ? .white : Color(hex: "0f172a")))
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(
                        RoundedRectangle(cornerRadius: 20)
                            .fill(message.role == .user
                                  ? blueColor
                                  : (isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.05)))
                    )
            }

            if message.role == .assistant {
                Spacer(minLength: 60)
            }
        }
        .padding(.horizontal, 20)
    }
}

struct CoachTypingIndicator: View {
    @State private var animating = false

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3) { index in
                Circle()
                    .fill(Color.secondary)
                    .frame(width: 8, height: 8)
                    .scaleEffect(animating ? 1 : 0.5)
                    .animation(
                        .easeInOut(duration: 0.6)
                            .repeatForever()
                            .delay(Double(index) * 0.2),
                        value: animating
                    )
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.secondary.opacity(0.1))
        )
        .onAppear {
            animating = true
        }
    }
}

#Preview {
    CoachChatView()
        .environment(TimeBankService())
}
