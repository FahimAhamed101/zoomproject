"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionService = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
const prisma = new client_1.PrismaClient();
const ALLOWED_FILE_TYPES = ['Image', 'Video', 'PDF', 'Audio'];
const parsePositiveInt = (value, field, min = 1) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < min) {
        throw new errors_1.ValidationError(`${field} must be an integer greater than or equal to ${min}`);
    }
    return parsed;
};
const parseNonNegativeNumber = (value, field) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        throw new errors_1.ValidationError(`${field} must be a number greater than or equal to 0`);
    }
    return parsed;
};
const normalizeFileType = (value) => {
    const fileType = String(value || '').trim().toLowerCase();
    const mapping = {
        image: 'Image',
        video: 'Video',
        pdf: 'PDF',
        audio: 'Audio',
    };
    return mapping[fileType] || null;
};
const normalizeAllowedFileTypes = (allowedFileTypes) => {
    if (allowedFileTypes === undefined || allowedFileTypes === null) {
        return [...ALLOWED_FILE_TYPES];
    }
    if (!Array.isArray(allowedFileTypes)) {
        throw new errors_1.ValidationError('allowedFileTypes must be an array');
    }
    const mapped = allowedFileTypes.map(normalizeFileType);
    const invalid = mapped
        .map((value, index) => ({ value, original: allowedFileTypes[index] }))
        .filter((item) => !item.value)
        .map((item) => String(item.original));
    if (invalid.length > 0) {
        throw new errors_1.ValidationError(`Invalid file types: ${invalid.join(', ')}. Allowed: ${ALLOWED_FILE_TYPES.join(', ')}`);
    }
    const normalized = [...new Set(mapped.filter(Boolean))];
    if (normalized.length === 0) {
        return [...ALLOWED_FILE_TYPES];
    }
    return normalized;
};
const normalizePackageData = (data, isUpdate) => {
    if (!data || typeof data !== 'object') {
        throw new errors_1.ValidationError('Invalid package payload');
    }
    const normalized = {};
    if (!isUpdate || data.name !== undefined) {
        const name = String(data.name || '').trim();
        if (!name) {
            throw new errors_1.ValidationError('Package name is required');
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
exports.subscriptionService = {
    // Get all packages
    async getAllPackages(adminId) {
        return prisma.subscriptionPackage.findMany({
            orderBy: [{ price: 'asc' }, { createdAt: 'asc' }],
        });
    },
    // Get single package
    async getPackage(id, adminId) {
        const pkg = await prisma.subscriptionPackage.findUnique({
            where: { id },
        });
        if (!pkg) {
            throw new errors_1.NotFoundError('Package');
        }
        return pkg;
    },
    // Create package
    async createPackage(data, adminId) {
        const normalized = normalizePackageData(data, false);
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
    async updatePackage(id, data, adminId) {
        await this.getPackage(id, adminId);
        const normalized = normalizePackageData(data, true);
        if (normalized.name) {
            const existing = await prisma.subscriptionPackage.findUnique({
                where: { name: normalized.name },
            });
            if (existing && existing.id !== id) {
                throw new errors_1.ValidationError(`Package with name "${normalized.name}" already exists`);
            }
        }
        return prisma.subscriptionPackage.update({
            where: { id },
            data: normalized,
        });
    },
    // Delete package
    async deletePackage(id, adminId) {
        const pkg = await this.getPackage(id, adminId);
        // Check if any users are subscribed to this package
        const usersCount = await prisma.userSubscription.count({
            where: { packageId: id, isActive: true },
        });
        if (usersCount > 0) {
            throw new errors_1.ValidationError('Cannot delete package that has active users. Transfer users to another package first.');
        }
        return prisma.subscriptionPackage.delete({
            where: { id },
        });
    },
    // Get user's current package
    async getUserCurrentPackage(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                currentSubscription: {
                    include: { package: true },
                },
            },
        });
        if (!user) {
            throw new errors_1.NotFoundError('User');
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
    async assignSubscriptionToUser(userId, packageId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new errors_1.NotFoundError('User');
        }
        const pkg = await prisma.subscriptionPackage.findUnique({ where: { id: packageId } });
        if (!pkg) {
            throw new errors_1.NotFoundError('Package');
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
    async getUserSubscriptionHistory(userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new errors_1.NotFoundError('User');
        }
        return prisma.userSubscription.findMany({
            where: { userId },
            include: { package: true },
            orderBy: { startDate: 'desc' },
        });
    },
};
