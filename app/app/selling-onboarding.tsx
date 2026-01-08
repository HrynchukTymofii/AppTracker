/**
 * SELLING ONBOARDING - Premium Glassy Redesign
 *
 * Design: Black/white glassy aesthetic with purple-cyan gradients
 * Inspired by Opal's clean paywall design
 *
 * 15 Screens:
 * 1. Welcome - "Hello, welcome... taking control of your time"
 * 2. Age Selection - <18, 18-24, 25-31, 32-40, 41-50, 51-60, 60+
 * 3. Daily Phone Usage - button options
 * 4. Bad & Good News Intro
 * 5. The Bad News - fear calculation
 * 6. The Good News - hope
 * 7. First Step Intro
 * 8. Screen Time Permission (video + learn more modal)
 * 9. App Blocking Permission (video + learn more modal)
 * 10. Accessibility Permission (reassurance modal)
 * 11. Usage Data Display
 * 12. Improvement Projection (green theme)
 * 13. Comparison & Paywall
 * 14. Notifications Permission
 * 15. Apps & Websites Selection -> Navigate to Auth
 */

import React, { useState, useRef } from 'react';
import { View, useColorScheme, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { setBlockedApps, setBlockedWebsites } from '@/modules/app-blocker';
import { getInstalledApps, InstalledApp } from '@/modules/usage-stats';

import {
  GRADIENT_COLORS,
  GRADIENT_PALETTE,
  getThemeColors,
  OnboardingThemeContext,
  Step1Welcome,
  Step2Age,
  Step3Hours,
  Step4NewsIntro,
  Step5BadNews,
  Step6GoodNews,
  Step7FirstStep,
  StepCommitment,
  Step8ScreenTimePermission,
  Step9OverlayPermission,
  Step10AccessibilityPermission,
  Step11UsageData,
  Step12Projection,
  Step13Comparison,
  Step14Notifications,
  Step15DailyGoal,
  Step16AppSelection,
} from '@/components/selling-onboarding';
import type { UserAnswers } from '@/components/selling-onboarding';

export default function SellingOnboarding() {
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  const isDark = systemColorScheme === 'dark';
  const themeColors = getThemeColors(isDark);

  const [currentStep, setCurrentStep] = useState(1);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({
    age: 25,
    dailyHours: 4,
    realDailyHours: null,
    weeklyData: null,
    blockedApps: [],
    blockedWebsites: [],
    dailyGoal: 30, // Default 30 minutes
  });

  // Pre-load apps state - start loading after screen time permission is granted
  const [preloadedApps, setPreloadedApps] = useState<InstalledApp[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const appsLoadingStarted = useRef(false);

  // Function to start pre-loading apps
  const startPreloadingApps = async () => {
    if (appsLoadingStarted.current) return;
    appsLoadingStarted.current = true;
    setAppsLoading(true);
    try {
      const apps = await getInstalledApps();
      setPreloadedApps(apps);
    } catch (error) {
      console.error('Error pre-loading apps:', error);
    } finally {
      setAppsLoading(false);
    }
  };

  const totalSteps = 17; // Added commitment step
  const progress = (currentStep / totalSteps) * 100;

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const finishOnboarding = async (apps: string[], websites: string[]) => {
    await SecureStore.setItemAsync('sellingOnboardingCompleted', 'true');
    await SecureStore.setItemAsync('blockedApps', JSON.stringify(apps));
    await SecureStore.setItemAsync('blockedWebsites', JSON.stringify(websites));
    await SecureStore.setItemAsync('dailyGoal', userAnswers.dailyGoal.toString());
    await SecureStore.setItemAsync('defaultAppLimit', userAnswers.dailyGoal.toString());

    // Sync to native module immediately so blocking works right away
    setBlockedApps(apps);
    setBlockedWebsites(websites);

    router.replace('/auth');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Welcome onContinue={nextStep} />;
      case 2:
        return (
          <Step2Age
            onSelect={(age) => {
              setUserAnswers({ ...userAnswers, age });
              nextStep();
            }}
          />
        );
      case 3:
        return (
          <Step3Hours
            onSelect={(hours) => {
              setUserAnswers({ ...userAnswers, dailyHours: hours });
              nextStep();
            }}
          />
        );
      case 4:
        return <Step4NewsIntro onContinue={nextStep} />;
      case 5:
        return <Step5BadNews userAnswers={userAnswers} onContinue={nextStep} />;
      case 6:
        return <Step6GoodNews userAnswers={userAnswers} onContinue={nextStep} />;
      case 7:
        return <Step7FirstStep onContinue={nextStep} />;
      case 8:
        // Commitment step - press and hold for 3 seconds
        return <StepCommitment onComplete={nextStep} />;
      case 9:
        return (
          <Step8ScreenTimePermission
            onGranted={(realHours) => {
              setUserAnswers({ ...userAnswers, realDailyHours: realHours });
              // Start pre-loading apps as soon as permission is granted
              startPreloadingApps();
              nextStep();
            }}
            onSkip={() => {
              // Still try to load apps even if skipped (might have permission already)
              startPreloadingApps();
              nextStep();
            }}
          />
        );
      case 10:
        return <Step9OverlayPermission onContinue={nextStep} />;
      case 11:
        return <Step10AccessibilityPermission onContinue={nextStep} onSkip={nextStep} />;
      case 12:
        return <Step11UsageData userAnswers={userAnswers} onContinue={nextStep} />;
      case 13:
        return <Step12Projection userAnswers={userAnswers} onContinue={nextStep} />;
      case 14:
        return <Step13Comparison userAnswers={userAnswers} onContinue={nextStep} />;
      case 15:
        return <Step14Notifications onContinue={nextStep} />;
      case 16:
        return (
          <Step15DailyGoal
            onSelect={(minutes) => {
              setUserAnswers({ ...userAnswers, dailyGoal: minutes });
              nextStep();
            }}
          />
        );
      case 17:
        return (
          <Step16AppSelection
            preloadedApps={preloadedApps}
            appsLoading={appsLoading}
            onConfirm={(apps, websites) => {
              finishOnboarding(apps, websites);
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <OnboardingThemeContext.Provider value={{ isDark, colors: themeColors }}>
      <View style={{ flex: 1, backgroundColor: themeColors.background }}>
        {/* Background Gradients - matching app style */}
        <LinearGradient
          colors={
            isDark
              ? [`rgba(139, 92, 246, 0.15)`, `rgba(139, 92, 246, 0.06)`, 'rgba(0, 0, 0, 0)']
              : [`rgba(139, 92, 246, 0.12)`, `rgba(139, 92, 246, 0.05)`, '#ffffff']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={
            isDark
              ? [`rgba(6, 182, 212, 0.10)`, 'transparent']
              : [`rgba(6, 182, 212, 0.07)`, 'transparent']
          }
          start={{ x: 1, y: 1 }}
          end={{ x: 0.2, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={
            isDark
              ? [`rgba(139, 92, 246, 0.08)`, 'transparent']
              : [`rgba(139, 92, 246, 0.06)`, 'transparent']
          }
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.3 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Progress Bar */}
        <View style={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 }}>
          <View style={{
            height: 4,
            backgroundColor: themeColors.progressBg,
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <LinearGradient
              colors={GRADIENT_COLORS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: '100%',
                width: `${progress}%`,
                borderRadius: 2,
              }}
            />
          </View>
        </View>

        {/* Step Content */}
        <View style={{ flex: 1 }}>
          {renderStep()}
        </View>
      </View>
    </OnboardingThemeContext.Provider>
  );
}
