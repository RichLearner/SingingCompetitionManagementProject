import { requireAdminAccess } from "@/lib/admin-auth";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function TestAdminFlowPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await requireAdminAccess();
  const { locale } = await params;
  const t = await getTranslations({ locale });

  // Get sample data for testing
  const { data: competition } = await supabase
    .from("competitions")
    .select("id, name, status")
    .limit(1)
    .single();

  const { data: groups } = await supabase
    .from("groups")
    .select("id, name, competition_id")
    .limit(3);

  const { data: participants } = await supabase
    .from("participants")
    .select("id, name, group_id")
    .limit(3);

  const { data: judges } = await supabase
    .from("judges")
    .select("id, name, competition_id")
    .limit(3);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Admin Flow Test</h1>
      <p className="text-gray-600">
        Test all admin functionality for competition management
      </p>

      {competition ? (
        <>
          {/* Competition Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🏆 Competition Management
                <Badge
                  variant={
                    competition.status === "active" ? "default" : "secondary"
                  }
                >
                  {competition.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Link href={`/${locale}/admin/competitions/${competition.id}`}>
                  <Button variant="outline" className="w-full justify-start">
                    📋 Competition Dashboard
                  </Button>
                </Link>

                <Link
                  href={`/${locale}/admin/competitions/${competition.id}/edit`}
                >
                  <Button variant="outline" className="w-full justify-start">
                    ✏️ Edit Competition
                  </Button>
                </Link>

                <Link
                  href={`/${locale}/admin/competitions/${competition.id}/settings`}
                >
                  <Button variant="outline" className="w-full justify-start">
                    ⚙️ Competition Settings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Groups Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                👥 Groups Management
                <Badge variant="outline">{groups?.length || 0} groups</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Link
                  href={`/${locale}/admin/competitions/${competition.id}/groups`}
                >
                  <Button variant="outline" className="w-full justify-start">
                    📋 Groups List
                  </Button>
                </Link>

                <Link
                  href={`/${locale}/admin/competitions/${competition.id}/groups/new`}
                >
                  <Button variant="outline" className="w-full justify-start">
                    ➕ Create New Group
                  </Button>
                </Link>
              </div>

              {groups && groups.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Sample Groups:</h4>
                  {groups.map((group) => (
                    <Link
                      key={group.id}
                      href={`/${locale}/admin/competitions/${competition.id}/groups/${group.id}/edit`}
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left"
                      >
                        ✏️ Edit: {group.name}
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Participants Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                👤 Participants Management
                <Badge variant="outline">
                  {participants?.length || 0} participants
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Link
                  href={`/${locale}/admin/competitions/${competition.id}/participants`}
                >
                  <Button variant="outline" className="w-full justify-start">
                    📋 Participants List
                  </Button>
                </Link>

                <Link
                  href={`/${locale}/admin/competitions/${competition.id}/participants/new`}
                >
                  <Button variant="outline" className="w-full justify-start">
                    ➕ Create New Participant
                  </Button>
                </Link>
              </div>

              {participants && participants.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Sample Participants:</h4>
                  {participants.map((participant) => (
                    <Link
                      key={participant.id}
                      href={`/${locale}/admin/competitions/${competition.id}/participants/${participant.id}/edit`}
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left"
                      >
                        ✏️ Edit: {participant.name}
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Judges Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                👨‍⚖️ Judges Management
                <Badge variant="outline">{judges?.length || 0} judges</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Link
                  href={`/${locale}/admin/competitions/${competition.id}/judges`}
                >
                  <Button variant="outline" className="w-full justify-start">
                    📋 Judges List
                  </Button>
                </Link>

                <Link
                  href={`/${locale}/admin/competitions/${competition.id}/judges/new`}
                >
                  <Button variant="outline" className="w-full justify-start">
                    ➕ Create New Judge
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Rounds Management */}
          <Card>
            <CardHeader>
              <CardTitle>🔄 Rounds Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Link
                  href={`/${locale}/admin/competitions/${competition.id}/rounds`}
                >
                  <Button variant="outline" className="w-full justify-start">
                    📋 Rounds List
                  </Button>
                </Link>

                <Link
                  href={`/${locale}/admin/competitions/${competition.id}/rounds/new`}
                >
                  <Button variant="outline" className="w-full justify-start">
                    ➕ Create New Round
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Scoring Management */}
          <Card>
            <CardHeader>
              <CardTitle>📊 Scoring Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Link
                  href={`/${locale}/admin/competitions/${competition.id}/scoring`}
                >
                  <Button variant="outline" className="w-full justify-start">
                    📋 Scoring Factors
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">
              No competitions found. Create a competition first.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Test Pages */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 Test Pages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link href={`/${locale}/admin/test-participant-routes`}>
            <Button variant="outline" className="w-full justify-start">
              🧪 Test Participant Routes
            </Button>
          </Link>

          <Link href={`/${locale}/admin/test-participants`}>
            <Button variant="outline" className="w-full justify-start">
              🧪 Test Participants Query
            </Button>
          </Link>

          <Link href={`/${locale}/admin/test-participants-simple`}>
            <Button variant="outline" className="w-full justify-start">
              🧪 Test Participants Simple
            </Button>
          </Link>

          <Link href={`/${locale}/admin/debug`}>
            <Button variant="outline" className="w-full justify-start">
              🧪 Database Debug
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
