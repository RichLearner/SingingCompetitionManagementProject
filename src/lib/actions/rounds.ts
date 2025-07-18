"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAccess } from "@/lib/admin-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface RoundFormData {
  competition_id: string;
  round_number: number;
  name: string;
  name_en: string;
  description: string;
  elimination_count: number;
  is_public_voting: boolean;
  public_votes_per_user: number;
  status: string;
  start_time: string;
  end_time: string;
}

export async function createRound(formData: FormData) {
  // Verify admin access
  await requireAdminAccess();

  const competitionId = formData.get("competition_id") as string;
  const data: RoundFormData = {
    competition_id: competitionId,
    round_number: parseInt(formData.get("round_number") as string),
    name: formData.get("name") as string,
    name_en: formData.get("name_en") as string,
    description: formData.get("description") as string,
    elimination_count:
      parseInt(formData.get("elimination_count") as string) || 0,
    is_public_voting: formData.get("is_public_voting") === "true",
    public_votes_per_user:
      parseInt(formData.get("public_votes_per_user") as string) || 5,
    status: (formData.get("status") as string) || "pending",
    start_time: formData.get("start_time") as string,
    end_time: formData.get("end_time") as string,
  };

  // Validate required fields
  if (!data.name) {
    throw new Error("回合名稱為必填項目");
  }

  if (!data.competition_id) {
    throw new Error("競賽ID為必填項目");
  }

  if (data.round_number <= 0) {
    throw new Error("回合編號必須大於0");
  }

  // Check if round number already exists for this competition
  const { data: existingRound } = await supabase
    .from("rounds")
    .select("id")
    .eq("competition_id", competitionId)
    .eq("round_number", data.round_number)
    .single();

  if (existingRound) {
    throw new Error("該回合編號已存在");
  }

  try {
    // Insert round
    const { data: round, error } = await supabase
      .from("rounds")
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error("Error creating round:", error);
      throw new Error("建立回合時發生錯誤");
    }

    revalidatePath(`/admin/competitions/${competitionId}`);
    return { success: true, roundId: round.id };
  } catch (error) {
    console.error("Error creating round:", error);
    throw new Error("建立回合時發生錯誤");
  }
}

export async function updateRound(roundId: string, formData: FormData) {
  // Verify admin access
  await requireAdminAccess();

  const competitionId = formData.get("competition_id") as string;
  const data: Partial<RoundFormData> = {
    round_number: parseInt(formData.get("round_number") as string),
    name: formData.get("name") as string,
    name_en: formData.get("name_en") as string,
    description: formData.get("description") as string,
    elimination_count:
      parseInt(formData.get("elimination_count") as string) || 0,
    is_public_voting: formData.get("is_public_voting") === "true",
    public_votes_per_user:
      parseInt(formData.get("public_votes_per_user") as string) || 5,
    status: formData.get("status") as string,
    start_time: formData.get("start_time") as string,
    end_time: formData.get("end_time") as string,
  };

  // Validate required fields
  if (!data.name) {
    throw new Error("回合名稱為必填項目");
  }

  if (!data.round_number || data.round_number <= 0) {
    throw new Error("回合編號必須大於0");
  }

  // Check if round number conflicts with other rounds (excluding current round)
  const { data: existingRound } = await supabase
    .from("rounds")
    .select("id")
    .eq("competition_id", competitionId)
    .eq("round_number", data.round_number)
    .neq("id", roundId)
    .single();

  if (existingRound) {
    throw new Error("該回合編號已存在");
  }

  try {
    const { error } = await supabase
      .from("rounds")
      .update(data)
      .eq("id", roundId);

    if (error) {
      console.error("Error updating round:", error);
      throw new Error("更新回合時發生錯誤");
    }

    revalidatePath(`/admin/competitions/${competitionId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating round:", error);
    throw new Error("更新回合時發生錯誤");
  }
}

export async function deleteRound(roundId: string, competitionId: string) {
  // Verify admin access
  await requireAdminAccess();

  try {
    const { error } = await supabase.from("rounds").delete().eq("id", roundId);

    if (error) {
      console.error("Error deleting round:", error);
      throw new Error("刪除回合時發生錯誤");
    }

    revalidatePath(`/admin/competitions/${competitionId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting round:", error);
    throw new Error("刪除回合時發生錯誤");
  }
}

export async function updateRoundStatus(
  roundId: string,
  status: string,
  competitionId: string
) {
  // Verify admin access
  await requireAdminAccess();

  try {
    const { error } = await supabase
      .from("rounds")
      .update({ status })
      .eq("id", roundId);

    if (error) {
      console.error("Error updating round status:", error);
      throw new Error("更新回合狀態時發生錯誤");
    }

    revalidatePath(`/admin/competitions/${competitionId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating round status:", error);
    throw new Error("更新回合狀態時發生錯誤");
  }
}

export async function startRound(roundId: string, competitionId: string) {
  // Verify admin access
  await requireAdminAccess();

  try {
    // End any currently active rounds for this competition
    await supabase
      .from("rounds")
      .update({ status: "completed" })
      .eq("competition_id", competitionId)
      .eq("status", "active");

    // Start the selected round
    const { error } = await supabase
      .from("rounds")
      .update({
        status: "active",
        start_time: new Date().toISOString(),
      })
      .eq("id", roundId);

    if (error) {
      console.error("Error starting round:", error);
      throw new Error("開始回合時發生錯誤");
    }

    // Update competition current round
    const { data: round } = await supabase
      .from("rounds")
      .select("round_number")
      .eq("id", roundId)
      .single();

    if (round) {
      await supabase
        .from("competitions")
        .update({ current_round: round.round_number })
        .eq("id", competitionId);
    }

    revalidatePath(`/admin/competitions/${competitionId}`);
    return { success: true };
  } catch (error) {
    console.error("Error starting round:", error);
    throw new Error("開始回合時發生錯誤");
  }
}

export async function endRound(roundId: string, competitionId: string) {
  // Verify admin access
  await requireAdminAccess();

  try {
    const { error } = await supabase
      .from("rounds")
      .update({
        status: "completed",
        end_time: new Date().toISOString(),
      })
      .eq("id", roundId);

    if (error) {
      console.error("Error ending round:", error);
      throw new Error("結束回合時發生錯誤");
    }

    revalidatePath(`/admin/competitions/${competitionId}`);
    return { success: true };
  } catch (error) {
    console.error("Error ending round:", error);
    throw new Error("結束回合時發生錯誤");
  }
}
