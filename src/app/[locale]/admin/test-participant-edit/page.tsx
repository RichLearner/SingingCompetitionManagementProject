import { requireAdminAccess } from "@/lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function TestParticipantEditPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await requireAdminAccess();
  const { locale } = await params;
  const t = await getTranslations({ locale });

  const participantId = "688b8f0a-3d28-4848-bd9f-c1e5c4ad8378";
  const competitionId = "a9d17c60-4d0c-46fe-9c20-03edd0f82593";

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Test Participant Edit Route</h1>

      <Card>
        <CardHeader>
          <CardTitle>Test Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p>
              <strong>Participant ID:</strong> {participantId}
            </p>
            <p>
              <strong>Competition ID:</strong> {competitionId}
            </p>
          </div>

          <div className="space-y-2">
            <p>
              <strong>Test Links:</strong>
            </p>
            <div className="space-y-2">
              <Link
                href={`/${locale}/admin/competitions/${competitionId}/participants/${participantId}/edit`}
                className="block"
              >
                <Button variant="outline">Test Participant Edit Page</Button>
              </Link>

              <Link
                href={`/${locale}/admin/competitions/${competitionId}/participants`}
                className="block"
              >
                <Button variant="outline">Test Participants List Page</Button>
              </Link>

              <Link
                href={`/${locale}/admin/competitions/${competitionId}`}
                className="block"
              >
                <Button variant="outline">Test Competition Page</Button>
              </Link>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-100 rounded">
            <p className="text-sm">
              <strong>Expected URL:</strong>
              <br />/{locale}/admin/competitions/{competitionId}/participants/
              {participantId}/edit
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
