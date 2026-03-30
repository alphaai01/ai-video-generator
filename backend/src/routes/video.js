/**
 * Video Generation Routes
 * Handles all video generation related API endpoints
 * Supports both real Sora 2 API and demo mode
 *
 * Sora 2 constraints:
 *   Sizes: "1280x720" (landscape), "720x1280" (portrait)
 *   Durations: 4, 8, 12 seconds only
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
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
          const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
          if (allowedMimes.includes(file.mimetype)) {
                  cb(null, true);
          } else {
                  cb(new ValidationError(`File type ${file.mimetype} not supported. Allowed: JPEG, PNG, GIF, WebP`));
          }
    },
});

/**
 * Maps aspect ratio + resolution to Sora 2 supported size strings.
 * Sora 2 only supports: "1280x720" (landscape) and "720x1280" (portrait).
 * All other aspect ratios are mapped to the closest supported size.
 */
function getSoraSize(aspectRatio) {
    switch (aspectRatio) {
      case '9:16':
              return '720x1280';
      case '16:9':
      default:
              return '1280x720';
    }
}

/**
 * Maps the UI duration to nearest Sora 2 supported duration.
 * Sora 2 only supports: 4, 8, 12 seconds.
 */
function getSoraDuration(requestedDuration) {
    const d = Number(requestedDuration);
    const supported = [4, 8, 12];
    // Find the closest supported duration
  let closest = supported[0];
    let minDiff = Math.abs(d - closest);
    for (const s of supported) {
          const diff = Math.abs(d - s);
          if (diff < minDiff) {
                  minDiff = diff;
                  closest = s;
          }
    }
    return closest;
}

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
  }, 1500);
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

      jobs.set(jobId, {
              ...jobs.get(jobId),
              soraJobId,
              status: 'processing',
              progress: 20,
      });

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

                      console.log(`[VideoRoute] Full succeeded response:`, JSON.stringify(rawData, null, 2));

                      // Try to extract video URL from various response locations
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

                      // Try downloading from various API endpoints
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

                                                                      if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
                                                                                            try {
                                                                                                                    const uploadResult = await storageService.uploadVideo(videoBuffer, videoFilename);
                                                                                                                    videoUrl = uploadResult.url;
                                                                                              } catch (uploadErr) {
                                                                                                                    console.warn(`[VideoRoute] Blob upload failed: ${uploadErr.message}`);
                                                                                              }
                                                                      }

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
                                const job2 = jobs.get(jobId);
                                if (job2) {
                                              jobs.set(jobId, {
                                                              ...job2,
                                                              status: 'failed',
                                                              error: `Video processing failed: ${downloadErr.message}`,
                                              });
                                }
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
                    jobs.set(jobId, { ...job, status: 'failed', error: 'Video generation timed out' });
          }
        } catch (error) {
                console.error(`[VideoRoute] Poll error for job ${jobId}: ${error.message}`);
                attempts++;
                if (attempts < maxAttempts) {
                          setTimeout(poll, 5000);
                } else {
                          const job = jobs.get(jobId);
                          if (job) {
                                      jobs.set(jobId, { ...job, status: 'failed', error: error.message });
                          }
                }
        }
  };

  poll();
}

/**
 * POST /api/video/generate-text
 * Generate a video from a text prompt
 */
router.post(
    '/generate-text',
    asyncHandler(async (req, res) => {
          const { prompt, duration = 8, resolution = 1080, aspectRatio = '16:9', narrationText } = req.body;

                     const promptValidation = validatePrompt(prompt);
          if (!promptValidation.isValid) {
                  throw new ValidationError(promptValidation.error);
          }

                     // Map to Sora 2 supported size and duration
                     const size = getSoraSize(aspectRatio);
          const soraDuration = getSoraDuration(duration);

                     console.log(`[VideoRoute] Text generation: aspectRatio=${aspectRatio}, size=${size}, duration=${duration}->${soraDuration}`);

                     const jobId = uuidv4();

                     jobs.set(jobId, {
                             jobId,
                             prompt,
                             status: 'pending',
                             progress: 5,
                             createdAt: new Date().toISOString(),
                             duration: soraDuration,
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
                                       duration: soraDuration,
                             });
                     }

                     res.status(200).json({ jobId });
    })
  );

/**
 * POST /api/video/generate-image
 * Generate a video from an image and optional text prompt
 */
router.post(
    '/generate-image',
    upload.single('image'),
    asyncHandler(async (req, res) => {
          if (!req.file) {
                  throw new ValidationError('Image file is required');
          }

                     const { duration = 8, resolution = '1080p', aspectRatio = '16:9' } = req.body;

                     // Prompt is optional for image-to-video
                     const prompt = req.body.prompt && req.body.prompt.trim()
            ? req.body.prompt.trim()
                             : 'Generate a creative video from this image';

                     const promptValidation = validatePrompt(prompt);
          if (!promptValidation.isValid) {
                  throw new ValidationError(promptValidation.error);
          }

                     // Map to Sora 2 supported size and duration
                     const size = getSoraSize(aspectRatio);
          const soraDuration = getSoraDuration(duration);

                     console.log(`[VideoRoute] Image generation: aspectRatio=${aspectRatio}, size=${size}, duration=${duration}->${soraDuration}`);

                     const jobId = uuidv4();

                     jobs.set(jobId, {
                             jobId,
                             prompt,
                             status: 'pending',
                             progress: 5,
                             createdAt: new Date().toISOString(),
                             duration: soraDuration,
                             resolution: size,
                             aspectRatio,
                             sourceImage: req.file.originalname,
                             mode: DEMO_MODE ? 'demo' : 'live',
                     });

                     console.log(`[VideoRoute] ${DEMO_MODE ? '[DEMO]' : '[LIVE]'} Created image-to-video job: ${jobId}`);

                     if (DEMO_MODE) {
                             startDemoJob(jobId, prompt);
                             if (req.file && fs.existsSync(req.file.path)) {
                                       fs.unlinkSync(req.file.path);
                             }
                     } else {
                             try {
                                       const imageBuffer = fs.readFileSync(req.file.path);
                                       startRealJob(jobId, prompt, {
                                                   size,
                                                   duration: soraDuration,
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
                             throw new AppError(`Video generation job has not completed. Status: ${job.status}`, 400, 'JOB_NOT_COMPLETED');
                     }

                     res.redirect(job.videoUrl);
    })
  );

/**
 * GET /api/video/list
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
 */
router.get(
    '/mode',
    asyncHandler(async (req, res) => {
          res.status(200).json({
                  mode: DEMO_MODE ? 'demo' : 'live',
                  message: DEMO_MODE
                    ? 'Running in demo mode. Videos are simulated samples.'
                            : 'Running in live mode with Azure OpenAI Sora 2.',
          });
    })
  );

export default router;
