import {
    GenerateTextRequest,
    VideoStatus,
    VideoHistoryItem,
    ApiError,
} from '@/types/index';

// In production (static export), API is on same origin. In dev, proxy to localhost:4000
const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '' : 'http://localhost:4000');

class ApiClient {
    private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
        this.baseUrl = baseUrl;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
                const error: ApiError = {
                          message: `API Error: ${response.statusText}`,
                          status: response.status,
                };
                try {
                          const data = await response.json();
                          error.message = data.message || error.message;
                          error.code = data.code;
                } catch {
                          // Keep default error message
                }
                throw error;
        }
        return response.json();
  }

  async generateVideoFromText(
        request: GenerateTextRequest
      ): Promise<{ jobId: string }> {
        const response = await fetch(`${this.baseUrl}/api/video/generate-text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
        });
        return this.handleResponse(response);
  }

  async generateVideoFromImage(
        file: File,
        prompt: string,
        duration?: number,
        resolution?: string,
        aspectRatio?: string
      ): Promise<{ jobId: string }> {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('prompt', prompt);
        if (duration) formData.append('duration', duration.toString());
        if (resolution) formData.append('resolution', resolution);
        if (aspectRatio) formData.append('aspectRatio', aspectRatio);

      const response = await fetch(`${this.baseUrl}/api/video/generate-image`, {
              method: 'POST',
              body: formData,
      });
        return this.handleResponse(response);
  }

  async checkVideoStatus(jobId: string): Promise<VideoStatus> {
        const response = await fetch(`${this.baseUrl}/api/video/status/${jobId}`, {
                method: 'GET',
        });
        return this.handleResponse(response);
  }

  async speechToText(audioBlob: Blob): Promise<{ text: string }> {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');

      const response = await fetch(`${this.baseUrl}/api/speech/to-text`, {
              method: 'POST',
              body: formData,
      });
        return this.handleResponse(response);
  }

  async textToSpeech(
        text: string,
        voice?: string
      ): Promise<{ audioUrl: string }> {
        const response = await fetch(`${this.baseUrl}/api/speech/to-audio`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voice }),
        });
        return this.handleResponse(response);
  }

  async generateAudio(request: {
        text: string;
        voice?: string;
        style?: string;
        speed?: string;
        pitch?: string;
        outputFormat?: string;
  }): Promise<{
        success: boolean;
        data: {
          audioUrl: string;
          format: string;
          size: number;
          voice: { id: string; name?: string; gender?: string; language?: string };
          textLength: number;
          estimatedDuration: number;
        };
  }> {
        const response = await fetch(`${this.baseUrl}/api/speech/generate-audio`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
        });
        return this.handleResponse(response);
  }

  async getAvailableVoices(language?: string): Promise<{
        success: boolean;
        data: {
          voices: Record<string, Array<{ id: string; name: string; gender: string; styles: string[] }>>;
          language: string;
          count: number;
        };
  }> {
        const url = language
          ? `${this.baseUrl}/api/speech/available-voices?language=${language}`
                : `${this.baseUrl}/api/speech/available-voices`;
        const response = await fetch(url);
        return this.handleResponse(response);
  }

  async listVideos(): Promise<VideoHistoryItem[]> {
        const response = await fetch(`${this.baseUrl}/api/video/list`, {
                method: 'GET',
        });
        const result = await this.handleResponse<{
                success: boolean;
                data: { videos: VideoHistoryItem[] };
        }>(response);
        return result?.data?.videos || [];
  }
}

export const apiClient = new ApiClient();

export const generateVideoFromText = (request: GenerateTextRequest) =>
    apiClient.generateVideoFromText(request);

export const generateVideoFromImage = (
    file: File,
    prompt: string,
    duration?: number,
    resolution?: string,
    aspectRatio?: string
  ) => apiClient.generateVideoFromImage(file, prompt, duration, resolution, aspectRatio);

export const checkVideoStatus = (jobId: string) =>
    apiClient.checkVideoStatus(jobId);

export const speechToText = (audioBlob: Blob) =>
    apiClient.speechToText(audioBlob);

export const textToSpeech = (text: string, voice?: string) =>
    apiClient.textToSpeech(text, voice);

export const generateAudio = (request: Parameters<typeof apiClient.generateAudio>[0]) =>
    apiClient.generateAudio(request);

export const getAvailableVoices = (language?: string) =>
    apiClient.getAvailableVoices(language);

export const listVideos = () => apiClient.listVideos();
