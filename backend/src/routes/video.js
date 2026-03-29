/**
 * Video Generation Routes
 * Handles all video generation related API endpoints
 * Supports both real Sora 2 API and demo mode
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import {
  AppError,
  ValidationError,
  NotFoundError,
  asyncHandler,
} from '../middleware/errorHandler.js';
import videoService from '../services/videoService.js';
import storageService from '../services/storageService.js';
import {
  validatePrompt,
  validateDuration,
  validateResolution,
  validateImageFile,
  generateFilename,
} from '../utils/helpers.js';

const router = express.Router();

// In-memory job store for tracking async video generation jobs
const jobs = new Map();

// Demo mode flag
const DEMO_MODE = process.env.DEMO_MODE === 'true';

// Sample demo video URLs (public domain / creative commons videos)
const DEMO_VIDEOS = [
  'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
];

// Configure multer for file uploads
const uploadDir = './tmp/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = generateFilename('upload', path.extname(file.originalname).slice(1));
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new ValidationError(
          `File type ${file.mimetype} not supported. Allowed: JPEG, PNG, GIF, WebP`
        )
      );
    }
  },
});

/**
 * Simulates video generation progress in demo mode
 */
function startDemoJob(jobId, prompt) {
  const job = jobs.get(jobId);
  if (!job) return;

  const totalSteps = 10;
  let step = 0;

  const interval = setInterval(() => {
    step++;
    const progress = Math.min(Math.round((step / totalSteps) * 100), 100);

    if (step >= totalSteps) {
      clearInterval(interval);
      const demoVideo = DEMO_VIDEOS[Math.floor(Math.random() * DEMO_VIDEOS.length)];
      jobs.set(jobId, {
        ...jobs.get(jobId),
        status: 'completed',
        progress: 100,
        videoUrl: demoVideo,
        completedAt: new Date().toISOString(),
      });
      console.log(`[DEMO] Job ${jobId} completed with video: ${demoVideo}`);
    } else {
      jobs.set(jobId, {
        ...jobs.get(jobId),
        status: 'processing',
        progress,
      });
    }
  }, 1500); // Update every 1.5 seconds, total ~15 seconds
}

/**
 * Starts a real Sora 2 job in the background
 */
async function startRealJob(jobId, prompt, options, isImage = false, imageSource = null) {
  try {
    let soraJobId;
    if (isImage && imageSource) {
      soraJobId = await videoService.generateFromImage(imageSource, prompt, options);
    } else {
      soraJobId = await videoService.generateFromText(prompt, options);
    }

    // Store the Sora job ID
    jobs.set(jobId, {
      ...jobs.get(jobId),
      soraJobId,
      status: 'processing',
      progress: 20,
    });

    // Start polling in background
    pollRealJob(jobId, soraJobId);
  } catch (error) {
    console.error(`[VideoRoute] Real job failed to start: ${error.message}`);
    jobs.set(jobId, {
      ...jobs.get(jobId),
      status: 'failed',
      error: error.message,
    });
  }
}

/**
 * Polls a real Sora 2 job for completion
 */
async function pollRealJob(jobId, soraJobId) {
  const maxAttempts = 120;
  let attempts = 0;

  const poll = async () => {
    try {
      console.log(`[VideoRoute] Polling Sora job ${soraJobId} (attempt ${attempts + 1}/${maxAttempts})`);
      const status = await videoService.checkStatus(soraJobId);
      const job = jobs.get(jobId);
      if (!job) return;

      console.log(`[VideoRoute] Sora status: "${status.status}" (raw: "${status.rawStatus}")`);

      if (status.status === 'succeeded') {
        try {
          let videoUrl;
          const rawData = status.rawData || {};

          // Log full response to debug
          console.log(`[VideoRoute] Full succeeded response:`, JSON.stringify(rawData, null, 2));

          // Method 1: Try to extract video URL directly from status response
          // Sora 2 may include the URL in various places
          const possibleUrls = [
            rawData?.output?.url,
            rawData?.result?.url,
            rawData?.video?.url,
            rawData?.data?.[0]?.url,
            rawData?.generations?.[0]?.url,
            rawData?.generations?.[0]?.content?.[0]?.url,
            rawData?.output?.video_url,
            rawData?.result?.video_url,
            rawData?.url,
            rawData?.video_url,
          ];

          for (const url of possibleUrls) {
            if (url && typeof url === 'string') {
              videoUrl = url;
              console.log(`[VideoRoute] Found video URL in response: ${videoUrl}`);
              break;
            }
          }

          // Method 2: Try downloading from various API endpoints
          if (!videoUrl) {
            const downloadPaths = [
              `/openai/v1/videos/${soraJobId}/content/generation`,
              `/openai/v1/videos/${soraJobId}/content`,
              `/openai/v1/videos/${soraJobId}/video`,
            ];

            const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
            const apiKey = process.env.AZURE_OPENAI_API_KEY;
            const axios = (await import('axios')).default;

            for (const downloadPath of downloadPaths) {
              try {
                console.log(`[VideoRoute] Trying download: GET ${endpoint}${downloadPath}`);
                const dlResponse = await axios.get(`${endpoint}${downloadPath}`, {
                  headers: { 'Api-key': apiKey },
                  responseType: 'arraybuffer',
                  timeout: 120000,
                });

                if (dlResponse.status === 200 && dlResponse.data.length > 0) {
                  const videoBuffer = Buffer.from(dlResponse.data);
                  const videoFilename = generateFilename('generated-video', 'mp4');

                  // Try blob storage
                  if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
                    try {
                      const uploadResult = await storageService.uploadVideo(videoBuffer, videoFilename);
                      videoUrl = uploadResult.url;
                    } catch (uploadErr) {
                      console.warn(`[VideoRoute] Blob upload failed: ${uploadErr.message}`);
                    }
                  }

                  // Fallback to local storage
                  if (!videoUrl) {
                    const localDir = './tmp/videos';
                    if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
                    fs.writeFileSync(`${localDir}/${videoFilename}`, videoBuffer);
                    videoUrl = `/api/video/file/${videoFilename}`;
                  }
                  console.log(`[VideoRoute] Downloaded via ${downloadPath}`);
                  break;
                }
              } catch (dlErr) {
                console.log(`[VideoRoute] Download path ${downloadPath} failed: ${dlErr.response?.status || dlErr.message}`);
              }
            }
          }

          if (videoUrl) {
            jobs.set(jobId, {
              ...job,
              status: 'completed',
              progress: 100,
              videoUrl,
              completedAt: new Date().toISOString(),
            });
            console.log(`[VideoRoute] Job ${jobId} completed: ${videoUrl}`);
          } else {
            console.error(`[VideoRoute] Job succeeded but no video URL found. Raw data:`, JSON.stringify(rawData));
            jobs.set(jobId, {
              ...job,
              status: 'failed',
              error: 'Video generated but could not retrieve the video URL. Check server logs.',
            });
          }
        } catch (downloadErr) {
          console.error(`[VideoRoute] Failed to process completed video: ${downloadErr.message}`);
          jobs.set(jobId, {
            ...job,
            status: 'failed',
            error: `Video processing failed: ${downloadErr.message}`,
          });
        }
        return;
      }

      if (status.status === 'failed') {
        jobs.set(jobId, {
          ...job,
          status: 'failed',
          error: status.error?.message || 'Video generation failed',
        });
        return;
      }

      // Still processing
      attempts++;
      const progress = Math.min(20 + Math.round((attempts / maxAttempts) * 75), 95);
      jobs.set(jobId, { ...job, progress });

      if (attempts < maxAttempts) {
        setTimeout(poll, 5000);
      } else {
        jobs.set(jobId, {
          ...job,
          status: 'failed',
          error: 'Video generation timed out',
        });
      }
    } catch (error) {
      console.error(`[VideoRoute] Poll error for job ${jobId}: ${error.message}`);
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(poll, 5000);
      } else {
        const job = jobs.get(jobId);
        if (job) {
          jobs.set(jobId, {
            ...job,
            status: 'failed',
            error: error.message,
          });
        }
      }
    }
  };

  poll();
}

/**
 * POST /api/video/generate-text
 * Generate a video from a text prompt
 * Returns immediately with a jobId for async polling
 */
router.post(
  '/generate-text',
  asyncHandler(async (req, res) => {
    const { prompt, duration = 5, resolution = 1080, aspectRatio = '16:9', narrationText } = req.body;

    // Validate prompt
    const promptValidation = validatePrompt(prompt);
    if (!promptValidation.isValid) {
      throw new ValidationError(promptValidation.error);
    }

    // Calculate size based on aspect ratio and resolution
    const baseRes = resolution >= 1080 ? 1080 : 720;
    let size;
    switch (aspectRatio) {
      case '9:16':
        size = baseRes >= 1080 ? '1080x1920' : '720x1280';
        break;
      case '1:1':
        size = baseRes >= 1080 ? '1080x1080' : '720x720';
        break;
      case '4:5':
        size = baseRes >= 1080 ? '1080x1350' : '720x900';
        break;
      case '16:9':
      default:
        size = baseRes >= 1080 ? '1920x1080' : '1280x720';
        break;
    }

    const jobId = uuidv4();

    // Create job entry
    jobs.set(jobId, {
      jobId,
      prompt,
      status: 'pending',
      progress: 5,
      createdAt: new Date().toISOString(),
      duration,
      resolution: size,
      aspectRatio,
      narrationText: narrationText || null,
      mode: DEMO_MODE ? 'demo' : 'live',
    });

    console.log(`[VideoRoute] ${DEMO_MODE ? '[DEMO]' : '[LIVE]'} Created text-to-video job: ${jobId}`);

    if (DEMO_MODE) {
      startDemoJob(jobId, prompt);
    } else {
      startRealJob(jobId, prompt, {
        size,
        duration: Number(duration),
      });
    }

    res.status(200).json({ jobId });
  })
);

/**
 * POST /api/video/generate-image
 * Generate a video from an image and text prompt
 * Returns immediately with a jobId for async polling
 */
router.post(
  '/generate-image',
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('Image file is required');
    }

    const { duration = 5, resolution = '1080p' } = req.body;
    // Prompt is optional for image-to-video; use a default if not provided
    const prompt = req.body.prompt && req.body.prompt.trim()
      ? req.body.prompt.trim()
      : 'Generate a creative video from this image';

    const promptValidation = validatePrompt(prompt);
    if (!promptValidation.isValid) {
      throw new ValidationError(promptValidation.error);
    }

    const size = resolution === '1080p' ? '1920x1080' : '1280x720';
    const jobId = uuidv4();

    // Create job entry
    jobs.set(jobId, {
      jobId,
      prompt,
      status: 'pending',
      progress: 5,
      createdAt: new Date().toISOString(),
      duration,
      resolution: size,
      sourceImage: req.file.originalname,
      mode: DEMO_MODE ? 'demo' : 'live',
    });

    console.log(`[VideoRoute] ${DEMO_MODE ? '[DEMO]' : '[LIVE]'} Created image-to-video job: ${jobId}`);

    if (DEMO_MODE) {
      startDemoJob(jobId, prompt);
      // Clean up uploaded file
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } else {
      try {
        const imageBuffer = fs.readFileSync(req.file.path);
        startRealJob(jobId, prompt, {
          size,
          duration: Number(duration),
        }, true, imageBuffer);
      } finally {
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      }
    }

    res.status(200).json({ jobId });
  })
);

/**
 * GET /api/video/status/:jobId
 * Check the status of a video generation job
 * Returns: { status, progress, videoUrl?, error? }
 */
router.get(
  '/status/:jobId',
  asyncHandler(async (req, res) => {
    const { jobId } = req.params;

    if (!jobId || jobId.trim() === '') {
      throw new ValidationError('Job ID is required');
    }

    const job = jobs.get(jobId);

    if (!job) {
      throw new NotFoundError(`Job ${jobId} not found`);
    }

    res.status(200).json({
      status: job.status,
      progress: job.progress || 0,
      videoUrl: job.videoUrl || null,
      error: job.error || null,
    });
  })
);

/**
 * GET /api/video/download/:jobId
 * Download a generated video
 */
router.get(
  '/download/:jobId',
  asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    const job = jobs.get(jobId);

    if (!job) {
      throw new NotFoundError(`Job ${jobId} not found`);
    }

    if (job.status !== 'completed' || !job.videoUrl) {
      throw new AppError(
        `Video generation job has not completed. Status: ${job.status}`,
        400,
        'JOB_NOT_COMPLETED'
      );
    }

    // Redirect to the video URL
    res.redirect(job.videoUrl);
  })
);

/**
 * GET /api/video/list
 * List all generated videos
 */
router.get(
  '/list',
  asyncHandler(async (req, res) => {
    const completedJobs = [];

    for (const [id, job] of jobs.entries()) {
      if (job.status === 'completed' && job.videoUrl) {
        completedJobs.push({
          id,
          prompt: job.prompt,
          videoUrl: job.videoUrl,
          timestamp: job.completedAt || job.createdAt,
          duration: job.duration,
          resolution: job.resolution,
        });
      }
    }

    // Sort by most recent first
    completedJobs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      data: {
        count: completedJobs.length,
        videos: completedJobs,
      },
    });
  })
);

/**
 * GET /api/video/file/:filename
 * Serve locally-stored video files (fallback when blob storage isn't configured)
 */
router.get(
  '/file/:filename',
  asyncHandler(async (req, res) => {
    const { filename } = req.params;
    const filePath = path.join('./tmp/videos', filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundError(`Video file not found: ${filename}`);
    }

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  })
);

/**
 * GET /api/video/mode
 * Returns the current mode (demo or live)
 */
router.get(
  '/mode',
  asyncHandler(async (req, res) => {
    res.status(200).json({
      mode: DEMO_MODE ? 'demo' : 'live',
      message: DEMO_MODE
        ? 'Running in demo mode. Videos are simulated samples. Apply for Sora 2 access to enable real AI video generation.'
        : 'Running in live mode with Azure OpenAI Sora 2.',
    });
  })
);

export default router;
