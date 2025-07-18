import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function checkAdminAccess() {
  const { userId } = await auth();

  if (!userId) {
    return { isAuthorized: false, user: null };
  }

  try {
    // Check if user exists in admin_users table
    const { data: adminUser, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("clerk_user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error checking admin access:", error);
      return { isAuthorized: false, user: null };
    }

    return {
      isAuthorized: !!adminUser,
      user: adminUser || null,
    };
  } catch (error) {
    console.error("Error checking admin access:", error);
    return { isAuthorized: false, user: null };
  }
}

export async function requireAdminAccess() {
  const { isAuthorized, user } = await checkAdminAccess();

  if (!isAuthorized) {
    throw new Error("Unauthorized: Admin access required");
  }

  return user;
}
