import "dotenv/config";
import { seedDefaultAdmin } from "./utils/seedAdmin";
import { seedTranslationData } from "./utils/seedTranslationData";

async function main() {
  await seedDefaultAdmin();
  await seedTranslationData();
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
