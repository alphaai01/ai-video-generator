'use client';

import { useState, useCallback } from 'react';
import {
  generateVideoFromText,
  generateVideoFromImage,
  checkVideoStatus,
} from '@/lib/api';
import { GenerationSettings, ApiError } from '@/types/index';

type GenerationStatus = 'idle' | 'generating' | 'polling' | 'complete' | 'error';

export function useVideoGeneration() {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<GenerationSettings>({
    duration: 8,
    resolution: '1080p',
    aspectRatio: '16:9',
    includeNarration: false,
    narrationText: '',
  });

  const resetGeneration = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setVideoUrl(null);
    setJobId(null);
    setError(null);
  }, []);

  const pollStatus = useCallback(
    async (id: string) => {
      const maxAttempts = 120;
      let attempts = 0;
      const pollInterval = 2000;

      const poll = async () => {
        try {
          const videoStatus = await checkVideoStatus(id);

          if (videoStatus.status === 'completed') {
            setStatus('complete');
            setProgress(100);
            setVideoUrl(videoStatus.videoUrl || null);
            return;
          }

          if (videoStatus.status === 'failed') {
            setStatus('error');
            setError(videoStatus.error || 'Video generation failed');
            return;
          }

          setProgress(Math.min(videoStatus.progress, 99));
          setStatus('polling');

          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, pollInterval);
          } else {
            setStatus('error');
            setError('Generation timeout');
          }
        } catch (err) {
          const apiError = err as ApiError;
          setStatus('error');
          setError(apiError.message || 'Failed to check video status');
        }
      };

      poll();
    },
    []
  );

  const generateFromText = useCallback(
    async (textPrompt: string) => {
      if (!textPrompt.trim()) {
        setError('Please enter a prompt');
        return;
      }

      resetGeneration();
      setStatus('generating');
      setProgress(10);

      try {
        const response = await generateVideoFromText({
          prompt: textPrompt,
          duration: settings.duration,
          resolution: settings.resolution === '1080p' ? '1080' : '720',
          aspectRatio: settings.aspectRatio,
          narrationText: settings.includeNarration ? settings.narrationText : undefined,
        });

        setJobId(response.jobId);
        setProgress(20);
        pollStatus(response.jobId);
      } catch (err) {
        const apiError = err as ApiError;
        setStatus('error');
        setError(apiError.message || 'Failed to generate video');
      }
    },
    [settings, resetGeneration, pollStatus]
  );

  const generateFromImage = useCallback(
    async (imageFile: File, imagePrompt: string) => {
      if (!imageFile) {
        setError('Please select an image');
        return;
      }

      // Prompt is optional for image-to-video; use a default if empty
      const finalPrompt = imagePrompt.trim() || 'Generate a creative video from this image';

      resetGeneration();
      setStatus('generating');
      setProgress(10);

      try {
        const response = await generateVideoFromImage(
          imageFile,
          finalPrompt,
          settings.duration,
          settings.resolution === '1080p' ? '1080p' : '720p'
        );

        setJobId(response.jobId);
        setProgress(20);
        pollStatus(response.jobId);
      } catch (err) {
        const apiError = err as ApiError;
        setStatus('error');
        setError(apiError.message || 'Failed to generate video');
      }
    },
    [settings, resetGeneration, pollStatus]
  );

  return {
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
    jobId,
  };
}
