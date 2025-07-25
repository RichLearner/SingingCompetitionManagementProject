import { requireAdminAccess } from "@/lib/admin-auth";
import { CompetitionForm } from "@/components/admin/CompetitionForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NewCompetitionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await requireAdminAccess();
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={`/${locale}/admin/competitions`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.back")}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("competition.create")}
          </h1>
          <p className="text-gray-600">{t("competition.createDescription")}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("competition.basicInfo")}</CardTitle>
        </CardHeader>
        <CardContent>
          <CompetitionForm locale={locale} />
        </CardContent>
      </Card>
    </div>
  );
}
