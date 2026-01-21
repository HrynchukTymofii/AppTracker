import SwiftUI

/// Duolingo-style streak celebration screen shown after completing a task
struct StreakCelebrationView: View {
    let streakCount: Int
    let earnedMinutes: Double
    let exerciseType: ExerciseType
    let onDismiss: () -> Void

    @State private var showFlame = false
    @State private var showNumber = false
    @State private var showText = false
    @State private var showReward = false
    @State private var showButton = false
    @State private var flameScale: CGFloat = 0.3
    @State private var numberScale: CGFloat = 0.5
    @State private var particles: [Particle] = []

    private let flameColors = [
        Color(hex: "ff6b00"),
        Color(hex: "ff9500"),
        Color(hex: "ffb800"),
        Color(hex: "ffd000")
    ]

    var body: some View {
        ZStack {
            // Background
            Color.black.ignoresSafeArea()

            // Animated particles
            ForEach(particles) { particle in
                Circle()
                    .fill(particle.color)
                    .frame(width: particle.size, height: particle.size)
                    .position(particle.position)
                    .opacity(particle.opacity)
            }

            // Main content
            VStack(spacing: 32) {
                Spacer()

                // Flame with streak number
                ZStack {
                    // Glow effect
                    if showFlame {
                        Circle()
                            .fill(
                                RadialGradient(
                                    colors: [
                                        Color(hex: "ff6b00").opacity(0.4),
                                        Color(hex: "ff9500").opacity(0.2),
                                        .clear
                                    ],
                                    center: .center,
                                    startRadius: 60,
                                    endRadius: 180
                                )
                            )
                            .frame(width: 300, height: 300)
                            .blur(radius: 30)
                    }

                    // Flame icon
                    Image(systemName: "flame.fill")
                        .font(.system(size: 140, weight: .medium))
                        .foregroundStyle(
                            LinearGradient(
                                colors: flameColors,
                                startPoint: .bottom,
                                endPoint: .top
                            )
                        )
                        .scaleEffect(flameScale)
                        .opacity(showFlame ? 1 : 0)
                        .shadow(color: Color(hex: "ff6b00").opacity(0.8), radius: 40)

                    // Streak number
                    if showNumber {
                        Text("\(streakCount)")
                            .font(.system(size: 72, weight: .black, design: .rounded))
                            .foregroundStyle(.white)
                            .scaleEffect(numberScale)
                            .offset(y: 10)
                            .shadow(color: .black.opacity(0.5), radius: 4, y: 2)
                    }
                }
                .frame(height: 200)

                // Streak text
                if showText {
                    VStack(spacing: 8) {
                        Text(streakCount == 1 ? L10n.Streak.started : L10n.Streak.days)
                            .font(.system(size: 32, weight: .bold))
                            .foregroundStyle(.white)

                        Text(L10n.Streak.keepGoing)
                            .font(.system(size: 17))
                            .foregroundStyle(.white.opacity(0.7))
                    }
                    .transition(.opacity.combined(with: .move(edge: .bottom)))
                }

                // Reward earned
                if showReward {
                    HStack(spacing: 8) {
                        Image(systemName: "clock.fill")
                            .font(.system(size: 18))

                        Text("+\(String(format: "%.1f", earnedMinutes)) min")
                            .font(.system(size: 20, weight: .bold))
                    }
                    .foregroundStyle(Color(hex: "10b981"))
                    .padding(.horizontal, 24)
                    .padding(.vertical, 14)
                    .background(
                        Capsule()
                            .fill(Color(hex: "10b981").opacity(0.15))
                            .overlay(
                                Capsule()
                                    .stroke(Color(hex: "10b981").opacity(0.3), lineWidth: 1)
                            )
                    )
                    .transition(.opacity.combined(with: .scale))
                }

                Spacer()

                // Continue button
                if showButton {
                    Button(action: onDismiss) {
                        Text(L10n.Streak.continue_)
                            .font(.system(size: 18, weight: .bold))
                            .foregroundStyle(.black)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 18)
                            .background(
                                RoundedRectangle(cornerRadius: 16)
                                    .fill(
                                        LinearGradient(
                                            colors: flameColors,
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                            )
                            .shadow(color: Color(hex: "ff6b00").opacity(0.5), radius: 16, y: 8)
                    }
                    .padding(.horizontal, 32)
                    .padding(.bottom, 50)
                    .transition(.opacity.combined(with: .move(edge: .bottom)))
                }
            }
        }
        .onAppear {
            startAnimation()
            generateParticles()
        }
    }

    // MARK: - Animation

    private func startAnimation() {
        // Flame appears
        withAnimation(.spring(response: 0.6, dampingFraction: 0.7).delay(0.1)) {
            showFlame = true
            flameScale = 1.0
        }

        // Number appears
        withAnimation(.spring(response: 0.5, dampingFraction: 0.6).delay(0.4)) {
            showNumber = true
            numberScale = 1.0
        }

        // Add bounce to flame
        withAnimation(.spring(response: 0.3, dampingFraction: 0.5).delay(0.6)) {
            flameScale = 1.1
        }
        withAnimation(.spring(response: 0.3, dampingFraction: 0.6).delay(0.8)) {
            flameScale = 1.0
        }

        // Text appears
        withAnimation(.easeOut(duration: 0.4).delay(0.7)) {
            showText = true
        }

        // Reward appears
        withAnimation(.spring(response: 0.5, dampingFraction: 0.7).delay(1.0)) {
            showReward = true
        }

        // Button appears
        withAnimation(.easeOut(duration: 0.4).delay(1.3)) {
            showButton = true
        }
    }

    // MARK: - Particles

    private func generateParticles() {
        let screenWidth = UIScreen.main.bounds.width
        let screenHeight = UIScreen.main.bounds.height

        for i in 0..<30 {
            let delay = Double(i) * 0.05

            DispatchQueue.main.asyncAfter(deadline: .now() + delay + 0.5) {
                let particle = Particle(
                    id: UUID(),
                    position: CGPoint(
                        x: CGFloat.random(in: 0...screenWidth),
                        y: screenHeight + 20
                    ),
                    color: flameColors.randomElement() ?? .orange,
                    size: CGFloat.random(in: 4...12),
                    opacity: Double.random(in: 0.4...0.9)
                )

                withAnimation(.none) {
                    particles.append(particle)
                }

                // Animate particle upward
                let targetY = CGFloat.random(in: -50...screenHeight * 0.3)
                let targetX = particle.position.x + CGFloat.random(in: -100...100)

                withAnimation(.easeOut(duration: Double.random(in: 2...4))) {
                    if let index = particles.firstIndex(where: { $0.id == particle.id }) {
                        particles[index].position = CGPoint(x: targetX, y: targetY)
                        particles[index].opacity = 0
                    }
                }

                // Remove particle after animation
                DispatchQueue.main.asyncAfter(deadline: .now() + 4) {
                    particles.removeAll { $0.id == particle.id }
                }
            }
        }
    }
}

// MARK: - Particle Model

struct Particle: Identifiable {
    let id: UUID
    var position: CGPoint
    let color: Color
    let size: CGFloat
    var opacity: Double
}

#Preview {
    StreakCelebrationView(
        streakCount: 5,
        earnedMinutes: 7.5,
        exerciseType: .pushups
    ) {}
}
