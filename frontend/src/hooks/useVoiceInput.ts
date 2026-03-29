'use client';

import { useState, useRef, useCallback } from 'react';
import { speechToText } from '@/lib/api';
import { ApiError } from '@/types/index';

export function useVoiceInput() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setRecordingDuration(0);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      let seconds = 0;
      durationIntervalRef.current = setInterval(() => {
        seconds += 1;
        setRecordingDuration(seconds);
      }, 1000);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to access microphone');
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !streamRef.current) {
      return;
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    setIsRecording(false);

    return new Promise<string | null>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;

      mediaRecorder!.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/wav',
        });

        streamRef.current?.getTracks().forEach((track) => track.stop());
        audioChunksRef.current = [];

        setIsTranscribing(true);
        try {
          const result = await speechToText(audioBlob);
          setTranscribedText(result.text);
          setError(null);
          resolve(result.text);
        } catch (err) {
          const apiError = err as ApiError;
          const errorMessage =
            apiError.message || 'Failed to transcribe audio';
          setError(errorMessage);
          resolve(null);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder!.stop();
    });
  }, []);

  const clearTranscription = useCallback(() => {
    setTranscribedText('');
  }, []);

  return {
    isRecording,
    recordingDuration,
    transcribedText,
    isTranscribing,
    error,
    startRecording,
    stopRecording,
    clearTranscription,
  };
}
