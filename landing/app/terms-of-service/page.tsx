import React from "react";
import Link from "next/link";

const TermsOfService: React.FC = () => {
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
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gradient">Terms of Service</h1>
          <p className="text-[var(--text-secondary)] mb-8">
            Last updated: January 14, 2025
          </p>

          <div className="space-y-8 text-[var(--text-secondary)]">
            <p className="text-base leading-relaxed">
              Welcome to LockIn: Screen Time Control (&ldquo;LockIn&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;).
              By downloading, installing, or using our mobile application, you agree to be bound by these
              Terms of Service. Please read them carefully before using the app.
            </p>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using LockIn, you acknowledge that you have read, understood, and agree to
                be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms,
                please do not use the app.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">2. Description of Service</h2>
              <p className="mb-3">
                LockIn is a screen time management application designed to help users:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Monitor and track app usage and screen time</li>
                <li>Set limits on specific apps or categories</li>
                <li>Block access to distracting applications</li>
                <li>Improve digital wellness and productivity</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">3. Eligibility</h2>
              <p>
                You must be at least 13 years of age to use LockIn. If you are under 18, you must have
                permission from a parent or legal guardian to use this app. By using LockIn, you represent
                and warrant that you meet these eligibility requirements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">4. User Accounts</h2>
              <div className="space-y-3">
                <p>
                  To access certain features, you may need to create an account. You agree to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Provide accurate and complete registration information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">5. Subscriptions and Payments</h2>
              <div className="space-y-3">
                <p>
                  LockIn offers both free and premium subscription plans:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Premium subscriptions are billed on a monthly or yearly basis</li>
                  <li>Payment is processed through the Google Play Store or Apple App Store</li>
                  <li>Subscriptions automatically renew unless canceled before the renewal date</li>
                  <li>You can manage or cancel your subscription through your device&apos;s app store settings</li>
                </ul>
                <p>
                  Refunds are subject to the policies of the respective app stores. We do not directly
                  process payments or issue refunds.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">6. Permissions and Device Access</h2>
              <p className="mb-3">
                LockIn requires certain device permissions to function properly, including:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Usage Access Permission for monitoring screen time</li>
                <li>Display Over Other Apps for showing blocking screens</li>
                <li>Accessibility permissions for app control features</li>
              </ul>
              <p className="mt-3">
                By granting these permissions, you authorize LockIn to access and use these device
                features solely for providing the intended functionality.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">7. Acceptable Use</h2>
              <p className="mb-3">You agree not to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Use the app for any unlawful purpose</li>
                <li>Attempt to bypass, disable, or interfere with security features</li>
                <li>Reverse engineer, decompile, or disassemble the app</li>
                <li>Use the app to harass, abuse, or harm others</li>
                <li>Distribute viruses or malicious code through the app</li>
                <li>Use automated systems to access the app without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">8. Intellectual Property</h2>
              <p>
                All content, features, and functionality of LockIn, including but not limited to text,
                graphics, logos, icons, images, and software, are owned by us or our licensors and are
                protected by copyright, trademark, and other intellectual property laws. You may not
                reproduce, distribute, or create derivative works without our express written consent.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">9. Disclaimer of Warranties</h2>
              <p>
                LockIn is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind,
                either express or implied. We do not guarantee that the app will be uninterrupted,
                error-free, or completely secure. Your use of the app is at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">10. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, LockIn and its affiliates shall not be liable
                for any indirect, incidental, special, consequential, or punitive damages arising from
                your use of the app, including but not limited to loss of data, productivity, or profits.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">11. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless LockIn, its officers, directors, employees,
                and agents from any claims, damages, losses, or expenses arising from your use of the
                app or violation of these Terms of Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">12. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your access to LockIn at any time,
                without notice, for conduct that we believe violates these Terms of Service or is
                harmful to other users, us, or third parties. Upon termination, your right to use
                the app will immediately cease.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">13. Changes to Terms</h2>
              <p>
                We may update these Terms of Service from time to time. We will notify you of any
                material changes by posting the new terms on this page with an updated revision date.
                Your continued use of the app after changes are posted constitutes your acceptance of
                the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">14. Governing Law</h2>
              <p>
                These Terms of Service shall be governed by and construed in accordance with applicable
                laws, without regard to conflict of law principles. Any disputes arising from these
                terms shall be resolved in the appropriate courts.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">15. Contact Us</h2>
              <p className="mb-3">
                If you have any questions about these Terms of Service, please contact us at:
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

export default TermsOfService;
