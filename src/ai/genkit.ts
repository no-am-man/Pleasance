
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI({
    // The apiVersion is now handled by the specific model definitions
    // in src/config/models.ts, making this global setting redundant.
  })],
});
