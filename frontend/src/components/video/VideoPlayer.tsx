'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Download, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { clsx } from 'clsx';

interface VideoPlayerProps {
  videoUrl: string | null;
  isLoading?: boolean;
  progress?: number;
  status?: string;
  duration?: number;
  resolution?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  isLoading = false,
  progress = 0,
  status = 'idle',
  duration,
  resolution,
}) => {
  const handleDownload = () => {
    if (videoUrl) {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = `generated-video-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Play className="w-5 h-5 text-accent-cyan" />
          <h3 className="text-lg font-semibold text-white">Video Output</h3>
        </div>

        {isLoading || (status !== 'idle' && !videoUrl) ? (
          <div className="space-y-4">
            <div
              className={clsx(
                'w-full aspect-video bg-gradient-dark rounded-lg border border-dark-600',
                'flex items-center justify-center relative overflow-hidden'
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-dark-800 via-dark-700 to-dark-800 opacity-50" />
              <div className="relative flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-dark-600" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent-purple border-r-accent-blue animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-white font-medium">
                    {status === 'generating'
                      ? 'Initializing generation...'
                      : 'Generating your video...'}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {status === 'polling'
                      ? 'Processing frames'
                      : 'Preparing AI model'}
                  </p>
                </div>
              </div>
            </div>

            {progress > 0 && (
              <ProgressBar progress={progress} />
            )}
          </div>
        ) : videoUrl ? (
          <div className="space-y-4">
            <video
              src={videoUrl}
              controls
              className="w-full aspect-video bg-black rounded-lg border border-dark-600"
            />

            {duration || resolution ? (
              <div className="grid grid-cols-2 gap-2 text-sm">
                {duration && (
                  <div className="bg-dark-700 p-2 rounded border border-dark-600">
                    <p className="text-gray-400">Duration</p>
                    <p className="text-white font-medium">{duration}s</p>
                  </div>
                )}
                {resolution && (
                  <div className="bg-dark-700 p-2 rounded border border-dark-600">
                    <p className="text-gray-400">Resolution</p>
                    <p className="text-white font-medium">{resolution}</p>
                  </div>
                )}
              </div>
            ) : null}

            <Button
              variant="primary"
              onClick={handleDownload}
              icon={<Download className="w-4 h-4" />}
              className="w-full"
            >
              Download Video
            </Button>
          </div>
        ) : (
          <div className="w-full aspect-video bg-dark-700 rounded-lg border border-dark-600 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-400">
                Your generated video will appear here
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

VideoPlayer.displayName = 'VideoPlayer';
