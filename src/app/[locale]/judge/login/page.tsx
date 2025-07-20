import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Award, Eye, EyeOff } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { JudgeLoginForm } from "@/components/judge/JudgeLoginForm";

export default async function JudgeLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Award className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {t("judge.login")}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t("judge.loginDescription")}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {t("judge.enterCredentials")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <JudgeLoginForm locale={locale} />
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">{t("judge.contactAdmin")}</p>
        </div>
      </div>
    </div>
  );
}
