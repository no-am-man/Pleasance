
// src/config/models.ts

/**
 * A centralized place for defining model references.
 * This helps ensure consistency and makes it easy to update models.
 * Using fully-qualified model strings is more robust across different environments.
 */

// For complex generation, reasoning, and multi-turn chat that requires JSON output.
export const GEMINI_PRO = 'googleai/gemini-1.5-flash-preview-0514';

// For fast, lightweight tasks, and summarization.
export const GEMINI_FLASH = 'googleai/gemini-1.5-flash-preview-0514';

// For image generation
export const IMAGEN = 'googleai/imagen-2';

// For text-to-speech.
export const TTS_MODEL = 'googleai/tts-1';
