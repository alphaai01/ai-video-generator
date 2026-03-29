/**
 * Azure Blob Storage Service
 * Handles video and image storage operations
 */

import {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { generateFilename } from '../utils/helpers.js';

dotenv.config();

class StorageService {
  /**
   * Initialize storage service with Azure Blob Storage client
   */
  constructor() {
    this.connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
    this.containerName = process.env.AZURE_STORAGE_CONTAINER || 'ai-videos';

    if (this.connectionString) {
      this.client = BlobServiceClient.fromConnectionString(this.connectionString);
      this.containerClient = this.client.getContainerClient(this.containerName);
    } else {
      console.warn('[StorageService] No connection string — storage operations will fail.');
      this.client = null;
      this.containerClient = null;
    }
  }

  /**
   * Uploads a video buffer to Azure Blob Storage
   * @param {Buffer} buffer - Video file buffer
   * @param {string} filename - Optional custom filename
   * @returns {Promise<Object>} { url: string, blobName: string }
   * @throws {Error} If upload fails
   */
  async uploadVideo(buffer, filename = null) {
    try {
      const blobName =
        filename ||
        generateFilename('video', 'mp4');

      const blockBlobClient = this.containerClient.getBlockBlobClient(
        blobName
      );

      console.log(`[StorageService] Uploading video: ${blobName}`);

      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: {
          blobContentType: 'video/mp4',
        },
        metadata: {
          uploadedAt: new Date().toISOString(),
          size: buffer.length.toString(),
        },
      });

      const url = this.getVideoUrl(blobName);

      console.log(`[StorageService] Video uploaded successfully: ${blobName}`);

      return {
        url,
        blobName,
        size: buffer.length,
      };
    } catch (error) {
      console.error('[StorageService] Video upload failed:', error.message);
      throw new Error(`Failed to upload video: ${error.message}`);
    }
  }

  /**
   * Uploads an image buffer to Azure Blob Storage
   * @param {Buffer} buffer - Image file buffer
   * @param {string} filename - Optional custom filename
   * @returns {Promise<Object>} { url: string, blobName: string }
   * @throws {Error} If upload fails
   */
  async uploadImage(buffer, filename = null) {
    try {
      const blobName =
        filename ||
        generateFilename('image', 'jpg');

      const blockBlobClient = this.containerClient.getBlockBlobClient(
        blobName
      );

      console.log(`[StorageService] Uploading image: ${blobName}`);

      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: {
          blobContentType: this.getImageContentType(filename),
        },
        metadata: {
          uploadedAt: new Date().toISOString(),
          size: buffer.length.toString(),
        },
      });

      const url = this.getImageUrl(blobName);

      console.log(`[StorageService] Image uploaded successfully: ${blobName}`);

      return {
        url,
        blobName,
        size: buffer.length,
      };
    } catch (error) {
      console.error('[StorageService] Image upload failed:', error.message);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Generates a SAS URL for downloading a video blob
   * Valid for 7 days by default
   * @param {string} blobName - Name of the blob
   * @param {number} expiryHours - URL expiry time in hours (default: 168/7 days)
   * @returns {string} SAS URL for download
   */
  getVideoUrl(blobName, expiryHours = 168) {
    try {
      const creds = this.getAccountCredentials();
      const sharedKeyCredential = new StorageSharedKeyCredential(creds.accountName, creds.accountKey);

      const sasToken = generateBlobSASQueryParameters(
        {
          containerName: this.containerName,
          blobName: blobName,
          permissions: BlobSASPermissions.parse('r'),
          expiresOn: new Date(Date.now() + expiryHours * 60 * 60 * 1000),
        },
        sharedKeyCredential
      ).toString();

      return `https://${creds.accountName}.blob.core.windows.net/${this.containerName}/${blobName}?${sasToken}`;
    } catch (error) {
      console.error('[StorageService] Failed to generate video URL:', error.message);
      throw new Error(`Failed to generate video URL: ${error.message}`);
    }
  }

  /**
   * Generates a SAS URL for an image blob
   * Valid for 24 hours by default
   * @param {string} blobName - Name of the blob
   * @param {number} expiryHours - URL expiry time in hours (default: 24)
   * @returns {string} SAS URL
   */
  getImageUrl(blobName, expiryHours = 24) {
    try {
      const creds = this.getAccountCredentials();
      const sharedKeyCredential = new StorageSharedKeyCredential(creds.accountName, creds.accountKey);

      const sasToken = generateBlobSASQueryParameters(
        {
          containerName: this.containerName,
          blobName: blobName,
          permissions: BlobSASPermissions.parse('r'),
          expiresOn: new Date(Date.now() + expiryHours * 60 * 60 * 1000),
        },
        sharedKeyCredential
      ).toString();

      return `https://${creds.accountName}.blob.core.windows.net/${this.containerName}/${blobName}?${sasToken}`;
    } catch (error) {
      console.error('[StorageService] Failed to generate image URL:', error.message);
      throw new Error(`Failed to generate image URL: ${error.message}`);
    }
  }

  /**
   * Lists all blobs in the container with pagination
   * @param {number} maxResults - Maximum results per page
   * @returns {Promise<Array>} Array of blob metadata
   */
  async listVideos(maxResults = 50) {
    try {
      console.log('[StorageService] Listing videos...');

      const blobs = [];
      const iterator = this.containerClient.listBlobsFlat();

      let itemCount = 0;

      for await (const item of iterator) {
        if (itemCount >= maxResults) break;

        blobs.push({
          name: item.name,
          size: item.properties.contentLength,
          created: item.properties.createdOn,
          modified: item.properties.lastModified,
          url: this.getVideoUrl(item.name),
        });

        itemCount++;
      }

      console.log(
        `[StorageService] Listed ${blobs.length} videos`
      );

      return blobs;
    } catch (error) {
      console.error('[StorageService] Failed to list videos:', error.message);
      throw new Error(`Failed to list videos: ${error.message}`);
    }
  }

  /**
   * Deletes a blob from storage
   * @param {string} blobName - Name of the blob to delete
   * @returns {Promise<void>}
   */
  async deleteBlob(blobName) {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(
        blobName
      );

      console.log(`[StorageService] Deleting blob: ${blobName}`);

      await blockBlobClient.delete();

      console.log(`[StorageService] Blob deleted: ${blobName}`);
    } catch (error) {
      console.error('[StorageService] Failed to delete blob:', error.message);
      throw new Error(`Failed to delete blob: ${error.message}`);
    }
  }

  /**
   * Gets blob properties
   * @param {string} blobName - Name of the blob
   * @returns {Promise<Object>} Blob properties
   */
  async getBlobProperties(blobName) {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(
        blobName
      );

      const properties = await blockBlobClient.getProperties();

      return {
        size: properties.contentLength,
        contentType: properties.contentType,
        created: properties.createdOn,
        modified: properties.lastModified,
        metadata: properties.metadata,
      };
    } catch (error) {
      console.error('[StorageService] Failed to get blob properties:', error.message);
      throw new Error(`Failed to get blob properties: ${error.message}`);
    }
  }

  /**
   * Downloads a blob as buffer
   * @param {string} blobName - Name of the blob to download
   * @returns {Promise<Buffer>} Blob content as buffer
   */
  async downloadBlob(blobName) {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(
        blobName
      );

      console.log(`[StorageService] Downloading blob: ${blobName}`);

      const downloadBlockBlobResponse = await blockBlobClient.download();

      const chunks = [];
      for await (const chunk of downloadBlockBlobResponse.readableStreamBody) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      console.log(`[StorageService] Blob downloaded: ${blobName}`);

      return buffer;
    } catch (error) {
      console.error('[StorageService] Failed to download blob:', error.message);
      throw new Error(`Failed to download blob: ${error.message}`);
    }
  }

  /**
   * Checks if a blob exists
   * @param {string} blobName - Name of the blob
   * @returns {Promise<boolean>} True if blob exists
   */
  async blobExists(blobName) {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(
        blobName
      );

      return await blockBlobClient.exists();
    } catch (error) {
      console.error('[StorageService] Failed to check blob existence:', error.message);
      return false;
    }
  }

  /**
   * Gets content type for image based on filename
   * @param {string} filename - Image filename
   * @returns {string} Content type
   */
  getImageContentType(filename) {
    if (!filename) return 'image/jpeg';

    const extension = filename.split('.').pop().toLowerCase();
    const contentTypes = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };

    return contentTypes[extension] || 'image/jpeg';
  }

  /**
   * Extracts account credentials from connection string
   * Used for SAS URL generation
   * @returns {Object} Account name and key
   * @private
   */
  getAccountCredentials() {
    const connectionString = this.connectionString;
    const accountNameMatch = connectionString.match(/AccountName=([^;]+)/);
    const accountKeyMatch = connectionString.match(/AccountKey=([^;]+)/);

    const accountName = accountNameMatch ? accountNameMatch[1] : '';
    const accountKey = accountKeyMatch ? accountKeyMatch[1] : '';

    // Return in format expected by generateBlobSASUrl
    return {
      accountName,
      accountKey,
    };
  }
}

export default new StorageService();
