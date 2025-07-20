import { requireAdminAccess } from "@/lib/admin-auth";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function DebugPage() {
  await requireAdminAccess();

  // Test basic connectivity
  const { data: testData, error: testError } = await supabase
    .from("competitions")
    .select("id, name")
    .limit(1);

  // Test participants table
  const { data: participantsData, error: participantsError } = await supabase
    .from("participants")
    .select("*")
    .limit(5);

  // Test groups table
  const { data: groupsData, error: groupsError } = await supabase
    .from("groups")
    .select("*")
    .limit(5);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Database Debug</h1>

      <Card>
        <CardHeader>
          <CardTitle>Basic Connectivity Test</CardTitle>
        </CardHeader>
        <CardContent>
          {testError ? (
            <div className="text-red-600">
              <p>Error: {testError.message}</p>
              <p>Code: {testError.code}</p>
              <p>Details: {testError.details}</p>
            </div>
          ) : (
            <div className="text-green-600">
              <p>✅ Connected successfully</p>
              <p>Found {testData?.length || 0} competitions</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Participants Table Test</CardTitle>
        </CardHeader>
        <CardContent>
          {participantsError ? (
            <div className="text-red-600">
              <p>Error: {participantsError.message}</p>
              <p>Code: {participantsError.code}</p>
              <p>Details: {participantsError.details}</p>
              <p>Hint: {participantsError.hint}</p>
            </div>
          ) : (
            <div className="text-green-600">
              <p>✅ Participants table accessible</p>
              <p>Found {participantsData?.length || 0} participants</p>
              {participantsData && participantsData.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">Sample data:</p>
                  <pre className="bg-gray-100 p-2 rounded text-sm">
                    {JSON.stringify(participantsData[0], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Groups Table Test</CardTitle>
        </CardHeader>
        <CardContent>
          {groupsError ? (
            <div className="text-red-600">
              <p>Error: {groupsError.message}</p>
              <p>Code: {groupsError.code}</p>
              <p>Details: {groupsError.details}</p>
            </div>
          ) : (
            <div className="text-green-600">
              <p>✅ Groups table accessible</p>
              <p>Found {groupsData?.length || 0} groups</p>
              {groupsData && groupsData.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">Sample data:</p>
                  <pre className="bg-gray-100 p-2 rounded text-sm">
                    {JSON.stringify(groupsData[0], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
