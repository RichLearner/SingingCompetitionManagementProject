"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  deleteParticipant,
  assignParticipantToGroup,
} from "@/lib/actions/participants";

interface Participant {
  id: string;
  name: string;
  photo_url?: string | null;
  group_id?: string | null;
  group?: {
    id: string;
    name: string;
    is_eliminated: boolean;
  };
}

interface ParticipantActionsProps {
  participant: Participant;
  competitionId: string;
  locale: string;
}

export function ParticipantActions({
  participant,
  competitionId,
  locale,
}: ParticipantActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations();

  const handleDelete = async () => {
    if (!confirm(t("participant.deleteConfirm", { name: participant.name }))) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteParticipant(participant.id, competitionId);
      router.refresh();
    } catch (error) {
      console.error("Error deleting participant:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromGroup = async () => {
    if (
      !confirm(
        t("participant.removeFromGroupConfirm", { name: participant.name })
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      await assignParticipantToGroup(participant.id, null, competitionId);
      router.refresh();
    } catch (error) {
      console.error("Error removing participant from group:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
          <span className="sr-only">{t("common.actions")}</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Edit Participant */}
        <DropdownMenuItem
          onClick={() =>
            router.push(
              `/${locale}/admin/competitions/${competitionId}/participants/${participant.id}/edit`
            )
          }
        >
          <Edit className="mr-2 h-4 w-4" />
          {t("common.edit")}
        </DropdownMenuItem>

        {/* Group Management */}
        {participant.group_id ? (
          <DropdownMenuItem onClick={handleRemoveFromGroup}>
            <Users className="mr-2 h-4 w-4" />
            {t("participant.removeFromGroup")}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() =>
              router.push(
                `/${locale}/admin/competitions/${competitionId}/participants/${participant.id}/assign-group`
              )
            }
          >
            <Users className="mr-2 h-4 w-4" />
            {t("participant.assignToGroup")}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Delete Participant */}
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t("common.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
