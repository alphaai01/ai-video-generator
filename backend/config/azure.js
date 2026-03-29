/**
 * Azure Configuration Module
 * Exports centralized Azure service configuration
 */

import dotenv from 'dotenv';

dotenv.config();

/**
 * Validates that all required environment variables are set
 * @throws {Error} If any required environment variables are missing
 */
const validateEnv = () => {
  const requiredVars = [
    'AZURE_OPENAI_ENDPOINT',
    'AZURE_OPENAI_API_KEY',
    'AZURE_OPENAI_SORA_DEPLOYMENT',
    'AZURE_SPEECH_KEY',
    'AZURE_SPEECH_REGION',
    'AZURE_STORAGE_CONNECTION_STRING',
    'AZURE_STORAGE_CONTAINER',
  ];

  const missing = requiredVars.filter(
    (varName) => !process.env[varName] || process.env[varName].trim() === ''
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      `Please check your .env file and ensure all variables are configured.`
    );
  }
};

/**
 * Azure configuration object
 */
const azureConfig = {
  openai: {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    soraDeployment: process.env.AZURE_OPENAI_SORA_DEPLOYMENT,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2025-04-01-preview',
  },
  speech: {
    apiKey: process.env.AZURE_SPEECH_KEY,
    region: process.env.AZURE_SPEECH_REGION,
  },
  storage: {
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    containerName: process.env.AZURE_STORAGE_CONTAINER,
  },
};

// Only validate env vars if NOT in demo mode
const DEMO_MODE = process.env.DEMO_MODE === 'true';
if (!DEMO_MODE) {
  try {
    validateEnv();
  } catch (error) {
    console.error('Configuration Error:', error.message);
    console.error('Set DEMO_MODE=true to run without Azure credentials.');
    process.exit(1);
  }
} else {
  console.log('[Config] Running in DEMO mode — Azure credentials not required.');
}

export default azureConfig;
