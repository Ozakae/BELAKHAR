'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';
import { TestMode, Difficulty, MODE_DIFFICULTY_MAP, DIFFICULTY_MODE_MAP } from '@/lib/types';

interface TestSessionContextType {
  selectedMode: TestMode;
  difficulty: Difficulty;
  isExamInProgress: boolean;
  setSelectedMode: (mode: TestMode) => void;
  setDifficulty: (diff: Difficulty) => void;
  setIsExamInProgress: (inProgress: boolean) => void;
}

const TestSessionContext = createContext<TestSessionContextType | undefined>(undefined);

export function TestSessionProvider({ children }: { children: React.ReactNode }) {
  const [selectedMode, setSelectedModeState] = useState<TestMode>('daily_quiz');
  const [isExamInProgress, setIsExamInProgress] = useState<boolean>(false);

  const setSelectedMode = (mode: TestMode) => {
    // Jika ujian sedang berlangsung, jangan izinkan perubahan mode
    if (isExamInProgress) return;
    setSelectedModeState(mode);
  };

  const setDifficulty = (diff: Difficulty) => {
    if (isExamInProgress) return;
    const correspondingMode = DIFFICULTY_MODE_MAP[diff] || 'daily_quiz';
    setSelectedModeState(correspondingMode);
  };

  const difficulty = useMemo(() => {
    return MODE_DIFFICULTY_MAP[selectedMode] || 'medium';
  }, [selectedMode]);

  const value = useMemo(
    () => ({
      selectedMode,
      difficulty,
      isExamInProgress,
      setSelectedMode,
      setDifficulty,
      setIsExamInProgress,
    }),
    [selectedMode, difficulty, isExamInProgress]
  );

  return (
    <TestSessionContext.Provider value={value}>
      {children}
    </TestSessionContext.Provider>
  );
}

export function useTestSession() {
  const context = useContext(TestSessionContext);
  if (!context) {
    throw new Error('useTestSession must be used within a TestSessionProvider');
  }
  return context;
}
