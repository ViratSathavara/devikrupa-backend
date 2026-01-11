import prisma from "../lib/prisma";
import bcrypt from "bcrypt";

export const seedDefaultAdmin = async () => {
  const email = process.env.DEFAULT_ADMIN_EMAIL;
  const password = process.env.DEFAULT_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Admin seed ENV variables missing");
  }

  const existingAdmin = await prisma.admin.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log("✅ Default admin already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.admin.create({
    data: {
      name: "Super Admin",
      email,
      password: hashedPassword,
      role: "SUPER_ADMIN",
    },
  });

  console.log("🚀 Default admin created successfully");
};
