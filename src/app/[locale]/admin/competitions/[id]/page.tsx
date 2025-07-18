import { requireAdminAccess } from "@/lib/admin-auth";
import { createClient } from "@supabase/supabase-js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  Settings,
  Users,
  Trophy,
  Clock,
  Play,
  Pause,
  Plus,
  UserCheck,
  Award,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { RoundActions } from "@/components/admin/RoundActions";
import { GroupActions } from "@/components/admin/GroupActions";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function CompetitionDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  await requireAdminAccess();
  const { locale, id } = await params;
  const t = await getTranslations({ locale });

  // Fetch competition and related data
  const { data: competition, error: competitionError } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", id)
    .single();

  if (competitionError || !competition) {
    notFound();
  }

  // Fetch related data in parallel
  const [
    { data: rounds },
    { data: groups },
    { data: participants },
    { data: judges },
    { data: scoringFactors },
  ] = await Promise.all([
    supabase
      .from("rounds")
      .select("*")
      .eq("competition_id", id)
      .order("round_number", { ascending: true }),
    supabase
      .from("groups")
      .select("*")
      .eq("competition_id", id)
      .order("name", { ascending: true }),
    supabase
      .from("participants")
      .select("*, groups(name)")
      .eq("groups.competition_id", id),
    supabase
      .from("judges")
      .select("*")
      .eq("competition_id", id)
      .order("name", { ascending: true }),
    supabase
      .from("scoring_factors")
      .select("*")
      .eq("competition_id", id)
      .order("order_index", { ascending: true }),
  ]);

  // Calculate statistics
  const totalGroups = groups?.length || 0;
  const totalParticipants = participants?.length || 0;
  const totalJudges = judges?.length || 0;
  const totalRounds = rounds?.length || 0;
  const activeRounds = rounds?.filter((r) => r.status === "active").length || 0;
  const completedRounds =
    rounds?.filter((r) => r.status === "completed").length || 0;
  const eliminatedGroups = groups?.filter((g) => g.is_eliminated).length || 0;
  const qualifiedGroups = totalGroups - eliminatedGroups;

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return t("competition.active");
      case "completed":
        return t("competition.completed");
      case "draft":
        return t("competition.draft");
      default:
        return status;
    }
  };

  const getRoundStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoundStatusText = (status: string) => {
    switch (status) {
      case "active":
        return t("round.active");
      case "completed":
        return t("round.completed");
      case "pending":
        return t("round.pending");
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/${locale}/admin/competitions`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {competition.name}
            </h1>
            {competition.description && (
              <p className="text-gray-600 mt-1">{competition.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(competition.status)}>
            {getStatusText(competition.status)}
          </Badge>
          <Link href={`/${locale}/admin/competitions/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              {t("common.edit")}
            </Button>
          </Link>
          <Link href={`/${locale}/admin/competitions/${id}/settings`}>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              {t("admin.settings")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Competition Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Trophy className="mr-2 h-4 w-4" />
              {t("competition.currentRound")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {competition.current_round} / {competition.total_rounds}
            </div>
            <p className="text-sm text-gray-600">
              {activeRounds > 0 ? t("round.active") : t("round.pending")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="mr-2 h-4 w-4" />
              {t("admin.groups")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {qualifiedGroups} / {totalGroups}
            </div>
            <p className="text-sm text-gray-600">
              {eliminatedGroups} {t("group.eliminated")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <UserCheck className="mr-2 h-4 w-4" />
              {t("admin.participants")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalParticipants}</div>
            <p className="text-sm text-gray-600">
              {totalGroups} {t("admin.groups")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Award className="mr-2 h-4 w-4" />
              {t("admin.judges")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJudges}</div>
            <p className="text-sm text-gray-600">
              {judges?.filter((j) => j.is_active).length || 0}{" "}
              {t("judge.active")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rounds Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                {t("admin.rounds")}
              </CardTitle>
              <CardDescription>{t("round.description")}</CardDescription>
            </div>
            <Link href={`/${locale}/admin/competitions/${id}/rounds/new`}>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {t("round.create")}
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {rounds && rounds.length > 0 ? (
            <div className="space-y-2">
              {rounds.map((round) => (
                <div
                  key={round.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium">
                      {t("round.title")} {round.round_number}
                    </div>
                    <div className="text-sm text-gray-600">{round.name}</div>
                    <Badge className={getRoundStatusColor(round.status)}>
                      {getRoundStatusText(round.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/${locale}/admin/competitions/${id}/rounds/${round.id}/edit`}
                    >
                      <Button variant="outline" size="sm">
                        {t("common.edit")}
                      </Button>
                    </Link>
                    <RoundActions round={round} locale={locale} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="mx-auto h-12 w-12 mb-4" />
              <p>{t("round.noRounds")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Groups Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                {t("admin.groups")}
              </CardTitle>
              <CardDescription>{t("group.description")}</CardDescription>
            </div>
            <Link href={`/${locale}/admin/competitions/${id}/groups/new`}>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {t("group.create")}
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {groups && groups.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="p-4 border rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium">{group.name}</div>
                      <div className="text-sm text-gray-600">
                        {group.is_eliminated ? (
                          <span className="text-red-600">
                            {t("group.eliminated")}
                          </span>
                        ) : (
                          <span className="text-green-600">
                            {t("group.qualified")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/${locale}/admin/competitions/${id}/groups/${group.id}/edit`}
                    >
                      <Button variant="outline" size="sm">
                        {t("common.edit")}
                      </Button>
                    </Link>
                    <GroupActions
                      group={group}
                      locale={locale}
                      currentRound={competition.current_round}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="mx-auto h-12 w-12 mb-4" />
              <p>{t("group.noGroups")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href={`/${locale}/admin/competitions/${id}/participants`}>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <UserCheck className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="font-medium">{t("admin.participants")}</div>
                  <div className="text-sm text-gray-600">
                    {t("participant.description")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${locale}/admin/competitions/${id}/judges`}>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Award className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="font-medium">{t("admin.judges")}</div>
                  <div className="text-sm text-gray-600">
                    {t("judge.description")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${locale}/admin/competitions/${id}/scoring`}>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-8 w-8 text-green-600" />
                <div>
                  <div className="font-medium">{t("admin.scoringFactors")}</div>
                  <div className="text-sm text-gray-600">
                    {t("scoring.description")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${locale}/admin/competitions/${id}/results`}>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Trophy className="h-8 w-8 text-yellow-600" />
                <div>
                  <div className="font-medium">{t("admin.results")}</div>
                  <div className="text-sm text-gray-600">
                    {t("results.description")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
