import prisma from "../lib/prisma";
import bcrypt from "bcrypt";

export const seedDefaultAdmin = async () => {
  const adminEmail = "admin@devikrupa.com";

  const existingAdmin = await prisma.admin.findUnique({
    where: { email: adminEmail }
  });

  if (existingAdmin) {
    console.log("✅ Default admin already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash("AdminDE@1234", 10);

  await prisma.admin.create({
    data: {
      name: "Super Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "SUPER_ADMIN"
    }
  });

  console.log("🚀 Default admin created successfully");
};
