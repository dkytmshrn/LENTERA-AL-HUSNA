export declare class GcsService {
    private storage;
    private bucketName;
    private maxFileSizeBytes;
    private maxTotalStorageBytes;
    private normalizePrivateKey;
    constructor();
    private buildObjectPath;
    uploadFile(fileBuffer: Buffer, originalFileName: string, mimeType: string, folder?: string, extension?: string): Promise<{
        fileId: string;
        fileSizeBytes: number;
    }>;
    private resizeImageIfNeeded;
    uploadImage(fileBuffer: Buffer, originalFileName: string, mimeType: string, folder?: string): Promise<{
        fileId: string;
        fileSizeBytes: number;
    }>;
    deleteFile(fileId: string, folder?: string, extension?: string): Promise<void>;
    getSignedUrl(fileId: string, folder?: string, extension?: string, expiresInHours?: number): Promise<string>;
    getTotalStorageUsage(): Promise<number>;
    getStorageStats(): Promise<{
        usedBytes: number;
        usedGB: number;
        maxGB: number;
        percentUsed: number;
    }>;
}
