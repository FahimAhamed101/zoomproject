"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.folderService = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
const subscriptionService_1 = require("./subscriptionService");
const promises_1 = __importDefault(require("fs/promises"));
const prisma = new client_1.PrismaClient();
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
exports.folderService = {
    async validateFolderCreation(userId, nestingLevel = 0) {
        const pkg = await subscriptionService_1.subscriptionService.getUserCurrentPackage(userId);
        if (!pkg) {
            throw new errors_1.ValidationError('No subscription package assigned. Please select a package first.');
        }
        if (nestingLevel > pkg.maxNestingLevel) {
            throw new errors_1.ValidationError(`Nesting level ${nestingLevel} exceeds maximum of ${pkg.maxNestingLevel}`);
        }
        const userFolderCount = await prisma.folder.count({
            where: { userId },
        });
        if (userFolderCount >= pkg.maxFolders) {
            throw new errors_1.ValidationError(`Folder limit (${pkg.maxFolders}) reached for your subscription`);
        }
    },
    async createRootFolder(userId, folderName) {
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
    async createSubfolder(userId, parentFolderId, folderName) {
        // Check parent folder exists and belongs to user
        const parentFolder = await prisma.folder.findFirst({
            where: { id: parentFolderId, userId },
        });
        if (!parentFolder) {
            throw new errors_1.NotFoundError('Parent folder');
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
    async deleteFolder(folderId, userId, recursive = true) {
        const folder = await prisma.folder.findFirst({
            where: { id: folderId, userId },
        });
        if (!folder) {
            throw new errors_1.NotFoundError('Folder');
        }
        // Check if folder has files or subfolders
        const fileCount = await prisma.file.count({
            where: { folderId },
        });
        const subfolderCount = await prisma.folder.count({
            where: { parentId: folderId },
        });
        if ((fileCount > 0 || subfolderCount > 0) && !recursive) {
            throw new errors_1.ValidationError('Folder is not empty. Delete contents first or use recursive deletion.');
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
    async renameFolder(folderId, userId, newName) {
        const folder = await prisma.folder.findFirst({
            where: { id: folderId, userId },
        });
        if (!folder) {
            throw new errors_1.NotFoundError('Folder');
        }
        return prisma.folder.update({
            where: { id: folderId },
            data: { name: newName },
        });
    },
    // Get folder structure with files
    async getFolderStructure(folderId, userId) {
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
            throw new errors_1.NotFoundError('Folder');
        }
        return folder;
    },
    // Get root folders
    async getRootFolders(userId) {
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
    async getAllUserFolders(userId) {
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
    async getFolder(folderId, userId) {
        const folder = await prisma.folder.findFirst({
            where: { id: folderId, userId },
        });
        if (!folder) {
            throw new errors_1.NotFoundError('Folder');
        }
        return folder;
    },
};
