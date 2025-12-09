
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI({
    // The apiVersion will now be managed by the model definitions in src/config/models.ts
    // to ensure consistency across the application.
  })],
});
