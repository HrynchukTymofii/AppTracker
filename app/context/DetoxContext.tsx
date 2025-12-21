import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

interface DetoxContextType {
  isActive: boolean;
  timeRemaining: number;
  startDetox: () => void;
  stopDetox: () => void;
  resetDetox: () => void;
  TOTAL_TIME: number;
}

const DetoxContext = createContext<DetoxContextType | undefined>(undefined);

export const DetoxProvider = ({ children }: { children: ReactNode }) => {
  const TOTAL_TIME = 30 * 60; // 30 minutes in seconds
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_TIME);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer logic
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            return TOTAL_TIME; // Reset to 30 minutes
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeRemaining]);

  const startDetox = () => {
    setIsActive(true);
  };

  const stopDetox = () => {
    setIsActive(false);
  };

  const resetDetox = () => {
    setIsActive(false);
    setTimeRemaining(TOTAL_TIME);
  };

  return (
    <DetoxContext.Provider
      value={{
        isActive,
        timeRemaining,
        startDetox,
        stopDetox,
        resetDetox,
        TOTAL_TIME,
      }}
    >
      {children}
    </DetoxContext.Provider>
  );
};

export const useDetox = () => {
  const context = useContext(DetoxContext);
  if (context === undefined) {
    throw new Error('useDetox must be used within a DetoxProvider');
  }
  return context;
};
