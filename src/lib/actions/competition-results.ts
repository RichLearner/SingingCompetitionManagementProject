"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RoundResult {
  groupId: string;
  judgeScore: number;
  publicVotes: number;
  totalScore: number;
  rank: number;
  isQualified: boolean;
}

export async function calculateRoundResults(
  competitionId: string,
  roundId: string
) {
  try {
    // Get round information
    const { data: round, error: roundError } = await supabase
      .from("rounds")
      .select("*")
      .eq("id", roundId)
      .single();

    if (roundError || !round) {
      throw new Error("Round not found");
    }

    // Get all groups in the competition that are not eliminated
    const { data: groups, error: groupsError } = await supabase
      .from("groups")
      .select("*")
      .eq("competition_id", competitionId)
      .eq("is_eliminated", false);

    if (groupsError) {
      throw new Error(`Failed to fetch groups: ${groupsError.message}`);
    }

    // Get all judge scores for this round
    const { data: judgeScores, error: scoresError } = await supabase
      .from("judge_scores")
      .select(
        `
        *,
        factor:scoring_factors(weight, max_score)
      `
      )
      .eq("round_id", roundId);

    if (scoresError) {
      throw new Error(`Failed to fetch judge scores: ${scoresError.message}`);
    }

    // Get public votes if this is a public voting round
    const { data: publicVotes, error: votesError } = await supabase
      .from("public_votes")
      .select("group_id")
      .eq("round_id", roundId);

    if (votesError) {
      console.error("Failed to fetch public votes:", votesError);
    }

    // Calculate results for each group
    const results: RoundResult[] = [];

    for (const group of groups || []) {
      // Calculate judge scores
      const groupJudgeScores =
        judgeScores?.filter((s) => s.group_id === group.id) || [];
      const judgeScore = calculateWeightedJudgeScore(groupJudgeScores);

      // Calculate public votes
      const groupPublicVotes =
        publicVotes?.filter((v) => v.group_id === group.id).length || 0;

      // Calculate total score (judge score + public votes)
      // For now, we'll use a simple weighted combination
      const totalScore = judgeScore + groupPublicVotes * 0.1; // 0.1 points per public vote

      results.push({
        groupId: group.id,
        judgeScore,
        publicVotes: groupPublicVotes,
        totalScore,
        rank: 0, // Will be set after sorting
        isQualified: true, // Will be set after elimination logic
      });
    }

    // Sort by total score (descending) and assign ranks
    results.sort((a, b) => b.totalScore - a.totalScore);
    results.forEach((result, index) => {
      result.rank = index + 1;
    });

    // Apply elimination logic
    if (round.elimination_count && round.elimination_count > 0) {
      const eliminationThreshold = results.length - round.elimination_count;
      results.forEach((result, index) => {
        result.isQualified = index < eliminationThreshold;
      });
    }

    // Save results to database
    const resultsToSave = results.map((result) => ({
      competition_id: competitionId,
      round_id: roundId,
      group_id: result.groupId,
      judge_score: result.judgeScore,
      public_votes: result.publicVotes,
      total_score: result.totalScore,
      rank: result.rank,
      is_qualified: result.isQualified,
    }));

    // Delete existing results for this round
    await supabase.from("competition_results").delete().eq("round_id", roundId);

    // Insert new results
    const { error: insertError } = await supabase
      .from("competition_results")
      .insert(resultsToSave);

    if (insertError) {
      throw new Error(`Failed to save results: ${insertError.message}`);
    }

    // Update group elimination status
    for (const result of results) {
      if (!result.isQualified) {
        await supabase
          .from("groups")
          .update({
            is_eliminated: true,
            elimination_round: round.round_number,
          })
          .eq("id", result.groupId);
      }
    }

    // Revalidate paths
    revalidatePath(`/admin/competitions/${competitionId}`);
    revalidatePath(`/admin/competitions/${competitionId}/rounds`);
    revalidatePath(`/admin/competitions/${competitionId}/groups`);

    return { success: true, results };
  } catch (error) {
    console.error("Error calculating round results:", error);
    throw error;
  }
}

function calculateWeightedJudgeScore(judgeScores: any[]): number {
  if (!judgeScores || judgeScores.length === 0) return 0;

  // Group scores by judge_id and factor_id
  const scoresByJudge = judgeScores.reduce((acc, score) => {
    if (!acc[score.judge_id]) {
      acc[score.judge_id] = [];
    }
    acc[score.judge_id].push(score);
    return acc;
  }, {} as Record<string, any[]>);

  // Calculate weighted score for each judge
  const judgeAverages: number[] = [];

  for (const judgeId in scoresByJudge) {
    const judgeScoreList = scoresByJudge[judgeId];
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const score of judgeScoreList) {
      const weight = score.factor?.weight || 1;
      const maxScore = score.factor?.max_score || 10;

      // Normalize score to 0-1 range, then apply weight
      const normalizedScore = score.score / maxScore;
      totalWeightedScore += normalizedScore * weight;
      totalWeight += weight;
    }

    if (totalWeight > 0) {
      judgeAverages.push((totalWeightedScore / totalWeight) * 10); // Scale back to 0-10
    }
  }

  // Return average of all judges' scores
  if (judgeAverages.length === 0) return 0;
  return (
    judgeAverages.reduce((sum, avg) => sum + avg, 0) / judgeAverages.length
  );
}

export async function getRoundResults(competitionId: string, roundId: string) {
  try {
    const { data: results, error } = await supabase
      .from("competition_results")
      .select(
        `
        *,
        group:groups(*)
      `
      )
      .eq("competition_id", competitionId)
      .eq("round_id", roundId)
      .order("rank", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch results: ${error.message}`);
    }

    return { success: true, results };
  } catch (error) {
    console.error("Error fetching round results:", error);
    throw error;
  }
}

export async function getCompetitionSummary(competitionId: string) {
  try {
    // Get all rounds for this competition
    const { data: rounds, error: roundsError } = await supabase
      .from("rounds")
      .select("*")
      .eq("competition_id", competitionId)
      .order("round_number", { ascending: true });

    if (roundsError) {
      throw new Error(`Failed to fetch rounds: ${roundsError.message}`);
    }

    // Get all results for this competition
    const { data: allResults, error: resultsError } = await supabase
      .from("competition_results")
      .select(
        `
        *,
        group:groups(*),
        round:rounds(*)
      `
      )
      .eq("competition_id", competitionId)
      .order("round_id", { ascending: true })
      .order("rank", { ascending: true });

    if (resultsError) {
      throw new Error(`Failed to fetch results: ${resultsError.message}`);
    }

    // Group results by round
    const resultsByRound =
      allResults?.reduce((acc, result) => {
        if (!acc[result.round_id]) {
          acc[result.round_id] = [];
        }
        acc[result.round_id].push(result);
        return acc;
      }, {} as Record<string, any[]>) || {};

    // Calculate aggregate scores across all rounds
    const aggregateScores = calculateAggregateScores(allResults || []);

    return {
      success: true,
      summary: {
        rounds: rounds || [],
        resultsByRound,
        aggregateScores,
      },
    };
  } catch (error) {
    console.error("Error fetching competition summary:", error);
    throw error;
  }
}

function calculateAggregateScores(allResults: any[]) {
  // Group results by group_id
  const resultsByGroup = allResults.reduce((acc, result) => {
    if (!acc[result.group_id]) {
      acc[result.group_id] = [];
    }
    acc[result.group_id].push(result);
    return acc;
  }, {} as Record<string, any[]>);

  // Calculate aggregate scores
  const aggregateScores: Array<{
    groupId: string;
    group: any;
    totalJudgeScore: number;
    totalPublicVotes: number;
    totalScore: number;
    isQualified: boolean;
    roundCount: number;
    finalRank?: number;
  }> = [];

  for (const groupId in resultsByGroup) {
    const groupResults = resultsByGroup[groupId];
    const totalJudgeScore = groupResults.reduce(
      (sum: number, r: any) => sum + r.judge_score,
      0
    );
    const totalPublicVotes = groupResults.reduce(
      (sum: number, r: any) => sum + r.public_votes,
      0
    );
    const totalScore = groupResults.reduce(
      (sum: number, r: any) => sum + r.total_score,
      0
    );
    const isQualified =
      groupResults[groupResults.length - 1]?.is_qualified || false;
    const group = groupResults[0]?.group;

    aggregateScores.push({
      groupId,
      group,
      totalJudgeScore,
      totalPublicVotes,
      totalScore,
      isQualified,
      roundCount: groupResults.length,
    });
  }

  // Sort by total score (descending)
  aggregateScores.sort((a, b) => b.totalScore - a.totalScore);

  // Assign final ranks
  aggregateScores.forEach((score, index) => {
    score.finalRank = index + 1;
  });

  return aggregateScores;
}

export async function advanceToNextRound(
  competitionId: string,
  currentRoundId: string
) {
  try {
    // Get current competition and round info
    const { data: competition, error: compError } = await supabase
      .from("competitions")
      .select("*")
      .eq("id", competitionId)
      .single();

    if (compError || !competition) {
      throw new Error("Competition not found");
    }

    const { data: currentRound, error: roundError } = await supabase
      .from("rounds")
      .select("*")
      .eq("id", currentRoundId)
      .single();

    if (roundError || !currentRound) {
      throw new Error("Round not found");
    }

    // Check if there's a next round
    const nextRoundNumber = currentRound.round_number + 1;
    if (nextRoundNumber > competition.total_rounds) {
      // Competition is complete
      await supabase
        .from("competitions")
        .update({ status: "completed" })
        .eq("id", competitionId);

      return { success: true, isComplete: true };
    }

    // Update current round status to completed
    await supabase
      .from("rounds")
      .update({ status: "completed" })
      .eq("id", currentRoundId);

    // Update competition current round
    await supabase
      .from("competitions")
      .update({ current_round: nextRoundNumber })
      .eq("id", competitionId);

    // Activate next round
    await supabase
      .from("rounds")
      .update({ status: "active" })
      .eq("competition_id", competitionId)
      .eq("round_number", nextRoundNumber);

    // Revalidate paths
    revalidatePath(`/admin/competitions/${competitionId}`);
    revalidatePath(`/admin/competitions/${competitionId}/rounds`);
    revalidatePath(`/judge/competitions/${competitionId}`);

    return { success: true, isComplete: false, nextRound: nextRoundNumber };
  } catch (error) {
    console.error("Error advancing to next round:", error);
    throw error;
  }
}
