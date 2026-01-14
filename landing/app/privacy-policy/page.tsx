import React from "react";

const PrivacyPolicy: React.FC = () => {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px" }}>
      <h1>Privacy Policy</h1>
      <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>

      <p>
        LockIn: Screen Time Control ("LockIn", "we", "our", or "us") respects your
        privacy and is committed to protecting your personal data. This Privacy
        Policy explains how we collect, use, and protect your information when
        you use our mobile application and related services.
      </p>

      <h2>1. Information We Collect</h2>

      <h3>1.1 Account and Login Information</h3>
      <p>
        When you create an account or log in, we may collect:
      </p>
      <ul>
        <li>Email address</li>
        <li>Authentication-related information (such as login tokens)</li>
      </ul>
      <p>
        This information is used solely to authenticate you and manage your
        account.
      </p>

      <h3>1.2 Subscription Information</h3>
      <p>
        LockIn offers monthly and yearly subscription plans. Payments are
        processed by third-party platforms (such as Google Play or Apple App
        Store). We do not collect or store your credit card or payment details.
      </p>

      <h3>1.3 App Usage Data (On-Device Only)</h3>
      <p>
        To provide screen time monitoring and app blocking features, LockIn
        accesses certain usage data on your device. This data:
      </p>
      <ul>
        <li>Is processed locally on your device</li>
        <li>Is not sold or shared with third parties</li>
        <li>Is not used for advertising or tracking</li>
      </ul>

      <h2>2. Permissions We Use</h2>
      <p>
        LockIn requires specific system permissions to function correctly:
      </p>
      <ul>
        <li>
          <strong>Usage Access Permission:</strong> Used to monitor app usage and
          screen time statistics.
        </li>
        <li>
          <strong>Display Over Other Apps:</strong> Used to show blocking screens
          and reminders when usage limits are reached.
        </li>
        <li>
          <strong>Accessibility / App Control Permissions:</strong> Used to
          restrict or block access to selected apps and limit scrolling where
          applicable.
        </li>
      </ul>
      <p>
        These permissions are used strictly for the core functionality of the
        app and are never used to collect personal content or sensitive user
        data.
      </p>

      <h2>3. How We Use Your Information</h2>
      <p>
        We use the collected information to:
      </p>
      <ul>
        <li>Provide and maintain the app’s core features</li>
        <li>Authenticate users and manage accounts</li>
        <li>Enable subscriptions and premium features</li>
        <li>Improve app performance and reliability</li>
      </ul>

      <h2>4. Data Sharing</h2>
      <p>
        We do not sell, rent, or trade your personal data. We may share limited
        information only when:
      </p>
      <ul>
        <li>Required by law or legal process</li>
        <li>Necessary to protect our rights or prevent abuse</li>
      </ul>

      <h2>5. Data Security</h2>
      <p>
        We implement appropriate technical and organizational measures to
        protect your data against unauthorized access, loss, or misuse.
      </p>

      <h2>6. Data Retention</h2>
      <p>
        We retain personal data only for as long as necessary to provide the
        service or comply with legal obligations. You may request deletion of
        your account and associated data at any time.
      </p>

      <h2>7. Children’s Privacy</h2>
      <p>
        LockIn is not intended for use by children under the age of 13 without
        parental consent. We do not knowingly collect personal data from
        children without appropriate authorization.
      </p>

      <h2>8. Your Rights</h2>
      <p>
        Depending on your location, you may have the right to:
      </p>
      <ul>
        <li>Access your personal data</li>
        <li>Request correction or deletion of your data</li>
        <li>Withdraw consent where applicable</li>
      </ul>

      <h2>9. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Changes will be
        posted on this page with an updated revision date.
      </p>

      <h2>10. Contact Us</h2>
      <p>
        If you have any questions or concerns about this Privacy Policy, please
        contact us at:
      </p>
      <p>
        <strong>Email:</strong> lockin@fibipals.com
      </p>
    </div>
  );
};

export default PrivacyPolicy;
