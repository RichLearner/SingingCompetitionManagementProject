"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createGroup, updateGroup } from "@/lib/actions/groups";
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
import { Save, Loader2, Users, Image, Crown } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { FileUpload } from "@/components/ui/file-upload";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Group {
  id?: string;
  competition_id: string;
  name: string;
  photo_url?: string | null;
  leader_id?: string | null;
  is_eliminated?: boolean;
  elimination_round?: number | null;
}

interface Participant {
  id: string;
  name: string;
  group_id: string | null;
}

interface GroupFormProps {
  locale: string;
  competitionId: string;
  group?: Group;
}

export function GroupForm({ locale, competitionId, group }: GroupFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [availableParticipants, setAvailableParticipants] = useState<
    Participant[]
  >([]);
  const t = useTranslations();

  const [formData, setFormData] = useState<Group>({
    competition_id: competitionId,
    name: group?.name || "",
    photo_url: group?.photo_url || "",
    leader_id: group?.leader_id || null,
    is_eliminated: group?.is_eliminated || false,
    elimination_round: group?.elimination_round || null,
    ...group,
  });

  // Fetch available participants for leader selection
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const query = supabase
          .from("participants")
          .select("id, name, group_id")
          .eq("groups.competition_id", competitionId);

        // If editing, include participants from current group
        if (group?.id) {
          const { data } = await supabase
            .from("participants")
            .select("id, name, group_id")
            .or(`group_id.is.null,group_id.eq.${group.id}`);

          if (data) {
            setAvailableParticipants(data);
          }
        } else {
          // For new groups, show participants without groups
          const { data } = await supabase
            .from("participants")
            .select("id, name, group_id")
            .is("group_id", null);

          if (data) {
            setAvailableParticipants(data);
          }
        }
      } catch (error) {
        console.error("Error fetching participants:", error);
      }
    };

    fetchParticipants();
  }, [competitionId, group?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const form = e.target as HTMLFormElement;
      const formDataObj = new FormData(form);

      // Add hidden fields
      formDataObj.append("competition_id", competitionId);

      if (group?.id) {
        // Update existing group
        await updateGroup(group.id, formDataObj);
      } else {
        // Create new group
        await createGroup(formDataObj);
      }

      router.push(`/${locale}/admin/competitions/${competitionId}`);
    } catch (error) {
      console.error("Error saving group:", error);
      // TODO: Show error toast or message
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    field: keyof Group,
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
            <Users className="mr-2 h-5 w-5" />
            {t("group.basicInfo")}
          </CardTitle>
          <CardDescription>{t("group.basicInfoDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("group.name")} *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder={t("group.namePlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <FileUpload
              label={t("group.photo")}
              value={formData.photo_url || ""}
              onChange={(url) => handleChange("photo_url", url)}
              placeholder={t("group.photoPlaceholder")}
              folder="groups"
            />
            <p className="text-sm text-gray-600">{t("group.photoHint")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Leader Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Crown className="mr-2 h-5 w-5" />
            {t("group.leaderSelection")}
          </CardTitle>
          <CardDescription>{t("group.leaderDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="leader_id">{t("group.leader")}</Label>
            <Select
              name="leader_id"
              value={formData.leader_id || "none"}
              onValueChange={(value: string) =>
                handleChange("leader_id", value === "none" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("group.selectLeader")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("group.noLeader")}</SelectItem>
                {availableParticipants.map((participant) => (
                  <SelectItem key={participant.id} value={participant.id}>
                    {participant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600">{t("group.leaderHint")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Elimination Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            {t("group.eliminationStatus")}
          </CardTitle>
          <CardDescription>{t("group.eliminationDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="is_eliminated"
              name="is_eliminated"
              checked={formData.is_eliminated}
              onCheckedChange={(checked: boolean) =>
                handleChange("is_eliminated", checked)
              }
            />
            <Label htmlFor="is_eliminated">{t("group.eliminated")}</Label>
          </div>

          {formData.is_eliminated && (
            <div className="space-y-2">
              <Label htmlFor="elimination_round">
                {t("group.eliminationRound")}
              </Label>
              <Input
                id="elimination_round"
                name="elimination_round"
                type="number"
                min="1"
                max="20"
                value={formData.elimination_round || ""}
                onChange={(e) =>
                  handleChange(
                    "elimination_round",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                placeholder={t("group.eliminationRoundPlaceholder")}
              />
              <p className="text-sm text-gray-600">
                {t("group.eliminationRoundHint")}
              </p>
            </div>
          )}
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
              {group ? t("group.update") : t("group.create")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
