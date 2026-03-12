import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ImageCard, WordCard, SelectedCards, AnalysisReport, CardPair } from '../core/types';
import { EnergyEngine } from '../core/engine';
import { auth } from '../lib/firebase';
import { performJDearDraw } from '../services/cardEngine';
import { generateAIAnalysis } from '../services/analysisService';
import { drawSession, updateSession } from '../services/sessionService';
import { useLanguage } from '../i18n/LanguageContext';

interface TestContextType {
  selectedCards: SelectedCards;
  setSelectedCards: React.Dispatch<React.SetStateAction<SelectedCards>>;
  currentStep: number;
  isCompleted: boolean;
  isDrawing: boolean;
  report: AnalysisReport | null;
  startDraw: () => Promise<void>;
  resetTest: () => void;
  setPairs: (pairs: CardPair[]) => void;
  setAssociations: (associations: { pair_id: string; text: string }[]) => void;
  generateReport: () => Promise<AnalysisReport | null>;
  setReport: (report: AnalysisReport | null) => void;
}

const TestContext = createContext<TestContextType | undefined>(undefined);

export const TestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCards, setSelectedCards] = useState<SelectedCards>({ images: [], words: [], drawnAt: 0 });
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    // Clear cache and preload when language changes
    import('../services/cardEngine').then(({ clearDeckCache, preloadDecks }) => {
      clearDeckCache(language);
      preloadDecks(language);
    });
  }, [language]);

  const startDraw = useCallback(async () => {
    setIsDrawing(true);
    try {
      const user = auth.currentUser;
      if (user) {
        // If user is logged in, use the new drawSession service to persist the draw
        const drawPromise = drawSession(user.uid, language);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("API timeout")), 8000)
        );

        try {
          const { sessionId, imageCards, wordCards } = await Promise.race([drawPromise, timeoutPromise]) as any;
          setSelectedCards({
            sessionId,
            images: imageCards,
            words: wordCards,
            drawnAt: Date.now()
          });
        } catch (err) {
          console.warn("API draw session failed or timed out, falling back to local draw:", err);
          const draw = await performJDearDraw(language);
          setSelectedCards(draw);
        }
      } else {
        // Fallback for guest users
        const draw = await performJDearDraw(language);
        setSelectedCards(draw);
      }
      setCurrentStep(1);
    } catch (error) {
      console.error("Draw failed:", error);
    } finally {
      setIsDrawing(false);
    }
  }, [language]);

  const setPairs = useCallback((pairs: CardPair[]) => {
    setSelectedCards(prev => ({ ...prev, pairs }));
  }, []);

  const setAssociations = useCallback((associations: { pair_id: string; text: string }[]) => {
    setSelectedCards(prev => {
      if (!prev.pairs) return prev;
      const updatedPairs = prev.pairs.map((pair, i) => ({
        ...pair,
        association: associations.find(a => a.pair_id === i.toString())?.text
      }));

      // Update API session if it exists
      if (prev.sessionId) {
        updateSession(prev.sessionId, updatedPairs).catch(err => {
          console.error("Failed to update session with associations:", err);
        });
      }

      return { ...prev, pairs: updatedPairs };
    });
  }, []);

  const resetTest = useCallback(() => {
    setSelectedCards({ images: [], words: [], drawnAt: 0 });
    setCurrentStep(0);
    setIsCompleted(false);
    setReport(null);
  }, []);

  const generateReport = useCallback(async (): Promise<AnalysisReport | null> => {
    if (selectedCards.images.length === 0 && selectedCards.words.length === 0) return null;
    
    // We don't set isDrawing(true) here anymore because we want instant transition
    // unless we want a very brief "calculating" state. Let's keep it fast.
    
    try {
      const analysis = EnergyEngine.analyze(selectedCards);
      const user = auth.currentUser;
      const userId = user?.uid || null;

      // 1. Create the initial report structure (Instant)
      const reportId = crypto.randomUUID();
      const initialReport: AnalysisReport = {
        id: reportId,
        timestamp: Date.now(),
        interpretation: "正在編織 AI 深度引導報告...",
        ...analysis,
        selectedImageIds: selectedCards.images.map(img => img.id),
        selectedWordIds: selectedCards.words.map(w => w.id),
        pairs: selectedCards.pairs,
        isGuest: !user,
        isAiComplete: false
      };

      // 2. Save to localStorage immediately (Local-First)
      const saveToLocal = (data: AnalysisReport) => {
        try {
          const history = JSON.parse(localStorage.getItem('jdear_report_history') || '[]');
          const filtered = history.filter((r: any) => r.id !== data.id);
          localStorage.setItem('jdear_report_history', JSON.stringify([data, ...filtered].slice(0, 50)));
          
          const pending = JSON.parse(localStorage.getItem('jdear_pending_sync') || '[]');
          const pendingFiltered = pending.filter((id: string) => id !== data.id);
          localStorage.setItem('jdear_pending_sync', JSON.stringify([data.id, ...pendingFiltered]));
        } catch (e) {
          console.error("LocalStorage save failed:", e);
        }
      };

      saveToLocal(initialReport);
      setReport(initialReport);
      setIsCompleted(true); // Trigger navigation to report page immediately

      // 3. Background AI Analysis & Cloud Sync (Non-blocking)
      const runBackgroundTasks = async () => {
        try {
          // Get AI Analysis
          const aiAnalysis = await generateAIAnalysis(selectedCards, analysis.totalScores, language);
          
          const finalReport: AnalysisReport = {
            ...initialReport,
            ...aiAnalysis,
            isAiComplete: true
          };

          // Update local state and storage
          setReport(finalReport);
          saveToLocal(finalReport);

          // Sync to Cloud
          const syncToCloud = async (data: AnalysisReport) => {
            try {
              const response = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: data.id,
                  userId: userId,
                  dominantElement: data.dominantElement,
                  weakElement: data.weakElement,
                  balanceScore: data.balanceScore,
                  todayTheme: data.todayTheme,
                  isAiComplete: data.isAiComplete,
                  interpretation: data.interpretation,
                  pairInterpretations: data.pairInterpretations,
                  cardInterpretation: data.cardInterpretation,
                  psychologicalInsight: data.psychologicalInsight,
                  fiveElementAnalysis: data.fiveElementAnalysis,
                  reflection: data.reflection,
                  actionSuggestion: data.actionSuggestion,
                  selectedImageIds: data.selectedImageIds,
                  selectedWordIds: data.selectedWordIds,
                  totalScores: data.totalScores,
                  pairs: data.pairs
                })
              });

              if (response.ok) {
                const pending = JSON.parse(localStorage.getItem('jdear_pending_sync') || '[]');
                localStorage.setItem('jdear_pending_sync', JSON.stringify(pending.filter((id: string) => id !== data.id)));
              }
            } catch (err) {
              console.error("Cloud sync network error:", err);
            }
          };

          await syncToCloud(finalReport);
        } catch (aiError) {
          console.error("Background AI Analysis failed:", aiError);
        }
      };

      // Fire and forget background tasks
      runBackgroundTasks();

      return initialReport;
    } catch (error) {
      console.error("Report generation failed:", error);
      return null;
    }
  }, [selectedCards, language]);

  const syncPendingReports = useCallback(async () => {
    const pendingIds = JSON.parse(localStorage.getItem('jdear_pending_sync') || '[]');
    if (pendingIds.length === 0) return;

    console.log(`Syncing ${pendingIds.length} pending reports...`);
    const history = JSON.parse(localStorage.getItem('jdear_report_history') || '[]');
    const user = auth.currentUser;
    const userId = user?.uid || null;

    for (const id of pendingIds) {
      const reportData = history.find((r: any) => r.id === id);
      if (!reportData) continue;

      try {
        const response = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: reportData.id,
            userId: userId,
            dominantElement: reportData.dominantElement,
            weakElement: reportData.weakElement,
            balanceScore: reportData.balanceScore,
            todayTheme: reportData.todayTheme,
            isAiComplete: reportData.isAiComplete,
            // All other fields
            interpretation: reportData.interpretation,
            pairInterpretations: reportData.pairInterpretations,
            cardInterpretation: reportData.cardInterpretation,
            psychologicalInsight: reportData.psychologicalInsight,
            fiveElementAnalysis: reportData.fiveElementAnalysis,
            reflection: reportData.reflection,
            actionSuggestion: reportData.actionSuggestion,
            selectedImageIds: reportData.selectedImageIds,
            selectedWordIds: reportData.selectedWordIds,
            totalScores: reportData.totalScores,
            pairs: reportData.pairs
          })
        });

        if (response.ok) {
          const pending = JSON.parse(localStorage.getItem('jdear_pending_sync') || '[]');
          localStorage.setItem('jdear_pending_sync', JSON.stringify(pending.filter((pid: string) => pid !== id)));
        }
      } catch (err) {
        console.error(`Failed to sync report ${id}:`, err);
      }
    }
  }, []);

  useEffect(() => {
    // Initial sync on mount
    syncPendingReports();
    
    // Also sync when auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) syncPendingReports();
    });
    
    return () => unsubscribe();
  }, [syncPendingReports]);

  return (
    <TestContext.Provider value={{
      selectedCards,
      setSelectedCards,
      currentStep,
      isCompleted,
      isDrawing,
      report,
      startDraw,
      resetTest,
      setPairs,
      setAssociations,
      generateReport,
      setReport
    }}>
      {children}
    </TestContext.Provider>
  );
};

export const useTest = () => {
  const context = useContext(TestContext);
  if (!context) throw new Error('useTest must be used within a TestProvider');
  return context;
};
