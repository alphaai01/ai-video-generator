'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Settings, Volume2 } from 'lucide-react';
import { GenerationSettings, AspectRatio } from '@/types/index';
import { clsx } from 'clsx';

interface GenerationSettingsProps {
  settings: GenerationSettings;
  onSettingsChange: (settings: GenerationSettings) => void;
  disabled?: boolean;
}

const ASPECT_RATIOS: { value: AspectRatio; label: string; icon: string }[] = [
  { value: '16:9', label: '16:9', icon: 'Landscape' },
  { value: '9:16', label: '9:16', icon: 'Portrait' },
  { value: '1:1', label: '1:1', icon: 'Square' },
  { value: '4:5', label: '4:5', icon: 'Social' },
];

export const GenerationSettingsComponent: React.FC<
  GenerationSettingsProps
> = ({ settings, onSettingsChange, disabled = false }) => {
  // Sora 2 only supports 4, 8, and 12 second durations
  const durationOptions: Array<4 | 8 | 12> = [4, 8, 12];
  const resolutionOptions: Array<'720p' | '1080p'> = ['720p', '1080p'];

  const handleDurationChange = (duration: 4 | 8 | 12) => {
    onSettingsChange({ ...settings, duration });
  };

  const handleResolutionChange = (resolution: '720p' | '1080p') => {
    onSettingsChange({ ...settings, resolution });
  };

  const handleAspectRatioChange = (aspectRatio: AspectRatio) => {
    onSettingsChange({ ...settings, aspectRatio });
  };

  const handleNarrationToggle = () => {
    onSettingsChange({
      ...settings,
      includeNarration: !settings.includeNarration,
      narrationText: !settings.includeNarration ? settings.narrationText : '',
    });
  };

  const handleNarrationTextChange = (text: string) => {
    onSettingsChange({ ...settings, narrationText: text });
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-accent-purple" />
          <h3 className="text-lg font-semibold text-white">Settings</h3>
        </div>

        {/* Duration */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-white">
            Video Duration
          </label>
          <div className="grid grid-cols-4 gap-2">
            {durationOptions.map((duration) => (
              <button
                key={duration}
                onClick={() => handleDurationChange(duration)}
                disabled={disabled}
                className={clsx(
                  'py-2 px-3 rounded-lg font-medium transition-all duration-200',
                  'border border-dark-600',
                  settings.duration === duration
                    ? 'bg-gradient-accent text-white border-accent-purple'
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {duration}s
              </button>
            ))}
          </div>
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-white">
            Aspect Ratio
          </label>
          <div className="grid grid-cols-4 gap-2">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.value}
                onClick={() => handleAspectRatioChange(ratio.value)}
                disabled={disabled}
                className={clsx(
                  'py-2 px-3 rounded-lg font-medium transition-all duration-200',
                  'border border-dark-600 flex flex-col items-center gap-1',
                  settings.aspectRatio === ratio.value
                    ? 'bg-gradient-accent text-white border-accent-purple'
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <span className="text-sm font-bold">{ratio.label}</span>
                <span className="text-[10px] opacity-70">{ratio.icon}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            16:9 for YouTube/Desktop, 9:16 for Reels/TikTok, 1:1 for Instagram, 4:5 for Social
          </p>
        </div>

        {/* Resolution */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-white">
            Resolution
          </label>
          <div className="grid grid-cols-2 gap-2">
            {resolutionOptions.map((resolution) => (
              <button
                key={resolution}
                onClick={() => handleResolutionChange(resolution)}
                disabled={disabled}
                className={clsx(
                  'py-2 px-4 rounded-lg font-medium transition-all duration-200',
                  'border border-dark-600',
                  settings.resolution === resolution
                    ? 'bg-gradient-accent text-white border-accent-purple'
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {resolution}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Narration */}
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.includeNarration}
              onChange={handleNarrationToggle}
              disabled={disabled}
              className={clsx(
                'w-4 h-4 rounded border-dark-600 accent-accent-purple cursor-pointer',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            />
            <Volume2 className="w-4 h-4 text-accent-cyan" />
            <span className="text-sm font-medium text-white">
              Add Voice Narration
            </span>
          </label>
          <p className="text-xs text-gray-500">
            Add AI-generated voiceover to your video
          </p>

          {settings.includeNarration && (
            <div className="space-y-2 mt-3">
              <label className="block text-sm font-medium text-gray-300">
                Narration Script
              </label>
              <textarea
                value={settings.narrationText}
                onChange={(e) => handleNarrationTextChange(e.target.value)}
                disabled={disabled}
                placeholder="Enter the text you want narrated over the video... (leave blank to auto-generate from prompt)"
                className={clsx(
                  'w-full h-24 p-3 bg-dark-700 border border-dark-600 rounded-lg',
                  'text-white placeholder-gray-500 resize-none text-sm',
                  'focus:outline-none focus:border-accent-cyan focus:ring-2 focus:ring-accent-cyan focus:ring-opacity-20',
                  'transition-all duration-200',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
                maxLength={2000}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Leave blank to auto-generate narration from your prompt</span>
                <span>{settings.narrationText.length} / 2000</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

GenerationSettingsComponent.displayName = 'GenerationSettings';
