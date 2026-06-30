const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const schemaPath = path.join(__dirname, "../prisma/schema.prisma");

try {
  let schema = fs.readFileSync(schemaPath, "utf8");
  
  // Replace SQLite provider config with PostgreSQL
  if (schema.includes('provider = "sqlite"')) {
    console.log("[use-postgres.js] Swapping Prisma provider to 'postgresql'...");
    schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
    fs.writeFileSync(schemaPath, schema, "utf8");
    
    // Regenerate Prisma client for PostgreSQL
    console.log("[use-postgres.js] Generating Prisma Client for PostgreSQL...");
    execSync("npx prisma generate", { stdio: "inherit" });
    console.log("[use-postgres.js] Done.");
  } else {
    console.log("[use-postgres.js] Prisma provider is already 'postgresql'.");
  }
} catch (err) {
  console.error("[use-postgres.js] Error:", err);
  process.exit(1);
}
