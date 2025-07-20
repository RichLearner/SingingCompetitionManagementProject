const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateDatabase() {
  try {
    console.log("🔄 Updating judges table schema...");

    // Read the migration SQL
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, "update-judges-schema.sql"),
      "utf8"
    );

    // Execute the migration
    const { error } = await supabase.rpc("exec_sql", { sql: migrationSQL });

    if (error) {
      console.error("❌ Error updating database:", error);
      return;
    }

    console.log("✅ Database schema updated successfully!");
    console.log("📝 You can now create judges without errors.");
  } catch (error) {
    console.error("❌ Error running migration:", error);
    console.log(
      "💡 Alternative: Run the SQL manually in your Supabase dashboard"
    );
  }
}

// Run the migration
updateDatabase();
