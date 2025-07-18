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
import { Users, Search, Filter, Plus, Crown, UserX } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function GlobalParticipantsPage({
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

  // Fetch all participants with group and competition data
  const { data: participants, error } = await supabase
    .from("participants")
    .select(
      `
      *,
      group:groups(
        id, 
        name, 
        competition:competitions(id, name, status),
        leader_id
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching participants:", error);
  }

  // Fetch competitions for filter dropdown
  const { data: competitions } = await supabase
    .from("competitions")
    .select("id, name")
    .order("name", { ascending: true });

  // Filter participants based on search params
  const filteredParticipants =
    participants?.filter((participant) => {
      const matchesSearch =
        !search ||
        participant.name
          .toLowerCase()
          .includes(search.toString().toLowerCase());

      const matchesCompetition =
        !competition || participant.group?.competition?.id === competition;

      const matchesStatus =
        !status ||
        (status === "with_group" && participant.group_id) ||
        (status === "without_group" && !participant.group_id) ||
        (status === "leader" &&
          participant.group?.leader_id === participant.id);

      return matchesSearch && matchesCompetition && matchesStatus;
    }) || [];

  // Calculate statistics
  const totalParticipants = participants?.length || 0;
  const withGroups = participants?.filter((p) => p.group_id).length || 0;
  const withoutGroups = participants?.filter((p) => !p.group_id).length || 0;
  const groupLeaders =
    participants?.filter((p) => p.group?.leader_id === p.id).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("admin.participants")}
          </h1>
          <p className="text-gray-600 mt-2">
            {t("participant.globalDescription")}
          </p>
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
              {t("participant.totalParticipants")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalParticipants}</div>
            <p className="text-xs text-muted-foreground">
              {t("participant.totalParticipantsDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("participant.withGroups")}
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {withGroups}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("participant.withGroupsDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("participant.withoutGroups")}
            </CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {withoutGroups}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("participant.withoutGroupsDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("participant.groupLeaders")}
            </CardTitle>
            <Crown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {groupLeaders}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("participant.groupLeadersDescription")}
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
                  placeholder={t("participant.searchPlaceholder")}
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
                  <SelectItem value="with_group">
                    {t("participant.withGroup")}
                  </SelectItem>
                  <SelectItem value="without_group">
                    {t("participant.withoutGroup")}
                  </SelectItem>
                  <SelectItem value="leader">
                    {t("participant.leader")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Participants List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t("participant.allParticipants")} ({filteredParticipants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredParticipants.length > 0 ? (
            <div className="space-y-4">
              {filteredParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      {participant.photo_url ? (
                        <img
                          src={participant.photo_url}
                          alt={participant.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <Users className="h-6 w-6 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-lg flex items-center space-x-2">
                        <span>{participant.name}</span>
                        {participant.group?.leader_id === participant.id && (
                          <Crown className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>
                          {participant.group?.name || t("participant.noGroup")}
                        </span>
                        {participant.group?.competition && (
                          <>
                            <span>•</span>
                            <span>{participant.group.competition.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={participant.group_id ? "default" : "secondary"}
                    >
                      {participant.group_id
                        ? t("participant.assigned")
                        : t("participant.unassigned")}
                    </Badge>
                    {participant.group?.leader_id === participant.id && (
                      <Badge variant="outline" className="text-yellow-600">
                        {t("participant.leader")}
                      </Badge>
                    )}
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={`/${locale}/admin/competitions/${participant.group?.competition?.id}/participants/${participant.id}/edit`}
                      >
                        {t("common.edit")}
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="mx-auto h-12 w-12 mb-4" />
              <p>{t("participant.noParticipants")}</p>
              <p className="text-sm">
                {t("participant.noParticipantsDescription")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
