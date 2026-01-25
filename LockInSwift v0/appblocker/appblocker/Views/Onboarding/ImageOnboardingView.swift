import SwiftUI

/// Image carousel onboarding - matches RN onboarding.tsx exactly
/// 3 slides with phone screenshots, UCurve separator, dark bottom section
struct ImageOnboardingView: View {
    @Binding var showAuth: Bool
    @Environment(\.colorScheme) private var colorScheme

    @State private var currentIndex = 0

    private var isDark: Bool { colorScheme == .dark }

    private var onboardingData: [OnboardingSlide] {
        [
            OnboardingSlide(
                id: "1",
                title: L10n.Onboarding.slide1Title,
                description: L10n.Onboarding.slide1Description,
                badge: L10n.Onboarding.slide1Badge
            ),
            OnboardingSlide(
                id: "2",
                title: L10n.Onboarding.slide2Title,
                description: L10n.Onboarding.slide2Description,
                badge: L10n.Onboarding.slide2Badge
            ),
            OnboardingSlide(
                id: "3",
                title: L10n.Onboarding.slide3Title,
                description: L10n.Onboarding.slide3Description,
                badge: L10n.Onboarding.slide3Badge
            )
        ]
    }

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Background - top section
                VStack(spacing: 0) {
                    Color(isDark ? .black : .white)
                        .frame(height: geometry.size.height * 0.58)
                    Color(isDark ? .black : Color(hex: "111827"))
                }
                .ignoresSafeArea()

                VStack(spacing: 0) {
                    // Carousel
                    TabView(selection: $currentIndex) {
                        ForEach(Array(onboardingData.enumerated()), id: \.element.id) { index, slide in
                            OnboardingSlideView(
                                slide: slide,
                                geometry: geometry,
                                isDark: isDark,
                                isLast: index == onboardingData.count - 1,
                                onContinue: handleContinue
                            )
                            .tag(index)
                        }
                    }
                    .tabViewStyle(.page(indexDisplayMode: .never))
                    .animation(.easeInOut, value: currentIndex)
                }
            }
        }
    }

    private func handleContinue() {
        if currentIndex < onboardingData.count - 1 {
            withAnimation {
                currentIndex += 1
            }
        } else {
            showAuth = true
        }
    }
}

// MARK: - Onboarding Slide Data

struct OnboardingSlide: Identifiable {
    let id: String
    let title: String
    let description: String
    let badge: String
}

// MARK: - Single Slide View

struct OnboardingSlideView: View {
    let slide: OnboardingSlide
    let geometry: GeometryProxy
    let isDark: Bool
    let isLast: Bool
    let onContinue: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            // Top section with phone image
            ZStack(alignment: .bottom) {
                Color(isDark ? .black : .white)

                // Phone screenshot placeholder (would use actual images)
                phoneImagePlaceholder
                    .padding(.bottom, 60)

                // Badge
                badgeView
                    .padding(.bottom, 20)
                    .zIndex(2)

                // UCurve separator
                UCurveShape()
                    .fill(Color(isDark ? .black : Color(hex: "111827")))
                    .frame(height: 80)
                    .offset(y: 40)
            }
            .frame(height: geometry.size.height * 0.58)

            // Bottom content section
            bottomContent
        }
    }

    private var phoneImagePlaceholder: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 40)
                .fill(
                    LinearGradient(
                        colors: [
                            Color(hex: "3b82f6").opacity(0.2),
                            Color(hex: "8b5cf6").opacity(0.2)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: geometry.size.width * 0.65, height: geometry.size.width * 0.9)

            // App icon placeholder
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [Color(hex: "3b82f6"), Color(hex: "8b5cf6")],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 80, height: 80)

                Image(systemName: "hand.raised.fill")
                    .font(.system(size: 40))
                    .foregroundStyle(.white)
            }
        }
    }

    private var badgeView: some View {
        Text(slide.badge)
            .font(.system(size: 12, weight: .semibold))
            .foregroundStyle(isDark ? .white : Color(hex: "4b5563"))
            .padding(.horizontal, 24)
            .padding(.vertical, 10)
            .background(
                Capsule()
                    .fill(isDark ? Color.black.opacity(0.8) : .white)
                    .shadow(color: .black.opacity(0.15), radius: 15, y: 6)
            )
            .overlay(
                Capsule()
                    .stroke(Color.white.opacity(0.3), lineWidth: 1)
            )
    }

    private var bottomContent: some View {
        VStack(spacing: 0) {
            Spacer()

            // Text content
            VStack(spacing: 12) {
                Text(slide.title)
                    .font(.system(size: 28, weight: .bold))
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)

                Text(slide.description)
                    .font(.system(size: 15))
                    .foregroundStyle(Color(hex: "9ca3af"))
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                    .padding(.horizontal, 20)
            }

            Spacer()

            // Pagination dots
            paginationDots
                .padding(.bottom, 24)

            // Continue button
            Button(action: onContinue) {
                Text(isLast ? L10n.Onboarding.letsGetStarted : L10n.Common.continue)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(.black)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 20)
                    .background(.white)
                    .clipShape(Capsule())
                    .shadow(color: .black.opacity(0.3), radius: 24, y: 12)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 48)
        }
        .frame(maxWidth: .infinity)
        .background(Color(isDark ? .black : Color(hex: "111827")))
    }

    private var paginationDots: some View {
        HStack(spacing: 8) {
            ForEach(0..<3, id: \.self) { index in
                let isCurrent = index == getCurrentIndex()
                Capsule()
                    .fill(.white.opacity(isCurrent ? 1 : 0.3))
                    .frame(width: isCurrent ? 24 : 8, height: 8)
                    .animation(.spring(response: 0.3), value: isCurrent)
            }
        }
    }

    private func getCurrentIndex() -> Int {
        switch slide.id {
        case "1": return 0
        case "2": return 1
        case "3": return 2
        default: return 0
        }
    }
}

// MARK: - UCurve Shape

struct UCurveShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()

        let width = rect.width
        let height = rect.height

        // Start from top-left
        path.move(to: CGPoint(x: 0, y: height * 0.2))

        // First curve down
        path.addCurve(
            to: CGPoint(x: width * 0.5, y: height * 0.7),
            control1: CGPoint(x: width * 0.17, y: height * 0.65),
            control2: CGPoint(x: width * 0.33, y: height * 0.75)
        )

        // Second curve up to right
        path.addCurve(
            to: CGPoint(x: width, y: height * 0.2),
            control1: CGPoint(x: width * 0.67, y: height * 0.65),
            control2: CGPoint(x: width * 0.83, y: height * 0.5)
        )

        // Close the path
        path.addLine(to: CGPoint(x: width, y: height))
        path.addLine(to: CGPoint(x: 0, y: height))
        path.closeSubpath()

        return path
    }
}

#Preview {
    ImageOnboardingView(showAuth: .constant(false))
}
