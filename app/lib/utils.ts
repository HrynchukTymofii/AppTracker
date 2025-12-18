export function cn(...classes: (string | boolean | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}


/**
 * Converts raw score (correct answers) to SAT Math scaled score (200-800)
 * Based on standard SAT Math scoring conversion table
 */
export const calculateSATScore = (correctCount: number, totalQuestions: number): number => {
  // SAT Math scoring table (approximate conversion)
  // This is a simplified version - actual SAT uses a more complex curve
  const percentage = correctCount / totalQuestions;

  // SAT Math score ranges from 200 to 800
  if (percentage >= 0.98) return 800; // Perfect or near-perfect
  if (percentage >= 0.95) return 790;
  if (percentage >= 0.92) return 770;
  if (percentage >= 0.88) return 750;
  if (percentage >= 0.85) return 730;
  if (percentage >= 0.82) return 710;
  if (percentage >= 0.78) return 690;
  if (percentage >= 0.75) return 670;
  if (percentage >= 0.72) return 650;
  if (percentage >= 0.68) return 630;
  if (percentage >= 0.65) return 610;
  if (percentage >= 0.62) return 590;
  if (percentage >= 0.58) return 570;
  if (percentage >= 0.55) return 550;
  if (percentage >= 0.52) return 530;
  if (percentage >= 0.48) return 510;
  if (percentage >= 0.45) return 490;
  if (percentage >= 0.42) return 470;
  if (percentage >= 0.38) return 450;
  if (percentage >= 0.35) return 430;
  if (percentage >= 0.32) return 410;
  if (percentage >= 0.28) return 390;
  if (percentage >= 0.25) return 370;
  if (percentage >= 0.22) return 350;
  if (percentage >= 0.18) return 330;
  if (percentage >= 0.15) return 310;
  if (percentage >= 0.12) return 290;
  if (percentage >= 0.08) return 270;
  if (percentage >= 0.05) return 250;
  if (percentage >= 0.02) return 230;
  return 200; // Minimum SAT score
};
