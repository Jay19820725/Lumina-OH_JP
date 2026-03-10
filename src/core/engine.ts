import { FiveElement, FiveElementValues, ImageCard, WordCard, SelectedCards, AnalysisReport } from './types';

/**
 * Five Element Energy Analysis Engine
 * 
 * Responsible for calculating energy profiles, balance scores, 
 * and detecting dominant/weak elements based on selected cards.
 */
export class EnergyEngine {
  /**
   * Analyzes a set of selected cards (images and words) to generate an energy report.
   * This method is strictly deterministic.
   */
  public static analyze(selected: SelectedCards): Omit<AnalysisReport, 'id' | 'userId' | 'timestamp' | 'interpretation'> {
    const { images, words } = selected;
    
    if (images.length === 0 && words.length === 0) {
      return this.getEmptyReport();
    }

    // 1. Sum element values from both images and words
    const totals: FiveElementValues = {
      [FiveElement.WOOD]: 0,
      [FiveElement.FIRE]: 0,
      [FiveElement.EARTH]: 0,
      [FiveElement.METAL]: 0,
      [FiveElement.WATER]: 0,
    };

    const processCard = (card: ImageCard | WordCard) => {
      totals[FiveElement.WOOD] += card.elements[FiveElement.WOOD];
      totals[FiveElement.FIRE] += card.elements[FiveElement.FIRE];
      totals[FiveElement.EARTH] += card.elements[FiveElement.EARTH];
      totals[FiveElement.METAL] += card.elements[FiveElement.METAL];
      totals[FiveElement.WATER] += card.elements[FiveElement.WATER];
    };

    images.forEach(processCard);
    words.forEach(processCard);

    const totalEnergy = Object.values(totals).reduce((sum, val) => sum + val, 0);

    // 2. Normalize values (Percentages)
    const percentages: FiveElementValues = { ...totals };
    if (totalEnergy > 0) {
      Object.keys(percentages).forEach((key) => {
        const element = key as FiveElement;
        percentages[element] = (totals[element] / totalEnergy) * 100;
      });
    }

    // 3. Detect Dominant and Weak Elements
    const dominantElement = this.detectDominant(percentages);
    const weakElement = this.detectWeak(percentages);

    // 4. Calculate Balance Score
    const balanceScore = this.calculateBalanceScore(percentages);

    return {
      selectedImageIds: images.map(c => c.id),
      selectedWordIds: words.map(c => c.id),
      totalScores: percentages,
      dominantElement: dominantElement,
      weakElement: weakElement,
      balanceScore: balanceScore,
    };
  }

  /**
   * Detects the most dominant element (> 30%)
   */
  private static detectDominant(percentages: FiveElementValues): string {
    let maxVal = -1;
    let dominant = 'None';

    (Object.keys(percentages) as FiveElement[]).forEach((element) => {
      const val = percentages[element];
      if (val > 30 && val > maxVal) {
        maxVal = val;
        dominant = element;
      }
    });

    return dominant;
  }

  /**
   * Detects the weakest element (< 10%)
   */
  private static detectWeak(percentages: FiveElementValues): string {
    let minVal = 101;
    let weak = 'None';

    (Object.keys(percentages) as FiveElement[]).forEach((element) => {
      const val = percentages[element];
      if (val < 10 && val < minVal) {
        minVal = val;
        weak = element;
      }
    });

    return weak;
  }

  /**
   * Calculates balance score based on deviation from 20% ideal.
   * Max deviation is 160 (one element 100%, others 0%).
   */
  private static calculateBalanceScore(percentages: FiveElementValues): number {
    const ideal = 20;
    const totalDeviation = (Object.values(percentages) as number[]).reduce(
      (acc, val) => acc + Math.abs(val - ideal),
      0
    );

    // Score = 100 * (1 - current_deviation / max_possible_deviation)
    const score = 100 * (1 - totalDeviation / 160);
    return Math.round(score);
  }

  private static getEmptyReport() {
    return {
      selectedImageIds: [],
      selectedWordIds: [],
      totalScores: {
        [FiveElement.WOOD]: 0,
        [FiveElement.FIRE]: 0,
        [FiveElement.EARTH]: 0,
        [FiveElement.METAL]: 0,
        [FiveElement.WATER]: 0,
      },
      dominantElement: 'None',
      weakElement: 'None',
      balanceScore: 0,
    };
  }
}
