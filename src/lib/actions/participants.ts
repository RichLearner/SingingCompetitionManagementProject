"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAccess } from "@/lib/admin-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ParticipantFormData {
  name: string;
  photo_url?: string | null;
  group_id?: string | null;
}

export async function createParticipant(
  formData: FormData,
  competitionId: string
) {
  // Verify admin access
  await requireAdminAccess();

  const data: ParticipantFormData = {
    name: formData.get("name") as string,
    photo_url: (formData.get("photo_url") as string) || null,
    group_id: (formData.get("group_id") as string) || null,
  };

  console.log("Form data received:", {
    name: data.name,
    photo_url: data.photo_url,
    group_id: data.group_id,
    competitionId: competitionId,
  });

  // Validate required fields
  if (!data.name) {
    throw new Error("參賽者姓名為必填項目");
  }

  // If group_id is provided, verify it belongs to the competition
  if (data.group_id && data.group_id.trim() !== "") {
    console.log(
      "Validating group_id:",
      data.group_id,
      "for competition:",
      competitionId
    );

    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, name, competition_id")
      .eq("id", data.group_id)
      .eq("competition_id", competitionId)
      .single();

    if (groupError) {
      console.error("Group validation error:", groupError);
      throw new Error(`組別驗證錯誤: ${groupError.message}`);
    }

    if (!group) {
      console.error("Group not found:", {
        group_id: data.group_id,
        competition_id: competitionId,
      });
      throw new Error(`無效的組別ID: ${data.group_id}`);
    }

    console.log("Group validation successful:", group);
  } else {
    console.log("No group_id provided, skipping validation");
  }

  try {
    // Insert participant
    const { data: participant, error } = await supabase
      .from("participants")
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error("Error creating participant:", error);
      throw new Error("建立參賽者時發生錯誤");
    }

    revalidatePath(`/admin/competitions/${competitionId}`);
    revalidatePath(`/admin/competitions/${competitionId}/participants`);
    if (data.group_id) {
      revalidatePath(
        `/admin/competitions/${competitionId}/groups/${data.group_id}`
      );
    }
    return { success: true, participantId: participant.id };
  } catch (error) {
    console.error("Error creating participant:", error);
    throw new Error("建立參賽者時發生錯誤");
  }
}

export async function updateParticipant(
  participantId: string,
  formData: FormData,
  competitionId: string
) {
  // Verify admin access
  await requireAdminAccess();

  const data: ParticipantFormData = {
    name: formData.get("name") as string,
    photo_url: (formData.get("photo_url") as string) || null,
    group_id: (formData.get("group_id") as string) || null,
  };

  console.log("Update form data received:", {
    name: data.name,
    photo_url: data.photo_url,
    group_id: data.group_id,
    competitionId: competitionId,
    participantId: participantId,
  });

  // Validate required fields
  if (!data.name) {
    throw new Error("參賽者姓名為必填項目");
  }

  // If group_id is provided, verify it belongs to the competition
  if (data.group_id && data.group_id.trim() !== "") {
    console.log(
      "Validating group_id:",
      data.group_id,
      "for competition:",
      competitionId
    );

    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, name, competition_id")
      .eq("id", data.group_id)
      .eq("competition_id", competitionId)
      .single();

    if (groupError) {
      console.error("Group validation error:", groupError);
      throw new Error(`組別驗證錯誤: ${groupError.message}`);
    }

    if (!group) {
      console.error("Group not found:", {
        group_id: data.group_id,
        competition_id: competitionId,
      });
      throw new Error(`無效的組別ID: ${data.group_id}`);
    }

    console.log("Group validation successful:", group);
  } else {
    console.log("No group_id provided, skipping validation");
  }

  // Get current participant data for revalidation
  const { data: currentParticipant } = await supabase
    .from("participants")
    .select("group_id")
    .eq("id", participantId)
    .single();

  try {
    const { error } = await supabase
      .from("participants")
      .update(data)
      .eq("id", participantId);

    if (error) {
      console.error("Error updating participant:", error);
      throw new Error("更新參賽者時發生錯誤");
    }

    revalidatePath(`/admin/competitions/${competitionId}`);
    revalidatePath(`/admin/competitions/${competitionId}/participants`);

    // Revalidate old group if participant was moved
    if (
      currentParticipant?.group_id &&
      currentParticipant.group_id !== data.group_id
    ) {
      revalidatePath(
        `/admin/competitions/${competitionId}/groups/${currentParticipant.group_id}`
      );
    }

    // Revalidate new group if participant was assigned
    if (data.group_id) {
      revalidatePath(
        `/admin/competitions/${competitionId}/groups/${data.group_id}`
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating participant:", error);
    throw new Error("更新參賽者時發生錯誤");
  }
}

export async function deleteParticipant(
  participantId: string,
  competitionId: string
) {
  // Verify admin access
  await requireAdminAccess();

  try {
    // Get participant data for revalidation
    const { data: participant } = await supabase
      .from("participants")
      .select("group_id")
      .eq("id", participantId)
      .single();

    // Check if participant is a group leader
    const { data: groups } = await supabase
      .from("groups")
      .select("id")
      .eq("leader_id", participantId);

    if (groups && groups.length > 0) {
      throw new Error("無法刪除身為組長的參賽者");
    }

    const { error } = await supabase
      .from("participants")
      .delete()
      .eq("id", participantId);

    if (error) {
      console.error("Error deleting participant:", error);
      throw new Error("刪除參賽者時發生錯誤");
    }

    revalidatePath(`/admin/competitions/${competitionId}`);
    revalidatePath(`/admin/competitions/${competitionId}/participants`);

    // Revalidate group if participant was assigned to one
    if (participant?.group_id) {
      revalidatePath(
        `/admin/competitions/${competitionId}/groups/${participant.group_id}`
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting participant:", error);
    throw new Error("刪除參賽者時發生錯誤");
  }
}

export async function assignParticipantToGroup(
  participantId: string,
  groupId: string | null,
  competitionId: string
) {
  // Verify admin access
  await requireAdminAccess();

  try {
    // If group_id is provided, verify it belongs to the competition
    if (groupId) {
      const { data: group } = await supabase
        .from("groups")
        .select("id")
        .eq("id", groupId)
        .eq("competition_id", competitionId)
        .single();

      if (!group) {
        throw new Error("無效的組別ID");
      }
    }

    // Get current participant data for revalidation
    const { data: currentParticipant } = await supabase
      .from("participants")
      .select("group_id")
      .eq("id", participantId)
      .single();

    const { error } = await supabase
      .from("participants")
      .update({ group_id: groupId })
      .eq("id", participantId);

    if (error) {
      console.error("Error assigning participant to group:", error);
      throw new Error("分配參賽者到組別時發生錯誤");
    }

    revalidatePath(`/admin/competitions/${competitionId}`);
    revalidatePath(`/admin/competitions/${competitionId}/participants`);

    // Revalidate old group if participant was moved
    if (
      currentParticipant?.group_id &&
      currentParticipant.group_id !== groupId
    ) {
      revalidatePath(
        `/admin/competitions/${competitionId}/groups/${currentParticipant.group_id}`
      );
    }

    // Revalidate new group if participant was assigned
    if (groupId) {
      revalidatePath(`/admin/competitions/${competitionId}/groups/${groupId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error assigning participant to group:", error);
    throw new Error("分配參賽者到組別時發生錯誤");
  }
}

export async function bulkCreateParticipants(
  participants: { name: string; photo_url?: string }[],
  competitionId: string
) {
  // Verify admin access
  await requireAdminAccess();

  if (!participants || participants.length === 0) {
    throw new Error("參賽者清單不能為空");
  }

  // Validate all participants
  for (const participant of participants) {
    if (!participant.name || participant.name.trim() === "") {
      throw new Error("所有參賽者都必須有姓名");
    }
  }

  try {
    const { data, error } = await supabase
      .from("participants")
      .insert(
        participants.map((p) => ({
          name: p.name.trim(),
          photo_url: p.photo_url || null,
          group_id: null,
        }))
      )
      .select();

    if (error) {
      console.error("Error bulk creating participants:", error);
      throw new Error("批量建立參賽者時發生錯誤");
    }

    revalidatePath(`/admin/competitions/${competitionId}`);
    revalidatePath(`/admin/competitions/${competitionId}/participants`);

    return { success: true, participants: data };
  } catch (error) {
    console.error("Error bulk creating participants:", error);
    throw new Error("批量建立參賽者時發生錯誤");
  }
}
