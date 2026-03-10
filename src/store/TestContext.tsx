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

    // If guest, do not call AI Analysis
    if (!user) {
      return initialReport;
    }

    // Asynchronously call AI Analysis for logged-in users
    generateAIAnalysis(selectedCards, analysis.totalScores, language).then(async (aiAnalysis) => {
      const finalReport = {
        ...initialReport,
        ...aiAnalysis
      };
      setReport(finalReport);

      // Save to API
      try {
        const response = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...finalReport,
            userId: user.uid,
            selectedImageIds: finalReport.selectedImageIds,
            selectedWordIds: finalReport.selectedWordIds,
            totalScores: finalReport.totalScores,
            dominantElement: finalReport.dominantElement,
            weakElement: finalReport.weakElement,
            balanceScore: finalReport.balanceScore,
            interpretation: finalReport.interpretation,
            pairInterpretations: finalReport.pairInterpretations || [],
            pairs: finalReport.pairs,
            todayTheme: finalReport.todayTheme,
            cardInterpretation: finalReport.cardInterpretation,
            psychologicalInsight: finalReport.psychologicalInsight,
            fiveElementAnalysis: finalReport.fiveElementAnalysis,
            reflection: finalReport.reflection,
            actionSuggestion: finalReport.actionSuggestion
          })
        });
        
        if (response.ok) {
          const savedReport = await response.json();
          setReport(prev => prev ? { ...prev, id: savedReport.id } : null);
        }
      } catch (error) {
        console.error("Error saving report to API:", error);
      }
    }).catch(error => {
      console.error("AI Analysis failed in background:", error);
    });
    
    return initialReport;
  }, [selectedCards]);

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
