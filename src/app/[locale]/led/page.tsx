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
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function LEDScreenPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  // Fetch active competitions
  const { data: competitions } = await supabase
    .from("competitions")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  // Fetch current round results for active competitions
  let currentResults: any[] = [];

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
        currentResults = [...currentResults, ...results];
      }
    }
  }

  // Group results by competition
  const resultsByCompetition =
    currentResults?.reduce((acc, result) => {
      if (!acc[result.competition_id]) {
        acc[result.competition_id] = [];
      }
      acc[result.competition_id].push(result);
      return acc;
    }, {} as Record<string, any[]>) || {};

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-yellow-400 mb-4">
            {t("led.title")}
          </h1>
          <p className="text-2xl text-gray-300">{t("led.liveResults")}</p>
        </div>

        {/* Active Competitions */}
        {competitions && competitions.length > 0 ? (
          <div className="space-y-8">
            {competitions.map((competition) => {
              const competitionResults =
                resultsByCompetition[competition.id] || [];
              const currentRound = competitionResults[0]?.round;

              return (
                <Card
                  key={competition.id}
                  className="bg-gray-900 border-gray-700"
                >
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <CardTitle className="text-3xl text-center text-white">
                      {competition.name}
                    </CardTitle>
                    <div className="flex justify-center items-center space-x-4 mt-2">
                      <Badge variant="secondary" className="text-lg">
                        {t("led.round")} {competition.current_round}
                      </Badge>
                      <Badge variant="secondary" className="text-lg">
                        {currentRound?.status === "active" ? (
                          <Play className="h-4 w-4 mr-1" />
                        ) : (
                          <Pause className="h-4 w-4 mr-1" />
                        )}
                        {t(`round.${currentRound?.status || "pending"}`)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {competitionResults.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {competitionResults
                          .slice(0, 6)
                          .map((result: any, index: number) => (
                            <div
                              key={result.id}
                              className={`p-4 rounded-lg border-2 ${
                                index === 0
                                  ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black border-yellow-300"
                                  : index === 1
                                  ? "bg-gradient-to-r from-gray-300 to-gray-500 text-black border-gray-200"
                                  : index === 2
                                  ? "bg-gradient-to-r from-orange-400 to-orange-600 text-black border-orange-300"
                                  : "bg-gray-800 border-gray-600"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
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
                                <div className="text-right">
                                  <div className="text-3xl font-bold">
                                    {Math.round(result.total_score)}
                                  </div>
                                  <div className="text-sm opacity-75">
                                    {t("led.points")}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
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
                                    {t("led.totalFactors")}:{" "}
                                    {Math.round(result.judge_score)}
                                    {result.public_votes > 0 && (
                                      <span className="ml-2">
                                        • {t("led.publicVotes")}:{" "}
                                        {result.public_votes}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Clock className="h-16 w-16 mx-auto text-gray-500 mb-4" />
                        <p className="text-xl text-gray-400">
                          {t("led.waitingForResults")}
                        </p>
                        <p className="text-gray-500 mt-2">
                          {t("led.resultsWillAppear")}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Trophy className="h-24 w-24 mx-auto text-gray-500 mb-6" />
            <h2 className="text-3xl font-bold text-gray-400 mb-4">
              {t("led.noActiveCompetitions")}
            </h2>
            <p className="text-xl text-gray-500">
              {t("led.noActiveCompetitionsDescription")}
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
              <Link href={`/${locale}/led/realtime`}>{t("led.viewLive")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/${locale}/led/settings`}>
                {t("led.displaySettings")}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/${locale}/led/debug`}>Debug Info</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
