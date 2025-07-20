import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bug,
  Database,
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function LEDDebugPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  // Fetch all data for debugging
  const [
    { data: competitions },
    { data: rounds },
    { data: judgeScores },
    { data: results },
    { data: groups },
  ] = await Promise.all([
    supabase
      .from("competitions")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("rounds")
      .select("*")
      .order("round_number", { ascending: true }),
    supabase
      .from("judge_scores")
      .select(
        `
        *,
        round:rounds(name, round_number, competition_id),
        group:groups(name),
        factor:scoring_factors(name)
      `
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("competition_results")
      .select(
        `
        *,
        round:rounds(name, round_number, competition_id),
        group:groups(name)
      `
      )
      .order("created_at", { ascending: false }),
    supabase.from("groups").select("*").order("name", { ascending: true }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">LED Screen Debug</h1>
          <p className="text-gray-600 mt-2">
            Debug information for LED screen data
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-5 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Competitions
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {competitions?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rounds</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rounds?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Groups</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{groups?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Judge Scores
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {judgeScores?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Results</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{results?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Competitions Debug */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Competitions</span>
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
                  const competitionResults = results?.filter(
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
                            Status: {competition.status} | Current Round:{" "}
                            {competition.current_round} | Total Rounds:{" "}
                            {competition.total_rounds}
                          </p>
                        </div>
                        <Badge variant="secondary">{competition.status}</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
                        <div className="text-sm">
                          <span className="font-medium">Groups:</span>{" "}
                          {groups?.filter(
                            (g) => g.competition_id === competition.id
                          ).length || 0}
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
                                  {round.round_number ===
                                    competition.current_round && (
                                    <Badge variant="destructive">Current</Badge>
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
                <Database className="mx-auto h-12 w-12 mb-4" />
                <p>No competitions found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Judge Scores */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
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
                        {new Date(score.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="mx-auto h-12 w-12 mb-4" />
                <p>No judge scores found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Results */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Recent Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results && results.length > 0 ? (
              <div className="space-y-2">
                {results.slice(0, 10).map((result) => (
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
                        Rank: #{result.rank} | Total: {result.total_score}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        Judge: {result.judge_score} | Votes:{" "}
                        {result.public_votes}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(result.created_at).toLocaleString()}
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
              <Bug className="h-5 w-5" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Button asChild>
                <Link href={`/${locale}/admin/calculate-results`}>
                  Calculate Results
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/${locale}/led`}>View LED Screen</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/${locale}/led/realtime`}>View Real-time</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
