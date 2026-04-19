import 'dotenv/config';
import prisma from '../src/lib/prisma';

const email = process.argv[2];

async function deleteUser() {
  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: npx ts-node scripts/delete-user-by-email.ts user@example.com');
    process.exit(1);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    await prisma.user.delete({
      where: { email },
    });

    console.log(`✅ Successfully deleted user: ${email}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUser();
