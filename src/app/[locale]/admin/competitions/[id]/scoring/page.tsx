import { requireAdminAccess } from "@/lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  BarChart3,
  TrendingUp,
  Award,
  Star,
  Users,
  Target,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function ScoringPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  await requireAdminAccess();
  const { locale, id } = await params;
  const t = await getTranslations({ locale });

  // Fetch competition data
  const { data: competition, error: competitionError } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", id)
    .single();

  if (competitionError || !competition) {
    notFound();
  }

  // Fetch scoring factors
  const { data: scoringFactors } = await supabase
    .from("scoring_factors")
    .select("*")
    .eq("competition_id", id)
    .order("weight", { ascending: false });

  // Fetch basic statistics
  const [
    { data: judges },
    { data: groups },
    { data: rounds },
    { data: scores },
  ] = await Promise.all([
    supabase
      .from("judges")
      .select("id, name, is_active")
      .eq("competition_id", id)
      .eq("is_active", true),
    supabase
      .from("groups")
      .select("id, name, is_eliminated")
      .eq("competition_id", id),
    supabase
      .from("rounds")
      .select("id, name, round_number, status")
      .eq("competition_id", id),
    supabase
      .from("scores")
      .select("id, score, judge_id, group_id, round_id")
      .eq("competition_id", id),
  ]);

  // Calculate statistics
  const totalJudges = judges?.length || 0;
  const totalGroups = groups?.length || 0;
  const totalRounds = rounds?.length || 0;
  const totalScores = scores?.length || 0;
  const averageScore = scores?.length
    ? (
        scores.reduce((sum, score) => sum + (score.score || 0), 0) /
        scores.length
      ).toFixed(1)
    : 0;

  // Get scoring factors with weights
  const totalWeight =
    scoringFactors?.reduce((sum, factor) => sum + factor.weight, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/${locale}/admin/competitions/${id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t("admin.scoring")}
            </h1>
            <p className="text-gray-600">{competition.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link href={`/${locale}/admin/competitions/${id}/settings`}>
            <Button variant="outline">
              <Target className="mr-2 h-4 w-4" />
              {t("scoring.manageScoringFactors")}
            </Button>
          </Link>
          <Link href={`/${locale}/admin/competitions/${id}/scoring/matrix`}>
            <Button>
              <BarChart3 className="mr-2 h-4 w-4" />
              {t("scoring.scoringMatrix")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("scoring.totalScores")}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalScores}</div>
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
              {t("scoring.scoringFactors")}
            </CardTitle>
            <Award className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {scoringFactors?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("scoring.scoringFactorsDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("scoring.completionRate")}
            </CardTitle>
            <Star className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {totalJudges && totalGroups && totalRounds
                ? Math.round(
                    (totalScores / (totalJudges * totalGroups * totalRounds)) *
                      100
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              {t("scoring.completionRateDescription")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Scoring Factors */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {t("scoring.scoringFactors")}
            </CardTitle>
            <Link href={`/${locale}/admin/competitions/${id}/settings`}>
              <Button variant="outline" size="sm">
                {t("common.manage")}
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {scoringFactors && scoringFactors.length > 0 ? (
            <div className="space-y-4">
              {scoringFactors.map((factor) => (
                <div
                  key={factor.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="font-medium text-lg">{factor.name}</div>
                    {factor.description && (
                      <p className="text-sm text-gray-600">
                        {factor.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {t("scoring.weight")}: {factor.weight}
                    </Badge>
                    <Badge variant="secondary">
                      {totalWeight > 0
                        ? Math.round((factor.weight / totalWeight) * 100)
                        : 0}
                      %
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Award className="mx-auto h-12 w-12 mb-4" />
              <p>{t("scoring.noScoringFactors")}</p>
              <p className="text-sm">
                {t("scoring.noScoringFactorsDescription")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link href={`/${locale}/admin/competitions/${id}/scoring/matrix`}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="font-medium">
                    {t("scoring.scoringMatrix")}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t("scoring.scoringMatrixDescription")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link href={`/${locale}/admin/competitions/${id}/scoring/analytics`}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div>
                  <div className="font-medium">{t("scoring.analytics")}</div>
                  <div className="text-sm text-gray-600">
                    {t("scoring.analyticsDescription")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Recent Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("scoring.recentScores")}</CardTitle>
        </CardHeader>
        <CardContent>
          {scores && scores.length > 0 ? (
            <div className="space-y-2">
              {scores.slice(0, 10).map((score) => (
                <div
                  key={score.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <div>
                      <div className="text-sm font-medium">
                        {t("scoring.scoreEntry")}
                      </div>
                      <div className="text-xs text-gray-600">
                        {t("scoring.judgeId")}: {score.judge_id} •{" "}
                        {t("scoring.groupId")}: {score.group_id}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {score.score} {t("scoring.points")}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="mx-auto h-12 w-12 mb-4" />
              <p>{t("scoring.noScores")}</p>
              <p className="text-sm">{t("scoring.noScoresDescription")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
