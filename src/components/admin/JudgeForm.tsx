"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createJudge, updateJudge } from "@/lib/actions/judges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Save,
  Loader2,
  User,
  Mail,
  Phone,
  Award,
  Calendar,
} from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";

interface Judge {
  id?: string;
  competition_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  photo_url?: string | null;
  is_active?: boolean;
  specialization?: string | null;
  experience_years?: number | null;
}

interface JudgeFormProps {
  locale: string;
  competitionId: string;
  judge?: Judge;
}

export function JudgeForm({ locale, competitionId, judge }: JudgeFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations();

  const [formData, setFormData] = useState<Judge>({
    competition_id: competitionId,
    name: judge?.name || "",
    email: judge?.email || "",
    phone: judge?.phone || "",
    photo_url: judge?.photo_url || "",
    is_active: judge?.is_active ?? true,
    specialization: judge?.specialization || "",
    experience_years: judge?.experience_years || null,
    ...judge,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const form = e.target as HTMLFormElement;
      const formDataObj = new FormData(form);

      // Add hidden fields
      formDataObj.append("competition_id", competitionId);
      formDataObj.append("is_active", formData.is_active ? "true" : "false");

      if (judge?.id) {
        // Update existing judge
        await updateJudge(judge.id, formDataObj);
      } else {
        // Create new judge
        await createJudge(formDataObj);
      }

      router.push(`/${locale}/admin/competitions/${competitionId}`);
    } catch (error) {
      console.error("Error saving judge:", error);
      // TODO: Show error toast or message
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    field: keyof Judge,
    value: string | boolean | number | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            {t("judge.basicInfo")}
          </CardTitle>
          <CardDescription>{t("judge.basicInfoDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("judge.name")} *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder={t("judge.namePlaceholder")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("judge.email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder={t("judge.emailPlaceholder")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{t("judge.phone")}</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone || ""}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder={t("judge.phonePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <FileUpload
                label={t("judge.photo")}
                value={formData.photo_url || ""}
                onChange={(url) => handleChange("photo_url", url)}
                placeholder={t("judge.photoPlaceholder")}
                folder="judges"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked: boolean) =>
                handleChange("is_active", checked)
              }
            />
            <Label htmlFor="is_active">{t("judge.active")}</Label>
          </div>
        </CardContent>
      </Card>

      {/* Professional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="mr-2 h-5 w-5" />
            {t("judge.professionalInfo")}
          </CardTitle>
          <CardDescription>
            {t("judge.professionalInfoDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="specialization">{t("judge.specialization")}</Label>
            <Input
              id="specialization"
              name="specialization"
              value={formData.specialization || ""}
              onChange={(e) => handleChange("specialization", e.target.value)}
              placeholder={t("judge.specializationPlaceholder")}
            />
            <p className="text-sm text-gray-600">
              {t("judge.specializationHint")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience_years">
              {t("judge.experienceYears")}
            </Label>
            <Input
              id="experience_years"
              name="experience_years"
              type="number"
              min="0"
              max="50"
              value={formData.experience_years || ""}
              onChange={(e) =>
                handleChange(
                  "experience_years",
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              placeholder={t("judge.experienceYearsPlaceholder")}
            />
            <p className="text-sm text-gray-600">
              {t("judge.experienceYearsHint")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("common.saving")}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {judge ? t("judge.update") : t("judge.create")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
