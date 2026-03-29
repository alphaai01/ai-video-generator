#!/bin/bash
# Push AI Video Generator to GitHub
# Run this from the ai-video-gen folder

echo "=== Pushing AI Video Generator to GitHub ==="

# Stage all files (new audio component + deploy script)
git add -A

# Create initial commit
git commit -m "Initial commit: AI Video & Audio Generator

- Video generation with Azure OpenAI Sora 2
- AI Audio Studio with 50+ voices in 12 languages
- Voice style, speed, and pitch controls
- Next.js 14 frontend + Express.js backend
- Azure Speech Services integration
- Azure Blob Storage for video persistence"

# Set branch to main
git branch -M main

# Add remote origin
git remote add origin https://github.com/alphaai01/ai-video-generator.git 2>/dev/null || git remote set-url origin https://github.com/alphaai01/ai-video-generator.git

# Push to GitHub
git push -u origin main

echo ""
echo "=== Done! Your code is now on GitHub ==="
echo "Visit: https://github.com/alphaai01/ai-video-generator"
