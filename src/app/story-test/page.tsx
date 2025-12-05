'use client';
import { useState } from 'react';
import { generateDualStory } from '../actions';
import { type StorySchema } from '@/lib/types';
import { z } from 'zod';

type StoryData = z.infer<typeof StorySchema>;

export default function StoryGenerator() {
  const [data, setData] = useState<StoryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setData(null);
    const storyData = await generateDualStory("A lost puppy finding home", "Spanish");
    setData(storyData);
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto p-4">
        <div className="flex justify-center mb-8">
            <button onClick={handleGenerate} disabled={isLoading} className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 disabled:bg-gray-400">
                {isLoading ? 'Generating...' : 'Generate Story'}
            </button>
        </div>

      {isLoading && <p className="text-center">Loading story...</p>}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Original */}
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">{data.titleOriginal}</h2>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed">{data.contentOriginal}</p>
          </div>

          {/* Right Column: Translation */}
          <div className="p-6 bg-gray-50 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{data.titleTranslated}</h2>
            <p className="mt-2 text-gray-700 whitespace-pre-wrap leading-relaxed">{data.contentTranslated}</p>
          </div>

            {/* Vocabulary Section */}
            <div className="md:col-span-2 p-6 bg-blue-50 rounded-lg shadow-md">
                 <h3 className="text-xl font-bold text-blue-800 mb-4">Key Vocabulary</h3>
                 <ul className="space-y-4">
                     {data.vocabulary.map((item, index) => (
                         <li key={index} className="border-b pb-2">
                             <p><strong className="font-semibold">{item.word}</strong> - {item.translation}</p>
                             <p className="text-sm text-gray-600 italic">Context: "{item.context}"</p>
                         </li>
                     ))}
                 </ul>
            </div>
        </div>
      )}
    </div>
  );
}
