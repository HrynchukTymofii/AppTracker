import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';

const inter = Inter({ subsets: ['latin', 'cyrillic', 'latin-ext'] });

export const metadata: Metadata = {
  title: 'LockIn - Take Control of Your Screen Time',
  description: 'Join the waitlist for LockIn, the smart screen time control app that helps you break free from digital addiction and reclaim your life.',
  keywords: ['screen time', 'app blocker', 'digital wellbeing', 'focus', 'productivity'],
  openGraph: {
    title: 'LockIn - Take Control of Your Screen Time',
    description: 'Join the waitlist for LockIn, the smart screen time control app that helps you break free from digital addiction.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LockIn - Take Control of Your Screen Time',
    description: 'Join the waitlist for LockIn, the smart screen time control app.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <LanguageProvider>
          <ThemeProvider>
            <div className="gradient-bg" />
            {children}
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
