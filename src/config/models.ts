// src/config/models.ts

import { googleAI } from '@genkit-ai/google-genai';

/**
 * A centralized place for defining model references.
 * This helps ensure consistency and makes it easy to update models.
 */

// For complex generation, reasoning, and multi-turn chat.
// Reverting to gemini-pro to ensure stability and avoid v1beta endpoint issues.
export const GEMINI_PRO = googleAI.model('gemini-pro');

// For fast, lightweight tasks, and summarization
// Using the same stable model for consistency.
export const GEMINI_FLASH = googleAI.model('gemini-pro');

// For image generation
export const IMAGEN = googleAI.model('imagen-4.0-fast-generate-001');

// For text-to-speech
// Reverting to a standard TTS model name.
export const TTS_MODEL = googleAI.model('text-to-speech');