'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Questionnaire from '@/components/Questionnaire';
import Footer from '@/components/Footer';

export default function Home() {
  const router = useRouter();
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  const handleJoinWaitlist = () => {
    setShowQuestionnaire(true);
  };

  const handleQuestionnaireComplete = async (data: {
    deviceOS: string[];
    name: string;
    preferNotToSay: boolean;
    email: string;
    dailyScreenTime: string;
  }) => {
    const response = await fetch('/api/waitlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        name: data.preferNotToSay ? null : data.name,
        deviceOS: data.deviceOS,
        dailyScreenTime: data.dailyScreenTime,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to join waitlist');
    }

    // Redirect to thank you page
    router.push('/thank-you');
  };

  return (
    <main className="min-h-screen">
      <Navigation />
      <Hero onJoinWaitlist={handleJoinWaitlist} />
      <Features />
      <Footer />

      <AnimatePresence>
        {showQuestionnaire && (
          <Questionnaire
            onClose={() => setShowQuestionnaire(false)}
            onComplete={handleQuestionnaireComplete}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
