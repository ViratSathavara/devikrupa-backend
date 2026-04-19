import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function cleanupTestUsers() {
  try {
    // Delete test users (emails containing 'test' or 'example')
    const result = await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { contains: 'test' } },
          { email: { contains: 'example' } },
        ],
      },
    });

    console.log(`✅ Deleted ${result.count} test users`);

    // List remaining users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    console.log('\n📋 Remaining users:');
    users.forEach((user) => {
      console.log(`  - ${user.email} (${user.name})`);
    });

    if (users.length === 0) {
      console.log('  No users in database');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestUsers();
