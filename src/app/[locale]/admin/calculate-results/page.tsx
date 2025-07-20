import { requireAdminAccess } from "@/lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calculator,
  Trophy,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@supabase/supabase-js";
import { calculateRoundResults } from "@/lib/actions/competition-results";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function CalculateResultsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await requireAdminAccess();
  const { locale } = await params;
  const t = await getTranslations({ locale });

  // Fetch active competitions
  const { data: competitions } = await supabase
    .from("competitions")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  // Fetch rounds for active competitions
  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .in("competition_id", competitions?.map((c) => c.id) || [])
    .order("round_number", { ascending: true });

  // Fetch judge scores to see what data is available
  const { data: judgeScores } = await supabase
    .from("judge_scores")
    .select(
      `
      *,
      round:rounds(name, round_number, competition_id),
      group:groups(name),
      factor:scoring_factors(name, weight)
    `
    )
    .order("created_at", { ascending: false });

  // Fetch existing results
  const { data: existingResults } = await supabase
    .from("competition_results")
    .select(
      `
      *,
      round:rounds(name, round_number),
      group:groups(name)
    `
    )
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Calculate Competition Results
          </h1>
          <p className="text-gray-600 mt-2">
            Manually calculate and update competition results for LED displays
          </p>
        </div>

        {/* Statistics */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Competitions
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {competitions?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Rounds
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rounds?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Judge Scores
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {judgeScores?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Calculated Results
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {existingResults?.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Competitions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5" />
              <span>Active Competitions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {competitions && competitions.length > 0 ? (
              <div className="space-y-4">
                {competitions.map((competition) => {
                  const competitionRounds = rounds?.filter(
                    (r) => r.competition_id === competition.id
                  );
                  const competitionScores = judgeScores?.filter(
                    (s) => s.round?.competition_id === competition.id
                  );
                  const competitionResults = existingResults?.filter(
                    (r) => r.competition_id === competition.id
                  );

                  return (
                    <div
                      key={competition.id}
                      className="p-4 border rounded-lg bg-white"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {competition.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Round {competition.current_round} of{" "}
                            {competition.total_rounds}
                          </p>
                        </div>
                        <Badge variant="secondary">{competition.status}</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-sm">
                          <span className="font-medium">Rounds:</span>{" "}
                          {competitionRounds?.length || 0}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Judge Scores:</span>{" "}
                          {competitionScores?.length || 0}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Results:</span>{" "}
                          {competitionResults?.length || 0}
                        </div>
                      </div>

                      {competitionRounds && competitionRounds.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Rounds:</h4>
                          {competitionRounds.map((round) => {
                            const roundScores = competitionScores?.filter(
                              (s) => s.round_id === round.id
                            );
                            const roundResults = competitionResults?.filter(
                              (r) => r.round_id === round.id
                            );

                            return (
                              <div
                                key={round.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded"
                              >
                                <div>
                                  <div className="font-medium">
                                    Round {round.round_number}: {round.name}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {roundScores?.length || 0} scores,{" "}
                                    {roundResults?.length || 0} results
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge
                                    variant={
                                      round.status === "active"
                                        ? "default"
                                        : round.status === "completed"
                                        ? "secondary"
                                        : "outline"
                                    }
                                  >
                                    {round.status}
                                  </Badge>
                                  {roundScores && roundScores.length > 0 && (
                                    <form
                                      action={async () => {
                                        "use server";
                                        try {
                                          await calculateRoundResults(
                                            competition.id,
                                            round.id
                                          );
                                        } catch (error) {
                                          console.error(
                                            "Error calculating results:",
                                            error
                                          );
                                        }
                                      }}
                                    >
                                      <Button
                                        type="submit"
                                        size="sm"
                                        variant="outline"
                                      >
                                        <Calculator className="mr-2 h-4 w-4" />
                                        Calculate
                                      </Button>
                                    </form>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="mx-auto h-12 w-12 mb-4" />
                <p>No active competitions found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Judge Scores */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Recent Judge Scores</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {judgeScores && judgeScores.length > 0 ? (
              <div className="space-y-2">
                {judgeScores.slice(0, 10).map((score) => (
                  <div
                    key={score.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <div className="font-medium">
                        {score.group?.name} - {score.factor?.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        Round {score.round?.round_number}: {score.round?.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{score.score}</div>
                      <div className="text-sm text-gray-600">
                        Weight: {score.factor?.weight}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="mx-auto h-12 w-12 mb-4" />
                <p>No judge scores found</p>
                <p className="text-sm">
                  Judges need to submit scores before results can be calculated
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Existing Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Existing Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {existingResults && existingResults.length > 0 ? (
              <div className="space-y-2">
                {existingResults.slice(0, 10).map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <div className="font-medium">
                        {result.group?.name} - Round{" "}
                        {result.round?.round_number}
                      </div>
                      <div className="text-sm text-gray-600">
                        Rank: #{result.rank}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        {Math.round(result.total_score)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Judge: {Math.round(result.judge_score)} | Votes:{" "}
                        {result.public_votes}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="mx-auto h-12 w-12 mb-4" />
                <p>No calculated results found</p>
                <p className="text-sm">
                  Use the Calculate buttons above to generate results
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
