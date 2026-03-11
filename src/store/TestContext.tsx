import React, { createContext, useContext, useState, useCallback } from 'react';
import { ImageCard, WordCard, SelectedCards, AnalysisReport, CardPair } from '../core/types';
import { EnergyEngine } from '../core/engine';
import { auth } from '../lib/firebase';
import { performJDearDraw } from '../services/cardEngine';
import { generateAIAnalysis } from '../services/analysisService';
import { drawSession, updateSession } from '../services/sessionService';
import { useLanguage } from '../i18n/LanguageContext';

interface TestContextType {
  selectedCards: SelectedCards;
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

  const startDraw = useCallback(async () => {
    setIsDrawing(true);
    try {
      const user = auth.currentUser;
      if (user) {
        // If user is logged in, use the new drawSession service to persist the draw
        const drawPromise = drawSession(user.uid);
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
          const draw = await performJDearDraw();
          setSelectedCards(draw);
        }
      } else {
        // Fallback for guest users
        const draw = await performJDearDraw();
        setSelectedCards(draw);
      }
      setCurrentStep(1);
    } catch (error) {
      console.error("Draw failed:", error);
    } finally {
      setIsDrawing(false);
    }
  }, []);

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
    
    const analysis = EnergyEngine.analyze(selectedCards);
    const user = auth.currentUser;

    // Create initial report with local data
    const initialReport: AnalysisReport = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      interpretation: "您的能量分佈已生成。登入後即可獲得 AI 深度引導報告。",
      ...analysis,
      selectedImageIds: selectedCards.images.map(img => img.id),
      selectedWordIds: selectedCards.words.map(w => w.id),
      pairs: selectedCards.pairs,
      isGuest: !user
    };
    
    setReport(initialReport);
    setIsCompleted(true);

    // Stage 1: Save basic report immediately to get a UUID
    const savePromise = (async () => {
      try {
        console.log("TestContext: Saving initial report for user:", user?.uid || 'guest');
        const response = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.uid || null,
            selectedImageIds: initialReport.selectedImageIds,
            selectedWordIds: initialReport.selectedWordIds,
            totalScores: initialReport.totalScores,
            dominantElement: initialReport.dominantElement,
            weakElement: initialReport.weakElement,
            balanceScore: initialReport.balanceScore,
            interpretation: initialReport.interpretation,
            pairs: initialReport.pairs
          })
        });
        
        if (response.ok) {
          const savedReport = await response.json();
          console.log("TestContext: Initial report saved with ID:", savedReport.id);
          setReport(prev => prev ? { ...prev, id: savedReport.id } : null);
          return savedReport.id as string;
        } else {
          const errData = await response.json();
          console.error("TestContext: Failed to save initial report:", errData);
        }
      } catch (error) {
        console.error("Error saving initial report to API:", error);
      }
      return null;
    })();

    // If guest, we still want to save but maybe we skip AI analysis if it's too expensive?
    // Actually, the user said "跟用戶本人一模一樣的完整報告", so guests should also get AI analysis if possible.
    // However, AI analysis usually requires a logged-in user or some token.
    // Let's check if generateAIAnalysis works for guests.
    
    // Stage 2: Asynchronously call AI Analysis and update the report
    generateAIAnalysis(selectedCards, analysis.totalScores, language).then(async (aiAnalysis) => {
      // Wait for Stage 1 to finish to get the real ID
      const realId = await savePromise;
      
      const finalReport = {
        ...initialReport,
        ...aiAnalysis,
        id: realId || initialReport.id
      };
      setReport(finalReport);

      // Update the existing report in the database if we have a real ID
      if (realId) {
        try {
          await fetch(`/api/reports/${realId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              interpretation: finalReport.interpretation,
              pairInterpretations: finalReport.pairInterpretations || [],
              todayTheme: finalReport.todayTheme,
              cardInterpretation: finalReport.cardInterpretation,
              psychologicalInsight: finalReport.psychologicalInsight,
              fiveElementAnalysis: finalReport.fiveElementAnalysis,
              reflection: finalReport.reflection,
              actionSuggestion: finalReport.actionSuggestion
            })
          });
        } catch (error) {
          console.error("Error updating report with AI analysis:", error);
        }
      }
    }).catch(error => {
      console.error("AI Analysis failed in background:", error);
    });
    
    return initialReport;
  }, [selectedCards, language]);

  return (
    <TestContext.Provider value={{
      selectedCards,
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
