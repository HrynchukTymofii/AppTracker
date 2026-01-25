'use client';

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const SUPPORT_EMAIL = "lockin@fibipals.com";
const API_BASE_URL = "https://lockin.fibipals.com/api";

const SupportPage: React.FC = () => {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError(t('support.form.error'));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/user/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: "support",
          message: `LockIn website support\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setError(t('support.form.errorSend'));
      }
    } catch (err) {
      console.error("Send message error:", err);
      setError(t('support.form.errorSend'));
    } finally {
      setLoading(false);
    }
  };

  const handleDirectEmail = () => {
    window.location.href = `mailto:${SUPPORT_EMAIL}`;
  };

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
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gradient">{t('support.title')}</h1>
            </div>
          </div>

          <p className="text-[var(--text-secondary)] mb-8 mt-4">
            {t('support.description')}
          </p>

          {submitted ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-color)] mb-2">{t('support.success.title')}</h3>
              <p className="text-[var(--text-secondary)]">{t('support.success.description')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[var(--text-color)] mb-2">
                  {t('support.form.name')}
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('support.form.namePlaceholder')}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-color)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[var(--text-color)] mb-2">
                  {t('support.form.email')}
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('support.form.emailPlaceholder')}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-color)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-[var(--text-color)] mb-2">
                  {t('support.form.message')}
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('support.form.messagePlaceholder')}
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-color)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    {t('support.form.send')}
                  </>
                )}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="flex items-center my-8">
            <div className="flex-1 h-px bg-[var(--border-color)]" />
            <span className="px-4 text-sm text-[var(--text-secondary)]">{t('support.or')}</span>
            <div className="flex-1 h-px bg-[var(--border-color)]" />
          </div>

          {/* Direct Email Button */}
          <button
            onClick={handleDirectEmail}
            className="w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 bg-[var(--card-bg)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] text-[var(--text-color)]"
          >
            <svg className="w-5 h-5 text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>{t('support.emailDirect')}</span>
            <span className="text-[var(--text-secondary)]">{SUPPORT_EMAIL}</span>
          </button>

          {/* Additional Info */}
          <div className="mt-8 p-6 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)]">
            <h3 className="text-lg font-semibold text-[var(--text-color)] mb-3">{t('support.whatToExpect.title')}</h3>
            <ul className="space-y-2 text-[var(--text-secondary)] text-sm">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('support.whatToExpect.response')}
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('support.whatToExpect.feedback')}
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('support.whatToExpect.privacy')}
              </li>
            </ul>
          </div>
        </div>

        <p className="text-center text-sm text-[var(--text-secondary)] mt-8">
          {t('common.copyright', { year: new Date().getFullYear() })}
        </p>
      </div>
    </div>
  );
};

export default SupportPage;
