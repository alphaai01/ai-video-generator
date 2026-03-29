# Deployment Guide

Complete guide for deploying the AI Video Generator backend to production environments.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Azure App Service](#azure-app-service)
4. [Environment Configuration](#environment-configuration)
5. [Monitoring & Logging](#monitoring--logging)
6. [Performance Tuning](#performance-tuning)
7. [Security Hardening](#security-hardening)
8. [Scaling](#scaling)

---

## Local Development

### Setup

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your credentials
nano .env

# Start development server
npm run dev
```

The server starts at `http://localhost:4000`

### Development Tools

- **Hot Reload**: Nodemon automatically restarts on file changes
- **Logging**: Morgan logs all HTTP requests
- **Error Details**: Full stack traces in development mode

---

## Docker Deployment

### Create Dockerfile

Create `Dockerfile` in the backend root:

```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create tmp directory for uploads
RUN mkdir -p tmp/uploads

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "src/server.js"]
```

### Create .dockerignore

```
node_modules
npm-debug.log
.git
.gitignore
.env
.env.local
tmp
uploads
.vscode
.idea
README.md
DEPLOYMENT.md
QUICK_START.md
API_DOCUMENTATION.md
```

### Build and Run

```bash
# Build image
docker build -t ai-video-gen-backend:latest .

# Run container
docker run -p 4000:4000 \
  -e AZURE_OPENAI_ENDPOINT=https://... \
  -e AZURE_OPENAI_API_KEY=... \
  -e AZURE_SPEECH_KEY=... \
  -e AZURE_SPEECH_REGION=eastus2 \
  -e AZURE_STORAGE_CONNECTION_STRING=... \
  -e AZURE_STORAGE_CONTAINER=ai-videos \
  -e NODE_ENV=production \
  ai-video-gen-backend:latest

# Or with .env file
docker run -p 4000:4000 \
  --env-file .env \
  ai-video-gen-backend:latest
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "4000:4000"
    environment:
      NODE_ENV: production
      AZURE_OPENAI_ENDPOINT: ${AZURE_OPENAI_ENDPOINT}
      AZURE_OPENAI_API_KEY: ${AZURE_OPENAI_API_KEY}
      AZURE_OPENAI_SORA_DEPLOYMENT: ${AZURE_OPENAI_SORA_DEPLOYMENT}
      AZURE_SPEECH_KEY: ${AZURE_SPEECH_KEY}
      AZURE_SPEECH_REGION: ${AZURE_SPEECH_REGION}
      AZURE_STORAGE_CONNECTION_STRING: ${AZURE_STORAGE_CONNECTION_STRING}
      AZURE_STORAGE_CONTAINER: ${AZURE_STORAGE_CONTAINER}
    volumes:
      - ./tmp:/app/tmp
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s
```

Run with:

```bash
docker-compose up -d
```

---

## Azure App Service

### Prerequisites

- Azure subscription
- Azure CLI installed: `az --version`
- Resource group created

### Deployment Steps

#### 1. Create App Service Plan

```bash
az appservice plan create \
  --name ai-video-gen-plan \
  --resource-group your-resource-group \
  --sku B2 \
  --is-linux
```

#### 2. Create Web App

```bash
az webapp create \
  --resource-group your-resource-group \
  --plan ai-video-gen-plan \
  --name ai-video-gen-backend \
  --runtime "NODE|18-lts"
```

#### 3. Configure Environment Variables

```bash
az webapp config appsettings set \
  --resource-group your-resource-group \
  --name ai-video-gen-backend \
  --settings \
  NODE_ENV=production \
  AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com" \
  AZURE_OPENAI_API_KEY="your-api-key" \
  AZURE_OPENAI_SORA_DEPLOYMENT="sora-2" \
  AZURE_SPEECH_KEY="your-speech-key" \
  AZURE_SPEECH_REGION="eastus2" \
  AZURE_STORAGE_CONNECTION_STRING="your-connection-string" \
  AZURE_STORAGE_CONTAINER="ai-videos" \
  PORT=8080
```

#### 4. Deploy Code

**Option A: Using Git**

```bash
# Configure Git deployment
az webapp deployment user set \
  --user-name your-username \
  --password your-password

# Add remote
git remote add azure https://your-username@ai-video-gen-backend.scm.azurewebsites.net:443/ai-video-gen-backend.git

# Deploy
git push azure main
```

**Option B: Using ZIP**

```bash
# Create deployment package
zip -r deploy.zip . -x "node_modules/*" ".git/*" ".env" "tmp/*"

# Deploy
az webapp deployment source config-zip \
  --resource-group your-resource-group \
  --name ai-video-gen-backend \
  --src-path deploy.zip
```

**Option C: Using Docker**

```bash
# Create container registry
az acr create \
  --resource-group your-resource-group \
  --name aivideoregistry \
  --sku Basic

# Build and push image
az acr build \
  --registry aivideoregistry \
  --image ai-video-gen-backend:latest .

# Configure web app for Docker
az webapp config container set \
  --resource-group your-resource-group \
  --name ai-video-gen-backend \
  --docker-custom-image-name aivideoregistry.azurecr.io/ai-video-gen-backend:latest \
  --docker-registry-server-url https://aivideoregistry.azurecr.io \
  --docker-registry-server-user username \
  --docker-registry-server-password password
```

#### 5. Start App

```bash
az webapp start \
  --resource-group your-resource-group \
  --name ai-video-gen-backend
```

#### 6. View Logs

```bash
az webapp log tail \
  --resource-group your-resource-group \
  --name ai-video-gen-backend \
  --provider application
```

---

## Environment Configuration

### Production Settings

```env
NODE_ENV=production
PORT=8080
LOG_LEVEL=warn

# Azure Services (use managed identities where possible)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=<use Azure Key Vault>
AZURE_OPENAI_SORA_DEPLOYMENT=sora-2
AZURE_OPENAI_API_VERSION=2025-04-01-preview

AZURE_SPEECH_KEY=<use Azure Key Vault>
AZURE_SPEECH_REGION=eastus2

AZURE_STORAGE_CONNECTION_STRING=<use Azure Key Vault>
AZURE_STORAGE_CONTAINER=ai-videos

# Networking
CORS_ORIGIN=https://yourdomain.com

# Performance
NODE_ENV=production
```

### Using Azure Key Vault

```bash
# Store secret
az keyvault secret set \
  --vault-name your-key-vault \
  --name AZURE-OPENAI-API-KEY \
  --value your-api-key

# Reference in App Service
az webapp config appsettings set \
  --resource-group your-resource-group \
  --name ai-video-gen-backend \
  --settings AZURE_OPENAI_API_KEY="@Microsoft.KeyVault(SecretUri=https://your-key-vault.vault.azure.net/secrets/AZURE-OPENAI-API-KEY/)"
```

---

## Monitoring & Logging

### Enable Application Insights

```bash
# Create Application Insights resource
az monitor app-insights component create \
  --app ai-video-gen-insights \
  --location eastus2 \
  --resource-group your-resource-group

# Link to App Service
az webapp config appsettings set \
  --resource-group your-resource-group \
  --name ai-video-gen-backend \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY="your-instrumentation-key"
```

### Setup Alerts

```bash
# Create alert for high error rate
az monitor metrics alert create \
  --name HighErrorRate \
  --resource-group your-resource-group \
  --scopes /subscriptions/{subscription-id}/resourceGroups/your-resource-group/providers/Microsoft.Web/sites/ai-video-gen-backend \
  --condition "avg http5xx > 10" \
  --description "Alert when error rate exceeds 10 per minute" \
  --evaluation-frequency 1m \
  --window-size 1m \
  --action email-action
```

### View Metrics

```bash
# CPU Usage
az monitor metrics list \
  --resource /subscriptions/{id}/resourceGroups/{group}/providers/Microsoft.Web/sites/ai-video-gen-backend \
  --metric CpuTime \
  --start-time 2025-01-01T00:00:00Z

# Response Time
az monitor metrics list \
  --resource /subscriptions/{id}/resourceGroups/{group}/providers/Microsoft.Web/sites/ai-video-gen-backend \
  --metric ResponseTime
```

---

## Performance Tuning

### Node.js Optimization

```javascript
// In server.js before starting server
if (process.env.NODE_ENV === 'production') {
  // Enable cluster mode for multi-core systems
  const cluster = require('cluster');
  const os = require('os');

  if (cluster.isMaster) {
    const numCPUs = os.cpus().length;
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }
  } else {
    // Start server in worker process
  }
}
```

### Memory Optimization

```env
# Increase Node memory limit if needed
NODE_OPTIONS=--max-old-space-size=2048
```

### Timeout Configuration

```javascript
// Set appropriate timeouts for long-running operations
app.get('/api/video/generate-text', (req, res) => {
  const timeout = 10 * 60 * 1000; // 10 minutes
  req.setTimeout(timeout);
  // ... handler code
});
```

### Database Connection Pooling

Currently not needed (no database), but for future versions:

```javascript
// Example for PostgreSQL
const pool = new Pool({
  max: 20, // connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## Security Hardening

### 1. Enable HTTPS

```bash
# Azure App Service: Let's Encrypt (automatic)
az webapp config set \
  --resource-group your-resource-group \
  --name ai-video-gen-backend \
  --https-only true
```

### 2. Set Security Headers

Add to `server.js`:

```javascript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});
```

### 3. Implement Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 4. Input Sanitization

Already implemented via validation functions in `helpers.js`

### 5. Secrets Management

- Use Azure Key Vault for all secrets
- Never commit `.env` to version control
- Rotate credentials regularly
- Use managed identities where possible

### 6. Network Security

```bash
# Configure virtual network integration
az webapp vnet-integration add \
  --resource-group your-resource-group \
  --name ai-video-gen-backend \
  --vnet your-vnet \
  --subnet backend-subnet

# Configure firewall
az webapp waf policy create \
  --name ai-video-gen-waf \
  --resource-group your-resource-group \
  --type Microsoft_ApplicationGateway
```

---

## Scaling

### Horizontal Scaling (App Service Plan)

```bash
# Scale up (more powerful instance)
az appservice plan update \
  --resource-group your-resource-group \
  --name ai-video-gen-plan \
  --sku P1V2

# Scale out (more instances)
az appservice plan update \
  --resource-group your-resource-group \
  --name ai-video-gen-plan \
  --number-of-workers 3
```

### Auto-scaling Rules

```bash
# Create auto-scale setting
az monitor autoscale create \
  --resource-group your-resource-group \
  --resource-type "Microsoft.Web/serverfarms" \
  --resource-name ai-video-gen-plan \
  --min-count 2 \
  --max-count 10 \
  --count 1 \
  --rule "Avg cpu > 70% during 5 minutes then scale by 1" \
  --rule "Avg cpu < 30% during 5 minutes then scale by -1"
```

### Load Testing

```bash
# Using Azure Load Testing
az load create \
  --resource-group your-resource-group \
  --load-test-resource ai-video-gen-load-test \
  --engine-instances 5 \
  --test-file loadtest.jmx
```

---

## Troubleshooting

### App Service Won't Start

```bash
# Check logs
az webapp log tail --resource-group your-resource-group --name ai-video-gen-backend

# Check startup command
az webapp config show --resource-group your-resource-group --name ai-video-gen-backend
```

### Memory Issues

```bash
# Increase app service plan resources
az appservice plan update --sku P1V2

# Monitor memory usage
az monitor metrics list --resource /subscriptions/{id}/resourceGroups/{group}/providers/Microsoft.Web/sites/ai-video-gen-backend --metric MemoryPercentage
```

### Slow Response Times

1. Check Application Insights metrics
2. Review slow query logs
3. Implement caching
4. Scale up resources
5. Check Azure service quotas

### Azure Service Failures

1. Verify credentials in Key Vault
2. Check resource quotas
3. Verify network connectivity
4. Review Azure status page
5. Check service-specific logs

---

## Backup & Disaster Recovery

### Database Backup

N/A (currently stateless)

### Configuration Backup

```bash
# Export app settings
az webapp config appsettings list \
  --resource-group your-resource-group \
  --name ai-video-gen-backend \
  > app-settings-backup.json
```

### Source Code Backup

- Use Git with remote repositories
- Enable GitHub/Azure DevOps backup
- Regular commits

### Disaster Recovery Plan

1. **RTO (Recovery Time Objective)**: < 1 hour
2. **RPO (Recovery Point Objective)**: < 15 minutes
3. **Backup Frequency**: Continuous (Git)
4. **Failover Strategy**: Multi-region deployment (future)

---

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Deploy to Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: ai-video-gen-backend
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: .
```

---

## Maintenance

### Regular Tasks

- **Weekly**: Review logs and metrics
- **Monthly**: Update dependencies
- **Quarterly**: Security audit
- **Annually**: Disaster recovery drill

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update packages
npm update

# Update major versions (carefully)
npm install package@latest

# Test thoroughly
npm test
```

---

## Cost Optimization

1. **Right-size instances**: Use B1/B2 for development
2. **Auto-scaling**: Scale down during off-hours
3. **Reserved instances**: 30-50% savings
4. **Spot pricing**: For non-critical workloads
5. **Monitor costs**: Use Azure Cost Management

---

## Support & Escalation

### Resources

- Azure Support: https://support.microsoft.com/en-us/azure
- Azure Community: https://docs.microsoft.com/en-us/answers/products/
- GitHub Issues: Create issues for bugs

### Contact

- Technical issues: Create Azure support ticket
- Feature requests: GitHub issues
- Security issues: security@company.com
