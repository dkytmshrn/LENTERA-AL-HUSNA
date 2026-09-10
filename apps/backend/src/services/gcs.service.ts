import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import sharp from 'sharp';

@Injectable()
export class GcsService {
  private storage: Storage;
  private bucketName: string;
  private maxFileSizeBytes: number;
  private maxTotalStorageBytes: number;

  private normalizePrivateKey(value?: string): string | undefined {
    if (!value) {
      return undefined;
    }

    let privateKey = value.trim();
    if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
      privateKey = privateKey.slice(1, -1);
    }

    privateKey = privateKey
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\r/g, '');

    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
      throw new Error('GCS_PRIVATE_KEY is not a complete PEM private key');
    }

    return privateKey;
  }

  constructor() {
    this.bucketName = process.env.GCS_BUCKET_NAME || 'lentera-lesson-files';
    this.maxFileSizeBytes = (Number(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024;
    this.maxTotalStorageBytes = (Number(process.env.MAX_TOTAL_STORAGE_GB) || 4.9) * 1024 * 1024 * 1024;

    try {
      const clientEmail = process.env.GCS_CLIENT_EMAIL?.trim();
      const privateKey = this.normalizePrivateKey(process.env.GCS_PRIVATE_KEY);

      this.storage = clientEmail && privateKey
        ? new Storage({
            projectId: process.env.GCS_PROJECT_ID,
            credentials: {
              client_email: clientEmail,
              private_key: privateKey,
            },
          })
        : new Storage({
            projectId: process.env.GCS_PROJECT_ID,
            keyFilename: process.env.GCS_KEY_FILENAME || './gcs-key.json',
          });
    } catch (error) {
      console.error('Failed to initialize Google Cloud Storage:', error);
      throw new InternalServerErrorException('Storage service unavailable');
    }
  }

  private buildObjectPath(fileId: string, folder: string, extension: string): string {
    return `${folder}/${fileId}${extension ? `.${extension}` : ''}`;
  }

  async uploadFile(
    fileBuffer: Buffer,
    originalFileName: string,
    mimeType: string,
    folder: string = 'lessons',
    extension: string = 'pdf',
  ): Promise<{ fileId: string; fileSizeBytes: number }> {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestException('File is empty');
    }

    if (fileBuffer.length > this.maxFileSizeBytes) {
      throw new BadRequestException(
        `File size exceeds maximum limit of ${process.env.MAX_FILE_SIZE_MB}MB`,
      );
    }

    if (mimeType !== 'application/pdf' && folder === 'lessons') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    const currentStorageUsage = await this.getTotalStorageUsage();
    if (currentStorageUsage + fileBuffer.length > this.maxTotalStorageBytes) {
      throw new BadRequestException(
        `Total storage limit of ${process.env.MAX_TOTAL_STORAGE_GB}GB would be exceeded`,
      );
    }

    const fileId = uuidv4();
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(this.buildObjectPath(fileId, folder, extension));

    try {
      await file.save(fileBuffer, {
        contentType: mimeType,
        metadata: {
          originalName: originalFileName,
          uploadedAt: new Date().toISOString(),
        },
      });

      return {
        fileId,
        fileSizeBytes: fileBuffer.length,
      };
    } catch (error) {
      console.error('Failed to upload file to GCS:', error);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  private async resizeImageIfNeeded(fileBuffer: Buffer, mimeType: string): Promise<Buffer> {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(mimeType)) {
      return fileBuffer;
    }

    const image = sharp(fileBuffer).rotate();
    const metadata = await image.metadata();
    const maxSide = Math.max(metadata.width || 0, metadata.height || 0);

    if (!maxSide || maxSide <= 1400) {
      return fileBuffer;
    }

    const resized = image.resize({
      width: metadata.width && metadata.width >= metadata.height ? 1400 : undefined,
      height: metadata.height && metadata.height > metadata.width ? 1400 : undefined,
      fit: 'inside',
      withoutEnlargement: true,
    });

    if (mimeType === 'image/jpeg') {
      return resized.jpeg({ quality: 85, progressive: true, chromaSubsampling: '4:2:0' }).toBuffer();
    }

    if (mimeType === 'image/webp') {
      return resized.webp({ quality: 82 }).toBuffer();
    }

    return resized.png({ compressionLevel: 9, quality: 80, effort: 10 }).toBuffer();
  }

  async uploadImage(
    fileBuffer: Buffer,
    originalFileName: string,
    mimeType: string,
    folder: string = 'exam-questions',
  ): Promise<{ fileId: string; fileSizeBytes: number }> {
    const extension = mimeType === 'image/png'
      ? 'png'
      : mimeType === 'image/jpeg'
        ? 'jpg'
        : mimeType === 'image/webp'
          ? 'webp'
          : mimeType === 'image/gif'
            ? 'gif'
            : 'png';

    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(mimeType)) {
      throw new BadRequestException('Only image files are allowed for examination questions');
    }

    const resizedBuffer = await this.resizeImageIfNeeded(fileBuffer, mimeType);
    return this.uploadFile(resizedBuffer, originalFileName, mimeType, folder, extension);
  }

  async deleteFile(fileId: string, folder: string = 'lessons', extension: string = 'pdf'): Promise<void> {
    if (!fileId) {
      return;
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(this.buildObjectPath(fileId, folder, extension));
      await file.delete().catch(() => {
        // File might not exist, which is fine
      });
    } catch (error) {
      console.warn('Failed to delete file from GCS:', error);
    }
  }

  async getSignedUrl(fileId: string, folder: string = 'lessons', extension: string = 'pdf', expiresInHours: number = 1): Promise<string> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(this.buildObjectPath(fileId, folder, extension));

      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + expiresInHours * 60 * 60 * 1000,
      });

      return signedUrl;
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
      throw new InternalServerErrorException('Failed to generate download URL');
    }
  }

  async getTotalStorageUsage(): Promise<number> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const [files] = await bucket.getFiles({ prefix: 'lessons/' });

      let totalSize = 0;
      for (const file of files) {
        const [metadata] = await file.getMetadata();
        const fileSize = typeof metadata.size === 'string' ? parseInt(metadata.size, 10) : metadata.size;
        totalSize += fileSize || 0;
      }

      return totalSize;
    } catch (error) {
      console.warn('Failed to calculate total storage usage:', error);
      return 0;
    }
  }

  async getStorageStats(): Promise<{
    usedBytes: number;
    usedGB: number;
    maxGB: number;
    percentUsed: number;
  }> {
    const usedBytes = await this.getTotalStorageUsage();
    const maxBytes = this.maxTotalStorageBytes;
    const usedGB = Number((usedBytes / (1024 * 1024 * 1024)).toFixed(2));
    const maxGB = Number(process.env.MAX_TOTAL_STORAGE_GB) || 4.9;
    const percentUsed = Number(((usedBytes / maxBytes) * 100).toFixed(2));

    return {
      usedBytes,
      usedGB,
      maxGB,
      percentUsed,
    };
  }
}
