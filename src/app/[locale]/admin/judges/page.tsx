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
import { Award, Search, Filter, Plus, User, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function GlobalJudgesPage({
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

  // Fetch all judges with competition data
  const { data: judges, error } = await supabase
    .from("judges")
    .select(
      `
      *,
      competition:competitions(id, name, status)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching judges:", error);
  }

  // Fetch competitions for filter dropdown
  const { data: competitions } = await supabase
    .from("competitions")
    .select("id, name")
    .order("name", { ascending: true });

  // Filter judges based on search params
  const filteredJudges =
    judges?.filter((judge) => {
      const matchesSearch =
        !search ||
        judge.name.toLowerCase().includes(search.toString().toLowerCase()) ||
        judge.email?.toLowerCase().includes(search.toString().toLowerCase()) ||
        judge.specialization
          ?.toLowerCase()
          .includes(search.toString().toLowerCase());

      const matchesCompetition =
        !competition || judge.competition?.id === competition;

      const matchesStatus =
        !status ||
        (status === "active" && judge.is_active) ||
        (status === "inactive" && !judge.is_active);

      return matchesSearch && matchesCompetition && matchesStatus;
    }) || [];

  // Calculate statistics
  const totalJudges = judges?.length || 0;
  const activeJudges = judges?.filter((j) => j.is_active).length || 0;
  const inactiveJudges = judges?.filter((j) => !j.is_active).length || 0;
  const experiencedJudges =
    judges?.filter((j) => j.experience_years && j.experience_years >= 5)
      .length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("admin.judges")}
          </h1>
          <p className="text-gray-600 mt-2">{t("judge.globalDescription")}</p>
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
              {t("judge.totalJudges")}
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJudges}</div>
            <p className="text-xs text-muted-foreground">
              {t("judge.totalJudgesDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("judge.activeJudges")}
            </CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeJudges}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("judge.activeJudgesDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("judge.inactiveJudges")}
            </CardTitle>
            <Award className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {inactiveJudges}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("judge.inactiveJudgesDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("judge.experiencedJudges")}
            </CardTitle>
            <Award className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {experiencedJudges}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("judge.experiencedJudgesDescription")}
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
                  placeholder={t("judge.searchPlaceholder")}
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
                  <SelectItem value="active">{t("judge.active")}</SelectItem>
                  <SelectItem value="inactive">
                    {t("judge.inactive")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Judges List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t("judge.allJudges")} ({filteredJudges.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredJudges.length > 0 ? (
            <div className="space-y-4">
              {filteredJudges.map((judge) => (
                <div
                  key={judge.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      {judge.photo_url ? (
                        <img
                          src={judge.photo_url}
                          alt={judge.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-lg">{judge.name}</div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>
                          {judge.competition?.name || t("competition.unknown")}
                        </span>
                        {judge.specialization && (
                          <>
                            <span>•</span>
                            <span>{judge.specialization}</span>
                          </>
                        )}
                        {judge.experience_years && (
                          <>
                            <span>•</span>
                            <span>
                              {judge.experience_years} {t("judge.years")}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        {judge.email && (
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{judge.email}</span>
                          </div>
                        )}
                        {judge.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{judge.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={judge.is_active ? "default" : "secondary"}>
                      {judge.is_active
                        ? t("judge.active")
                        : t("judge.inactive")}
                    </Badge>
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={`/${locale}/admin/competitions/${judge.competition?.id}/judges/${judge.id}/edit`}
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
              <Award className="mx-auto h-12 w-12 mb-4" />
              <p>{t("judge.noJudges")}</p>
              <p className="text-sm">{t("judge.noJudgesDescription")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
