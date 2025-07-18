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
        return "進行中";
      case "completed":
        return "已完成";
      case "draft":
        return "草稿";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">競賽管理</h1>
          <p className="text-gray-600">管理您的歌唱競賽活動</p>
        </div>
        <Link href={`/${locale}/admin/competitions/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新增競賽
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">總競賽數</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {competitions?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">進行中</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {competitions?.filter((c) => c.status === "active").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">草稿</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {competitions?.filter((c) => c.status === "draft").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">已完成</CardTitle>
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
          <CardTitle>競賽列表</CardTitle>
          <CardDescription>管理所有競賽活動的狀態和設定</CardDescription>
        </CardHeader>
        <CardContent>
          {competitions && competitions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-4 font-medium">競賽名稱</th>
                    <th className="text-left p-4 font-medium">狀態</th>
                    <th className="text-left p-4 font-medium">目前回合</th>
                    <th className="text-left p-4 font-medium">建立時間</th>
                    <th className="text-left p-4 font-medium">操作</th>
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
                          第 {competition.current_round} 回合 / 共{" "}
                          {competition.total_rounds} 回合
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-600">
                          {new Date(competition.created_at).toLocaleDateString(
                            "zh-TW"
                          )}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Link
                            href={`/${locale}/admin/competitions/${competition.id}`}
                          >
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link
                            href={`/${locale}/admin/competitions/${competition.id}/edit`}
                          >
                            <Button size="sm" variant="outline">
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
                沒有競賽
              </h3>
              <p className="text-gray-600 mb-4">
                開始建立您的第一個歌唱競賽吧！
              </p>
              <Link href={`/${locale}/admin/competitions/new`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  新增競賽
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
