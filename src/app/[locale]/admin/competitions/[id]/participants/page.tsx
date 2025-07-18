import { requireAdminAccess } from "@/lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  User,
  Users,
  Crown,
  Search,
  Download,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { ParticipantActions } from "@/components/admin/ParticipantActions";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function ParticipantsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ search?: string; group?: string }>;
}) {
  await requireAdminAccess();
  const { locale, id } = await params;
  const { search, group } = await searchParams;
  const t = await getTranslations({ locale });

  // Fetch competition data
  const { data: competition, error: competitionError } = await supabase
    .from("competitions")
    .select("id, name")
    .eq("id", id)
    .single();

  if (competitionError || !competition) {
    notFound();
  }

  // Fetch all groups for this competition
  const { data: groups } = await supabase
    .from("groups")
    .select("id, name, is_eliminated")
    .eq("competition_id", id)
    .order("name", { ascending: true });

  // Build query for participants
  let query = supabase
    .from("participants")
    .select(
      `
      *,
      group:groups(id, name, is_eliminated),
      leader_of:groups!groups_leader_id_fkey(id, name)
    `
    )
    .eq("groups.competition_id", id)
    .order("name", { ascending: true });

  // Apply search filter
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  // Apply group filter
  if (group === "no-group") {
    query = query.is("group_id", null);
  } else if (group) {
    query = query.eq("group_id", group);
  }

  const { data: participants, error: participantsError } = await query;

  if (participantsError) {
    console.error("Error fetching participants:", participantsError);
    notFound();
  }

  // Calculate statistics
  const totalParticipants = participants?.length || 0;
  const participantsWithGroups =
    participants?.filter((p) => p.group_id).length || 0;
  const participantsWithoutGroups =
    participants?.filter((p) => !p.group_id).length || 0;
  const groupLeaders =
    participants?.filter((p) => p.leader_of && p.leader_of.length > 0).length ||
    0;

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
              {t("admin.participants")}
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
          <Link href={`/${locale}/admin/competitions/${id}/participants/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("participant.create")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("participant.totalParticipants")}
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
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
              {participantsWithGroups}
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
            <User className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {participantsWithoutGroups}
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
            <Crown className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
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
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t("participant.searchPlaceholder")}
                  defaultValue={search}
                  className="pl-10"
                  name="search"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={group === "no-group" ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link
                  href={`/${locale}/admin/competitions/${id}/participants?group=no-group`}
                >
                  {t("participant.noGroup")}
                </Link>
              </Button>
              {groups?.map((groupItem) => (
                <Button
                  key={groupItem.id}
                  variant={group === groupItem.id ? "default" : "outline"}
                  size="sm"
                  asChild
                >
                  <Link
                    href={`/${locale}/admin/competitions/${id}/participants?group=${groupItem.id}`}
                  >
                    {groupItem.name}
                  </Link>
                </Button>
              ))}
              <Button
                variant={!group ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link href={`/${locale}/admin/competitions/${id}/participants`}>
                  {t("common.all")}
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Participants List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t("participant.participantsList")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {participants && participants.length > 0 ? (
            <div className="space-y-4">
              {participants.map((participant) => (
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
                        <User className="h-6 w-6 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <div className="font-medium text-lg">
                          {participant.name}
                        </div>
                        {participant.leader_of &&
                          participant.leader_of.length > 0 && (
                            <Crown className="h-4 w-4 text-purple-600" />
                          )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        {participant.group ? (
                          <>
                            <span>
                              {t("participant.group")}: {participant.group.name}
                            </span>
                            {participant.group.is_eliminated && (
                              <>
                                <span>•</span>
                                <span className="text-red-600">
                                  {t("group.eliminated")}
                                </span>
                              </>
                            )}
                          </>
                        ) : (
                          <span className="text-orange-600">
                            {t("participant.noGroup")}
                          </span>
                        )}
                        {participant.leader_of &&
                          participant.leader_of.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-purple-600">
                                {t("participant.leaderOf")}:{" "}
                                {participant.leader_of
                                  .map((g) => g.name)
                                  .join(", ")}
                              </span>
                            </>
                          )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {participant.group ? (
                      <Badge
                        variant={
                          participant.group.is_eliminated
                            ? "destructive"
                            : "default"
                        }
                      >
                        {participant.group.is_eliminated
                          ? t("group.eliminated")
                          : t("group.qualified")}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        {t("participant.unassigned")}
                      </Badge>
                    )}
                    <Link
                      href={`/${locale}/admin/competitions/${id}/participants/${participant.id}/edit`}
                    >
                      <Button variant="outline" size="sm">
                        {t("common.edit")}
                      </Button>
                    </Link>
                    <ParticipantActions
                      participant={participant}
                      competitionId={id}
                      locale={locale}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <User className="mx-auto h-12 w-12 mb-4" />
              <p>
                {search
                  ? t("participant.noParticipantsFound")
                  : t("participant.noParticipants")}
              </p>
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
