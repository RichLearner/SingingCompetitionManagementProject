import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Users,
  Star,
  TrendingUp,
  Clock,
  Award,
  Play,
  Pause,
  ArrowLeft,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function CompetitionLEDScreenPage({
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

  // Fetch current round
  const { data: currentRound } = await supabase
    .from("rounds")
    .select("*")
    .eq("competition_id", id)
    .eq("round_number", competition.current_round)
    .single();

  // Fetch current round results
  const { data: results } = await supabase
    .from("competition_results")
    .select(
      `
      *,
      group:groups(name, photo_url, participants:participants!participants_group_id_fkey(*))
    `
    )
    .eq("competition_id", id)
    .eq("round_id", currentRound?.id || "")
    .order("rank", { ascending: true });

  // Fetch scoring factors for this competition
  const { data: scoringFactors } = await supabase
    .from("scoring_factors")
    .select("*")
    .eq("competition_id", id)
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <Link href={`/${locale}/led`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("common.back")}
              </Button>
            </Link>
            <h1 className="text-6xl font-bold text-yellow-400">
              {competition.name}
            </h1>
          </div>
          <div className="flex justify-center items-center space-x-6">
            <Badge variant="secondary" className="text-xl px-4 py-2">
              {t("led.round")} {competition.current_round} {t("led.of")}{" "}
              {competition.total_rounds}
            </Badge>
            <Badge variant="secondary" className="text-xl px-4 py-2">
              {currentRound?.status === "active" ? (
                <Play className="h-5 w-5 mr-2" />
              ) : (
                <Pause className="h-5 w-5 mr-2" />
              )}
              {t(`round.${currentRound?.status || "pending"}`)}
            </Badge>
          </div>
        </div>

        {/* Competition Status */}
        <Card className="bg-gray-900 border-gray-700 mb-8">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600">
            <CardTitle className="text-2xl text-center text-white">
              {t("led.competitionStatus")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-4xl font-bold text-blue-400">
                  {results?.length || 0}
                </div>
                <div className="text-gray-300">
                  {t("led.groupsParticipating")}
                </div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-400">
                  {scoringFactors?.length || 0}
                </div>
                <div className="text-gray-300">{t("led.scoringFactors")}</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-yellow-400">
                  {competition.current_round}
                </div>
                <div className="text-gray-300">{t("led.currentRound")}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Display */}
        {results && results.length > 0 ? (
          <div className="space-y-6">
            {/* Top 3 Podium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {results.slice(0, 3).map((result: any, index: number) => (
                <div
                  key={result.id}
                  className={`p-6 rounded-lg border-4 ${
                    index === 0
                      ? "bg-gradient-to-b from-yellow-400 to-yellow-600 text-black border-yellow-300 order-2"
                      : index === 1
                      ? "bg-gradient-to-b from-gray-300 to-gray-500 text-black border-gray-200 order-1"
                      : "bg-gradient-to-b from-orange-400 to-orange-600 text-black border-orange-300 order-3"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-6xl font-bold mb-2">
                      #{result.rank}
                    </div>
                    <div className="text-5xl font-bold mb-4">
                      {Math.round(result.total_score)}
                    </div>
                    <div className="text-sm opacity-75 mb-4">
                      {t("led.points")}
                    </div>
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                        {result.group.photo_url ? (
                          <img
                            src={result.group.photo_url}
                            alt={result.group.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <Users className="h-8 w-8 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-xl">
                          {result.group.name}
                        </div>
                        <div className="text-sm opacity-75">
                          {result.group.participants?.length || 0}{" "}
                          {t("led.participants")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* All Results Table */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-800">
                <CardTitle className="text-2xl text-center text-white">
                  {t("led.completeRankings")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {results.map((result: any, index: number) => (
                    <div
                      key={result.id}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        index < 3
                          ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black"
                          : "bg-gray-800 border border-gray-600"
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {index < 3 && (
                            <Trophy
                              className={`h-6 w-6 ${
                                index === 0
                                  ? "text-yellow-800"
                                  : index === 1
                                  ? "text-gray-600"
                                  : "text-orange-800"
                              }`}
                            />
                          )}
                          <span className="text-2xl font-bold">
                            #{result.rank}
                          </span>
                        </div>
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          {result.group.photo_url ? (
                            <img
                              src={result.group.photo_url}
                              alt={result.group.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <Users className="h-6 w-6 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-lg">
                            {result.group.name}
                          </div>
                          <div className="text-sm opacity-75">
                            {result.group.participants?.length || 0}{" "}
                            {t("led.participants")}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold">
                          {Math.round(result.total_score)}
                        </div>
                        <div className="text-sm opacity-75">
                          {t("led.judgeScore")}:{" "}
                          {Math.round(result.judge_score)}
                          {result.public_votes > 0 && (
                            <span className="ml-2">
                              • {t("led.publicVotes")}: {result.public_votes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-16">
            <Clock className="h-24 w-24 mx-auto text-gray-500 mb-6" />
            <h2 className="text-3xl font-bold text-gray-400 mb-4">
              {t("led.waitingForResults")}
            </h2>
            <p className="text-xl text-gray-500">
              {t("led.resultsWillAppear")}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-700">
          <p className="text-gray-400">
            {t("led.lastUpdated")}: {new Date().toLocaleString()}
          </p>
          <div className="mt-4 space-x-4">
            <Button asChild variant="outline" size="sm">
              <Link href={`/${locale}/led`}>{t("led.backToMain")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/${locale}/led/competitions/${id}/analytics`}>
                <BarChart3 className="mr-2 h-4 w-4" />
                {t("led.viewAnalytics")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
