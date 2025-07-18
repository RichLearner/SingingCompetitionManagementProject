import { requireAdminAccess } from "@/lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Settings,
  BarChart3,
  Users,
  Clock,
  Trash2,
  Edit,
  Plus,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function CompetitionSettingsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  await requireAdminAccess();
  const { locale, id } = await params;
  const t = await getTranslations({ locale });

  // Fetch competition and related data
  const [
    { data: competition, error: competitionError },
    { data: scoringFactors },
    { data: rounds },
    { data: groups },
    { data: participants },
    { data: judges },
  ] = await Promise.all([
    supabase.from("competitions").select("*").eq("id", id).single(),
    supabase
      .from("scoring_factors")
      .select("*")
      .eq("competition_id", id)
      .eq("is_active", true)
      .order("order_index", { ascending: true }),
    supabase
      .from("rounds")
      .select("*")
      .eq("competition_id", id)
      .order("round_number", { ascending: true }),
    supabase.from("groups").select("*").eq("competition_id", id),
    supabase
      .from("participants")
      .select("*, groups(name)")
      .eq("groups.competition_id", id),
    supabase.from("judges").select("*").eq("competition_id", id),
  ]);

  if (competitionError || !competition) {
    notFound();
  }

  // Calculate statistics
  const totalRounds = rounds?.length || 0;
  const totalGroups = groups?.length || 0;
  const totalParticipants = participants?.length || 0;
  const totalJudges = judges?.length || 0;
  const totalScoringFactors = scoringFactors?.length || 0;

  // Check if competition has data (to determine if it's safe to delete)
  const hasData = totalRounds > 0 || totalGroups > 0 || totalParticipants > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href={`/${locale}/admin/competitions/${id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.back")}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("competition.settings")}
          </h1>
          <p className="text-gray-600">
            {t("competition.settingsDescription")} - {competition.name}
          </p>
        </div>
      </div>

      {/* Competition Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            {t("competition.overview")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-sm font-medium">{t("admin.rounds")}</div>
                <div className="text-2xl font-bold">{totalRounds}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-sm font-medium">{t("admin.groups")}</div>
                <div className="text-2xl font-bold">{totalGroups}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-sm font-medium">
                  {t("admin.participants")}
                </div>
                <div className="text-2xl font-bold">{totalParticipants}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-sm font-medium">{t("admin.judges")}</div>
                <div className="text-2xl font-bold">{totalJudges}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scoring Factors */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                {t("admin.scoringFactors")}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {t("scoring.settingsDescription")}
              </p>
            </div>
            <Link
              href={`/${locale}/admin/competitions/${id}/scoring-factors/new`}
            >
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {t("scoring.create")}
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {scoringFactors && scoringFactors.length > 0 ? (
            <div className="space-y-2">
              {scoringFactors.map((factor) => (
                <div
                  key={factor.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium">{factor.name}</div>
                    {factor.name_en && (
                      <div className="text-sm text-gray-600">
                        ({factor.name_en})
                      </div>
                    )}
                    <Badge variant="outline">
                      {t("scoring.maxScore")}: {factor.max_score}
                    </Badge>
                    <Badge variant="outline">
                      {t("scoring.weight")}: {factor.weight}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/${locale}/admin/competitions/${id}/scoring-factors/${factor.id}/edit`}
                    >
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="mx-auto h-12 w-12 mb-4" />
              <p>{t("scoring.noFactors")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t("competition.quickActions")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href={`/${locale}/admin/competitions/${id}/edit`}>
              <Button variant="outline" className="w-full justify-start">
                <Edit className="mr-2 h-4 w-4" />
                {t("competition.editBasicInfo")}
              </Button>
            </Link>
            <Link href={`/${locale}/admin/competitions/${id}/rounds`}>
              <Button variant="outline" className="w-full justify-start">
                <Clock className="mr-2 h-4 w-4" />
                {t("competition.manageRounds")}
              </Button>
            </Link>
            <Link href={`/${locale}/admin/competitions/${id}/groups`}>
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                {t("competition.manageGroups")}
              </Button>
            </Link>
            <Link href={`/${locale}/admin/competitions/${id}/participants`}>
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                {t("competition.manageParticipants")}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t("competition.advanced")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href={`/${locale}/admin/competitions/${id}/judges`}>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="mr-2 h-4 w-4" />
                {t("competition.manageJudges")}
              </Button>
            </Link>
            <Link href={`/${locale}/admin/competitions/${id}/results`}>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="mr-2 h-4 w-4" />
                {t("competition.viewResults")}
              </Button>
            </Link>
            <Link href={`/${locale}/admin/competitions/${id}/export`}>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="mr-2 h-4 w-4" />
                {t("competition.exportData")}
              </Button>
            </Link>
            <Link href={`/${locale}/admin/competitions/${id}/backup`}>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="mr-2 h-4 w-4" />
                {t("competition.backupData")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertTriangle className="mr-2 h-5 w-5" />
            {t("competition.dangerZone")}
          </CardTitle>
          <p className="text-sm text-gray-600">
            {t("competition.dangerZoneDescription")}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
              <div>
                <div className="font-medium text-red-600">
                  {t("competition.deleteCompetition")}
                </div>
                <div className="text-sm text-gray-600">
                  {hasData
                    ? t("competition.deleteWarningWithData")
                    : t("competition.deleteWarningNoData")}
                </div>
              </div>
              <Button variant="destructive" disabled={hasData} className="ml-4">
                <Trash2 className="mr-2 h-4 w-4" />
                {t("competition.deleteCompetition")}
              </Button>
            </div>

            {hasData && (
              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                <AlertTriangle className="inline mr-2 h-4 w-4" />
                {t("competition.deleteBlockedReason")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
