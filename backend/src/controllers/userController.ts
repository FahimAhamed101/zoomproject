import { Response } from 'express';
import { subscriptionService } from '../services/subscriptionService';
import { folderService } from '../services/folderService';
import { fileService } from '../services/fileService';
import { AuthRequest, ApiResponse } from '../types';
import fs from 'fs/promises';

export const userController = {
  // Get current subscription
  async getCurrentSubscription(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const pkg = await subscriptionService.getUserCurrentPackage(req.user.id);

      res.status(200).json({
        success: true,
        data: pkg,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  },

  // Assign subscription package
  async assignSubscription(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { packageId } = req.body;

      const subscription = await subscriptionService.assignSubscriptionToUser(
        req.user.id,
        packageId
      );

      res.status(200).json({
        success: true,
        data: subscription,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  },

  // Get subscription history
  async getSubscriptionHistory(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const history = await subscriptionService.getUserSubscriptionHistory(req.user.id);

      res.status(200).json({
        success: true,
        data: history,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  },
};

export const folderController = {
  // Create root folder
  async createRootFolder(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { folderName } = req.body;

      const folder = await folderService.createRootFolder(req.user.id, folderName);

      res.status(201).json({
        success: true,
        data: folder,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  },

  // Create subfolder
  async createSubfolder(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { parentFolderId, folderName } = req.body;

      const folder = await folderService.createSubfolder(
        req.user.id,
        parentFolderId,
        folderName
      );

      res.status(201).json({
        success: true,
        data: folder,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  },

  // Get root folders
  async getRootFolders(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const folders = await folderService.getRootFolders(req.user.id);

      res.status(200).json({
        success: true,
        data: folders,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  },

  // Get folder structure
  async getFolderStructure(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { folderId } = req.params;

      const folder = await folderService.getFolderStructure(folderId, req.user.id);

      res.status(200).json({
        success: true,
        data: folder,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  },

  // Rename folder
  async renameFolder(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { folderId } = req.params;
      const { newName } = req.body;

      const folder = await folderService.renameFolder(folderId, req.user.id, newName);

      res.status(200).json({
        success: true,
        data: folder,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  },

  // Delete folder
  async deleteFolder(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { folderId } = req.params;

      await folderService.deleteFolder(folderId, req.user.id, true);

      res.status(200).json({
        success: true,
        message: 'Folder deleted successfully',
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  },

  // Get all folders
  async getAllFolders(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const folders = await folderService.getAllUserFolders(req.user.id);

      res.status(200).json({
        success: true,
        data: folders,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  },
};

export const fileController = {
  // Upload file
  async uploadFile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { folderId, fileType } = req.body;
      const file = (req as any).file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'No file provided',
        } as ApiResponse);
      }

      const uploadedFile = await fileService.uploadFile(
        req.user.id,
        folderId,
        file.filename,
        file.originalname,
        file.size,
        file.path,
        fileType,
        file.mimetype
      );

      res.status(201).json({
        success: true,
        data: uploadedFile,
      } as ApiResponse);
    } catch (error) {
      const uploadedPath = (req as any).file?.path as string | undefined;
      if (uploadedPath) {
        try {
          await fs.unlink(uploadedPath);
        } catch (unlinkError: any) {
          if (unlinkError?.code !== 'ENOENT') {
            console.error('Failed to clean up rejected upload:', unlinkError);
          }
        }
      }

      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  },

  // Get folder files
  async getFolderFiles(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { folderId } = req.params;

      const files = await fileService.getFolderFiles(folderId, req.user.id);

      res.status(200).json({
        success: true,
        data: files,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  },

  // Get single file
  async getFile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { fileId } = req.params;

      const file = await fileService.getFile(fileId, req.user.id);

      res.status(200).json({
        success: true,
        data: file,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  },

  // Rename file
  async renameFile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { fileId } = req.params;
      const { newName } = req.body;

      const file = await fileService.renameFile(fileId, req.user.id, newName);

      res.status(200).json({
        success: true,
        data: file,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  },

  // Delete file
  async deleteFile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { fileId } = req.params;

      await fileService.deleteFile(fileId, req.user.id);

      res.status(200).json({
        success: true,
        message: 'File deleted successfully',
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  },

  // Get all user files
  async getUserFiles(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const files = await fileService.getUserFiles(req.user.id);

      res.status(200).json({
        success: true,
        data: files,
      } as ApiResponse);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      } as ApiResponse);
    }
  },
};
