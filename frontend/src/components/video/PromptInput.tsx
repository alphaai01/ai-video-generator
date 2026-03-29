'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

const EXAMPLE_PROMPTS = [
  'A cinematic shot of a spaceship entering a wormhole with neon lights',
  'An animated journey through a futuristic city at sunset',
  'A magical forest with glowing creatures and floating lights',
  'A 3D render of a product showcase with dramatic lighting',
];

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
  placeholder?: string;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  value,
  onChange,
  maxLength = 4000,
  disabled = false,
  placeholder = 'Describe the video you want to generate... Be creative and specific!',
}) => {
  const [showExamples, setShowExamples] = useState(false);

  const handleExampleClick = (prompt: string) => {
    onChange(prompt);
    setShowExamples(false);
  };

  const characterCount = value.length;
  const percentageUsed = (characterCount / maxLength) * 100;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-purple" />
          <h3 className="text-lg font-semibold text-white">Prompt</h3>
        </div>

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
          disabled={disabled}
          placeholder={placeholder}
          className={clsx(
            'w-full min-h-[160px] p-4 bg-dark-700 border border-dark-600 rounded-lg',
            'text-white placeholder-gray-500 resize-y',
            'focus:outline-none focus:border-accent-purple focus:ring-2 focus:ring-accent-purple focus:ring-opacity-20',
            'transition-all duration-200',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />

        <div className="flex items-center justify-between">
          <div className="flex-1 mr-4">
            <div className="w-full h-1 bg-dark-600 rounded-full overflow-hidden">
              <div
                className={clsx(
                  'h-full transition-all duration-300',
                  percentageUsed > 80
                    ? 'bg-red-500'
                    : percentageUsed > 60
                    ? 'bg-yellow-500'
                    : 'bg-gradient-accent'
                )}
                style={{ width: `${percentageUsed}%` }}
              />
            </div>
          </div>
          <span
            className={clsx(
              'text-sm whitespace-nowrap ml-2',
              characterCount > maxLength * 0.9
                ? 'text-red-400'
                : 'text-gray-400'
            )}
          >
            {characterCount} / {maxLength}
          </span>
        </div>

        <button
          onClick={() => setShowExamples(!showExamples)}
          className="text-sm text-accent-purple hover:text-accent-blue transition-colors"
        >
          {showExamples ? 'Hide examples' : 'Show examples'}
        </button>

        {showExamples && (
          <div className="grid grid-cols-1 gap-2">
            {EXAMPLE_PROMPTS.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(prompt)}
                className={clsx(
                  'p-3 bg-dark-700 border border-dark-600 rounded-lg',
                  'text-left text-sm text-gray-300 hover:text-white',
                  'hover:bg-dark-600 hover:border-accent-purple transition-all duration-200',
                  'line-clamp-2'
                )}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

PromptInput.displayName = 'PromptInput';
