# AI Video Generator Frontend - Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```

Default configuration (already set in `.env.example`):
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The app will automatically connect to the backend API at `localhost:4000`.

## Architecture Overview

### State Management
- **useVideoGeneration**: Main hook managing video generation workflow
- **useVoiceInput**: Handles microphone recording and audio transcription

### API Communication
- Centralized API client in `src/lib/api.ts`
- Automatic polling for job status
- Proper error handling and user feedback

### Component Structure
```
Page (Main Dashboard)
├── Header
├── Main Input Section
│   ├── Tab Navigation (Text/Image/Voice)
│   ├── PromptInput / ImageUpload / VoiceInput
│   ├── GenerationSettings
│   ├── Generate Button
│   └── Error Display
└── Sidebar
    ├── VideoPlayer (with real-time progress)
    └── VideoHistory (clickable previous videos)
```

## Feature Walkthrough

### Text-to-Video Generation
1. Enter a detailed prompt describing the video
2. Adjust duration (5-20 seconds) and resolution (720p/1080p)
3. Optional: Enable AI narration
4. Click "Generate Video"
5. Watch real-time progress updates
6. Download the generated video

### Image-to-Video Generation
1. Switch to "Image Upload" tab
2. Drag-and-drop or click to upload an image (JPG/PNG/WebP)
3. Enter a prompt describing the video animation
4. Configure settings and generate

### Voice-to-Text Generation
1. Switch to "Voice Input" tab
2. Click "Start Recording" and speak your prompt
3. Click "Stop Recording" when done
4. Review the transcribed text
5. Click "Use as Prompt" to add it as the video prompt
6. Configure settings and generate

## Browser Requirements

- Modern browser with ES2020+ support
- MediaRecorder API (for voice recording)
- Fetch API with FormData
- CSS Grid and Flexbox

### Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development Tips

### Hot Reload
Changes to components automatically reload the page during development.

### Debug Mode
Check the browser console (F12) for:
- API request/response logs
- Error messages
- State changes

### TypeScript Strict Mode
All components use strict TypeScript checking. Follow the type definitions in `src/types/index.ts`.

### Tailwind CSS
- Dark theme uses `dark-*` color prefixes
- Accent colors: `accent-purple`, `accent-blue`, `accent-cyan`
- Use `clsx` for conditional classes

Example:
```tsx
<div className={clsx(
  'px-4 py-2 rounded-lg',
  isActive ? 'bg-gradient-accent' : 'bg-dark-700'
)}>
```

## Production Build

### Build
```bash
npm run build
```

### Run Production Build Locally
```bash
npm start
```

### Deploy to Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Deploy to Other Platforms
1. Build the project: `npm run build`
2. Deploy the `.next` directory
3. Set environment variables on your hosting platform

Example for environment variables:
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Troubleshooting

### Issue: "Cannot connect to API"
**Solution**:
- Ensure backend is running on `localhost:4000`
- Check CORS configuration on backend
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`

### Issue: "Microphone permission denied"
**Solution**:
- Check browser settings (Settings → Privacy → Microphone)
- Reload the page
- In production, use HTTPS (MediaRecorder requires secure context)

### Issue: Video generation never completes
**Solution**:
- Check backend logs for processing errors
- Verify the job ID is being returned
- Try a shorter duration or lower resolution

### Issue: Build errors
**Solution**:
- Delete `node_modules` and `.next`: `rm -rf node_modules .next`
- Clear npm cache: `npm cache clean --force`
- Reinstall: `npm install`
- Rebuild: `npm run build`

### Issue: Styles not loading
**Solution**:
- Restart dev server: `npm run dev`
- Clear browser cache (Ctrl+Shift+Delete)
- Verify Tailwind config in `tailwind.config.js`

## Performance Optimization

### Image Optimization
- Use Next.js Image component for thumbnails
- Already configured in `next.config.js` for Azure Blob Storage

### Code Splitting
- Next.js automatically code-splits by route
- Components are lazy-loaded as needed

### Bundle Analysis
```bash
npm run build
npm run start
# Check .next directory size
```

## Security Notes

- All API calls go through Next.js rewrites (hide backend origin)
- No sensitive data in URL parameters
- CORS properly configured
- User data only sent to backend API

## File Size Reference

Typical Next.js 14 build:
- Main bundle: ~50-100KB (gzipped)
- With all components and dependencies: ~150-200KB (gzipped)

## Monitoring

### Server Status
The page shows clear error states:
- API connection errors
- Transcription failures
- Video generation errors

### Logs
Check browser DevTools (F12 → Console) for:
- Network requests
- API responses
- State changes (with React DevTools)

## Next Steps

1. **Customize Theme**: Edit `tailwind.config.js` colors
2. **Add Analytics**: Integrate Google Analytics or similar
3. **Implement Authentication**: Add user login if needed
4. **Add WebSocket**: Real-time progress updates (upgrade from polling)
5. **Offline Support**: Add service worker for offline capability

## Support

For issues:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Check backend logs for API errors
4. Verify environment configuration

## License

MIT
