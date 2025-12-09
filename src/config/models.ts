// src/config/models.ts

import { googleAI } from '@genkit-ai/google-genai';

/**
 * A centralized place for defining model references.
 * This helps ensure consistency and makes it easy to update models.
 */

// For complex generation, reasoning, and multi-turn chat.
export const GEMINI_PRO = googleAI.model('gemini-pro');

// For fast, lightweight tasks, and summarization
export const GEMINI_FLASH = googleAI.model('gemini-pro'); // Using gemini-pro for stability.

// For image generation
export const IMAGEN = googleAI.model('imagen-4.0-fast-generate-001');

// For text-to-speech
export const TTS_MODEL = googleAI.model('text-to-speech');
