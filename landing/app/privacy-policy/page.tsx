import React from "react";
import Link from "next/link";

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        <div className="glass-card rounded-3xl p-8 sm:p-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gradient">Privacy Policy</h1>
          <p className="text-[var(--text-secondary)] mb-8">
            Last updated: January 14, 2025
          </p>

          <div className="space-y-8 text-[var(--text-secondary)]">
            <p className="text-base leading-relaxed">
              LockIn: Screen Time Control (&ldquo;LockIn&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) respects your
              privacy and is committed to protecting your personal data. This Privacy
              Policy explains how we collect, use, and protect your information when
              you use our mobile application and related services.
            </p>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">1. Information We Collect</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-[var(--text-color)] mb-2">1.1 Account and Login Information</h3>
                  <p className="mb-2">When you create an account or log in, we may collect:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Email address</li>
                    <li>Authentication-related information (such as login tokens)</li>
                  </ul>
                  <p className="mt-2">
                    This information is used solely to authenticate you and manage your account.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[var(--text-color)] mb-2">1.2 Subscription Information</h3>
                  <p>
                    LockIn offers monthly and yearly subscription plans. Payments are
                    processed by third-party platforms (such as Google Play or Apple App
                    Store). We do not collect or store your credit card or payment details.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[var(--text-color)] mb-2">1.3 App Usage Data (On-Device Only)</h3>
                  <p className="mb-2">
                    To provide screen time monitoring and app blocking features, LockIn
                    accesses certain usage data on your device. This data:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Is processed locally on your device</li>
                    <li>Is not sold or shared with third parties</li>
                    <li>Is not used for advertising or tracking</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">2. Permissions We Use</h2>
              <p className="mb-3">LockIn requires specific system permissions to function correctly:</p>
              <ul className="space-y-3 ml-4">
                <li>
                  <span className="font-medium text-[var(--text-color)]">Usage Access Permission:</span>{" "}
                  Used to monitor app usage and screen time statistics.
                </li>
                <li>
                  <span className="font-medium text-[var(--text-color)]">Display Over Other Apps:</span>{" "}
                  Used to show blocking screens and reminders when usage limits are reached.
                </li>
                <li>
                  <span className="font-medium text-[var(--text-color)]">Accessibility / App Control Permissions:</span>{" "}
                  Used to restrict or block access to selected apps and limit scrolling where applicable.
                </li>
              </ul>
              <p className="mt-3">
                These permissions are used strictly for the core functionality of the
                app and are never used to collect personal content or sensitive user data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">3. How We Use Your Information</h2>
              <p className="mb-2">We use the collected information to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Provide and maintain the app&apos;s core features</li>
                <li>Authenticate users and manage accounts</li>
                <li>Enable subscriptions and premium features</li>
                <li>Improve app performance and reliability</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">4. Data Sharing</h2>
              <p className="mb-2">
                We do not sell, rent, or trade your personal data. We may share limited
                information only when:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Required by law or legal process</li>
                <li>Necessary to protect our rights or prevent abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">5. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to
                protect your data against unauthorized access, loss, or misuse.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">6. Data Retention</h2>
              <p>
                We retain personal data only for as long as necessary to provide the
                service or comply with legal obligations. You may request deletion of
                your account and associated data at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">7. Children&apos;s Privacy</h2>
              <p>
                LockIn is not intended for use by children under the age of 13 without
                parental consent. We do not knowingly collect personal data from
                children without appropriate authorization.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">8. Your Rights</h2>
              <p className="mb-2">Depending on your location, you may have the right to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Access your personal data</li>
                <li>Request correction or deletion of your data</li>
                <li>Withdraw consent where applicable</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">9. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. Changes will be
                posted on this page with an updated revision date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">10. Contact Us</h2>
              <p className="mb-3">
                If you have any questions or concerns about this Privacy Policy, please
                contact us at:
              </p>
              <a
                href="mailto:lockin@fibipals.com"
                className="inline-flex items-center gap-2 text-[var(--accent-primary)] hover:underline"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                lockin@fibipals.com
              </a>
            </section>
          </div>
        </div>

        <p className="text-center text-sm text-[var(--text-secondary)] mt-8">
          &copy; {new Date().getFullYear()} LockIn. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
