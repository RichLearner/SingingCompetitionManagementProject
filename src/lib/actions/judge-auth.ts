"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function judgeLogin(formData: FormData) {
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;

  if (!name || !password) {
    return { success: false, error: "請輸入姓名和密碼" };
  }

  try {
    // Find judge by name
    const { data: judge, error } = await supabase
      .from("judges")
      .select("id, name, password_hash, competition_id, is_active")
      .eq("name", name)
      .single();

    if (error || !judge) {
      return { success: false, error: "評審姓名或密碼錯誤" };
    }

    if (!judge.is_active) {
      return { success: false, error: "此評審帳戶已被停用" };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, judge.password_hash);
    if (!isValidPassword) {
      return { success: false, error: "評審姓名或密碼錯誤" };
    }

    // Create session
    const sessionToken = await createJudgeSession(judge.id);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("judge_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return { success: true, judgeId: judge.id };
  } catch (error) {
    console.error("Judge login error:", error);
    return { success: false, error: "登入時發生錯誤" };
  }
}

export async function judgeLogout() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("judge_session")?.value;

  if (sessionToken) {
    // Remove session from database
    await supabase.from("judge_sessions").delete().eq("token", sessionToken);
  }

  // Clear cookie
  cookieStore.delete("judge_session");

  redirect("/judge/login");
}

export async function getCurrentJudge() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("judge_session")?.value;

  if (!sessionToken) {
    return null;
  }

  try {
    // Get session
    const { data: session } = await supabase
      .from("judge_sessions")
      .select("judge_id, expires_at")
      .eq("token", sessionToken)
      .single();

    if (!session || new Date(session.expires_at) < new Date()) {
      // Session expired, clear cookie
      cookieStore.delete("judge_session");
      return null;
    }

    // Get judge data
    const { data: judge } = await supabase
      .from("judges")
      .select(
        `
        id, 
        name, 
        photo_url, 
        is_active,
        competition:competitions(id, name, status)
      `
      )
      .eq("id", session.judge_id)
      .single();

    if (!judge || !judge.is_active) {
      return null;
    }

    return judge;
  } catch (error) {
    console.error("Error getting current judge:", error);
    return null;
  }
}

export async function requireJudgeAccess() {
  const judge = await getCurrentJudge();

  if (!judge) {
    redirect("/judge/login");
  }

  return judge;
}

async function createJudgeSession(judgeId: string): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await supabase.from("judge_sessions").insert({
    token,
    judge_id: judgeId,
    expires_at: expiresAt.toISOString(),
  });

  return token;
}
