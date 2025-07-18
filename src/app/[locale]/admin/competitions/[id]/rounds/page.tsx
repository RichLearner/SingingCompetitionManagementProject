import { requireAdminAccess } from "@/lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Clock,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Search,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { RoundActions } from "@/components/admin/RoundActions";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function RoundsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  await requireAdminAccess();
  const { locale, id } = await params;
  const { search, status } = await searchParams;
  const t = await getTranslations({ locale });

  // Fetch competition data
  const { data: competition, error: competitionError } = await supabase
    .from("competitions")
    .select("id, name, current_round")
    .eq("id", id)
    .single();

  if (competitionError || !competition) {
    notFound();
  }

  // Build query for rounds
  let query = supabase
    .from("rounds")
    .select("*")
    .eq("competition_id", id)
    .order("round_number", { ascending: true });

  // Apply search filter
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Apply status filter
  if (status) {
    query = query.eq("status", status);
  }

  const { data: rounds, error: roundsError } = await query;

  if (roundsError) {
    console.error("Error fetching rounds:", roundsError);
    notFound();
  }

  // Calculate statistics
  const totalRounds = rounds?.length || 0;
  const completedRounds =
    rounds?.filter((r) => r.status === "completed").length || 0;
  const activeRounds = rounds?.filter((r) => r.status === "active").length || 0;
  const pendingRounds =
    rounds?.filter((r) => r.status === "pending").length || 0;

  // Get status color and icon
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return { variant: "secondary" as const, icon: Clock };
      case "active":
        return { variant: "default" as const, icon: Play };
      case "completed":
        return { variant: "outline" as const, icon: CheckCircle };
      case "cancelled":
        return { variant: "destructive" as const, icon: XCircle };
      default:
        return { variant: "secondary" as const, icon: Clock };
    }
  };

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
              {t("admin.rounds")}
            </h1>
            <p className="text-gray-600">{competition.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link href={`/${locale}/admin/competitions/${id}/rounds/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("round.create")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("round.totalRounds")}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRounds}</div>
            <p className="text-xs text-muted-foreground">
              {t("round.totalRoundsDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("round.completed")}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {completedRounds}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("round.completedDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("round.active")}
            </CardTitle>
            <Play className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {activeRounds}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("round.activeDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("round.pending")}
            </CardTitle>
            <Pause className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {pendingRounds}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("round.pendingDescription")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("common.filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t("round.searchPlaceholder")}
                  defaultValue={search}
                  className="pl-10"
                  name="search"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={status === "pending" ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link
                  href={`/${locale}/admin/competitions/${id}/rounds?status=pending`}
                >
                  {t("round.pending")}
                </Link>
              </Button>
              <Button
                variant={status === "active" ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link
                  href={`/${locale}/admin/competitions/${id}/rounds?status=active`}
                >
                  {t("round.active")}
                </Link>
              </Button>
              <Button
                variant={status === "completed" ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link
                  href={`/${locale}/admin/competitions/${id}/rounds?status=completed`}
                >
                  {t("round.completed")}
                </Link>
              </Button>
              <Button
                variant={!status ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link href={`/${locale}/admin/competitions/${id}/rounds`}>
                  {t("common.all")}
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rounds Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("round.roundsTimeline")}</CardTitle>
        </CardHeader>
        <CardContent>
          {rounds && rounds.length > 0 ? (
            <div className="space-y-4">
              {rounds.map((round, index) => {
                const statusBadge = getStatusBadge(round.status);
                const StatusIcon = statusBadge.icon;
                const isCurrent =
                  round.round_number === competition.current_round;

                return (
                  <div
                    key={round.id}
                    className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 ${
                      isCurrent ? "ring-2 ring-blue-500 bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            isCurrent ? "bg-blue-600" : "bg-gray-400"
                          }`}
                        >
                          {round.round_number}
                        </div>
                        {isCurrent && (
                          <Badge variant="default" className="text-xs">
                            {t("round.current")}
                          </Badge>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-lg">{round.name}</div>
                        {round.description && (
                          <p className="text-sm text-gray-600">
                            {round.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                          {round.start_date && (
                            <>
                              <Calendar className="h-3 w-3" />
                              <span>
                                {new Date(
                                  round.start_date
                                ).toLocaleDateString()}
                              </span>
                            </>
                          )}
                          {round.voting_enabled && (
                            <>
                              <span>•</span>
                              <span>{t("round.votingEnabled")}</span>
                            </>
                          )}
                          {round.eliminate_participants && (
                            <>
                              <span>•</span>
                              <span>{t("round.eliminationRound")}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={statusBadge.variant}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {t(`round.${round.status}`)}
                      </Badge>
                      <Link
                        href={`/${locale}/admin/competitions/${id}/rounds/${round.id}/edit`}
                      >
                        <Button variant="outline" size="sm">
                          {t("common.edit")}
                        </Button>
                      </Link>
                      <RoundActions
                        round={round}
                        competitionId={id}
                        locale={locale}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="mx-auto h-12 w-12 mb-4" />
              <p>{search ? t("round.noRoundsFound") : t("round.noRounds")}</p>
              <p className="text-sm">{t("round.noRoundsDescription")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
