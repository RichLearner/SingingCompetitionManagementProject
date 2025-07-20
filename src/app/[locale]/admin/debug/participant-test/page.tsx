import { requireAdminAccess } from "@/lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function ParticipantTestPage() {
  await requireAdminAccess();

  const participantId = "688b8f0a-3d28-4848-bd9f-c1e5c4ad8378";
  const competitionId = "a9d17c60-4d0c-46fe-9c20-03edd0f82593";

  // Test 1: Check if participant exists
  const { data: participant, error: participantError } = await supabase
    .from("participants")
    .select("*")
    .eq("id", participantId)
    .single();

  // Test 2: Check if competition exists
  const { data: competition, error: competitionError } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", competitionId)
    .single();

  // Test 3: Check all participants
  const { data: allParticipants, error: allParticipantsError } = await supabase
    .from("participants")
    .select("*")
    .limit(10);

  // Test 4: Check all competitions
  const { data: allCompetitions, error: allCompetitionsError } = await supabase
    .from("competitions")
    .select("*")
    .limit(10);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Participant Debug Test</h1>

      <Card>
        <CardHeader>
          <CardTitle>Test 1: Specific Participant</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            <strong>Participant ID:</strong> {participantId}
          </p>
          <p>
            <strong>Error:</strong>{" "}
            {participantError ? JSON.stringify(participantError) : "None"}
          </p>
          <p>
            <strong>Data:</strong>{" "}
            {participant ? JSON.stringify(participant, null, 2) : "Not found"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test 2: Specific Competition</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            <strong>Competition ID:</strong> {competitionId}
          </p>
          <p>
            <strong>Error:</strong>{" "}
            {competitionError ? JSON.stringify(competitionError) : "None"}
          </p>
          <p>
            <strong>Data:</strong>{" "}
            {competition ? JSON.stringify(competition, null, 2) : "Not found"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test 3: All Participants (First 10)</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            <strong>Error:</strong>{" "}
            {allParticipantsError
              ? JSON.stringify(allParticipantsError)
              : "None"}
          </p>
          <p>
            <strong>Count:</strong> {allParticipants?.length || 0}
          </p>
          <p>
            <strong>Data:</strong>{" "}
            {allParticipants
              ? JSON.stringify(allParticipants, null, 2)
              : "None"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test 4: All Competitions (First 10)</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            <strong>Error:</strong>{" "}
            {allCompetitionsError
              ? JSON.stringify(allCompetitionsError)
              : "None"}
          </p>
          <p>
            <strong>Count:</strong> {allCompetitions?.length || 0}
          </p>
          <p>
            <strong>Data:</strong>{" "}
            {allCompetitions
              ? JSON.stringify(allCompetitions, null, 2)
              : "None"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            <strong>SUPABASE_URL:</strong>{" "}
            {process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set"}
          </p>
          <p>
            <strong>SERVICE_ROLE_KEY:</strong>{" "}
            {process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Not set"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
