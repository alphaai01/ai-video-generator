'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { clsx } from 'clsx';
import {
  Music,
  Play,
  Pause,
  Download,
  Volume2,
  Mic,
  Globe,
  Sparkles,
  ChevronDown,
  RotateCcw,
  Headphones,
  Loader2,
} from 'lucide-react';

// Voice metadata types
interface VoiceInfo {
  id: string;
  name: string;
  gender: string;
  styles: string[];
}

interface VoicesByLanguage {
  [language: string]: VoiceInfo[];
}

// Curated voice data (matches backend)
const VOICES_BY_LANGUAGE: VoicesByLanguage = {
  'English (US)': [
    { id: 'en-US-AriaNeural', name: 'Aria', gender: 'Female', styles: ['chat','cheerful','angry','sad','excited','friendly','hopeful','narration-professional','newscast-casual','newscast-formal','customerservice','empathetic'] },
    { id: 'en-US-JennyNeural', name: 'Jenny', gender: 'Female', styles: ['chat','cheerful','sad','angry','excited','friendly','hopeful','shouting','whispering','narration-professional'] },
    { id: 'en-US-EmmaNeural', name: 'Emma', gender: 'Female', styles: ['default'] },
    { id: 'en-US-SaraNeural', name: 'Sara', gender: 'Female', styles: ['chat','cheerful','angry','sad','whispering'] },
    { id: 'en-US-GuyNeural', name: 'Guy', gender: 'Male', styles: ['newscast','angry','cheerful','sad','excited','friendly','hopeful'] },
    { id: 'en-US-BrianNeural', name: 'Brian', gender: 'Male', styles: ['default','narration-professional'] },
    { id: 'en-US-JasonNeural', name: 'Jason', gender: 'Male', styles: ['default','angry','cheerful','sad','excited','friendly','hopeful','whispering'] },
    { id: 'en-US-RyanNeural', name: 'Ryan', gender: 'Male', styles: ['default','angry','cheerful','sad','excited','friendly','hopeful'] },
    { id: 'en-US-AndrewNeural', name: 'Andrew', gender: 'Male', styles: ['default'] },
    { id: 'en-US-TonyNeural', name: 'Tony', gender: 'Male', styles: ['default'] },
  ],
  'English (UK)': [
    { id: 'en-GB-SoniaNeural', name: 'Sonia', gender: 'Female', styles: ['cheerful','sad'] },
    { id: 'en-GB-LibbyNeural', name: 'Libby', gender: 'Female', styles: ['default'] },
    { id: 'en-GB-ThomasNeural', name: 'Thomas', gender: 'Male', styles: ['default'] },
  ],
  'Hindi': [
    { id: 'hi-IN-SwaraNeural', name: 'Swara', gender: 'Female', styles: ['cheerful','sad','angry','excited','friendly','hopeful'] },
    { id: 'hi-IN-MadhurNeural', name: 'Madhur', gender: 'Male', styles: ['default'] },
  ],
  'Spanish': [
    { id: 'es-ES-ElviraNeural', name: 'Elvira', gender: 'Female', styles: ['default'] },
    { id: 'es-ES-AlvaroNeural', name: 'Alvaro', gender: 'Male', styles: ['default'] },
  ],
  'French': [
    { id: 'fr-FR-DeniseNeural', name: 'Denise', gender: 'Female', styles: ['cheerful','sad'] },
    { id: 'fr-FR-HenriNeural', name: 'Henri', gender: 'Male', styles: ['cheerful','sad'] },
  ],
  'German': [
    { id: 'de-DE-KatjaNeural', name: 'Katja', gender: 'Female', styles: ['default'] },
    { id: 'de-DE-ConradNeural', name: 'Conrad', gender: 'Male', styles: ['cheerful'] },
  ],
  'Japanese': [
    { id: 'ja-JP-NanamiNeural', name: 'Nanami', gender: 'Female', styles: ['chat','cheerful','customerservice'] },
    { id: 'ja-JP-KeitaNeural', name: 'Keita', gender: 'Male', styles: ['default'] },
  ],
  'Chinese': [
    { id: 'zh-CN-XiaoxiaoNeural', name: 'Xiaoxiao', gender: 'Female', styles: ['cheerful','angry','sad','fearful','disgruntled','serious','affectionate','gentle','lyrical','narration-professional','newscast-casual'] },
    { id: 'zh-CN-YunxiNeural', name: 'Yunxi', gender: 'Male', styles: ['narration-relaxed','cheerful','sad','angry','fearful','disgruntled','serious'] },
  ],
  'Korean': [
    { id: 'ko-KR-SunHiNeural', name: 'Sun-Hi', gender: 'Female', styles: ['default'] },
    { id: 'ko-KR-InJoonNeural', name: 'InJoon', gender: 'Male', styles: ['default'] },
  ],
  'Portuguese': [
    { id: 'pt-BR-FranciscaNeural', name: 'Francisca', gender: 'Female', styles: ['calm','cheerful','sad'] },
    { id: 'pt-BR-AntonioNeural', name: 'Antonio', gender: 'Male', styles: ['default'] },
  ],
  'Arabic': [
    { id: 'ar-SA-ZariyahNeural', name: 'Zariyah', gender: 'Female', styles: ['default'] },
    { id: 'ar-SA-HamedNeural', name: 'Hamed', gender: 'Male', styles: ['default'] },
  ],
};

const SPEED_OPTIONS = [
  { value: 'x-slow', label: '0.5x' },
  { value: 'slow', label: '0.75x' },
  { value: 'medium', label: '1x' },
  { value: 'fast', label: '1.25x' },
  { value: 'x-fast', label: '1.5x' },
];

const PITCH_OPTIONS = [
  { value: 'x-low', label: 'Very Low' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'x-high', label: 'Very High' },
];

const STYLE_LABELS: Record<string, string> = {
  default: 'Default',
  chat: 'Chat',
  cheerful: 'Cheerful',
  angry: 'Angry',
  sad: 'Sad',
  excited: 'Excited',
  friendly: 'Friendly',
  hopeful: 'Hopeful',
  shouting: 'Shouting',
  whispering: 'Whispering',
  'narration-professional': 'Narration',
  'narration-relaxed': 'Relaxed Narration',
  'newscast-casual': 'Newscast (Casual)',
  'newscast-formal': 'Newscast (Formal)',
  customerservice: 'Customer Service',
  empathetic: 'Empathetic',
  calm: 'Calm',
  fearful: 'Fearful',
  disgruntled: 'Disgruntled',
  serious: 'Serious',
  affectionate: 'Affectionate',
  gentle: 'Gentle',
  lyrical: 'Lyrical',
};

// API URL
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? ''
    : 'http://localhost:4000');

export const AudioStudio: React.FC = () => {
  // State
  const [text, setText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('English (US)');
  const [selectedVoice, setSelectedVoice] = useState<VoiceInfo>(
    VOICES_BY_LANGUAGE['English (US)'][0]
  );
  const [selectedStyle, setSelectedStyle] = useState('default');
  const [speed, setSpeed] = useState('medium');
  const [pitch, setPitch] = useState('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioSize, setAudioSize] = useState<number>(0);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);

  // Sample phrases for voice preview, keyed by language
  const SAMPLE_PHRASES: Record<string, string> = {
    'English (US)': 'Hello! This is a preview of my voice. I hope you enjoy how I sound.',
    'English (UK)': 'Hello! This is a preview of my voice. I hope you enjoy how I sound.',
    'Hindi': '\u0928\u092E\u0938\u094D\u0924\u0947! \u092F\u0939 \u092E\u0947\u0930\u0940 \u0906\u0935\u093E\u091C \u0915\u093E \u090F\u0915 \u0928\u092E\u0942\u0928\u093E \u0939\u0948\u0964 \u0906\u0936\u093E \u0939\u0948 \u0906\u092A\u0915\u094B \u092A\u0938\u0902\u0926 \u0906\u090F\u0917\u0940\u0964',
    'Spanish': '\u00A1Hola! Esta es una vista previa de mi voz. Espero que te guste c\u00F3mo sueno.',
    'French': 'Bonjour ! Ceci est un aper\u00E7u de ma voix. J\u2019esp\u00E8re que vous appr\u00E9cierez.',
    'German': 'Hallo! Dies ist eine Vorschau meiner Stimme. Ich hoffe, sie gef\u00E4llt Ihnen.',
    'Japanese': '\u3053\u3093\u306B\u3061\u306F\uFF01\u3053\u308C\u306F\u79C1\u306E\u58F0\u306E\u30D7\u30EC\u30D3\u30E5\u30FC\u3067\u3059\u3002\u6C17\u306B\u5165\u3063\u3066\u3044\u305F\u3060\u3051\u308C\u3070\u5E78\u3044\u3067\u3059\u3002',
    'Chinese': '\u4F60\u597D\uFF01\u8FD9\u662F\u6211\u58F0\u97F3\u7684\u9884\u89C8\u3002\u5E0C\u671B\u60A8\u559C\u6B22\u6211\u7684\u58F0\u97F3\u3002',
    'Korean': '\uC548\uB155\uD558\uC138\uC694! \uC774\uAC83\uC740 \uC81C \uBAA9\uC18C\uB9AC \uBBF8\uB9AC\uBCF4\uAE30\uC785\uB2C8\uB2E4. \uB9C8\uC74C\uC5D0 \uB4DC\uC2DC\uAE38 \uBC14\uB78D\uB2C8\uB2E4.',
    'Portuguese': 'Ol\u00E1! Esta \u00E9 uma pr\u00E9via da minha voz. Espero que goste de como eu soo.',
    'Arabic': '\u0645\u0631\u062D\u0628\u0627\u064B! \u0647\u0630\u0647 \u0645\u0639\u0627\u064A\u0646\u0629 \u0644\u0635\u0648\u062A\u064A. \u0623\u062A\u0645\u0646\u0649 \u0623\u0646 \u064A\u0639\u062C\u0628\u0643 \u0635\u0648\u062A\u064A.',
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(e.target as Node)) {
        setShowLanguageDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter voices by gender
  const filteredVoices = VOICES_BY_LANGUAGE[selectedLanguage]?.filter(
    (v) => genderFilter === 'All' || v.gender === genderFilter
  ) || [];

  // Available styles for selected voice
  const availableStyles = selectedVoice?.styles || ['default'];

  // When language changes, pick first voice
  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    const voices = VOICES_BY_LANGUAGE[lang] || [];
    const filtered = genderFilter === 'All' ? voices : voices.filter(v => v.gender === genderFilter);
    if (filtered.length > 0) {
      setSelectedVoice(filtered[0]);
      setSelectedStyle('default');
    }
    setShowLanguageDropdown(false);
  };

  // When voice changes, reset style if not available
  const handleVoiceChange = (voice: VoiceInfo) => {
    setSelectedVoice(voice);
    if (!voice.styles.includes(selectedStyle)) {
      setSelectedStyle('default');
    }
  };

  // Generate audio
  const handleGenerate = useCallback(async () => {
    if (!text.trim()) return;

    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);
    setIsPlaying(false);

    try {
      const response = await fetch(`${API_URL}/api/speech/generate-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voice: selectedVoice.id,
          style: selectedStyle !== 'default' ? selectedStyle : undefined,
          speed: speed !== 'medium' ? speed : undefined,
          pitch: pitch !== 'medium' ? pitch : undefined,
          outputFormat: 'mp3',
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Generation failed (${response.status})`);
      }

      const result = await response.json();

      if (result.success && result.data?.audioUrl) {
        setAudioUrl(result.data.audioUrl);
        setAudioSize(result.data.size || 0);
      } else {
        throw new Error('No audio data in response');
      }
    } catch (err: any) {
      console.error('Audio generation error:', err);
      setError(err.message || 'Failed to generate audio');
    } finally {
      setIsGenerating(false);
    }
  }, [text, selectedVoice, selectedStyle, speed, pitch]);

  // Preview voice with a sample phrase
  const handlePreviewVoice = useCallback(async () => {
    // Stop any currently playing preview
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
    }

    setIsPreviewLoading(true);
    setIsPreviewPlaying(false);

    try {
      const sampleText = SAMPLE_PHRASES[selectedLanguage] || SAMPLE_PHRASES['English (US)'];

      const response = await fetch(`${API_URL}/api/speech/generate-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleText,
          voice: selectedVoice.id,
          style: selectedStyle !== 'default' ? selectedStyle : undefined,
          speed: speed !== 'medium' ? speed : undefined,
          pitch: pitch !== 'medium' ? pitch : undefined,
          outputFormat: 'mp3',
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Preview failed (${response.status})`);
      }

      const result = await response.json();

      if (result.success && result.data?.audioUrl) {
        const audio = new Audio(result.data.audioUrl);
        previewAudioRef.current = audio;

        audio.onplay = () => setIsPreviewPlaying(true);
        audio.onended = () => setIsPreviewPlaying(false);
        audio.onpause = () => setIsPreviewPlaying(false);
        audio.onerror = () => {
          setIsPreviewPlaying(false);
          setError('Failed to play voice preview');
        };

        await audio.play();
      } else {
        throw new Error('No audio data in preview response');
      }
    } catch (err: any) {
      console.error('Voice preview error:', err);
      setError(err.message || 'Failed to preview voice');
    } finally {
      setIsPreviewLoading(false);
    }
  }, [selectedVoice, selectedStyle, speed, pitch, selectedLanguage]);

  // Stop preview when voice selection changes
  useEffect(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      setIsPreviewPlaying(false);
    }
  }, [selectedVoice.id, selectedStyle, speed, pitch]);

  // Play/pause audio
  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Download audio
  const handleDownload = () => {
    if (!audioUrl) return;
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `ai-audio-${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset
  const handleReset = () => {
    setText('');
    setAudioUrl(null);
    setIsPlaying(false);
    setError(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-accent-purple to-accent-cyan rounded-lg">
          <Music className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">AI Audio Studio</h2>
          <p className="text-gray-400 text-sm">
            Generate natural AI voiceovers with 50+ voices in 12 languages
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Text Input + Voice Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Text Input */}
          <Card className="p-6">
            <label className="block text-sm font-medium text-white mb-3">
              Text to Convert
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isGenerating}
              placeholder="Enter the text you want to convert to speech... Supports up to 5,000 characters."
              className={clsx(
                'w-full h-40 p-4 bg-dark-700 border border-dark-600 rounded-lg',
                'text-white placeholder-gray-500 resize-none text-sm leading-relaxed',
                'focus:outline-none focus:border-accent-cyan focus:ring-2 focus:ring-accent-cyan focus:ring-opacity-20',
                'transition-all duration-200',
                isGenerating && 'opacity-50 cursor-not-allowed'
              )}
              maxLength={5000}
            />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>
                Estimated duration: ~{Math.max(1, Math.ceil(text.length / 150))}s
              </span>
              <span>{text.length} / 5,000</span>
            </div>
          </Card>

          {/* Voice Selection */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Mic className="w-5 h-5 text-accent-purple" />
              <h3 className="text-lg font-semibold text-white">Voice Selection</h3>
            </div>

            {/* Language Picker */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Globe className="w-4 h-4 inline mr-1" />
                Language
              </label>
              <div className="relative" ref={languageDropdownRef}>
                <button
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm hover:bg-dark-600 transition-colors"
                >
                  <span>{selectedLanguage}</span>
                  <ChevronDown className={clsx('w-4 h-4 transition-transform', showLanguageDropdown && 'rotate-180')} />
                </button>
                {showLanguageDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-dark-700 border border-dark-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {Object.keys(VOICES_BY_LANGUAGE).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => handleLanguageChange(lang)}
                        className={clsx(
                          'w-full text-left px-4 py-2.5 text-sm hover:bg-dark-600 transition-colors',
                          selectedLanguage === lang
                            ? 'text-accent-cyan bg-dark-600'
                            : 'text-gray-300'
                        )}
                      >
                        {lang}
                        <span className="text-gray-500 ml-2 text-xs">
                          ({VOICES_BY_LANGUAGE[lang].length} voices)
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Gender Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Filter by Gender
              </label>
              <div className="flex gap-2">
                {(['All', 'Female', 'Male'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      setGenderFilter(g);
                      const voices = VOICES_BY_LANGUAGE[selectedLanguage] || [];
                      const filtered = g === 'All' ? voices : voices.filter(v => v.gender === g);
                      if (filtered.length > 0 && !filtered.find(v => v.id === selectedVoice.id)) {
                        setSelectedVoice(filtered[0]);
                        setSelectedStyle('default');
                      }
                    }}
                    disabled={isGenerating}
                    className={clsx(
                      'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                      genderFilter === g
                        ? 'bg-gradient-accent text-white'
                        : 'bg-dark-700 text-gray-400 hover:bg-dark-600 border border-dark-600'
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Grid */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Voice
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {filteredVoices.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => handleVoiceChange(voice)}
                    disabled={isGenerating}
                    className={clsx(
                      'p-3 rounded-lg text-left transition-all duration-200 border',
                      selectedVoice.id === voice.id
                        ? 'bg-gradient-accent text-white border-accent-purple shadow-glow'
                        : 'bg-dark-700 text-gray-300 border-dark-600 hover:bg-dark-600 hover:border-dark-500',
                      isGenerating && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="font-medium text-sm">{voice.name}</div>
                    <div className="text-xs opacity-70 mt-0.5">
                      {voice.gender} {voice.styles.length > 1 ? `\u00b7 ${voice.styles.length} styles` : ''}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Voice Button */}
            <button
              onClick={handlePreviewVoice}
              disabled={isGenerating || isPreviewLoading}
              className={clsx(
                'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg',
                'text-sm font-medium transition-all duration-200 border',
                isPreviewPlaying
                  ? 'bg-accent-purple bg-opacity-20 text-accent-purple border-accent-purple'
                  : 'bg-dark-700 text-gray-300 border-dark-600 hover:bg-dark-600 hover:border-accent-cyan hover:text-white',
                (isGenerating || isPreviewLoading) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isPreviewLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPreviewPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Headphones className="w-4 h-4" />
              )}
              {isPreviewLoading
                ? 'Loading Preview...'
                : isPreviewPlaying
                ? 'Playing Preview...'
                : `Preview "${selectedVoice.name}" Voice`}
            </button>
          </Card>

          {/* Style & Controls */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-accent-cyan" />
              <h3 className="text-lg font-semibold text-white">Voice Controls</h3>
            </div>

            {/* Speaking Style */}
            {availableStyles.length > 1 && (
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Speaking Style
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableStyles.map((style) => (
                    <button
                      key={style}
                      onClick={() => setSelectedStyle(style)}
                      disabled={isGenerating}
                      className={clsx(
                        'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                        selectedStyle === style
                          ? 'bg-accent-purple text-white'
                          : 'bg-dark-700 text-gray-400 hover:bg-dark-600 border border-dark-600'
                      )}
                    >
                      {STYLE_LABELS[style] || style}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Speed */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Speed
              </label>
              <div className="flex gap-2">
                {SPEED_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSpeed(opt.value)}
                    disabled={isGenerating}
                    className={clsx(
                      'flex-1 py-2 rounded-lg text-sm font-medium transition-all border',
                      speed === opt.value
                        ? 'bg-gradient-accent text-white border-accent-purple'
                        : 'bg-dark-700 text-gray-400 border-dark-600 hover:bg-dark-600'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pitch */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Pitch
              </label>
              <div className="flex gap-2">
                {PITCH_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPitch(opt.value)}
                    disabled={isGenerating}
                    className={clsx(
                      'flex-1 py-2 rounded-lg text-xs font-medium transition-all border',
                      pitch === opt.value
                        ? 'bg-gradient-accent text-white border-accent-purple'
                        : 'bg-dark-700 text-gray-400 border-dark-600 hover:bg-dark-600'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Preview + Generate */}
        <div className="space-y-6">
          {/* Generate Button */}
          <Button
            variant="primary"
            size="lg"
            onClick={handleGenerate}
            disabled={isGenerating || !text.trim()}
            loading={isGenerating}
            icon={!isGenerating && <Volume2 className="w-5 h-5" />}
            className="w-full"
          >
            {isGenerating ? 'Generating Audio...' : 'Generate Audio'}
          </Button>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-900 bg-opacity-20 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Audio Player */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Audio Preview</h3>

            {audioUrl ? (
              <div className="space-y-4">
                {/* Hidden audio element */}
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  onPause={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                />

                {/* Waveform visual */}
                <div className="flex items-center justify-center h-24 bg-dark-700 rounded-lg overflow-hidden relative">
                  <div className="flex items-end gap-[3px] h-16">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div
                        key={i}
                        className={clsx(
                          'w-1.5 rounded-full transition-all duration-300',
                          isPlaying
                            ? 'bg-gradient-to-t from-accent-purple to-accent-cyan'
                            : 'bg-dark-500'
                        )}
                        style={{
                          height: `${Math.random() * 60 + 20}%`,
                          animationDelay: `${i * 50}ms`,
                          animation: isPlaying
                            ? `pulse 0.8s ease-in-out infinite alternate ${i * 50}ms`
                            : 'none',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlayback}
                    className="p-3 bg-gradient-accent rounded-full text-white hover:shadow-glow transition-all active:scale-95"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="text-sm text-white font-medium">
                      {selectedVoice.name} ({selectedLanguage})
                    </div>
                    <div className="text-xs text-gray-400">
                      {selectedStyle !== 'default' ? STYLE_LABELS[selectedStyle] || selectedStyle : 'Default style'}
                      {' \u00b7 '}
                      {audioSize > 0 ? `${(audioSize / 1024).toFixed(0)} KB` : 'Ready'}
                    </div>
                  </div>

                  <button
                    onClick={handleDownload}
                    className="p-2 bg-dark-700 rounded-lg text-gray-300 hover:bg-dark-600 hover:text-white transition-colors"
                    title="Download MP3"
                  >
                    <Download className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleReset}
                    className="p-2 bg-dark-700 rounded-lg text-gray-300 hover:bg-dark-600 hover:text-white transition-colors"
                    title="Reset"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                <Volume2 className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">
                  {isGenerating
                    ? 'Generating your audio...'
                    : 'Enter text and click Generate to create audio'}
                </p>
              </div>
            )}
          </Card>

          {/* Voice Info Card */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Selected Voice</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Name</span>
                <span className="text-white">{selectedVoice.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Gender</span>
                <span className="text-white">{selectedVoice.gender}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Language</span>
                <span className="text-white">{selectedLanguage}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Style</span>
                <span className="text-white">
                  {STYLE_LABELS[selectedStyle] || selectedStyle}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Speed</span>
                <span className="text-white">
                  {SPEED_OPTIONS.find((s) => s.value === speed)?.label || speed}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Pitch</span>
                <span className="text-white">
                  {PITCH_OPTIONS.find((p) => p.value === pitch)?.label || pitch}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* CSS for waveform animation */}
      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scaleY(0.4); }
          100% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
};

AudioStudio.displayName = 'AudioStudio';
