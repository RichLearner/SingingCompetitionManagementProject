"use server";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getLEDScreenData() {
  try {
    // Fetch active competitions
    const { data: competitions } = await supabase
      .from("competitions")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    let allResults: any[] = [];

    if (competitions && competitions.length > 0) {
      // Fetch results for each competition's current round
      for (const competition of competitions) {
        const { data: results } = await supabase
          .from("competition_results")
          .select(
            `
            *,
            group:groups(name, photo_url),
            round:rounds(name, round_number, status)
          `
          )
          .eq("competition_id", competition.id)
          .eq("round.round_number", competition.current_round)
          .order("rank", { ascending: true });

        if (results) {
          allResults = [...allResults, ...results];
        }
      }
    }

    return {
      success: true,
      competitions: competitions || [],
      results: allResults,
    };
  } catch (error) {
    console.error("Error fetching LED screen data:", error);
    return {
      success: false,
      competitions: [],
      results: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
