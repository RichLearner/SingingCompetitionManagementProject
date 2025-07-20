import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function TestParticipantsSimplePage() {
  console.log("Testing simple participants query...");

  // Test 1: Count all participants
  const { count: totalCount, error: countError } = await supabase
    .from("participants")
    .select("*", { count: "exact", head: true });

  console.log("Total participants count:", {
    count: totalCount,
    error: countError,
  });

  // Test 2: Get all participants
  const { data: allParticipants, error: participantsError } = await supabase
    .from("participants")
    .select("*")
    .order("created_at", { ascending: false });

  console.log("All participants:", {
    count: allParticipants?.length || 0,
    error: participantsError,
    participants: allParticipants?.slice(0, 3), // Show first 3
  });

  // Test 3: Get participants with groups
  const { data: participantsWithGroups, error: groupsError } = await supabase
    .from("participants")
    .select(
      `
      *,
      group:groups(id, name, competition_id)
    `
    )
    .order("created_at", { ascending: false });

  console.log("Participants with groups:", {
    count: participantsWithGroups?.length || 0,
    error: groupsError,
    participants: participantsWithGroups?.slice(0, 3), // Show first 3
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Simple Participants Test</h1>

      <div className="space-y-4">
        <div className="border p-4 rounded">
          <h2 className="font-semibold">Test 1: Total Participants Count</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify({ count: totalCount, error: countError }, null, 2)}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold">
            Test 2: All Participants (Basic Query)
          </h2>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify(
              {
                count: allParticipants?.length || 0,
                error: participantsError,
                participants: allParticipants?.slice(0, 3),
              },
              null,
              2
            )}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold">
            Test 3: Participants with Groups (Join Query)
          </h2>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify(
              {
                count: participantsWithGroups?.length || 0,
                error: groupsError,
                participants: participantsWithGroups?.slice(0, 3),
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
