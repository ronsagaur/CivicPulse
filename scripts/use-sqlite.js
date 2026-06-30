const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Skip switching back to SQLite in production/CI environments
if (process.env.CI || process.env.VERCEL || process.env.NODE_ENV === "production" || process.env.FIREBASE_CONFIG || process.env.GOOGLE_CLOUD_PROJECT) {
  console.log("[use-sqlite.js] Skipping SQLite swap in CI/production environment.");
  process.exit(0);
}

const schemaPath = path.join(__dirname, "../prisma/schema.prisma");

try {
  let schema = fs.readFileSync(schemaPath, "utf8");
  
  // Replace PostgreSQL provider config with SQLite
  if (schema.includes('provider = "postgresql"')) {
    console.log("[use-sqlite.js] Swapping Prisma provider to 'sqlite'...");
    schema = schema.replace('provider = "postgresql"', 'provider = "sqlite"');
    fs.writeFileSync(schemaPath, schema, "utf8");
    
    // Regenerate Prisma client for SQLite
    console.log("[use-sqlite.js] Generating Prisma Client for SQLite...");
    execSync("npx prisma generate", { stdio: "inherit" });
    console.log("[use-sqlite.js] Done.");
  } else {
    console.log("[use-sqlite.js] Prisma provider is already 'sqlite'.");
  }
} catch (err) {
  console.error("[use-sqlite.js] Error:", err);
  process.exit(1);
}
