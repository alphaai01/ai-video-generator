#!/bin/bash
# ===========================================
# AI Video Generator - GitHub + Azure Deploy
# ===========================================
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "========================================="
echo "  AI Video Generator - Deploy Script"
echo "========================================="
echo ""
echo "Project: $PROJECT_DIR"
echo ""

# ---- Step 1: Check prerequisites ----
echo "[1/5] Checking prerequisites..."

if ! command -v git &> /dev/null; then
    echo "❌ git is not installed. Install it with: brew install git"
    exit 1
fi
echo "  ✅ git found"

if ! command -v gh &> /dev/null; then
    echo "⚠️  GitHub CLI (gh) not found. Install it with: brew install gh"
    echo "    Alternatively, create the repo manually on github.com"
    GH_AVAILABLE=false
else
    echo "  ✅ GitHub CLI found"
    GH_AVAILABLE=true
fi

if ! command -v az &> /dev/null; then
    echo "⚠️  Azure CLI (az) not found. Install it with: brew install azure-cli"
    AZ_AVAILABLE=false
else
    echo "  ✅ Azure CLI found"
    AZ_AVAILABLE=true
fi

echo ""

# ---- Step 2: Initialize Git repo ----
echo "[2/5] Initializing Git repository..."

if [ -d ".git" ]; then
    echo "  Git repo already exists, adding new changes..."
    git add -A
    git commit -m "Update: deployment configs and production build setup" --allow-empty
else
    git init
    git branch -m main
    git add -A
    git commit -m "Initial commit: AI Video Generator with Azure Sora 2"
fi
echo "  ✅ Git repo ready"
echo ""

# ---- Step 3: Push to GitHub ----
echo "[3/5] Pushing to GitHub..."

if [ "$GH_AVAILABLE" = true ]; then
    # Check if already authenticated
    if ! gh auth status &> /dev/null; then
        echo "  You need to authenticate with GitHub first."
        echo "  Running: gh auth login"
        gh auth login
    fi

    # Check if remote already exists
    if git remote get-url origin &> /dev/null; then
        echo "  Remote 'origin' already exists, pushing..."
        git push -u origin main
    else
        echo "  Creating GitHub repository..."
        gh repo create ai-video-generator --public --source=. --push
    fi
    echo "  ✅ Code pushed to GitHub"
else
    echo "  ⚠️  Skipping GitHub push (gh CLI not installed)"
    echo "  Install with: brew install gh"
    echo "  Then run: gh auth login && gh repo create ai-video-generator --public --source=. --push"
fi
echo ""

# ---- Step 4: Deploy to Azure ----
echo "[4/5] Deploying to Azure App Service..."

if [ "$AZ_AVAILABLE" = true ]; then
    # Check if logged in
    if ! az account show &> /dev/null; then
        echo "  You need to login to Azure first."
        az login
    fi

    APP_NAME="ai-video-gen-sumit"
    RG_NAME="ai-video-rg"

    echo "  App Name: $APP_NAME"
    echo "  Resource Group: $RG_NAME"
    echo ""

    # Create resource group
    echo "  Creating resource group..."
    az group create --name $RG_NAME --location eastus --output none 2>/dev/null || true

    # Deploy with az webapp up
    echo "  Deploying app (this may take 3-5 minutes)..."
    az webapp up \
        --name $APP_NAME \
        --resource-group $RG_NAME \
        --runtime "NODE:20-lts" \
        --sku B1

    # Configure app settings
    echo "  Configuring environment variables..."
    az webapp config appsettings set \
        --name $APP_NAME \
        --resource-group $RG_NAME \
        --settings \
            DEMO_MODE=true \
            NODE_ENV=production \
            PORT=8080 \
            SCM_DO_BUILD_DURING_DEPLOYMENT=true \
        --output none

    # Set startup command
    echo "  Setting startup command..."
    az webapp config set \
        --name $APP_NAME \
        --resource-group $RG_NAME \
        --startup-file "startup.sh" \
        --output none

    # Restart
    echo "  Restarting app..."
    az webapp restart --name $APP_NAME --resource-group $RG_NAME

    echo ""
    echo "  ✅ Deployed to Azure!"
    echo ""
    echo "========================================="
    echo "  🎉 Your app is live at:"
    echo "  https://$APP_NAME.azurewebsites.net"
    echo "========================================="
else
    echo "  ⚠️  Skipping Azure deploy (az CLI not installed)"
    echo "  Install with: brew install azure-cli"
    echo "  Then run this script again."
fi

echo ""
echo "[5/5] Done! Summary:"
echo "  - GitHub: Check your repos at https://github.com"
echo "  - Azure:  https://$APP_NAME.azurewebsites.net"
echo ""
