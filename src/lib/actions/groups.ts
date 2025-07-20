"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAccess } from "@/lib/admin-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface GroupFormData {
  competition_id: string;
  name: string;
  photo_url?: string | null;
  leader_id?: string | null;
  is_eliminated?: boolean;
  elimination_round?: number | null;
}

export async function createGroup(formData: FormData) {
  // Verify admin access
  await requireAdminAccess();

  const competitionId = formData.get("competition_id") as string;
  const leaderId = formData.get("leader_id") as string;

  const data: GroupFormData = {
    competition_id: competitionId,
    name: formData.get("name") as string,
    photo_url: (formData.get("photo_url") as string) || null,
    leader_id: leaderId === "none" || leaderId === "" ? null : leaderId,
    is_eliminated: formData.get("is_eliminated") === "true",
    elimination_round: formData.get("elimination_round")
      ? parseInt(formData.get("elimination_round") as string)
      : null,
  };

  // Validate required fields
  if (!data.name) {
    throw new Error("組別名稱為必填項目");
  }

  if (!data.competition_id) {
    throw new Error("競賽ID為必填項目");
  }

  // Check if group name already exists for this competition
  const { data: existingGroup } = await supabase
    .from("groups")
    .select("id")
    .eq("competition_id", competitionId)
    .eq("name", data.name)
    .single();

  if (existingGroup) {
    throw new Error("該組別名稱已存在");
  }

  try {
    // Insert group
    const { data: group, error } = await supabase
      .from("groups")
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error("Error creating group:", error);
      throw new Error("建立組別時發生錯誤");
    }

    revalidatePath(`/admin/competitions/${competitionId}`);
    revalidatePath(`/admin/competitions/${competitionId}/groups`);
    return { success: true, groupId: group.id };
  } catch (error) {
    console.error("Error creating group:", error);
    throw new Error("建立組別時發生錯誤");
  }
}

export async function updateGroup(groupId: string, formData: FormData) {
  // Verify admin access
  await requireAdminAccess();

  const competitionId = formData.get("competition_id") as string;
  const leaderId = formData.get("leader_id") as string;

  const data: Partial<GroupFormData> = {
    name: formData.get("name") as string,
    photo_url: (formData.get("photo_url") as string) || null,
    leader_id: leaderId === "none" || leaderId === "" ? null : leaderId,
    is_eliminated: formData.get("is_eliminated") === "true",
    elimination_round: formData.get("elimination_round")
      ? parseInt(formData.get("elimination_round") as string)
      : null,
  };

  // Validate required fields
  if (!data.name) {
    throw new Error("組別名稱為必填項目");
  }

  // Check if group name conflicts with other groups (excluding current group)
  const { data: existingGroup } = await supabase
    .from("groups")
    .select("id")
    .eq("competition_id", competitionId)
    .eq("name", data.name)
    .neq("id", groupId)
    .single();

  if (existingGroup) {
    throw new Error("該組別名稱已存在");
  }

  try {
    const { error } = await supabase
      .from("groups")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", groupId);

    if (error) {
      console.error("Error updating group:", error);
      throw new Error("更新組別時發生錯誤");
    }

    revalidatePath(`/admin/competitions/${competitionId}`);
    revalidatePath(`/admin/competitions/${competitionId}/groups`);
    return { success: true };
  } catch (error) {
    console.error("Error updating group:", error);
    throw new Error("更新組別時發生錯誤");
  }
}

export async function deleteGroup(groupId: string, competitionId: string) {
  // Verify admin access
  await requireAdminAccess();

  try {
    // Check if group has participants
    const { data: participants } = await supabase
      .from("participants")
      .select("id")
      .eq("group_id", groupId);

    if (participants && participants.length > 0) {
      throw new Error("無法刪除包含參賽者的組別");
    }

    const { error } = await supabase.from("groups").delete().eq("id", groupId);

    if (error) {
      console.error("Error deleting group:", error);
      throw new Error("刪除組別時發生錯誤");
    }

    revalidatePath(`/admin/competitions/${competitionId}`);
    revalidatePath(`/admin/competitions/${competitionId}/groups`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting group:", error);
    throw new Error("刪除組別時發生錯誤");
  }
}

export async function eliminateGroup(
  groupId: string,
  competitionId: string,
  roundNumber: number
) {
  // Verify admin access
  await requireAdminAccess();

  try {
    const { error } = await supabase
      .from("groups")
      .update({
        is_eliminated: true,
        elimination_round: roundNumber,
        updated_at: new Date().toISOString(),
      })
      .eq("id", groupId);

    if (error) {
      console.error("Error eliminating group:", error);
      throw new Error("淘汰組別時發生錯誤");
    }

    revalidatePath(`/admin/competitions/${competitionId}`);
    revalidatePath(`/admin/competitions/${competitionId}/groups`);
    return { success: true };
  } catch (error) {
    console.error("Error eliminating group:", error);
    throw new Error("淘汰組別時發生錯誤");
  }
}

export async function reinstateGroup(groupId: string, competitionId: string) {
  // Verify admin access
  await requireAdminAccess();

  try {
    const { error } = await supabase
      .from("groups")
      .update({
        is_eliminated: false,
        elimination_round: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", groupId);

    if (error) {
      console.error("Error reinstating group:", error);
      throw new Error("復活組別時發生錯誤");
    }

    revalidatePath(`/admin/competitions/${competitionId}`);
    revalidatePath(`/admin/competitions/${competitionId}/groups`);
    return { success: true };
  } catch (error) {
    console.error("Error reinstating group:", error);
    throw new Error("復活組別時發生錯誤");
  }
}

export async function updateGroupLeader(
  groupId: string,
  participantId: string | null,
  competitionId: string
) {
  // Verify admin access
  await requireAdminAccess();

  try {
    const { error } = await supabase
      .from("groups")
      .update({
        leader_id: participantId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", groupId);

    if (error) {
      console.error("Error updating group leader:", error);
      throw new Error("更新組長時發生錯誤");
    }

    revalidatePath(`/admin/competitions/${competitionId}`);
    revalidatePath(`/admin/competitions/${competitionId}/groups`);
    return { success: true };
  } catch (error) {
    console.error("Error updating group leader:", error);
    throw new Error("更新組長時發生錯誤");
  }
}
