import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Star,
  Clock,
  ArrowLeft,
  Trophy,
  Award,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function CompetitionAnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale });

  // Fetch competition details
  const { data: competition, error: competitionError } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", id)
    .single();

  if (competitionError || !competition) {
    notFound();
  }

  // Fetch all rounds for this competition
  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .eq("competition_id", id)
    .order("round_number", { ascending: true });

  // Fetch all results for this competition
  const { data: allResults } = await supabase
    .from("competition_results")
    .select(
      `
      *,
      group:groups(name, photo_url),
      round:rounds(name, round_number)
    `
    )
    .eq("competition_id", id)
    .order("round_id", { ascending: true })
    .order("rank", { ascending: true });

  // Fetch scoring factors
  const { data: scoringFactors } = await supabase
    .from("scoring_factors")
    .select("*")
    .eq("competition_id", id)
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  // Calculate analytics
  const totalGroups =
    allResults?.reduce((acc, result) => {
      if (!acc.includes(result.group_id)) {
        acc.push(result.group_id);
      }
      return acc;
    }, [] as string[]).length || 0;

  const totalRounds = rounds?.length || 0;
  const completedRounds =
    rounds?.filter((r) => r.status === "completed").length || 0;

  // Group results by round
  const resultsByRound =
    allResults?.reduce((acc, result) => {
      if (!acc[result.round_id]) {
        acc[result.round_id] = [];
      }
      acc[result.round_id].push(result);
      return acc;
    }, {} as Record<string, any[]>) || {};

  // Calculate group performance trends
  const groupTrends =
    allResults?.reduce((acc, result) => {
      if (!acc[result.group_id]) {
        acc[result.group_id] = {
          group: result.group,
          scores: [],
          averageScore: 0,
          bestRound: null,
          worstRound: null,
        };
      }
      acc[result.group_id].scores.push({
        round: result.round,
        score: result.total_score,
        rank: result.rank,
      });
      return acc;
    }, {} as Record<string, any>) || {};

  // Calculate averages and trends
  Object.values(groupTrends).forEach((groupData: any) => {
    const scores = groupData.scores.map((s: any) => s.score);
    groupData.averageScore =
      scores.reduce((a: number, b: number) => a + b, 0) / scores.length;

    const bestScore = Math.max(...scores);
    const worstScore = Math.min(...scores);
    groupData.bestRound = groupData.scores.find(
      (s: any) => s.score === bestScore
    )?.round;
    groupData.worstRound = groupData.scores.find(
      (s: any) => s.score === worstScore
    )?.round;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href={`/${locale}/led/competitions/${id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("common.back")}
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {competition.name} - {t("led.analytics")}
              </h1>
              <p className="text-gray-600">{t("led.competitionAnalytics")}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-blue-500" />
            <Badge variant="secondary">Analytics</Badge>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("led.totalGroups")}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalGroups}</div>
              <p className="text-xs text-muted-foreground">
                {t("led.participatingGroups")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("led.totalRounds")}
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRounds}</div>
              <p className="text-xs text-muted-foreground">
                {completedRounds} {t("led.completed")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("led.scoringFactors")}
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {scoringFactors?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("led.activeFactors")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("led.currentRound")}
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {competition.current_round}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("led.of")} {competition.total_rounds}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Round-by-Round Analysis */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>{t("led.roundByRoundAnalysis")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rounds?.map((round) => {
                const roundResults = resultsByRound[round.id] || [];
                const averageScore =
                  roundResults.length > 0
                    ? roundResults.reduce(
                        (sum: number, r: any) => sum + r.total_score,
                        0
                      ) / roundResults.length
                    : 0;

                return (
                  <div key={round.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">
                        {t("led.round")} {round.round_number}: {round.name}
                      </h3>
                      <Badge
                        variant={
                          round.status === "completed" ? "default" : "secondary"
                        }
                      >
                        {t(`round.${round.status}`)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">
                          {t("led.participants")}:
                        </span>
                        <span className="ml-2 font-semibold">
                          {roundResults.length}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">
                          {t("led.averageScore")}:
                        </span>
                        <span className="ml-2 font-semibold">
                          {averageScore.toFixed(1)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">
                          {t("led.highestScore")}:
                        </span>
                        <span className="ml-2 font-semibold">
                          {roundResults.length > 0
                            ? Math.max(
                                ...roundResults.map((r: any) => r.total_score)
                              ).toFixed(1)
                            : "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">
                          {t("led.lowestScore")}:
                        </span>
                        <span className="ml-2 font-semibold">
                          {roundResults.length > 0
                            ? Math.min(
                                ...roundResults.map((r: any) => r.total_score)
                              ).toFixed(1)
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Group Performance Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>{t("led.groupPerformanceTrends")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.values(groupTrends).map(
                (groupData: any, index: number) => (
                  <div
                    key={groupData.group.id}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {groupData.group.photo_url ? (
                            <img
                              src={groupData.group.photo_url}
                              alt={groupData.group.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <Users className="h-5 w-5 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {groupData.group.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {t("led.averageScore")}:{" "}
                            {groupData.averageScore.toFixed(1)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          #{index + 1}
                        </div>
                        <div className="text-sm text-gray-600">
                          {groupData.scores.length} {t("led.rounds")}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">
                          {t("led.bestRound")}:
                        </span>
                        <span className="ml-2 font-semibold">
                          {groupData.bestRound
                            ? `Round ${groupData.bestRound.round_number}`
                            : "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">
                          {t("led.worstRound")}:
                        </span>
                        <span className="ml-2 font-semibold">
                          {groupData.worstRound
                            ? `Round ${groupData.worstRound.round_number}`
                            : "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">
                          {t("led.consistency")}:
                        </span>
                        <span className="ml-2 font-semibold">
                          {groupData.scores.length > 1
                            ? (
                                Math.max(
                                  ...groupData.scores.map((s: any) => s.score)
                                ) -
                                Math.min(
                                  ...groupData.scores.map((s: any) => s.score)
                                )
                              ).toFixed(1)
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 flex justify-center">
          <Button asChild>
            <Link href={`/${locale}/led/competitions/${id}`}>
              {t("led.backToResults")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
