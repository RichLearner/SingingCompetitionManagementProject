import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  History,
  Star,
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function JudgeHistoryPage({
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
        total_rounds,
        created_at
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

  // Fetch all rounds for this competition
  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .eq("competition_id", id)
    .order("round_number", { ascending: true });

  // Fetch all judge scores with related data
  const { data: scores } = await supabase
    .from("judge_scores")
    .select(
      `
      *,
      factor:scoring_factors(name, name_en, weight),
      group:groups(name, photo_url),
      round:rounds(name, round_number, status)
    `
    )
    .eq("judge_id", judgeAssignment.id)
    .order("created_at", { ascending: false });

  // Fetch groups for comparison
  const { data: groups } = await supabase
    .from("groups")
    .select("*")
    .eq("competition_id", id)
    .order("name", { ascending: true });

  // Calculate statistics
  const totalScores = scores?.length || 0;
  const averageScore = scores?.length
    ? scores.reduce((sum, score) => sum + score.score, 0) / scores.length
    : 0;

  // Group scores by round and group for analysis
  const scoresByRound =
    scores?.reduce(
      (acc, score) => {
        const roundKey = score.round.round_number;
        if (!acc[roundKey]) {
          acc[roundKey] = {
            round: score.round,
            scores: [],
            groups: new Set(),
            totalScore: 0,
          };
        }
        acc[roundKey].scores.push(score);
        acc[roundKey].groups.add(score.group_id);
        acc[roundKey].totalScore += score.score;
        return acc;
      },
      {} as Record<
        string,
        {
          round: any;
          scores: any[];
          groups: Set<string>;
          totalScore: number;
          averageScore?: number;
          groupsCount?: number;
        }
      >
    ) || {};

  // Calculate round averages
  Object.keys(scoresByRound).forEach((roundKey) => {
    const roundData = scoresByRound[roundKey];
    roundData.averageScore =
      roundData.scores.length > 0
        ? roundData.totalScore / roundData.scores.length
        : 0;
    roundData.groupsCount = roundData.groups.size;
  });

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
                {t("judge.scoringHistory")}
              </h1>
              <p className="text-gray-600 mt-2">
                {competition.name} - {t("judge.historyDescription")}
              </p>
            </div>
          </div>
          <Badge variant="outline">
            <History className="mr-2 h-4 w-4" />
            {t("judge.history")}
          </Badge>
        </div>

        {/* Statistics Overview */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("judge.totalScoresSubmitted")}
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalScores}</div>
              <p className="text-xs text-muted-foreground">
                {t("judge.scoresSubmittedDescription")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("judge.averageScore")}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {averageScore.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("judge.averageScoreDescription")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("judge.roundsScored")}
              </CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {Object.keys(scoresByRound).length}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("judge.roundsScoredDescription")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("judge.groupsScored")}
              </CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {groups?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("judge.groupsScoredDescription")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Round-by-Round Analysis */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>{t("judge.roundAnalysis")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(scoresByRound).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(scoresByRound)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([roundNumber, roundData]) => {
                    const data = roundData as {
                      round: any;
                      scores: any[];
                      groups: Set<string>;
                      totalScore: number;
                      averageScore?: number;
                      groupsCount?: number;
                    };
                    return (
                      <div
                        key={roundNumber}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="font-bold text-blue-600">
                              {roundNumber}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-lg">
                              {data.round.name}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>
                                {data.scores.length} {t("judge.scores")}
                              </span>
                              <span>•</span>
                              <span>
                                {data.groupsCount} {t("judge.groups")}
                              </span>
                              <span>•</span>
                              <span>
                                {data.round.status === "completed"
                                  ? t("round.completed")
                                  : t("round.active")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {data.averageScore?.toFixed(1)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {t("judge.averageScore")}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <History className="mx-auto h-12 w-12 mb-4" />
                <p>{t("judge.noScoringHistory")}</p>
                <p className="text-sm">
                  {t("judge.noScoringHistoryDescription")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Score History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <History className="h-5 w-5" />
              <span>{t("judge.detailedHistory")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scores && scores.length > 0 ? (
              <div className="space-y-4">
                {scores.map((score) => (
                  <div
                    key={score.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        {score.group.photo_url ? (
                          <img
                            src={score.group.photo_url}
                            alt={score.group.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <Users className="h-6 w-6 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-lg">
                          {score.group.name}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>
                            {t("judge.round")} {score.round.round_number}
                          </span>
                          <span>•</span>
                          <span>
                            {locale === "zh-TW"
                              ? score.factor.name
                              : score.factor.name_en || score.factor.name}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(score.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {score.score}
                        </div>
                        <div className="text-sm text-gray-600">
                          {t("judge.score")}
                        </div>
                      </div>
                      {score.comments && (
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-600 truncate">
                            "{score.comments}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Star className="mx-auto h-12 w-12 mb-4" />
                <p>{t("judge.noScoresFound")}</p>
                <p className="text-sm">{t("judge.noScoresFoundDescription")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
