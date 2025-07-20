import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function TestParticipantsPage() {
  console.log("Testing participants query...");

  // Test 1: Basic participants query
  console.log("Test 1: Basic participants query");
  const { data: basicData, error: basicError } = await supabase
    .from("participants")
    .select("*")
    .limit(1);

  console.log("Basic query result:", { data: basicData, error: basicError });

  // Test 2: Participants with group join
  console.log("Test 2: Participants with group join");
  const { data: joinData, error: joinError } = await supabase
    .from("participants")
    .select(
      `
      *,
      group:groups(id, name, is_eliminated, competition_id)
    `
    )
    .limit(1);

  console.log("Join query result:", { data: joinData, error: joinError });

  // Test 3: Check if groups table exists
  console.log("Test 3: Check groups table");
  const { data: groupsData, error: groupsError } = await supabase
    .from("groups")
    .select("*")
    .limit(1);

  console.log("Groups query result:", { data: groupsData, error: groupsError });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Participants Query Test</h1>

      <div className="space-y-4">
        <div className="border p-4 rounded">
          <h2 className="font-semibold">Test 1: Basic Participants Query</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify({ data: basicData, error: basicError }, null, 2)}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold">
            Test 2: Participants with Group Join
          </h2>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify({ data: joinData, error: joinError }, null, 2)}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold">Test 3: Groups Table Check</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify({ data: groupsData, error: groupsError }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
