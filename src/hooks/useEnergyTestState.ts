import { useState, useEffect, useCallback } from 'react';
import { useTest } from '../store/TestContext';
import { DrawStage, ImageCard, WordCard, CardPair } from '../core/types';

export const useEnergyTestState = (onComplete: () => void) => {
  const { 
    selectedCards, 
    startDraw, 
    setPairs, 
    setAssociations, 
    generateReport, 
    isDrawing, 
    setSelectedCards 
  } = useTest();

  const [drawStage, setDrawStage] = useState<DrawStage>('idle');
  const [flippedImages, setFlippedImages] = useState<number[]>([]);
  const [flippedWords, setFlippedWords] = useState<number[]>([]);
  const [hasRedrawnImages, setHasRedrawnImages] = useState(false);
  const [hasRedrawnWords, setHasRedrawnWords] = useState(false);
  const [zoomedCard, setZoomedCard] = useState<ImageCard | WordCard | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);

  // Loading timer for progressive messages
  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      setLoadingTime(0);
      interval = setInterval(() => {
        setLoadingTime(prev => prev + 1);
      }, 1000);
    } else {
      setLoadingTime(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Automatic scroll to top on stage change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [drawStage]);

  const handleStartShuffle = () => {
    setDrawStage('shuffling');
  };

  const handleShuffleComplete = useCallback(async () => {
    await startDraw();
    setDrawStage('drawing_images');
  }, [startDraw]);

  const handleFlipImage = (index: number) => {
    if (flippedImages.includes(index)) {
      setFlippedImages(prev => prev.filter(i => i !== index));
    } else if (flippedImages.length < 3) {
      setFlippedImages(prev => [...prev, index]);
    }
  };

  const handleFlipWord = (index: number) => {
    if (flippedWords.includes(index)) {
      setFlippedWords(prev => prev.filter(i => i !== index));
    } else if (flippedWords.length < 3) {
      setFlippedWords(prev => [...prev, index]);
    }
  };

  const handleRedrawImages = async () => {
    if (hasRedrawnImages) return;
    await startDraw(); // Re-draw cards from store
    setFlippedImages([]);
    setHasRedrawnImages(true);
  };

  const handleRedrawWords = async () => {
    if (hasRedrawnWords) return;
    await startDraw(); // Re-draw cards from store
    setFlippedWords([]);
    setHasRedrawnWords(true);
  };

  const handleContinueToWords = () => {
    const finalImages = selectedCards.images.filter((_, i) => flippedImages.includes(i));
    setSelectedCards(prev => ({ ...prev, images: finalImages }));
    setDrawStage('drawing_words');
  };

  const handleContinueToPairing = () => {
    const finalWords = selectedCards.words.filter((_, i) => flippedWords.includes(i));
    setSelectedCards(prev => ({ ...prev, words: finalWords }));
    setDrawStage('pairing');
  };

  const handlePairingComplete = (pairs: CardPair[]) => {
    setPairs(pairs);
    setDrawStage('associating');
  };

  const handleAssociationComplete = (associations: { pair_id: string; text: string }[]) => {
    setAssociations(associations);
    setDrawStage('revealed');
  };

  const handleComplete = async () => {
    setIsGenerating(true);
    await generateReport();
    setIsGenerating(false);
    onComplete();
  };

  return {
    drawStage,
    setDrawStage,
    flippedImages,
    flippedWords,
    zoomedCard,
    setZoomedCard,
    isGenerating,
    loadingTime,
    isDrawing,
    selectedCards,
    handleStartShuffle,
    handleShuffleComplete,
    handleFlipImage,
    handleFlipWord,
    handleContinueToWords,
    handleContinueToPairing,
    handlePairingComplete,
    handleAssociationComplete,
    handleComplete,
    handleRedrawImages,
    handleRedrawWords,
    hasRedrawnImages,
    hasRedrawnWords,
    allImagesFlipped: flippedImages.length === 3,
    allWordsFlipped: flippedWords.length === 3,
  };
};
