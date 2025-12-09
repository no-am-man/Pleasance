
// src/config/models.ts

import { googleAI } from '@genkit-ai/google-genai';

/**
 * A centralized place for defining model references.
 * This helps ensure consistency and makes it easy to update models.
 */

// For complex generation, reasoning, and multi-turn chat.
export const GEMINI_PRO = googleAI.model('gemini-1.5-flash-preview');

// For fast, lightweight tasks, and summarization
export const GEMINI_FLASH = googleAI.model('gemini-1.5-flash-preview');

// For image generation
export const IMAGEN = googleAI.model('imagen-2');

// For text-to-speech
export const TTS_MODEL = googleAI.model('text-to-speech-2');
