// tests/ai/flows/translate-text.spec.ts
import { test, expect } from 'vitest';
import { translateText } from '@/ai/flows/translate-text';

// This test calls the server action directly to verify the Genkit flow.
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
});

test('should handle empty input gracefully', async () => {
    const input = {
      text: '   ',
      targetLanguage: 'Spanish',
    };
  
    const result = await translateText(input);
  
    expect(result).toBeDefined();
    expect(result.translation).toBe('');
});
