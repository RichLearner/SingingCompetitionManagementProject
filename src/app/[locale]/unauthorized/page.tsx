import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Home, Mail } from "lucide-react";
import Link from "next/link";

export default async function UnauthorizedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { userId } = await auth();
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              存取被拒絕
            </CardTitle>
            <CardDescription className="text-gray-600">
              您沒有權限存取管理後台
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>注意:</strong> 只有經過授權的管理員才能存取此系統。
                如果您需要存取權限，請聯絡系統管理員。
              </p>
            </div>

            {userId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>目前登入帳戶:</strong> {userId}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  此帳戶尚未被授權存取管理系統
                </p>
              </div>
            )}

            <div className="flex flex-col space-y-3">
              <Link href={`/${locale}`}>
                <Button className="w-full" variant="default">
                  <Home className="mr-2 h-4 w-4" />
                  返回首頁
                </Button>
              </Link>

              <Button className="w-full" variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                聯絡系統管理員
              </Button>
            </div>

            {userId && (
              <div className="flex justify-center pt-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">登入帳戶:</span>
                  <UserButton />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">803 Event 管理系統 © 2024</p>
        </div>
      </div>
    </div>
  );
}
