import SwiftUI
import RevenueCat

/// Paywall screen - matches RN payment.tsx design
struct PaywallView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @Environment(PurchaseService.self) private var purchaseService
    @Environment(AuthService.self) private var authService

    @State private var selectedPlan: PlanType = .yearly
    @State private var wantsTrial = true
    @State private var isLoading = false
    @State private var showSuccessAlert = false
    @State private var errorMessage: String?

    var onPurchaseComplete: (() -> Void)?

    private var isDark: Bool { colorScheme == .dark }

    enum PlanType {
        case monthly, yearly
    }

    // Social proof reviews (computed for localization)
    private var reviews: [(text: String, author: String)] {
        [
            (text: L10n.Paywall.review1Text, author: L10n.Paywall.review1Author),
            (text: L10n.Paywall.review2Text, author: L10n.Paywall.review2Author),
            (text: L10n.Paywall.review3Text, author: L10n.Paywall.review3Author)
        ]
    }

    // Features list (computed for localization)
    // TODO: Restore Advanced scheduling and Priority support when implemented
    private var features: [(icon: String, text: String)] {
        [
            ("shield.fill", L10n.Paywall.featureBlocking),
            // ("clock.fill", "Advanced scheduling & time limits"),
            ("target", L10n.Paywall.featureFocus),
            // ("bolt.fill", "Priority support & early features"),
            ("chart.line.downtrend.xyaxis", L10n.Paywall.featureAnalytics)
        ]
    }

    var body: some View {
        ZStack {
            // Background
            Color(isDark ? .black : .white)
                .ignoresSafeArea()

            // Decorative Orb - Top Right
            VStack {
                HStack {
                    Spacer()
                    AnimatedOrbView(size: 120, level: 5)
                        .opacity(0.6)
                        .offset(x: 40, y: -40)
                }
                Spacer()
            }

            VStack(spacing: 0) {
                // Header
                header
                    .padding(.top, 12)

                ScrollView(showsIndicators: false) {
                    VStack(spacing: 0) {
                        // Title Section
                        titleSection
                            .padding(.horizontal, 24)
                            .padding(.bottom, 32)

                        // Social Proof
                        socialProofSection
                            .padding(.bottom, 32)

                        // Features List
                        featuresSection
                            .padding(.horizontal, 24)
                            .padding(.bottom, 32)

                        // Trial Toggle
//                        trialToggle
//                            .padding(.horizontal, 24)
//                            .padding(.bottom, 24)

                        // Pricing Plans
                        pricingSection
                            .padding(.horizontal, 24)
                            .padding(.bottom, 24)

                        // Legal Links
                        legalSection
                            .padding(.horizontal, 24)
                            .padding(.bottom, 180)
                    }
                }

                // Fixed Bottom CTA
                bottomCTA
            }
        }
        .task {
            await purchaseService.fetchOfferings()
        }
        .alert(L10n.Paywall.welcomeTitle, isPresented: $showSuccessAlert) {
            Button(L10n.Paywall.continueButton) {
                onPurchaseComplete?()
                dismiss()
            }
        } message: {
            Text(L10n.Paywall.welcomeMessage)
        }
        .alert(L10n.Paywall.error, isPresented: .init(
            get: { errorMessage != nil },
            set: { if !$0 { errorMessage = nil } }
        )) {
            Button(L10n.Paywall.ok) { errorMessage = nil }
        } message: {
            Text(errorMessage ?? "")
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack {
            Spacer()
                .frame(width: 44)

            Spacer()

            // PRO Badge
            HStack(spacing: 6) {
                Image(systemName: "sparkles")
                    .font(.system(size: 16))
                Text(L10n.Paywall.pro)
                    .font(.system(size: 14, weight: .heavy))
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(
                LinearGradient(
                    colors: [Color(hex: "8B5CF6"), Color(hex: "06B6D4")],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .clipShape(Capsule())

            Spacer()

            // Close Button
            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(isDark ? .white : .black)
                    .frame(width: 44, height: 44)
                    .background(isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.05))
                    .clipShape(Circle())
            }
        }
        .padding(.horizontal, 20)
    }

    // MARK: - Title Section

    private var titleSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(L10n.Paywall.title)
                .font(.system(size: 36, weight: .heavy))
                .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                .tracking(-1)
                .lineSpacing(4)

            Text(L10n.Paywall.subtitle)
                .font(.system(size: 16))
                .foregroundStyle(isDark ? .white.opacity(0.6) : Color(hex: "64748b"))
                .lineSpacing(4)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Social Proof Section

    private var socialProofSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 8) {
                Image(systemName: "person.2.fill")
                    .font(.system(size: 18))
                    .foregroundStyle(Color(hex: "8B5CF6"))

                Text(L10n.Paywall.usersLove)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
            }
            .padding(.horizontal, 24)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(reviews, id: \.author) { review in
                        reviewCard(text: review.text, author: review.author)
                    }
                }
                .padding(.horizontal, 24)
            }
        }
    }

    private func reviewCard(text: String, author: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 2) {
                ForEach(0..<5, id: \.self) { _ in
                    Image(systemName: "star.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(Color(hex: "FBBF24"))
                }
            }

            Text("\"\(text)\"")
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                .lineSpacing(4)

            Text("— \(author)")
                .font(.system(size: 12))
                .foregroundStyle(isDark ? .white.opacity(0.5) : Color(hex: "94a3b8"))
        }
        .padding(16)
        .frame(width: UIScreen.main.bounds.width * 0.7, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(isDark ? Color.white.opacity(0.05) : Color(hex: "f8fafc"))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.05), lineWidth: 0.5)
                )
        )
    }

    // MARK: - Features Section

    private var featuresSection: some View {
        VStack(spacing: 16) {
            ForEach(features, id: \.text) { feature in
                featureRow(icon: feature.icon, text: feature.text)
            }
        }
    }

    private func featureRow(icon: String, text: String) -> some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color(hex: "8B5CF6").opacity(0.1))
                    .frame(width: 36, height: 36)

                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundStyle(Color(hex: "8B5CF6"))
            }

            Text(text)
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))

            Spacer()

            Image(systemName: "checkmark")
                .font(.system(size: 18))
                .foregroundStyle(Color(hex: "10B981"))
        }
    }

    // MARK: - Trial Toggle

    private var trialToggle: some View {
        Button {
            withAnimation(.spring(response: 0.3)) {
                wantsTrial.toggle()
            }
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 8) {
                        Image(systemName: "lock.fill")
                            .font(.system(size: 16))
                            .foregroundStyle(Color(hex: "8B5CF6"))

                        Text(L10n.Paywall.trialToggle)
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
                    }

                    Text(L10n.Paywall.trialSubtitle)
                        .font(.system(size: 13))
                        .foregroundStyle(isDark ? .white.opacity(0.5) : Color(hex: "64748b"))
                }

                Spacer()

                // Toggle
                ZStack(alignment: wantsTrial ? .trailing : .leading) {
                    RoundedRectangle(cornerRadius: 15)
                        .fill(wantsTrial ? Color(hex: "8B5CF6") : (isDark ? Color(hex: "374151") : Color(hex: "d1d5db")))
                        .frame(width: 52, height: 30)

                    Circle()
                        .fill(.white)
                        .frame(width: 24, height: 24)
                        .padding(3)
                        .shadow(color: .black.opacity(0.2), radius: 3, y: 2)
                }
            }
            .padding(18)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(wantsTrial ? Color(hex: "8B5CF6").opacity(0.1) : (isDark ? Color.white.opacity(0.05) : Color(hex: "f8fafc")))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(wantsTrial ? Color(hex: "8B5CF6") : (isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.05)),
                                    lineWidth: wantsTrial ? 1.5 : 0.5)
                    )
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Pricing Section

    private var pricingSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(L10n.Paywall.choosePlan)
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))

            if purchaseService.monthlyPackage == nil && purchaseService.yearlyPackage == nil {
                // Loading state
                HStack {
                    Spacer()
                    ProgressView()
                        .tint(Color(hex: "8B5CF6"))
                    Text(L10n.Paywall.loadingPlans)
                        .font(.system(size: 14))
                        .foregroundStyle(isDark ? .white.opacity(0.6) : Color(hex: "6b7280"))
                        .padding(.leading, 12)
                    Spacer()
                }
                .padding(40)
            } else {
                // Yearly Plan
                if purchaseService.yearlyPackage != nil {
                    planCard(
                        type: .yearly,
                        title: L10n.Paywall.annual,
                        price: purchaseService.yearlyPrice,
                        subtitle: L10n.Paywall.billedAnnually(purchaseService.yearlyMonthlyEquivalent),
                        badge: L10n.Paywall.save(purchaseService.savingsPercent)
                    )
                }

                // Monthly Plan
                if purchaseService.monthlyPackage != nil {
                    planCard(
                        type: .monthly,
                        title: L10n.Paywall.monthly,
                        price: purchaseService.monthlyPrice,
                        subtitle: nil,
                        badge: nil
                    )
                }
            }
        }
    }

    private func planCard(type: PlanType, title: String, price: String, subtitle: String?, badge: String?) -> some View {
        Button {
            withAnimation(.spring(response: 0.3)) {
                selectedPlan = type
            }
        } label: {
            HStack {
                // Radio button
                ZStack {
                    Circle()
                        .stroke(selectedPlan == type ? Color(hex: "8B5CF6") : (isDark ? Color(hex: "6b7280") : Color(hex: "d1d5db")), lineWidth: 2)
                        .frame(width: 24, height: 24)

                    if selectedPlan == type {
                        Circle()
                            .fill(Color(hex: "8B5CF6"))
                            .frame(width: 24, height: 24)

                        Image(systemName: "checkmark")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(.white)
                    }
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))

                    if let subtitle = subtitle {
                        Text(subtitle)
                            .font(.system(size: 13))
                            .foregroundStyle(isDark ? .white.opacity(0.5) : Color(hex: "64748b"))
                    }
                }
                .padding(.leading, 14)

                Spacer()

                Text(price)
                    .font(.system(size: 20, weight: .heavy))
                    .foregroundStyle(isDark ? .white : Color(hex: "0f172a"))
            }
            .padding(20)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(isDark ? Color.white.opacity(0.03) : .white)
                    .overlay(
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(selectedPlan == type ? Color(hex: "8B5CF6") : (isDark ? Color.white.opacity(0.1) : Color.black.opacity(0.05)),
                                    lineWidth: selectedPlan == type ? 2 : 0.5)
                    )
            )
            .overlay(alignment: .topTrailing) {
                if let badge = badge {
                    Text(badge)
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(
                            LinearGradient(
                                colors: [Color(hex: "10B981"), Color(hex: "059669")],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .clipShape(UnevenRoundedRectangle(topLeadingRadius: 0, bottomLeadingRadius: 12, bottomTrailingRadius: 0, topTrailingRadius: 20))
                }
            }
        }
        .buttonStyle(.plain)
    }

    // MARK: - Legal Section

    private var legalSection: some View {
        VStack(spacing: 12) {
            Text(wantsTrial ? L10n.Paywall.legalTrial : L10n.Paywall.legalNoTrial)
                .font(.system(size: 11))
                .foregroundStyle(isDark ? .white.opacity(0.4) : Color(hex: "9ca3af"))
                .multilineTextAlignment(.center)
                .lineSpacing(4)

            HStack(spacing: 8) {
                Button {
                    if let url = URL(string: "https://lockin.fibipals.com/terms-of-service") {
                        UIApplication.shared.open(url)
                    }
                } label: {
                    Text(L10n.Paywall.termsOfService)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Color(hex: "8B5CF6"))
                }

                Text("•")
                    .foregroundStyle(isDark ? Color(hex: "6b7280") : Color(hex: "9ca3af"))

                Button {
                    if let url = URL(string: "https://lockin.fibipals.com/privacy-policy") {
                        UIApplication.shared.open(url)
                    }
                } label: {
                    Text(L10n.Paywall.privacyPolicy)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Color(hex: "8B5CF6"))
                }
            }

            Button {
                Task {
                    isLoading = true
                    let success = await purchaseService.restorePurchases()
                    isLoading = false

                    if success {
                        authService.updateProStatus(true)
                        showSuccessAlert = true
                    } else {
                        errorMessage = purchaseService.error ?? L10n.Paywall.noPurchasesFound
                    }
                }
            } label: {
                Text(L10n.Paywall.restorePurchases)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Color(hex: "8B5CF6"))
                    .underline()
            }
            .disabled(isLoading)
        }
    }

    // MARK: - Bottom CTA

    private var bottomCTA: some View {
        VStack(spacing: 12) {
            Button {
                handlePurchase()
            } label: {
                ZStack {
                    if isLoading || purchaseService.isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text(wantsTrial ? L10n.Paywall.startTrial : L10n.Paywall.subscribeNow)
                            .font(.system(size: 18, weight: .heavy))
                            .foregroundStyle(.white)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 18)
                .background(
                    LinearGradient(
                        colors: isLoading ? [Color(hex: "9ca3af"), Color(hex: "9ca3af")] : [Color(hex: "8B5CF6"), Color(hex: "06B6D4")],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .shadow(color: Color(hex: "8B5CF6").opacity(0.4), radius: 16, y: 8)
            }
            .disabled(isLoading || purchaseService.isLoading || (purchaseService.monthlyPackage == nil && purchaseService.yearlyPackage == nil))

            Text("\(selectedPlan == .yearly ? purchaseService.yearlyPrice + L10n.Paywall.perYear : purchaseService.monthlyPrice + L10n.Paywall.perMonth) • \(L10n.Paywall.cancelInAppStore)")
                .font(.system(size: 12))
                .foregroundStyle(isDark ? .white.opacity(0.5) : Color(hex: "9ca3af"))
        }
        .padding(.horizontal, 24)
        .padding(.top, 16)
        .padding(.bottom, 40)
        .background(
            Rectangle()
                .fill(isDark ? Color.black.opacity(0.95) : Color.white.opacity(0.95))
                .shadow(color: .black.opacity(0.05), radius: 10, y: -5)
        )
    }

    // MARK: - Purchase Handler

    private func handlePurchase() {
        let package = selectedPlan == .yearly ? purchaseService.yearlyPackage : purchaseService.monthlyPackage
        guard let package = package else { return }

        Task {
            isLoading = true
            let success = await purchaseService.purchase(package: package)
            isLoading = false

            if success {
                authService.updateProStatus(true)
                showSuccessAlert = true
            } else if let error = purchaseService.error {
                errorMessage = error
            }
        }
    }
}

#Preview {
    PaywallView()
        .environment(PurchaseService())
        .environment(AuthService())
}
