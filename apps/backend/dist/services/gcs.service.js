"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GcsService = void 0;
const common_1 = require("@nestjs/common");
const storage_1 = require("@google-cloud/storage");
const uuid_1 = require("uuid");
const sharp_1 = __importDefault(require("sharp"));
let GcsService = class GcsService {
    storage;
    bucketName;
    maxFileSizeBytes;
    maxTotalStorageBytes;
    constructor() {
        this.bucketName = process.env.GCS_BUCKET_NAME || 'lentera-lesson-files';
        this.maxFileSizeBytes = (Number(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024;
        this.maxTotalStorageBytes = (Number(process.env.MAX_TOTAL_STORAGE_GB) || 4.9) * 1024 * 1024 * 1024;
        try {
            this.storage = new storage_1.Storage({
                projectId: process.env.GCS_PROJECT_ID,
                keyFilename: process.env.GCS_KEY_FILENAME || './gcs-key.json',
            });
        }
        catch (error) {
            console.error('Failed to initialize Google Cloud Storage:', error);
            throw new common_1.InternalServerErrorException('Storage service unavailable');
        }
    }
    buildObjectPath(fileId, folder, extension) {
        return `${folder}/${fileId}${extension ? `.${extension}` : ''}`;
    }
    async uploadFile(fileBuffer, originalFileName, mimeType, folder = 'lessons', extension = 'pdf') {
        if (!fileBuffer || fileBuffer.length === 0) {
            throw new common_1.BadRequestException('File is empty');
        }
        if (fileBuffer.length > this.maxFileSizeBytes) {
            throw new common_1.BadRequestException(`File size exceeds maximum limit of ${process.env.MAX_FILE_SIZE_MB}MB`);
        }
        if (mimeType !== 'application/pdf' && folder === 'lessons') {
            throw new common_1.BadRequestException('Only PDF files are allowed');
        }
        const currentStorageUsage = await this.getTotalStorageUsage();
        if (currentStorageUsage + fileBuffer.length > this.maxTotalStorageBytes) {
            throw new common_1.BadRequestException(`Total storage limit of ${process.env.MAX_TOTAL_STORAGE_GB}GB would be exceeded`);
        }
        const fileId = (0, uuid_1.v4)();
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
        }
        catch (error) {
            console.error('Failed to upload file to GCS:', error);
            throw new common_1.InternalServerErrorException('Failed to upload file');
        }
    }
    async resizeImageIfNeeded(fileBuffer, mimeType) {
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(mimeType)) {
            return fileBuffer;
        }
        const image = (0, sharp_1.default)(fileBuffer).rotate();
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
    async uploadImage(fileBuffer, originalFileName, mimeType, folder = 'exam-questions') {
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
            throw new common_1.BadRequestException('Only image files are allowed for examination questions');
        }
        const resizedBuffer = await this.resizeImageIfNeeded(fileBuffer, mimeType);
        return this.uploadFile(resizedBuffer, originalFileName, mimeType, folder, extension);
    }
    async deleteFile(fileId, folder = 'lessons', extension = 'pdf') {
        if (!fileId) {
            return;
        }
        try {
            const bucket = this.storage.bucket(this.bucketName);
            const file = bucket.file(this.buildObjectPath(fileId, folder, extension));
            await file.delete().catch(() => {
            });
        }
        catch (error) {
            console.warn('Failed to delete file from GCS:', error);
        }
    }
    async getSignedUrl(fileId, folder = 'lessons', extension = 'pdf', expiresInHours = 1) {
        try {
            const bucket = this.storage.bucket(this.bucketName);
            const file = bucket.file(this.buildObjectPath(fileId, folder, extension));
            const [signedUrl] = await file.getSignedUrl({
                version: 'v4',
                action: 'read',
                expires: Date.now() + expiresInHours * 60 * 60 * 1000,
            });
            return signedUrl;
        }
        catch (error) {
            console.error('Failed to generate signed URL:', error);
            throw new common_1.InternalServerErrorException('Failed to generate download URL');
        }
    }
    async getTotalStorageUsage() {
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
        }
        catch (error) {
            console.warn('Failed to calculate total storage usage:', error);
            return 0;
        }
    }
    async getStorageStats() {
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
};
exports.GcsService = GcsService;
exports.GcsService = GcsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], GcsService);
//# sourceMappingURL=gcs.service.js.map