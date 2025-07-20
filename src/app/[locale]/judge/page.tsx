import { requireJudgeAccess } from "@/lib/actions/judge-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Clock,
  Play,
  CheckCircle,
  Users,
  Award,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function JudgeDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const judge = await requireJudgeAccess();
  const { locale } = await params;
  const t = await getTranslations({ locale });

  // Fetch judge assignments
  const { data: judgeAssignments, error } = await supabase
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
    .eq("id", judge.id)
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching judge assignments:", error);
  }

  const assignments = judgeAssignments || [];

  // Get scoring statistics
  const judgeIds = assignments.map((a) => a.id);
  const { data: scoreStats } = await supabase
    .from("judge_scores")
    .select("id, round_id, group_id")
    .in("judge_id", judgeIds);

  const totalScores = scoreStats?.length || 0;
  const activeCompetitions = assignments.filter(
    (a) => a.competition.status === "active"
  ).length;
  const completedCompetitions = assignments.filter(
    (a) => a.competition.status === "completed"
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t("judge.dashboard")}
            </h1>
            <p className="text-gray-600 mt-2">
              {t("judge.welcomeMessage", {
                name: judge.name || t("judge.judge"),
              })}
            </p>
          </div>
          <form action="/api/judge/logout" method="POST">
            <Button variant="outline" type="submit">
              <LogOut className="mr-2 h-4 w-4" />
              {t("judge.logout")}
            </Button>
          </form>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("judge.totalAssignments")}
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignments.length}</div>
              <p className="text-xs text-muted-foreground">
                {t("judge.totalAssignmentsDescription")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("judge.activeCompetitions")}
              </CardTitle>
              <Play className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {activeCompetitions}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("judge.activeCompetitionsDescription")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("judge.completedCompetitions")}
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {completedCompetitions}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("judge.completedCompetitionsDescription")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("judge.totalScores")}
              </CardTitle>
              <Award className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {totalScores}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("judge.totalScoresDescription")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Competition Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t("judge.competitionAssignments")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignments.length > 0 ? (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Trophy className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-lg">
                          {assignment.competition.name}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Clock className="h-3 w-3" />
                          <span>
                            {t("judge.round")}{" "}
                            {assignment.competition.current_round}{" "}
                            {t("judge.of")}{" "}
                            {assignment.competition.total_rounds}
                          </span>
                          <span>•</span>
                          <span>
                            {t("judge.created")}{" "}
                            {new Date(
                              assignment.competition.created_at
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          assignment.competition.status === "active"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {t(`competition.${assignment.competition.status}`)}
                      </Badge>
                      {assignment.competition.status === "active" && (
                        <Button asChild>
                          <Link
                            href={`/${locale}/judge/competitions/${assignment.competition.id}`}
                          >
                            {t("judge.startScoring")}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="mx-auto h-12 w-12 mb-4" />
                <p>{t("judge.noAssignments")}</p>
                <p className="text-sm">{t("judge.noAssignmentsDescription")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
