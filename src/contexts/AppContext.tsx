import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserProfile, DailyLog, MedicalRecord, AIInsight } from '@/data/types';
import { defaultProfile, placeholderLogs, placeholderRecords, placeholderInsights } from '@/data/placeholder';

interface AppState {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  onboarded: boolean;
  setOnboarded: (v: boolean) => void;
  logs: DailyLog[];
  setLogs: (l: DailyLog[]) => void;
  records: MedicalRecord[];
  setRecords: (r: MedicalRecord[]) => void;
  insights: AIInsight[];
  setInsights: (i: AIInsight[]) => void;
  dismissInsight: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [onboarded, setOnboarded] = useState(true); // true for demo
  const [logs, setLogs] = useState<DailyLog[]>(placeholderLogs);
  const [records, setRecords] = useState<MedicalRecord[]>(placeholderRecords);
  const [insights, setInsights] = useState<AIInsight[]>(placeholderInsights);

  const dismissInsight = (id: string) => {
    setInsights(prev => prev.map(i => i.id === id ? { ...i, dismissed: true } : i));
  };

  return (
    <AppContext.Provider value={{ profile, setProfile, onboarded, setOnboarded, logs, setLogs, records, setRecords, insights, setInsights, dismissInsight }}>
      {children}
    </AppContext.Provider>
  );
};
