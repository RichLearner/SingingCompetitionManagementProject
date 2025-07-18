"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { deleteJudge, toggleJudgeStatus } from "@/lib/actions/judges";

interface Judge {
  id: string;
  competition_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  photo_url?: string | null;
  is_active: boolean;
  specialization?: string | null;
  experience_years?: number | null;
}

interface JudgeActionsProps {
  judge: Judge;
  competitionId: string;
  locale: string;
}

export function JudgeActions({
  judge,
  competitionId,
  locale,
}: JudgeActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations();

  const handleToggleStatus = async () => {
    const action = judge.is_active ? "deactivate" : "activate";
    if (!confirm(t(`judge.${action}Confirm`, { name: judge.name }))) {
      return;
    }

    setIsLoading(true);
    try {
      await toggleJudgeStatus(judge.id, competitionId);
      router.refresh();
    } catch (error) {
      console.error("Error toggling judge status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("judge.deleteConfirm", { name: judge.name }))) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteJudge(judge.id, competitionId);
      router.refresh();
    } catch (error) {
      console.error("Error deleting judge:", error);
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
        {/* Toggle Active Status */}
        {judge.is_active ? (
          <DropdownMenuItem onClick={handleToggleStatus}>
            <UserX className="mr-2 h-4 w-4" />
            {t("judge.deactivate")}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={handleToggleStatus}>
            <UserCheck className="mr-2 h-4 w-4" />
            {t("judge.activate")}
          </DropdownMenuItem>
        )}

        {/* Edit Judge */}
        <DropdownMenuItem
          onClick={() =>
            router.push(
              `/${locale}/admin/competitions/${competitionId}/judges/${judge.id}/edit`
            )
          }
        >
          <Edit className="mr-2 h-4 w-4" />
          {t("common.edit")}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Delete Judge */}
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
