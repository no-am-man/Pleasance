import { config } from 'dotenv';
config();

import '@/ai/flows/generate-story.ts';
import '@/ai/flows/translate-story.ts';
import '@/ai/flows/generate-speech.ts';