import { requireAdminAccess } from "@/lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calculator,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@supabase/supabase-js";
import { calculateRoundResults } from "@/lib/actions/competition-results";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function RecalculateResultsPage({
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
            Recalculate Results (Raw Scoring)
          </h1>
          <p className="text-gray-600 mt-2">
            Recalculate competition results using raw total scores instead of
            weighted scores
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>New Scoring System</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">What Changed:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>
                    <strong>Before:</strong> Weighted scores with normalization
                  </li>
                  <li>
                    <strong>After:</strong> Raw total of all scoring factors
                  </li>
                  <li>
                    <strong>Public Votes:</strong> Now worth 1 point each (was
                    0.1)
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Example:</h3>
                <p className="text-sm text-gray-600">
                  If a group gets scores: 7, 8, 6, 9, 7 across 5 factors ={" "}
                  <strong>37 total points</strong>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="text-sm">
                          <span className="font-medium">Rounds:</span>{" "}
                          {competitionRounds?.length || 0}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Current Results:</span>{" "}
                          {competitionResults?.length || 0}
                        </div>
                      </div>

                      {competitionRounds && competitionRounds.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Rounds:</h4>
                          {competitionRounds.map((round) => {
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
                                          "Error recalculating results:",
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
                                      Recalculate
                                    </Button>
                                  </form>
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

        {/* Current Results Preview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Current Results (Before Recalculation)</span>
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
                <p>No results found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Button asChild>
                <Link href={`/${locale}/led`}>View LED Screen</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/${locale}/led/realtime`}>View Real-time LED</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/${locale}/led/debug`}>View Debug Info</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
