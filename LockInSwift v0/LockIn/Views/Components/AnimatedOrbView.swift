import SwiftUI

struct AnimatedOrbView: View {
    let size: CGFloat
    let level: Int
    let healthScore: Int

    @State private var rotation: Double = 0
    @State private var scale: CGFloat = 1.0
    @State private var glowOpacity: Double = 0.5

    private var orbColors: [Color] {
        switch level {
        case 5: // Excellent - Emerald
            return [
                Color(red: 16/255, green: 185/255, blue: 129/255),
                Color(red: 52/255, green: 211/255, blue: 153/255),
                Color(red: 110/255, green: 231/255, blue: 183/255),
                Color(red: 167/255, green: 243/255, blue: 208/255)
            ]
        case 4: // Good - Green
            return [
                Color(red: 34/255, green: 197/255, blue: 94/255),
                Color(red: 74/255, green: 222/255, blue: 128/255),
                Color(red: 134/255, green: 239/255, blue: 172/255),
                Color(red: 187/255, green: 247/255, blue: 208/255)
            ]
        case 3: // Average - Yellow
            return [
                Color(red: 234/255, green: 179/255, blue: 8/255),
                Color(red: 250/255, green: 204/255, blue: 21/255),
                Color(red: 253/255, green: 224/255, blue: 71/255),
                Color(red: 254/255, green: 240/255, blue: 138/255)
            ]
        case 2: // Poor - Orange
            return [
                Color(red: 249/255, green: 115/255, blue: 22/255),
                Color(red: 251/255, green: 146/255, blue: 60/255),
                Color(red: 253/255, green: 186/255, blue: 116/255),
                Color(red: 254/255, green: 215/255, blue: 170/255)
            ]
        default: // Critical - Red
            return [
                Color(red: 239/255, green: 68/255, blue: 68/255),
                Color(red: 248/255, green: 113/255, blue: 113/255),
                Color(red: 252/255, green: 165/255, blue: 165/255),
                Color(red: 254/255, green: 202/255, blue: 202/255)
            ]
        }
    }

    private var glowColor: Color {
        orbColors.first ?? .green
    }

    var body: some View {
        ZStack {
            // Outer glow
            Circle()
                .fill(
                    RadialGradient(
                        colors: [glowColor.opacity(glowOpacity * 0.3), .clear],
                        center: .center,
                        startRadius: size * 0.4,
                        endRadius: size * 0.8
                    )
                )
                .frame(width: size * 1.6, height: size * 1.6)

            // Main orb with gradient
            Circle()
                .fill(
                    AngularGradient(
                        colors: orbColors + [orbColors.first!],
                        center: .center,
                        startAngle: .degrees(rotation),
                        endAngle: .degrees(rotation + 360)
                    )
                )
                .frame(width: size, height: size)
                .overlay {
                    // Inner highlight
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [.white.opacity(0.4), .clear],
                                center: UnitPoint(x: 0.35, y: 0.35),
                                startRadius: 0,
                                endRadius: size * 0.4
                            )
                        )
                }
                .overlay {
                    // Score display
                    VStack(spacing: 2) {
                        Text("\(healthScore)")
                            .font(.system(size: size * 0.25, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                            .shadow(color: .black.opacity(0.2), radius: 2)

                        Text("Health")
                            .font(.system(size: size * 0.08, weight: .medium))
                            .foregroundStyle(.white.opacity(0.8))
                    }
                }
                .shadow(color: glowColor.opacity(0.6), radius: 20)
                .scaleEffect(scale)
        }
        .onAppear {
            // Continuous rotation
            withAnimation(.linear(duration: 20).repeatForever(autoreverses: false)) {
                rotation = 360
            }

            // Pulsing scale
            withAnimation(.easeInOut(duration: 2).repeatForever(autoreverses: true)) {
                scale = 1.05
            }

            // Glow pulsing
            withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
                glowOpacity = 0.8
            }
        }
    }
}

#Preview {
    VStack(spacing: 40) {
        AnimatedOrbView(size: 160, level: 5, healthScore: 92)
        AnimatedOrbView(size: 120, level: 3, healthScore: 55)
        AnimatedOrbView(size: 80, level: 1, healthScore: 15)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Color.black)
}
