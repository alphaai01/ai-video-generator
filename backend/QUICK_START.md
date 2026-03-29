# Quick Start Guide

Get the AI Video Generator backend running in 5 minutes.

## Prerequisites

- Node.js 16+ installed
- npm or yarn
- Azure account with:
  - OpenAI resource with Sora 2 deployment
  - Speech Services resource
  - Blob Storage account

## Step 1: Setup Environment

```bash
# Clone/navigate to the backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

## Step 2: Configure Azure Credentials

Edit `.env` with your Azure credentials:

```bash
# Find these in Azure Portal

# OpenAI
AZURE_OPENAI_ENDPOINT=https://YOUR-RESOURCE.openai.azure.com
AZURE_OPENAI_API_KEY=your-api-key-here

# Speech Services
AZURE_SPEECH_KEY=your-speech-key
AZURE_SPEECH_REGION=eastus2  # or your region

# Blob Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=YOUR-ACCOUNT;AccountKey=YOUR-KEY;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER=ai-videos
```

## Step 3: Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

You should see:

```
╔════════════════════════════════════════════════════════════╗
║   AI Video Generator - Backend Service                    ║
╠════════════════════════════════════════════════════════════╣
║  Status:        Running
║  Port:          4000
║  Environment:   development
...
```

## Step 4: Test the API

### Generate a Video from Text

```bash
curl -X POST http://localhost:4000/api/video/generate-text \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset over the ocean",
    "duration": 5,
    "resolution": "1920x1080"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "jobId": "abc123...",
    "status": "succeeded",
    "videoUrl": "https://...",
    "blobName": "generated-video_...",
    "prompt": "A beautiful sunset over the ocean",
    "duration": 5,
    "resolution": "1920x1080"
  }
}
```

### Check Job Status

```bash
curl http://localhost:4000/api/video/status/abc123
```

### List Generated Videos

```bash
curl http://localhost:4000/api/video/list
```

### Convert Audio to Text

```bash
curl -X POST http://localhost:4000/api/speech/to-text \
  -F "audio=@your-audio-file.wav" \
  -F "language=en-US"
```

### Convert Text to Speech

```bash
curl -X POST http://localhost:4000/api/speech/to-audio \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is a test",
    "voice": "en-US-JennyNeural"
  }' \
  --output speech.wav
```

### Get Available Voices

```bash
curl http://localhost:4000/api/speech/available-voices?language=en-US
```

### Health Check

```bash
curl http://localhost:4000/health
```

## Step 5: Integrate with Frontend

Your frontend can now call the API. Example:

```javascript
// Generate video from text
const response = await fetch('http://localhost:4000/api/video/generate-text', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'A futuristic city with flying cars',
    duration: 5,
    resolution: '1920x1080'
  })
});

const data = await response.json();
const videoUrl = data.data.videoUrl; // Download the video
```

## Troubleshooting

### Port Already in Use

```bash
# Use a different port
PORT=5000 npm run dev
```

### Invalid Azure Credentials

- Double-check all values in `.env`
- Verify credentials in Azure Portal
- Ensure resources exist and are in correct regions

### Sora 2 Deployment Not Found

- Verify deployment name matches exactly: `AZURE_OPENAI_SORA_DEPLOYMENT`
- Check it exists in Azure OpenAI resource

### Storage Connection Issues

- Verify connection string format
- Check container name exists
- Test with Azure Storage Explorer

### File Upload Fails

- Check disk space
- Verify `./tmp/uploads` directory exists
- Check file size limits (100MB for video, 50MB for audio)

## Next Steps

1. Read the full [README.md](./README.md) for detailed API documentation
2. Configure CORS for your frontend domain
3. Set up monitoring and logging in production
4. Implement rate limiting
5. Deploy to Azure App Service or containerize with Docker

## Environment Variables Reference

```env
# Required
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_SORA_DEPLOYMENT=sora-2
AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=
AZURE_STORAGE_CONNECTION_STRING=
AZURE_STORAGE_CONTAINER=

# Optional
PORT=4000
NODE_ENV=development
CORS_ORIGIN=*
AZURE_OPENAI_API_VERSION=2025-04-01-preview
```

## Common Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/video/generate-text` | Generate video from text |
| POST | `/api/video/generate-image` | Generate video from image |
| GET | `/api/video/status/:jobId` | Check generation status |
| GET | `/api/video/download/:jobId` | Download generated video |
| GET | `/api/video/list` | List all videos |
| POST | `/api/speech/to-text` | Convert audio to text |
| POST | `/api/speech/to-audio` | Convert text to audio |
| GET | `/api/speech/available-voices` | Get voice options |
| GET | `/health` | Health check |
| GET | `/api/status` | API status |

## Support

- Check error codes in error responses
- Review console logs for detailed information
- Verify all environment variables are set correctly
- Check Azure resource limits and quotas
