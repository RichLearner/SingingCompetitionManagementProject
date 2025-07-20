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
import { getLEDScreenData } from "@/lib/actions/led-screen";

export default async function RealtimeLEDDebugPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  // Fetch LED screen data using the server action
  const data = await getLEDScreenData();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Real-time LED Debug
          </h1>
          <p className="text-gray-600 mt-2">
            Debug information for real-time LED screen
          </p>
        </div>

        {/* Data Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Data Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Badge variant={data.success ? "default" : "destructive"}>
                  {data.success ? "Success" : "Error"}
                </Badge>
                {!data.success && (
                  <span className="text-red-600">{data.error}</span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Competitions</h3>
                  <p className="text-2xl font-bold">
                    {data.competitions.length}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Results</h3>
                  <p className="text-2xl font-bold">{data.results.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Competitions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Active Competitions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.competitions.length > 0 ? (
              <div className="space-y-4">
                {data.competitions.map((competition) => {
                  const competitionResults = data.results.filter(
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
                            ID: {competition.id} | Round:{" "}
                            {competition.current_round} | Status:{" "}
                            {competition.status}
                          </p>
                        </div>
                        <Badge variant="secondary">{competition.status}</Badge>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-medium mb-2">
                          Results ({competitionResults.length}):
                        </h4>
                        {competitionResults.length > 0 ? (
                          <div className="space-y-2">
                            {competitionResults.map((result) => (
                              <div
                                key={result.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded"
                              >
                                <div>
                                  <div className="font-medium">
                                    #{result.rank} - {result.group?.name}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Round {result.round?.round_number}:{" "}
                                    {result.round?.name}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold">
                                    {Math.round(result.total_score)}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Judge: {Math.round(result.judge_score)} |
                                    Votes: {result.public_votes}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                            <p>No results for current round</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Database className="mx-auto h-12 w-12 mb-4" />
                <p>No active competitions found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Results */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>All Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.results.length > 0 ? (
              <div className="space-y-2">
                {data.results.map((result) => (
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
                        Competition: {result.competition_id} | Rank: #
                        {result.rank}
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
              <Bug className="h-5 w-5" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Button asChild>
                <Link href={`/${locale}/led/realtime`}>View Real-time LED</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/${locale}/led`}>View Static LED</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/${locale}/led/debug`}>View Full Debug</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
