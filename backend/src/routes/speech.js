/**
 * Speech Services Routes
 * Handles all speech-to-text and text-to-speech API endpoints
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  AppError,
  ValidationError,
  asyncHandler,
} from '../middleware/errorHandler.js';
import speechService from '../services/speechService.js';
import {
  validateVoice,
  validateAudioFile,
  generateFilename,
  getLanguageFromVoice,
} from '../utils/helpers.js';

const router = express.Router();

// Configure multer for audio file uploads
const uploadDir = './tmp/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = generateFilename('audio', path.extname(file.originalname).slice(1));
    cb(null, uniqueName);
  },
});

const uploadAudio = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'audio/wav',
      'audio/mpeg',
      'audio/mp3',
      'audio/flac',
      'audio/aac',
      'audio/m4a',
      'audio/ogg',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new ValidationError(
          `File type ${file.mimetype} not supported. Allowed: WAV, MP3, FLAC, AAC, OGG`
        )
      );
    }
  },
});

/**
 * POST /api/speech/to-text
 * Convert audio to text using speech recognition
 * Multipart form: audio (file), language? (string, default: en-US)
 */
router.post(
  '/to-text',
  uploadAudio.single('audio'),
  asyncHandler(async (req, res) => {
    // Validate file upload
    if (!req.file) {
      throw new ValidationError('Audio file is required');
    }

    const { language = 'en-US' } = req.body;

    // Validate audio file
    const audioValidation = validateAudioFile(req.file.originalname);
    if (!audioValidation.isValid) {
      fs.unlinkSync(req.file.path);
      throw new ValidationError(audioValidation.error);
    }

    console.log('[SpeechRoute] Converting audio to text:', {
      audioFile: req.file.originalname,
      size: req.file.size,
      language,
    });

    try {
      // Read audio file from disk
      const audioBuffer = fs.readFileSync(req.file.path);

      // Convert speech to text
      const recognizedText = await speechService.speechToText(
        audioBuffer,
        language
      );

      console.log('[SpeechRoute] Audio converted to text successfully:', {
        textLength: recognizedText.length,
      });

      res.status(200).json({
        success: true,
        data: {
          text: recognizedText,
          language,
          sourceFile: req.file.originalname,
          audioSize: req.file.size,
        },
      });
    } catch (error) {
      console.error('[SpeechRoute] Speech-to-text error:', error.message);
      throw new AppError(
        `Failed to convert speech to text: ${error.message}`,
        500,
        'SPEECH_TO_TEXT_ERROR'
      );
    } finally {
      // Clean up uploaded file
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }
  })
);

/**
 * POST /api/speech/to-audio
 * Convert text to speech (audio) — raw buffer version
 * Body: { text, voice? }
 * Returns: WAV audio file buffer
 */
router.post(
  '/to-audio',
  asyncHandler(async (req, res) => {
    const { text, voice = 'en-US-JennyNeural' } = req.body;

    // Validate text
    if (!text || typeof text !== 'string' || text.trim() === '') {
      throw new ValidationError('Text is required and must be non-empty');
    }

    if (text.length > 5000) {
      throw new ValidationError('Text exceeds maximum length of 5000 characters');
    }

    // Validate voice
    const voiceValidation = validateVoice(voice);
    if (!voiceValidation.isValid) {
      throw new ValidationError(voiceValidation.error);
    }

    if (!speechService.isVoiceAvailable(voice)) {
      throw new ValidationError(
        `Voice "${voice}" is not available. Use /available-voices to see supported voices.`
      );
    }

    console.log('[SpeechRoute] Converting text to speech:', {
      textLength: text.length,
      voice,
    });

    try {
      // Convert text to speech
      const audioBuffer = await speechService.textToSpeech(text, voice);

      console.log('[SpeechRoute] Text converted to speech successfully:', {
        audioSize: audioBuffer.length,
      });

      // Send audio file
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="speech_${Date.now()}.wav"`
      );
      res.setHeader('Content-Length', audioBuffer.length);

      res.send(audioBuffer);
    } catch (error) {
      console.error('[SpeechRoute] Text-to-speech error:', error.message);
      throw new AppError(
        `Failed to convert text to speech: ${error.message}`,
        500,
        'TEXT_TO_SPEECH_ERROR'
      );
    }
  })
);

/**
 * POST /api/speech/generate-audio
 * Advanced audio generation with style, speed, pitch controls
 * Body: { text, voice?, style?, speed?, pitch?, outputFormat? }
 * Returns: JSON with audio as base64 data URL
 */
router.post(
  '/generate-audio',
  asyncHandler(async (req, res) => {
    const {
      text,
      voice = 'en-US-JennyNeural',
      style,
      speed,
      pitch,
      outputFormat = 'mp3',
    } = req.body;

    // Validate text
    if (!text || typeof text !== 'string' || text.trim() === '') {
      throw new ValidationError('Text is required and must be non-empty');
    }

    if (text.length > 5000) {
      throw new ValidationError('Text exceeds maximum length of 5000 characters');
    }

    if (!speechService.isVoiceAvailable(voice)) {
      throw new ValidationError(
        `Voice "${voice}" is not available. Use /available-voices to see supported voices.`
      );
    }

    console.log('[SpeechRoute] Generating audio:', {
      textLength: text.length,
      voice,
      style: style || 'default',
      speed: speed || 'default',
      pitch: pitch || 'default',
      outputFormat,
    });

    try {
      const audioBuffer = await speechService.textToSpeech(text, voice, {
        style: style && style !== 'default' ? style : undefined,
        speed: speed || undefined,
        pitch: pitch || undefined,
        outputFormat,
      });

      // Get voice metadata
      const voiceMeta = speechService.getVoiceById(voice);

      // Convert to base64 data URL
      const mimeType = outputFormat === 'mp3' ? 'audio/mpeg'
        : outputFormat === 'ogg' ? 'audio/ogg'
        : 'audio/wav';
      const base64Audio = audioBuffer.toString('base64');
      const audioDataUrl = `data:${mimeType};base64,${base64Audio}`;

      console.log('[SpeechRoute] Audio generated successfully:', {
        audioSize: audioBuffer.length,
        format: outputFormat,
      });

      res.status(200).json({
        success: true,
        data: {
          audioUrl: audioDataUrl,
          format: outputFormat,
          size: audioBuffer.length,
          voice: voiceMeta || { id: voice },
          textLength: text.length,
          estimatedDuration: Math.ceil(text.length / 150),
        },
      });
    } catch (error) {
      console.error('[SpeechRoute] Audio generation error:', error.message);
      throw new AppError(
        `Failed to generate audio: ${error.message}`,
        500,
        'AUDIO_GENERATION_ERROR'
      );
    }
  })
);

/**
 * GET /api/speech/styles
 * Get available speaking styles
 */
router.get(
  '/styles',
  asyncHandler(async (req, res) => {
    const styles = speechService.getAvailableStyles();
    res.status(200).json({
      success: true,
      data: { styles },
    });
  })
);

/**
 * GET /api/speech/available-voices
 * Get list of available voices for text-to-speech
 * Optional query: language (e.g., 'en-US')
 */
router.get(
  '/available-voices',
  asyncHandler(async (req, res) => {
    const { language } = req.query;

    console.log('[SpeechRoute] Fetching available voices:', { language });

    try {
      let voices;

      if (language) {
        voices = speechService.getVoicesByLanguage(language);
        if (voices.length === 0) {
          throw new ValidationError(
            `No voices available for language: ${language}`
          );
        }
      } else {
        voices = speechService.getAvailableVoices();
      }

      res.status(200).json({
        success: true,
        data: {
          voices,
          language: language || 'all',
          count: Array.isArray(voices)
            ? voices.length
            : Object.keys(voices).length,
        },
      });
    } catch (error) {
      console.error('[SpeechRoute] Fetch voices error:', error.message);
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new AppError(
        `Failed to fetch voices: ${error.message}`,
        500,
        'FETCH_VOICES_ERROR'
      );
    }
  })
);

/**
 * POST /api/speech/validate-text
 * Validates text without synthesizing speech
 * Body: { text }
 */
router.post(
  '/validate-text',
  asyncHandler(async (req, res) => {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'Text is required and must be non-empty',
      });
    }

    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'Text exceeds maximum length of 5000 characters',
      });
    }

    res.status(200).json({
      success: true,
      valid: true,
      text,
      length: text.length,
      estimatedDuration: `${Math.ceil(text.length / 150)} seconds`,
    });
  })
);

/**
 * POST /api/speech/validate-voice
 * Validates a voice identifier
 * Body: { voice }
 */
router.post(
  '/validate-voice',
  asyncHandler(async (req, res) => {
    const { voice } = req.body;

    const validation = validateVoice(voice);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: validation.error,
      });
    }

    const isAvailable = speechService.isVoiceAvailable(voice);
    const language = getLanguageFromVoice(voice);

    res.status(200).json({
      success: true,
      valid: true,
      voice,
      available: isAvailable,
      language,
    });
  })
);

/**
 * GET /api/speech/health
 * Health check for speech service
 */
router.get(
  '/health',
  asyncHandler(async (req, res) => {
    try {
      // Try to get a simple list of voices as a connectivity check
      const voices = speechService.getAvailableVoices();

      res.status(200).json({
        success: true,
        status: 'healthy',
        voicesAvailable: Object.keys(voices).length,
      });
    } catch (error) {
      console.error('[SpeechRoute] Health check failed:', error.message);
      throw new AppError(
        'Speech service health check failed',
        503,
        'SERVICE_UNAVAILABLE'
      );
    }
  })
);

export default router;
