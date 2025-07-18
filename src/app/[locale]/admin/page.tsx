import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Award, BarChart3, Plus } from "lucide-react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { userId } = await auth();
  const { locale } = await params;

  if (!userId) {
    redirect(`/${locale}/sign-in`);
  }

  // Fetch real data from database with error handling
  let competitions: any[] = [];
  let groups: any[] = [];
  let participants: any[] = [];
  let judges: any[] = [];

  try {
    const [competitionsResult, groupsResult, participantsResult, judgesResult] =
      await Promise.all([
        supabase
          .from("competitions")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("groups").select("*"),
        supabase.from("participants").select("*"),
        supabase.from("judges").select("*"),
      ]);

    competitions = competitionsResult.data || [];
    groups = groupsResult.data || [];
    participants = participantsResult.data || [];
    judges = judgesResult.data || [];
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    // Continue with empty arrays if there's an error
  }

  // Calculate dashboard metrics
  const totalCompetitions = competitions.length;
  const activeCompetitions = competitions.filter(
    (c) => c.status === "active"
  ).length;
  const draftCompetitions = competitions.filter(
    (c) => c.status === "draft"
  ).length;
  const completedCompetitions = competitions.filter(
    (c) => c.status === "completed"
  ).length;
  const totalGroups = groups.length;
  const totalParticipants = participants.length;
  const totalJudges = judges.length;

  // Get current round from active competitions
  const activeCompetition = competitions.find((c) => c.status === "active");
  const currentRound = activeCompetition?.current_round || 1;
  const totalRounds = activeCompetition?.total_rounds || 2;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">管理儀表板</h1>
          <p className="text-gray-600">管理您的 803 Event 競賽</p>
        </div>
        <Link href={`/${locale}/admin/competitions/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新增競賽
          </Button>
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總競賽數</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompetitions}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {activeCompetitions > 0 && (
                <Badge variant="outline" className="text-green-600">
                  {activeCompetitions} 進行中
                </Badge>
              )}
              {draftCompetitions > 0 && (
                <Badge variant="outline" className="text-yellow-600">
                  {draftCompetitions} 草稿
                </Badge>
              )}
              {totalCompetitions === 0 && (
                <span className="text-gray-500">尚未建立</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">參賽隊伍</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGroups}</div>
            <p className="text-xs text-muted-foreground">
              {totalParticipants} 位參賽者
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">評審人數</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJudges}</div>
            <p className="text-xs text-muted-foreground">
              {totalJudges > 0 ? "已設定評審" : "尚未設定評審"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">目前回合</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeCompetition ? `第 ${currentRound} 回合` : "無進行中競賽"}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeCompetition ? `共 ${totalRounds} 回合` : "請先建立競賽"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content based on whether competitions exist */}
      {totalCompetitions > 0 ? (
        <>
          {/* Recent Activity / Competition Status */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>最近的競賽</CardTitle>
                <CardDescription>最新建立和更新的競賽活動</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {competitions.slice(0, 3).map((competition, index) => (
                    <div
                      key={competition.id || `competition-${index}`}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <div className="font-medium">{competition.name}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(
                              competition.created_at
                            ).toLocaleDateString("zh-TW")}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          competition.status === "active"
                            ? "text-green-600"
                            : competition.status === "draft"
                            ? "text-yellow-600"
                            : "text-gray-600"
                        }
                      >
                        {competition.status === "active"
                          ? "進行中"
                          : competition.status === "draft"
                          ? "草稿"
                          : "已完成"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>系統統計</CardTitle>
                <CardDescription>目前系統使用情況</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {activeCompetitions}
                    </div>
                    <div className="text-xs text-gray-600">進行中競賽</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {totalGroups}
                    </div>
                    <div className="text-xs text-gray-600">參賽隊伍</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {totalParticipants}
                    </div>
                    <div className="text-xs text-gray-600">參賽者</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {totalJudges}
                    </div>
                    <div className="text-xs text-gray-600">評審</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
              <CardDescription>常用的管理功能</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Link href={`/${locale}/admin/competitions`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Trophy className="mr-2 h-4 w-4" />
                    競賽管理
                  </Button>
                </Link>
                <Link href={`/${locale}/admin/groups`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    隊伍管理
                  </Button>
                </Link>
                <Link href={`/${locale}/admin/judges`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Award className="mr-2 h-4 w-4" />
                    評審管理
                  </Button>
                </Link>
                <Link href={`/${locale}/admin/scoring`}>
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    評分管理
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Empty State */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-gray-500 mb-4">
              <Trophy className="h-16 w-16 mx-auto mb-4" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              開始您的第一個競賽
            </h3>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              歡迎來到 803 Event
              管理系統！建立您的第一個歌唱競賽，開始管理參賽隊伍、評審和評分。
            </p>
            <Link href={`/${locale}/admin/competitions/new`}>
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                建立第一個競賽
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
