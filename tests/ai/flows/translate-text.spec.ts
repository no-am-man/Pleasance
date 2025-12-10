// tests/ai/flows/translate-text.spec.ts
import { test, expect, describe } from 'vitest';
import { translateText } from '@/ai/flows/translate-text';

// This test calls the server action directly to verify the Genkit flow.
describe('translateText flow', () => {

  test('should translate text from English to French', async () => {
    // This test will make a live API call to the Gemini API.
    // Ensure your API key is set up correctly in your environment.
    const input = {
      text: 'Hello, world!',
      targetLanguage: 'French',
    };
  
    const result = await translateText(input);
  
    // We expect a non-empty string as a result.
    // The exact translation can vary, so we check for presence and basic correctness.
    expect(result).toBeDefined();
    expect(typeof result.translation).toBe('string');
    expect(result.translation.length).toBeGreaterThan(0);
    
    // A simple check to see if it's in the ballpark of a French translation.
    // In a more robust test, you might check for specific words if the model was more deterministic.
    expect(result.translation.toLowerCase()).toContain('bonjour');
  
    console.log(`Translation successful: "${input.text}" -> "${result.translation}"`);
  }, 30000); // 30 second timeout for API call
  
  test('should handle empty input gracefully', async () => {
      const input = {
        text: '   ',
        targetLanguage: 'Spanish',
      };
    
      const result = await translateText(input);
    
      expect(result).toBeDefined();
      expect(result.translation).toBe('');
  });

  test('should translate from English to Hebrew', async () => {
    const input = {
      text: 'This is a test of the translation system.',
      targetLanguage: 'Hebrew',
    };

    const result = await translateText(input);
    expect(result).toBeDefined();
    expect(typeof result.translation).toBe('string');
    // Check for a common Hebrew word that should appear
    expect(result.translation).toContain('מערכת');

    console.log(`Translation successful: "${input.text}" -> "${result.translation}"`);
  }, 30000);
});
