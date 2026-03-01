import { PrismaClient } from '@prisma/client';
import { ValidationError, NotFoundError } from '../utils/errors';

const prisma = new PrismaClient();
const ALLOWED_FILE_TYPES = ['Image', 'Video', 'PDF', 'Audio'] as const;
type PackageBaseInput = {
  name: string;
  description: string | null;
  maxFolders: number;
  maxNestingLevel: number;
  allowedFileTypes: string[];
  maxFileSize: number;
  totalFileLimit: number;
  filesPerFolder: number;
  price: number;
};

const parsePositiveInt = (value: unknown, field: string, min = 1): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min) {
    throw new ValidationError(`${field} must be an integer greater than or equal to ${min}`);
  }
  return parsed;
};

const parseNonNegativeNumber = (value: unknown, field: string): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new ValidationError(`${field} must be a number greater than or equal to 0`);
  }
  return parsed;
};

const normalizeFileType = (value: unknown): string | null => {
  const fileType = String(value || '').trim().toLowerCase();
  const mapping: Record<string, string> = {
    image: 'Image',
    video: 'Video',
    pdf: 'PDF',
    audio: 'Audio',
  };
  return mapping[fileType] || null;
};

const normalizeAllowedFileTypes = (allowedFileTypes: unknown): string[] => {
  if (allowedFileTypes === undefined || allowedFileTypes === null) {
    return [...ALLOWED_FILE_TYPES];
  }

  if (!Array.isArray(allowedFileTypes)) {
    throw new ValidationError('allowedFileTypes must be an array');
  }

  const mapped = allowedFileTypes.map(normalizeFileType);
  const invalid = mapped
    .map((value, index) => ({ value, original: allowedFileTypes[index] }))
    .filter((item) => !item.value)
    .map((item) => String(item.original));

  if (invalid.length > 0) {
    throw new ValidationError(
      `Invalid file types: ${invalid.join(', ')}. Allowed: ${ALLOWED_FILE_TYPES.join(', ')}`
    );
  }

  const normalized = [...new Set(mapped.filter(Boolean))];

  if (normalized.length === 0) {
    return [...ALLOWED_FILE_TYPES];
  }

  return normalized as string[];
};

const normalizePackageData = (data: any, isUpdate: boolean) => {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Invalid package payload');
  }

  const normalized: Record<string, any> = {};

  if (!isUpdate || data.name !== undefined) {
    const name = String(data.name || '').trim();
    if (!name) {
      throw new ValidationError('Package name is required');
    }
    normalized.name = name;
  }

  if (!isUpdate || data.description !== undefined) {
    normalized.description = data.description ? String(data.description).trim() : null;
  }

  if (!isUpdate || data.maxFolders !== undefined) {
    normalized.maxFolders = parsePositiveInt(data.maxFolders, 'maxFolders', 1);
  }

  if (!isUpdate || data.maxNestingLevel !== undefined) {
    normalized.maxNestingLevel = parsePositiveInt(data.maxNestingLevel, 'maxNestingLevel', 1);
  }

  if (!isUpdate || data.allowedFileTypes !== undefined) {
    normalized.allowedFileTypes = normalizeAllowedFileTypes(data.allowedFileTypes);
  }

  if (!isUpdate || data.maxFileSize !== undefined) {
    normalized.maxFileSize = parsePositiveInt(data.maxFileSize, 'maxFileSize', 1);
  }

  if (!isUpdate || data.totalFileLimit !== undefined) {
    normalized.totalFileLimit = parsePositiveInt(data.totalFileLimit, 'totalFileLimit', 1);
  }

  if (!isUpdate || data.filesPerFolder !== undefined) {
    normalized.filesPerFolder = parsePositiveInt(data.filesPerFolder, 'filesPerFolder', 1);
  }

  if (!isUpdate || data.price !== undefined) {
    normalized.price = parseNonNegativeNumber(data.price ?? 0, 'price');
  }
  return normalized;
};

export const subscriptionService = {
  // Get all packages
  async getAllPackages(adminId: string) {
    return prisma.subscriptionPackage.findMany({
      orderBy: [{ price: 'asc' }, { createdAt: 'asc' }],
    });
  },

  // Get single package
  async getPackage(id: string, adminId: string) {
    const pkg = await prisma.subscriptionPackage.findUnique({
      where: { id },
    });

    if (!pkg) {
      throw new NotFoundError('Package');
    }

    return pkg;
  },

  // Create package
  async createPackage(data: any, adminId: string) {
    const normalized = normalizePackageData(data, false) as PackageBaseInput;

    // Admin "create" acts as upsert by package name to prevent duplicate-name deadlocks.
    const existingByName = await prisma.subscriptionPackage.findFirst({
      where: {
        name: {
          equals: normalized.name,
          mode: 'insensitive',
        },
      },
    });

    if (existingByName) {
      return prisma.subscriptionPackage.update({
        where: { id: existingByName.id },
        data: {
          ...normalized,
          adminId,
        },
      });
    }

    return prisma.subscriptionPackage.create({
      data: {
        ...normalized,
        adminId,
      },
    });
  },

  // Update package
  async updatePackage(id: string, data: any, adminId: string) {
    await this.getPackage(id, adminId);
    const normalized = normalizePackageData(data, true) as Partial<PackageBaseInput>;

    if (normalized.name) {
      const existing = await prisma.subscriptionPackage.findUnique({
        where: { name: normalized.name },
      });

      if (existing && existing.id !== id) {
        throw new ValidationError(`Package with name "${normalized.name}" already exists`);
      }
    }

    return prisma.subscriptionPackage.update({
      where: { id },
      data: normalized,
    });
  },

  // Delete package
  async deletePackage(id: string, adminId: string) {
    const pkg = await this.getPackage(id, adminId);

    // Check if any users are subscribed to this package
    const usersCount = await prisma.userSubscription.count({
      where: { packageId: id, isActive: true },
    });

    if (usersCount > 0) {
      throw new ValidationError(
        'Cannot delete package that has active users. Transfer users to another package first.'
      );
    }

    return prisma.subscriptionPackage.delete({
      where: { id },
    });
  },

  // Get user's current package
  async getUserCurrentPackage(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        currentSubscription: {
          include: { package: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return user.currentSubscription?.package || null;
  },

  // Get all available packages for users
  async getAllPublicPackages() {
    return prisma.subscriptionPackage.findMany({
      orderBy: { price: 'asc' },
    });
  },

  // Assign subscription to user
  async assignSubscriptionToUser(userId: string, packageId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User');
    }

    const pkg = await prisma.subscriptionPackage.findUnique({ where: { id: packageId } });
    if (!pkg) {
      throw new NotFoundError('Package');
    }

    // Deactivate current subscription if exists
    if (user.currentSubscriptionId) {
      await prisma.userSubscription.update({
        where: { id: user.currentSubscriptionId },
        data: { isActive: false, endDate: new Date() },
      });
    }

    // Create new subscription
    const newSubscription = await prisma.userSubscription.create({
      data: {
        userId,
        packageId,
        isActive: true,
      },
      include: { package: true },
    });

    // Update user's current subscription
    await prisma.user.update({
      where: { id: userId },
      data: { currentSubscriptionId: newSubscription.id },
    });

    return newSubscription;
  },

  // Get user's subscription history
  async getUserSubscriptionHistory(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User');
    }

    return prisma.userSubscription.findMany({
      where: { userId },
      include: { package: true },
      orderBy: { startDate: 'desc' },
    });
  },
};
