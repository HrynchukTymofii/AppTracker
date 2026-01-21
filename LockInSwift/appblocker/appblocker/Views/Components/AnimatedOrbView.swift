import SwiftUI

// MARK: - Orb Color Themes (matching RN exactly)

struct OrbTheme {
    let core: [Color]
    let mid: [Color]
    let outer: [Color]
    let glow: Color
    let particles: Color
}

private let orbThemes: [Int: OrbTheme] = [
    1: OrbTheme(
        core: [Color(hex: "ff6b6b"), Color(hex: "ee5a5a"), Color(hex: "dc3545")],
        mid: [Color(hex: "ff8787"), Color(hex: "ff6b6b"), Color(hex: "ee5a5a")],
        outer: [Color(hex: "ffa8a8"), Color(hex: "ff8787"), Color(hex: "ff6b6b")],
        glow: Color(hex: "ff6b6b"),
        particles: Color(hex: "ffcdd2")
    ),
    2: OrbTheme(
        core: [Color(hex: "ff9f43"), Color(hex: "f7931e"), Color(hex: "e67e22")],
        mid: [Color(hex: "ffb347"), Color(hex: "ff9f43"), Color(hex: "f7931e")],
        outer: [Color(hex: "ffd093"), Color(hex: "ffb347"), Color(hex: "ff9f43")],
        glow: Color(hex: "ff9f43"),
        particles: Color(hex: "ffe0b2")
    ),
    3: OrbTheme(
        core: [Color(hex: "54a0ff"), Color(hex: "2e86de"), Color(hex: "1e6fba")],
        mid: [Color(hex: "74b9ff"), Color(hex: "54a0ff"), Color(hex: "2e86de")],
        outer: [Color(hex: "a8d8ff"), Color(hex: "74b9ff"), Color(hex: "54a0ff")],
        glow: Color(hex: "54a0ff"),
        particles: Color(hex: "bbdefb")
    ),
    4: OrbTheme(
        core: [Color(hex: "00d2d3"), Color(hex: "00b894"), Color(hex: "009688")],
        mid: [Color(hex: "55efc4"), Color(hex: "00d2d3"), Color(hex: "00b894")],
        outer: [Color(hex: "a8f0e8"), Color(hex: "55efc4"), Color(hex: "00d2d3")],
        glow: Color(hex: "00d2d3"),
        particles: Color(hex: "b2dfdb")
    ),
    5: OrbTheme(
        core: [Color(hex: "a29bfe"), Color(hex: "6c5ce7"), Color(hex: "5f27cd")],
        mid: [Color(hex: "d5aaff"), Color(hex: "a29bfe"), Color(hex: "6c5ce7")],
        outer: [Color(hex: "e8daff"), Color(hex: "d5aaff"), Color(hex: "a29bfe")],
        glow: Color(hex: "a29bfe"),
        particles: Color(hex: "e1bee7")
    )
]

// MARK: - Animated Orb View

struct AnimatedOrbView: View {
    let size: CGFloat
    let level: Int
    var healthScore: Int = 0

    // Animation states
    @State private var coreRotation: Double = 0
    @State private var layer1Rotation: Double = 0
    @State private var layer2Rotation: Double = 0
    @State private var layer3Rotation: Double = 0
    @State private var corePulse: CGFloat = 1.0
    @State private var glowOpacity: Double = 0.6
    @State private var floatY: CGFloat = 0
    @State private var ringScale: CGFloat = 1.0
    @State private var ringOpacity: Double = 0.5
    @State private var particleRotations: [Double] = Array(repeating: 0, count: 8)
    @State private var particleOpacities: [Double] = (0..<8).map { _ in 0.3 + Double.random(in: 0...0.4) }

    private var theme: OrbTheme {
        orbThemes[level] ?? orbThemes[3]!
    }

    var body: some View {
        ZStack {
            // Outer glow
            Circle()
                .fill(theme.glow.opacity(0.15 + (glowOpacity - 0.6) * 0.375))
                .frame(width: size * 1.4, height: size * 1.4)
                .blur(radius: 20)

            // Energy ring pulse
            Circle()
                .stroke(theme.glow, lineWidth: 2)
                .frame(width: size, height: size)
                .scaleEffect(ringScale)
                .opacity(ringOpacity)

            // Outer layer - slowest rotation
            Circle()
                .fill(
                    LinearGradient(
                        colors: theme.outer + [.clear],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: size, height: size)
                .rotationEffect(.degrees(layer3Rotation))
                .scaleEffect(corePulse)

            // Middle layer
            Circle()
                .fill(
                    LinearGradient(
                        colors: theme.mid,
                        startPoint: UnitPoint(x: 0.2, y: 0),
                        endPoint: UnitPoint(x: 0.8, y: 1)
                    )
                )
                .frame(width: size * 0.8, height: size * 0.8)
                .rotationEffect(.degrees(-layer2Rotation))
                .scaleEffect(corePulse)

            // Inner layer - fastest rotation
            Circle()
                .fill(
                    LinearGradient(
                        colors: theme.core,
                        startPoint: UnitPoint(x: 0, y: 0.2),
                        endPoint: UnitPoint(x: 1, y: 0.8)
                    )
                )
                .frame(width: size * 0.6, height: size * 0.6)
                .rotationEffect(.degrees(layer1Rotation))
                .scaleEffect(corePulse)

            // Core - bright center
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [.white, theme.core[0], theme.core[1]],
                            startPoint: UnitPoint(x: 0.3, y: 0.3),
                            endPoint: UnitPoint(x: 0.7, y: 0.7)
                        )
                    )

                // Bright spot
                Circle()
                    .fill(Color.white.opacity(0.8))
                    .frame(width: size * 0.12, height: size * 0.12)
                    .offset(x: -size * 0.08, y: -size * 0.08)
            }
            .frame(width: size * 0.35, height: size * 0.35)
            .rotationEffect(.degrees(coreRotation))
            .scaleEffect(corePulse)

            // Orbiting particles
            ForEach(0..<8, id: \.self) { index in
                let angle = Double(index) / 8.0 * .pi * 2
                let orbitRadius = size * 0.55 + CGFloat(index % 3) * 8
                let particleSize: CGFloat = 4 + CGFloat(index % 3) * 2

                Circle()
                    .fill(theme.particles)
                    .frame(width: particleSize, height: particleSize)
                    .shadow(color: theme.glow, radius: 4)
                    .offset(x: orbitRadius)
                    .rotationEffect(.degrees(particleRotations[index] + angle * 180 / .pi))
                    .opacity(particleOpacities[index])
            }

            // Shimmer overlay
            Capsule()
                .fill(
                    LinearGradient(
                        colors: [.white.opacity(0.6), .white.opacity(0.1), .clear],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: size * 0.4, height: size * 0.15)
                .offset(x: -size * 0.1, y: -size * 0.3)
                .opacity(0.4 + (glowOpacity - 0.6) * 0.75)
        }
        .offset(y: floatY)
        .onAppear {
            startAnimations()
        }
    }

    private func startAnimations() {
        // Core rotation - slow, majestic
        withAnimation(.linear(duration: 20).repeatForever(autoreverses: false)) {
            coreRotation = 360
        }

        // Core pulse - breathing effect
        withAnimation(.easeInOut(duration: 2).repeatForever(autoreverses: true)) {
            corePulse = 1.08
        }

        // Glow intensity pulse
        withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
            glowOpacity = 1.0
        }

        // Layer rotations at different speeds
        withAnimation(.linear(duration: 8).repeatForever(autoreverses: false)) {
            layer1Rotation = 360
        }

        withAnimation(.linear(duration: 12).repeatForever(autoreverses: false)) {
            layer2Rotation = 360
        }

        withAnimation(.linear(duration: 15).repeatForever(autoreverses: false)) {
            layer3Rotation = 360
        }

        // Floating effect
        withAnimation(.easeInOut(duration: 4).repeatForever(autoreverses: true)) {
            floatY = -8
        }

        // Energy ring pulse
        withAnimation(.easeOut(duration: 2).repeatForever(autoreverses: false)) {
            ringScale = 1.3
            ringOpacity = 0
        }

        // Particle orbits
        for i in 0..<8 {
            let duration = 4.0 + Double(i) * 0.5
            withAnimation(.linear(duration: duration).repeatForever(autoreverses: false)) {
                particleRotations[i] = 360
            }

            // Particle twinkle
            withAnimation(.easeInOut(duration: 1).repeatForever(autoreverses: true).delay(Double(i) * 0.2)) {
                particleOpacities[i] = 0.8
            }
        }
    }
}

#Preview {
    VStack(spacing: 40) {
        AnimatedOrbView(size: 160, level: 5)
        AnimatedOrbView(size: 120, level: 3)
        AnimatedOrbView(size: 80, level: 1)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Color.black)
}
