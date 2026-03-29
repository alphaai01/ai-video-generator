/**
 * Azure Speech Services Integration
 * Handles speech-to-text and text-to-speech operations
 */

import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk';
import azureConfig from '../../config/azure.js';
import { getLanguageFromVoice } from '../utils/helpers.js';

class SpeechService {
  /**
   * Initialize speech service with Azure Speech configuration
   */
  constructor() {
    this.speechConfig = speechsdk.SpeechConfig.fromSubscription(
      azureConfig.speech.apiKey,
      azureConfig.speech.region
    );
    this.speechConfig.speechRecognitionLanguage = 'en-US';
  }

  /**
   * Converts audio buffer to text using speech-to-text
   * Supports multiple audio formats and languages
   * @param {Buffer} audioBuffer - Audio file buffer (WAV, MP3, etc.)
   * @param {string} language - Language code (default: en-US)
   * @returns {Promise<string>} Transcribed text
   * @throws {Error} If speech recognition fails
   */
  async speechToText(audioBuffer, language = 'en-US') {
    return new Promise((resolve, reject) => {
      try {
        console.log(
          `[SpeechService] Starting speech-to-text conversion (${language})`
        );

        // Create audio configuration from buffer
        const audioConfig = speechsdk.AudioConfig.fromWavFileInput(
          this.bufferToStream(audioBuffer)
        );

        // Set language
        const recognitionConfig = speechsdk.SpeechConfig.fromSubscription(
          azureConfig.speech.apiKey,
          azureConfig.speech.region
        );
        recognitionConfig.speechRecognitionLanguage = language;

        // Create speech recognizer
        const recognizer = new speechsdk.SpeechRecognizer(
          recognitionConfig,
          audioConfig
        );

        // Collect all recognized text
        let recognizedText = '';
        const offlineResults = [];

        // Handle final result
        recognizer.recognizeOnceAsync(
          (result) => {
            if (result.reason === speechsdk.ResultReason.RecognizedSpeech) {
              recognizedText = result.text;
              console.log(
                `[SpeechService] Speech recognized: "${recognizedText.substring(0, 100)}..."`
              );
              resolve(recognizedText);
            } else if (result.reason === speechsdk.ResultReason.NoMatch) {
              const noMatchDetail = speechsdk.NoMatchDetails.fromResult(result);
              console.error(
                '[SpeechService] Speech not recognized:',
                noMatchDetail.reason
              );
              reject(
                new Error(
                  `No speech could be recognized. Reason: ${noMatchDetail.reason}`
                )
              );
            } else if (result.reason === speechsdk.ResultReason.Canceled) {
              const canceledDetails = speechsdk.CancellationDetails.fromResult(
                result
              );
              console.error('[SpeechService] Speech recognition canceled:', canceledDetails.reason);
              reject(
                new Error(
                  `Speech recognition canceled. Reason: ${canceledDetails.reason}`
                )
              );
            }

            recognizer.close();
          },
          (error) => {
            console.error('[SpeechService] Speech recognition error:', error);
            recognizer.close();
            reject(
              new Error(`Speech recognition error: ${error.message || error}`)
            );
          }
        );
      } catch (error) {
        console.error('[SpeechService] Speech-to-text setup failed:', error.message);
        reject(new Error(`Failed to set up speech recognition: ${error.message}`));
      }
    });
  }

  /**
   * Converts text to speech and returns audio buffer
   * @param {string} text - Text to convert to speech
   * @param {string} voice - Voice identifier (e.g., 'en-US-JennyNeural')
   * @param {Object} options - Additional synthesis options
   * @param {string} options.speed - Speech rate ('x-slow','slow','medium','fast','x-fast' or percentage like '+20%')
   * @param {string} options.pitch - Pitch ('x-low','low','medium','high','x-high' or percentage like '+10%')
   * @param {string} options.style - Speaking style (e.g., 'cheerful','sad','angry','excited','friendly','hopeful','shouting','whispering','narration-professional')
   * @param {string} options.outputFormat - Audio format ('wav', 'mp3', 'ogg')
   * @returns {Promise<Buffer>} Audio buffer
   * @throws {Error} If text-to-speech fails
   */
  async textToSpeech(text, voice = 'en-US-JennyNeural', options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const { speed, pitch, style, outputFormat = 'wav' } = options;

        console.log(
          `[SpeechService] Starting text-to-speech conversion with voice: ${voice}, style: ${style || 'default'}, speed: ${speed || 'default'}`
        );

        // Validate text length
        if (!text || text.length === 0) {
          throw new Error('Text cannot be empty');
        }

        if (text.length > 5000) {
          throw new Error('Text exceeds maximum length of 5000 characters');
        }

        // Create speech configuration
        const speechConfig = speechsdk.SpeechConfig.fromSubscription(
          azureConfig.speech.apiKey,
          azureConfig.speech.region
        );

        // Set output format
        if (outputFormat === 'mp3') {
          speechConfig.speechSynthesisOutputFormat =
            speechsdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
        } else if (outputFormat === 'ogg') {
          speechConfig.speechSynthesisOutputFormat =
            speechsdk.SpeechSynthesisOutputFormat.Ogg16Khz16BitMonoOpus;
        } else {
          speechConfig.speechSynthesisOutputFormat =
            speechsdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm;
        }

        // Set voice (used if not using SSML)
        speechConfig.speechSynthesisVoiceName = voice;

        // Create synthesizer without audio output (we capture the buffer directly)
        const synthesizer = new speechsdk.SpeechSynthesizer(speechConfig, null);

        // Build SSML if style/speed/pitch options are provided
        const useSSML = style || speed || pitch;
        let synthesizeMethod;

        if (useSSML) {
          const ssml = this.buildSSML(text, voice, { speed, pitch, style });
          console.log(`[SpeechService] Using SSML synthesis`);
          synthesizeMethod = (cb, errCb) => synthesizer.speakSsmlAsync(ssml, cb, errCb);
        } else {
          synthesizeMethod = (cb, errCb) => synthesizer.speakTextAsync(text, cb, errCb);
        }

        // Synthesize speech
        synthesizeMethod(
          (result) => {
            if (result.reason === speechsdk.ResultReason.SynthesizingAudioCompleted) {
              console.log(
                `[SpeechService] Text-to-speech completed: ${result.audioData.byteLength} bytes`
              );
              resolve(Buffer.from(result.audioData));
            } else if (result.reason === speechsdk.ResultReason.Canceled) {
              const canceledDetails = speechsdk.CancellationDetails.fromResult(result);
              console.error('[SpeechService] Synthesis canceled:', canceledDetails.reason, canceledDetails.errorDetails);
              reject(
                new Error(
                  `Text-to-speech canceled: ${canceledDetails.errorDetails || canceledDetails.reason}`
                )
              );
            }

            synthesizer.close();
          },
          (error) => {
            console.error('[SpeechService] Text-to-speech error:', error);
            synthesizer.close();
            reject(
              new Error(`Failed to synthesize speech: ${error.message || error}`)
            );
          }
        );
      } catch (error) {
        console.error('[SpeechService] Text-to-speech setup failed:', error.message);
        reject(new Error(`Failed to set up text-to-speech: ${error.message}`));
      }
    });
  }

  /**
   * Builds SSML markup for advanced speech synthesis control
   * @param {string} text - Text to speak
   * @param {string} voice - Voice name
   * @param {Object} options - SSML options (speed, pitch, style)
   * @returns {string} SSML string
   * @private
   */
  buildSSML(text, voice, options = {}) {
    const { speed, pitch, style } = options;
    const lang = voice.substring(0, 5); // e.g., 'en-US'

    // Escape XML special characters
    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    let innerContent = escapedText;

    // Wrap in prosody if speed or pitch specified
    if (speed || pitch) {
      const prosodyAttrs = [];
      if (speed) prosodyAttrs.push(`rate="${speed}"`);
      if (pitch) prosodyAttrs.push(`pitch="${pitch}"`);
      innerContent = `<prosody ${prosodyAttrs.join(' ')}>${innerContent}</prosody>`;
    }

    // Wrap in style if specified
    if (style) {
      innerContent = `<mstts:express-as style="${style}">${innerContent}</mstts:express-as>`;
    }

    return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${lang}"><voice name="${voice}">${innerContent}</voice></speak>`;
  }

  /**
   * Gets list of available voices with metadata for text-to-speech
   * Returns supported voices by language with gender and style info
   * @returns {Object} Voices organized by language with metadata
   */
  getAvailableVoices() {
    return {
      'en-US': [
        { id: 'en-US-AvaMultilingualNeural', name: 'Ava (Multilingual)', gender: 'Female', styles: ['default'] },
        { id: 'en-US-AriaNeural', name: 'Aria', gender: 'Female', styles: ['chat','cheerful','angry','sad','excited','friendly','hopeful','narration-professional','newscast-casual','newscast-formal','customerservice','empathetic'] },
        { id: 'en-US-JennyNeural', name: 'Jenny', gender: 'Female', styles: ['chat','cheerful','sad','angry','excited','friendly','hopeful','shouting','whispering','narration-professional'] },
        { id: 'en-US-EmmaNeural', name: 'Emma', gender: 'Female', styles: ['default'] },
        { id: 'en-US-SaraNeural', name: 'Sara', gender: 'Female', styles: ['chat','cheerful','angry','sad','whispering'] },
        { id: 'en-US-AmberNeural', name: 'Amber', gender: 'Female', styles: ['default'] },
        { id: 'en-US-AshleyNeural', name: 'Ashley', gender: 'Female', styles: ['default'] },
        { id: 'en-US-CoraNeural', name: 'Cora', gender: 'Female', styles: ['default'] },
        { id: 'en-US-ElizabethNeural', name: 'Elizabeth', gender: 'Female', styles: ['default'] },
        { id: 'en-US-JessicaNeural', name: 'Jessica', gender: 'Female', styles: ['default'] },
        { id: 'en-US-MonicaNeural', name: 'Monica', gender: 'Female', styles: ['default'] },
        { id: 'en-US-NancyNeural', name: 'Nancy', gender: 'Female', styles: ['default'] },
        { id: 'en-US-GuyNeural', name: 'Guy', gender: 'Male', styles: ['newscast','angry','cheerful','sad','excited','friendly','hopeful'] },
        { id: 'en-US-AndrewNeural', name: 'Andrew', gender: 'Male', styles: ['default'] },
        { id: 'en-US-BrianNeural', name: 'Brian', gender: 'Male', styles: ['default','narration-professional'] },
        { id: 'en-US-ChristopherNeural', name: 'Christopher', gender: 'Male', styles: ['default'] },
        { id: 'en-US-DavidNeural', name: 'David', gender: 'Male', styles: ['default'] },
        { id: 'en-US-EricNeural', name: 'Eric', gender: 'Male', styles: ['default'] },
        { id: 'en-US-JasonNeural', name: 'Jason', gender: 'Male', styles: ['default','angry','cheerful','sad','excited','friendly','hopeful','whispering'] },
        { id: 'en-US-RyanNeural', name: 'Ryan', gender: 'Male', styles: ['default','angry','cheerful','sad','excited','friendly','hopeful'] },
        { id: 'en-US-TonyNeural', name: 'Tony', gender: 'Male', styles: ['default'] },
      ],
      'en-GB': [
        { id: 'en-GB-SoniaNeural', name: 'Sonia', gender: 'Female', styles: ['cheerful','sad'] },
        { id: 'en-GB-LibbyNeural', name: 'Libby', gender: 'Female', styles: ['default'] },
        { id: 'en-GB-MaisieNeural', name: 'Maisie', gender: 'Female', styles: ['default'] },
        { id: 'en-GB-RosaNeural', name: 'Rosa', gender: 'Female', styles: ['default'] },
        { id: 'en-GB-ThomasNeural', name: 'Thomas', gender: 'Male', styles: ['default'] },
      ],
      'en-AU': [
        { id: 'en-AU-NatashaNeural', name: 'Natasha', gender: 'Female', styles: ['default'] },
        { id: 'en-AU-WilliamNeural', name: 'William', gender: 'Male', styles: ['default'] },
      ],
      'es-ES': [
        { id: 'es-ES-ElviraNeural', name: 'Elvira', gender: 'Female', styles: ['default'] },
        { id: 'es-ES-AlvaroNeural', name: 'Alvaro', gender: 'Male', styles: ['default'] },
      ],
      'fr-FR': [
        { id: 'fr-FR-DeniseNeural', name: 'Denise', gender: 'Female', styles: ['cheerful','sad'] },
        { id: 'fr-FR-HenriNeural', name: 'Henri', gender: 'Male', styles: ['cheerful','sad'] },
        { id: 'fr-FR-EloiseNeural', name: 'Eloise', gender: 'Female', styles: ['default'] },
        { id: 'fr-FR-JeromeNeural', name: 'Jerome', gender: 'Male', styles: ['default'] },
      ],
      'de-DE': [
        { id: 'de-DE-KatjaNeural', name: 'Katja', gender: 'Female', styles: ['default'] },
        { id: 'de-DE-ConradNeural', name: 'Conrad', gender: 'Male', styles: ['cheerful'] },
        { id: 'de-DE-AmalaNeural', name: 'Amala', gender: 'Female', styles: ['default'] },
        { id: 'de-DE-FlorianNeural', name: 'Florian', gender: 'Male', styles: ['default'] },
      ],
      'hi-IN': [
        { id: 'hi-IN-SwaraNeural', name: 'Swara', gender: 'Female', styles: ['cheerful','sad','angry','excited','friendly','hopeful'] },
        { id: 'hi-IN-MadhurNeural', name: 'Madhur', gender: 'Male', styles: ['default'] },
      ],
      'ja-JP': [
        { id: 'ja-JP-NanamiNeural', name: 'Nanami', gender: 'Female', styles: ['chat','cheerful','customerservice'] },
        { id: 'ja-JP-KeitaNeural', name: 'Keita', gender: 'Male', styles: ['default'] },
        { id: 'ja-JP-DaichiNeural', name: 'Daichi', gender: 'Male', styles: ['default'] },
      ],
      'zh-CN': [
        { id: 'zh-CN-XiaoxiaoNeural', name: 'Xiaoxiao', gender: 'Female', styles: ['cheerful','angry','sad','fearful','disgruntled','serious','affectionate','gentle','lyrical','narration-professional','newscast-casual'] },
        { id: 'zh-CN-YunxiNeural', name: 'Yunxi', gender: 'Male', styles: ['narration-relaxed','cheerful','sad','angry','fearful','disgruntled','serious','depressed','embarrassed'] },
        { id: 'zh-CN-YunyangNeural', name: 'Yunyang', gender: 'Male', styles: ['customerservice','narration-professional','newscast-casual'] },
      ],
      'ko-KR': [
        { id: 'ko-KR-SunHiNeural', name: 'Sun-Hi', gender: 'Female', styles: ['default'] },
        { id: 'ko-KR-InJoonNeural', name: 'InJoon', gender: 'Male', styles: ['default'] },
      ],
      'pt-BR': [
        { id: 'pt-BR-FranciscaNeural', name: 'Francisca', gender: 'Female', styles: ['calm','cheerful','sad'] },
        { id: 'pt-BR-AntonioNeural', name: 'Antonio', gender: 'Male', styles: ['default'] },
      ],
      'ar-SA': [
        { id: 'ar-SA-ZariyahNeural', name: 'Zariyah', gender: 'Female', styles: ['default'] },
        { id: 'ar-SA-HamedNeural', name: 'Hamed', gender: 'Male', styles: ['default'] },
      ],
    };
  }

  /**
   * Gets a flat list of all voice IDs (for backward compatibility)
   * @returns {Array<string>} Flat array of voice IDs
   */
  getAllVoiceIds() {
    const voices = this.getAvailableVoices();
    const ids = [];
    for (const lang of Object.keys(voices)) {
      for (const v of voices[lang]) {
        ids.push(v.id);
      }
    }
    return ids;
  }

  /**
   * Gets available speaking styles across all voices
   * @returns {Array<string>} Unique styles
   */
  getAvailableStyles() {
    return [
      'default', 'chat', 'cheerful', 'angry', 'sad', 'excited', 'friendly',
      'hopeful', 'shouting', 'whispering', 'narration-professional',
      'narration-relaxed', 'newscast-casual', 'newscast-formal',
      'customerservice', 'empathetic', 'calm', 'fearful', 'disgruntled',
      'serious', 'affectionate', 'gentle', 'lyrical',
    ];
  }

  /**
   * Converts Buffer to Node.js readable stream
   * Used for audioConfig.fromWavFileInput compatibility
   * @param {Buffer} buffer - Buffer to convert
   * @returns {Stream} Readable stream
   * @private
   */
  bufferToStream(buffer) {
    const { Readable } = require('stream');
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
  }

  /**
   * Validates voice is available
   * @param {string} voice - Voice identifier
   * @returns {boolean} True if voice is available
   */
  isVoiceAvailable(voice) {
    const ids = this.getAllVoiceIds();
    return ids.includes(voice);
  }

  /**
   * Gets voices for a specific language
   * @param {string} language - Language code (e.g., 'en-US')
   * @returns {Array} List of voices for the language
   */
  getVoicesByLanguage(language) {
    const voices = this.getAvailableVoices();
    return voices[language] || [];
  }

  /**
   * Gets voice metadata by ID
   * @param {string} voiceId - Voice identifier
   * @returns {Object|null} Voice metadata or null
   */
  getVoiceById(voiceId) {
    const voices = this.getAvailableVoices();
    for (const lang of Object.keys(voices)) {
      const voice = voices[lang].find(v => v.id === voiceId);
      if (voice) return { ...voice, language: lang };
    }
    return null;
  }
}

export default new SpeechService();
