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

export default async function GlobalGroupsPage({
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

  // Fetch all groups with competition and participant data
  const { data: groups, error } = await supabase
    .from("groups")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching groups:", error);
  } else {
    console.log("Fetched groups:", groups);
  }

  // Fetch competitions for filter dropdown
  const { data: competitions } = await supabase
    .from("competitions")
    .select("id, name")
    .order("name", { ascending: true });

  // Filter groups based on search params
  const filteredGroups =
    groups?.filter((group) => {
      const matchesSearch =
        !search ||
        group.name.toLowerCase().includes(search.toString().toLowerCase());

      const matchesCompetition =
        !competition || group.competition?.id === competition;

      const matchesStatus =
        !status ||
        (status === "eliminated" && group.is_eliminated) ||
        (status === "qualified" && !group.is_eliminated);

      return matchesSearch && matchesCompetition && matchesStatus;
    }) || [];

  // Calculate statistics
  const totalGroups = groups?.length || 0;
  const qualifiedGroups = groups?.filter((g) => !g.is_eliminated).length || 0;
  const eliminatedGroups = groups?.filter((g) => g.is_eliminated).length || 0;
  const groupsWithLeaders = groups?.filter((g) => g.leader_id).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("admin.groups")}
          </h1>
          <p className="text-gray-600 mt-2">{t("group.globalDescription")}</p>
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
              {t("group.totalGroups")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGroups}</div>
            <p className="text-xs text-muted-foreground">
              {t("group.totalGroupsDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("group.qualifiedGroups")}
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {qualifiedGroups}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("group.qualifiedGroupsDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("group.eliminatedGroups")}
            </CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {eliminatedGroups}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("group.eliminatedGroupsDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("group.groupsWithLeaders")}
            </CardTitle>
            <Crown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {groupsWithLeaders}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("group.groupsWithLeadersDescription")}
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
                  placeholder={t("group.searchPlaceholder")}
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
                  <SelectItem value="qualified">
                    {t("group.qualified")}
                  </SelectItem>
                  <SelectItem value="eliminated">
                    {t("group.eliminated")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Groups List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t("group.allGroups")} ({filteredGroups.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredGroups.length > 0 ? (
            <div className="space-y-4">
              {filteredGroups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      {group.photo_url ? (
                        <img
                          src={group.photo_url}
                          alt={group.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <Users className="h-6 w-6 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-lg">{group.name}</div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>
                          {group.competition?.name || t("competition.unknown")}
                        </span>
                        <span>•</span>
                        <span>
                          {group.participants?.length || 0}{" "}
                          {t("group.participants")}
                        </span>
                        {group.leader_id && (
                          <>
                            <span>•</span>
                            <span className="flex items-center space-x-1">
                              <Crown className="h-3 w-3 text-yellow-600" />
                              <span>
                                {
                                  group.participants?.find(
                                    (p: any) => p.id === group.leader_id
                                  )?.name
                                }
                              </span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={group.is_eliminated ? "destructive" : "default"}
                    >
                      {group.is_eliminated
                        ? t("group.eliminated")
                        : t("group.qualified")}
                    </Badge>
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={`/${locale}/admin/competitions/${group.competition?.id}/groups/${group.id}/edit`}
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
              <p>{t("group.noGroups")}</p>
              <p className="text-sm">{t("group.noGroupsDescription")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
