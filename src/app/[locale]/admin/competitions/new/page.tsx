import { requireAdminAccess } from "@/lib/admin-auth";
import { CompetitionForm } from "@/components/admin/CompetitionForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewCompetitionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await requireAdminAccess();
  const { locale } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={`/${locale}/admin/competitions`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回列表
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">新增競賽</h1>
          <p className="text-gray-600">建立一個新的歌唱競賽活動</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>競賽基本資訊</CardTitle>
        </CardHeader>
        <CardContent>
          <CompetitionForm locale={locale} />
        </CardContent>
      </Card>
    </div>
  );
}
