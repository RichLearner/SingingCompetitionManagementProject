"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  createCompetition,
  updateCompetition,
} from "@/lib/actions/competitions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, Loader2 } from "lucide-react";

interface Competition {
  id?: string;
  name: string;
  name_en: string;
  description: string;
  status: string;
  current_round: number;
  total_rounds: number;
  voting_enabled: boolean;
  display_mode: string;
}

interface CompetitionFormProps {
  locale: string;
  competition?: Competition;
}

export function CompetitionForm({ locale, competition }: CompetitionFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations();
  const [formData, setFormData] = useState<Competition>({
    name: competition?.name || "",
    name_en: competition?.name_en || "",
    description: competition?.description || "",
    status: competition?.status || "draft",
    current_round: competition?.current_round || 1,
    total_rounds: competition?.total_rounds || 2,
    voting_enabled: competition?.voting_enabled || false,
    display_mode: competition?.display_mode || "individual_scores",
    ...competition,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const form = e.target as HTMLFormElement;
      const formDataObj = new FormData(form);

      if (competition?.id) {
        // Update existing competition
        await updateCompetition(competition.id, formDataObj);
      } else {
        // Create new competition
        await createCompetition(formDataObj);
      }

      router.push(`/${locale}/admin/competitions`);
    } catch (error) {
      console.error("Error saving competition:", error);
      // TODO: Show error toast or message
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    field: keyof Competition,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">{t("competition.name")} (中文) *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder={t("competition.namePlaceholder")}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name_en">{t("competition.name")} (English)</Label>
          <Input
            id="name_en"
            name="name_en"
            value={formData.name_en}
            onChange={(e) => handleChange("name_en", e.target.value)}
            placeholder="e.g., 803 Event 2024"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("common.description")}</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder={t("competition.descriptionPlaceholder")}
          rows={3}
        />
      </div>

      <Separator />

      {/* Competition Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t("competition.settings")}</h3>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="status">{t("common.status")}</Label>
            <Select
              name="status"
              value={formData.status}
              onValueChange={(value: string) => handleChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("competition.selectStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{t("competition.draft")}</SelectItem>
                <SelectItem value="active">
                  {t("competition.active")}
                </SelectItem>
                <SelectItem value="completed">
                  {t("competition.completed")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_round">
              {t("competition.currentRound")}
            </Label>
            <Input
              id="current_round"
              name="current_round"
              type="number"
              min="1"
              max={formData.total_rounds}
              value={formData.current_round}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange("current_round", parseInt(e.target.value))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_rounds">{t("competition.totalRounds")}</Label>
            <Input
              id="total_rounds"
              name="total_rounds"
              type="number"
              min="1"
              max="10"
              value={formData.total_rounds}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange("total_rounds", parseInt(e.target.value))
              }
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Voting Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t("voting.settings")}</h3>

        <div className="flex items-center space-x-2">
          <Switch
            id="voting_enabled"
            name="voting_enabled"
            checked={formData.voting_enabled}
            onCheckedChange={(checked: boolean) =>
              handleChange("voting_enabled", checked)
            }
          />
          <Label htmlFor="voting_enabled">
            {t("competition.votingEnabled")}
          </Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="display_mode">{t("competition.displayMode")}</Label>
          <Select
            name="display_mode"
            value={formData.display_mode}
            onValueChange={(value: string) =>
              handleChange("display_mode", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("competition.selectDisplayMode")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual_scores">
                {t("competition.individualScores")}
              </SelectItem>
              <SelectItem value="total_scores">
                {t("competition.totalScores")}
              </SelectItem>
              <SelectItem value="ranking_only">
                {t("competition.rankingOnly")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Default Scoring Factors Preview */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t("scoring.factors")}</h3>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("scoring.standardFactors")}
            </CardTitle>
            <CardDescription>{t("scoring.factorsDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 text-sm">
              <div className="flex justify-between">
                <span>{t("scoring.defaultFactors.creativity")}</span>
                <span className="text-gray-600">
                  {t("scoring.maxPoints", { points: 10 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t("scoring.defaultFactors.teamwork")}</span>
                <span className="text-gray-600">
                  {t("scoring.maxPoints", { points: 10 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t("scoring.defaultFactors.atmosphere")}</span>
                <span className="text-gray-600">
                  {t("scoring.maxPoints", { points: 10 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t("scoring.defaultFactors.performance")}</span>
                <span className="text-gray-600">
                  {t("scoring.maxPoints", { points: 10 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t("scoring.defaultFactors.vocals")}</span>
                <span className="text-gray-600">
                  {t("scoring.maxPoints", { points: 10 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
              {competition ? t("competition.update") : t("competition.create")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
