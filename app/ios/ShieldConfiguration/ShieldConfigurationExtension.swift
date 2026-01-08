import Foundation
import ManagedSettings
import ManagedSettingsUI
import UIKit

/// Customizes the shield (blocking screen) shown when user tries to open a blocked app
class ShieldConfigurationExtension: ShieldConfigurationDataSource {

    // MARK: - Localization Helpers

    private func localizedString(_ key: String, comment: String = "") -> String {
        return NSLocalizedString(key, bundle: Bundle(for: type(of: self)), comment: comment)
    }

    private func localizedStringWithFormat(_ format: String, _ arguments: CVarArg...) -> String {
        let localizedFormat = localizedString(format)
        return String(format: localizedFormat, arguments: arguments)
    }

    override func configuration(shielding application: Application) -> ShieldConfiguration {
        let appName = application.localizedDisplayName ?? localizedString("shield.fallback.app", comment: "Fallback name for app")

        return ShieldConfiguration(
            backgroundBlurStyle: .systemThickMaterial,
            backgroundColor: UIColor.systemBackground,
            icon: UIImage(systemName: "lock.shield.fill"),
            title: ShieldConfiguration.Label(
                text: localizedStringWithFormat("shield.app.title", appName),
                color: .label
            ),
            subtitle: ShieldConfiguration.Label(
                text: localizedString("shield.app.subtitle", comment: "Shield subtitle for blocked app"),
                color: .secondaryLabel
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: localizedString("shield.button.unlock", comment: "Unlock button text"),
                color: .white
            ),
            primaryButtonBackgroundColor: UIColor.systemBlue,
            secondaryButtonLabel: ShieldConfiguration.Label(
                text: localizedString("shield.button.close", comment: "Close button text"),
                color: .systemBlue
            )
        )
    }

    override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
        return configuration(shielding: application)
    }

    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        let domainName = webDomain.domain ?? localizedString("shield.fallback.website", comment: "Fallback name for website")

        return ShieldConfiguration(
            backgroundBlurStyle: .systemThickMaterial,
            backgroundColor: UIColor.systemBackground,
            icon: UIImage(systemName: "globe.badge.chevron.backward"),
            title: ShieldConfiguration.Label(
                text: localizedStringWithFormat("shield.website.title", domainName),
                color: .label
            ),
            subtitle: ShieldConfiguration.Label(
                text: localizedString("shield.website.subtitle", comment: "Shield subtitle for blocked website"),
                color: .secondaryLabel
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: localizedString("shield.button.unlock", comment: "Unlock button text"),
                color: .white
            ),
            primaryButtonBackgroundColor: UIColor.systemBlue,
            secondaryButtonLabel: ShieldConfiguration.Label(
                text: localizedString("shield.button.close", comment: "Close button text"),
                color: .systemBlue
            )
        )
    }

    override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory) -> ShieldConfiguration {
        return configuration(shielding: webDomain)
    }
}
