'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Mic, Square, X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useVoiceInput } from '@/hooks/useVoiceInput';

interface VoiceInputProps {
  onTextExtracted?: (text: string) => void;
  disabled?: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTextExtracted,
  disabled = false,
}) => {
  const {
    isRecording,
    recordingDuration,
    transcribedText,
    isTranscribing,
    error,
    startRecording,
    stopRecording,
    clearTranscription,
  } = useVoiceInput();

  const [copied, setCopied] = React.useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyText = () => {
    if (transcribedText) {
      navigator.clipboard.writeText(transcribedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUseAsPrompt = () => {
    if (transcribedText) {
      onTextExtracted?.(transcribedText);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-accent-cyan" />
          <h3 className="text-lg font-semibold text-white">Voice Input</h3>
        </div>

        {error && (
          <div className="p-3 bg-red-900 bg-opacity-20 border border-red-800 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {!transcribedText ? (
            <>
              {isRecording ? (
                <div className="flex items-center gap-3 bg-dark-700 p-4 rounded-lg border-2 border-red-500">
                  <div className="relative w-8 h-8">
                    <div className="absolute inset-0 rounded-full bg-red-500 animate-pulse-glow" />
                    <div className="absolute inset-1 rounded-full bg-red-500" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Recording...</p>
                    <p className="text-gray-400 text-sm">
                      {formatDuration(recordingDuration)}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="flex gap-2">
                {isRecording ? (
                  <Button
                    variant="danger"
                    size="lg"
                    onClick={stopRecording}
                    disabled={disabled || isTranscribing}
                    icon={<Square className="w-4 h-4" />}
                    className="flex-1"
                  >
                    {isTranscribing ? 'Transcribing...' : 'Stop Recording'}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={startRecording}
                    disabled={disabled || isTranscribing}
                    icon={<Mic className="w-4 h-4" />}
                    className="flex-1"
                  >
                    Start Recording
                  </Button>
                )}
              </div>

              <p className="text-xs text-gray-500 text-center">
                Click the microphone to record your prompt. Maximum 2 minutes.
              </p>
            </>
          ) : (
            <>
              <div className="bg-dark-700 p-4 rounded-lg border border-dark-600 space-y-3">
                <p className="text-sm text-gray-300">{transcribedText}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleCopyText}
                  icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  className="flex-1"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={clearTranscription}
                  icon={<X className="w-4 h-4" />}
                >
                  Clear
                </Button>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={handleUseAsPrompt}
                className="w-full"
              >
                Use as Prompt
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

VoiceInput.displayName = 'VoiceInput';
