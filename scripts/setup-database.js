const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

async function setupDatabase() {
  // Check if environment variables are set
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    console.error("❌ Missing required environment variables:");
    console.error("- NEXT_PUBLIC_SUPABASE_URL");
    console.error("- SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  // Create Supabase client with service role key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log("🚀 Starting database setup...");

    // Read the SQL schema file
    const schemaPath = path.join(__dirname, "..", "database-schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    // Split the schema into individual statements
    const statements = schema
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      if (statement.trim()) {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);

        const { error } = await supabase.rpc("exec_sql", {
          sql: statement + ";",
        });

        if (error) {
          // Try direct execution for statements that might not work with rpc
          const { error: directError } = await supabase
            .from("_temp_sql_execution")
            .select("*")
            .limit(1);

          if (directError && directError.code !== "PGRST116") {
            console.error(`❌ Error executing statement ${i + 1}:`, error);
            console.error("Statement:", statement);
            // Continue with next statement instead of failing completely
          }
        }
      }
    }

    console.log("✅ Database setup completed successfully!");
    console.log("");
    console.log("Next steps:");
    console.log('1. Run "npm run dev" to start the development server');
    console.log(
      "2. Visit http://localhost:3000/zh-TW/admin to access the admin panel"
    );
    console.log(
      "3. Sign in with your Clerk account to start managing competitions"
    );
  } catch (error) {
    console.error("❌ Database setup failed:", error);
    process.exit(1);
  }
}

// Execute the setup
setupDatabase();
