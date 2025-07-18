import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Award, BarChart3, Plus } from "lucide-react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { getTranslations } from "next-intl/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { userId } = await auth();
  const { locale } = await params;

  if (!userId) {
    redirect(`/${locale}/sign-in`);
  }

  // Get translations with locale
  const t = await getTranslations({ locale });

  // Fetch real data from database with error handling
  let competitions: any[] = [];
  let groups: any[] = [];
  let participants: any[] = [];
  let judges: any[] = [];

  try {
    const [competitionsResult, groupsResult, participantsResult, judgesResult] =
      await Promise.all([
        supabase
          .from("competitions")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("groups").select("*"),
        supabase.from("participants").select("*"),
        supabase.from("judges").select("*"),
      ]);

    competitions = competitionsResult.data || [];
    groups = groupsResult.data || [];
    participants = participantsResult.data || [];
    judges = judgesResult.data || [];
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    // Continue with empty arrays if there's an error
  }

  // Calculate dashboard metrics
  const totalCompetitions = competitions.length;
  const activeCompetitions = competitions.filter(
    (c) => c.status === "active"
  ).length;
  const draftCompetitions = competitions.filter(
    (c) => c.status === "draft"
  ).length;
  const completedCompetitions = competitions.filter(
    (c) => c.status === "completed"
  ).length;
  const totalGroups = groups.length;
  const totalParticipants = participants.length;
  const totalJudges = judges.length;

  // Get current round from active competitions
  const activeCompetition = competitions.find((c) => c.status === "active");
  const currentRound = activeCompetition?.current_round || 1;
  const totalRounds = activeCompetition?.total_rounds || 2;

  // Helper function to get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return t("competition.active");
      case "draft":
        return t("competition.draft");
      case "completed":
        return t("competition.completed");
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("admin.dashboard")}
          </h1>
          <p className="text-gray-600">{t("app.description")}</p>
        </div>
        <Link href={`/${locale}/admin/competitions/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("competition.create")}
          </Button>
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin.competitions")}
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompetitions}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {activeCompetitions > 0 && (
                <Badge variant="outline" className="text-green-600">
                  {activeCompetitions} {t("competition.active")}
                </Badge>
              )}
              {draftCompetitions > 0 && (
                <Badge variant="outline" className="text-yellow-600">
                  {draftCompetitions} {t("competition.draft")}
                </Badge>
              )}
              {totalCompetitions === 0 && (
                <span className="text-gray-500">
                  {t("competition.noCompetitions")}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin.groups")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGroups}</div>
            <p className="text-xs text-muted-foreground">
              {totalParticipants} {t("admin.participants")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin.judges")}
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJudges}</div>
            <p className="text-xs text-muted-foreground">
              {totalJudges > 0 ? t("judge.active") : t("judge.noJudges")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("round.title")}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeCompetition
                ? `${t("round.title")} ${currentRound}`
                : t("round.noRounds")}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeCompetition
                ? `${t("competition.totalRounds")}: ${totalRounds}`
                : t("competition.create")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content based on whether competitions exist */}
      {totalCompetitions > 0 ? (
        <>
          {/* Recent Activity / Competition Status */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.competitions")}</CardTitle>
                <CardDescription>
                  {t("competition.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {competitions.slice(0, 3).map((competition, index) => (
                    <div
                      key={competition.id || `competition-${index}`}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <div className="font-medium">{competition.name}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(
                              competition.created_at
                            ).toLocaleDateString(
                              locale === "zh-TW" ? "zh-TW" : "en-US"
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          competition.status === "active"
                            ? "text-green-600"
                            : competition.status === "draft"
                            ? "text-yellow-600"
                            : "text-gray-600"
                        }
                      >
                        {getStatusText(competition.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("admin.dashboard")}</CardTitle>
                <CardDescription>{t("common.status")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {activeCompetitions}
                    </div>
                    <div className="text-xs text-gray-600">
                      {t("competition.active")}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {totalGroups}
                    </div>
                    <div className="text-xs text-gray-600">
                      {t("admin.groups")}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {totalParticipants}
                    </div>
                    <div className="text-xs text-gray-600">
                      {t("admin.participants")}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {totalJudges}
                    </div>
                    <div className="text-xs text-gray-600">
                      {t("admin.judges")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t("common.actions")}</CardTitle>
              <CardDescription>{t("admin.settings")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Link href={`/${locale}/admin/competitions`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Trophy className="mr-2 h-4 w-4" />
                    {t("admin.competitions")}
                  </Button>
                </Link>
                <Link href={`/${locale}/admin/groups`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    {t("admin.groups")}
                  </Button>
                </Link>
                <Link href={`/${locale}/admin/judges`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Award className="mr-2 h-4 w-4" />
                    {t("admin.judges")}
                  </Button>
                </Link>
                <Link href={`/${locale}/admin/scoring`}>
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    {t("scoring.title")}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Empty State */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-gray-500 mb-4">
              <Trophy className="h-16 w-16 mx-auto mb-4" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t("competition.create")}
            </h3>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              {t("app.description")}
            </p>
            <Link href={`/${locale}/admin/competitions/new`}>
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                {t("competition.create")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
