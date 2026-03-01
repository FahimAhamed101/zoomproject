"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.env.UPLOAD_DIR || './uploads');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_UPLOAD_SIZE || '104857600'), // 100MB default
    },
    fileFilter: (req, file, cb) => {
        const allowedMimePrefix = ['image/', 'video/', 'audio/'];
        const isPdf = file.mimetype === 'application/pdf';
        const isAllowedPrefix = allowedMimePrefix.some((prefix) => file.mimetype.startsWith(prefix));
        if (isPdf || isAllowedPrefix) {
            cb(null, true);
            return;
        }
        cb(new Error(`Unsupported file type: ${file.mimetype}`));
    },
});
const uploadSingleFile = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                error: err.message || 'File upload failed',
            });
        }
        next();
    });
};
// Subscription routes
router.get('/subscriptions/current', auth_1.authMiddleware, auth_1.requireUser, userController_1.userController.getCurrentSubscription);
router.post('/subscriptions/assign', auth_1.authMiddleware, auth_1.requireUser, userController_1.userController.assignSubscription);
router.get('/subscriptions/history', auth_1.authMiddleware, auth_1.requireUser, userController_1.userController.getSubscriptionHistory);
// Folder routes
router.post('/folders', auth_1.authMiddleware, auth_1.requireUser, userController_1.folderController.createRootFolder);
router.post('/folders/subfolder', auth_1.authMiddleware, auth_1.requireUser, userController_1.folderController.createSubfolder);
router.get('/folders', auth_1.authMiddleware, auth_1.requireUser, userController_1.folderController.getRootFolders);
router.get('/folders/all', auth_1.authMiddleware, auth_1.requireUser, userController_1.folderController.getAllFolders);
router.get('/folders/:folderId', auth_1.authMiddleware, auth_1.requireUser, userController_1.folderController.getFolderStructure);
router.put('/folders/:folderId', auth_1.authMiddleware, auth_1.requireUser, userController_1.folderController.renameFolder);
router.delete('/folders/:folderId', auth_1.authMiddleware, auth_1.requireUser, userController_1.folderController.deleteFolder);
// File routes
router.post('/files/upload', auth_1.authMiddleware, auth_1.requireUser, uploadSingleFile, userController_1.fileController.uploadFile);
router.get('/files/folder/:folderId', auth_1.authMiddleware, auth_1.requireUser, userController_1.fileController.getFolderFiles);
router.get('/files/all', auth_1.authMiddleware, auth_1.requireUser, userController_1.fileController.getUserFiles);
router.get('/files/:fileId', auth_1.authMiddleware, auth_1.requireUser, userController_1.fileController.getFile);
router.put('/files/:fileId', auth_1.authMiddleware, auth_1.requireUser, userController_1.fileController.renameFile);
router.delete('/files/:fileId', auth_1.authMiddleware, auth_1.requireUser, userController_1.fileController.deleteFile);
exports.default = router;
