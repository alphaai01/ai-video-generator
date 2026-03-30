/**
 * Azure OpenAI Sora 2 Video Generation Service
 * Handles text-to-video and image-to-video generation using Sora 2 API
 *
 * API Reference (from Azure AI Foundry / Microsoft Q&A):
 *   POST /openai/v1/videos
 *   Header: Api-key: <key>
 *
 *   Text-to-video body: { model, prompt: "...", size, seconds }
 *   Image-to-video body: { model, prompt: "...", input: [{ type: "input_image", image_base64: "..." }], size, seconds }
 *
 *   Supported sizes: "1280x720" (landscape), "720x1280" (portrait)
 *   Supported durations: 4, 8, 12 seconds
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class VideoService {
        /**
         * Initialize video service with Azure OpenAI configuration
         */
    constructor() {
                this.endpoint = process.env.AZURE_OPENAI_ENDPOINT || '';
                this.apiKey = process.env.AZURE_OPENAI_API_KEY || '';
                this.model = process.env.AZURE_OPENAI_SORA_DEPLOYMENT || 'sora-2';

            // Sora 2 uses the /openai/v1/videos endpoint (NOT the deployments-based URL)
            this.baseUrl = `${this.endpoint}/openai/v1/videos`;

            // Create axios instance with default headers
            this.axiosInstance = axios.create({
                            headers: {
                                                'Api-key': this.apiKey,
                                                'Content-Type': 'application/json',
                            },
                            timeout: 30000, // 30 second timeout for API calls
            });
    }

    /**
         * Generates a video from text prompt using Sora 2
         * @param {string} prompt - Video generation prompt
         * @param {Object} options - Generation options
         * @param {string} options.size - Video resolution (default: 1280x720)
         * @param {number} options.duration - Duration in seconds (default: 4)
         * @returns {Promise<string>} Job ID for polling status
         * @throws {Error} If API request fails
         */
    async generateFromText(prompt, options = {}) {
                try {
                                const {
                                                    size = '1280x720',
                                                    duration = 4,
                                } = options;

                    console.log(
                                        `[VideoService] Starting text-to-video generation: "${prompt.substring(0, 50)}..."`
                                    );
                                console.log(`[VideoService] Options: size=${size}, duration=${duration}s`);

                    const payload = {
                                        model: this.model,
                                        prompt: prompt,
                                        size,
                                        seconds: Number(duration),
                    };

                    console.log(`[VideoService] Payload:`, JSON.stringify(payload, null, 2));

                    const response = await this.axiosInstance.post(this.baseUrl, payload);
                                const jobId = response.data.id;
                                console.log(`[VideoService] Video generation job created: ${jobId}`);
                                return jobId;
                } catch (error) {
                                console.error(
                                                    '[VideoService] Text-to-video generation failed:',
                                                    error.response?.status,
                                                    error.response?.data || error.message
                                                );
                                throw new Error(
                                                    `Failed to generate video from text: ${error.response?.data?.error?.message || error.message}`
                                                );
                }
    }

    /**
         * Generates a video from an image and optional text prompt using Sora 2
         * Uses the top-level "prompt" field and "input" array for the image
         * @param {Buffer|string} imageSource - Image buffer or URL
         * @param {string} prompt - Video generation prompt (optional)
         * @param {Object} options - Generation options
         * @returns {Promise<string>} Job ID for polling status
         * @throws {Error} If API request fails
         */
    async generateFromImage(imageSource, prompt, options = {}) {
                try {
                                const {
                                                    size = '1280x720',
                                                    duration = 4,
                                } = options;

                    const promptText = (prompt && typeof prompt === 'string')
                                    ? prompt.substring(0, 50)
                                        : '(no prompt)';
                                console.log(
                                                    `[VideoService] Starting image-to-video generation: "${promptText}..."`
                                                );

                    // Build the input array with typed objects per Sora 2 API spec
                    const input = [];

                    // Add image input
                    if (Buffer.isBuffer(imageSource)) {
                                        const base64 = imageSource.toString('base64');
                                        input.push({
                                                                type: 'input_image',
                                                                image_base64: base64,
                                        });
                    } else if (typeof imageSource === 'string') {
                                        input.push({
                                                                type: 'input_image',
                                                                image_url: imageSource,
                                        });
                    }

                    // Use the prompt text or a default
                    const promptValue = (prompt && typeof prompt === 'string' && prompt.trim())
                                    ? prompt.trim()
                                        : 'Generate a creative video from this image';

                    const payload = {
                                        model: this.model,
                                        prompt: promptValue,
                                        input,
                                        size,
                                        seconds: Number(duration),
                    };

                    console.log(`[VideoService] Image-to-video payload (image truncated):`, JSON.stringify({
                                        ...payload,
                                        input: payload.input.map(i =>
                                                                i.type === 'input_image'
                                                                                         ? { ...i, image_base64: i.image_base64 ? `[${i.image_base64.length} chars]` : undefined }
                                                                    : i
                                                                                 ),
                    }, null, 2));

                    const response = await this.axiosInstance.post(this.baseUrl, payload);
                                const jobId = response.data.id;
                                console.log(`[VideoService] Video generation job created: ${jobId}`);
                                return jobId;
                } catch (error) {
                                console.error(
                                                    '[VideoService] Image-to-video generation failed:',
                                                    error.response?.status,
                                                    error.response?.data || error.message
                                                );
                                throw new Error(
                                                    `Failed to generate video from image: ${error.response?.data?.error?.message || error.message}`
                                                );
                }
    }

    /**
         * Checks the status of a video generation job
         * @param {string} jobId - Job ID to check
         * @returns {Promise<Object>} Job status and results
         * @throws {Error} If status check fails
         */
    async checkStatus(jobId) {
                try {
                                const url = `${this.baseUrl}/${jobId}`;
                                console.log(`[VideoService] Checking status: GET ${url}`);

                    const response = await this.axiosInstance.get(url);
                                const data = response.data;

                    // Log the full raw response for debugging
                    console.log(`[VideoService] Raw status response:`, JSON.stringify(data, null, 2));

                    // Normalize status
                    let normalizedStatus = (data.status || '').toLowerCase();
                                if (['succeeded', 'completed', 'complete'].includes(normalizedStatus)) {
                                                    normalizedStatus = 'succeeded';
                                } else if (['failed', 'error'].includes(normalizedStatus)) {
                                                    normalizedStatus = 'failed';
                                } else if (['canceled', 'cancelled'].includes(normalizedStatus)) {
                                                    normalizedStatus = 'failed';
                                } else if (['running', 'in_progress', 'processing', 'generating'].includes(normalizedStatus)) {
                                                    normalizedStatus = 'running';
                                }

                    return {
                                        jobId,
                                        status: normalizedStatus,
                                        rawStatus: data.status,
                                        createdAt: data.created_at,
                                        expiresAt: data.expires_at,
                                        generations: data.generations || data.data || [],
                                        error: data.error || null,
                                        rawData: data,
                    };
                } catch (error) {
                                console.error('[VideoService] Status check failed:',
                                                              error.response?.status, error.response?.data || error.message);
                                throw new Error(
                                                    `Failed to check video generation status: ${error.response?.data?.error?.message || error.message}`
                                                );
                }
    }

    /**
         * Downloads video content from a completed generation job
         * @param {string} jobId - Job ID of completed generation
         * @returns {Promise<Buffer>} Video file buffer
         * @throws {Error} If download fails
         */
    async downloadVideo(jobId) {
                try {
                                console.log(`[VideoService] Downloading video for job: ${jobId}`);
                                const response = await this.axiosInstance.get(
                                                    `${this.baseUrl}/${jobId}/content/generation`,
                                    {
                                                            responseType: 'arraybuffer',
                                                            timeout: 120000, // 2 minute timeout for video download
                                    }
                                                );

                    const buffer = Buffer.from(response.data);
                                console.log(
                                                    `[VideoService] Video downloaded successfully: ${buffer.length} bytes`
                                                );
                                return buffer;
                } catch (error) {
                                console.error('[VideoService] Video download failed:',
                                                              error.response?.status, error.message);
                                throw new Error(
                                                    `Failed to download video: ${error.response?.data?.error?.message || error.message}`
                                                );
                }
    }

    /**
         * Polls job status until completion or failure
         * @param {string} jobId - Job ID to poll
         * @param {number} maxAttempts - Maximum polling attempts (default: 120)
         * @param {number} interval - Polling interval in milliseconds (default: 5000)
         * @returns {Promise<Object>} Final job status and results
         */
    async pollUntilComplete(jobId, maxAttempts = 120, interval = 5000) {
                console.log(
                                `[VideoService] Polling job ${jobId} (max attempts: ${maxAttempts})`
                            );

            let attempt = 0;
                let lastError = null;

            while (attempt < maxAttempts) {
                            try {
                                                const status = await this.checkStatus(jobId);
                                                console.log(
                                                                        `[VideoService] Poll attempt ${attempt + 1}/${maxAttempts}: status=${status.status}`
                                                                    );

                                if (status.status === 'succeeded') {
                                                        console.log(`[VideoService] Job completed successfully: ${jobId}`);
                                                        return status;
                                }

                                if (status.status === 'failed') {
                                                        const errorMsg = status.error?.message || 'Video generation failed without error details';
                                                        console.error(`[VideoService] Job failed: ${jobId} - ${errorMsg}`);
                                                        throw new Error(`Video generation failed: ${errorMsg}`);
                                }

                                // Job is still processing (notstarted, running, etc.)
                                const backoffInterval = interval * Math.min(1 + attempt * 0.1, 3);
                                                await new Promise(resolve => setTimeout(resolve, backoffInterval));
                                                attempt++;
                            } catch (error) {
                                                lastError = error;
                                                if (error.message.includes('Video generation failed')) {
                                                                        throw error;
                                                }
                                                if (attempt < maxAttempts - 1) {
                                                                        console.warn(
                                                                                                    `[VideoService] Poll attempt ${attempt + 1} failed, retrying: ${error.message}`
                                                                                                );
                                                                        await new Promise(resolve => setTimeout(resolve, interval));
                                                                        attempt++;
                                                } else {
                                                                        throw error;
                                                }
                            }
            }

            throw new Error(
                            `Video generation polling timeout after ${maxAttempts} attempts. ${lastError ? `Last error: ${lastError.message}` : ''}`
                        );
    }

    /**
         * Validates Sora 2 API connectivity and credentials
         * @returns {Promise<boolean>} True if API is accessible
         */
    async validateConnection() {
                try {
                                console.log(`[VideoService] Validating API connection to ${this.baseUrl}`);
                                console.log(`[VideoService] Model: ${this.model}`);

                    const testPayload = {
                                        model: this.model,
                                        prompt: 'A calm ocean wave',
                                        size: '1280x720',
                                        seconds: 4,
                    };

                    const response = await this.axiosInstance.post(this.baseUrl, testPayload);
                                console.log('[VideoService] API connection validated, job ID:', response.data.id);
                                return true;
                } catch (error) {
                                console.error('[VideoService] API connection validation failed:',
                                                              error.response?.status, error.response?.data || error.message);
                                return false;
                }
    }
}

// Only instantiate if not in demo mode (to avoid config errors)
const DEMO_MODE = process.env.DEMO_MODE === 'true';

let videoService;
if (DEMO_MODE) {
        // Export a dummy service in demo mode
    videoService = {
                generateFromText: async () => { throw new Error('Not available in demo mode'); },
                generateFromImage: async () => { throw new Error('Not available in demo mode'); },
                checkStatus: async () => { throw new Error('Not available in demo mode'); },
                downloadVideo: async () => { throw new Error('Not available in demo mode'); },
                pollUntilComplete: async () => { throw new Error('Not available in demo mode'); },
                validateConnection: async () => false,
    };
} else {
        videoService = new VideoService();
}

export default videoService;
