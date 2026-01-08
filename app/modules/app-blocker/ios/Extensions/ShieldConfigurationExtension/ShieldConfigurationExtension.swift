import ManagedSettingsUI
import ManagedSettings
import UIKit

/// Shield Configuration Extension
/// Provides custom UI for the blocking screen shown when user tries to open a blocked app.
class ShieldConfigurationExtension: ShieldConfigurationDataSource {

    // MARK: - Localization Helpers

    private func localizedString(_ key: String, comment: String = "") -> String {
        return NSLocalizedString(key, bundle: Bundle(for: type(of: self)), comment: comment)
    }

    private func localizedStringWithFormat(_ format: String, _ arguments: CVarArg...) -> String {
        let localizedFormat = localizedString(format)
        return String(format: localizedFormat, arguments: arguments)
    }

    // MARK: - Shield Configuration for Applications

    override func configuration(shielding application: Application) -> ShieldConfiguration {
        // Custom blocking screen for apps
        return ShieldConfiguration(
            backgroundBlurStyle: .systemThickMaterialDark,
            backgroundColor: UIColor.black,
            icon: createIcon(),
            title: ShieldConfiguration.Label(
                text: localizedString("shield.app.title.simple", comment: "App blocked title"),
                color: .white
            ),
            subtitle: ShieldConfiguration.Label(
                text: localizedString("shield.app.subtitle.focus", comment: "App blocked subtitle"),
                color: UIColor.lightGray
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: localizedString("shield.button.unlock.15", comment: "Unlock for 15 min button"),
                color: .white
            ),
            primaryButtonBackgroundColor: UIColor.systemBlue,
            secondaryButtonLabel: ShieldConfiguration.Label(
                text: localizedString("shield.button.close", comment: "Close button"),
                color: UIColor.lightGray
            )
        )
    }

    // MARK: - Shield Configuration for Application Categories

    override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
        let categoryName = category.localizedDisplayName ?? localizedString("shield.fallback.category", comment: "Fallback category name")
        // Custom blocking screen for app categories
        return ShieldConfiguration(
            backgroundBlurStyle: .systemThickMaterialDark,
            backgroundColor: UIColor.black,
            icon: createIcon(),
            title: ShieldConfiguration.Label(
                text: localizedStringWithFormat("shield.category.title", categoryName),
                color: .white
            ),
            subtitle: ShieldConfiguration.Label(
                text: localizedString("shield.category.subtitle", comment: "Category blocked subtitle"),
                color: UIColor.lightGray
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: localizedString("shield.button.unlock.15", comment: "Unlock for 15 min button"),
                color: .white
            ),
            primaryButtonBackgroundColor: UIColor.systemBlue,
            secondaryButtonLabel: ShieldConfiguration.Label(
                text: localizedString("shield.button.close", comment: "Close button"),
                color: UIColor.lightGray
            )
        )
    }

    // MARK: - Shield Configuration for Web Domains

    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        let domainName = webDomain.domain ?? localizedString("shield.fallback.website", comment: "Fallback website name")
        // Custom blocking screen for websites
        return ShieldConfiguration(
            backgroundBlurStyle: .systemThickMaterialDark,
            backgroundColor: UIColor.black,
            icon: createIcon(),
            title: ShieldConfiguration.Label(
                text: localizedString("shield.website.title.simple", comment: "Website blocked title"),
                color: .white
            ),
            subtitle: ShieldConfiguration.Label(
                text: localizedStringWithFormat("shield.website.subtitle.domain", domainName),
                color: UIColor.lightGray
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: localizedString("shield.button.unlock.15", comment: "Unlock for 15 min button"),
                color: .white
            ),
            primaryButtonBackgroundColor: UIColor.systemBlue,
            secondaryButtonLabel: ShieldConfiguration.Label(
                text: localizedString("shield.button.close", comment: "Close button"),
                color: UIColor.lightGray
            )
        )
    }

    // MARK: - Shield Configuration for Web Domain Categories

    override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory) -> ShieldConfiguration {
        return ShieldConfiguration(
            backgroundBlurStyle: .systemThickMaterialDark,
            backgroundColor: UIColor.black,
            icon: createIcon(),
            title: ShieldConfiguration.Label(
                text: localizedString("shield.website.category.title", comment: "Website category blocked title"),
                color: .white
            ),
            subtitle: ShieldConfiguration.Label(
                text: localizedString("shield.website.category.subtitle", comment: "Website category blocked subtitle"),
                color: UIColor.lightGray
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: localizedString("shield.button.unlock.15", comment: "Unlock for 15 min button"),
                color: .white
            ),
            primaryButtonBackgroundColor: UIColor.systemBlue,
            secondaryButtonLabel: ShieldConfiguration.Label(
                text: localizedString("shield.button.close", comment: "Close button"),
                color: UIColor.lightGray
            )
        )
    }

    // MARK: - Helper Methods

    private func createIcon() -> UIImage? {
        // Create a simple lock icon programmatically
        let size = CGSize(width: 60, height: 60)
        UIGraphicsBeginImageContextWithOptions(size, false, 0)

        guard let context = UIGraphicsGetCurrentContext() else { return nil }

        // Draw circle background
        context.setFillColor(UIColor.systemBlue.cgColor)
        context.fillEllipse(in: CGRect(origin: .zero, size: size))

        // Draw lock icon (simplified)
        context.setFillColor(UIColor.white.cgColor)

        // Lock body
        let bodyRect = CGRect(x: 18, y: 28, width: 24, height: 20)
        context.fill(bodyRect)

        // Lock shackle
        context.setStrokeColor(UIColor.white.cgColor)
        context.setLineWidth(4)
        let shacklePath = UIBezierPath()
        shacklePath.move(to: CGPoint(x: 22, y: 28))
        shacklePath.addLine(to: CGPoint(x: 22, y: 20))
        shacklePath.addCurve(
            to: CGPoint(x: 38, y: 20),
            controlPoint1: CGPoint(x: 22, y: 12),
            controlPoint2: CGPoint(x: 38, y: 12)
        )
        shacklePath.addLine(to: CGPoint(x: 38, y: 28))
        context.addPath(shacklePath.cgPath)
        context.strokePath()

        let image = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()

        return image
    }
}
