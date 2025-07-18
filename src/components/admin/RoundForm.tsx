"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createRound, updateRound } from "@/lib/actions/rounds";
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
import { Save, Loader2, Clock, Users, Vote } from "lucide-react";

interface Round {
  id?: string;
  competition_id: string;
  round_number: number;
  name: string;
  name_en: string;
  description: string;
  elimination_count: number;
  is_public_voting: boolean;
  public_votes_per_user: number;
  status: string;
  start_time: string;
  end_time: string;
}

interface RoundFormProps {
  locale: string;
  competitionId: string;
  round?: Round;
  maxRoundNumber?: number;
}

export function RoundForm({
  locale,
  competitionId,
  round,
  maxRoundNumber = 10,
}: RoundFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations();

  const [formData, setFormData] = useState<Round>({
    competition_id: competitionId,
    round_number: round?.round_number || maxRoundNumber + 1,
    name: round?.name || "",
    name_en: round?.name_en || "",
    description: round?.description || "",
    elimination_count: round?.elimination_count || 0,
    is_public_voting: round?.is_public_voting || false,
    public_votes_per_user: round?.public_votes_per_user || 5,
    status: round?.status || "pending",
    start_time: round?.start_time || "",
    end_time: round?.end_time || "",
    ...round,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const form = e.target as HTMLFormElement;
      const formDataObj = new FormData(form);

      // Add hidden fields
      formDataObj.append("competition_id", competitionId);

      if (round?.id) {
        // Update existing round
        await updateRound(round.id, formDataObj);
      } else {
        // Create new round
        await createRound(formDataObj);
      }

      router.push(`/${locale}/admin/competitions/${competitionId}`);
    } catch (error) {
      console.error("Error saving round:", error);
      // TODO: Show error toast or message
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    field: keyof Round,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Format datetime for input
  const formatDateTime = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().slice(0, 16);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            {t("round.basicInfo")}
          </CardTitle>
          <CardDescription>{t("round.basicInfoDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="round_number">{t("round.roundNumber")} *</Label>
              <Input
                id="round_number"
                name="round_number"
                type="number"
                min="1"
                max="20"
                value={formData.round_number}
                onChange={(e) =>
                  handleChange("round_number", parseInt(e.target.value))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">{t("common.status")}</Label>
              <Select
                name="status"
                value={formData.status}
                onValueChange={(value: string) => handleChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("round.selectStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t("round.pending")}</SelectItem>
                  <SelectItem value="active">{t("round.active")}</SelectItem>
                  <SelectItem value="completed">
                    {t("round.completed")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">{t("round.name")} (中文) *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder={t("round.namePlaceholder")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name_en">{t("round.name")} (English)</Label>
              <Input
                id="name_en"
                name="name_en"
                value={formData.name_en}
                onChange={(e) => handleChange("name_en", e.target.value)}
                placeholder="e.g., Round 1"
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
              placeholder={t("round.descriptionPlaceholder")}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Elimination Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            {t("round.eliminationSettings")}
          </CardTitle>
          <CardDescription>{t("round.eliminationDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="elimination_count">
              {t("round.eliminationCount")}
            </Label>
            <Input
              id="elimination_count"
              name="elimination_count"
              type="number"
              min="0"
              max="50"
              value={formData.elimination_count}
              onChange={(e) =>
                handleChange("elimination_count", parseInt(e.target.value))
              }
              placeholder="0"
            />
            <p className="text-sm text-gray-600">
              {t("round.eliminationCountHint")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Voting Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Vote className="mr-2 h-5 w-5" />
            {t("voting.settings")}
          </CardTitle>
          <CardDescription>{t("voting.settingsDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="is_public_voting"
              name="is_public_voting"
              checked={formData.is_public_voting}
              onCheckedChange={(checked: boolean) =>
                handleChange("is_public_voting", checked)
              }
            />
            <Label htmlFor="is_public_voting">{t("round.publicVoting")}</Label>
          </div>

          {formData.is_public_voting && (
            <div className="space-y-2">
              <Label htmlFor="public_votes_per_user">
                {t("round.votesPerUser")}
              </Label>
              <Input
                id="public_votes_per_user"
                name="public_votes_per_user"
                type="number"
                min="1"
                max="20"
                value={formData.public_votes_per_user}
                onChange={(e) =>
                  handleChange(
                    "public_votes_per_user",
                    parseInt(e.target.value)
                  )
                }
              />
              <p className="text-sm text-gray-600">
                {t("round.votesPerUserHint")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scheduling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            {t("round.scheduling")}
          </CardTitle>
          <CardDescription>{t("round.schedulingDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_time">{t("round.startTime")}</Label>
              <Input
                id="start_time"
                name="start_time"
                type="datetime-local"
                value={formatDateTime(formData.start_time)}
                onChange={(e) => handleChange("start_time", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">{t("round.endTime")}</Label>
              <Input
                id="end_time"
                name="end_time"
                type="datetime-local"
                value={formatDateTime(formData.end_time)}
                onChange={(e) => handleChange("end_time", e.target.value)}
              />
            </div>
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
              {round ? t("round.update") : t("round.create")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
