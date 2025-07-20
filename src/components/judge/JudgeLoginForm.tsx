"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { judgeLogin } from "@/lib/actions/judge-auth";

interface JudgeLoginFormProps {
  locale: string;
}

export function JudgeLoginForm({ locale }: JudgeLoginFormProps) {
  const router = useRouter();
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const result = await judgeLogin(formData);

      if (result.success) {
        router.push(`/${locale}/judge`);
      } else {
        setError(result.error || t("judge.loginFailed"));
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(t("judge.loginFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">{t("judge.name")}</Label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          placeholder={t("judge.namePlaceholder")}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("judge.password")}</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            placeholder={t("judge.passwordPlaceholder")}
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("judge.loggingIn")}
          </>
        ) : (
          t("judge.login")
        )}
      </Button>
    </form>
  );
}
