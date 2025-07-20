import { judgeLogout } from "@/lib/actions/judge-auth";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await judgeLogout();
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Logout error:", error);
    return new Response("Logout failed", { status: 500 });
  }
}
