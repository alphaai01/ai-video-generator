/**
 * Azure OpenAI Sora 2 Video Generation Service
 * Handles text-to-video and image-to-video generation using Sora 2 API
 *
 * API Reference (from Microsoft Learn / Azure AI Foundry):
 *   POST /openai/v1/videos
 *   Header: Api-key: <key>
 *
 *   Text-to-video body (JSON): { model, prompt, size, seconds }
 *   Image-to-video body (multipart/form-data):
 *     - model: string
 *     - prompt: string
 *     - size: string
 *     - seconds: number
 *     - input_reference: file (image/jpeg, image/png, image/webp)
 *
 *   The image MUST match the target video resolution exactly.
 *   Supported sizes: "1280x720" (landscape), "720x1280" (portrait)
 *   Supported durations: 4, 8, 12 seconds
 */
import axios from 'axios';
import FormData from 'form-data';
import sharp from 'sharp';
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

                    // Sora 2 uses the /openai/v1/videos endpoint
                    this.baseUrl = `${this.endpoint}/openai/v1/videos`;

                    // Create axios instance with default headers for JSON requests
                    this.axiosInstance = axios.create({
                                            headers: {
                                                                        'Api-key': this.apiKey,
                                                                        'Content-Type': 'application/json',
                                            },
                                            timeout: 30000,
                    });
    }

    /**
                 * Resize an image buffer to match the target video dimensions.
                 * Sora 2 requires the input_reference image to exactly match
                 * the requested video size (1280x720 or 720x1280).
                 *
                 * @param {Buffer} imageBuffer - The original image buffer
                 * @param {string} targetSize - Target size string, e.g. "1280x720"
                 * @returns {Promise<Buffer>} Resized PNG image buffer
                 */
    async resizeImageToMatch(imageBuffer, targetSize) {
                        const [widthStr, heightStr] = targetSize.split('x');
                        const targetWidth = parseInt(widthStr, 10);
                        const targetHeight = parseInt(heightStr, 10);

                    try {
                                            const metadata = await sharp(imageBuffer).metadata();
                                            console.log(`[VideoService] Original image: ${metadata.width}x${metadata.height}, target: ${targetWidth}x${targetHeight}`);

                            if (metadata.width === targetWidth && metadata.height === targetHeight) {
                                                        console.log('[VideoService] Image already matches target size, no resize needed');
                                                        return imageBuffer;
                            }

                            console.log(`[VideoService] Resizing image from ${metadata.width}x${metadata.height} to ${targetWidth}x${targetHeight}`);

                            const resizedBuffer = await sharp(imageBuffer)
                                                .resize(targetWidth, targetHeight, {
                                                                                fit: 'cover',
                                                                                position: 'center',
                                                })
                                                .png()
                                                .toBuffer();

                            console.log(`[VideoService] Image resized successfully (${resizedBuffer.length} bytes)`);
                                            return resizedBuffer;
                    } catch (error) {
                                            console.error('[VideoService] Image resize failed:', error.message);
                                            throw new Error(`Failed to resize image: ${error.message}`);
                    }
    }

    /**
                 * Generates a video from text prompt using Sora 2
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
                 * Generates a video from an image using Sora 2.
                 * Uses multipart/form-data with input_reference file field.
                 * Automatically resizes the image to match the target video dimensions.
                 */
    async generateFromImage(imageSource, prompt, options = {}) {
                        try {
                                                const {
                                                                            size = '1280x720',
                                                                            duration = 4,
                                                } = options;

                            const promptText = (prompt && typeof prompt === 'string')
                                                    ? prompt.substring(0, 50) : '(no prompt)';
                                                console.log(
                                                                            `[VideoService] Starting image-to-video generation: "${promptText}..."`
                                                                        );

                            const promptValue = (prompt && typeof prompt === 'string' && prompt.trim())
                                                    ? prompt.trim()
                                                        : 'Generate a creative video from this image';

                            // Get the image buffer
                            let imageBuffer;
                                                if (Buffer.isBuffer(imageSource)) {
                                                                            imageBuffer = imageSource;
                                                } else if (typeof imageSource === 'string') {
                                                                            const imgResponse = await axios.get(imageSource, {
                                                                                                            responseType: 'arraybuffer',
                                                                                                            timeout: 30000,
                                                                                        });
                                                                            imageBuffer = Buffer.from(imgResponse.data);
                                                } else {
                                                                            throw new Error('Invalid image source: must be a Buffer or URL string');
                                                }

                            // Resize the image to match the target video dimensions
                            const resizedImage = await this.resizeImageToMatch(imageBuffer, size);

                            // Build multipart form data per Sora 2 API spec
                            const form = new FormData();
                                                form.append('model', this.model);
                                                form.append('prompt', promptValue);
                                                form.append('size', size);
                                                form.append('seconds', String(Number(duration)));
                                                form.append('input_reference', resizedImage, {
                                                                            filename: 'image.png',
                                                                            contentType: 'image/png',
                                                });

                            console.log(`[VideoService] Image-to-video payload: model=${this.model}, prompt="${promptValue.substring(0, 50)}", size=${size}, seconds=${Number(duration)}, image=${resizedImage.length} bytes`);

                            const response = await axios.post(this.baseUrl, form, {
                                                        headers: {
                                                                                        ...form.getHeaders(),
                                                                                        'Api-key': this.apiKey,
                                                        },
                                                        timeout: 60000,
                            });

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
                 */
    async checkStatus(jobId) {
                        try {
                                                const url = `${this.baseUrl}/${jobId}`;
                                                console.log(`[VideoService] Checking status: GET ${url}`);

                            const response = await this.axiosInstance.get(url);
                                                const data = response.data;

                            console.log(`[VideoService] Raw status response:`, JSON.stringify(data, null, 2));

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
                 */
    async downloadVideo(jobId) {
                        try {
                                                console.log(`[VideoService] Downloading video for job: ${jobId}`);
                                                const response = await this.axiosInstance.get(
                                                                            `${this.baseUrl}/${jobId}/content/generation`,
                                                            {
                                                                                            responseType: 'arraybuffer',
                                                                                            timeout: 120000,
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
                                                                                const errorMsg = status.error?.message
                                                                                    || 'Video generation failed without error details';
                                                                                console.error(`[VideoService] Job failed: ${jobId} - ${errorMsg}`);
                                                                                throw new Error(`Video generation failed: ${errorMsg}`);
                                                }

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

// Only instantiate if not in demo mode
const DEMO_MODE = process.env.DEMO_MODE === 'true';

let videoService;

if (DEMO_MODE) {
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
