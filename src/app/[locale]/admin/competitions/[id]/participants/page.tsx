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

  // Get all participants with error handling
  let allParticipants = null;
  let participantsError = null;

  try {
    // Use a simple query first, then get group data separately
    const result = await supabase
      .from("participants")
      .select("*")
      .order("name", { ascending: true });

    allParticipants = result.data;
    participantsError = result.error;

    // If participants query worked, get group data separately
    if (!participantsError && allParticipants) {
      const { data: competitionGroups } = await supabase
        .from("groups")
        .select("id, name, is_eliminated, competition_id")
        .eq("competition_id", id);

      // Merge the data manually
      allParticipants = allParticipants.map((participant) => ({
        ...participant,
        group:
          competitionGroups?.find((g) => g.id === participant.group_id) || null,
      }));
    }
  } catch (error) {
    console.error("Caught error in participants query:", error);
    participantsError = error;
  }

  if (participantsError) {
    console.error("Error fetching participants:", participantsError);
    console.error("Error details:", {
      message: (participantsError as any).message,
      details: (participantsError as any).details,
      hint: (participantsError as any).hint,
      code: (participantsError as any).code,
      error: participantsError,
    });

    // If the table doesn't exist, show a helpful message instead of crashing
    if ((participantsError as any).code === "42P01") {
      // Table doesn't exist
      return (
        <div className="space-y-6">
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

          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <User className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold mb-2">
                  Database Setup Required
                </h2>
                <p className="text-gray-600 mb-4">
                  The participants table is not set up in your database. Please
                  run the database setup script.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
                  <h3 className="font-semibold text-yellow-800 mb-2">
                    To fix this:
                  </h3>
                  <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
                    <li>Go to your Supabase dashboard</li>
                    <li>Open the SQL Editor</li>
                    <li>
                      Run the script from{" "}
                      <code className="bg-yellow-100 px-1 rounded">
                        scripts/check-database.sql
                      </code>
                    </li>
                    <li>Refresh this page</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // For any other error, show a generic error page
    return (
      <div className="space-y-6">
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

        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <User className="mx-auto h-16 w-16 text-red-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Database Error</h2>
              <p className="text-gray-600 mb-4">
                There was an error accessing the participants data.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-red-800 mb-2">
                  Error Details:
                </h3>
                <pre className="text-sm text-red-700 bg-red-100 p-2 rounded overflow-auto">
                  {JSON.stringify(participantsError, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show all participants - they can be assigned to groups in this competition
  let participants = allParticipants || [];

  console.log("Participants data:", {
    totalParticipants: allParticipants?.length || 0,
    participantsWithGroups:
      allParticipants?.filter((p) => p.group_id && p.group).length || 0,
    participantsWithoutGroups:
      allParticipants?.filter((p) => !p.group_id || !p.group).length || 0,
    sampleParticipant: allParticipants?.[0],
    competitionId: id,
  });

  // Apply search filter
  if (search) {
    participants = participants.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Apply group filter
  if (group === "no-group") {
    participants = participants.filter((p) => !p.group_id);
  } else if (group) {
    participants = participants.filter((p) => p.group_id === group);
  }

  // Calculate statistics
  const totalParticipants = participants?.length || 0;
  const participantsWithGroups =
    participants?.filter((p) => p.group_id && p.group).length || 0;
  const participantsWithoutGroups =
    participants?.filter((p) => !p.group_id || !p.group).length || 0;
  const groupLeaders =
    participants?.filter((p) => p.group?.leader_id === p.id).length || 0;

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
            {t("participant.participantsList")} ({participants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {participants.length > 0 ? (
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
                      <div className="font-medium text-lg">
                        {participant.name}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        {participant.group ? (
                          <>
                            <span>{participant.group.name}</span>
                            {participant.group.is_eliminated && (
                              <Badge variant="destructive">
                                {t("group.eliminated")}
                              </Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-orange-600">
                            {t("participant.noGroup")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/${locale}/admin/competitions/${id}/participants/${participant.id}/edit`}
                    >
                      <Button variant="outline" size="sm">
                        {t("common.edit")}
                      </Button>
                    </Link>
                    <ParticipantActions
                      participant={participant}
                      locale={locale}
                      competitionId={id}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <User className="mx-auto h-12 w-12 mb-4" />
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
