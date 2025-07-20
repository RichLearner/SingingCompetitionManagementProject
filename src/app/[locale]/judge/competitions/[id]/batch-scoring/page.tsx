import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Star, Save } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { BatchScoreForm } from "@/components/judge/BatchScoreForm";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function BatchScoringPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const user = await currentUser();
  const { locale, id } = await params;
  const t = await getTranslations({ locale });

  if (!user) {
    notFound();
  }

  // Fetch judge assignment and verify access
  const { data: judgeAssignment, error: judgeError } = await supabase
    .from("judges")
    .select(
      `
      *,
      competition:competitions(
        id,
        name,
        status,
        current_round,
        total_rounds
      )
    `
    )
    .eq("clerk_user_id", user.id)
    .eq("competition_id", id)
    .eq("is_active", true)
    .single();

  if (judgeError || !judgeAssignment) {
    notFound();
  }

  const competition = judgeAssignment.competition;

  // Fetch current round information
  const { data: currentRound } = await supabase
    .from("rounds")
    .select("*")
    .eq("competition_id", id)
    .eq("round_number", competition.current_round)
    .single();

  if (!currentRound) {
    notFound();
  }

  // Fetch groups (only non-eliminated ones)
  const { data: groups } = await supabase
    .from("groups")
    .select(
      `
      *,
      participants:participants(*)
    `
    )
    .eq("competition_id", id)
    .eq("is_eliminated", false)
    .order("name", { ascending: true });

  // Fetch scoring factors
  const { data: scoringFactors } = await supabase
    .from("scoring_factors")
    .select("*")
    .eq("competition_id", id)
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  // Fetch existing scores for this judge in current round
  const { data: existingScores } = await supabase
    .from("judge_scores")
    .select("*")
    .eq("judge_id", judgeAssignment.id)
    .eq("round_id", currentRound.id)
    .order("created_at", { ascending: true });

  // Group existing scores by group_id and factor_id for easy lookup
  const scoresByGroupAndFactor =
    existingScores?.reduce((acc, score) => {
      if (!acc[score.group_id]) {
        acc[score.group_id] = {};
      }
      acc[score.group_id][score.factor_id] = {
        factor_id: score.factor_id,
        score: score.score,
        comments: score.comments,
      };
      return acc;
    }, {} as Record<string, Record<string, any>>) || {};

  // Calculate overall progress
  const totalRequiredScores =
    (groups?.length || 0) * (scoringFactors?.length || 0);
  const completedScores = existingScores?.length || 0;
  const progressPercentage =
    totalRequiredScores > 0
      ? Math.round((completedScores / totalRequiredScores) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href={`/${locale}/judge/competitions/${id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("common.back")}
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t("judge.batchScoring")}
              </h1>
              <p className="text-gray-600 mt-2">
                {competition.name} - {t("judge.round")}{" "}
                {competition.current_round}
              </p>
            </div>
          </div>
          <Badge variant="outline">
            <Save className="mr-2 h-4 w-4" />
            {t("judge.batchMode")}
          </Badge>
        </div>

        {/* Progress Overview */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("judge.totalGroups")}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{groups?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {t("judge.groupsToScore")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("judge.scoringFactors")}
              </CardTitle>
              <Star className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {scoringFactors?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("judge.factorsPerGroup")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("judge.progress")}
              </CardTitle>
              <Save className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {progressPercentage}%
              </div>
              <p className="text-xs text-muted-foreground">
                {completedScores} {t("judge.of")} {totalRequiredScores}{" "}
                {t("judge.scoresCompleted")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("judge.roundStatus")}
              </CardTitle>
              <Badge className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {currentRound?.status
                  ? t(`round.${currentRound.status}`)
                  : t("round.pending")}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("judge.currentRoundStatus")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Batch Scoring Form */}
        {groups &&
        groups.length > 0 &&
        scoringFactors &&
        scoringFactors.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Save className="h-5 w-5" />
                <span>{t("judge.batchScoringForm")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BatchScoreForm
                competitionId={id}
                roundId={currentRound.id}
                judgeId={judgeAssignment.id}
                groups={groups}
                scoringFactors={scoringFactors}
                existingScores={scoresByGroupAndFactor}
                locale={locale}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Users className="mx-auto h-12 w-12 mb-4" />
                <p>{t("judge.noGroupsToScore")}</p>
                <p className="text-sm">
                  {t("judge.noGroupsToScoreDescription")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
