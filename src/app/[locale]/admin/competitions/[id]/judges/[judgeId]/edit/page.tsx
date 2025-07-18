import { requireAdminAccess } from "@/lib/admin-auth";
import { JudgeForm } from "@/components/admin/JudgeForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function EditJudgePage({
  params,
}: {
  params: Promise<{ locale: string; id: string; judgeId: string }>;
}) {
  await requireAdminAccess();
  const { locale, id, judgeId } = await params;
  const t = await getTranslations({ locale });

  // Fetch competition and judge data
  const [
    { data: competition, error: competitionError },
    { data: judge, error: judgeError },
  ] = await Promise.all([
    supabase.from("competitions").select("id, name").eq("id", id).single(),
    supabase.from("judges").select("*").eq("id", judgeId).single(),
  ]);

  if (competitionError || !competition || judgeError || !judge) {
    notFound();
  }

  // Verify judge belongs to competition
  if (judge.competition_id !== id) {
    notFound();
  }

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
            {t("judge.edit")}
          </h1>
          <p className="text-gray-600">
            {t("judge.editDescription")} - {competition.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("judge.basicInfo")}</CardTitle>
        </CardHeader>
        <CardContent>
          <JudgeForm locale={locale} competitionId={id} judge={judge} />
        </CardContent>
      </Card>
    </div>
  );
}
