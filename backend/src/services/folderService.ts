import { PrismaClient } from '@prisma/client';
import { ValidationError, NotFoundError } from '../utils/errors';
import { subscriptionService } from './subscriptionService';
import fs from 'fs/promises';

const prisma = new PrismaClient();

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

export const folderService = {

  async validateFolderCreation(userId: string, nestingLevel: number = 0) {
  
    const pkg = await subscriptionService.getUserCurrentPackage(userId);

  
    if (!pkg) {
      throw new ValidationError(
        'No subscription package assigned. Please select a package first.'
      );
    }

    if (nestingLevel > pkg.maxNestingLevel) {
      throw new ValidationError(
        `Nesting level ${nestingLevel} exceeds maximum of ${pkg.maxNestingLevel}`
      );
    }


    const userFolderCount = await prisma.folder.count({
      where: { userId },
    });

    if (userFolderCount >= pkg.maxFolders) {
      throw new ValidationError(
        `Folder limit (${pkg.maxFolders}) reached for your subscription`
      );
    }
  },


  async createRootFolder(userId: string, folderName: string) {
    await this.validateFolderCreation(userId, 1);

    return prisma.folder.create({
      data: {
        name: folderName,
        nesting_level: 1,
        userId,
      },
    });
  },

  // Create subfolder
  async createSubfolder(userId: string, parentFolderId: string, folderName: string) {
    // Check parent folder exists and belongs to user
    const parentFolder = await prisma.folder.findFirst({
      where: { id: parentFolderId, userId },
    });

    if (!parentFolder) {
      throw new NotFoundError('Parent folder');
    }

    const newNestingLevel = parentFolder.nesting_level + 1;

    // Validate before creating subfolder
    await this.validateFolderCreation(userId, newNestingLevel);

    return prisma.folder.create({
      data: {
        name: folderName,
        nesting_level: newNestingLevel,
        userId,
        parentId: parentFolderId,
      },
    });
  },

  // Delete folder (and all contents if recursive)
  async deleteFolder(folderId: string, userId: string, recursive = true) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId },
    });

    if (!folder) {
      throw new NotFoundError('Folder');
    }

    // Check if folder has files or subfolders
    const fileCount = await prisma.file.count({
      where: { folderId },
    });

    const subfolderCount = await prisma.folder.count({
      where: { parentId: folderId },
    });

    if ((fileCount > 0 || subfolderCount > 0) && !recursive) {
      throw new ValidationError('Folder is not empty. Delete contents first or use recursive deletion.');
    }

    // Delete recursively
    if (recursive) {
      const files = await prisma.file.findMany({
        where: { folderId },
        select: { path: true },
      });

      for (const file of files) {
        await safeUnlink(file.path);
      }

      // Delete all files in folder
      await prisma.file.deleteMany({
        where: { folderId },
      });

      // Delete all subfolders recursively
      const subfolders = await prisma.folder.findMany({
        where: { parentId: folderId },
      });

      for (const subfolder of subfolders) {
        await this.deleteFolder(subfolder.id, userId, true);
      }
    }

    return prisma.folder.delete({
      where: { id: folderId },
    });
  },

  // Rename folder
  async renameFolder(folderId: string, userId: string, newName: string) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId },
    });

    if (!folder) {
      throw new NotFoundError('Folder');
    }

    return prisma.folder.update({
      where: { id: folderId },
      data: { name: newName },
    });
  },

  // Get folder structure with files
  async getFolderStructure(folderId: string, userId: string) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId },
      include: {
        subfolders: {
          include: {
            _count: {
              select: { subfolders: true, files: true },
            },
          },
        },
        files: true,
      },
    });

    if (!folder) {
      throw new NotFoundError('Folder');
    }

    return folder;
  },

  // Get root folders
  async getRootFolders(userId: string) {
    return prisma.folder.findMany({
      where: {
        userId,
        nesting_level: 1,
      },
      include: {
        subfolders: {
          include: {
            _count: {
              select: { subfolders: true, files: true },
            },
          },
        },
        _count: {
          select: { files: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // Get all user folders
  async getAllUserFolders(userId: string) {
    return prisma.folder.findMany({
      where: { userId },
      include: {
        _count: {
          select: { subfolders: true, files: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // Get folder by ID
  async getFolder(folderId: string, userId: string) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId },
    });

    if (!folder) {
      throw new NotFoundError('Folder');
    }

    return folder;
  },
};
