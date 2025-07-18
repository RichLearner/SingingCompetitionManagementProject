import { requireAdminAccess } from "@/lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  User,
  UserCheck,
  UserX,
  Award,
  Search,
  Download,
  Upload,
  Mail,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { JudgeActions } from "@/components/admin/JudgeActions";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function JudgesPage({
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
    .select("id, name")
    .eq("id", id)
    .single();

  if (competitionError || !competition) {
    notFound();
  }

  // Build query for judges
  let query = supabase
    .from("judges")
    .select("*")
    .eq("competition_id", id)
    .order("name", { ascending: true });

  // Apply search filter
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,email.ilike.%${search}%,specialization.ilike.%${search}%`
    );
  }

  // Apply status filter
  if (status === "active") {
    query = query.eq("is_active", true);
  } else if (status === "inactive") {
    query = query.eq("is_active", false);
  }

  const { data: judges, error: judgesError } = await query;

  if (judgesError) {
    console.error("Error fetching judges:", judgesError);
    notFound();
  }

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
              {t("admin.judges")}
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
          <Link href={`/${locale}/admin/competitions/${id}/judges/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("judge.create")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("judge.totalJudges")}
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
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
              {t("judge.active")}
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeJudges}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("judge.activeDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("judge.inactive")}
            </CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {inactiveJudges}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("judge.inactiveDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("judge.experienced")}
            </CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {experiencedJudges}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("judge.experiencedDescription")}
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
                  placeholder={t("judge.searchPlaceholder")}
                  defaultValue={search}
                  className="pl-10"
                  name="search"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={status === "active" ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link
                  href={`/${locale}/admin/competitions/${id}/judges?status=active`}
                >
                  {t("judge.active")}
                </Link>
              </Button>
              <Button
                variant={status === "inactive" ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link
                  href={`/${locale}/admin/competitions/${id}/judges?status=inactive`}
                >
                  {t("judge.inactive")}
                </Link>
              </Button>
              <Button
                variant={!status ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link href={`/${locale}/admin/competitions/${id}/judges`}>
                  {t("common.all")}
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Judges List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("judge.judgesList")}</CardTitle>
        </CardHeader>
        <CardContent>
          {judges && judges.length > 0 ? (
            <div className="space-y-4">
              {judges.map((judge) => (
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
                        {judge.specialization && (
                          <>
                            <Award className="h-3 w-3" />
                            <span>{judge.specialization}</span>
                          </>
                        )}
                        {judge.experience_years && (
                          <>
                            {judge.specialization && <span>•</span>}
                            <span>
                              {judge.experience_years}{" "}
                              {t("judge.yearsExperience")}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                        {judge.email && (
                          <>
                            <Mail className="h-3 w-3" />
                            <span>{judge.email}</span>
                          </>
                        )}
                        {judge.phone && (
                          <>
                            {judge.email && <span>•</span>}
                            <Phone className="h-3 w-3" />
                            <span>{judge.phone}</span>
                          </>
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
                    <Link
                      href={`/${locale}/admin/competitions/${id}/judges/${judge.id}/edit`}
                    >
                      <Button variant="outline" size="sm">
                        {t("common.edit")}
                      </Button>
                    </Link>
                    <JudgeActions
                      judge={judge}
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
              <p>{search ? t("judge.noJudgesFound") : t("judge.noJudges")}</p>
              <p className="text-sm">{t("judge.noJudgesDescription")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
