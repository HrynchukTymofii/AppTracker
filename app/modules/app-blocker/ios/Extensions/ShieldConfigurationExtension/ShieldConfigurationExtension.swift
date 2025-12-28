import ManagedSettingsUI
import ManagedSettings
import UIKit

/// Shield Configuration Extension
/// Provides custom UI for the blocking screen shown when user tries to open a blocked app.
class ShieldConfigurationExtension: ShieldConfigurationDataSource {

    // MARK: - Shield Configuration for Applications

    override func configuration(shielding application: Application) -> ShieldConfiguration {
        // Custom blocking screen for apps
        return ShieldConfiguration(
            backgroundBlurStyle: .systemThickMaterialDark,
            backgroundColor: UIColor.black,
            icon: createIcon(),
            title: ShieldConfiguration.Label(
                text: "App Blocked",
                color: .white
            ),
            subtitle: ShieldConfiguration.Label(
                text: "This app is currently blocked.\nStay focused on what matters!",
                color: UIColor.lightGray
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Unlock for 15 min",
                color: .white
            ),
            primaryButtonBackgroundColor: UIColor.systemBlue,
            secondaryButtonLabel: ShieldConfiguration.Label(
                text: "Close",
                color: UIColor.lightGray
            )
        )
    }

    // MARK: - Shield Configuration for Application Categories

    override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
        // Custom blocking screen for app categories
        return ShieldConfiguration(
            backgroundBlurStyle: .systemThickMaterialDark,
            backgroundColor: UIColor.black,
            icon: createIcon(),
            title: ShieldConfiguration.Label(
                text: "\(category.localizedDisplayName ?? "Category") Blocked",
                color: .white
            ),
            subtitle: ShieldConfiguration.Label(
                text: "Apps in this category are blocked.\nFocus on your goals!",
                color: UIColor.lightGray
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Unlock for 15 min",
                color: .white
            ),
            primaryButtonBackgroundColor: UIColor.systemBlue,
            secondaryButtonLabel: ShieldConfiguration.Label(
                text: "Close",
                color: UIColor.lightGray
            )
        )
    }

    // MARK: - Shield Configuration for Web Domains

    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        // Custom blocking screen for websites
        return ShieldConfiguration(
            backgroundBlurStyle: .systemThickMaterialDark,
            backgroundColor: UIColor.black,
            icon: createIcon(),
            title: ShieldConfiguration.Label(
                text: "Website Blocked",
                color: .white
            ),
            subtitle: ShieldConfiguration.Label(
                text: "\(webDomain.domain ?? "This website") is blocked.\nStay on track!",
                color: UIColor.lightGray
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Unlock for 15 min",
                color: .white
            ),
            primaryButtonBackgroundColor: UIColor.systemBlue,
            secondaryButtonLabel: ShieldConfiguration.Label(
                text: "Close",
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
                text: "Website Category Blocked",
                color: .white
            ),
            subtitle: ShieldConfiguration.Label(
                text: "Websites in this category are blocked.\nKeep focusing!",
                color: UIColor.lightGray
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Unlock for 15 min",
                color: .white
            ),
            primaryButtonBackgroundColor: UIColor.systemBlue,
            secondaryButtonLabel: ShieldConfiguration.Label(
                text: "Close",
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
