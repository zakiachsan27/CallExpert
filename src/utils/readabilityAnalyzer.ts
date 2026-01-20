// Readability Analyzer for Indonesian Text
// Uses adapted Flesch-Kincaid formula for Indonesian

import type { ReadabilityResult } from '../types/article';
import { stripHtml } from './seoAnalyzer';

// Count syllables in Indonesian text
// Indonesian syllables are typically vowel-based
function countSyllables(text: string): number {
  const vowels = 'aiueoAIUEO';
  const words = text.split(/\s+/).filter(w => w.length > 0);
  let totalSyllables = 0;

  for (const word of words) {
    let syllables = 0;
    let prevIsVowel = false;

    for (const char of word) {
      const isVowel = vowels.includes(char);
      if (isVowel && !prevIsVowel) {
        syllables++;
      }
      prevIsVowel = isVowel;
    }

    // Each word has at least one syllable
    totalSyllables += Math.max(1, syllables);
  }

  return totalSyllables;
}

// Split text into sentences
function getSentences(text: string): string[] {
  // Split by common Indonesian sentence endings
  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

// Get words from text
function getWords(text: string): string[] {
  return text
    .split(/\s+/)
    .filter(w => w.length > 0 && /[a-zA-Z]/.test(w));
}

// Analyze readability
export function analyzeReadability(content: string): ReadabilityResult {
  const text = stripHtml(content);
  const sentences = getSentences(text);
  const words = getWords(text);
  const syllables = countSyllables(text);

  const wordCount = words.length;
  const sentenceCount = Math.max(1, sentences.length);
  const syllableCount = syllables;

  // Calculate averages
  const avgSentenceLength = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllableCount / Math.max(1, wordCount);

  // Flesch Reading Ease adapted for Indonesian
  // Original formula: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
  // Adjusted coefficients for Indonesian (vowel-heavy language)
  let score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
  score = Math.max(0, Math.min(100, score));

  // Determine level
  let level: 'easy' | 'medium' | 'hard';
  if (score >= 60) {
    level = 'easy';
  } else if (score >= 30) {
    level = 'medium';
  } else {
    level = 'hard';
  }

  // Generate suggestions
  const suggestions: string[] = [];

  if (avgSentenceLength > 25) {
    suggestions.push('Pertimbangkan untuk memecah kalimat panjang menjadi lebih pendek');
  }

  if (avgSentenceLength > 30) {
    suggestions.push('Kalimat terlalu panjang - targetkan rata-rata 15-20 kata per kalimat');
  }

  if (avgSyllablesPerWord > 2.5) {
    suggestions.push('Gunakan kata-kata yang lebih sederhana dan mudah dipahami');
  }

  if (wordCount < 300) {
    suggestions.push('Konten terlalu pendek - pertimbangkan untuk menambah penjelasan');
  }

  if (level === 'hard') {
    suggestions.push('Teks sulit dibaca - gunakan kalimat lebih pendek dan kata lebih sederhana');
  }

  // Check for paragraph variety
  const paragraphs = content.split(/<\/p>|<br\s*\/?>/i).filter(p => stripHtml(p).length > 0);
  if (paragraphs.length < 3 && wordCount > 200) {
    suggestions.push('Tambahkan lebih banyak paragraf untuk meningkatkan keterbacaan');
  }

  return {
    score: Math.round(score),
    level,
    averageSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    averageWordLength: Math.round(avgSyllablesPerWord * 10) / 10,
    wordCount,
    suggestions,
  };
}

// Get readability color based on level
export function getReadabilityColor(level: 'easy' | 'medium' | 'hard'): string {
  switch (level) {
    case 'easy':
      return 'text-green-600';
    case 'medium':
      return 'text-yellow-600';
    case 'hard':
      return 'text-red-600';
  }
}

// Get readability background color
export function getReadabilityBgColor(level: 'easy' | 'medium' | 'hard'): string {
  switch (level) {
    case 'easy':
      return 'bg-green-100';
    case 'medium':
      return 'bg-yellow-100';
    case 'hard':
      return 'bg-red-100';
  }
}

// Get readability label in Indonesian
export function getReadabilityLabel(level: 'easy' | 'medium' | 'hard'): string {
  switch (level) {
    case 'easy':
      return 'Mudah Dibaca';
    case 'medium':
      return 'Cukup Mudah';
    case 'hard':
      return 'Sulit Dibaca';
  }
}

// Estimate reading time in minutes
export function estimateReadingTime(content: string): number {
  const text = stripHtml(content);
  const words = getWords(text);
  // Average reading speed: 200 words per minute for Indonesian
  const minutes = words.length / 200;
  return Math.max(1, Math.ceil(minutes));
}
