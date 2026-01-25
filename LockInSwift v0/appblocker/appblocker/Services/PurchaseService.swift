import Foundation
import Observation
import RevenueCat

@Observable
final class PurchaseService {
    // RevenueCat API Keys
    private static let iosAPIKey = "appl_DXtiSBNTmQOgIEgTfHOiqHSFlbm"

    // Entitlement IDs
    private static let proYearlyEntitlement = "annual_sub_lockin"
    private static let proMonthlyEntitlement = "monthly_sub_lockin"

    var isLoading = false
    var error: String?
    var isPro = false

    var monthlyPackage: Package?
    var yearlyPackage: Package?

    var customerInfo: CustomerInfo?

    // Computed properties for UI
    var monthlyPrice: String {
        monthlyPackage?.localizedPriceString ?? "$4.99"
    }

    var yearlyPrice: String {
        yearlyPackage?.localizedPriceString ?? "$29.99"
    }

    var yearlyMonthlyEquivalent: String {
        guard let yearly = yearlyPackage else { return "$2.49" }
        let monthlyPrice = yearly.storeProduct.price as Decimal / 12
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = yearlyPackage?.storeProduct.priceFormatter?.locale ?? .current
        return formatter.string(from: monthlyPrice as NSDecimalNumber) ?? "$2.49"
    }

    var savingsPercent: Int {
        guard let monthlyPkg = monthlyPackage,
              let yearlyPkg = yearlyPackage else {
            return 58 // Default savings estimate
        }

        let monthlyPrice = NSDecimalNumber(decimal: monthlyPkg.storeProduct.price).doubleValue
        let yearlyPrice = NSDecimalNumber(decimal: yearlyPkg.storeProduct.price).doubleValue

        guard monthlyPrice > 0 else { return 58 }

        let yearlyMonthlyEquiv = yearlyPrice / 12.0
        let savings = ((monthlyPrice - yearlyMonthlyEquiv) / monthlyPrice) * 100.0

        return max(0, Int(savings.rounded()))
    }

    init() {
        configure()
    }

    // MARK: - Configuration

    private func configure() {
        Purchases.logLevel = .debug
        Purchases.configure(withAPIKey: Self.iosAPIKey)
    }

    // MARK: - Fetch Offerings

    @MainActor
    func fetchOfferings() async {
        isLoading = true
        defer { isLoading = false }

        do {
            let offerings = try await Purchases.shared.offerings()

            var allPackages = offerings.current?.availablePackages ?? []

            // Combine packages from all offerings if needed
            if allPackages.count < 2 {
                for offering in offerings.all.values {
                    allPackages.append(contentsOf: offering.availablePackages)
                }
            }

            // Find monthly package
            monthlyPackage = allPackages.first { pkg in
                pkg.identifier.lowercased().contains("monthly") ||
                pkg.identifier.lowercased().contains("month")
            }

            // Find yearly package
            yearlyPackage = allPackages.first { pkg in
                pkg.identifier.lowercased().contains("yearly") ||
                pkg.identifier.lowercased().contains("annual") ||
                pkg.identifier.lowercased().contains("year")
            }

        } catch {
            self.error = "Failed to load offerings: \(error.localizedDescription)"
            print("❌ Error fetching offerings: \(error)")
        }
    }

    // MARK: - Purchase

    @MainActor
    func purchase(package: Package) async -> Bool {
        isLoading = true
        defer { isLoading = false }

        do {
            let result = try await Purchases.shared.purchase(package: package)
            customerInfo = result.customerInfo

            // Check for PRO entitlements
            if result.customerInfo.entitlements[Self.proYearlyEntitlement]?.isActive == true ||
               result.customerInfo.entitlements[Self.proMonthlyEntitlement]?.isActive == true {
                isPro = true
                return true
            }

            return false
        } catch {
            if let purchaseError = error as? RevenueCat.ErrorCode {
                if purchaseError == .purchaseCancelledError {
                    // User cancelled, not an error
                    return false
                }
            }
            self.error = "Purchase failed: \(error.localizedDescription)"
            print("❌ Purchase error: \(error)")
            return false
        }
    }

    // MARK: - Restore Purchases

    @MainActor
    func restorePurchases() async -> Bool {
        isLoading = true
        defer { isLoading = false }

        do {
            let customerInfo = try await Purchases.shared.restorePurchases()
            self.customerInfo = customerInfo

            let hasPro = customerInfo.entitlements[Self.proYearlyEntitlement]?.isActive == true ||
                         customerInfo.entitlements[Self.proMonthlyEntitlement]?.isActive == true

            if hasPro {
                isPro = true
                return true
            } else {
                error = "No previous purchases found"
                return false
            }
        } catch {
            self.error = "Restore failed: \(error.localizedDescription)"
            print("❌ Restore error: \(error)")
            return false
        }
    }

    // MARK: - Check Subscription Status

    @MainActor
    func checkSubscriptionStatus() async {
        do {
            let customerInfo = try await Purchases.shared.customerInfo()
            self.customerInfo = customerInfo

            isPro = customerInfo.entitlements[Self.proYearlyEntitlement]?.isActive == true ||
                    customerInfo.entitlements[Self.proMonthlyEntitlement]?.isActive == true
        } catch {
            print("❌ Error checking subscription: \(error)")
        }
    }

    // MARK: - Login/Logout for RevenueCat

    func login(userId: String) async {
        do {
            let (customerInfo, _) = try await Purchases.shared.logIn(userId)
            await MainActor.run {
                self.customerInfo = customerInfo
                self.isPro = customerInfo.entitlements[Self.proYearlyEntitlement]?.isActive == true ||
                             customerInfo.entitlements[Self.proMonthlyEntitlement]?.isActive == true
            }
        } catch {
            print("❌ RevenueCat login error: \(error)")
        }
    }

    func logout() async {
        do {
            let customerInfo = try await Purchases.shared.logOut()
            await MainActor.run {
                self.customerInfo = customerInfo
                self.isPro = false
            }
        } catch {
            print("❌ RevenueCat logout error: \(error)")
        }
    }
}
