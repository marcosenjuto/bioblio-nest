import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  const forceReseed = process.argv.includes('--force');

  if (forceReseed) {
    console.log('🔄 Force reseed mode: Clearing all data...');
    // Use try-catch to avoid errors if tables don't exist yet
    try { await prisma.molecule.deleteMany(); } catch (e) {}
    try { await prisma.protein.deleteMany(); } catch (e) {}
    try { await prisma.reaction.deleteMany(); } catch (e) {}
    try { await prisma.article.deleteMany(); } catch (e) {}
    try { await prisma.refreshToken.deleteMany(); } catch (e) {}
    try { await prisma.user.deleteMany(); } catch (e) {}
    console.log('🧹 Cleared all existing data');
  }

  // Create admin users
  const adminEmail = 'admin@bioblio.com';
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  
  if (!admin) {
    const adminPassword = await bcrypt.hash('admin123', 12);
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        username: 'admin',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
        reputation: 1000,
      },
    });
    console.log('👤 Created admin user:', admin.email);
  }

  // Seed some initial data
  console.log('🧪 Seeding molecules...');
  await prisma.molecule.create({
    data: {
        name: 'Water',
        formula: 'H2O',
        weight: 18.015,
        smiles: 'O',
        description: 'The universal solvent.',
    }
  });

  console.log('🧬 Seeding proteins...');
  await prisma.protein.create({
    data: {
        name: 'Hemoglobin',
        description: 'Oxygen transport protein.',
        pdbId: '1A3N',
    }
  });

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
