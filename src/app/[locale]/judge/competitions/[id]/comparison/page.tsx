import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Users,
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

export default async function ScoreComparisonPage({
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

  // Fetch all rounds for this competition
  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .eq("competition_id", id)
    .order("round_number", { ascending: true });

  // Fetch all groups
  const { data: groups } = await supabase
    .from("groups")
    .select("*")
    .eq("competition_id", id)
    .order("name", { ascending: true });

  // Fetch all scoring factors
  const { data: scoringFactors } = await supabase
    .from("scoring_factors")
    .select("*")
    .eq("competition_id", id)
    .eq("is_active", true)
    .order("order_index", { ascending: true });

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
    .order("created_at", { ascending: true });

  // Calculate group scores by round
  const groupScoresByRound =
    scores?.reduce((acc, score) => {
      const roundKey = score.round.round_number;
      const groupKey = score.group_id;

      if (!acc[roundKey]) {
        acc[roundKey] = {};
      }
      if (!acc[roundKey][groupKey]) {
        acc[roundKey][groupKey] = {
          group: score.group,
          scores: [],
          totalScore: 0,
          factorCount: 0,
        };
      }

      acc[roundKey][groupKey].scores.push(score);
      acc[roundKey][groupKey].totalScore += score.score * score.factor.weight;
      acc[roundKey][groupKey].factorCount += 1;

      return acc;
    }, {} as Record<string, Record<string, any>>) || {};

  // Calculate average scores for each group across rounds
  const groupAverages = Object.keys(groupScoresByRound).reduce(
    (acc, roundNumber) => {
      const roundData = groupScoresByRound[roundNumber];
      Object.keys(roundData).forEach((groupId) => {
        const groupData = roundData[groupId];
        if (!acc[groupId]) {
          acc[groupId] = {
            group: groupData.group,
            rounds: {},
            averageScore: 0,
            totalRounds: 0,
          };
        }
        acc[groupId].rounds[roundNumber] = groupData.totalScore;
        acc[groupId].totalRounds += 1;
      });
      return acc;
    },
    {} as Record<string, any>
  );

  // Calculate overall averages
  Object.keys(groupAverages).forEach((groupId) => {
    const groupData = groupAverages[groupId];
    const totalScore = Object.values(groupData.rounds).reduce(
      (sum: number, score: any) => sum + score,
      0
    );
    groupData.averageScore =
      groupData.totalRounds > 0 ? totalScore / groupData.totalRounds : 0;
  });

  // Sort groups by average score
  const sortedGroups = Object.values(groupAverages).sort(
    (a, b) => b.averageScore - a.averageScore
  );

  // Calculate factor averages across all groups and rounds
  const factorAverages =
    scoringFactors?.map((factor) => {
      const factorScores =
        scores?.filter((score) => score.factor_id === factor.id) || [];
      const totalScore = factorScores.reduce(
        (sum, score) => sum + score.score,
        0
      );
      const averageScore =
        factorScores.length > 0 ? totalScore / factorScores.length : 0;

      return {
        factor,
        averageScore,
        totalScores: factorScores.length,
      };
    }) || [];

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
                {t("judge.scoreComparison")}
              </h1>
              <p className="text-gray-600 mt-2">
                {competition.name} - {t("judge.comparisonDescription")}
              </p>
            </div>
          </div>
          <Badge variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            {t("judge.analytics")}
          </Badge>
        </div>

        {/* Factor Analysis */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5" />
              <span>{t("judge.factorAnalysis")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {factorAverages.map((factorData) => {
                const factorName =
                  locale === "zh-TW"
                    ? factorData.factor.name
                    : factorData.factor.name_en || factorData.factor.name;
                return (
                  <div
                    key={factorData.factor.id}
                    className="p-4 border rounded-lg bg-white"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm">{factorName}</h3>
                      <Badge variant="outline" className="text-xs">
                        {factorData.factor.weight}x
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {factorData.averageScore.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {factorData.totalScores} {t("judge.scores")}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Group Rankings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>{t("judge.groupRankings")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedGroups.map((groupData, index) => (
                <div
                  key={groupData.group.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-white"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="font-bold text-gray-600">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        {groupData.group.photo_url ? (
                          <img
                            src={groupData.group.photo_url}
                            alt={groupData.group.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <Users className="h-6 w-6 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-lg">
                          {groupData.group.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {t("judge.averageScore")}:{" "}
                          {groupData.averageScore.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {groupData.averageScore.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {groupData.totalRounds} {t("judge.rounds")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Round-by-Round Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>{t("judge.roundComparison")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">{t("judge.group")}</th>
                    {rounds?.map((round) => (
                      <th key={round.id} className="text-center p-2">
                        {t("judge.round")} {round.round_number}
                      </th>
                    ))}
                    <th className="text-center p-2">{t("judge.average")}</th>
                    <th className="text-center p-2">{t("judge.trend")}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedGroups.map((groupData) => (
                    <tr key={groupData.group.id} className="border-b">
                      <td className="p-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            {groupData.group.photo_url ? (
                              <img
                                src={groupData.group.photo_url}
                                alt={groupData.group.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <Users className="h-4 w-4 text-gray-600" />
                            )}
                          </div>
                          <span className="font-medium">
                            {groupData.group.name}
                          </span>
                        </div>
                      </td>
                      {rounds?.map((round) => {
                        const roundScore =
                          groupData.rounds[round.round_number] || 0;
                        return (
                          <td key={round.id} className="text-center p-2">
                            <span className="font-semibold">
                              {roundScore.toFixed(1)}
                            </span>
                          </td>
                        );
                      })}
                      <td className="text-center p-2">
                        <span className="font-bold text-green-600">
                          {groupData.averageScore.toFixed(1)}
                        </span>
                      </td>
                      <td className="text-center p-2">
                        {groupData.totalRounds > 1 && (
                          <div className="flex items-center justify-center">
                            {(() => {
                              const roundNumbers = Object.keys(groupData.rounds)
                                .map(Number)
                                .sort();
                              if (roundNumbers.length < 2)
                                return (
                                  <Minus className="h-4 w-4 text-gray-400" />
                                );

                              const firstScore =
                                groupData.rounds[roundNumbers[0]];
                              const lastScore =
                                groupData.rounds[
                                  roundNumbers[roundNumbers.length - 1]
                                ];

                              if (lastScore > firstScore) {
                                return (
                                  <TrendingUp className="h-4 w-4 text-green-600" />
                                );
                              } else if (lastScore < firstScore) {
                                return (
                                  <TrendingDown className="h-4 w-4 text-red-600" />
                                );
                              } else {
                                return (
                                  <Minus className="h-4 w-4 text-gray-400" />
                                );
                              }
                            })()}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
