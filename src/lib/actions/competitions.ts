"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAccess } from "@/lib/admin-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface CompetitionFormData {
  name: string;
  name_en: string;
  description: string;
  status: string;
  current_round: number;
  total_rounds: number;
  voting_enabled: boolean;
  display_mode: string;
}

export async function createCompetition(formData: FormData) {
  // Verify admin access
  await requireAdminAccess();

  const data: CompetitionFormData = {
    name: formData.get("name") as string,
    name_en: formData.get("name_en") as string,
    description: formData.get("description") as string,
    status: formData.get("status") as string,
    current_round: parseInt(formData.get("current_round") as string),
    total_rounds: parseInt(formData.get("total_rounds") as string),
    voting_enabled: formData.get("voting_enabled") === "true",
    display_mode: formData.get("display_mode") as string,
  };

  // Validate required fields
  if (!data.name) {
    throw new Error("競賽名稱為必填項目");
  }

  if (data.current_round > data.total_rounds) {
    throw new Error("目前回合不能大於總回合數");
  }

  try {
    // Insert competition
    const { data: competition, error } = await supabase
      .from("competitions")
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error("Error creating competition:", error);
      throw new Error("建立競賽時發生錯誤");
    }

    // Create default scoring factors for 803 Event
    const defaultScoringFactors = [
      {
        name: "創意",
        name_en: "Creativity",
        max_score: 10,
        weight: 1.0,
        order_index: 1,
      },
      {
        name: "默契",
        name_en: "Teamwork",
        max_score: 10,
        weight: 1.0,
        order_index: 2,
      },
      {
        name: "氣氛",
        name_en: "Atmosphere",
        max_score: 10,
        weight: 1.0,
        order_index: 3,
      },
      {
        name: "演繹",
        name_en: "Performance",
        max_score: 10,
        weight: 1.0,
        order_index: 4,
      },
      {
        name: "演唱",
        name_en: "Singing",
        max_score: 10,
        weight: 1.0,
        order_index: 5,
      },
    ];

    const scoringFactorsData = defaultScoringFactors.map((factor) => ({
      ...factor,
      competition_id: competition.id,
    }));

    await supabase.from("scoring_factors").insert(scoringFactorsData);

    // Create default rounds
    const defaultRounds = [
      {
        round_number: 1,
        name: "第一回合",
        name_en: "Round 1",
        description: "初賽回合",
        is_public_voting: false,
        status: "pending",
      },
      {
        round_number: 2,
        name: "第二回合",
        name_en: "Round 2",
        description: "決賽回合",
        is_public_voting: true,
        public_votes_per_user: 5,
        status: "pending",
      },
    ];

    const roundsData = defaultRounds
      .slice(0, data.total_rounds)
      .map((round) => ({
        ...round,
        competition_id: competition.id,
      }));

    await supabase.from("rounds").insert(roundsData);

    revalidatePath("/admin/competitions");
    return { success: true, competitionId: competition.id };
  } catch (error) {
    console.error("Error creating competition:", error);
    throw new Error("建立競賽時發生錯誤");
  }
}

export async function updateCompetition(
  competitionId: string,
  formData: FormData
) {
  // Verify admin access
  await requireAdminAccess();

  const data: CompetitionFormData = {
    name: formData.get("name") as string,
    name_en: formData.get("name_en") as string,
    description: formData.get("description") as string,
    status: formData.get("status") as string,
    current_round: parseInt(formData.get("current_round") as string),
    total_rounds: parseInt(formData.get("total_rounds") as string),
    voting_enabled: formData.get("voting_enabled") === "true",
    display_mode: formData.get("display_mode") as string,
  };

  // Validate required fields
  if (!data.name) {
    throw new Error("競賽名稱為必填項目");
  }

  if (data.current_round > data.total_rounds) {
    throw new Error("目前回合不能大於總回合數");
  }

  try {
    const { error } = await supabase
      .from("competitions")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", competitionId);

    if (error) {
      console.error("Error updating competition:", error);
      throw new Error("更新競賽時發生錯誤");
    }

    revalidatePath("/admin/competitions");
    return { success: true };
  } catch (error) {
    console.error("Error updating competition:", error);
    throw new Error("更新競賽時發生錯誤");
  }
}

export async function deleteCompetition(competitionId: string) {
  // Verify admin access
  await requireAdminAccess();

  try {
    const { error } = await supabase
      .from("competitions")
      .delete()
      .eq("id", competitionId);

    if (error) {
      console.error("Error deleting competition:", error);
      throw new Error("刪除競賽時發生錯誤");
    }

    revalidatePath("/admin/competitions");
    return { success: true };
  } catch (error) {
    console.error("Error deleting competition:", error);
    throw new Error("刪除競賽時發生錯誤");
  }
}

export async function updateCompetitionStatus(
  competitionId: string,
  status: string
) {
  // Verify admin access
  await requireAdminAccess();

  try {
    const { error } = await supabase
      .from("competitions")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", competitionId);

    if (error) {
      console.error("Error updating competition status:", error);
      throw new Error("更新競賽狀態時發生錯誤");
    }

    revalidatePath("/admin/competitions");
    return { success: true };
  } catch (error) {
    console.error("Error updating competition status:", error);
    throw new Error("更新競賽狀態時發生錯誤");
  }
}
