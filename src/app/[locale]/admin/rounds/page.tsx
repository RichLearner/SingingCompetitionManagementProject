import { requireAdminAccess } from "@/lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  Search,
  Filter,
  Plus,
  Play,
  CheckCircle,
  XCircle,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function GlobalRoundsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdminAccess();

  const { locale } = await params;
  const { search, competition, status } = await searchParams;
  const t = await getTranslations({ locale });

  // Fetch all rounds with competition data
  const { data: rounds, error } = await supabase
    .from("rounds")
    .select(
      `
      *,
      competition:competitions(id, name, status, current_round)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching rounds:", error);
  }

  // Fetch competitions for filter dropdown
  const { data: competitions } = await supabase
    .from("competitions")
    .select("id, name")
    .order("name", { ascending: true });

  // Filter rounds based on search params
  const filteredRounds =
    rounds?.filter((round) => {
      const matchesSearch =
        !search ||
        round.name.toLowerCase().includes(search.toString().toLowerCase()) ||
        round.description
          ?.toLowerCase()
          .includes(search.toString().toLowerCase());

      const matchesCompetition =
        !competition || round.competition?.id === competition;

      const matchesStatus = !status || round.status === status;

      return matchesSearch && matchesCompetition && matchesStatus;
    }) || [];

  // Calculate statistics
  const totalRounds = rounds?.length || 0;
  const completedRounds =
    rounds?.filter((r) => r.status === "completed").length || 0;
  const activeRounds = rounds?.filter((r) => r.status === "active").length || 0;
  const pendingRounds =
    rounds?.filter((r) => r.status === "pending").length || 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Play className="h-4 w-4 text-green-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("admin.rounds")}
          </h1>
          <p className="text-gray-600 mt-2">{t("round.globalDescription")}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            {t("common.export")}
          </Button>
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            {t("common.import")}
          </Button>
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
              {t("round.completedRounds")}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {completedRounds}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("round.completedRoundsDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("round.activeRounds")}
            </CardTitle>
            <Play className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeRounds}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("round.activeRoundsDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("round.pendingRounds")}
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingRounds}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("round.pendingRoundsDescription")}
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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t("round.searchPlaceholder")}
                  className="pl-10"
                  defaultValue={search?.toString()}
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select defaultValue={competition?.toString()}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("competition.selectCompetition")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  {competitions?.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select defaultValue={status?.toString()}>
                <SelectTrigger>
                  <SelectValue placeholder={t("common.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  <SelectItem value="pending">{t("round.pending")}</SelectItem>
                  <SelectItem value="active">{t("round.active")}</SelectItem>
                  <SelectItem value="completed">
                    {t("round.completed")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rounds List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t("round.allRounds")} ({filteredRounds.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRounds.length > 0 ? (
            <div className="space-y-4">
              {filteredRounds.map((round) => {
                const isCurrent =
                  round.competition?.current_round === round.round_number;

                return (
                  <div
                    key={round.id}
                    className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 ${
                      isCurrent ? "border-blue-500 bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        {getStatusIcon(round.status)}
                      </div>
                      <div>
                        <div className="font-medium text-lg flex items-center space-x-2">
                          <span>{round.name}</span>
                          {isCurrent && (
                            <Badge variant="default" className="text-blue-600">
                              {t("round.current")}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>
                            {round.competition?.name ||
                              t("competition.unknown")}
                          </span>
                          <span>•</span>
                          <span>
                            {t("round.round")} {round.round_number}
                          </span>
                          {round.is_public_voting && (
                            <>
                              <span>•</span>
                              <span>{t("round.publicVoting")}</span>
                            </>
                          )}
                          {round.elimination_count &&
                            round.elimination_count > 0 && (
                              <>
                                <span>•</span>
                                <span>
                                  {t("round.eliminates")}{" "}
                                  {round.elimination_count}
                                </span>
                              </>
                            )}
                        </div>
                        {round.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {round.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          {round.start_time && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {new Date(
                                  round.start_time
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
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
                        {t(`round.${round.status}`)}
                      </Badge>
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={`/${locale}/admin/competitions/${round.competition?.id}/rounds/${round.id}/edit`}
                        >
                          {t("common.edit")}
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="mx-auto h-12 w-12 mb-4" />
              <p>{t("round.noRounds")}</p>
              <p className="text-sm">{t("round.noRoundsDescription")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
