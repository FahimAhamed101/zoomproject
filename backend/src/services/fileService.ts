import { PrismaClient } from '@prisma/client';
import { ValidationError, NotFoundError } from '../utils/errors';
import { subscriptionService } from './subscriptionService';
import fs from 'fs/promises';

const prisma = new PrismaClient();

const normalizeFileType = (value: unknown): string | null => {
  const normalized = String(value || '').trim().toLowerCase();
  const mapping: Record<string, string> = {
    image: 'Image',
    video: 'Video',
    pdf: 'PDF',
    audio: 'Audio',
  };
  return mapping[normalized] || null;
};

const detectFileTypeFromMime = (mimeType: string): string | null => {
  if (!mimeType) return null;
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.startsWith('video/')) return 'Video';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType.startsWith('audio/')) return 'Audio';
  return null;
};

const safeUnlink = async (filePath: string) => {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      console.error(`Failed to delete file from disk: ${filePath}`, error);
    }
  }
};

export const fileService = {
  // Check if user can upload file
  async validateFileUpload(
    userId: string,
    folderId: string,
    fileName: string,
    fileSize: number,
    fileType: string,
    mimeType: string
  ) {
    // Get user's current package
    const pkg = await subscriptionService.getUserCurrentPackage(userId);

    // If no package assigned, cannot upload
    if (!pkg) {
      throw new ValidationError('No subscription package assigned. Please select a package first.');
    }

    const normalizedFileType = normalizeFileType(fileType);
    if (!normalizedFileType) {
      throw new ValidationError('Invalid file type. Allowed values: Image, Video, PDF, Audio');
    }

    const detectedFileType = detectFileTypeFromMime(mimeType);
    if (!detectedFileType) {
      throw new ValidationError(`Unsupported file MIME type: ${mimeType}`);
    }

    if (normalizedFileType !== detectedFileType) {
      throw new ValidationError(
        `File type mismatch. Selected "${normalizedFileType}" but uploaded file is "${detectedFileType}"`
      );
    }

    // Check file type is allowed
    if (!pkg.allowedFileTypes.includes(normalizedFileType)) {
      throw new ValidationError(
        `File type "${normalizedFileType}" not allowed. Allowed types: ${pkg.allowedFileTypes.join(', ')}`
      );
    }

    // Check file size
    const maxFileSizeBytes = pkg.maxFileSize * 1024 * 1024;
    if (fileSize > maxFileSizeBytes) {
      throw new ValidationError(
        `File size exceeds maximum of ${pkg.maxFileSize}MB`
      );
    }

    // Check total file limit
    const userFileCount = await prisma.file.count({
      where: { userId },
    });

    if (userFileCount >= pkg.totalFileLimit) {
      throw new ValidationError(
        `Total file limit (${pkg.totalFileLimit}) reached for your subscription`
      );
    }

    // Check files per folder limit
    const folderFileCount = await prisma.file.count({
      where: { folderId },
    });

    if (folderFileCount >= pkg.filesPerFolder) {
      throw new ValidationError(
        `Folder file limit (${pkg.filesPerFolder}) reached for this folder`
      );
    }

    // Check folder exists and belongs to user
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId },
    });

    if (!folder) {
      throw new NotFoundError('Folder');
    }

    return normalizedFileType;
  },

  // Upload file
  async uploadFile(
    userId: string,
    folderId: string,
    fileName: string,
    originalName: string,
    fileSize: number,
    filePath: string,
    fileType: string,
    mimeType: string
  ) {
    // Validate before upload
    const normalizedFileType = await this.validateFileUpload(
      userId,
      folderId,
      fileName,
      fileSize,
      fileType,
      mimeType
    );

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
  async deleteFile(fileId: string, userId: string) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new NotFoundError('File');
    }

    await safeUnlink(file.path);

    return prisma.file.delete({
      where: { id: fileId },
    });
  },

  // Rename file
  async renameFile(fileId: string, userId: string, newName: string) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new NotFoundError('File');
    }

    return prisma.file.update({
      where: { id: fileId },
      data: { name: newName },
    });
  },

  // Get files in folder
  async getFolderFiles(folderId: string, userId: string) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId },
    });

    if (!folder) {
      throw new NotFoundError('Folder');
    }

    return prisma.file.findMany({
      where: { folderId },
      orderBy: { createdAt: 'desc' },
    });
  },

  // Get single file
  async getFile(fileId: string, userId: string) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new NotFoundError('File');
    }

    return file;
  },

  // Get all user files
  async getUserFiles(userId: string) {
    return prisma.file.findMany({
      where: { userId },
      include: { folder: true },
      orderBy: { createdAt: 'desc' },
    });
  },
};
