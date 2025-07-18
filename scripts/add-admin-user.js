const { createClient } = require("@supabase/supabase-js");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

async function addAdminUser() {
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

  // Get command line arguments
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(
      "Usage: node scripts/add-admin-user.js <clerk_user_id> <name> [email] [is_super_admin]"
    );
    console.log("");
    console.log("Examples:");
    console.log(
      '  node scripts/add-admin-user.js "user_abc123" "John Doe" "john@example.com" true'
    );
    console.log(
      '  node scripts/add-admin-user.js "user_def456" "Jane Smith" "jane@example.com"'
    );
    console.log("");
    console.log("How to get clerk_user_id:");
    console.log("1. Sign in to your application");
    console.log("2. The user ID will be shown on the unauthorized page");
    console.log("3. Or check the Clerk dashboard under Users");
    process.exit(1);
  }

  const clerkUserId = args[0];
  const name = args[1];
  const email = args[2] || null;
  const isSuperAdmin = args[3] === "true";

  // Create Supabase client with service role key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log("🔍 Checking if user already exists...");

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("admin_users")
      .select("*")
      .eq("clerk_user_id", clerkUserId)
      .single();

    if (existingUser) {
      console.log("⚠️  User already exists in admin_users table:");
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Super Admin: ${existingUser.is_super_admin}`);
      console.log(`   Created: ${existingUser.created_at}`);

      const answer = require("readline-sync").question(
        "Do you want to update this user? (y/N): "
      );
      if (answer.toLowerCase() !== "y") {
        console.log("❌ Operation cancelled");
        process.exit(0);
      }

      // Update existing user
      const { error } = await supabase
        .from("admin_users")
        .update({
          name: name,
          email: email,
          is_super_admin: isSuperAdmin,
        })
        .eq("clerk_user_id", clerkUserId);

      if (error) {
        console.error("❌ Error updating admin user:", error);
        process.exit(1);
      }

      console.log("✅ Admin user updated successfully!");
    } else {
      console.log("➕ Adding new admin user...");

      // Add new admin user
      const { error } = await supabase.from("admin_users").insert({
        clerk_user_id: clerkUserId,
        name: name,
        email: email,
        is_super_admin: isSuperAdmin,
      });

      if (error) {
        console.error("❌ Error adding admin user:", error);
        process.exit(1);
      }

      console.log("✅ Admin user added successfully!");
    }

    console.log("");
    console.log("📋 User Details:");
    console.log(`   Clerk User ID: ${clerkUserId}`);
    console.log(`   Name: ${name}`);
    console.log(`   Email: ${email || "Not provided"}`);
    console.log(`   Super Admin: ${isSuperAdmin}`);
    console.log("");
    console.log("✅ The user can now access the admin portal at:");
    console.log(
      "   http://localhost:3001/zh-TW/admin (or your deployment URL)"
    );
  } catch (error) {
    console.error("❌ Failed to add admin user:", error);
    process.exit(1);
  }
}

// Execute the script
addAdminUser();
