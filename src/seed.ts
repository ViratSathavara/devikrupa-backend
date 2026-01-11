import "dotenv/config"; // 👈 REQUIRED
import { seedDefaultAdmin } from "./utils/seedAdmin";

async function main() {
  await seedDefaultAdmin();
}

main()
  .then(() => {
    console.log("✅ Seeding completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  });
