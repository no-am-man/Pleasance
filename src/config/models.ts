// src/config/models.ts

import { googleAI } from '@genkit-ai/google-genai';

/**
 * A centralized place for defining model references.
 * This helps ensure consistency and makes it easy to update models.
 * We now export the model objects directly to ensure the correct API version is used.
 */

// Forcing the v1beta API version is necessary for features like JSON mode.
const API_OPTIONS = { apiVersion: 'v1beta' };

// For complex generation, reasoning, and multi-turn chat
export const GEMINI_PRO = googleAI.model('gemini-1.5-pro', API_OPTIONS);

// For fast, lightweight tasks, and summarization
export const GEMINI_FLASH = googleAI.model('gemini-1.5-flash', API_OPTIONS);

// For image generation
export const IMAGEN = googleAI.model('imagen-4.0-fast-generate-001', API_OPTIONS);

// For text-to-speech
export const TTS_MODEL = googleAI.model('gemini-1.5-flash-tts', API_OPTIONS);
