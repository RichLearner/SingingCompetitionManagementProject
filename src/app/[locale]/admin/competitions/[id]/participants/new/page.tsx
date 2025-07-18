import { requireAdminAccess } from "@/lib/admin-auth";
import { ParticipantForm } from "@/components/admin/ParticipantForm";
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

export default async function NewParticipantPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  await requireAdminAccess();
  const { locale, id } = await params;
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
            {t("participant.create")}
          </h1>
          <p className="text-gray-600">
            {t("participant.createDescription")} - {competition.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("participant.basicInfo")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ParticipantForm locale={locale} competitionId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
