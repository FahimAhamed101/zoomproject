import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create default admin
  const hashedPassword = await bcryptjs.hash('admin123', 10);
  
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@zoomit.com' },
    update: {},
    create: {
      email: 'admin@zoomit.com',
      password: hashedPassword,
    },
  });

  console.log('Admin created:', admin.email);

  // Create default subscription packages
  const packages = [
    {
      name: 'Free',
      description: 'Free tier for testing',
      maxFolders: 3,
      maxNestingLevel: 2,
      allowedFileTypes: ['Image', 'PDF'],
      maxFileSize: 5, // 5 MB
      totalFileLimit: 10,
      filesPerFolder: 5,
      price: 0,
    },
    {
      name: 'Silver',
      description: 'Silver tier with enhanced features',
      maxFolders: 10,
      maxNestingLevel: 3,
      allowedFileTypes: ['Image', 'Video', 'PDF', 'Audio'],
      maxFileSize: 50, // 50 MB
      totalFileLimit: 100,
      filesPerFolder: 25,
      price: 9.99,
    },
    {
      name: 'Gold',
      description: 'Gold tier with premium features',
      maxFolders: 50,
      maxNestingLevel: 5,
      allowedFileTypes: ['Image', 'Video', 'PDF', 'Audio'],
      maxFileSize: 500, // 500 MB
      totalFileLimit: 1000,
      filesPerFolder: 200,
      price: 29.99,
    },
    {
      name: 'Diamond',
      description: 'Diamond tier with unlimited features',
      maxFolders: 500,
      maxNestingLevel: 10,
      allowedFileTypes: ['Image', 'Video', 'PDF', 'Audio'],
      maxFileSize: 2000, // 2 GB
      totalFileLimit: 10000,
      filesPerFolder: 2000,
      price: 99.99,
    },
  ];

  for (const pkg of packages) {
    const created = await prisma.subscriptionPackage.upsert({
      where: { name: pkg.name },
      update: pkg,
      create: {
        ...pkg,
        adminId: admin.id,
      },
    });
    console.log(`Subscription package created: ${created.name}`);
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
