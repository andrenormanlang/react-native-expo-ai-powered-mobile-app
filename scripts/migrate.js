const { migrateSchema } = require("./schema.js");

async function runMigration() {
  try {
    await migrateSchema();
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
