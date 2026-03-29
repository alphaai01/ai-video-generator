# AI Video Generator - Architecture Documentation

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 14)                       │
│                  Running on localhost:3000                      │
└──────────────────────────────────────────────────────────────────┘
                               ↓
          ┌────────────────────────────────────────┐
          │    Next.js API Routes & Rewrites       │
          │   /api/* → localhost:4000/api/*       │
          └────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                Backend API (localhost:4000)                     │
│  Video Generation • Speech Processing • Job Management         │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

### Text-to-Video Generation Flow

```
User Input (Text Prompt)
    ↓
PromptInput Component (value: string)
    ↓
useVideoGeneration Hook (setPrompt)
    ↓
Generate Button onClick
    ↓
generateFromText(prompt)
    ↓
API Client: POST /api/video/generate-text
    ├─ Request Body: { prompt, duration, resolution }
    └─ Response: { jobId }
    ↓
setJobId(response.jobId)
    ↓
pollStatus(jobId) [Auto-polling loop]
    ├─ Every 2 seconds
    ├─ GET /api/video/status/{jobId}
    └─ Response: { status, progress, videoUrl }
    ↓
Update State (status, progress, videoUrl)
    ↓
VideoPlayer Component (displays video)
    ↓
User Downloads or Resets
```

### Image-to-Video Generation Flow

```
User Input (Image File + Text Prompt)
    ↓
ImageUpload Component (file: File)
    ↓
useVideoGeneration Hook (setImage)
    ↓
PromptInput Component (prompt: string)
    ↓
Generate Button onClick
    ↓
generateFromImage(file, prompt)
    ↓
API Client: POST /api/video/generate-image
    ├─ Request Body: FormData { image, prompt, duration, resolution }
    └─ Response: { jobId }
    ↓
[Same polling flow as text generation]
    ↓
VideoPlayer Component (displays video)
```

### Voice-to-Text-to-Video Flow

```
User Action (Start Recording)
    ↓
VoiceInput Component
    ↓
useVoiceInput Hook
    ├─ Navigator.mediaDevices.getUserMedia()
    ├─ MediaRecorder API
    └─ Recording State Management
    ↓
User Action (Stop Recording)
    ↓
Blob Creation (audio)
    ↓
API Client: POST /api/speech/to-text
    ├─ Request Body: FormData { audio }
    └─ Response: { text }
    ↓
setTranscribedText(response.text)
    ↓
Display transcribed text
    ↓
User clicks "Use as Prompt"
    ↓
onTextExtracted(text)
    ↓
setPrompt(text) in parent component
    ↓
[Same as Text-to-Video flow]
```

## Component Hierarchy

```
Page (Main Dashboard)
├── Header
│   └── App Title + Logo
├── Main Content
│   ├── Left Column (2/3)
│   │   ├── Tab Navigation
│   │   │   ├── Text Prompt Tab
│   │   │   ├── Image Upload Tab
│   │   │   └── Voice Input Tab
│   │   ├── Tab Content
│   │   │   ├── PromptInput
│   │   │   ├── ImageUpload
│   │   │   ├── VoiceInput
│   │   │   └── GenerationSettings
│   │   ├── Error Display
│   │   └── Generate Button
│   │
│   └── Right Column (1/3)
│       ├── VideoPlayer
│       │   ├── Video Element
│       │   ├── Loading Animation
│       │   ├── Progress Bar
│       │   └── Download Button
│       │
│       └── VideoHistory
│           ├── History Items (List)
│           └── Click to View
```

## State Management Pattern

### useVideoGeneration Hook

```typescript
State Variables:
├── prompt: string                    // Current text prompt
├── image: File | null                // Selected image file
├── status: GenerationStatus          // Generation lifecycle status
├── progress: number                  // 0-100% progress
├── videoUrl: string | null           // Generated video URL
├── jobId: string | null              // Current job ID
├── error: string | null              // Error message if any
└── settings: GenerationSettings      // Duration, resolution, narration

State Transitions:
idle → generating → polling → complete
            ↘
              error (at any point)

Methods:
├── generateFromText(prompt)          // Initiate text-based generation
├── generateFromImage(file, prompt)   // Initiate image-based generation
└── resetGeneration()                 // Reset to idle state
```

### useVoiceInput Hook

```typescript
State Variables:
├── isRecording: boolean              // Currently recording?
├── recordingDuration: number         // Seconds elapsed
├── transcribedText: string           // Speech-to-text result
├── isTranscribing: boolean           // Currently transcribing?
└── error: string | null              // Transcription error

Methods:
├── startRecording()                  // Start microphone access
├── stopRecording()                   // Stop and transcribe
└── clearTranscription()              // Clear text
```

## API Contract

### Request/Response Types

```typescript
// Text Generation
Request: {
  prompt: string
  duration: number (5 | 10 | 15 | 20)
  resolution: number (720 | 1080)
}
Response: { jobId: string }

// Image Generation
Request: FormData {
  image: File
  prompt: string
  duration?: number
  resolution?: string
}
Response: { jobId: string }

// Job Status
Response: {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number (0-100)
  videoUrl?: string
  error?: string
}

// Speech to Text
Request: FormData { audio: Blob }
Response: { text: string }

// Text to Speech
Request: {
  text: string
  voice?: string
}
Response: { audioUrl: string }

// List Videos
Response: Array<{
  id: string
  prompt: string
  thumbnail?: string
  videoUrl: string
  timestamp: string
  duration: number
  resolution: string
}>
```

## Component Responsibility Map

### Page (page.tsx)
- Orchestrates all sub-components
- Manages tab state
- Routes generation requests
- Handles history video selection
- Displays main layout

### Input Components
- **PromptInput**: Textarea with character count and examples
- **ImageUpload**: Drag-drop with preview and validation
- **VoiceInput**: Microphone recording and transcription
- **GenerationSettings**: Duration, resolution, narration options

### Output Components
- **VideoPlayer**: Displays video with progress and download
- **VideoHistory**: Lists previous videos with metadata

### UI Components
- **Button**: Reusable with variants (primary, secondary, ghost, danger)
- **Card**: Glass-morphism container
- **ProgressBar**: Animated progress visualization

## Styling Architecture

### Tailwind Configuration
```
Color Scheme:
├── Dark Backgrounds
│   ├── dark-900: #0a0e27 (darkest, background)
│   ├── dark-800: #1a1f3a (cards, panels)
│   ├── dark-700: #252d4a (hover state)
│   └── dark-600: #353d5c (borders)
│
└── Accent Colors
    ├── accent-purple: #a78bfa
    ├── accent-blue: #60a5fa
    └── accent-cyan: #22d3ee

Gradients:
├── gradient-accent: purple → blue → cyan
└── gradient-dark: dark-800 → dark-700

Animations:
├── pulse-glow: Pulsing opacity (recording indicator)
├── gradient-shift: Moving gradient background
└── shimmer: Loading animation
```

### Component Styling Patterns
- Glass-morphism: `bg-opacity-40 backdrop-blur-md`
- Gradient buttons: `bg-gradient-accent`
- Disabled states: `opacity-50 cursor-not-allowed`
- Focus states: `focus:ring-2 focus:ring-accent-purple`

## Error Handling Strategy

```
API Request
    ↓
Response Check (status)
    ↓
   /   \
  OK    Error
  ↓      ↓
Parse  Throw
Data   ApiError
  ↓      ↓
Return  Catch
      (useVideoGeneration)
        ↓
      setError(message)
      setStatus('error')
        ↓
      Display in UI
```

## Performance Optimizations

### Code Splitting
- Next.js auto-splits by page
- Components lazy-loaded as needed
- Images optimized via next/image

### Re-render Optimization
- useCallback for handler memoization
- Separate concerns into custom hooks
- useRef for DOM elements (MediaRecorder)

### Network Optimization
- API rewrites hide backend origin
- Efficient FormData for file uploads
- Polling interval: 2 seconds (configurable)

## Security Considerations

```
User Input Flow:
Text Prompt → Validate length → Sanitize → Send to API
Image File → Validate type/size → FormData → Send to API
Audio Blob → Create in browser → Send to API

No sensitive data:
✓ No API keys in frontend
✓ No authentication tokens exposed
✓ No PII in logs
✓ CORS configured server-side
```

## Deployment Architecture

```
Development
└── npm run dev
    └── localhost:3000 ← → localhost:4000

Production (Vercel Example)
├── Frontend: vercel.app
│   └── env: NEXT_PUBLIC_API_URL=https://api.example.com
├── API Rewrite: /api/* → https://api.example.com/api/*
└── Backend: api.example.com:4000
```

## Testing Strategy

### Unit Tests (components)
```typescript
describe('PromptInput', () => {
  it('updates value on change')
  it('limits character count')
  it('shows example prompts')
})
```

### Integration Tests (hooks)
```typescript
describe('useVideoGeneration', () => {
  it('generates video from text')
  it('polls for status updates')
  it('handles errors')
})
```

### E2E Tests (user flows)
```typescript
describe('Video Generation', () => {
  it('generates video from text prompt')
  it('generates video from image')
  it('records and uses voice input')
  it('views previous videos')
})
```

## Browser API Usage

```
MediaRecorder API
├── navigator.mediaDevices.getUserMedia()
├── new MediaRecorder(stream)
├── mediaRecorder.start/stop()
└── ondataavailable → Blob

Fetch API
├── POST with JSON body
├── POST with FormData
└── Error handling

File API
├── FileReader
├── Blob creation
└── File type validation
```

## Scalability Considerations

### For 10k+ Users
- Implement WebSocket for real-time updates
- Add caching layer (Redis)
- Load balance backend API
- CDN for video delivery

### For High-Volume Video Generation
- Queue system (Bull, RabbitMQ)
- Worker pool management
- Rate limiting per user
- Cost optimization (video processing)

### For Data Management
- Database for user history
- Cloud storage for videos (S3, Azure Blob)
- Analytics and monitoring
- Backup and disaster recovery
