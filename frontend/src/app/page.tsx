'use client';

import React, { useState } from 'react';
import { PromptInput } from '@/components/video/PromptInput';
import { ImageUpload } from '@/components/video/ImageUpload';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { VideoHistory } from '@/components/video/VideoHistory';
import { GenerationSettingsComponent } from '@/components/video/GenerationSettings';
import { VoiceInput } from '@/components/voice/VoiceInput';
import { AudioStudio } from '@/components/audio/AudioStudio';
import { Button } from '@/components/ui/Button';
import { useVideoGeneration } from '@/hooks/useVideoGeneration';
import { Sparkles, Film, Music } from 'lucide-react';
import { clsx } from 'clsx';
import { VideoHistoryItem } from '@/types/index';

export default function Page() {
  const {
    prompt,
    setPrompt,
    image,
    setImage,
    status,
    progress,
    videoUrl,
    error,
    settings,
    setSettings,
    generateFromText,
    generateFromImage,
    resetGeneration,
  } = useVideoGeneration();

  // Top-level mode: video or audio
  const [mode, setMode] = useState<'video' | 'audio'>('video');

  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'voice'>(
    'text'
  );
  const [selectedHistoryVideo, setSelectedHistoryVideo] =
    useState<VideoHistoryItem | null>(null);

  const isGenerating = status === 'generating' || status === 'polling';
  const isComplete = status === 'complete' && videoUrl;

  const handleGenerateFromText = async () => {
    await generateFromText(prompt);
  };

  const handleGenerateFromImage = async () => {
    if (image) {
      await generateFromImage(image, prompt);
    }
  };

  const handleVoiceText = (text: string) => {
    setPrompt(text);
    setActiveTab('text');
  };

  const handleHistorySelect = (video: VideoHistoryItem) => {
    setSelectedHistoryVideo(video);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Header */}
      <header className="border-b border-dark-600 backdrop-blur-md bg-dark-900 bg-opacity-40 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-accent rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-1000" />
                <div className="relative bg-dark-900 px-3 py-2 rounded-lg">
                  <span className="text-2xl">{mode === 'video' ? '\uD83C\uDFAC' : '\uD83C\uDFB5'}</span>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-text">
                  AI {mode === 'video' ? 'Video' : 'Audio'} Generator
                </h1>
                <p className="text-gray-400 text-sm">
                  {mode === 'video'
                    ? 'Create stunning videos with artificial intelligence'
                    : 'Generate natural voiceovers with AI voices'}
                </p>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-1 bg-dark-800 p-1 rounded-xl border border-dark-600">
              <button
                onClick={() => setMode('video')}
                className={clsx(
                  'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  mode === 'video'
                    ? 'bg-gradient-accent text-white shadow-glow'
                    : 'text-gray-400 hover:text-white hover:bg-dark-700'
                )}
              >
                <Film className="w-4 h-4" />
                Video
              </button>
              <button
                onClick={() => setMode('audio')}
                className={clsx(
                  'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  mode === 'audio'
                    ? 'bg-gradient-accent text-white shadow-glow'
                    : 'text-gray-400 hover:text-white hover:bg-dark-700'
                )}
              >
                <Music className="w-4 h-4" />
                Audio
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {mode === 'audio' ? (
          /* ========== AUDIO STUDIO ========== */
          <AudioStudio />
        ) : (
          /* ========== VIDEO GENERATOR ========== */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Input Section */}
            <div className="lg:col-span-2 space-y-8">
              {/* Tab Navigation */}
              <div className="flex gap-2">
                {(['text', 'image', 'voice'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={clsx(
                      'px-4 py-2 rounded-lg font-medium transition-all duration-200',
                      'border',
                      activeTab === tab
                        ? 'bg-gradient-accent text-white border-accent-purple'
                        : 'bg-dark-700 text-gray-300 border-dark-600 hover:bg-dark-600'
                    )}
                  >
                    {tab === 'text'
                      ? 'Text Prompt'
                      : tab === 'image'
                      ? 'Image Upload'
                      : 'Voice Input'}
                  </button>
                ))}
              </div>

              {/* Input Components */}
              <div className="space-y-6">
                {activeTab === 'text' && (
                  <>
                    <PromptInput
                      value={prompt}
                      onChange={setPrompt}
                      disabled={isGenerating}
                    />
                    <GenerationSettingsComponent
                      settings={settings}
                      onSettingsChange={setSettings}
                      disabled={isGenerating}
                    />
                  </>
                )}

                {activeTab === 'image' && (
                  <>
                    <ImageUpload
                      image={image}
                      onImageChange={setImage}
                      disabled={isGenerating}
                    />
                    <PromptInput
                      value={prompt}
                      onChange={setPrompt}
                      disabled={isGenerating}
                    />
                    <GenerationSettingsComponent
                      settings={settings}
                      onSettingsChange={setSettings}
                      disabled={isGenerating}
                    />
                  </>
                )}

                {activeTab === 'voice' && (
                  <>
                    <VoiceInput
                      onTextExtracted={handleVoiceText}
                      disabled={isGenerating}
                    />
                    {prompt && (
                      <>
                        <PromptInput
                          value={prompt}
                          onChange={setPrompt}
                          disabled={isGenerating}
                        />
                        <GenerationSettingsComponent
                          settings={settings}
                          onSettingsChange={setSettings}
                          disabled={isGenerating}
                        />
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-900 bg-opacity-20 border border-red-800 rounded-lg text-red-400">
                  {error}
                </div>
              )}

              {/* Generate Button */}
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={
                    activeTab === 'image'
                      ? handleGenerateFromImage
                      : handleGenerateFromText
                  }
                  disabled={
                    isGenerating ||
                    !prompt.trim() ||
                    (activeTab === 'image' && !image)
                  }
                  loading={isGenerating}
                  icon={!isGenerating && <Sparkles className="w-5 h-5" />}
                  className="flex-1"
                >
                  {isGenerating
                    ? 'Generating Video...'
                    : 'Generate Video'}
                </Button>
                {isComplete && (
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={resetGeneration}
                  >
                    New Video
                  </Button>
                )}
              </div>
            </div>

            {/* Right Column - Output and History */}
            <div className="space-y-8">
              {/* Video Player */}
              <VideoPlayer
                videoUrl={selectedHistoryVideo?.videoUrl || videoUrl}
                isLoading={isGenerating}
                progress={progress}
                status={status}
                duration={
                  selectedHistoryVideo?.duration ||
                  (isComplete ? settings.duration : undefined)
                }
                resolution={
                  selectedHistoryVideo?.resolution || settings.resolution
                }
              />

              {/* Video History */}
              <VideoHistory onSelectVideo={handleHistorySelect} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
