"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  UserX,
  UserCheck,
  Edit,
  Trash2,
  Crown,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  deleteGroup,
  eliminateGroup,
  reinstateGroup,
  updateGroupLeader,
} from "@/lib/actions/groups";

interface Group {
  id: string;
  competition_id: string;
  name: string;
  photo_url?: string | null;
  leader_id?: string | null;
  is_eliminated: boolean;
  elimination_round?: number | null;
}

interface GroupActionsProps {
  group: Group;
  locale: string;
  currentRound?: number;
}

export function GroupActions({
  group,
  locale,
  currentRound = 1,
}: GroupActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations();

  const handleEliminate = async () => {
    if (!confirm(t("group.eliminateConfirm", { name: group.name }))) {
      return;
    }

    setIsLoading(true);
    try {
      await eliminateGroup(group.id, group.competition_id, currentRound);
      router.refresh();
    } catch (error) {
      console.error("Error eliminating group:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReinstate = async () => {
    if (!confirm(t("group.reinstateConfirm", { name: group.name }))) {
      return;
    }

    setIsLoading(true);
    try {
      await reinstateGroup(group.id, group.competition_id);
      router.refresh();
    } catch (error) {
      console.error("Error reinstating group:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("group.deleteConfirm", { name: group.name }))) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteGroup(group.id, group.competition_id);
      router.refresh();
    } catch (error) {
      console.error("Error deleting group:", error);
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
        {/* Eliminate/Reinstate Group */}
        {!group.is_eliminated ? (
          <DropdownMenuItem onClick={handleEliminate}>
            <UserX className="mr-2 h-4 w-4" />
            {t("group.eliminate")}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={handleReinstate}>
            <UserCheck className="mr-2 h-4 w-4" />
            {t("group.reinstate")}
          </DropdownMenuItem>
        )}

        {/* Edit Group */}
        <DropdownMenuItem
          onClick={() =>
            router.push(
              `/${locale}/admin/competitions/${group.competition_id}/groups/${group.id}/edit`
            )
          }
        >
          <Edit className="mr-2 h-4 w-4" />
          {t("common.edit")}
        </DropdownMenuItem>

        {/* Manage Participants */}
        <DropdownMenuItem
          onClick={() =>
            router.push(
              `/${locale}/admin/competitions/${group.competition_id}/groups/${group.id}/participants`
            )
          }
        >
          <Crown className="mr-2 h-4 w-4" />
          {t("group.manageParticipants")}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Delete Group */}
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
