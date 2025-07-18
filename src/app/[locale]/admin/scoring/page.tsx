import { requireAdminAccess } from "@/lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  Trophy,
  Calendar,
  Star,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function GlobalScoringPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await requireAdminAccess();

  const { locale } = await params;
  const t = await getTranslations({ locale });

  // Fetch scoring analytics data
  const [
    { data: totalScores },
    { data: competitions },
    { data: scoringFactors },
    { data: judges },
    { data: recentScores },
  ] = await Promise.all([
    supabase.from("judge_scores").select("id, score, created_at"),

    supabase
      .from("competitions")
      .select("id, name, status")
      .order("created_at", { ascending: false }),

    supabase
      .from("scoring_factors")
      .select("id, name, competition_id, weight, max_score, is_active")
      .eq("is_active", true),

    supabase.from("judges").select("id, name, is_active").eq("is_active", true),

    supabase
      .from("judge_scores")
      .select(
        `
        id,
        score,
        comments,
        created_at,
        judge:judges!inner(name),
        group:groups!inner(name),
        factor:scoring_factors!inner(name),
        round:rounds!inner(name, round_number)
      `
      )
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  // Calculate analytics
  const totalScoresCount = totalScores?.length || 0;
  const averageScore = totalScores?.length
    ? (
        totalScores.reduce((sum, score) => sum + score.score, 0) /
        totalScores.length
      ).toFixed(2)
    : 0;

  const completionRate = competitions?.length
    ? (
        (competitions.filter((c) => c.status === "completed").length /
          competitions.length) *
        100
      ).toFixed(1)
    : 0;

  const activeCompetitions =
    competitions?.filter((c) => c.status === "active") || [];
  const completedCompetitions =
    competitions?.filter((c) => c.status === "completed") || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("admin.scoring")}
          </h1>
          <p className="text-gray-600 mt-2">{t("scoring.globalDescription")}</p>
        </div>
        <div className="flex space-x-2">
          <Button asChild>
            <Link href={`/${locale}/admin/analytics`}>
              <BarChart3 className="mr-2 h-4 w-4" />
              {t("scoring.viewAnalytics")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("scoring.totalScores")}
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalScoresCount}</div>
            <p className="text-xs text-muted-foreground">
              {t("scoring.totalScoresDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("scoring.averageScore")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {averageScore}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("scoring.averageScoreDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("scoring.completionRate")}
            </CardTitle>
            <Trophy className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {completionRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {t("scoring.completionRateDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("scoring.activeJudges")}
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {judges?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("scoring.activeJudgesDescription")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Competition Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t("scoring.competitionStatus")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {activeCompetitions.length}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t("competition.active")}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {completedCompetitions.length}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t("competition.completed")}
                  </div>
                </div>
              </div>

              {activeCompetitions.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">
                    {t("scoring.activeCompetitions")}
                  </h4>
                  <div className="space-y-2">
                    {activeCompetitions.slice(0, 3).map((comp) => (
                      <div
                        key={comp.id}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{comp.name}</span>
                        <Badge variant="outline">
                          {t("competition.active")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t("scoring.scoringFactors")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {scoringFactors?.length || 0}
                </div>
                <div className="text-sm text-gray-600">
                  {t("scoring.totalFactors")}
                </div>
              </div>

              {scoringFactors && scoringFactors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">
                    {t("scoring.factorBreakdown")}
                  </h4>
                  <div className="space-y-2">
                    {scoringFactors.slice(0, 5).map((factor) => (
                      <div
                        key={factor.id}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{factor.name}</span>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{factor.weight}x</Badge>
                          <span className="text-sm text-gray-600">
                            {(
                              (factor.weight /
                                scoringFactors.reduce(
                                  (sum, f) => sum + f.weight,
                                  0
                                )) *
                              100
                            ).toFixed(0)}
                            %
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Scoring Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t("scoring.recentActivity")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentScores && recentScores.length > 0 ? (
            <div className="space-y-4">
              {recentScores.map((score) => (
                <div
                  key={score.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Star className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {(score.judge as any)?.name} scored{" "}
                        {(score.group as any)?.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {(score.factor as any)?.name} •{" "}
                        {(score.round as any)?.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{score.score}/10</Badge>
                    <div className="text-sm text-gray-600">
                      {new Date(score.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="mx-auto h-12 w-12 mb-4" />
              <p>{t("scoring.noRecentActivity")}</p>
              <p className="text-sm">
                {t("scoring.noRecentActivityDescription")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("scoring.quickActions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Link href={`/${locale}/admin/competitions`}>
              <Button variant="outline" className="w-full justify-start">
                <Trophy className="mr-2 h-4 w-4" />
                {t("scoring.viewCompetitions")}
              </Button>
            </Link>
            <Link href={`/${locale}/admin/judges`}>
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                {t("scoring.manageJudges")}
              </Button>
            </Link>
            <Link href={`/${locale}/admin/groups`}>
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                {t("scoring.viewGroups")}
              </Button>
            </Link>
            <Link href={`/${locale}/admin/rounds`}>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                {t("scoring.viewRounds")}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
