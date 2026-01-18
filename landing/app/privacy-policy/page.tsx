'use client';

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const PrivacyPolicy: React.FC = () => {
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
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gradient">{t('privacyPolicy.title')}</h1>
          <p className="text-[var(--text-secondary)] mb-8">
            {t('common.lastUpdated')}
          </p>

          <div className="space-y-8 text-[var(--text-secondary)]">
            <p className="text-base leading-relaxed">
              {t('privacyPolicy.intro')}
            </p>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">{t('privacyPolicy.sections.infoCollect.title')}</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-[var(--text-color)] mb-2">{t('privacyPolicy.sections.infoCollect.account.title')}</h3>
                  <p className="mb-2">{t('privacyPolicy.sections.infoCollect.account.intro')}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>{t('privacyPolicy.sections.infoCollect.account.items.0')}</li>
                    <li>{t('privacyPolicy.sections.infoCollect.account.items.1')}</li>
                  </ul>
                  <p className="mt-2">
                    {t('privacyPolicy.sections.infoCollect.account.note')}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[var(--text-color)] mb-2">{t('privacyPolicy.sections.infoCollect.subscription.title')}</h3>
                  <p>
                    {t('privacyPolicy.sections.infoCollect.subscription.text')}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-[var(--text-color)] mb-2">{t('privacyPolicy.sections.infoCollect.usage.title')}</h3>
                  <p className="mb-2">
                    {t('privacyPolicy.sections.infoCollect.usage.intro')}
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>{t('privacyPolicy.sections.infoCollect.usage.items.0')}</li>
                    <li>{t('privacyPolicy.sections.infoCollect.usage.items.1')}</li>
                    <li>{t('privacyPolicy.sections.infoCollect.usage.items.2')}</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">{t('privacyPolicy.sections.permissions.title')}</h2>
              <p className="mb-3">{t('privacyPolicy.sections.permissions.intro')}</p>
              <ul className="space-y-3 ml-4">
                <li>
                  <span className="font-medium text-[var(--text-color)]">{t('privacyPolicy.sections.permissions.items.0.name')}</span>{" "}
                  {t('privacyPolicy.sections.permissions.items.0.desc')}
                </li>
                <li>
                  <span className="font-medium text-[var(--text-color)]">{t('privacyPolicy.sections.permissions.items.1.name')}</span>{" "}
                  {t('privacyPolicy.sections.permissions.items.1.desc')}
                </li>
                <li>
                  <span className="font-medium text-[var(--text-color)]">{t('privacyPolicy.sections.permissions.items.2.name')}</span>{" "}
                  {t('privacyPolicy.sections.permissions.items.2.desc')}
                </li>
              </ul>
              <p className="mt-3">
                {t('privacyPolicy.sections.permissions.note')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">{t('privacyPolicy.sections.howWeUse.title')}</h2>
              <p className="mb-2">{t('privacyPolicy.sections.howWeUse.intro')}</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>{t('privacyPolicy.sections.howWeUse.items.0')}</li>
                <li>{t('privacyPolicy.sections.howWeUse.items.1')}</li>
                <li>{t('privacyPolicy.sections.howWeUse.items.2')}</li>
                <li>{t('privacyPolicy.sections.howWeUse.items.3')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">{t('privacyPolicy.sections.dataSharing.title')}</h2>
              <p className="mb-2">
                {t('privacyPolicy.sections.dataSharing.intro')}
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>{t('privacyPolicy.sections.dataSharing.items.0')}</li>
                <li>{t('privacyPolicy.sections.dataSharing.items.1')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">{t('privacyPolicy.sections.dataSecurity.title')}</h2>
              <p>
                {t('privacyPolicy.sections.dataSecurity.text')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">{t('privacyPolicy.sections.dataRetention.title')}</h2>
              <p>
                {t('privacyPolicy.sections.dataRetention.text')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">{t('privacyPolicy.sections.children.title')}</h2>
              <p>
                {t('privacyPolicy.sections.children.text')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">{t('privacyPolicy.sections.rights.title')}</h2>
              <p className="mb-2">{t('privacyPolicy.sections.rights.intro')}</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>{t('privacyPolicy.sections.rights.items.0')}</li>
                <li>{t('privacyPolicy.sections.rights.items.1')}</li>
                <li>{t('privacyPolicy.sections.rights.items.2')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">{t('privacyPolicy.sections.changes.title')}</h2>
              <p>
                {t('privacyPolicy.sections.changes.text')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">{t('privacyPolicy.sections.contact.title')}</h2>
              <p className="mb-3">
                {t('privacyPolicy.sections.contact.text')}
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

export default PrivacyPolicy;
