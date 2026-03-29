# AI Video Generator - Backend Service

A production-ready Node.js/Express backend for generating AI videos using Azure OpenAI Sora 2, Azure Speech Services, and Azure Blob Storage.

## Features

- **Text-to-Video Generation**: Generate videos from text prompts using Sora 2
- **Image-to-Video Generation**: Generate videos from images with text prompts
- **Async Job Polling**: Poll job status with exponential backoff
- **Speech-to-Text**: Convert audio files to text using Azure Speech Services
- **Text-to-Speech**: Generate audio from text with multiple voice options
- **Azure Blob Storage**: Persistent storage for videos and images
- **Comprehensive Error Handling**: Custom error classes and global error handler
- **Request Validation**: Input validation for all endpoints
- **Production-Ready**: Logging, CORS, graceful shutdown, and health checks

## Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- Azure subscription with:
  - Azure OpenAI Sora 2 deployment
  - Azure Speech Services
  - Azure Blob Storage account

## Installation

1. Clone the repository and navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

4. Configure environment variables:

```env
PORT=4000
NODE_ENV=development

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_SORA_DEPLOYMENT=sora-2
AZURE_OPENAI_API_VERSION=2025-04-01-preview

# Azure Speech Services
AZURE_SPEECH_KEY=your-speech-key
AZURE_SPEECH_REGION=eastus2

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=your-connection-string
AZURE_STORAGE_CONTAINER=ai-videos
```

## Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:4000`

## API Endpoints

### Video Generation

#### Generate Video from Text
```
POST /api/video/generate-text
Content-Type: application/json

{
  "prompt": "A futuristic city with flying cars",
  "duration": 5,
  "resolution": "1920x1080"
}

Response:
{
  "success": true,
  "data": {
    "jobId": "abc123...",
    "status": "succeeded",
    "videoUrl": "https://storage.blob.core.windows.net/...",
    "blobName": "generated-video_...",
    "size": 5242880,
    "prompt": "...",
    "duration": 5,
    "resolution": "1920x1080"
  }
}
```

#### Generate Video from Image
```
POST /api/video/generate-image
Content-Type: multipart/form-data

Fields:
- image: (file) image file (JPG, PNG, GIF, WebP)
- prompt: (text) Video generation prompt
- duration: (number, optional) Duration in seconds (default: 5)
- resolution: (string, optional) Resolution (default: 1920x1080)

Response: Same as text generation
```

#### Check Video Generation Status
```
GET /api/video/status/:jobId

Response:
{
  "success": true,
  "data": {
    "jobId": "abc123...",
    "status": "running|succeeded|failed",
    "createdAt": "2025-01-01T00:00:00Z",
    "expiresAt": "2025-01-08T00:00:00Z",
    "generations": [...],
    "error": null
  }
}
```

#### Download Generated Video
```
GET /api/video/download/:jobId

Response: Video file (mp4)
```

#### List All Generated Videos
```
GET /api/video/list?limit=50&offset=0

Response:
{
  "success": true,
  "data": {
    "count": 10,
    "videos": [
      {
        "name": "generated-video_...",
        "size": 5242880,
        "created": "2025-01-01T00:00:00Z",
        "modified": "2025-01-01T00:00:00Z",
        "url": "https://..."
      }
    ]
  }
}
```

#### Validate Prompt
```
POST /api/video/validate-prompt
Content-Type: application/json

{
  "prompt": "A test video prompt"
}

Response:
{
  "success": true,
  "valid": true,
  "prompt": "...",
  "length": 20
}
```

### Speech Services

#### Convert Speech to Text
```
POST /api/speech/to-text
Content-Type: multipart/form-data

Fields:
- audio: (file) Audio file (WAV, MP3, FLAC, AAC, OGG)
- language: (text, optional) Language code (default: en-US)

Response:
{
  "success": true,
  "data": {
    "text": "Transcribed text from audio",
    "language": "en-US",
    "sourceFile": "audio.wav",
    "audioSize": 1024000
  }
}
```

#### Convert Text to Speech
```
POST /api/speech/to-audio
Content-Type: application/json

{
  "text": "Hello, this is a test",
  "voice": "en-US-JennyNeural"
}

Response: Audio file (wav)
```

#### Get Available Voices
```
GET /api/speech/available-voices?language=en-US

Response:
{
  "success": true,
  "data": {
    "voices": ["en-US-JennyNeural", "en-US-GuyNeural", ...],
    "language": "en-US",
    "count": 15
  }
}
```

#### Validate Text
```
POST /api/speech/validate-text
Content-Type: application/json

{
  "text": "Text to validate"
}

Response:
{
  "success": true,
  "valid": true,
  "text": "...",
  "length": 15,
  "estimatedDuration": "1 seconds"
}
```

#### Validate Voice
```
POST /api/speech/validate-voice
Content-Type: application/json

{
  "voice": "en-US-JennyNeural"
}

Response:
{
  "success": true,
  "valid": true,
  "voice": "en-US-JennyNeural",
  "available": true,
  "language": "en-US"
}
```

#### Speech Service Health Check
```
GET /api/speech/health

Response:
{
  "success": true,
  "status": "healthy",
  "voicesAvailable": 6
}
```

### General

#### Health Check
```
GET /health

Response:
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00Z",
  "uptime": 123.45,
  "environment": "development"
}
```

#### API Status
```
GET /api/status

Response:
{
  "success": true,
  "status": "operational",
  "version": "1.0.0",
  "timestamp": "2025-01-01T00:00:00Z",
  "endpoints": {
    "video": "/api/video",
    "speech": "/api/speech"
  }
}
```

## Error Handling

The API returns structured error responses:

```json
{
  "success": false,
  "errorId": "uuid",
  "timestamp": "2025-01-01T00:00:00Z",
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {}
}
```

### Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Resource not found
- `AUTHENTICATION_ERROR`: Authentication failed
- `VIDEO_GENERATION_ERROR`: Video generation failed
- `SPEECH_TO_TEXT_ERROR`: Speech-to-text conversion failed
- `TEXT_TO_SPEECH_ERROR`: Text-to-speech conversion failed
- `FILE_UPLOAD_ERROR`: File upload failed
- `SERVICE_UNAVAILABLE`: Azure service unavailable
- `INTERNAL_ERROR`: Unexpected server error

## Configuration

### Supported Resolutions
- `1920x1080` (Full HD)
- `1280x720` (HD)
- `864x480` (SD)
- `512x512` (Square)

### Video Duration
- Minimum: 1 second
- Maximum: 60 seconds

### Prompt Length
- Maximum: 4000 characters

### Text-to-Speech Length
- Maximum: 5000 characters

## Architecture

### Services

- **VideoService**: Handles Sora 2 API interactions (generation, polling, download)
- **SpeechService**: Handles Azure Speech Services (STT and TTS)
- **StorageService**: Handles Azure Blob Storage operations

### Middleware

- **CORS**: Cross-origin request handling
- **Morgan**: HTTP request logging
- **Express Async Errors**: Automatic error catching for async routes
- **Custom Error Handler**: Centralized error handling and formatting

### Utilities

- **helpers.js**: Validation functions, file utilities, retry logic
- **errorHandler.js**: Custom error classes and global error middleware

## Logging

The server uses Morgan for HTTP request logging and custom console logging for service operations.

Log levels:
- `INFO`: Normal operations
- `WARN`: Non-critical issues
- `ERROR`: Critical errors

## File Uploads

- Maximum file size: 100 MB for videos, 50 MB for audio
- Upload directory: `./tmp/uploads` (temporary storage)
- Files are automatically cleaned up after processing

## Security Considerations

1. **Environment Variables**: All sensitive data (API keys, connection strings) must be in `.env`
2. **CORS**: Configure allowed origins in production
3. **Rate Limiting**: Consider implementing rate limiting for production
4. **Input Validation**: All user inputs are validated
5. **File Upload Validation**: File type and size validation
6. **Error Messages**: Production error messages don't expose sensitive details

## Performance

- **Async Operations**: All I/O operations use async/await
- **Exponential Backoff**: Polling includes exponential backoff to reduce API calls
- **SAS URLs**: Time-limited download URLs for security
- **Stream Processing**: Large files processed as streams

## Deployment

### Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 4000

CMD ["node", "src/server.js"]
```

Build and run:

```bash
docker build -t ai-video-gen-backend .
docker run -p 4000:4000 --env-file .env ai-video-gen-backend
```

### Azure App Service

1. Configure `.env` variables in Azure App Service Application Settings
2. Deploy using Git, GitHub Actions, or Azure DevOps
3. Set `NODE_ENV=production` in application settings

## Troubleshooting

### Azure OpenAI Sora 2 Connection Issues

- Verify endpoint URL and API key
- Check if Sora 2 deployment exists
- Ensure API version is correct
- Check Azure firewall/network settings

### Storage Connection Issues

- Verify connection string format
- Check storage account credentials
- Ensure container exists
- Check storage account access policies

### Speech Services Issues

- Verify region matches subscription
- Check API key validity
- Ensure speech resource is in supported region
- Check system audio/microphone for TTS

### File Upload Issues

- Check available disk space
- Verify file permissions on `./tmp/uploads`
- Ensure file size is within limits
- Check MIME type is supported

## Contributing

Follow these guidelines:

1. Use async/await for asynchronous operations
2. Add JSDoc comments to all functions
3. Implement proper error handling
4. Add input validation
5. Log important operations
6. Test with different Azure configurations

## License

MIT

## Support

For issues or questions, please refer to Azure documentation:

- [Azure OpenAI Sora 2](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models)
- [Azure Speech Services](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/)
- [Azure Blob Storage](https://learn.microsoft.com/en-us/azure/storage/blobs/)
