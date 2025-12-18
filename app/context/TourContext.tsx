import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

interface TourContextType {
  tourActive: boolean;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  startTour: () => void;
  endTour: () => void;
  skipTour: () => void;
  shouldShowTour: boolean;
  numbersQuizId: string | null;
  setNumbersQuizId: (id: string | null) => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within TourProvider');
  }
  return context;
};

interface TourProviderProps {
  children: ReactNode;
}

export const TourProvider = ({ children }: TourProviderProps) => {
  const [tourActive, setTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [shouldShowTour, setShouldShowTour] = useState(false);
  const [numbersQuizId, setNumbersQuizId] = useState<string | null>(null);

  useEffect(() => {
    checkTourStatus();
  }, []);

  const checkTourStatus = async () => {
    try {
      // Check if tour has been completed
      const tourCompleted = await SecureStore.getItemAsync('tourCompleted');

      // Check if user wants guide from onboarding
      const onboardingAnswers = await SecureStore.getItemAsync('onboardingAnswers');
      let wantsGuide = true;

      if (onboardingAnswers) {
        const answers = JSON.parse(onboardingAnswers);
        wantsGuide = answers.wantsGuide !== false;
      }

      // Show tour if not completed and user wants guide
      if (!tourCompleted && wantsGuide) {
        setShouldShowTour(true);
        // Auto-start tour after a delay
        setTimeout(() => {
          setTourActive(true);
        }, 1000);
      }
    } catch (error) {
      console.error('Error checking tour status:', error);
    }
  };

  const startTour = () => {
    setTourActive(true);
    setCurrentStep(0);
  };

  const endTour = async () => {
    setTourActive(false);
    setCurrentStep(0);
    setShouldShowTour(false);
    try {
      await SecureStore.setItemAsync('tourCompleted', 'true');
    } catch (error) {
      console.error('Error saving tour completion:', error);
    }
  };

  const skipTour = async () => {
    setTourActive(false);
    setCurrentStep(0);
    setShouldShowTour(false);
    try {
      await SecureStore.setItemAsync('tourCompleted', 'true');
    } catch (error) {
      console.error('Error skipping tour:', error);
    }
  };

  return (
    <TourContext.Provider
      value={{
        tourActive,
        currentStep,
        setCurrentStep,
        startTour,
        endTour,
        skipTour,
        shouldShowTour,
        numbersQuizId,
        setNumbersQuizId,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};
