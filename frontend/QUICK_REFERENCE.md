# Quick Reference Guide

## Installation & Running

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

Open http://localhost:3000

## File Locations

```
Configuration:
  package.json, tailwind.config.js, next.config.js, tsconfig.json

Components:
  src/components/ui/          - Button, Card, ProgressBar
  src/components/video/       - PromptInput, ImageUpload, VideoPlayer, etc.
  src/components/voice/       - VoiceInput

Hooks:
  src/hooks/                  - useVideoGeneration, useVoiceInput

API:
  src/lib/api.ts              - API client

Types:
  src/types/index.ts          - All TypeScript interfaces

Pages:
  src/app/page.tsx            - Main dashboard
  src/app/layout.tsx          - Root layout

Styles:
  src/app/globals.css         - Global styles and animations
```

## Common Tasks

### Add a New Component

```typescript
// src/components/ui/NewComponent.tsx
'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { clsx } from 'clsx';

interface NewComponentProps {
  title: string;
  // Add other props
}

export const NewComponent: React.FC<NewComponentProps> = ({
  title,
  // destructure props
}) => {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {/* Component content */}
    </Card>
  );
};

NewComponent.displayName = 'NewComponent';
```

### Add a New API Endpoint

```typescript
// In src/lib/api.ts, add to ApiClient class:

async myNewEndpoint(param: string): Promise<MyType> {
  const response = await fetch(`${this.baseUrl}/api/my-endpoint`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ param }),
  });
  return this.handleResponse(response);
}

// Export it:
export const myNewEndpoint = (param: string) =>
  apiClient.myNewEndpoint(param);
```

### Add a New Type

```typescript
// In src/types/index.ts:

export interface MyNewType {
  id: string;
  name: string;
  created_at: string;
}
```

### Modify Tailwind Theme

```javascript
// In tailwind.config.js, extend the theme:

colors: {
  'new-color': {
    500: '#your-hex-color',
  },
},

// Use it:
<div className="bg-new-color-500">New Color</div>
```

### Handle API Error

```typescript
try {
  const result = await generateVideoFromText(prompt);
} catch (err) {
  const apiError = err as ApiError;
  console.error(apiError.message);
  // Show user-friendly error
}
```

## Component Props Reference

### Button
```tsx
<Button
  variant="primary" | "secondary" | "ghost" | "danger"
  size="sm" | "md" | "lg"
  loading={false}
  disabled={false}
  icon={<IconComponent />}
  onClick={() => {}}
>
  Click me
</Button>
```

### Card
```tsx
<Card glass={true} className="p-6">
  Content here
</Card>
```

### PromptInput
```tsx
<PromptInput
  value={prompt}
  onChange={setPrompt}
  maxLength={500}
  disabled={false}
/>
```

### ImageUpload
```tsx
<ImageUpload
  image={image}
  onImageChange={setImage}
  disabled={false}
/>
```

### VideoPlayer
```tsx
<VideoPlayer
  videoUrl={url}
  isLoading={false}
  progress={50}
  status="polling"
  duration={10}
  resolution="1080p"
/>
```

### VoiceInput
```tsx
<VoiceInput
  onTextExtracted={(text) => handleText(text)}
  disabled={false}
/>
```

### GenerationSettingsComponent
```tsx
<GenerationSettingsComponent
  settings={settings}
  onSettingsChange={setSettings}
  disabled={false}
/>
```

## Hook API

### useVideoGeneration

```typescript
const {
  prompt,                // Current prompt
  setPrompt,            // Update prompt
  image,                // Current image file
  setImage,             // Update image
  status,               // 'idle' | 'generating' | 'polling' | 'complete' | 'error'
  progress,             // 0-100
  videoUrl,             // Generated video URL
  error,                // Error message
  settings,             // GenerationSettings
  setSettings,          // Update settings
  generateFromText,     // async (prompt: string) => void
  generateFromImage,    // async (file: File, prompt: string) => void
  resetGeneration,      // () => void
  jobId,                // Current job ID
} = useVideoGeneration();
```

### useVoiceInput

```typescript
const {
  isRecording,          // boolean
  recordingDuration,    // seconds
  transcribedText,      // string
  isTranscribing,       // boolean
  error,                // string | null
  startRecording,       // async () => void
  stopRecording,        // async () => Promise<string | null>
  clearTranscription,   // () => void
} = useVoiceInput();
```

## API Endpoints Used

```
POST /api/video/generate-text
  Body: { prompt: string, duration: number, resolution: number }
  Response: { jobId: string }

POST /api/video/generate-image
  Body: FormData { image: File, prompt: string, duration?: number, resolution?: string }
  Response: { jobId: string }

GET /api/video/status/{jobId}
  Response: { status: string, progress: number, videoUrl?: string, error?: string }

POST /api/speech/to-text
  Body: FormData { audio: Blob }
  Response: { text: string }

POST /api/speech/to-audio
  Body: { text: string, voice?: string }
  Response: { audioUrl: string }

GET /api/video/list
  Response: Array<VideoHistoryItem>
```

## Debugging Tips

### Check API Calls
```typescript
// Browser DevTools → Network tab
// Filter: fetch/xhr
// Check request and response bodies
```

### Check Component State
```typescript
// Install React DevTools extension
// Props and state visible in DevTools
```

### Console Logging
```typescript
console.log('Variable:', variable);
console.error('Error:', error);
```

### Disable Video Generation for Testing
```typescript
// In useVideoGeneration hook, bypass API:
const fakeJob = { jobId: 'test-123' };
setJobId(fakeJob.jobId);
```

## Performance Checklist

- [ ] Images optimized with next/image
- [ ] No unnecessary re-renders (useCallback)
- [ ] Large lists virtualized
- [ ] No console errors or warnings
- [ ] Bundle size < 200KB (gzipped)
- [ ] Mobile responsive (test at 375px width)
- [ ] Keyboard accessible (tab navigation)
- [ ] Color contrast WCAG AA compliant

## Common Errors & Solutions

| Error | Solution |
|-------|----------|
| "Cannot connect to API" | Ensure backend runs on localhost:4000 |
| "Microphone permission denied" | Check browser permissions, reload page |
| "Image too large" | Compress image, keep under 50MB |
| "Type 'undefined' is not assignable" | Check prop types, add proper defaults |
| "Build fails with TypeScript error" | Run `npm install`, check tsconfig.json |
| "Styles not loading" | Restart dev server, clear .next folder |
| "Video won't play" | Check videoUrl is valid, verify CORS |

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/my-feature

# Create pull request on GitHub
```

## Deployment Checklist

- [ ] All environment variables set
- [ ] `npm run build` succeeds
- [ ] No console errors in production
- [ ] NEXT_PUBLIC_API_URL points to production API
- [ ] CORS configured on backend
- [ ] Backend API is accessible from frontend
- [ ] Test all features end-to-end
- [ ] Performance acceptable (< 3s load time)
- [ ] Mobile works correctly

## Useful Commands

```bash
# Type checking
npm run type-check
# (Add to package.json if not present)

# Code quality
npm run lint

# Clean build
rm -rf .next node_modules
npm install
npm run build

# Development with verbose logging
DEBUG=next* npm run dev
```

## Resources

- Next.js Docs: https://nextjs.org/docs
- Tailwind Docs: https://tailwindcss.com/docs
- React Hooks: https://react.dev/reference/react
- TypeScript Docs: https://www.typescriptlang.org/docs
- Lucide Icons: https://lucide.dev

## Color Palette

```
Primary:     #a78bfa (Purple)
Secondary:   #60a5fa (Blue)
Accent:      #22d3ee (Cyan)

Dark-900:    #0a0e27 (Background)
Dark-800:    #1a1f3a (Cards)
Dark-700:    #252d4a (Hover)
Dark-600:    #353d5c (Border)

Text White:  #ffffff
Text Gray:   #d1d5db
Text Muted:  #9ca3af
```

## Quick Terminal Commands

```bash
# Start dev server (with specific port)
npm run dev -- -p 3001

# Build and analyze bundle size
npm run build

# Format code (add Prettier if needed)
npm run lint -- --fix

# Type check only
npx tsc --noEmit
```

## Keyboard Shortcuts (in browser)

- F12: DevTools
- Ctrl+Shift+Delete: Clear cache
- Ctrl+Shift+J: Console
- Ctrl+Shift+C: Inspect element
- Ctrl+Shift+M: Toggle device toolbar (mobile)

## What Next?

1. Customize colors in `tailwind.config.js`
2. Add more example prompts in `PromptInput.tsx`
3. Implement user authentication
4. Add analytics with Google Analytics
5. Set up CI/CD with GitHub Actions
6. Monitor performance with Sentry
7. Add unit tests with Jest
8. Implement E2E tests with Playwright
