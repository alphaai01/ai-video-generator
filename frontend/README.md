# AI Video Generator - Frontend

A modern, cinematic Next.js 14 frontend for generating AI-powered videos. Create stunning videos from text prompts, images, and voice input.

## Features

- **Multiple Input Methods**
  - Text-based prompts with examples and suggestions
  - Image upload with drag-and-drop support
  - Voice input with real-time transcription

- **Customizable Settings**
  - Video duration (5s, 10s, 15s, 20s)
  - Resolution selection (720p, 1080p)
  - Optional AI narration

- **Professional UI**
  - Dark theme with gradient accents
  - Glass-morphism components
  - Real-time progress tracking
  - Video history with thumbnails
  - Responsive design

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Fetch API (native)

## Prerequisites

- Node.js 18+ and npm/yarn
- Backend API running on `localhost:4000`

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` if your backend is on a different URL:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Main dashboard
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── ProgressBar.tsx
│   │   ├── video/              # Video-related components
│   │   │   ├── PromptInput.tsx
│   │   │   ├── ImageUpload.tsx
│   │   │   ├── VideoPlayer.tsx
│   │   │   ├── VideoHistory.tsx
│   │   │   └── GenerationSettings.tsx
│   │   └── voice/              # Voice input components
│   │       └── VoiceInput.tsx
│   ├── hooks/                  # Custom React hooks
│   │   ├── useVideoGeneration.ts
│   │   └── useVoiceInput.ts
│   ├── lib/
│   │   └── api.ts              # API client
│   └── types/
│       └── index.ts            # TypeScript types
├── tailwind.config.js
├── postcss.config.js
└── next.config.js
```

## API Integration

The frontend communicates with the backend API on `localhost:4000`. Key endpoints:

- `POST /api/video/generate-text` - Generate video from text
- `POST /api/video/generate-image` - Generate video from image
- `GET /api/video/status/:jobId` - Check generation status
- `POST /api/speech/to-text` - Convert audio to text
- `POST /api/speech/to-audio` - Convert text to audio
- `GET /api/video/list` - Get video history

## Component Guide

### PromptInput
Textarea for entering video prompts with character count and example suggestions.

### ImageUpload
Drag-and-drop zone for uploading reference images (JPG, PNG, WebP).

### VoiceInput
Microphone recording with real-time transcription via MediaRecorder API.

### VideoPlayer
Displays generated videos with progress tracking and download functionality.

### VideoHistory
Shows previously generated videos with timestamps and metadata.

### GenerationSettings
Duration, resolution, and narration options selector.

## Hooks

### useVideoGeneration
Manages video generation lifecycle:
- Handles text and image-based generation
- Auto-polls for job status
- Manages progress and error states

### useVoiceInput
Manages voice recording and transcription:
- Browser microphone access
- Audio blob handling
- Speech-to-text integration

## Styling

Uses Tailwind CSS with custom configuration:
- Dark theme (dark-900 to dark-600)
- Gradient accents (purple → blue → cyan)
- Glass-morphism effects
- Custom animations (pulse-glow, gradient-shift)

## Development

### ESLint
```bash
npm run lint
```

### Type Checking
TypeScript is configured in strict mode for maximum safety.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires support for:
- MediaRecorder API (voice input)
- Fetch API with FormData
- CSS Grid and Flexbox

## Production Deployment

### Vercel (Recommended)
```bash
vercel deploy
```

### Other Platforms
```bash
npm run build
# Deploy the .next directory
```

Set environment variables on your hosting platform:
```
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

## Troubleshooting

**Microphone not working?**
- Check browser permissions (Settings → Privacy → Microphone)
- Ensure HTTPS for production (MediaRecorder requires secure context)

**Videos not generating?**
- Verify backend is running on `localhost:4000`
- Check CORS configuration on backend
- Inspect browser console for API errors

**Build errors?**
- Delete `node_modules` and `.next` directories
- Run `npm install` again
- Ensure Node.js version 18+

## License

MIT
