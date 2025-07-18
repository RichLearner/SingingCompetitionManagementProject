"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAccess } from "@/lib/admin-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface JudgeFormData {
  competition_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  photo_url?: string | null;
  is_active?: boolean;
  specialization?: string | null;
  experience_years?: number | null;
}

export async function createJudge(formData: FormData) {
  // Verify admin access
  await requireAdminAccess();

  const competitionId = formData.get("competition_id") as string;
  const data: JudgeFormData = {
    competition_id: competitionId,
    name: formData.get("name") as string,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    photo_url: (formData.get("photo_url") as string) || null,
    is_active: formData.get("is_active") === "true",
    specialization: (formData.get("specialization") as string) || null,
    experience_years: formData.get("experience_years")
      ? parseInt(formData.get("experience_years") as string)
      : null,
  };

  // Validate required fields
  if (!data.name) {
    throw new Error("評審姓名為必填項目");
  }

  if (!data.competition_id) {
    throw new Error("競賽ID為必填項目");
  }

  // Validate email format if provided
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw new Error("電子郵件格式不正確");
  }

  // Check if email already exists for this competition
  if (data.email) {
    const { data: existingJudge } = await supabase
      .from("judges")
      .select("id")
      .eq("competition_id", competitionId)
      .eq("email", data.email)
      .single();

    if (existingJudge) {
      throw new Error("該電子郵件已被使用");
    }
  }

  try {
    // Insert judge
    const { data: judge, error } = await supabase
      .from("judges")
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error("Error creating judge:", error);
      throw new Error("建立評審時發生錯誤");
    }

    revalidatePath(`/admin/competitions/${competitionId}`);
    revalidatePath(`/admin/competitions/${competitionId}/judges`);
    return { success: true, judgeId: judge.id };
  } catch (error) {
    console.error("Error creating judge:", error);
    throw new Error("建立評審時發生錯誤");
  }
}

export async function updateJudge(judgeId: string, formData: FormData) {
  // Verify admin access
  await requireAdminAccess();

  const competitionId = formData.get("competition_id") as string;
  const data: Partial<JudgeFormData> = {
    name: formData.get("name") as string,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    photo_url: (formData.get("photo_url") as string) || null,
    is_active: formData.get("is_active") === "true",
    specialization: (formData.get("specialization") as string) || null,
    experience_years: formData.get("experience_years")
      ? parseInt(formData.get("experience_years") as string)
      : null,
  };

  // Validate required fields
  if (!data.name) {
    throw new Error("評審姓名為必填項目");
  }

  // Validate email format if provided
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw new Error("電子郵件格式不正確");
  }

  // Check if email conflicts with other judges (excluding current judge)
  if (data.email) {
    const { data: existingJudge } = await supabase
      .from("judges")
      .select("id")
      .eq("competition_id", competitionId)
      .eq("email", data.email)
      .neq("id", judgeId)
      .single();

    if (existingJudge) {
      throw new Error("該電子郵件已被使用");
    }
  }

  try {
    const { error } = await supabase
      .from("judges")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", judgeId);

    if (error) {
      console.error("Error updating judge:", error);
      throw new Error("更新評審時發生錯誤");
    }

    revalidatePath(`/admin/competitions/${competitionId}`);
    revalidatePath(`/admin/competitions/${competitionId}/judges`);
    return { success: true };
  } catch (error) {
    console.error("Error updating judge:", error);
    throw new Error("更新評審時發生錯誤");
  }
}

export async function deleteJudge(judgeId: string, competitionId: string) {
  // Verify admin access
  await requireAdminAccess();

  try {
    // Check if judge has any scores
    const { data: scores } = await supabase
      .from("scores")
      .select("id")
      .eq("judge_id", judgeId);

    if (scores && scores.length > 0) {
      throw new Error("無法刪除已有評分記錄的評審");
    }

    const { error } = await supabase.from("judges").delete().eq("id", judgeId);

    if (error) {
      console.error("Error deleting judge:", error);
      throw new Error("刪除評審時發生錯誤");
    }

    revalidatePath(`/admin/competitions/${competitionId}`);
    revalidatePath(`/admin/competitions/${competitionId}/judges`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting judge:", error);
    throw new Error("刪除評審時發生錯誤");
  }
}

export async function toggleJudgeStatus(
  judgeId: string,
  competitionId: string
) {
  // Verify admin access
  await requireAdminAccess();

  try {
    // Get current status
    const { data: judge } = await supabase
      .from("judges")
      .select("is_active")
      .eq("id", judgeId)
      .single();

    if (!judge) {
      throw new Error("評審不存在");
    }

    const { error } = await supabase
      .from("judges")
      .update({
        is_active: !judge.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", judgeId);

    if (error) {
      console.error("Error toggling judge status:", error);
      throw new Error("切換評審狀態時發生錯誤");
    }

    revalidatePath(`/admin/competitions/${competitionId}`);
    revalidatePath(`/admin/competitions/${competitionId}/judges`);
    return { success: true };
  } catch (error) {
    console.error("Error toggling judge status:", error);
    throw new Error("切換評審狀態時發生錯誤");
  }
}

export async function bulkCreateJudges(
  judges: {
    name: string;
    email?: string;
    phone?: string;
    specialization?: string;
    experience_years?: number;
  }[],
  competitionId: string
) {
  // Verify admin access
  await requireAdminAccess();

  if (!judges || judges.length === 0) {
    throw new Error("評審清單不能為空");
  }

  // Validate all judges
  for (const judge of judges) {
    if (!judge.name || judge.name.trim() === "") {
      throw new Error("所有評審都必須有姓名");
    }

    if (judge.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(judge.email)) {
      throw new Error(`評審 ${judge.name} 的電子郵件格式不正確`);
    }
  }

  // Check for duplicate emails
  const emails = judges.filter((j) => j.email).map((j) => j.email);
  const uniqueEmails = new Set(emails);
  if (emails.length !== uniqueEmails.size) {
    throw new Error("評審清單中有重複的電子郵件");
  }

  try {
    const { data, error } = await supabase
      .from("judges")
      .insert(
        judges.map((j) => ({
          competition_id: competitionId,
          name: j.name.trim(),
          email: j.email || null,
          phone: j.phone || null,
          specialization: j.specialization || null,
          experience_years: j.experience_years || null,
          is_active: true,
        }))
      )
      .select();

    if (error) {
      console.error("Error bulk creating judges:", error);
      throw new Error("批量建立評審時發生錯誤");
    }

    revalidatePath(`/admin/competitions/${competitionId}`);
    revalidatePath(`/admin/competitions/${competitionId}/judges`);

    return { success: true, judges: data };
  } catch (error) {
    console.error("Error bulk creating judges:", error);
    throw new Error("批量建立評審時發生錯誤");
  }
}
