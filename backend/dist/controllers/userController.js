"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileController = exports.folderController = exports.userController = void 0;
const subscriptionService_1 = require("../services/subscriptionService");
const folderService_1 = require("../services/folderService");
const fileService_1 = require("../services/fileService");
const promises_1 = __importDefault(require("fs/promises"));
exports.userController = {
    // Get current subscription
    async getCurrentSubscription(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }
            const pkg = await subscriptionService_1.subscriptionService.getUserCurrentPackage(req.user.id);
            res.status(200).json({
                success: true,
                data: pkg,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    },
    // Assign subscription package
    async assignSubscription(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }
            const { packageId } = req.body;
            const subscription = await subscriptionService_1.subscriptionService.assignSubscriptionToUser(req.user.id, packageId);
            res.status(200).json({
                success: true,
                data: subscription,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    },
    // Get subscription history
    async getSubscriptionHistory(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }
            const history = await subscriptionService_1.subscriptionService.getUserSubscriptionHistory(req.user.id);
            res.status(200).json({
                success: true,
                data: history,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    },
};
exports.folderController = {
    // Create root folder
    async createRootFolder(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }
            const { folderName } = req.body;
            const folder = await folderService_1.folderService.createRootFolder(req.user.id, folderName);
            res.status(201).json({
                success: true,
                data: folder,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    },
    // Create subfolder
    async createSubfolder(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }
            const { parentFolderId, folderName } = req.body;
            const folder = await folderService_1.folderService.createSubfolder(req.user.id, parentFolderId, folderName);
            res.status(201).json({
                success: true,
                data: folder,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    },
    // Get root folders
    async getRootFolders(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }
            const folders = await folderService_1.folderService.getRootFolders(req.user.id);
            res.status(200).json({
                success: true,
                data: folders,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    },
    // Get folder structure
    async getFolderStructure(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }
            const { folderId } = req.params;
            const folder = await folderService_1.folderService.getFolderStructure(folderId, req.user.id);
            res.status(200).json({
                success: true,
                data: folder,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    },
    // Rename folder
    async renameFolder(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }
            const { folderId } = req.params;
            const { newName } = req.body;
            const folder = await folderService_1.folderService.renameFolder(folderId, req.user.id, newName);
            res.status(200).json({
                success: true,
                data: folder,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    },
    // Delete folder
    async deleteFolder(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }
            const { folderId } = req.params;
            await folderService_1.folderService.deleteFolder(folderId, req.user.id, true);
            res.status(200).json({
                success: true,
                message: 'Folder deleted successfully',
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    },
    // Get all folders
    async getAllFolders(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }
            const folders = await folderService_1.folderService.getAllUserFolders(req.user.id);
            res.status(200).json({
                success: true,
                data: folders,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    },
};
exports.fileController = {
    // Upload file
    async uploadFile(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }
            const { folderId, fileType } = req.body;
            const file = req.file;
            if (!file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file provided',
                });
            }
            const uploadedFile = await fileService_1.fileService.uploadFile(req.user.id, folderId, file.filename, file.originalname, file.size, file.path, fileType, file.mimetype);
            res.status(201).json({
                success: true,
                data: uploadedFile,
            });
        }
        catch (error) {
            const uploadedPath = req.file?.path;
            if (uploadedPath) {
                try {
                    await promises_1.default.unlink(uploadedPath);
                }
                catch (unlinkError) {
                    if (unlinkError?.code !== 'ENOENT') {
                        console.error('Failed to clean up rejected upload:', unlinkError);
                    }
                }
            }
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    },
    // Get folder files
    async getFolderFiles(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }
            const { folderId } = req.params;
            const files = await fileService_1.fileService.getFolderFiles(folderId, req.user.id);
            res.status(200).json({
                success: true,
                data: files,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    },
    // Get single file
    async getFile(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }
            const { fileId } = req.params;
            const file = await fileService_1.fileService.getFile(fileId, req.user.id);
            res.status(200).json({
                success: true,
                data: file,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    },
    // Rename file
    async renameFile(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }
            const { fileId } = req.params;
            const { newName } = req.body;
            const file = await fileService_1.fileService.renameFile(fileId, req.user.id, newName);
            res.status(200).json({
                success: true,
                data: file,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    },
    // Delete file
    async deleteFile(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }
            const { fileId } = req.params;
            await fileService_1.fileService.deleteFile(fileId, req.user.id);
            res.status(200).json({
                success: true,
                message: 'File deleted successfully',
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    },
    // Get all user files
    async getUserFiles(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }
            const files = await fileService_1.fileService.getUserFiles(req.user.id);
            res.status(200).json({
                success: true,
                data: files,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    },
};
