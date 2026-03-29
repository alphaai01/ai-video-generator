/**
 * Helper Utilities Module
 * Common utility functions for the application
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique filename with optional extension
 * @param {string} prefix - Prefix for the filename
 * @param {string} extension - File extension (without dot)
 * @returns {string} Generated filename
 */
export const generateFilename = (prefix = 'file', extension = 'bin') => {
  const timestamp = Date.now();
  const uuid = uuidv4().split('-')[0];
  return `${prefix}_${timestamp}_${uuid}.${extension}`;
};

/**
 * Validates video generation prompt
 * @param {string} prompt - The prompt to validate
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export const validatePrompt = (prompt) => {
  if (!prompt || typeof prompt !== 'string') {
    return { isValid: false, error: 'Prompt must be a non-empty string' };
  }

  const trimmedPrompt = prompt.trim();

  if (trimmedPrompt.length === 0) {
    return { isValid: false, error: 'Prompt cannot be empty or whitespace' };
  }

  if (trimmedPrompt.length > 4000) {
    return {
      isValid: false,
      error: 'Prompt exceeds maximum length of 4000 characters',
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validates video duration
 * @param {number|string} duration - Duration in seconds
 * @returns {Object} { isValid: boolean, value: string, error: string|null }
 */
export const validateDuration = (duration) => {
  const durationNum = Number(duration);

  if (isNaN(durationNum)) {
    return {
      isValid: false,
      value: null,
      error: 'Duration must be a number',
    };
  }

  if (durationNum < 1 || durationNum > 60) {
    return {
      isValid: false,
      value: null,
      error: 'Duration must be between 1 and 60 seconds',
    };
  }

  return { isValid: true, value: String(durationNum), error: null };
};

/**
 * Validates video resolution
 * @param {string} resolution - Resolution in format "WIDTHxHEIGHT"
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export const validateResolution = (resolution) => {
  const supportedResolutions = ['1920x1080', '1280x720', '864x480', '512x512'];

  if (!resolution || typeof resolution !== 'string') {
    return { isValid: false, error: 'Resolution must be a non-empty string' };
  }

  if (!supportedResolutions.includes(resolution)) {
    return {
      isValid: false,
      error: `Resolution must be one of: ${supportedResolutions.join(', ')}`,
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validates voice identifier for text-to-speech
 * @param {string} voice - Voice identifier (e.g., 'en-US-JennyNeural')
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export const validateVoice = (voice) => {
  if (!voice || typeof voice !== 'string') {
    return { isValid: false, error: 'Voice must be a non-empty string' };
  }

  // Basic validation: voice should follow pattern like 'en-US-JennyNeural'
  const voiceRegex = /^[a-z]{2}-[A-Z]{2}-[A-Za-z]+$/;

  if (!voiceRegex.test(voice)) {
    return {
      isValid: false,
      error: 'Voice must follow pattern: en-US-JennyNeural',
    };
  }

  return { isValid: true, error: null };
};

/**
 * Sleeps for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Formats bytes to human-readable size
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted size string
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Extracts language code from voice identifier
 * @param {string} voice - Voice identifier (e.g., 'en-US-JennyNeural')
 * @returns {string} Language code (e.g., 'en-US')
 */
export const getLanguageFromVoice = (voice) => {
  const parts = voice.split('-');
  return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : 'en-US';
};

/**
 * Retries an async function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxAttempts - Maximum number of attempts
 * @param {number} initialDelay - Initial delay in milliseconds
 * @returns {Promise<any>} Result of the function
 */
export const retryWithBackoff = async (
  fn,
  maxAttempts = 3,
  initialDelay = 1000
) => {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }

  throw lastError;
};

/**
 * Checks if a string is a valid URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Extracts file extension from filename
 * @param {string} filename - Filename
 * @returns {string} File extension without dot
 */
export const getFileExtension = (filename) => {
  if (!filename || typeof filename !== 'string') return '';
  return filename.split('.').pop().toLowerCase();
};

/**
 * Validates image file type
 * @param {string} filename - Image filename
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export const validateImageFile = (filename) => {
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const extension = getFileExtension(filename);

  if (!allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      error: `Image must be one of: ${allowedExtensions.join(', ')}`,
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validates audio file type
 * @param {string} filename - Audio filename
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export const validateAudioFile = (filename) => {
  const allowedExtensions = ['wav', 'mp3', 'flac', 'm4a', 'ogg'];
  const extension = getFileExtension(filename);

  if (!allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      error: `Audio must be one of: ${allowedExtensions.join(', ')}`,
    };
  }

  return { isValid: true, error: null };
};
