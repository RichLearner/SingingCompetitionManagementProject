import { getCurrentJudge } from "@/lib/actions/judge-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function JudgeDebugPage() {
  const judge = await getCurrentJudge();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Judge Authentication Debug</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent>
            {judge ? (
              <div className="space-y-2">
                <p>
                  <strong>Status:</strong>{" "}
                  <span className="text-green-600">Authenticated</span>
                </p>
                <p>
                  <strong>Judge ID:</strong> {judge.id}
                </p>
                <p>
                  <strong>Judge Name:</strong> {judge.name}
                </p>
                <p>
                  <strong>Is Active:</strong> {judge.is_active ? "Yes" : "No"}
                </p>
                {judge.competition && (
                  <p>
                    <strong>Competition:</strong>{" "}
                    {JSON.stringify(judge.competition)}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p>
                  <strong>Status:</strong>{" "}
                  <span className="text-red-600">Not Authenticated</span>
                </p>
                <p>No judge session found. Please log in as a judge.</p>
                <Button asChild>
                  <Link href="/zh-TW/judge/login">Go to Judge Login</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {judge && (
          <Card>
            <CardHeader>
              <CardTitle>Test Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full">
                <Link href="/zh-TW/judge">Judge Dashboard</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/zh-TW/judge/competitions/a9d17c60-4d0c-46fe-9c20-03edd0f82593">
                  Test Competition Page
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/zh-TW/judge/competitions/a9d17c60-4d0c-46fe-9c20-03edd0f82593/groups/ed507eb5-b038-4971-bd8b-eb30b9fe5881">
                  Test Group Scoring Page
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
