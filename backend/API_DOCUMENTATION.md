# API Documentation

Complete API reference for AI Video Generator backend.

## Base URL

```
http://localhost:4000
```

## Authentication

Currently no authentication required. For production, implement:
- API key authentication
- OAuth 2.0
- JWT tokens

## Content Types

All requests should use:
- `Content-Type: application/json` for JSON payloads
- `Content-Type: multipart/form-data` for file uploads

## Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "data": {
    // Response-specific data
  }
}
```

All error responses follow this format:

```json
{
  "success": false,
  "errorId": "unique-uuid",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {}
}
```

## Video API

### Generate Video from Text

Generates a video from a text prompt using Sora 2.

**Endpoint:**
```
POST /api/video/generate-text
```

**Request Body:**
```json
{
  "prompt": "A futuristic city with flying cars at night",
  "duration": 5,
  "resolution": "1920x1080"
}
```

**Parameters:**
| Name | Type | Required | Default | Notes |
|------|------|----------|---------|-------|
| prompt | string | Yes | - | Max 4000 characters |
| duration | number | No | 5 | 1-60 seconds |
| resolution | string | No | 1920x1080 | 1920x1080, 1280x720, 864x480, 512x512 |

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job-uuid",
    "status": "succeeded",
    "videoUrl": "https://storage.blob.core.windows.net/...",
    "blobName": "generated-video_timestamp_uuid.mp4",
    "size": 5242880,
    "prompt": "A futuristic city with flying cars at night",
    "duration": 5,
    "resolution": "1920x1080"
  }
}
```

**Status Codes:**
- `200` - Video generated successfully
- `400` - Invalid input parameters
- `500` - Video generation failed
- `503` - Azure service unavailable

**Example:**
```bash
curl -X POST http://localhost:4000/api/video/generate-text \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "duration": 5,
    "resolution": "1920x1080"
  }'
```

---

### Generate Video from Image

Generates a video from an image and text prompt using Sora 2.

**Endpoint:**
```
POST /api/video/generate-image
```

**Request:**
```
Content-Type: multipart/form-data

- image: (file, required) Image file (JPG, PNG, GIF, WebP)
- prompt: (string, required) Video generation prompt
- duration: (number, optional) Duration in seconds (default: 5)
- resolution: (string, optional) Resolution (default: 1920x1080)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job-uuid",
    "status": "succeeded",
    "videoUrl": "https://storage.blob.core.windows.net/...",
    "blobName": "generated-video_...",
    "size": 5242880,
    "sourceImage": "image.jpg",
    "prompt": "...",
    "duration": 5,
    "resolution": "1920x1080"
  }
}
```

**Constraints:**
- Image size: <= 100 MB
- Supported formats: JPEG, PNG, GIF, WebP
- Prompt: <= 4000 characters
- Duration: 1-60 seconds

**Example:**
```bash
curl -X POST http://localhost:4000/api/video/generate-image \
  -F "image=@image.jpg" \
  -F "prompt=Transform this image into an animated scene" \
  -F "duration=5" \
  -F "resolution=1920x1080"
```

---

### Check Video Generation Status

Checks the status of a video generation job.

**Endpoint:**
```
GET /api/video/status/:jobId
```

**Path Parameters:**
| Name | Type | Required |
|------|------|----------|
| jobId | string | Yes |

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job-uuid",
    "status": "notstarted|running|succeeded|failed",
    "createdAt": "2025-01-01T00:00:00Z",
    "expiresAt": "2025-01-08T00:00:00Z",
    "generations": [
      {
        "id": "gen-id",
        "url": "https://..."
      }
    ],
    "error": null
  }
}
```

**Status Values:**
- `notstarted` - Job queued, not yet started
- `running` - Generation in progress
- `succeeded` - Video generated successfully
- `failed` - Generation failed

**Example:**
```bash
curl http://localhost:4000/api/video/status/abc123-def456
```

---

### Download Generated Video

Downloads the generated video file.

**Endpoint:**
```
GET /api/video/download/:jobId
```

**Path Parameters:**
| Name | Type | Required |
|------|------|----------|
| jobId | string | Yes |

**Response:**
- Content-Type: `video/mp4`
- Binary video file

**Status Codes:**
- `200` - Video downloaded
- `400` - Job not completed
- `404` - Job not found
- `500` - Download failed

**Example:**
```bash
curl http://localhost:4000/api/video/download/abc123 \
  --output video.mp4
```

---

### List Generated Videos

Lists all generated videos stored in blob storage.

**Endpoint:**
```
GET /api/video/list
```

**Query Parameters:**
| Name | Type | Default | Notes |
|------|------|---------|-------|
| limit | number | 50 | Max results to return |
| offset | number | 0 | Pagination offset |

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5,
    "videos": [
      {
        "name": "generated-video_1234567890_uuid.mp4",
        "size": 5242880,
        "created": "2025-01-01T00:00:00Z",
        "modified": "2025-01-01T00:00:00Z",
        "url": "https://storage.blob.core.windows.net/...(SAS)"
      }
    ]
  }
}
```

**Example:**
```bash
curl "http://localhost:4000/api/video/list?limit=10&offset=0"
```

---

### Validate Prompt

Validates a video prompt without generating a video.

**Endpoint:**
```
POST /api/video/validate-prompt
```

**Request Body:**
```json
{
  "prompt": "A test prompt"
}
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "prompt": "A test prompt",
  "length": 14
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/api/video/validate-prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Test"}'
```

---

## Speech API

### Convert Audio to Text

Converts audio file to text using speech recognition.

**Endpoint:**
```
POST /api/speech/to-text
```

**Request:**
```
Content-Type: multipart/form-data

- audio: (file, required) Audio file (WAV, MP3, FLAC, AAC, OGG)
- language: (string, optional) Language code (default: en-US)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "text": "Transcribed text from the audio file",
    "language": "en-US",
    "sourceFile": "audio.wav",
    "audioSize": 1024000
  }
}
```

**Supported Languages:**
- `en-US` (US English)
- `en-GB` (British English)
- `es-ES` (Spanish)
- `fr-FR` (French)
- `de-DE` (German)
- `it-IT` (Italian)
- `ja-JP` (Japanese)
- `zh-CN` (Mandarin Chinese)
- `ko-KR` (Korean)

**Constraints:**
- Audio size: <= 50 MB
- Supported formats: WAV, MP3, FLAC, AAC, OGG

**Example:**
```bash
curl -X POST http://localhost:4000/api/speech/to-text \
  -F "audio=@recording.wav" \
  -F "language=en-US"
```

---

### Convert Text to Speech

Converts text to audio using text-to-speech.

**Endpoint:**
```
POST /api/speech/to-audio
```

**Request Body:**
```json
{
  "text": "Hello, this is a test message",
  "voice": "en-US-JennyNeural"
}
```

**Parameters:**
| Name | Type | Required | Default | Notes |
|------|------|----------|---------|-------|
| text | string | Yes | - | Max 5000 characters |
| voice | string | No | en-US-JennyNeural | See available voices endpoint |

**Response:**
- Content-Type: `audio/wav`
- Binary audio file

**Popular Voices:**
- `en-US-JennyNeural` (Female, young, friendly)
- `en-US-GuyNeural` (Male, conversational)
- `en-US-AriaNeural` (Female, professional)
- `en-GB-SoniaNeural` (British female)
- `es-ES-ConchitaNeural` (Spanish female)
- `fr-FR-DeniseNeural` (French female)
- `de-DE-GiselaNeural` (German female)

**Example:**
```bash
curl -X POST http://localhost:4000/api/speech/to-audio \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello world",
    "voice": "en-US-JennyNeural"
  }' \
  --output speech.wav
```

---

### Get Available Voices

Returns list of available voices for text-to-speech.

**Endpoint:**
```
GET /api/speech/available-voices
```

**Query Parameters:**
| Name | Type | Optional | Notes |
|------|------|----------|-------|
| language | string | Yes | Language code (e.g., en-US) |

**Response (All Languages):**
```json
{
  "success": true,
  "data": {
    "voices": {
      "en-US": ["en-US-JennyNeural", "en-US-GuyNeural", ...],
      "en-GB": ["en-GB-SoniaNeural", ...],
      "es-ES": ["es-ES-ConchitaNeural", ...],
      ...
    },
    "language": "all",
    "count": 150
  }
}
```

**Response (Specific Language):**
```json
{
  "success": true,
  "data": {
    "voices": [
      "en-US-JennyNeural",
      "en-US-GuyNeural",
      "en-US-AriaNeural"
    ],
    "language": "en-US",
    "count": 3
  }
}
```

**Example:**
```bash
# Get all voices
curl http://localhost:4000/api/speech/available-voices

# Get voices for specific language
curl http://localhost:4000/api/speech/available-voices?language=en-US
```

---

### Validate Text

Validates text for text-to-speech without synthesizing.

**Endpoint:**
```
POST /api/speech/validate-text
```

**Request Body:**
```json
{
  "text": "Text to validate"
}
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "text": "Text to validate",
  "length": 15,
  "estimatedDuration": "1 seconds"
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/api/speech/validate-text \
  -H "Content-Type: application/json" \
  -d '{"text": "Test"}'
```

---

### Validate Voice

Validates a voice identifier.

**Endpoint:**
```
POST /api/speech/validate-voice
```

**Request Body:**
```json
{
  "voice": "en-US-JennyNeural"
}
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "voice": "en-US-JennyNeural",
  "available": true,
  "language": "en-US"
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/api/speech/validate-voice \
  -H "Content-Type: application/json" \
  -d '{"voice": "en-US-JennyNeural"}'
```

---

### Speech Service Health

Checks health of speech service.

**Endpoint:**
```
GET /api/speech/health
```

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "voicesAvailable": 150
}
```

**Example:**
```bash
curl http://localhost:4000/api/speech/health
```

---

## System Endpoints

### Health Check

General server health check.

**Endpoint:**
```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 1234.56,
  "environment": "development"
}
```

---

### API Status

Get overall API status and available endpoints.

**Endpoint:**
```
GET /api/status
```

**Response:**
```json
{
  "success": true,
  "status": "operational",
  "version": "1.0.0",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "endpoints": {
    "video": "/api/video",
    "speech": "/api/speech"
  }
}
```

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Input validation failed |
| FILE_UPLOAD_ERROR | 400 | File upload failed |
| NOT_FOUND | 404 | Resource not found |
| JOB_NOT_COMPLETED | 400 | Video generation job not completed |
| AUTHENTICATION_ERROR | 401 | Authentication failed |
| VIDEO_GENERATION_ERROR | 500 | Sora 2 video generation failed |
| SPEECH_TO_TEXT_ERROR | 500 | Speech recognition failed |
| TEXT_TO_SPEECH_ERROR | 500 | Speech synthesis failed |
| STATUS_CHECK_ERROR | 500 | Status polling failed |
| DOWNLOAD_ERROR | 500 | Video download failed |
| LIST_ERROR | 500 | Failed to list videos |
| EXTERNAL_SERVICE_ERROR | 5xx | Azure service error |
| SERVICE_UNAVAILABLE | 503 | Azure service unavailable |
| INTERNAL_ERROR | 500 | Unexpected server error |

---

## Rate Limiting (Future)

Future versions will implement:
- 100 requests per minute per IP
- 10 concurrent video generations per user
- 1000 requests per hour per user

---

## Pagination

Endpoints supporting pagination use:

```
GET /api/endpoint?limit=50&offset=0
```

- `limit`: Number of results (default: 50, max: 100)
- `offset`: Number of items to skip (default: 0)

---

## Filtering & Sorting (Future)

Future versions will support:

```
GET /api/video/list?sort=created&order=desc&status=succeeded
```

---

## Webhooks (Future)

Future versions will support webhooks for:
- Video generation completion
- Generation failures
- Status updates

---

## SDK/Client Libraries

Recommended clients:
- **JavaScript**: Fetch API or Axios
- **Python**: requests or httpx
- **cURL**: For testing and debugging

---

## Best Practices

1. **Always validate prompts** before sending to generation endpoints
2. **Poll status with backoff** to avoid rate limiting
3. **Cache voice lists** to reduce API calls
4. **Use exponential backoff** for retries
5. **Handle errors gracefully** with appropriate user feedback
6. **Clean up temporary files** after processing
7. **Use SAS URLs** with time limits for downloads
8. **Monitor API quotas** in Azure Portal

---

## Changelog

### v1.0.0 (Current)
- Initial release
- Video generation from text
- Video generation from image
- Speech-to-text conversion
- Text-to-speech synthesis
- Blob storage integration
- Error handling and validation

### v1.1.0 (Planned)
- Authentication/Authorization
- Rate limiting
- Webhook support
- Advanced filtering
- Batch operations
- Video editing
- Audio effects

### v2.0.0 (Planned)
- SDKs for popular languages
- GraphQL API
- Real-time WebSocket updates
- Advanced analytics
- Cost tracking
