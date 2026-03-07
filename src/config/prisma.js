// Reuse the shared Prisma client that is configured with Neon adapter options.
const prismaModule = require("../lib/prisma");
const prisma = prismaModule.default || prismaModule;

module.exports = prisma;
