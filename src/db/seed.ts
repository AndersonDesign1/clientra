import { seedIfEmpty } from "./records";

console.log("Running database seeding...");
seedIfEmpty()
  .then(() => {
    console.log("Database seeding completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Database seeding failed:", error);
    process.exit(1);
  });
