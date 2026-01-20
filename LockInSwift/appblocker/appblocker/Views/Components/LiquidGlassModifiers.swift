import SwiftUI

// MARK: - Liquid Glass Card Modifier

struct LiquidGlassModifier: ViewModifier {
    @Environment(ThemeService.self) private var theme
    @Environment(\.colorScheme) private var colorScheme

    var cornerRadius: CGFloat = 16

    private var isDark: Bool {
        colorScheme == .dark
    }

    func body(content: Content) -> some View {
        content
            .background(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(isDark ? Color.white.opacity(0.03) : Color.white.opacity(0.6))
                    .background(
                        Group {
                            if isDark {
                                RoundedRectangle(cornerRadius: cornerRadius)
                                    .fill(.ultraThinMaterial)
                            } else {
                                RoundedRectangle(cornerRadius: cornerRadius)
                                    .fill(.regularMaterial)
                            }
                        }
                    )
                    .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
            )
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(isDark ? Color.white.opacity(0.08) : Color.white.opacity(0.4), lineWidth: 1)
            )
            .shadow(
                color: isDark ? theme.accentColor.opacity(0.05) : .black.opacity(0.04),
                radius: isDark ? 15 : 12,
                x: 0,
                y: isDark ? 0 : 4
            )
    }
}

// MARK: - Liquid Glass Active Modifier (for selected/active states)

struct LiquidGlassActiveModifier: ViewModifier {
    @Environment(ThemeService.self) private var theme
    @Environment(\.colorScheme) private var colorScheme

    var cornerRadius: CGFloat = 16

    private var isDark: Bool {
        colorScheme == .dark
    }

    func body(content: Content) -> some View {
        content
            .background(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(theme.accentColor.opacity(0.15))
                    .background(.ultraThinMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
            )
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(theme.accentColor.opacity(0.4), lineWidth: 1)
            )
            .shadow(color: theme.accentColor.opacity(isDark ? 0.4 : 0.25), radius: 20)
    }
}

// MARK: - Accent Glow Modifier

struct AccentGlowModifier: ViewModifier {
    @Environment(ThemeService.self) private var theme
    @Environment(\.colorScheme) private var colorScheme

    var intensity: CGFloat = 1.0

    private var isDark: Bool {
        colorScheme == .dark
    }

    func body(content: Content) -> some View {
        content
            .shadow(
                color: theme.accentColor.opacity((isDark ? 0.4 : 0.25) * intensity),
                radius: isDark ? 15 : 10,
                x: 0,
                y: isDark ? 0 : 4
            )
    }
}

// MARK: - Glass Card Modifier (Simpler version)

struct GlassCardModifier: ViewModifier {
    @Environment(\.colorScheme) private var colorScheme

    var cornerRadius: CGFloat = 16

    private var isDark: Bool {
        colorScheme == .dark
    }

    func body(content: Content) -> some View {
        content
            .background(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(isDark ? Color.white.opacity(0.05) : .white)
            )
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.05), lineWidth: 1)
            )
    }
}

// MARK: - Accent Background Modifier

struct AccentBackgroundModifier: ViewModifier {
    @Environment(ThemeService.self) private var theme

    var cornerRadius: CGFloat = 12
    var opacity: CGFloat = 0.1

    func body(content: Content) -> some View {
        content
            .background(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(theme.accentColor.opacity(opacity))
            )
    }
}

// MARK: - Pulsing Glow Modifier

struct PulsingGlowModifier: ViewModifier {
    @Environment(ThemeService.self) private var theme
    @State private var isAnimating = false

    var baseOpacity: CGFloat = 0.3
    var animatedOpacity: CGFloat = 0.6

    func body(content: Content) -> some View {
        content
            .shadow(
                color: theme.accentColor.opacity(isAnimating ? animatedOpacity : baseOpacity),
                radius: isAnimating ? 20 : 15
            )
            .onAppear {
                withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
                    isAnimating = true
                }
            }
    }
}

// MARK: - Themed Background Modifier

struct ThemedBackgroundModifier: ViewModifier {
    @Environment(ThemeService.self) private var theme
    @Environment(\.colorScheme) private var colorScheme

    func body(content: Content) -> some View {
        content
            .background(theme.backgroundColor(for: colorScheme).ignoresSafeArea())
    }
}

// MARK: - View Extensions

extension View {
    /// Applies liquid glass effect to a view
    func liquidGlass(cornerRadius: CGFloat = 16) -> some View {
        modifier(LiquidGlassModifier(cornerRadius: cornerRadius))
    }

    /// Applies liquid glass active effect (for selected states)
    func liquidGlassActive(cornerRadius: CGFloat = 16) -> some View {
        modifier(LiquidGlassActiveModifier(cornerRadius: cornerRadius))
    }

    /// Adds accent color glow effect
    func accentGlow(intensity: CGFloat = 1.0) -> some View {
        modifier(AccentGlowModifier(intensity: intensity))
    }

    /// Applies simple glass card effect
    func glassCard(cornerRadius: CGFloat = 16) -> some View {
        modifier(GlassCardModifier(cornerRadius: cornerRadius))
    }

    /// Applies accent background
    func accentBackground(cornerRadius: CGFloat = 12, opacity: CGFloat = 0.1) -> some View {
        modifier(AccentBackgroundModifier(cornerRadius: cornerRadius, opacity: opacity))
    }

    /// Adds pulsing glow animation
    func pulsingGlow(baseOpacity: CGFloat = 0.3, animatedOpacity: CGFloat = 0.6) -> some View {
        modifier(PulsingGlowModifier(baseOpacity: baseOpacity, animatedOpacity: animatedOpacity))
    }

    /// Applies themed background
    func themedBackground() -> some View {
        modifier(ThemedBackgroundModifier())
    }
}

// MARK: - Liquid Glass Button Style

struct LiquidGlassButtonStyle: ButtonStyle {
    @Environment(ThemeService.self) private var theme
    @Environment(\.colorScheme) private var colorScheme

    var isActive: Bool = false

    private var isDark: Bool {
        colorScheme == .dark
    }

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
            .background(
                Group {
                    if isActive {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(theme.accentColor.opacity(0.15))
                            .background(.ultraThinMaterial)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(theme.accentColor.opacity(0.4), lineWidth: 1)
                            )
                            .shadow(color: theme.accentColor.opacity(isDark ? 0.4 : 0.25), radius: 15)
                    } else {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(isDark ? Color.white.opacity(0.03) : Color.white.opacity(0.6))
                            .background(.ultraThinMaterial)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(isDark ? Color.white.opacity(0.08) : Color.white.opacity(0.4), lineWidth: 1)
                            )
                    }
                }
            )
            .scaleEffect(configuration.isPressed ? 0.96 : 1.0)
            .animation(.spring(response: 0.2, dampingFraction: 0.7), value: configuration.isPressed)
    }
}

// MARK: - Accent Button Style

struct AccentButtonStyle: ButtonStyle {
    @Environment(ThemeService.self) private var theme
    @Environment(\.colorScheme) private var colorScheme

    private var isDark: Bool {
        colorScheme == .dark
    }

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(theme.accentColor)
            )
            .foregroundStyle(.white)
            .shadow(color: theme.accentColor.opacity(isDark ? 0.5 : 0.3), radius: 15, y: 4)
            .scaleEffect(configuration.isPressed ? 0.96 : 1.0)
            .animation(.spring(response: 0.2, dampingFraction: 0.7), value: configuration.isPressed)
    }
}

// MARK: - Progress Bar Component

struct AccentProgressBar: View {
    @Environment(ThemeService.self) private var theme
    @Environment(\.colorScheme) private var colorScheme

    var progress: CGFloat
    var height: CGFloat = 8
    var showGlow: Bool = true

    private var isDark: Bool {
        colorScheme == .dark
    }

    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                // Background
                RoundedRectangle(cornerRadius: height / 2)
                    .fill(theme.progressBarBackground(for: colorScheme))
                    .frame(height: height)

                // Progress fill
                RoundedRectangle(cornerRadius: height / 2)
                    .fill(theme.accentColor)
                    .frame(width: geometry.size.width * min(max(progress, 0), 1), height: height)
                    .shadow(
                        color: showGlow ? theme.accentColor.opacity(isDark ? 0.5 : 0.3) : .clear,
                        radius: showGlow ? 8 : 0
                    )
            }
        }
        .frame(height: height)
    }
}

// MARK: - Preview

#Preview {
    ZStack {
        Color(hex: "#050505").ignoresSafeArea()

        VStack(spacing: 20) {
            Text("Liquid Glass Card")
                .foregroundStyle(.white)
                .padding(20)
                .liquidGlass()

            Text("Liquid Glass Active")
                .foregroundStyle(.white)
                .padding(20)
                .liquidGlassActive()

            Text("With Accent Glow")
                .foregroundStyle(.white)
                .padding(20)
                .liquidGlass()
                .accentGlow()

            Button("Accent Button") {}
                .buttonStyle(AccentButtonStyle())

            AccentProgressBar(progress: 0.6)
                .padding(.horizontal, 40)
        }
    }
    .environment(ThemeService())
}
