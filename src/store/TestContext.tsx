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
    
    // Set drawing state to show loading during generation
    setIsDrawing(true);
    
    try {
      const analysis = EnergyEngine.analyze(selectedCards);
      const user = auth.currentUser;
      const userId = user?.uid || null;

      console.log("TestContext: Generating report. Auth state:", { 
        isLoggedIn: !!user, 
        uid: userId,
        email: user?.email 
      });

      // Create initial report with local data
      const initialReport: AnalysisReport = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        interpretation: "您的能量分佈已生成。正在編織 AI 深度引導報告...",
        ...analysis,
        selectedImageIds: selectedCards.images.map(img => img.id),
        selectedWordIds: selectedCards.words.map(w => w.id),
        pairs: selectedCards.pairs,
        isGuest: !user
      };
      
      // Stage 1: Save basic report immediately to get a UUID
      // We MUST wait for this to succeed to have a valid ID for sharing
      try {
        const payload = {
          userId: userId,
          selectedImageIds: initialReport.selectedImageIds,
          selectedWordIds: initialReport.selectedWordIds,
          totalScores: initialReport.totalScores,
          dominantElement: initialReport.dominantElement,
          weakElement: initialReport.weakElement,
          balanceScore: initialReport.balanceScore,
          interpretation: initialReport.interpretation,
          pairs: initialReport.pairs
        };
        console.log("TestContext: Sending report payload:", payload);

        const response = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          const savedReport = await response.json();
          console.log("TestContext: Initial report saved successfully with ID:", savedReport.id);
          initialReport.id = savedReport.id;
        } else {
          const errData = await response.json();
          console.error("TestContext: API returned error during initial save:", errData);
          // Even if save fails, we continue with local ID so user isn't stuck, 
          // but this is why history/sharing might fail.
        }
      } catch (error) {
        console.error("TestContext: Network error during initial report save:", error);
      }

      // Set the report state with the best ID we have
      setReport(initialReport);
      setIsCompleted(true);

      const realId = initialReport.id;

      // Stage 2: Asynchronously call AI Analysis and update the report
      // We don't wait for this for the UI to transition, but we update the DB when it's done
      generateAIAnalysis(selectedCards, analysis.totalScores, language).then(async (aiAnalysis) => {
        const finalReport = {
          ...initialReport,
          ...aiAnalysis,
          id: realId
        };
        setReport(finalReport);

        // Update the existing report in the database if we have a real ID (UUID)
        if (realId && (realId.length > 15 || realId.includes('-'))) {
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
            console.log("TestContext: Report updated with AI analysis in DB");
          } catch (error) {
            console.error("Error updating report with AI analysis:", error);
          }
        }
      }).catch(error => {
        console.error("AI Analysis failed in background:", error);
      });
      
      return initialReport;
    } catch (error) {
      console.error("Report generation failed:", error);
      return null;
    } finally {
      setIsDrawing(false);
    }
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
