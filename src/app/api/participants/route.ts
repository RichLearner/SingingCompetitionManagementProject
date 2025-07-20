import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("group_id");
    const competitionId = searchParams.get("competition_id");

    let query = supabase
      .from("participants")
      .select("id, name, photo_url, group_id")
      .order("name", { ascending: true });

    if (groupId) {
      // Get participants for a specific group
      query = query.eq("group_id", groupId);
    } else if (competitionId) {
      // Get all participants for a competition (including those without groups)
      // First get all groups for this competition
      const { data: competitionGroups, error: groupsError } = await supabase
        .from("groups")
        .select("id")
        .eq("competition_id", competitionId);

      if (groupsError) {
        return NextResponse.json(
          { error: "Failed to fetch groups" },
          { status: 500 }
        );
      }

      const groupIds = competitionGroups?.map((g) => g.id) || [];

      // Then get participants that are either not in any group or in groups from this competition
      if (groupIds.length > 0) {
        query = query.or(
          `group_id.is.null,group_id.in.(${groupIds.join(",")})`
        );
      } else {
        query = query.is("group_id", null);
      }
    }

    const { data: participants, error } = await query;

    if (error) {
      console.error("Error fetching participants:", error);
      return NextResponse.json(
        { error: "Failed to fetch participants" },
        { status: 500 }
      );
    }

    return NextResponse.json(participants || []);
  } catch (error) {
    console.error("Error in participants API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
