# AI Video Generator

A full-stack AI video generation platform powered by Azure OpenAI Sora 2. Create stunning videos from text prompts or images with customizable aspect ratios, voice narration, and more.

## Features

- **Text-to-Video** — Generate videos from detailed text prompts (up to 4000 characters)
- **Image-to-Video** — Animate images into videos with AI
- **Voice Input** — Dictate your prompts using speech-to-text
- **Voice Narration** — Add AI-generated narration to your videos
- **Multiple Aspect Ratios** — 16:9 (Landscape), 9:16 (Portrait/Reels), 1:1 (Square), 4:5 (Social)
- **Adjustable Duration** — 5, 10, 15, or 20 second videos
- **Video History** — Browse and re-download all your generated videos

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, ES Modules
- **AI Services**: Azure OpenAI (Sora 2), Azure Speech Services
- **Storage**: Azure Blob Storage
- **Deployment**: Azure App Service

## Quick Start (Local Development)

```bash
# 1. Install dependencies
cd backend && npm install && cd ../frontend && npm install && cd ..

# 2. Create environment file
cp .env.example .env
# Edit .env with your Azure credentials (or leave DEMO_MODE=true)

# 3. Start both servers
cd backend && npm run dev &
cd frontend && npm run dev
```

The app runs at `http://localhost:3000` with the API at `http://localhost:4000`.

## Demo Mode

By default the app runs in **demo mode** (`DEMO_MODE=true`), which simulates video generation with sample videos. To enable real AI video generation, deploy Azure OpenAI Sora 2 and set `DEMO_MODE=false`.

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DEMO_MODE` | Set to `true` for demo mode | Yes |
| `PORT` | Backend port (default: 4000) | No |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint URL | For live mode |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API key | For live mode |
| `AZURE_OPENAI_SORA_DEPLOYMENT` | Sora 2 deployment name | For live mode |
| `AZURE_SPEECH_KEY` | Azure Speech Services key | For live mode |
| `AZURE_SPEECH_REGION` | Azure Speech Services region | For live mode |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Blob Storage connection | For live mode |
| `AZURE_STORAGE_CONTAINER` | Blob container name | For live mode |

## Deployment

See the Azure deployment section or use:

```bash
az webapp up --name your-app-name --resource-group your-rg --runtime "NODE:20-lts"
```

## License

MIT
