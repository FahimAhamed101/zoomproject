"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileService = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
const subscriptionService_1 = require("./subscriptionService");
const promises_1 = __importDefault(require("fs/promises"));
const prisma = new client_1.PrismaClient();
const normalizeFileType = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    const mapping = {
        image: 'Image',
        video: 'Video',
        pdf: 'PDF',
        audio: 'Audio',
    };
    return mapping[normalized] || null;
};
const detectFileTypeFromMime = (mimeType) => {
    if (!mimeType)
        return null;
    if (mimeType.startsWith('image/'))
        return 'Image';
    if (mimeType.startsWith('video/'))
        return 'Video';
    if (mimeType === 'application/pdf')
        return 'PDF';
    if (mimeType.startsWith('audio/'))
        return 'Audio';
    return null;
};
const safeUnlink = async (filePath) => {
    if (!filePath)
        return;
    try {
        await promises_1.default.unlink(filePath);
    }
    catch (error) {
        if (error?.code !== 'ENOENT') {
            console.error(`Failed to delete file from disk: ${filePath}`, error);
        }
    }
};
exports.fileService = {
    // Check if user can upload file
    async validateFileUpload(userId, folderId, fileName, fileSize, fileType, mimeType) {
        // Get user's current package
        const pkg = await subscriptionService_1.subscriptionService.getUserCurrentPackage(userId);
        // If no package assigned, cannot upload
        if (!pkg) {
            throw new errors_1.ValidationError('No subscription package assigned. Please select a package first.');
        }
        const normalizedFileType = normalizeFileType(fileType);
        if (!normalizedFileType) {
            throw new errors_1.ValidationError('Invalid file type. Allowed values: Image, Video, PDF, Audio');
        }
        const detectedFileType = detectFileTypeFromMime(mimeType);
        if (!detectedFileType) {
            throw new errors_1.ValidationError(`Unsupported file MIME type: ${mimeType}`);
        }
        if (normalizedFileType !== detectedFileType) {
            throw new errors_1.ValidationError(`File type mismatch. Selected "${normalizedFileType}" but uploaded file is "${detectedFileType}"`);
        }
        // Check file type is allowed
        if (!pkg.allowedFileTypes.includes(normalizedFileType)) {
            throw new errors_1.ValidationError(`File type "${normalizedFileType}" not allowed. Allowed types: ${pkg.allowedFileTypes.join(', ')}`);
        }
        // Check file size
        const maxFileSizeBytes = pkg.maxFileSize * 1024 * 1024;
        if (fileSize > maxFileSizeBytes) {
            throw new errors_1.ValidationError(`File size exceeds maximum of ${pkg.maxFileSize}MB`);
        }
        // Check total file limit
        const userFileCount = await prisma.file.count({
            where: { userId },
        });
        if (userFileCount >= pkg.totalFileLimit) {
            throw new errors_1.ValidationError(`Total file limit (${pkg.totalFileLimit}) reached for your subscription`);
        }
        // Check files per folder limit
        const folderFileCount = await prisma.file.count({
            where: { folderId },
        });
        if (folderFileCount >= pkg.filesPerFolder) {
            throw new errors_1.ValidationError(`Folder file limit (${pkg.filesPerFolder}) reached for this folder`);
        }
        // Check folder exists and belongs to user
        const folder = await prisma.folder.findFirst({
            where: { id: folderId, userId },
        });
        if (!folder) {
            throw new errors_1.NotFoundError('Folder');
        }
        return normalizedFileType;
    },
    // Upload file
    async uploadFile(userId, folderId, fileName, originalName, fileSize, filePath, fileType, mimeType) {
        // Validate before upload
        const normalizedFileType = await this.validateFileUpload(userId, folderId, fileName, fileSize, fileType, mimeType);
        return prisma.file.create({
            data: {
                name: fileName,
                originalName,
                size: fileSize,
                path: filePath,
                fileType: normalizedFileType,
                mimetype: mimeType,
                userId,
                folderId,
            },
        });
    },
    // Delete file
    async deleteFile(fileId, userId) {
        const file = await prisma.file.findFirst({
            where: { id: fileId, userId },
        });
        if (!file) {
            throw new errors_1.NotFoundError('File');
        }
        await safeUnlink(file.path);
        return prisma.file.delete({
            where: { id: fileId },
        });
    },
    // Rename file
    async renameFile(fileId, userId, newName) {
        const file = await prisma.file.findFirst({
            where: { id: fileId, userId },
        });
        if (!file) {
            throw new errors_1.NotFoundError('File');
        }
        return prisma.file.update({
            where: { id: fileId },
            data: { name: newName },
        });
    },
    // Get files in folder
    async getFolderFiles(folderId, userId) {
        const folder = await prisma.folder.findFirst({
            where: { id: folderId, userId },
        });
        if (!folder) {
            throw new errors_1.NotFoundError('Folder');
        }
        return prisma.file.findMany({
            where: { folderId },
            orderBy: { createdAt: 'desc' },
        });
    },
    // Get single file
    async getFile(fileId, userId) {
        const file = await prisma.file.findFirst({
            where: { id: fileId, userId },
        });
        if (!file) {
            throw new errors_1.NotFoundError('File');
        }
        return file;
    },
    // Get all user files
    async getUserFiles(userId) {
        return prisma.file.findMany({
            where: { userId },
            include: { folder: true },
            orderBy: { createdAt: 'desc' },
        });
    },
};
