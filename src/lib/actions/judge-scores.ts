"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currentUser } from "@clerk/nextjs/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Schema for score submission
const scoreSchema = z.object({
  judgeId: z.string().uuid(),
  groupId: z.string().uuid(),
  factorId: z.string().uuid(),
  roundId: z.string().uuid(),
  score: z.number().min(0).max(10),
  comments: z.string().optional(),
});

const batchScoreSchema = z.object({
  competitionId: z.string().uuid(),
  groupId: z.string().uuid(),
  roundId: z.string().uuid(),
  scores: z.array(
    z.object({
      factorId: z.string().uuid(),
      score: z.number().min(0).max(10),
      comments: z.string().optional(),
    })
  ),
});

export async function submitScore(data: z.infer<typeof scoreSchema>) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const validatedData = scoreSchema.parse(data);

    // Verify judge has access to this competition
    const { data: judge, error: judgeError } = await supabase
      .from("judges")
      .select("*")
      .eq("id", validatedData.judgeId)
      .eq("clerk_user_id", user.id)
      .eq("is_active", true)
      .single();

    if (judgeError || !judge) {
      throw new Error("Judge not found or access denied");
    }

    // Verify the round exists and is active
    const { data: round, error: roundError } = await supabase
      .from("rounds")
      .select("*")
      .eq("id", validatedData.roundId)
      .eq("status", "active")
      .single();

    if (roundError || !round) {
      throw new Error("Round not found or not active");
    }

    // Insert or update score
    const { data: score, error } = await supabase
      .from("judge_scores")
      .upsert({
        judge_id: validatedData.judgeId,
        group_id: validatedData.groupId,
        factor_id: validatedData.factorId,
        round_id: validatedData.roundId,
        score: validatedData.score,
        comments: validatedData.comments,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to submit score: ${error.message}`);
    }

    // Revalidate paths
    revalidatePath("/judge");
    revalidatePath(`/judge/competitions/${round.competition_id}`);
    revalidatePath(
      `/judge/competitions/${round.competition_id}/groups/${validatedData.groupId}`
    );

    return { success: true, score };
  } catch (error) {
    console.error("Error submitting score:", error);
    throw error;
  }
}

export async function submitBatchScores(
  data: z.infer<typeof batchScoreSchema>
) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    const validatedData = batchScoreSchema.parse(data);

    // Verify judge has access to this competition
    const { data: judge, error: judgeError } = await supabase
      .from("judges")
      .select("*")
      .eq("competition_id", validatedData.competitionId)
      .eq("clerk_user_id", user.id)
      .eq("is_active", true)
      .single();

    if (judgeError || !judge) {
      throw new Error("Judge not found or access denied");
    }

    // Verify the round exists and is active
    const { data: round, error: roundError } = await supabase
      .from("rounds")
      .select("*")
      .eq("id", validatedData.roundId)
      .eq("status", "active")
      .single();

    if (roundError || !round) {
      throw new Error("Round not found or not active");
    }

    // Prepare batch insert data
    const scoresToInsert = validatedData.scores.map((score) => ({
      judge_id: judge.id,
      group_id: validatedData.groupId,
      factor_id: score.factorId,
      round_id: validatedData.roundId,
      score: score.score,
      comments: score.comments,
      updated_at: new Date().toISOString(),
    }));

    // Insert or update all scores
    const { data: scores, error } = await supabase
      .from("judge_scores")
      .upsert(scoresToInsert)
      .select();

    if (error) {
      throw new Error(`Failed to submit scores: ${error.message}`);
    }

    // Revalidate paths
    revalidatePath("/judge");
    revalidatePath(`/judge/competitions/${validatedData.competitionId}`);
    revalidatePath(
      `/judge/competitions/${validatedData.competitionId}/groups/${validatedData.groupId}`
    );

    return { success: true, scores };
  } catch (error) {
    console.error("Error submitting batch scores:", error);
    throw error;
  }
}

export async function getJudgeScores(
  judgeId: string,
  roundId: string,
  groupId?: string
) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    // Verify judge access
    const { data: judge, error: judgeError } = await supabase
      .from("judges")
      .select("*")
      .eq("id", judgeId)
      .eq("clerk_user_id", user.id)
      .eq("is_active", true)
      .single();

    if (judgeError || !judge) {
      throw new Error("Judge not found or access denied");
    }

    let query = supabase
      .from("judge_scores")
      .select(
        `
        *,
        factor:scoring_factors(*),
        group:groups(*)
      `
      )
      .eq("judge_id", judgeId)
      .eq("round_id", roundId);

    if (groupId) {
      query = query.eq("group_id", groupId);
    }

    const { data: scores, error } = await query.order("created_at", {
      ascending: true,
    });

    if (error) {
      throw new Error(`Failed to fetch scores: ${error.message}`);
    }

    return { success: true, scores };
  } catch (error) {
    console.error("Error fetching judge scores:", error);
    throw error;
  }
}

export async function deleteScore(scoreId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    // Verify the score belongs to the current judge
    const { data: score, error: scoreError } = await supabase
      .from("judge_scores")
      .select(
        `
        *,
        judge:judges!inner(clerk_user_id)
      `
      )
      .eq("id", scoreId)
      .single();

    if (scoreError || !score || score.judge.clerk_user_id !== user.id) {
      throw new Error("Score not found or access denied");
    }

    // Delete the score
    const { error } = await supabase
      .from("judge_scores")
      .delete()
      .eq("id", scoreId);

    if (error) {
      throw new Error(`Failed to delete score: ${error.message}`);
    }

    // Get round info for revalidation
    const { data: round } = await supabase
      .from("rounds")
      .select("competition_id")
      .eq("id", score.round_id)
      .single();

    // Revalidate paths
    revalidatePath("/judge");
    if (round) {
      revalidatePath(`/judge/competitions/${round.competition_id}`);
      revalidatePath(
        `/judge/competitions/${round.competition_id}/groups/${score.group_id}`
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting score:", error);
    throw error;
  }
}

export async function getScoringSummary(
  competitionId: string,
  roundId: string
) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("Authentication required");
    }

    // Verify judge access
    const { data: judge, error: judgeError } = await supabase
      .from("judges")
      .select("*")
      .eq("competition_id", competitionId)
      .eq("clerk_user_id", user.id)
      .eq("is_active", true)
      .single();

    if (judgeError || !judge) {
      throw new Error("Judge not found or access denied");
    }

    // Get comprehensive scoring data
    const [{ data: groups }, { data: factors }, { data: scores }] =
      await Promise.all([
        supabase
          .from("groups")
          .select("*")
          .eq("competition_id", competitionId)
          .eq("is_eliminated", false)
          .order("name", { ascending: true }),

        supabase
          .from("scoring_factors")
          .select("*")
          .eq("competition_id", competitionId)
          .eq("is_active", true)
          .order("order_index", { ascending: true }),

        supabase
          .from("judge_scores")
          .select("*")
          .eq("judge_id", judge.id)
          .eq("round_id", roundId),
      ]);

    // Calculate summary statistics
    const totalPossibleScores = (groups?.length || 0) * (factors?.length || 0);
    const completedScores = scores?.length || 0;
    const progressPercentage =
      totalPossibleScores > 0
        ? Math.round((completedScores / totalPossibleScores) * 100)
        : 0;

    // Group scores by group for easy lookup
    const scoresByGroup =
      scores?.reduce((acc, score) => {
        if (!acc[score.group_id]) {
          acc[score.group_id] = [];
        }
        acc[score.group_id].push(score);
        return acc;
      }, {} as Record<string, any[]>) || {};

    return {
      success: true,
      summary: {
        totalGroups: groups?.length || 0,
        totalFactors: factors?.length || 0,
        totalPossibleScores,
        completedScores,
        progressPercentage,
        scoresByGroup,
        groups: groups || [],
        factors: factors || [],
      },
    };
  } catch (error) {
    console.error("Error fetching scoring summary:", error);
    throw error;
  }
}
