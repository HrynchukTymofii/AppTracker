'use client';

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const TermsOfService: React.FC = () => {
  const { t } = useLanguage();

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
          {t('common.backToHome')}
        </Link>

        <div className="glass-card rounded-3xl p-8 sm:p-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gradient">{t('termsOfService.title')}</h1>
          <p className="text-[var(--text-secondary)] mb-8">
            {t('common.lastUpdated')}
          </p>

          <div className="space-y-8 text-[var(--text-secondary)]">
            <p className="text-base leading-relaxed">
              {t('termsOfService.intro')}
            </p>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">{t('termsOfService.sections.acceptance.title')}</h2>
              <p>
                {t('termsOfService.sections.acceptance.text')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">{t('termsOfService.sections.description.title')}</h2>
              <p className="mb-3">
                {t('termsOfService.sections.description.intro')}
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>{t('termsOfService.sections.description.items.0')}</li>
                <li>{t('termsOfService.sections.description.items.1')}</li>
                <li>{t('termsOfService.sections.description.items.2')}</li>
                <li>{t('termsOfService.sections.description.items.3')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">{t('termsOfService.sections.eligibility.title')}</h2>
              <p>
                {t('termsOfService.sections.eligibility.text')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">{t('termsOfService.sections.accounts.title')}</h2>
              <div className="space-y-3">
                <p>
                  {t('termsOfService.sections.accounts.intro')}
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>{t('termsOfService.sections.accounts.items.0')}</li>
                  <li>{t('termsOfService.sections.accounts.items.1')}</li>
                  <li>{t('termsOfService.sections.accounts.items.2')}</li>
                  <li>{t('termsOfService.sections.accounts.items.3')}</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">{t('termsOfService.sections.subscriptions.title')}</h2>
              <div className="space-y-3">
                <p>
                  {t('termsOfService.sections.subscriptions.intro')}
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>{t('termsOfService.sections.subscriptions.items.0')}</li>
                  <li>{t('termsOfService.sections.subscriptions.items.1')}</li>
                  <li>{t('termsOfService.sections.subscriptions.items.2')}</li>
                  <li>{t('termsOfService.sections.subscriptions.items.3')}</li>
                </ul>
                <p>
                  {t('termsOfService.sections.subscriptions.note')}
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">{t('termsOfService.sections.permissions.title')}</h2>
              <p className="mb-3">
                {t('termsOfService.sections.permissions.intro')}
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>{t('termsOfService.sections.permissions.items.0')}</li>
                <li>{t('termsOfService.sections.permissions.items.1')}</li>
                <li>{t('termsOfService.sections.permissions.items.2')}</li>
              </ul>
              <p className="mt-3">
                {t('termsOfService.sections.permissions.note')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">{t('termsOfService.sections.acceptableUse.title')}</h2>
              <p className="mb-3">{t('termsOfService.sections.acceptableUse.intro')}</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>{t('termsOfService.sections.acceptableUse.items.0')}</li>
                <li>{t('termsOfService.sections.acceptableUse.items.1')}</li>
                <li>{t('termsOfService.sections.acceptableUse.items.2')}</li>
                <li>{t('termsOfService.sections.acceptableUse.items.3')}</li>
                <li>{t('termsOfService.sections.acceptableUse.items.4')}</li>
                <li>{t('termsOfService.sections.acceptableUse.items.5')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">{t('termsOfService.sections.ip.title')}</h2>
              <p>
                {t('termsOfService.sections.ip.text')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">{t('termsOfService.sections.disclaimer.title')}</h2>
              <p>
                {t('termsOfService.sections.disclaimer.text')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">{t('termsOfService.sections.liability.title')}</h2>
              <p>
                {t('termsOfService.sections.liability.text')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">{t('termsOfService.sections.indemnification.title')}</h2>
              <p>
                {t('termsOfService.sections.indemnification.text')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">{t('termsOfService.sections.termination.title')}</h2>
              <p>
                {t('termsOfService.sections.termination.text')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">{t('termsOfService.sections.changes.title')}</h2>
              <p>
                {t('termsOfService.sections.changes.text')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">{t('termsOfService.sections.governingLaw.title')}</h2>
              <p>
                {t('termsOfService.sections.governingLaw.text')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">{t('termsOfService.sections.contact.title')}</h2>
              <p className="mb-3">
                {t('termsOfService.sections.contact.text')}
              </p>
              <a
                href={`mailto:${t('common.contactEmail')}`}
                className="inline-flex items-center gap-2 text-[var(--accent-primary)] hover:underline"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {t('common.contactEmail')}
              </a>
            </section>
          </div>
        </div>

        <p className="text-center text-sm text-[var(--text-secondary)] mt-8">
          {t('common.copyright', { year: new Date().getFullYear() })}
        </p>
      </div>
    </div>
  );
};

export default TermsOfService;
