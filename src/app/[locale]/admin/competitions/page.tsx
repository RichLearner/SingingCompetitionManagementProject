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
import { Plus, Edit, Eye, Trash2, Play, Pause } from "lucide-react";
import Link from "next/link";
import { CompetitionActions } from "@/components/admin/CompetitionActions";
import { getTranslations } from "next-intl/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function CompetitionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await requireAdminAccess();
  const { locale } = await params;
  const t = await getTranslations({ locale });

  // Fetch competitions from database
  const { data: competitions, error } = await supabase
    .from("competitions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching competitions:", error);
  }

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("admin.competitions")}
          </h1>
          <p className="text-gray-600">{t("competition.description")}</p>
        </div>
        <Link href={`/${locale}/admin/competitions/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("competition.create")}
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {t("admin.competitions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {competitions?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {t("competition.active")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {competitions?.filter((c) => c.status === "active").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {t("competition.draft")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {competitions?.filter((c) => c.status === "draft").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {t("competition.completed")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {competitions?.filter((c) => c.status === "completed").length ||
                0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Competitions Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.competitions")}</CardTitle>
          <CardDescription>{t("competition.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {competitions && competitions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-4 font-medium">
                      {t("competition.name")}
                    </th>
                    <th className="text-left p-4 font-medium">
                      {t("common.status")}
                    </th>
                    <th className="text-left p-4 font-medium">
                      {t("round.title")}
                    </th>
                    <th className="text-left p-4 font-medium">
                      {t("common.created")}
                    </th>
                    <th className="text-left p-4 font-medium">
                      {t("common.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {competitions.map((competition) => (
                    <tr
                      key={competition.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{competition.name}</div>
                          {competition.description && (
                            <div className="text-sm text-gray-600 mt-1">
                              {competition.description.substring(0, 100)}
                              {competition.description.length > 100 && "..."}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(competition.status)}>
                          {getStatusText(competition.status)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">
                          {t("round.title")} {competition.current_round} /{" "}
                          {competition.total_rounds}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-600">
                          {new Date(competition.created_at).toLocaleDateString(
                            locale === "zh-TW" ? "zh-TW" : "en-US"
                          )}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Link
                            href={`/${locale}/admin/competitions/${competition.id}`}
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              title={t("common.view")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link
                            href={`/${locale}/admin/competitions/${competition.id}/edit`}
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              title={t("common.edit")}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <CompetitionActions
                            competition={competition}
                            locale={locale}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("competition.noCompetitions")}
              </h3>
              <p className="text-gray-600 mb-4">
                {t("competition.createFirst")}
              </p>
              <Link href={`/${locale}/admin/competitions/new`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("competition.create")}
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
