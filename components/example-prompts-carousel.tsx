'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';

interface ExamplePrompt {
  category_id: string;
  category_name: string;
  prompt_text: string;
  prompt_number: number;
}

export function ExamplePromptsCarousel() {
  const [prompts, setPrompts] = useState<ExamplePrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch example prompts
    const fetchPrompts = async () => {
      try {
        const response = await fetch('/api/example-prompts');
        if (response.ok) {
          const data = await response.json();
          setPrompts(data.prompts || []);
        }
      } catch (error) {
        console.error('Error fetching example prompts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrompts();
  }, []);

  if (isLoading) {
    return (
      <Card className="w-full overflow-hidden shadow-2xl border-blue-300 dark:border-blue-700">
        <CardContent className="p-8 md:p-12">
          <div className="text-center text-gray-500">Loading example prompts...</div>
        </CardContent>
      </Card>
    );
  }

  if (prompts.length === 0) {
    return null;
  }

  // Duplicate prompts for seamless looping
  const duplicatedPrompts = [...prompts, ...prompts];
  const animationDuration = prompts.length * 6; // 6 seconds per prompt (slower)

  return (
    <div className="w-full max-w-4xl" style={{ fontFamily: 'var(--font-shadows-into-light)' }}>
      <Card className="w-full overflow-hidden shadow-2xl border-2 border-blue-600 dark:border-blue-500 bg-white dark:bg-gray-800">
        <CardContent className="p-8 md:p-12">
          <div className="flex flex-col items-center">
            {/* Header */}
            <div className="mb-6 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                Example Prompts
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                See what you&apos;ll receive in your inbox
              </p>
            </div>

            {/* Scrolling Prompts Container */}
            <div className="w-full max-w-2xl overflow-hidden relative">
              <div 
                className="flex gap-4"
                style={{
                  animation: `scroll-horizontal ${animationDuration}s linear infinite`,
                  width: `${duplicatedPrompts.length * 100}%`
                }}
              >
                {duplicatedPrompts.map((prompt, index) => (
                  <div
                    key={`${prompt.category_id}-${prompt.prompt_number}-${index}`}
                    className="flex-shrink-0"
                    style={{ width: `${100 / duplicatedPrompts.length}%` }}
                  >
                    <div className="bg-gradient-to-br from-blue-200 to-blue-300 dark:from-blue-800/60 dark:to-blue-900/60 border-l-4 border-blue-600 dark:border-blue-500 rounded-lg p-6 md:p-8 shadow-lg mx-2">
                      {/* Category Tag */}
                      <div className="mb-4">
                        <span className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-semibold capitalize border border-blue-300 dark:border-blue-700">
                          {prompt.category_name}
                        </span>
                      </div>

                      {/* Prompt Text */}
                      <p className="text-xl md:text-2xl text-gray-800 dark:text-gray-200 font-medium italic leading-relaxed">
                        &ldquo;{prompt.prompt_text}&rdquo;
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

