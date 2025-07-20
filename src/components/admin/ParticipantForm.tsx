"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  createParticipant,
  updateParticipant,
} from "@/lib/actions/participants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Separator } from "@/components/ui/separator";
import { Save, Loader2, User, Image, Users } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { FileUpload } from "@/components/ui/file-upload";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Participant {
  id?: string;
  name: string;
  photo_url?: string | null;
  group_id?: string | null;
}

interface Group {
  id: string;
  name: string;
  is_eliminated: boolean;
}

interface ParticipantFormProps {
  locale: string;
  competitionId: string;
  participant?: Participant;
}

export function ParticipantForm({
  locale,
  competitionId,
  participant,
}: ParticipantFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const t = useTranslations();

  const [formData, setFormData] = useState<Participant>({
    name: participant?.name || "",
    photo_url: participant?.photo_url || "",
    group_id: participant?.group_id || null,
    ...participant,
  });

  // Fetch available groups for assignment
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data } = await supabase
          .from("groups")
          .select("id, name, is_eliminated")
          .eq("competition_id", competitionId)
          .order("name", { ascending: true });

        if (data) {
          setAvailableGroups(data);
        }
      } catch (error) {
        console.error("Error fetching groups:", error);
      }
    };

    fetchGroups();
  }, [competitionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const form = e.target as HTMLFormElement;
      const formDataObj = new FormData(form);

      // Handle group_id properly - if it's "none", set it to null
      const groupId = formDataObj.get("group_id") as string;
      if (groupId === "none") {
        formDataObj.set("group_id", "");
      }

      if (participant?.id) {
        // Update existing participant
        await updateParticipant(participant.id, formDataObj, competitionId);
      } else {
        // Create new participant
        await createParticipant(formDataObj, competitionId);
      }

      router.push(`/${locale}/admin/competitions/${competitionId}`);
    } catch (error) {
      console.error("Error saving participant:", error);
      // TODO: Show error toast or message
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof Participant, value: string | null) => {
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
            {t("participant.basicInfo")}
          </CardTitle>
          <CardDescription>
            {t("participant.basicInfoDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("participant.name")} *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder={t("participant.namePlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <FileUpload
              label={t("participant.photo")}
              value={formData.photo_url || ""}
              onChange={(url) => handleChange("photo_url", url)}
              placeholder={t("participant.photoPlaceholder")}
              folder="participants"
            />
            <p className="text-sm text-gray-600">
              {t("participant.photoHint")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Group Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            {t("participant.groupAssignment")}
          </CardTitle>
          <CardDescription>{t("participant.groupDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group_id">{t("participant.group")}</Label>
            <Select
              name="group_id"
              value={formData.group_id || "none"}
              onValueChange={(value: string) =>
                handleChange("group_id", value === "none" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("participant.selectGroup")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("participant.noGroup")}</SelectItem>
                {availableGroups.map((group) => (
                  <SelectItem
                    key={group.id}
                    value={group.id}
                    disabled={group.is_eliminated}
                  >
                    {group.name}
                    {group.is_eliminated && (
                      <span className="text-red-500 ml-2">
                        ({t("group.eliminated")})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600">
              {t("participant.groupHint")}
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
              {participant ? t("participant.update") : t("participant.create")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
