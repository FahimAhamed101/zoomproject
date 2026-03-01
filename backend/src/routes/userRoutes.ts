import { Router, Request, Response, NextFunction } from 'express';
import { userController, folderController, fileController } from '../controllers/userController';
import { authMiddleware, requireUser } from '../middleware/auth';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req: Request, file: any, cb: any) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req: Request, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_UPLOAD_SIZE || '104857600'), // 100MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedMimePrefix = ['image/', 'video/', 'audio/'];
    const isPdf = file.mimetype === 'application/pdf';
    const isAllowedPrefix = allowedMimePrefix.some((prefix) =>
      file.mimetype.startsWith(prefix)
    );

    if (isPdf || isAllowedPrefix) {
      cb(null, true);
      return;
    }

    cb(new Error(`Unsupported file type: ${file.mimetype}`));
  },
});

const uploadSingleFile = (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err: any) => {
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
router.get('/subscriptions/current', authMiddleware, requireUser, userController.getCurrentSubscription);
router.post('/subscriptions/assign', authMiddleware, requireUser, userController.assignSubscription);
router.get('/subscriptions/history', authMiddleware, requireUser, userController.getSubscriptionHistory);

// Folder routes
router.post('/folders', authMiddleware, requireUser, folderController.createRootFolder);
router.post('/folders/subfolder', authMiddleware, requireUser, folderController.createSubfolder);
router.get('/folders', authMiddleware, requireUser, folderController.getRootFolders);
router.get('/folders/all', authMiddleware, requireUser, folderController.getAllFolders);
router.get('/folders/:folderId', authMiddleware, requireUser, folderController.getFolderStructure);
router.put('/folders/:folderId', authMiddleware, requireUser, folderController.renameFolder);
router.delete('/folders/:folderId', authMiddleware, requireUser, folderController.deleteFolder);

// File routes
router.post('/files/upload', authMiddleware, requireUser, uploadSingleFile, fileController.uploadFile);
router.get('/files/folder/:folderId', authMiddleware, requireUser, fileController.getFolderFiles);
router.get('/files/all', authMiddleware, requireUser, fileController.getUserFiles);
router.get('/files/:fileId', authMiddleware, requireUser, fileController.getFile);
router.put('/files/:fileId', authMiddleware, requireUser, fileController.renameFile);
router.delete('/files/:fileId', authMiddleware, requireUser, fileController.deleteFile);

export default router;
