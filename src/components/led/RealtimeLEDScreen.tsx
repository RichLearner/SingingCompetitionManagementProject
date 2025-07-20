"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Users,
  Star,
  TrendingUp,
  Clock,
  Award,
  Play,
  Pause,
  RefreshCw,
} from "lucide-react";
import { getLEDScreenData } from "@/lib/actions/led-screen";

interface LEDScreenProps {
  competitionId?: string;
  refreshInterval?: number; // in milliseconds
  locale: string;
}

interface Competition {
  id: string;
  name: string;
  status: string;
  current_round: number;
  total_rounds: number;
}

interface Result {
  id: string;
  competition_id: string;
  rank: number;
  total_score: number;
  judge_score: number;
  public_votes: number;
  group: {
    name: string;
    photo_url: string | null;
    participants: any[];
  };
  round: {
    name: string;
    round_number: number;
    status: string;
  };
}

export function RealtimeLEDScreen({
  competitionId,
  refreshInterval = 5000, // 5 seconds default
  locale,
}: LEDScreenProps) {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = async () => {
    try {
      setLoading(true);

      const data = await getLEDScreenData();

      if (data.success) {
        setCompetitions(data.competitions);
        setResults(data.results);
      } else {
        console.error("Error fetching LED screen data:", data.error);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching LED screen data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up auto-refresh
    const interval = setInterval(fetchData, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Group results by competition
  const resultsByCompetition = results.reduce((acc, result) => {
    if (!acc[result.competition_id]) {
      acc[result.competition_id] = [];
    }
    acc[result.competition_id].push(result);
    return acc;
  }, {} as Record<string, Result[]>);

  if (loading && competitions.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-16 w-16 mx-auto text-yellow-400 animate-spin mb-4" />
          <p className="text-2xl text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-yellow-400 mb-4">
            Live Results
          </h1>
          <p className="text-2xl text-gray-300 mb-4">
            Real-time Competition Updates
          </p>
          <div className="flex items-center justify-center space-x-2 text-gray-400">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Active Competitions */}
        {competitions.length > 0 ? (
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
                        Round {competition.current_round}
                      </Badge>
                      <Badge variant="secondary" className="text-lg">
                        {currentRound?.status === "active" ? (
                          <Play className="h-4 w-4 mr-1" />
                        ) : (
                          <Pause className="h-4 w-4 mr-1" />
                        )}
                        {currentRound?.status || "pending"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {competitionResults.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {competitionResults.slice(0, 6).map((result, index) => (
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
                                <div className="text-sm opacity-75">points</div>
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
                                  Total Factors:{" "}
                                  {Math.round(result.judge_score)}
                                  {result.public_votes > 0 && (
                                    <span className="ml-2">
                                      • Votes: {result.public_votes}
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
                          Waiting for results...
                        </p>
                        <p className="text-gray-500 mt-2">
                          Results will appear here once judging begins
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
              No Active Competitions
            </h2>
            <p className="text-xl text-gray-500">
              There are currently no active competitions to display
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-700">
          <p className="text-gray-400">
            Auto-refreshing every {refreshInterval / 1000} seconds
          </p>
        </div>
      </div>
    </div>
  );
}
