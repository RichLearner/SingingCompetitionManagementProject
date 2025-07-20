import { requireAdminAccess } from "@/lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Users,
  Trophy,
  UserX,
  Search,
  Download,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { GroupActions } from "@/components/admin/GroupActions";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function GroupsPage({
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

  // Build query for groups
  let query = supabase
    .from("groups")
    .select(
      `
      *,
      leader:participants!fk_groups_leader(id, name),
      participants:participants!participants_group_id_fkey(id)
    `
    )
    .eq("competition_id", id)
    .order("name", { ascending: true });

  // Apply search filter
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  // Apply status filter
  if (status === "eliminated") {
    query = query.eq("is_eliminated", true);
  } else if (status === "qualified") {
    query = query.eq("is_eliminated", false);
  }

  const { data: groups, error: groupsError } = await query;

  if (groupsError) {
    console.error("Error fetching groups:", groupsError);
    notFound();
  }

  // Calculate statistics
  const totalGroups = groups?.length || 0;
  const qualifiedGroups = groups?.filter((g) => !g.is_eliminated).length || 0;
  const eliminatedGroups = groups?.filter((g) => g.is_eliminated).length || 0;
  const groupsWithLeaders = groups?.filter((g) => g.leader).length || 0;

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
              {t("admin.groups")}
            </h1>
            <p className="text-gray-600">{competition.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            {t("common.export")}
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            {t("common.import")}
          </Button>
          <Link href={`/${locale}/admin/competitions/${id}/groups/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("group.create")}
            </Button>
          </Link>
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
              {t("group.qualified")}
            </CardTitle>
            <Trophy className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {qualifiedGroups}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("group.qualifiedDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("group.eliminated")}
            </CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {eliminatedGroups}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("group.eliminatedDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("group.withLeaders")}
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {groupsWithLeaders}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("group.withLeadersDescription")}
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
                  placeholder={t("group.searchPlaceholder")}
                  defaultValue={search}
                  className="pl-10"
                  name="search"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={status === "qualified" ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link
                  href={`/${locale}/admin/competitions/${id}/groups?status=qualified`}
                >
                  {t("group.qualified")}
                </Link>
              </Button>
              <Button
                variant={status === "eliminated" ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link
                  href={`/${locale}/admin/competitions/${id}/groups?status=eliminated`}
                >
                  {t("group.eliminated")}
                </Link>
              </Button>
              <Button
                variant={!status ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link href={`/${locale}/admin/competitions/${id}/groups`}>
                  {t("common.all")}
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Groups List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("group.groupsList")}</CardTitle>
        </CardHeader>
        <CardContent>
          {groups && groups.length > 0 ? (
            <div className="space-y-4">
              {groups.map((group) => (
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
                          {group.participants?.length || 0}{" "}
                          {t("participant.title")}
                        </span>
                        {group.leader && (
                          <>
                            <span>•</span>
                            <span>
                              {t("group.leader")}: {group.leader.name}
                            </span>
                          </>
                        )}
                        {group.is_eliminated && group.elimination_round && (
                          <>
                            <span>•</span>
                            <span>
                              {t("group.eliminatedInRound", {
                                round: group.elimination_round,
                              })}
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
              <p>{search ? t("group.noGroupsFound") : t("group.noGroups")}</p>
              <p className="text-sm">{t("group.noGroupsDescription")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
