import { requireAdminAccess } from "@/lib/admin-auth";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function TestParticipantRoutesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await requireAdminAccess();
  const { locale } = await params;
  const t = await getTranslations({ locale });

  // Get a sample competition and participant for testing
  const { data: competition } = await supabase
    .from("competitions")
    .select("id, name")
    .limit(1)
    .single();

  const { data: participant } = await supabase
    .from("participants")
    .select("id, name")
    .limit(1)
    .single();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Participant Routes Test</h1>

      <Card>
        <CardHeader>
          <CardTitle>Available Routes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {competition ? (
            <>
              <div className="space-y-2">
                <h3 className="font-semibold">
                  Competition: {competition.name}
                </h3>
                <div className="space-y-2">
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
              </div>

              {participant && (
                <div className="space-y-2">
                  <h3 className="font-semibold">
                    Participant: {participant.name}
                  </h3>
                  <div className="space-y-2">
                    <Link
                      href={`/${locale}/admin/competitions/${competition.id}/participants/${participant.id}/edit`}
                    >
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        ✏️ Edit Participant
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No competitions found. Create a competition first.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Pages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
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
        </CardContent>
      </Card>
    </div>
  );
}
