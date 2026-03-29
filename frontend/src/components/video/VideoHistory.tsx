'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { History } from 'lucide-react';
import { listVideos } from '@/lib/api';
import { VideoHistoryItem, ApiError } from '@/types/index';
import { clsx } from 'clsx';

interface VideoHistoryProps {
  onSelectVideo?: (video: VideoHistoryItem) => void;
}

export const VideoHistory: React.FC<VideoHistoryProps> = ({
  onSelectVideo,
}) => {
  const [videos, setVideos] = useState<VideoHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        setIsLoading(true);
        const data = await listVideos();
        setVideos(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Failed to load video history');
        setVideos([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadVideos();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        return 'Just now';
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
      }
    } catch {
      return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-accent-cyan" />
          <h3 className="text-lg font-semibold text-white">History</h3>
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-dark-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-accent-cyan" />
          <h3 className="text-lg font-semibold text-white">History</h3>
        </div>

        {error && (
          <div className="p-3 bg-red-900 bg-opacity-20 border border-red-800 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {videos.length === 0 && !error ? (
          <div className="text-center py-8 text-gray-400">
            <p>No videos generated yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
            {videos.map((video) => (
              <button
                key={video.id}
                onClick={() => onSelectVideo?.(video)}
                className={clsx(
                  'p-3 bg-dark-700 border border-dark-600 rounded-lg',
                  'hover:border-accent-purple hover:bg-dark-600',
                  'transition-all duration-200 text-left group'
                )}
              >
                <div className="flex gap-3">
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt="Thumbnail"
                      className="w-16 h-16 rounded bg-dark-600 object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded bg-gradient-dark border border-dark-600 flex items-center justify-center">
                      <span className="text-2xl">🎬</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium line-clamp-2 group-hover:text-accent-purple transition-colors">
                      {video.prompt}
                    </p>
                    <div className="flex gap-2 mt-1 text-xs text-gray-400">
                      <span>{video.duration}s</span>
                      <span>{video.resolution}</span>
                      <span>{formatDate(video.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

VideoHistory.displayName = 'VideoHistory';
